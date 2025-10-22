/**
 * MDS v5.2 Phase 2.5 - Relationship Decay System
 * Advanced time-based relationship deterioration
 *
 * Design principles:
 * - Relationships naturally decay without interaction (forgetting)
 * - Different decay curves for different relationship types
 * - Configurable thresholds for automatic pruning
 * - Reinforcement delays decay (fresh interactions slow forgetting)
 * - Batch processing for efficient decay of multiple relationships
 */

import type { Relationship, RelationshipEntry } from './relationship'

/**
 * Decay curve types
 */
export type DecayCurve =
  | 'linear'        // Constant decay rate
  | 'exponential'   // Faster decay over time
  | 'logarithmic'   // Slower decay over time (longer lasting)
  | 'stepped'       // Sudden drops at time intervals

/**
 * Decay configuration
 */
export interface DecayConfig {
  curve?: DecayCurve              // Decay curve type (default: 'linear')
  baseRate?: number               // Base decay rate (default: 0.001 = 0.1% per second)
  trustDecayMultiplier?: number   // Trust decays slower (default: 0.5)
  minThreshold?: number           // Auto-prune below this (default: 0.05)
  gracePeriod?: number            // No decay for N seconds after interaction (default: 60)
  maxDecayPerTick?: number        // Cap decay per tick (default: 0.1)
}

/**
 * Decay statistics
 */
export interface DecayStats {
  totalDecayed: number      // Number of relationships that decayed
  totalPruned: number       // Number of relationships pruned
  avgDecayAmount: number    // Average decay amount
  lastDecayTime: number     // Last time decay was applied
}

/**
 * Relationship Decay Manager
 * Handles time-based relationship deterioration
 */
export class RelationshipDecayManager {
  private config: Required<DecayConfig>
  private stats: DecayStats

  constructor(config: DecayConfig = {}) {
    this.config = {
      curve: config.curve ?? 'linear',
      baseRate: config.baseRate ?? 0.001,
      trustDecayMultiplier: config.trustDecayMultiplier ?? 0.5,
      minThreshold: config.minThreshold ?? 0.05,
      gracePeriod: config.gracePeriod ?? 60,
      maxDecayPerTick: config.maxDecayPerTick ?? 0.1
    }

    this.stats = {
      totalDecayed: 0,
      totalPruned: 0,
      avgDecayAmount: 0,
      lastDecayTime: 0
    }
  }

  /**
   * Apply decay to a single relationship
   * Returns null if relationship should be pruned
   */
  decay(relationship: Relationship, currentTime: number): Relationship | null {
    // Check if in grace period
    if (relationship.lastInteraction) {
      const timeSinceInteraction = (currentTime - relationship.lastInteraction) / 1000
      if (timeSinceInteraction < this.config.gracePeriod) {
        return relationship // No decay during grace period
      }
    }

    // Calculate time since last interaction (or assume some time has passed)
    const timeSinceInteraction = relationship.lastInteraction
      ? (currentTime - relationship.lastInteraction) / 1000
      : 100 // Default if no lastInteraction

    // Calculate decay amount based on curve
    const decayAmount = this.calculateDecay(timeSinceInteraction)

    // Apply decay (capped)
    const cappedDecay = Math.min(decayAmount, this.config.maxDecayPerTick)

    const newFamiliarity = Math.max(0, relationship.familiarity - cappedDecay)
    const newTrust = Math.max(0, relationship.trust - cappedDecay * this.config.trustDecayMultiplier)

    // Check if should be pruned
    const strength = newTrust * 0.7 + newFamiliarity * 0.3
    if (strength < this.config.minThreshold) {
      this.stats.totalPruned++
      return null
    }

    this.stats.totalDecayed++
    this.stats.avgDecayAmount = (this.stats.avgDecayAmount + cappedDecay) / 2

    return {
      ...relationship,
      trust: newTrust,
      familiarity: newFamiliarity
    }
  }

  /**
   * Apply decay to multiple relationships (batch processing)
   * Returns filtered array with null entries removed
   */
  decayBatch(relationships: RelationshipEntry[], currentTime: number): RelationshipEntry[] {
    this.stats.lastDecayTime = currentTime

    return relationships
      .map(entry => {
        const decayed = this.decay(entry.bond, currentTime)
        if (!decayed) return null
        return { ...entry, bond: decayed }
      })
      .filter((entry): entry is RelationshipEntry => entry !== null)
  }

  /**
   * Calculate decay amount based on curve type
   */
  private calculateDecay(timeSinceInteraction: number): number {
    const t = timeSinceInteraction
    const r = this.config.baseRate

    switch (this.config.curve) {
      case 'linear':
        // Constant rate: decay = r * t
        return r * t

      case 'exponential':
        // Accelerating decay: decay = r * t^2 / 100
        // Decay accelerates quadratically (simpler than true exponential, avoids overflow)
        return (r * t * t) / 100

      case 'logarithmic':
        // Decelerating decay: decay = r * t / (1 + log(1 + t))
        // Slower decay for long-lasting relationships
        return (r * t) / (1 + Math.log(1 + t / 10))

      case 'stepped':
        // Sudden drops every 100 seconds
        const steps = Math.floor(t / 100)
        return r * steps * 10 // Big jumps

      default:
        return r * t
    }
  }

  /**
   * Reinforce relationship (delay decay)
   * Called when entities interact
   */
  reinforce(relationship: Relationship, currentTime: number): Relationship {
    return {
      ...relationship,
      lastInteraction: currentTime
    }
  }

  /**
   * Get decay statistics
   */
  getStats(): DecayStats {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalDecayed: 0,
      totalPruned: 0,
      avgDecayAmount: 0,
      lastDecayTime: 0
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Required<DecayConfig> {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DecayConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Estimate time until relationship decays below threshold
   * Returns seconds until pruning (or Infinity if won't decay)
   */
  estimateTimeUntilPruning(relationship: Relationship): number {
    const currentStrength = relationship.trust * 0.7 + relationship.familiarity * 0.3

    if (currentStrength <= this.config.minThreshold) {
      return 0 // Already below threshold
    }

    // For linear decay, easy to calculate
    if (this.config.curve === 'linear') {
      const decayNeeded = currentStrength - this.config.minThreshold
      const effectiveRate = this.config.baseRate * (0.7 + 0.3 * this.config.trustDecayMultiplier)
      return decayNeeded / effectiveRate
    }

    // For other curves, use approximation (binary search)
    let low = 0
    let high = 1000000 // ~11 days
    let estimate = high / 2

    for (let i = 0; i < 20; i++) { // 20 iterations = ~0.1% accuracy
      const testDecay = this.calculateDecay(estimate)
      const projectedStrength = currentStrength - testDecay

      if (Math.abs(projectedStrength - this.config.minThreshold) < 0.001) {
        break
      }

      if (projectedStrength > this.config.minThreshold) {
        low = estimate
      } else {
        high = estimate
      }
      estimate = (low + high) / 2
    }

    return estimate
  }
}

/**
 * Helper: Create decay manager with default config
 */
export function createDecayManager(config?: DecayConfig): RelationshipDecayManager {
  return new RelationshipDecayManager(config)
}

/**
 * Helper: Quick decay single relationship
 */
export function applyDecay(
  relationship: Relationship,
  timeSinceInteraction: number,
  config?: DecayConfig
): Relationship | null {
  const manager = new RelationshipDecayManager(config)
  // Mock current time for isolated calculation
  const mockTime = (relationship.lastInteraction ?? 0) + timeSinceInteraction * 1000
  return manager.decay(relationship, mockTime)
}

/**
 * Helper: Check if relationship should be pruned
 */
export function shouldPrune(
  relationship: Relationship,
  threshold: number = 0.05
): boolean {
  const strength = relationship.trust * 0.7 + relationship.familiarity * 0.3
  return strength < threshold
}

/**
 * Decay curve presets for different relationship types
 */
export const DECAY_PRESETS = {
  // Casual relationships fade quickly
  casual: {
    curve: 'linear' as DecayCurve,
    baseRate: 0.002,
    trustDecayMultiplier: 0.6,
    minThreshold: 0.1,
    gracePeriod: 30
  },

  // Standard decay (default)
  standard: {
    curve: 'linear' as DecayCurve,
    baseRate: 0.001,
    trustDecayMultiplier: 0.5,
    minThreshold: 0.05,
    gracePeriod: 60
  },

  // Deep bonds last longer
  deep: {
    curve: 'logarithmic' as DecayCurve,
    baseRate: 0.0005,
    trustDecayMultiplier: 0.3,
    minThreshold: 0.02,
    gracePeriod: 120
  },

  // Fragile relationships decay rapidly
  fragile: {
    curve: 'exponential' as DecayCurve,
    baseRate: 0.003,
    trustDecayMultiplier: 0.8,
    minThreshold: 0.15,
    gracePeriod: 15
  },

  // No decay (immortal relationships)
  immortal: {
    curve: 'linear' as DecayCurve,
    baseRate: 0,
    trustDecayMultiplier: 0,
    minThreshold: 0,
    gracePeriod: 0
  }
}
