/**
 * Hi-Introvert: Growth Tracker
 *
 * Tracks entity growth over time:
 * - Vocabulary expansion
 * - Conversation count
 * - Concepts learned
 * - Emotional maturity
 */

/**
 * Growth metrics
 */
export interface GrowthMetrics {
  // Emergent Language (from world.lexicon - linguistics system)
  vocabularySize: number              // Count of emergent vocabulary
  vocabularyWords?: string[]          // Optional: top N emergent words

  // Explicit Learning (from conversation analysis)
  conceptsLearned: string[]           // Keywords detected/understood
  keywordsUnderstood?: number         // Computed from conceptsLearned.length

  // General metrics
  conversationCount: number
  memoryCount: number
  emotionalMaturity: number           // 0-1
  firstConversation?: number          // timestamp
  lastConversation?: number           // timestamp
}

/**
 * Growth Tracker
 */
export class GrowthTracker {
  private metrics: GrowthMetrics

  constructor() {
    this.metrics = {
      vocabularySize: 0,
      vocabularyWords: [],
      conversationCount: 0,
      memoryCount: 0,
      conceptsLearned: [],
      keywordsUnderstood: 0,
      emotionalMaturity: 0,
      firstConversation: undefined,
      lastConversation: undefined
    }
  }

  /**
   * Update metrics after conversation
   */
  update(data: Partial<GrowthMetrics>): void {
    Object.assign(this.metrics, data)

    // Auto-compute keywordsUnderstood from conceptsLearned
    this.metrics.keywordsUnderstood = this.metrics.conceptsLearned.length

    // Update timestamps
    const now = Date.now()
    if (!this.metrics.firstConversation) {
      this.metrics.firstConversation = now
    }
    this.metrics.lastConversation = now
  }

  /**
   * Add learned concept
   */
  learnConcept(concept: string): void {
    if (!this.metrics.conceptsLearned.includes(concept)) {
      this.metrics.conceptsLearned.push(concept)
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): GrowthMetrics {
    return { ...this.metrics }
  }

  /**
   * Get growth summary (for display)
   */
  getSummary(): string {
    const { vocabularySize, vocabularyWords, conversationCount, memoryCount, conceptsLearned, emotionalMaturity } = this.metrics

    const lines = [
      '📊 Growth Summary',
      '',
      `${'Emergent Vocab:'.padEnd(18)}${vocabularySize} words${vocabularyWords && vocabularyWords.length > 0 ? ` (${vocabularyWords.slice(0, 3).join(', ')}...)` : ''}`,
      `${'Concepts Learned:'.padEnd(18)}${conceptsLearned.length} keywords`,
      `${'Conversations:'.padEnd(18)}${conversationCount}`,
      `${'Memories:'.padEnd(18)}${memoryCount}`,
      `${'Maturity:'.padEnd(18)}${(emotionalMaturity * 100).toFixed(0)}%`
    ]

    if (conceptsLearned.length > 0) {
      lines.push(`${'Recent Concepts:'.padEnd(18)}${conceptsLearned.slice(-5).join(', ')}${conceptsLearned.length > 5 ? ', ...' : ''}`)
    }

    return lines.join('\n')
  }

  /**
   * Export state (for persistence)
   */
  toJSON() {
    return this.metrics
  }

  /**
   * Restore state (from persistence)
   */
  static fromJSON(data: GrowthMetrics): GrowthTracker {
    const tracker = new GrowthTracker()
    tracker.metrics = data
    return tracker
  }
}
