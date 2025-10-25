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
  vocabularySize: number
  conversationCount: number
  memoryCount: number
  conceptsLearned: string[]
  emotionalMaturity: number  // 0-1
  firstConversation?: number  // timestamp
  lastConversation?: number   // timestamp
}

/**
 * Growth Tracker
 */
export class GrowthTracker {
  private metrics: GrowthMetrics

  constructor() {
    this.metrics = {
      vocabularySize: 0,
      conversationCount: 0,
      memoryCount: 0,
      conceptsLearned: [],
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
    const { vocabularySize, conversationCount, memoryCount, conceptsLearned, emotionalMaturity } = this.metrics

    const lines = [
      '📊 Growth Summary',
      '',
      `${'Vocabulary:'.padEnd(18)}${vocabularySize} words`,
      `${'Conversations:'.padEnd(18)}${conversationCount}`,
      `${'Memories:'.padEnd(18)}${memoryCount}`,
      `${'Concepts:'.padEnd(18)}${conceptsLearned.length} (${conceptsLearned.slice(0, 5).join(', ')}${conceptsLearned.length > 5 ? ', ...' : ''})`,
      `${'Maturity:'.padEnd(18)}${(emotionalMaturity * 100).toFixed(0)}%`
    ]

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
