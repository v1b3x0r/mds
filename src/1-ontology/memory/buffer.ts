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
 * Memory event types
 */
export type MemoryType =
  | 'interaction'     // Met another entity
  | 'emotion'         // Felt a significant emotion
  | 'observation'     // Saw something in the world
  | 'field_spawn'     // Created or entered a field
  | 'intent_change'   // Goal changed
  | 'spawn'           // Entity was created
  | 'custom'          // User-defined event

/**
 * Individual memory record
 */
export interface Memory {
  timestamp: number      // When it happened (relative to entity age)
  type: MemoryType
  subject: string        // Entity ID or "self" or "world"
  content: any           // Flexible payload (JSON-serializable)
  salience: number       // Importance (0..1, decays over time)
  keywords?: string[]    // Topic tags for semantic retrieval (v6.8)
  confidence?: number    // Retrieval confidence (0-1, computed dynamically)
}

/**
 * Memory filter for recall queries
 */
export interface MemoryFilter {
  type?: MemoryType
  subject?: string
  minSalience?: number
  since?: number         // Only memories after this timestamp
  before?: number        // Only memories before this timestamp
  keywords?: string[]    // Filter by topic tags (v6.8)
}

/**
 * Memory creation options
 */
export interface MemoryOptions {
  timestamp: number
  type: MemoryType
  subject: string
  content?: any
  salience?: number
}

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
  private buffer: Memory[] = []
  private maxSize: number

  constructor(options: { maxSize?: number } = {}) {
    this.maxSize = options.maxSize ?? 100
  }

  /**
   * Public accessor for memories array
   * v5.8.2: Added for compatibility with external code expecting .memories property
   */
  get memories(): Memory[] {
    return this.buffer
  }

  /**
   * Add a new memory (pushes out oldest if buffer full)
   */
  add(memory: Memory): void {
    this.buffer.push(memory)

    // Ring buffer: remove oldest if exceeding limit
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift()  // FIFO: oldest memories lost first
    }
  }

  /**
   * Recall memories matching filter
   *
   * @param filter - Optional filter criteria
   * @returns Array of matching memories
   */
  recall(filter?: MemoryFilter): Memory[] {
    if (!filter) return [...this.buffer]

    // If keywords provided, use semantic retrieval
    if (filter.keywords && filter.keywords.length > 0) {
      return this.recallByTopic(filter.keywords)
    }

    return this.buffer.filter(m => {
      if (filter.type && m.type !== filter.type) return false
      if (filter.subject && m.subject !== filter.subject) return false
      if (filter.minSalience !== undefined && m.salience < filter.minSalience) return false
      if (filter.since !== undefined && m.timestamp < filter.since) return false
      if (filter.before !== undefined && m.timestamp > filter.before) return false
      return true
    })
  }

  /**
   * Get memory strength for a specific subject
   * Higher = more/stronger memories about this subject
   *
   * @param subject - Entity ID or subject string
   * @returns Normalized strength (0..1)
   */
  getStrength(subject: string): number {
    const memories = this.recall({ subject })
    if (memories.length === 0) return 0

    // Weighted average of salience
    const totalSalience = memories.reduce((sum, m) => sum + m.salience, 0)
    return Math.min(1, totalSalience / this.maxSize)  // Normalize to 0..1
  }

  /**
   * Decay all memories (call every frame)
   * Simulates natural forgetting
   *
   * @param dt - Delta time in seconds
   * @param decayRate - Decay per second (default: 0.01 = 1% per second)
   */
  decay(dt: number, decayRate = 0.01): void {
    for (const m of this.buffer) {
      m.salience = Math.max(0, m.salience - decayRate * dt)
    }
  }

  /**
   * Remove low-salience memories (call periodically)
   * Prevents buffer from filling with dead memories
   *
   * @param threshold - Minimum salience to keep (default: 0.1)
   */
  forget(threshold = 0.1): void {
    this.buffer = this.buffer.filter(m => m.salience > threshold)
  }

  /**
   * Get total memory count (for UI/debug)
   */
  count(): number {
    return this.buffer.length
  }

  /**
   * Get average salience (for UI/debug)
   */
  avgSalience(): number {
    if (this.buffer.length === 0) return 0
    const total = this.buffer.reduce((sum, m) => sum + m.salience, 0)
    return total / this.buffer.length
  }

  /**
   * Get all memories (for serialization)
   */
  getAll(): Memory[] {
    return [...this.buffer]
  }

  /**
   * Clear all memories
   */
  clear(): void {
    this.buffer = []
  }

  /**
   * Recall memories by topic (semantic retrieval)
   * v6.8: Topic-based search using keyword overlap
   *
   * @param keywords - Topic keywords to search for
   * @param limit - Max memories to return (default: 10)
   * @returns Memories ranked by relevance (keyword overlap × salience)
   */
  recallByTopic(keywords: string[], limit: number = 10): Memory[] {
    if (keywords.length === 0) return []

    // Score each memory by keyword overlap
    const scored = this.buffer
      .map(memory => {
        if (!memory.keywords || memory.keywords.length === 0) {
          return { memory, score: 0 }
        }

        // Calculate Jaccard similarity (keyword overlap)
        const memKeywords = new Set(memory.keywords)
        const intersection = keywords.filter(kw => memKeywords.has(kw))
        const union = new Set([...memory.keywords, ...keywords])

        const overlap = intersection.length / union.size

        // Relevance = overlap × salience
        const score = overlap * memory.salience

        return { memory, score }
      })
      .filter(item => item.score > 0)  // Only relevant memories
      .sort((a, b) => b.score - a.score)  // Sort by relevance

    return scored.slice(0, limit).map(item => item.memory)
  }

  /**
   * Find similar memory (duplicate detection)
   * v6.8: Checks if content is similar to existing memory
   *
   * @param content - Content to check (must have .text field)
   * @param threshold - Similarity threshold (default: 0.9)
   * @returns Similar memory if found, null otherwise
   */
  findSimilar(content: any, threshold: number = 0.9): Memory | null {
    if (!content || typeof content.text !== 'string') return null

    const queryText = content.text.toLowerCase()

    for (const memory of this.buffer) {
      if (!memory.content || typeof memory.content.text !== 'string') continue

      const memoryText = memory.content.text.toLowerCase()

      // Simple Jaccard similarity (word-based)
      const wordsA = new Set(queryText.split(/\s+/))
      const wordsB = new Set(memoryText.split(/\s+/))
      const intersection = [...wordsA].filter(w => wordsB.has(w))
      const union = new Set([...wordsA, ...wordsB])

      const similarity = intersection.length / union.size

      if (similarity >= threshold) {
        return memory
      }
    }

    return null
  }

  /**
   * Boost memory salience (when info is repeated)
   * v6.8: Reinforce existing memory instead of creating duplicate
   *
   * @param memory - Memory to boost
   * @param amount - Amount to boost (default: 0.2)
   */
  boostSalience(memory: Memory, amount: number = 0.2): void {
    memory.salience = Math.min(1.0, memory.salience + amount)
  }

  /**
   * Calculate retrieval confidence
   * v6.8: Confidence = salience × recency_factor
   *
   * @param memory - Memory to calculate confidence for
   * @param currentTime - Current timestamp
   * @returns Confidence score (0-1)
   */
  calculateConfidence(memory: Memory, currentTime: number): number {
    // Recency factor: exponential decay based on age
    const age = currentTime - memory.timestamp
    const recencyFactor = Math.exp(-age / 10000)  // Decay over ~10k ticks

    return memory.salience * recencyFactor
  }

  /**
   * Serialize to JSON (for WorldFile)
   */
  toJSON() {
    return {
      buffer: this.buffer,
      maxSize: this.maxSize
    }
  }

  /**
   * Restore from JSON
   */
  static fromJSON(data: ReturnType<MemoryBuffer['toJSON']>): MemoryBuffer {
    const mb = new MemoryBuffer({ maxSize: data.maxSize })
    mb.buffer = data.buffer
    return mb
  }
}

/**
 * Helper: Create a memory event
 */
export function createMemory(options: MemoryOptions): Memory {
  return {
    timestamp: options.timestamp,
    type: options.type,
    subject: options.subject,
    content: options.content ?? {},
    salience: options.salience ?? 0.5
  }
}
