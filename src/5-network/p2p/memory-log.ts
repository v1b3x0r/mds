/**
 * MDS v5.5 - Memory Log (CRDT)
 * Distributed memory with conflict-free replicated data types
 *
 * Design principles:
 * - Event-sourced (append-only log)
 * - Vector clocks for causality tracking
 * - Deterministic merge (no conflicts)
 * - Eventual consistency (realistic imperfect recall)
 */

import type { Memory, MemoryType } from '@mds/1-ontology/memory'

/**
 * Vector clock for causality tracking
 * Maps entity ID → logical timestamp
 */
export type VectorClock = Map<string, number>

/**
 * Memory event with causality metadata
 */
export interface MemoryEvent {
  id: string              // Unique event ID (entityId + timestamp)
  entityId: string        // Who created this memory
  timestamp: number       // Physical time (seconds since entity spawn)
  clock: VectorClock      // Logical time (causality)
  memory: Memory          // Actual memory data
}

/**
 * Merge conflict result
 */
export interface MergeResult {
  added: number           // New events added
  conflicts: number       // Conflicting events (should be 0 with CRDT)
  totalEvents: number     // Total events after merge
}

/**
 * Memory Log - CRDT-based distributed memory
 *
 * @example
 * const logA = new MemoryLog('entity-a')
 * const logB = new MemoryLog('entity-b')
 *
 * // Entity A remembers something
 * logA.append({
 *   timestamp: 5.2,
 *   type: 'interaction',
 *   subject: 'entity-b',
 *   content: { distance: 50 },
 *   salience: 0.8
 * })
 *
 * // Merge logs (A shares memory with B)
 * const result = logB.merge(logA)
 * console.log(`Added ${result.added} memories`)
 */
export class MemoryLog {
  private entityId: string
  private events: Map<string, MemoryEvent> = new Map()
  private vectorClock: VectorClock = new Map()

  constructor(entityId: string) {
    this.entityId = entityId
    this.vectorClock.set(entityId, 0)
  }

  /**
   * Append new memory event (local operation)
   *
   * @param memory - Memory to add
   * @returns Event ID and vector clock
   */
  append(memory: Memory): { id: string; clock: VectorClock } {
    // Increment local clock
    const currentClock = this.vectorClock.get(this.entityId) ?? 0
    this.vectorClock.set(this.entityId, currentClock + 1)

    // Generate event ID (entityId + logical time)
    const eventId = `${this.entityId}:${currentClock + 1}`

    // Clone vector clock (snapshot causality)
    const clockSnapshot = new Map(this.vectorClock)

    // Create event
    const event: MemoryEvent = {
      id: eventId,
      entityId: this.entityId,
      timestamp: memory.timestamp,
      clock: clockSnapshot,
      memory
    }

    this.events.set(eventId, event)

    return { id: eventId, clock: clockSnapshot }
  }

  /**
   * Merge another log into this one (CRDT operation)
   *
   * @param otherLog - Log to merge from
   * @returns Merge statistics
   */
  merge(otherLog: MemoryLog): MergeResult {
    let added = 0

    // Iterate through other log's events
    for (const [eventId, event] of otherLog.events) {
      // If we don't have this event, add it
      if (!this.events.has(eventId)) {
        this.events.set(eventId, event)
        added++
      }
      // If we have it, CRDT guarantees it's identical (skip)
    }

    // Update vector clock (take max of each component)
    for (const [entityId, logicalTime] of otherLog.vectorClock) {
      const ourTime = this.vectorClock.get(entityId) ?? 0
      this.vectorClock.set(entityId, Math.max(ourTime, logicalTime))
    }

    return {
      added,
      conflicts: 0,  // CRDT = no conflicts
      totalEvents: this.events.size
    }
  }

  /**
   * Get all memories (for entity.memory.recall() compatibility)
   *
   * @param filter - Optional filter
   * @returns Array of memories
   */
  getMemories(filter?: {
    type?: MemoryType
    subject?: string
    minSalience?: number
    since?: number
  }): Memory[] {
    const memories: Memory[] = []

    for (const event of this.events.values()) {
      const mem = event.memory

      // Apply filters
      if (filter) {
        if (filter.type && mem.type !== filter.type) continue
        if (filter.subject && mem.subject !== filter.subject) continue
        if (filter.minSalience && mem.salience < filter.minSalience) continue
        if (filter.since !== undefined && mem.timestamp < filter.since) continue
      }

      memories.push(mem)
    }

    // Sort by timestamp (newest first)
    return memories.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get event count
   */
  size(): number {
    return this.events.size
  }

  /**
   * Get vector clock (for debugging)
   */
  getClock(): VectorClock {
    return new Map(this.vectorClock)
  }

  /**
   * Check if this log has seen an event from another entity
   *
   * @param entityId - Entity to check
   * @param logicalTime - Logical timestamp
   * @returns true if we've seen events up to that time
   */
  hasSeen(entityId: string, logicalTime: number): boolean {
    const ourTime = this.vectorClock.get(entityId) ?? 0
    return ourTime >= logicalTime
  }

  /**
   * Get causal history (which entities have influenced this log)
   *
   * @returns Array of [entityId, lastSeenTime] pairs
   */
  getCausalHistory(): Array<[string, number]> {
    return Array.from(this.vectorClock.entries())
  }

  /**
   * Serialize to JSON (for persistence)
   */
  toJSON(): any {
    return {
      entityId: this.entityId,
      events: Array.from(this.events.entries()).map(([id, event]) => ({
        id,
        entityId: event.entityId,
        timestamp: event.timestamp,
        clock: Array.from(event.clock.entries()),
        memory: event.memory
      })),
      vectorClock: Array.from(this.vectorClock.entries())
    }
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): MemoryLog {
    const log = new MemoryLog(data.entityId)

    // Restore events
    for (const eventData of data.events) {
      const event: MemoryEvent = {
        id: eventData.id,
        entityId: eventData.entityId,
        timestamp: eventData.timestamp,
        clock: new Map(eventData.clock),
        memory: eventData.memory
      }
      log.events.set(event.id, event)
    }

    // Restore vector clock
    log.vectorClock = new Map(data.vectorClock)

    return log
  }

  /**
   * Prune old events (garbage collection)
   *
   * @param maxAge - Keep only events within this age (seconds)
   * @param currentTime - Current entity age
   * @returns Number of events pruned
   */
  prune(maxAge: number, currentTime: number): number {
    const toRemove: string[] = []

    for (const [id, event] of this.events) {
      const age = currentTime - event.memory.timestamp
      if (age > maxAge) {
        toRemove.push(id)
      }
    }

    for (const id of toRemove) {
      this.events.delete(id)
    }

    return toRemove.length
  }

  /**
   * Get memory strength for a subject (sum of salience)
   *
   * @param subject - Entity ID or "self" or "world"
   * @returns Total salience
   */
  getStrength(subject: string): number {
    let total = 0

    for (const event of this.events.values()) {
      if (event.memory.subject === subject) {
        total += event.memory.salience
      }
    }

    return total
  }
}

/**
 * Create memory log for entity
 *
 * @param entityId - Entity UUID
 * @returns New MemoryLog instance
 */
export function createMemoryLog(entityId: string): MemoryLog {
  return new MemoryLog(entityId)
}

/**
 * Merge multiple logs (for collective memory)
 *
 * @param logs - Array of memory logs
 * @returns Merged log
 */
export function mergeLogs(logs: MemoryLog[]): MemoryLog {
  if (logs.length === 0) {
    throw new Error('Cannot merge empty log array')
  }

  // Start with first log
  const merged = new MemoryLog(logs[0]['entityId'])

  // Merge all logs
  for (const log of logs) {
    merged.merge(log)
  }

  return merged
}
