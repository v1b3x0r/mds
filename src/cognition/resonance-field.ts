/**
 * MDS v5.5 - Resonance Field System
 * Cognitive signal propagation through entity networks
 *
 * Design principles:
 * - Field-based evolution (not message passing)
 * - Understanding propagates like energy
 * - Strength decays with network distance
 * - Three signal types: memory, emotion, pattern
 */

import type { Entity } from '../core/entity'
import type { Memory } from '../ontology/memory'
import type { EmotionalState } from '../ontology/emotion'
import { resonate } from '../ontology/emotion'

/**
 * Types of cognitive signals that can propagate
 */
export type SignalType = 'memory' | 'emotion' | 'pattern'

/**
 * Cognitive signal payload
 */
export interface CognitiveSignal {
  type: SignalType
  source: string          // Entity ID
  timestamp: number       // When signal originated
  payload: any            // Memory | EmotionalState | Pattern
  strength: number        // Initial strength (0..1)
}

/**
 * Propagation result (for debugging/visualization)
 */
export interface PropagationResult {
  reached: string[]       // Entity IDs that received signal
  hops: number           // Maximum distance traveled
  finalStrength: number  // Weakest signal delivered
}

/**
 * Resonance Field - Propagates cognitive signals through network
 *
 * @example
 * const field = new ResonanceField({ decayRate: 0.2 })
 *
 * // Entity A remembers something
 * const signal: CognitiveSignal = {
 *   type: 'memory',
 *   source: entityA.id,
 *   timestamp: world.time,
 *   payload: memory,
 *   strength: 0.9
 * }
 *
 * // Propagate to connected entities
 * field.propagate(signal, entityA, world.entities)
 */
export class ResonanceField {
  private decayRate: number       // Strength loss per hop (0..1)
  private minStrength: number     // Don't propagate below this threshold

  constructor(options: {
    decayRate?: number
    minStrength?: number
  } = {}) {
    this.decayRate = options.decayRate ?? 0.2
    this.minStrength = options.minStrength ?? 0.1
  }

  /**
   * Propagate signal through cognitive network
   *
   * @param signal - Signal to propagate
   * @param source - Origin entity
   * @param entities - All entities in world
   * @returns Propagation statistics
   */
  propagate(
    signal: CognitiveSignal,
    source: Entity,
    entities: Entity[]
  ): PropagationResult {
    const visited = new Set<string>([source.id])
    const queue: Array<{ entity: Entity; strength: number; depth: number }> = []

    // Start with directly connected entities
    if (source.cognitiveLinks) {
      for (const [targetId, link] of source.cognitiveLinks) {
        const target = entities.find(e => e.id === targetId)
        if (target) {
          const strength = signal.strength * link.strength * (1 - this.decayRate)
          if (strength >= this.minStrength) {
            queue.push({ entity: target, strength, depth: 1 })
          }
        }
      }
    }

    let maxDepth = 0
    let minStrength = signal.strength

    // Breadth-first propagation
    while (queue.length > 0) {
      const { entity, strength, depth } = queue.shift()!

      if (visited.has(entity.id)) continue
      visited.add(entity.id)

      maxDepth = Math.max(maxDepth, depth)
      minStrength = Math.min(minStrength, strength)

      // Deliver signal to entity
      this.deliverSignal(signal, entity, strength)

      // Continue propagation to neighbors
      if (entity.cognitiveLinks) {
        for (const [targetId, link] of entity.cognitiveLinks) {
          if (visited.has(targetId)) continue

          const target = entities.find(e => e.id === targetId)
          if (target) {
            const newStrength = strength * link.strength * (1 - this.decayRate)
            if (newStrength >= this.minStrength) {
              queue.push({ entity: target, strength: newStrength, depth: depth + 1 })
            }
          }
        }
      }
    }

    return {
      reached: Array.from(visited).filter(id => id !== source.id),
      hops: maxDepth,
      finalStrength: minStrength
    }
  }

  /**
   * Deliver signal to entity (modifies entity state)
   */
  private deliverSignal(signal: CognitiveSignal, entity: Entity, strength: number) {
    switch (signal.type) {
      case 'memory':
        this.deliverMemorySignal(signal, entity, strength)
        break
      case 'emotion':
        this.deliverEmotionSignal(signal, entity, strength)
        break
      case 'pattern':
        this.deliverPatternSignal(signal, entity, strength)
        break
    }
  }

  /**
   * Deliver memory signal (adds faded memory to target)
   */
  private deliverMemorySignal(signal: CognitiveSignal, entity: Entity, strength: number) {
    if (!entity.memory) return

    const sourceMemory = signal.payload as Memory

    // Create indirect memory (remembered from another entity)
    entity.memory.add({
      timestamp: entity.age,
      type: 'observation',
      subject: signal.source,
      content: {
        indirect: true,
        originalMemory: sourceMemory,
        receivedStrength: strength
      },
      salience: sourceMemory.salience * strength
    })
  }

  /**
   * Deliver emotion signal (triggers resonance)
   */
  private deliverEmotionSignal(signal: CognitiveSignal, entity: Entity, strength: number) {
    if (!entity.emotion) return

    const sourceEmotion = signal.payload as EmotionalState

    // Apply emotional resonance (v5.5: uses resonate() from emotion.ts)
    resonate(entity.emotion, sourceEmotion, strength)
  }

  /**
   * Deliver pattern signal (updates learning system)
   */
  private deliverPatternSignal(signal: CognitiveSignal, entity: Entity, strength: number) {
    if (!entity.learning) return

    // Pattern payload contains action -> outcome data
    const pattern = signal.payload as { action: string; outcome: number }

    // Apply federated learning: external pattern influences local Q-values
    // Note: This requires extending LearningSystem with pattern injection
    // For now, we just store it as a memory
    if (entity.memory) {
      entity.memory.add({
        timestamp: entity.age,
        type: 'observation',
        subject: signal.source,
        content: {
          type: 'pattern',
          action: pattern.action,
          outcome: pattern.outcome,
          strength
        },
        salience: strength
      })
    }
  }
}
