/**
 * Hi-Introvert: Vocabulary Tracker
 *
 * Tracks words that entity knows and learns over time
 * Design: Entity starts with ~200 base words, grows through conversation
 */

import { BASE_VOCABULARY, getBaseVocabularySize } from './base-vocabulary'

/**
 * Vocabulary growth event
 */
export interface VocabularyGrowthEvent {
  word: string
  timestamp: number
  source: 'user' | 'self'  // Learned from user or self-discovery
}

/**
 * Vocabulary statistics
 */
export interface VocabularyStats {
  total: number
  baseWords: number
  learnedWords: number
  lastGrowth?: VocabularyGrowthEvent
  growthRate: number  // Words per conversation
  conversationCount: number  // Total conversations
}

/**
 * Vocabulary Tracker
 *
 * Tracks known words and detects new words from user input
 */
export class VocabularyTracker {
  private knownWords: Set<string>
  private learnedWords: Map<string, VocabularyGrowthEvent>
  private conversationCount: number = 0

  constructor(initialVocabulary: string[] = BASE_VOCABULARY) {
    // Initialize with base vocabulary
    this.knownWords = new Set(initialVocabulary.map(w => w.toLowerCase().trim()))
    this.learnedWords = new Map()
  }

  /**
   * Detect new words in user message
   *
   * @param message - User input
   * @returns Array of new words learned
   */
  detectNewWords(message: string): string[] {
    const words = this.tokenize(message)
    const newWords: string[] = []

    for (const word of words) {
      const normalized = word.toLowerCase().trim()

      // Skip if already known or too short
      if (normalized.length < 2) continue
      if (this.knownWords.has(normalized)) continue

      // Learn new word
      this.knownWords.add(normalized)
      this.learnedWords.set(normalized, {
        word,
        timestamp: Date.now(),
        source: 'user'
      })

      newWords.push(word)
    }

    return newWords
  }

  /**
   * Tokenize message into words
   *
   * Handles both Thai (no spaces) and English (space-separated)
   * Simple heuristic: split by space + punctuation
   */
  private tokenize(message: string): string[] {
    // Split by space, punctuation, but keep Thai/English words intact
    const tokens = message
      .split(/[\s,!?.;:()\[\]{}]+/)
      .filter(t => t.length > 0)

    return tokens
  }

  /**
   * Check if entity knows this word
   */
  canUse(word: string): boolean {
    const normalized = word.toLowerCase().trim()
    return this.knownWords.has(normalized)
  }

  /**
   * Get vocabulary size
   */
  getVocabularySize(): number {
    return this.knownWords.size
  }

  /**
   * Get learned words (excluding base vocabulary)
   */
  getLearnedWords(): VocabularyGrowthEvent[] {
    return Array.from(this.learnedWords.values())
  }

  /**
   * Get recently learned words
   */
  getRecentlyLearned(count: number = 5): VocabularyGrowthEvent[] {
    const learned = this.getLearnedWords()
    return learned
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count)
  }

  /**
   * Increment conversation count (for growth rate calculation)
   */
  incrementConversation(): void {
    this.conversationCount++
  }

  /**
   * Get vocabulary statistics
   */
  getStats(): VocabularyStats {
    const baseWords = getBaseVocabularySize()
    const learnedWords = this.learnedWords.size
    const total = this.knownWords.size

    const recent = this.getRecentlyLearned(1)
    const lastGrowth = recent.length > 0 ? recent[0] : undefined

    const growthRate = this.conversationCount > 0
      ? learnedWords / this.conversationCount
      : 0

    return {
      total,
      baseWords,
      learnedWords,
      lastGrowth,
      growthRate,
      conversationCount: this.conversationCount
    }
  }

  /**
   * Export vocabulary state (for persistence)
   */
  toJSON() {
    return {
      knownWords: Array.from(this.knownWords),
      learnedWords: Array.from(this.learnedWords.entries()),
      conversationCount: this.conversationCount
    }
  }

  /**
   * Restore vocabulary state (from persistence)
   */
  static fromJSON(data: ReturnType<VocabularyTracker['toJSON']>): VocabularyTracker {
    const tracker = new VocabularyTracker([])
    tracker.knownWords = new Set(data.knownWords)
    tracker.learnedWords = new Map(data.learnedWords)
    tracker.conversationCount = data.conversationCount
    return tracker
  }

  /**
   * Get all known words (for debugging)
   */
  getAllWords(): string[] {
    return Array.from(this.knownWords)
  }

  /**
   * Filter message to only include known words (for constrained generation)
   *
   * @param message - Input message
   * @returns Message with only known words, unknowns replaced with [unknown]
   */
  filterUnknownWords(message: string): string {
    const words = this.tokenize(message)
    const filtered = words.map(word => {
      const normalized = word.toLowerCase().trim()
      return this.knownWords.has(normalized) ? word : '[unknown]'
    })
    return filtered.join(' ')
  }

  /**
   * Get vocabulary coverage of a message
   *
   * @param message - Input message
   * @returns Coverage percentage (0-1)
   */
  getCoverage(message: string): number {
    const words = this.tokenize(message)
    if (words.length === 0) return 1

    const known = words.filter(word => {
      const normalized = word.toLowerCase().trim()
      return this.knownWords.has(normalized)
    })

    return known.length / words.length
  }
}
