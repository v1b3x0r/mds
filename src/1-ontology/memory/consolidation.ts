/**
 * MDS v5 Phase 7 - Memory Consolidation System
 * Merge similar memories, strengthen important ones, forget irrelevant ones
 *
 * Design principles:
 * - Similar memories are consolidated into stronger memories
 * - Ebbinghaus forgetting curve (exponential decay)
 * - Rehearsal strengthens memories
 * - Salience determines retention probability
 */

import type { Memory } from '../../1-ontology'

/**
 * Consolidated memory (merged from multiple similar memories)
 */
export interface ConsolidatedMemory {
  id: string
  originalMemories: string[]   // IDs of merged memories
  type: Memory['type']
  subject: string
  content: any
  salience: number              // Strengthened through consolidation
  firstOccurrence: number       // Timestamp of earliest memory
  lastRehearsal: number         // Last time this was accessed
  rehearsalCount: number        // How many times accessed
  strength: number              // 0..1 (retention probability)
}

/**
 * Memory consolidation configuration
 */
export interface ConsolidationConfig {
  similarityThreshold?: number  // Threshold for considering memories similar (0..1)
  forgettingRate?: number       // Base forgetting rate (0..1)
  rehearsalBonus?: number       // Bonus strength per rehearsal (0..1)
  consolidationInterval?: number // How often to consolidate (ms)
}

/**
 * Memory consolidation system
 * Merges similar memories and manages forgetting
 */
export class MemoryConsolidation {
  private consolidated: Map<string, ConsolidatedMemory> = new Map()
  private config: Required<ConsolidationConfig>
  private lastConsolidation = 0

  constructor(config: ConsolidationConfig = {}) {
    this.config = {
      similarityThreshold: config.similarityThreshold ?? 0.7,
      forgettingRate: config.forgettingRate ?? 0.001,
      rehearsalBonus: config.rehearsalBonus ?? 0.1,
      consolidationInterval: config.consolidationInterval ?? 60000  // 1 minute
    }
  }

  /**
   * Consolidate memories (merge similar ones)
   */
  consolidate(memories: Memory[]): ConsolidatedMemory[] {
    const now = Date.now()
    this.lastConsolidation = now

    // Group memories by type and subject
    const groups = new Map<string, Memory[]>()

    for (const memory of memories) {
      const key = `${memory.type}:${memory.subject}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(memory)
    }

    // Consolidate each group
    for (const [_key, groupMemories] of groups) {
      if (groupMemories.length < 2) continue  // Need at least 2 to consolidate

      // Sort by timestamp
      groupMemories.sort((a, b) => a.timestamp - b.timestamp)

      // Check if already consolidated
      const existing = Array.from(this.consolidated.values()).find(
        cm => cm.type === groupMemories[0].type && cm.subject === groupMemories[0].subject
      )

      if (existing) {
        // Update existing consolidated memory
        existing.salience = Math.min(1, existing.salience + groupMemories.length * 0.05)
        existing.lastRehearsal = now
        existing.rehearsalCount += groupMemories.length
        existing.strength = Math.min(1, existing.strength + groupMemories.length * 0.05)
      } else {
        // Create new consolidated memory
        const avgSalience = groupMemories.reduce((sum, m) => sum + m.salience, 0) / groupMemories.length
        const consolidatedMem: ConsolidatedMemory = {
          id: this.generateId(),
          originalMemories: groupMemories.map((_m, i) => `mem_${i}`),
          type: groupMemories[0].type,
          subject: groupMemories[0].subject,
          content: this.mergeContent(groupMemories.map(m => m.content)),
          salience: Math.min(1, avgSalience * 1.5),  // Boost salience
          firstOccurrence: groupMemories[0].timestamp,
          lastRehearsal: now,
          rehearsalCount: 1,
          strength: avgSalience
        }

        this.consolidated.set(consolidatedMem.id, consolidatedMem)
      }
    }

    return Array.from(this.consolidated.values())
  }

  /**
   * Apply forgetting curve (Ebbinghaus)
   * Strength decays exponentially over time
   */
  applyForgetting(dt: number): void {
    const decayFactor = Math.exp(-this.config.forgettingRate * dt)

    for (const memory of this.consolidated.values()) {
      const timeSinceRehearsal = Date.now() - memory.lastRehearsal
      const timeFactor = timeSinceRehearsal / 86400000  // Days since rehearsal

      // Exponential decay (Ebbinghaus curve)
      memory.strength *= decayFactor * Math.exp(-timeFactor / 7)  // Half-life ~7 days

      // Increase strength for high salience memories
      if (memory.salience > 0.8) {
        memory.strength = Math.min(1, memory.strength + 0.001)
      }

      // Remove if too weak
      if (memory.strength < 0.05) {
        this.consolidated.delete(memory.id)
      }
    }
  }

  /**
   * Rehearse a memory (access it, strengthening it)
   */
  rehearse(subject: string): boolean {
    const memory = Array.from(this.consolidated.values()).find(m => m.subject === subject)

    if (!memory) return false

    memory.lastRehearsal = Date.now()
    memory.rehearsalCount++
    memory.strength = Math.min(1, memory.strength + this.config.rehearsalBonus)

    return true
  }

  /**
   * Get strongest memories (sorted by strength)
   */
  getStrongestMemories(limit: number = 10): ConsolidatedMemory[] {
    return Array.from(this.consolidated.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit)
  }

  /**
   * Get memory by subject
   */
  getMemory(subject: string): ConsolidatedMemory | null {
    return Array.from(this.consolidated.values()).find(m => m.subject === subject) || null
  }

  /**
   * Get all consolidated memories
   */
  getAllMemories(): ConsolidatedMemory[] {
    return Array.from(this.consolidated.values())
  }

  /**
   * Check if consolidation is needed
   */
  shouldConsolidate(currentTime: number): boolean {
    return (currentTime - this.lastConsolidation) >= this.config.consolidationInterval
  }

  /**
   * Merge content from multiple memories
   */
  private mergeContent(contents: any[]): any {
    if (contents.length === 0) return {}

    // If all are objects, merge them
    if (contents.every(c => typeof c === 'object' && c !== null)) {
      return Object.assign({}, ...contents)
    }

    // If all are arrays, concatenate
    if (contents.every(c => Array.isArray(c))) {
      return contents.flat()
    }

    // Otherwise, return most recent
    return contents[contents.length - 1]
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `consol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clear all consolidated memories
   */
  clear(): void {
    this.consolidated.clear()
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      consolidated: Array.from(this.consolidated.entries()),
      lastConsolidation: this.lastConsolidation
    }
  }

  /**
   * Restore from JSON
   */
  static fromJSON(data: ReturnType<MemoryConsolidation['toJSON']>): MemoryConsolidation {
    const system = new MemoryConsolidation()
    system.consolidated = new Map(data.consolidated)
    system.lastConsolidation = data.lastConsolidation
    return system
  }
}

/**
 * Helper: Calculate memory similarity (simple content-based)
 */
export function memorySimilarity(memA: Memory, memB: Memory): number {
  // Same type and subject = high similarity
  if (memA.type === memB.type && memA.subject === memB.subject) {
    return 0.9
  }

  // Same subject = medium similarity
  if (memA.subject === memB.subject) {
    return 0.6
  }

  // Same type = low similarity
  if (memA.type === memB.type) {
    return 0.3
  }

  return 0.1
}
