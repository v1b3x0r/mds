/**
 * MDS v5.0 - Relationship System
 * Inter-entity bonds and social connections
 *
 * Design principles:
 * - Relationships are emergent (formed through interactions)
 * - Bond strength reflects shared history (memory-based)
 * - Bidirectional (A→B and B→A can differ)
 * - Persistent across save/load (UUID-based)
 */

/**
 * Relationship bond (connection between two entities)
 */
export interface Relationship {
  trust: number          // Trust level (0..1)
  familiarity: number    // How well entities know each other (0..1)
  lastInteraction?: number  // Timestamp of last interaction
  interactionCount?: number // Total interactions
}

/**
 * Relationship graph entry (stored in Entity)
 */
export interface RelationshipEntry {
  entityId: string       // Target entity UUID
  bond: Relationship     // Bond data
}

/**
 * Helper: Create new relationship
 */
export function createRelationship(
  trust = 0.5,
  familiarity = 0.1
): Relationship {
  return {
    trust,
    familiarity,
    interactionCount: 0
  }
}

/**
 * Helper: Update relationship based on interaction
 *
 * @param current - Current relationship state
 * @param outcome - Interaction outcome ('positive' | 'negative' | 'neutral')
 * @param strength - Interaction strength (0..1)
 * @returns Updated relationship
 */
export function updateRelationship(
  current: Relationship,
  outcome: 'positive' | 'negative' | 'neutral',
  strength = 0.1
): Relationship {
  const delta = outcome === 'positive' ? strength : outcome === 'negative' ? -strength : 0

  return {
    trust: Math.max(0, Math.min(1, current.trust + delta)),
    familiarity: Math.min(1, current.familiarity + strength * 0.5),
    lastInteraction: Date.now(),
    interactionCount: (current.interactionCount ?? 0) + 1
  }
}

/**
 * Helper: Calculate relationship strength (combined metric)
 *
 * @param relationship - Relationship to evaluate
 * @returns Combined strength (0..1)
 */
export function relationshipStrength(relationship: Relationship): number {
  // Weighted combination: trust is more important than familiarity
  return relationship.trust * 0.7 + relationship.familiarity * 0.3
}

/**
 * Helper: Check if relationship is strong enough for bonding
 *
 * @param relationship - Relationship to check
 * @param threshold - Minimum strength (default: 0.7)
 * @returns True if relationship passes threshold
 */
export function isBonded(
  relationship: Relationship,
  threshold = 0.7
): boolean {
  return relationshipStrength(relationship) >= threshold
}

/**
 * Helper: Decay relationship over time (natural forgetting)
 *
 * @param relationship - Current relationship
 * @param timeSinceInteraction - Time since last interaction (seconds)
 * @param decayRate - Decay per second (default: 0.001 = 0.1% per second)
 * @returns Updated relationship
 */
export function decayRelationship(
  relationship: Relationship,
  timeSinceInteraction: number,
  decayRate = 0.001
): Relationship {
  const decay = decayRate * timeSinceInteraction

  return {
    ...relationship,
    familiarity: Math.max(0, relationship.familiarity - decay),
    // Trust decays slower than familiarity
    trust: Math.max(0, relationship.trust - decay * 0.5)
  }
}
