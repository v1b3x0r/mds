/**
 * MDS v5.5 - Cognitive Link System
 * Direct entity-to-entity connections for P2P cognition
 *
 * Design principles:
 * - Bidirectional links (mutual awareness)
 * - Strength parameter (0..1) affects signal propagation
 * - Automatic weakening if not reinforced
 * - Integration with existing relationship system
 */
/**
 * Cognitive Link Manager - Helper for Entity class
 *
 * @example
 * // In Entity class:
 * cognitiveLinks = new Map<string, CognitiveLink>()
 *
 * // Connect two entities
 * entity.connectTo(other, { strength: 0.8, bidirectional: true })
 *
 * // Check connection
 * entity.isConnectedTo(other.id)  // → true
 *
 * // Weaken links over time
 * entity.decayCognitiveLinks(dt, 0.01)
 */
export class CognitiveLinkManager {
    /**
     * Create or update cognitive link
     */
    static connect(links, targetId, timestamp, options = {}) {
        const existing = links.get(targetId);
        if (existing) {
            // Reinforce existing link
            existing.strength = Math.min(1, existing.strength + 0.1);
            existing.lastReinforced = timestamp;
            return existing;
        }
        // Create new link
        const link = {
            target: targetId,
            strength: options.strength ?? 0.5,
            formed: timestamp,
            lastReinforced: timestamp,
            bidirectional: options.bidirectional ?? true
        };
        links.set(targetId, link);
        return link;
    }
    /**
     * Remove cognitive link
     */
    static disconnect(links, targetId) {
        return links.delete(targetId);
    }
    /**
     * Get link strength (returns 0 if not connected)
     */
    static getStrength(links, targetId) {
        return links.get(targetId)?.strength ?? 0;
    }
    /**
     * Check if connected
     */
    static isConnected(links, targetId) {
        return links.has(targetId);
    }
    /**
     * Decay all links over time (natural forgetting)
     *
     * @param links - Link map
     * @param dt - Delta time (seconds)
     * @param decayRate - Strength loss per second (e.g., 0.01 = 1% per second)
     * @param minStrength - Auto-prune links below this threshold
     */
    static decay(links, dt, decayRate = 0.01, minStrength = 0.1) {
        const toRemove = [];
        for (const [targetId, link] of links) {
            // Apply decay
            link.strength = Math.max(0, link.strength - decayRate * dt);
            // Mark for removal if too weak
            if (link.strength < minStrength) {
                toRemove.push(targetId);
            }
        }
        // Prune weak links
        for (const targetId of toRemove) {
            links.delete(targetId);
        }
    }
    /**
     * Reinforce link (called on interaction)
     *
     * @param links - Link map
     * @param targetId - Entity to reinforce
     * @param timestamp - Current time
     * @param amount - Strength increase (default 0.1)
     */
    static reinforce(links, targetId, timestamp, amount = 0.1) {
        const link = links.get(targetId);
        if (link) {
            link.strength = Math.min(1, link.strength + amount);
            link.lastReinforced = timestamp;
        }
    }
    /**
     * Get all connected entity IDs
     */
    static getConnected(links) {
        return Array.from(links.keys());
    }
    /**
     * Get links sorted by strength (strongest first)
     */
    static getSortedByStrength(links) {
        return Array.from(links.values()).sort((a, b) => b.strength - a.strength);
    }
    /**
     * Count total connections
     */
    static count(links) {
        return links.size;
    }
    /**
     * Get average link strength
     */
    static averageStrength(links) {
        if (links.size === 0)
            return 0;
        const total = Array.from(links.values()).reduce((sum, link) => sum + link.strength, 0);
        return total / links.size;
    }
}
