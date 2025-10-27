/**
 * MDS v5.0 - Memory System
 * Ring buffer with automatic decay and forgetting
 *
 * Design principles:
 * - Fixed size prevents unbounded growth
 * - Salience decay simulates natural forgetting
 * - Automatic pruning removes insignificant memories
 * - All operations O(n) where n = maxSize (small constant)
 */
/**
 * Ring buffer with automatic decay and forgetting
 *
 * @example
 * const memory = new MemoryBuffer({ maxSize: 100 })
 *
 * // Add a memory
 * memory.add({
 *   timestamp: entityAge,
 *   type: 'interaction',
 *   subject: otherEntity.id,
 *   content: { distance: 50 },
 *   salience: 0.8
 * })
 *
 * // Recall memories
 * const interactions = memory.recall({ type: 'interaction' })
 *
 * // Get memory strength for a subject
 * const strength = memory.getStrength(otherEntity.id)
 *
 * // Decay (called every frame)
 * memory.decay(dt, 0.01)  // 1% fade per second
 *
 * // Forget low-salience memories
 * memory.forget(0.1)  // Remove salience < 0.1
 */
export class MemoryBuffer {
    buffer = [];
    maxSize;
    constructor(options = {}) {
        this.maxSize = options.maxSize ?? 100;
    }
    /**
     * Public accessor for memories array
     * v5.8.2: Added for compatibility with external code expecting .memories property
     */
    get memories() {
        return this.buffer;
    }
    /**
     * Add a new memory (pushes out oldest if buffer full)
     */
    add(memory) {
        this.buffer.push(memory);
        // Ring buffer: remove oldest if exceeding limit
        if (this.buffer.length > this.maxSize) {
            this.buffer.shift(); // FIFO: oldest memories lost first
        }
    }
    /**
     * Recall memories matching filter
     *
     * @param filter - Optional filter criteria
     * @returns Array of matching memories
     */
    recall(filter) {
        if (!filter)
            return [...this.buffer];
        return this.buffer.filter(m => {
            if (filter.type && m.type !== filter.type)
                return false;
            if (filter.subject && m.subject !== filter.subject)
                return false;
            if (filter.minSalience !== undefined && m.salience < filter.minSalience)
                return false;
            if (filter.since !== undefined && m.timestamp < filter.since)
                return false;
            if (filter.before !== undefined && m.timestamp > filter.before)
                return false;
            return true;
        });
    }
    /**
     * Get memory strength for a specific subject
     * Higher = more/stronger memories about this subject
     *
     * @param subject - Entity ID or subject string
     * @returns Normalized strength (0..1)
     */
    getStrength(subject) {
        const memories = this.recall({ subject });
        if (memories.length === 0)
            return 0;
        // Weighted average of salience
        const totalSalience = memories.reduce((sum, m) => sum + m.salience, 0);
        return Math.min(1, totalSalience / this.maxSize); // Normalize to 0..1
    }
    /**
     * Decay all memories (call every frame)
     * Simulates natural forgetting
     *
     * @param dt - Delta time in seconds
     * @param decayRate - Decay per second (default: 0.01 = 1% per second)
     */
    decay(dt, decayRate = 0.01) {
        for (const m of this.buffer) {
            m.salience = Math.max(0, m.salience - decayRate * dt);
        }
    }
    /**
     * Remove low-salience memories (call periodically)
     * Prevents buffer from filling with dead memories
     *
     * @param threshold - Minimum salience to keep (default: 0.1)
     */
    forget(threshold = 0.1) {
        this.buffer = this.buffer.filter(m => m.salience > threshold);
    }
    /**
     * Get total memory count (for UI/debug)
     */
    count() {
        return this.buffer.length;
    }
    /**
     * Get average salience (for UI/debug)
     */
    avgSalience() {
        if (this.buffer.length === 0)
            return 0;
        const total = this.buffer.reduce((sum, m) => sum + m.salience, 0);
        return total / this.buffer.length;
    }
    /**
     * Get all memories (for serialization)
     */
    getAll() {
        return [...this.buffer];
    }
    /**
     * Clear all memories
     */
    clear() {
        this.buffer = [];
    }
    /**
     * Serialize to JSON (for WorldFile)
     */
    toJSON() {
        return {
            buffer: this.buffer,
            maxSize: this.maxSize
        };
    }
    /**
     * Restore from JSON
     */
    static fromJSON(data) {
        const mb = new MemoryBuffer({ maxSize: data.maxSize });
        mb.buffer = data.buffer;
        return mb;
    }
}
/**
 * Helper: Create a memory event
 */
export function createMemory(options) {
    return {
        timestamp: options.timestamp,
        type: options.type,
        subject: options.subject,
        content: options.content ?? {},
        salience: options.salience ?? 0.5
    };
}
