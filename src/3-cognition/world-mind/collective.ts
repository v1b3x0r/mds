/**
 * MDS v5 Phase 8 - Collective Intelligence
 * World-level emergent behaviors and collective consciousness
 *
 * Design principles:
 * - World-level statistics (aggregated from all entities)
 * - Emergent patterns (clustering, flocking, synchronization)
 * - Collective emotions (world mood)
 * - Global memory (shared knowledge)
 */

import type { Entity } from '@mds/0-foundation/entity'
import type { EmotionalState } from '@mds/1-ontology'

/**
 * World statistics
 */
export interface WorldStats {
  entityCount: number
  avgAge: number
  avgEnergy: number
  avgEntropy: number

  // Ontology stats
  totalMemories?: number
  avgEmotionalValence?: number
  avgEmotionalArousal?: number

  // Physics stats
  avgTemperature?: number
  avgVelocity?: number

  // Cognitive stats
  totalExperiences?: number
  avgSkillProficiency?: number

  // Communication stats
  totalMessages?: number
  activeDialogues?: number
}

/**
 * Emotional climate event (Task 1.4 - Phase 1)
 * Records collective emotional shifts (death, birth, discovery)
 */
export interface EmotionalClimateEvent {
  type: 'death' | 'birth' | 'suffering' | 'joy' | 'discovery'
  timestamp: number        // World time
  intensity: number        // 0..1, how strong the event was
  entityId?: string        // Entity involved (if applicable)
  metadata?: any           // Additional context
}

/**
 * Emotional climate state (Task 1.4 - Phase 1)
 * World's collective emotional atmosphere
 */
export interface EmotionalClimate {
  grief: number            // 0..1, accumulated loss/death
  vitality: number         // 0..1, life force (births, growth)
  tension: number          // 0..1, collective stress/urgency
  harmony: number          // 0..1, collective peace/contentment

  // Recent events that shaped the climate
  recentEvents: EmotionalClimateEvent[]

  // Decay rates (how quickly emotions fade)
  decayRate: number        // Default: 0.01 per second
}

/**
 * Emergent pattern types
 */
export type EmergentPattern =
  | 'clustering'      // Entities grouping together
  | 'dispersion'      // Entities spreading apart
  | 'synchronization' // Entities moving in sync
  | 'oscillation'     // Back-and-forth movement
  | 'rotation'        // Circular movement
  | 'stillness'       // Minimal movement

/**
 * Pattern detection result
 */
export interface PatternDetection {
  pattern: EmergentPattern
  strength: number    // 0..1
  entities: string[]  // IDs involved
}

/**
 * Collective intelligence system
 */
export class CollectiveIntelligence {
  private patterns: PatternDetection[] = []

  /**
   * Calculate world statistics
   */
  static calculateStats(entities: Entity[]): WorldStats {
    if (entities.length === 0) {
      return {
        entityCount: 0,
        avgAge: 0,
        avgEnergy: 0,
        avgEntropy: 0
      }
    }

    const n = entities.length

    // Basic stats
    const totalAge = entities.reduce((sum, e) => sum + e.age, 0)
    const totalEnergy = entities.reduce((sum, e) => sum + e.energy, 0)
    const totalEntropy = entities.reduce((sum, e) => sum + e.entropy, 0)

    const stats: WorldStats = {
      entityCount: n,
      avgAge: totalAge / n,
      avgEnergy: totalEnergy / n,
      avgEntropy: totalEntropy / n
    }

    // Ontology stats
    const withMemory = entities.filter(e => e.memory)
    if (withMemory.length > 0) {
      stats.totalMemories = withMemory.reduce((sum, e) => sum + (e.memory?.count() ?? 0), 0)
    }

    const withEmotion = entities.filter(e => e.emotion)
    if (withEmotion.length > 0) {
      stats.avgEmotionalValence = withEmotion.reduce((sum, e) => sum + (e.emotion?.valence ?? 0), 0) / withEmotion.length
      stats.avgEmotionalArousal = withEmotion.reduce((sum, e) => sum + (e.emotion?.arousal ?? 0), 0) / withEmotion.length
    }

    // Physics stats
    const withTemp = entities.filter(e => e.temperature !== undefined)
    if (withTemp.length > 0) {
      stats.avgTemperature = withTemp.reduce((sum, e) => sum + (e.temperature ?? 0), 0) / withTemp.length
    }

    const totalVelocity = entities.reduce((sum, e) => sum + Math.sqrt(e.vx ** 2 + e.vy ** 2), 0)
    stats.avgVelocity = totalVelocity / n

    // Cognitive stats
    const withLearning = entities.filter(e => e.learning)
    if (withLearning.length > 0) {
      stats.totalExperiences = withLearning.reduce((sum, e) => sum + (e.learning?.getStats().totalExperiences ?? 0), 0)
    }

    const withSkills = entities.filter(e => e.skills)
    if (withSkills.length > 0) {
      const allSkills = withSkills.flatMap(e => e.skills?.getAllSkills() ?? [])
      if (allSkills.length > 0) {
        stats.avgSkillProficiency = allSkills.reduce((sum, s) => sum + s.proficiency, 0) / allSkills.length
      }
    }

    // Communication stats
    const withInbox = entities.filter(e => e.inbox)
    if (withInbox.length > 0) {
      stats.totalMessages = withInbox.reduce((sum, e) => sum + (e.inbox?.size() ?? 0), 0)
    }

    return stats
  }

  /**
   * Detect clustering pattern
   */
  private static detectClustering(entities: Entity[]): PatternDetection | null {
    if (entities.length < 3) return null

    // Calculate average pairwise distance
    let totalDist = 0
    let count = 0

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const dx = entities[i].x - entities[j].x
        const dy = entities[i].y - entities[j].y
        totalDist += Math.sqrt(dx * dx + dy * dy)
        count++
      }
    }

    const avgDist = totalDist / count

    // Clustering = low average distance
    const strength = Math.max(0, 1 - avgDist / 500)  // Normalize by max distance

    if (strength > 0.5) {
      return {
        pattern: 'clustering',
        strength,
        entities: entities.map(e => e.id)
      }
    }

    return null
  }

  /**
   * Detect synchronization pattern
   */
  private static detectSynchronization(entities: Entity[]): PatternDetection | null {
    if (entities.length < 2) return null

    // Calculate direction variance
    const directions = entities.map(e => Math.atan2(e.vy, e.vx))
    const avgDir = directions.reduce((sum, d) => sum + d, 0) / directions.length

    const variance = directions.reduce((sum, d) => {
      const diff = d - avgDir
      return sum + diff * diff
    }, 0) / directions.length

    // Synchronization = low variance in direction
    const strength = Math.max(0, 1 - Math.sqrt(variance))

    if (strength > 0.6) {
      return {
        pattern: 'synchronization',
        strength,
        entities: entities.map(e => e.id)
      }
    }

    return null
  }

  /**
   * Detect all patterns
   */
  static detectPatterns(entities: Entity[]): PatternDetection[] {
    const patterns: PatternDetection[] = []

    // Clustering
    const clustering = CollectiveIntelligence.detectClustering(entities)
    if (clustering) patterns.push(clustering)

    // Synchronization
    const sync = CollectiveIntelligence.detectSynchronization(entities)
    if (sync) patterns.push(sync)

    // Stillness (low avg velocity)
    const avgVel = entities.reduce((sum, e) => sum + Math.sqrt(e.vx ** 2 + e.vy ** 2), 0) / entities.length
    if (avgVel < 5) {
      patterns.push({
        pattern: 'stillness',
        strength: 1 - avgVel / 5,
        entities: entities.map(e => e.id)
      })
    }

    return patterns
  }

  /**
   * Get detected patterns
   */
  getPatterns(): PatternDetection[] {
    return this.patterns
  }

  /**
   * Calculate collective emotion (world mood)
   */
  static calculateCollectiveEmotion(entities: Entity[]): EmotionalState | null {
    const withEmotion = entities.filter(e => e.emotion)
    if (withEmotion.length === 0) return null

    const avgValence = withEmotion.reduce((sum, e) => sum + (e.emotion?.valence ?? 0), 0) / withEmotion.length
    const avgArousal = withEmotion.reduce((sum, e) => sum + (e.emotion?.arousal ?? 0), 0) / withEmotion.length
    const avgDominance = withEmotion.reduce((sum, e) => sum + (e.emotion?.dominance ?? 0), 0) / withEmotion.length

    return {
      valence: avgValence,
      arousal: avgArousal,
      dominance: avgDominance
    }
  }

  // ========================================
  // Task 1.4: Emotional Climate System
  // ========================================

  /**
   * Initialize emotional climate (neutral state)
   */
  static createEmotionalClimate(): EmotionalClimate {
    return {
      grief: 0,
      vitality: 0.5,  // Start with moderate vitality
      tension: 0,
      harmony: 0.5,   // Start with moderate harmony
      recentEvents: [],
      decayRate: 0.01  // 1% decay per second
    }
  }

  /**
   * Record a death event in the emotional climate
   *
   * @param climate - Current climate state
   * @param entityId - ID of entity that died
   * @param intensity - How significant the death was (0..1)
   * @param worldTime - Current world time
   *
   * @example
   * // Entity dies
   * CollectiveIntelligence.recordDeath(world.emotionalClimate, entity.id, 0.8, world.worldTime)
   * // → Increases grief, decreases vitality
   */
  static recordDeath(
    climate: EmotionalClimate,
    entityId: string,
    intensity: number,
    worldTime: number
  ): void {
    // Add death event
    climate.recentEvents.push({
      type: 'death',
      timestamp: worldTime,
      intensity,
      entityId
    })

    // Increase grief
    climate.grief = Math.min(1, climate.grief + intensity * 0.5)

    // Decrease vitality
    climate.vitality = Math.max(0, climate.vitality - intensity * 0.3)

    // Increase tension (death creates unease)
    climate.tension = Math.min(1, climate.tension + intensity * 0.2)

    // Decrease harmony
    climate.harmony = Math.max(0, climate.harmony - intensity * 0.2)

    // Keep only recent events (last 10 minutes = 600 seconds)
    const cutoff = worldTime - 600
    climate.recentEvents = climate.recentEvents.filter(e => e.timestamp > cutoff)
  }

  /**
   * Record a birth event in the emotional climate
   *
   * @param climate - Current climate state
   * @param entityId - ID of entity that was born
   * @param intensity - How significant the birth was (0..1)
   * @param worldTime - Current world time
   */
  static recordBirth(
    climate: EmotionalClimate,
    entityId: string,
    intensity: number,
    worldTime: number
  ): void {
    climate.recentEvents.push({
      type: 'birth',
      timestamp: worldTime,
      intensity,
      entityId
    })

    // Increase vitality
    climate.vitality = Math.min(1, climate.vitality + intensity * 0.4)

    // Decrease grief (new life counterbalances loss)
    climate.grief = Math.max(0, climate.grief - intensity * 0.2)

    // Increase harmony
    climate.harmony = Math.min(1, climate.harmony + intensity * 0.3)

    // Keep only recent events
    const cutoff = worldTime - 600
    climate.recentEvents = climate.recentEvents.filter(e => e.timestamp > cutoff)
  }

  /**
   * Record a suffering event (e.g., critical needs, pain)
   *
   * @param climate - Current climate state
   * @param intensity - How much suffering (0..1)
   * @param worldTime - Current world time
   */
  static recordSuffering(
    climate: EmotionalClimate,
    intensity: number,
    worldTime: number
  ): void {
    climate.recentEvents.push({
      type: 'suffering',
      timestamp: worldTime,
      intensity
    })

    // Increase tension
    climate.tension = Math.min(1, climate.tension + intensity * 0.3)

    // Decrease harmony
    climate.harmony = Math.max(0, climate.harmony - intensity * 0.2)

    // Slight increase in grief
    climate.grief = Math.min(1, climate.grief + intensity * 0.1)

    // Keep only recent events
    const cutoff = worldTime - 600
    climate.recentEvents = climate.recentEvents.filter(e => e.timestamp > cutoff)
  }

  /**
   * Update emotional climate (decay over time)
   *
   * @param climate - Current climate state
   * @param dt - Delta time in seconds
   *
   * @example
   * // In world tick loop
   * CollectiveIntelligence.updateEmotionalClimate(world.emotionalClimate, dt)
   */
  static updateEmotionalClimate(climate: EmotionalClimate, dt: number): void {
    const decay = climate.decayRate * dt

    // Decay negative emotions toward 0
    climate.grief = Math.max(0, climate.grief - decay)
    climate.tension = Math.max(0, climate.tension - decay)

    // Restore positive emotions toward baseline (0.5)
    if (climate.vitality < 0.5) {
      climate.vitality = Math.min(0.5, climate.vitality + decay * 0.5)
    }

    if (climate.harmony < 0.5) {
      climate.harmony = Math.min(0.5, climate.harmony + decay * 0.5)
    }
  }

  /**
   * Calculate emotional climate influence on entities
   * Returns PAD delta that should be applied to entities
   *
   * @param climate - Current climate state
   * @returns Emotional delta (valence, arousal, dominance)
   *
   * @example
   * // Apply climate influence to all entities
   * const delta = CollectiveIntelligence.getClimateInfluence(world.emotionalClimate)
   * for (const entity of entities) {
   *   entity.feel(delta)
   * }
   */
  static getClimateInfluence(climate: EmotionalClimate): {
    valence: number
    arousal: number
    dominance: number
  } {
    // Climate affects entities subtly (scale by 0.1 for gentle influence)
    return {
      // Grief and harmony affect valence
      valence: (climate.harmony - climate.grief) * 0.1,

      // Tension and vitality affect arousal
      arousal: (climate.tension + climate.vitality * 0.5 - 0.5) * 0.1,

      // Vitality affects dominance
      dominance: (climate.vitality - 0.5) * 0.05
    }
  }

  /**
   * Get human-readable climate description
   *
   * @param climate - Current climate state
   * @returns Description string
   *
   * @example
   * const desc = CollectiveIntelligence.describeClimate(world.emotionalClimate)
   * // → "Grieving and tense" or "Vital and harmonious"
   */
  static describeClimate(climate: EmotionalClimate): string {
    const descriptors: string[] = []

    if (climate.grief > 0.6) descriptors.push('grieving')
    else if (climate.grief > 0.3) descriptors.push('melancholic')

    if (climate.vitality > 0.7) descriptors.push('vital')
    else if (climate.vitality < 0.3) descriptors.push('depleted')

    if (climate.tension > 0.6) descriptors.push('tense')
    else if (climate.tension < 0.2) descriptors.push('calm')

    if (climate.harmony > 0.7) descriptors.push('harmonious')
    else if (climate.harmony < 0.3) descriptors.push('discordant')

    if (descriptors.length === 0) return 'neutral'

    return descriptors.join(' and ')
  }
}
