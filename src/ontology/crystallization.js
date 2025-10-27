/**
 * MDS v5.2 Phase 2.2 - Memory Crystallization
 * Long-term memory consolidation through pattern recognition
 *
 * Design principles:
 * - Group similar memories into "crystals" (consolidated memories)
 * - High-salience patterns become permanent long-term memories
 * - Reduces short-term memory load while preserving important patterns
 * - Inspired by human memory consolidation during sleep
 *
 * Theory:
 * - Short-term memories (MemoryBuffer) decay quickly
 * - Repeated patterns → crystallized long-term memories
 * - Crystals are immune to decay (permanent storage)
 * - Example: Multiple "interaction with X" → "X is a friend"
 */
/**
 * Memory crystallization system
 * Consolidates similar short-term memories into long-term crystals
 */
export class MemoryCrystallizer {
    crystals = new Map();
    config;
    constructor(config = {}) {
        this.config = {
            minOccurrences: config.minOccurrences ?? 3,
            minStrength: config.minStrength ?? 1.5,
            similarityThreshold: config.similarityThreshold ?? 0.7,
            maxCrystals: config.maxCrystals ?? 50
        };
    }
    /**
     * Crystallize memories - find patterns and create crystals
     * @param memories Source memories from MemoryBuffer
     * @param currentTime Current simulation time
     * @returns Array of newly formed crystals
     */
    crystallize(memories, currentTime) {
        const newCrystals = [];
        // Group memories by type and subject
        const groups = this.groupMemories(memories);
        for (const [key, group] of groups.entries()) {
            // Check if group meets crystallization criteria
            if (!this.meetsThreshold(group))
                continue;
            // Check if crystal already exists
            const existingCrystal = this.crystals.get(key);
            if (existingCrystal) {
                // Reinforce existing crystal
                this.reinforceCrystal(existingCrystal, group, currentTime);
            }
            else {
                // Create new crystal
                const crystal = this.createCrystal(key, group, currentTime);
                this.crystals.set(key, crystal);
                newCrystals.push(crystal);
                // Enforce storage limit
                if (this.crystals.size > this.config.maxCrystals) {
                    this.pruneWeakestCrystal();
                }
            }
        }
        return newCrystals;
    }
    /**
     * Group memories by type and subject
     */
    groupMemories(memories) {
        const groups = new Map();
        for (const memory of memories) {
            const key = `${memory.type}:${memory.subject}`;
            const group = groups.get(key) || [];
            group.push(memory);
            groups.set(key, group);
        }
        return groups;
    }
    /**
     * Check if memory group meets crystallization threshold
     */
    meetsThreshold(group) {
        if (group.length < this.config.minOccurrences)
            return false;
        const totalStrength = group.reduce((sum, m) => sum + m.salience, 0);
        if (totalStrength < this.config.minStrength)
            return false;
        return true;
    }
    /**
     * Create new crystal from memory group
     */
    createCrystal(key, group, currentTime) {
        const [type, subject] = key.split(':');
        const totalSalience = group.reduce((sum, m) => sum + m.salience, 0);
        const avgSalience = totalSalience / group.length;
        // Generate essence summary
        const essence = this.generateEssence(group);
        return {
            id: `crystal_${key}_${Date.now()}`,
            pattern: this.identifyPattern(group),
            subject,
            type: type,
            strength: Math.min(1, avgSalience),
            firstSeen: Math.min(...group.map(m => m.timestamp)),
            lastReinforced: currentTime,
            count: group.length,
            essence,
            metadata: this.extractMetadata(group)
        };
    }
    /**
     * Reinforce existing crystal with new memories
     */
    reinforceCrystal(crystal, group, currentTime) {
        const newSalience = group.reduce((sum, m) => sum + m.salience, 0);
        const newCount = group.length;
        // Update strength (weighted average)
        const totalCount = crystal.count + newCount;
        crystal.strength = (crystal.strength * crystal.count + newSalience) / totalCount;
        // Update metadata
        crystal.count = totalCount;
        crystal.lastReinforced = currentTime;
        // Cap strength at 1.0
        crystal.strength = Math.min(1, crystal.strength);
    }
    /**
     * Identify pattern type from memory group
     */
    identifyPattern(group) {
        const type = group[0].type;
        const count = group.length;
        // Pattern classification
        if (count >= 10)
            return `frequent_${type}`;
        if (count >= 5)
            return `repeated_${type}`;
        return `occasional_${type}`;
    }
    /**
     * Generate essence summary from memories
     */
    generateEssence(group) {
        const type = group[0].type;
        const subject = group[0].subject;
        const count = group.length;
        // Simple template-based essence
        const templates = {
            interaction: `${count} interactions with ${subject}`,
            emotion: `${count} emotional moments about ${subject}`,
            observation: `${count} observations of ${subject}`,
            field_spawn: `${count} field events with ${subject}`,
            intent_change: `${count} goal changes regarding ${subject}`,
            spawn: `Birth memory of ${subject}`,
            custom: `${count} events related to ${subject}`
        };
        return templates[type] || `${count} memories about ${subject}`;
    }
    /**
     * Extract common metadata from memory group
     */
    extractMetadata(group) {
        // Collect all content keys
        const allKeys = new Set();
        for (const memory of group) {
            if (memory.content && typeof memory.content === 'object') {
                Object.keys(memory.content).forEach(k => allKeys.add(k));
            }
        }
        // Aggregate common values
        const metadata = {};
        for (const key of allKeys) {
            const values = group
                .map(m => m.content?.[key])
                .filter(v => v !== undefined);
            if (values.length > 0) {
                // Use most common value or average for numbers
                if (typeof values[0] === 'number') {
                    metadata[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
                }
                else {
                    // Most common non-number value
                    metadata[key] = this.mostCommon(values);
                }
            }
        }
        return metadata;
    }
    /**
     * Find most common value in array
     */
    mostCommon(values) {
        const counts = new Map();
        for (const val of values) {
            counts.set(val, (counts.get(val) || 0) + 1);
        }
        let maxCount = 0;
        let mostCommon = values[0];
        for (const [val, count] of counts) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = val;
            }
        }
        return mostCommon;
    }
    /**
     * Remove weakest crystal to make room for new ones
     */
    pruneWeakestCrystal() {
        let weakestKey = null;
        let weakestStrength = Infinity;
        for (const [key, crystal] of this.crystals) {
            if (crystal.strength < weakestStrength) {
                weakestStrength = crystal.strength;
                weakestKey = key;
            }
        }
        if (weakestKey) {
            this.crystals.delete(weakestKey);
        }
    }
    /**
     * Get all crystals
     */
    getAllCrystals() {
        return Array.from(this.crystals.values());
    }
    /**
     * Get crystals by subject
     */
    getCrystalsBySubject(subject) {
        return this.getAllCrystals().filter(c => c.subject === subject);
    }
    /**
     * Get crystals by type
     */
    getCrystalsByType(type) {
        return this.getAllCrystals().filter(c => c.type === type);
    }
    /**
     * Get crystal by ID
     */
    getCrystal(id) {
        for (const crystal of this.crystals.values()) {
            if (crystal.id === id)
                return crystal;
        }
        return undefined;
    }
    /**
     * Check if subject has crystallized memories
     */
    hasCrystals(subject) {
        return this.getCrystalsBySubject(subject).length > 0;
    }
    /**
     * Get total crystal strength for subject (relationship depth indicator)
     */
    getCrystalStrength(subject) {
        const crystals = this.getCrystalsBySubject(subject);
        if (crystals.length === 0)
            return 0;
        const totalStrength = crystals.reduce((sum, c) => sum + c.strength, 0);
        return Math.min(1, totalStrength / crystals.length);
    }
    /**
     * Clear all crystals
     */
    clear() {
        this.crystals.clear();
    }
    /**
     * Get crystal count
     */
    count() {
        return this.crystals.size;
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            crystals: Array.from(this.crystals.entries()),
            config: this.config
        };
    }
    /**
     * Restore from JSON
     */
    static fromJSON(data) {
        const crystallizer = new MemoryCrystallizer(data.config);
        crystallizer.crystals = new Map(data.crystals);
        return crystallizer;
    }
}
/**
 * Helper: Create memory crystallizer with default config
 */
export function createCrystallizer(config) {
    return new MemoryCrystallizer(config);
}
/**
 * Helper: Crystallize memories and return summary
 */
export function crystallizeMemories(memories, currentTime, config) {
    const crystallizer = new MemoryCrystallizer(config);
    const crystals = crystallizer.crystallize(memories, currentTime);
    const summary = crystals.length > 0
        ? `Formed ${crystals.length} crystal${crystals.length > 1 ? 's' : ''}: ${crystals.map(c => c.essence).join(', ')}`
        : 'No patterns strong enough to crystallize';
    return { crystals, summary };
}
