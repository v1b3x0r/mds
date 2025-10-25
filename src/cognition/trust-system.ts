/**
 * MDS v5.5 - Trust & Privacy System
 * Selective sharing and reputation management
 *
 * Design principles:
 * - Entities control what to share (privacy)
 * - Trust index based on interaction history
 * - Byzantine tolerance (entities can deceive)
 * - Essential for realistic minds
 */

import type { MemoryType } from '../ontology/memory'

/**
 * Share policy levels
 */
export type SharePolicy = 'never' | 'trust' | 'contextual' | 'public'

/**
 * Trust configuration
 */
export interface TrustConfig {
  initialTrust?: number           // Starting trust level (default: 0.5)
  decayRate?: number              // Trust decay per interaction (default: 0.01)
  trustThreshold?: number         // Minimum trust for 'trust' policy (default: 0.6)
  maxTrust?: number               // Maximum trust level (default: 1.0)
  minTrust?: number               // Minimum trust level (default: 0.0)
}

/**
 * Privacy settings for different data types
 */
export interface PrivacySettings {
  memory?: SharePolicy            // Memory sharing policy
  emotion?: SharePolicy           // Emotion sharing policy
  intent?: SharePolicy            // Intent sharing policy
  location?: SharePolicy          // Location sharing policy
}

/**
 * Trust index entry
 */
export interface TrustEntry {
  entityId: string
  trust: number                   // Trust level (0..1)
  interactions: number            // Total interaction count
  positive: number                // Positive interactions
  negative: number                // Negative interactions
  lastUpdate: number              // Timestamp of last update
}

/**
 * Trust System - Manages reputation and privacy
 *
 * @example
 * const trustSystem = new TrustSystem()
 *
 * // Set privacy policy
 * trustSystem.setSharePolicy('memory', 'trust')
 *
 * // Check if should share
 * const canShare = trustSystem.shouldShare('memory', otherEntityId)
 *
 * // Update trust based on interaction
 * trustSystem.updateTrust(otherEntityId, 0.1)  // Positive interaction
 * trustSystem.updateTrust(badEntityId, -0.2)   // Negative interaction
 */
export class TrustSystem {
  private config: Required<TrustConfig>
  private trustIndex: Map<string, TrustEntry> = new Map()
  private privacySettings: Required<PrivacySettings>

  constructor(config: TrustConfig = {}) {
    this.config = {
      initialTrust: config.initialTrust ?? 0.5,
      decayRate: config.decayRate ?? 0.01,
      trustThreshold: config.trustThreshold ?? 0.6,
      maxTrust: config.maxTrust ?? 1.0,
      minTrust: config.minTrust ?? 0.0
    }

    // Default: share emotions publicly, others need trust
    this.privacySettings = {
      memory: 'trust',
      emotion: 'public',
      intent: 'contextual',
      location: 'public'
    }
  }

  /**
   * Set share policy for data type
   *
   * @param type - Data type to set policy for
   * @param policy - Share policy level
   */
  setSharePolicy(type: keyof PrivacySettings, policy: SharePolicy) {
    this.privacySettings[type] = policy
  }

  /**
   * Get share policy for data type
   */
  getSharePolicy(type: keyof PrivacySettings): SharePolicy {
    return this.privacySettings[type]
  }

  /**
   * Check if should share data with another entity
   *
   * @param type - Data type to share
   * @param targetId - Entity to share with
   * @param context - Optional context (for 'contextual' policy)
   * @returns true if should share
   */
  shouldShare(
    type: keyof PrivacySettings,
    targetId: string,
    context?: { memoryType?: MemoryType; importance?: number }
  ): boolean {
    const policy = this.privacySettings[type]

    switch (policy) {
      case 'never':
        return false

      case 'public':
        return true

      case 'trust': {
        const trust = this.getTrust(targetId)
        return trust >= this.config.trustThreshold
      }

      case 'contextual': {
        // Share if trusted OR if context is important
        const trust = this.getTrust(targetId)
        const importance = context?.importance ?? 0.5

        return trust >= this.config.trustThreshold || importance > 0.7
      }

      default:
        return false
    }
  }

  /**
   * Get trust level for entity
   *
   * @param entityId - Entity to get trust for
   * @returns Trust level (0..1)
   */
  getTrust(entityId: string): number {
    const entry = this.trustIndex.get(entityId)
    return entry?.trust ?? this.config.initialTrust
  }

  /**
   * Update trust based on interaction
   *
   * @param entityId - Entity to update trust for
   * @param delta - Trust change (-1..1)
   * @param timestamp - Interaction timestamp (default: Date.now())
   */
  updateTrust(entityId: string, delta: number, timestamp: number = Date.now()) {
    let entry = this.trustIndex.get(entityId)

    if (!entry) {
      entry = {
        entityId,
        trust: this.config.initialTrust,
        interactions: 0,
        positive: 0,
        negative: 0,
        lastUpdate: timestamp
      }
      this.trustIndex.set(entityId, entry)
    }

    // Update trust (clamped)
    entry.trust = Math.max(
      this.config.minTrust,
      Math.min(this.config.maxTrust, entry.trust + delta)
    )

    // Update interaction counters
    entry.interactions++
    if (delta > 0) {
      entry.positive++
    } else if (delta < 0) {
      entry.negative++
    }
    entry.lastUpdate = timestamp
  }

  /**
   * Decay trust over time (natural forgetting)
   *
   * @param dt - Delta time (seconds)
   */
  decayTrust(dt: number) {
    for (const entry of this.trustIndex.values()) {
      // Decay toward initial trust
      const direction = entry.trust > this.config.initialTrust ? -1 : 1
      entry.trust += direction * this.config.decayRate * dt

      // Clamp to valid range
      entry.trust = Math.max(
        this.config.minTrust,
        Math.min(this.config.maxTrust, entry.trust)
      )
    }
  }

  /**
   * Get all trust entries
   */
  getAllTrust(): TrustEntry[] {
    return Array.from(this.trustIndex.values())
  }

  /**
   * Get trusted entities (trust >= threshold)
   */
  getTrustedEntities(): string[] {
    return Array.from(this.trustIndex.entries())
      .filter(([_, entry]) => entry.trust >= this.config.trustThreshold)
      .map(([id]) => id)
  }

  /**
   * Get untrusted entities (trust < threshold)
   */
  getUntrustedEntities(): string[] {
    return Array.from(this.trustIndex.entries())
      .filter(([_, entry]) => entry.trust < this.config.trustThreshold)
      .map(([id]) => id)
  }

  /**
   * Clear trust index
   */
  clear() {
    this.trustIndex.clear()
  }

  /**
   * Reset trust for entity
   */
  resetTrust(entityId: string) {
    this.trustIndex.delete(entityId)
  }

  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      config: this.config,
      privacySettings: this.privacySettings,
      trustIndex: Array.from(this.trustIndex.entries()).map(([id, entry]) => ({
        id,
        ...entry
      }))
    }
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): TrustSystem {
    const system = new TrustSystem(data.config)

    // Restore privacy settings
    if (data.privacySettings) {
      Object.assign(system.privacySettings, data.privacySettings)
    }

    // Restore trust index
    if (data.trustIndex) {
      for (const item of data.trustIndex) {
        system.trustIndex.set(item.id, {
          entityId: item.entityId,
          trust: item.trust,
          interactions: item.interactions,
          positive: item.positive,
          negative: item.negative,
          lastUpdate: item.lastUpdate
        })
      }
    }

    return system
  }

  /**
   * Get interaction statistics
   */
  getStats(): {
    totalEntities: number
    trustedCount: number
    untrustedCount: number
    averageTrust: number
  } {
    const entries = Array.from(this.trustIndex.values())

    if (entries.length === 0) {
      return {
        totalEntities: 0,
        trustedCount: 0,
        untrustedCount: 0,
        averageTrust: this.config.initialTrust
      }
    }

    const averageTrust = entries.reduce((sum, e) => sum + e.trust, 0) / entries.length
    const trustedCount = entries.filter(e => e.trust >= this.config.trustThreshold).length
    const untrustedCount = entries.length - trustedCount

    return {
      totalEntities: entries.length,
      trustedCount,
      untrustedCount,
      averageTrust
    }
  }
}

/**
 * Create trust system with default config
 */
export function createTrustSystem(config?: TrustConfig): TrustSystem {
  return new TrustSystem(config)
}

/**
 * Deception capability - Entity can lie about its state
 * (For realistic minds - not all thoughts should be shared)
 *
 * @example
 * const actualEmotion = { valence: -0.8, arousal: 0.9, dominance: 0.2 }  // Angry
 * const sharedEmotion = deceive(actualEmotion, 'emotion', 0.7)
 * // sharedEmotion might be { valence: 0.2, arousal: 0.5, dominance: 0.5 } // Calm facade
 */
export function deceive<T>(
  actualValue: T,
  _type: 'emotion' | 'intent' | 'memory',
  _deceptionStrength: number = 0.5
): T {
  // For now, simple implementation: return actual value
  // In future, could modify based on type and strength
  // e.g., emotional masking, false intents, fabricated memories

  // Note: This is a placeholder for future deception logic
  // Byzantine tolerance would use this to allow entities to lie

  return actualValue  // No deception yet
}
