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
}
