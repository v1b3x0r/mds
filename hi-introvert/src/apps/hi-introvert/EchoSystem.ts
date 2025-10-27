/**
 * Echo System (เสียงในหัว) - Inner Voice Rehearsal
 *
 * Philosophy: "การพูดในใจทำให้จำได้ดีขึ้น"
 * - After each conversation, companion "echoes" key phrases internally
 * - This rehearsal strengthens memory and accelerates proto-language emergence
 * - Mimics how humans repeat phrases mentally to learn language
 *
 * Implementation:
 * - Extract key words/phrases from conversation
 * - Companion "speaks" them internally (silent recordSpeech)
 * - Increases frequency count for crystallizer
 * - Strengthens memory consolidation
 */

export interface EchoConfig {
  enabled: boolean
  echoCount: number        // How many times to echo (default: 3)
  minPhraseLength: number  // Minimum phrase length to echo (default: 3)
  echoDelay: number        // ms between echoes (default: 10)
}

export interface EchoablePhrase {
  text: string
  importance: number  // 0-1, higher = more important
  source: 'user' | 'self'
}

export class EchoSystem {
  private config: Required<EchoConfig>

  constructor(config: Partial<EchoConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      echoCount: config.echoCount ?? 3,
      minPhraseLength: config.minPhraseLength ?? 3,
      echoDelay: config.echoDelay ?? 10
    }
  }

  /**
   * Extract echoable phrases from conversation
   * Prioritizes: user messages > emotional words > unique concepts
   */
  extractPhrases(
    userMessage: string,
    companionResponse: string,
    emotion?: { valence: number; arousal: number }
  ): EchoablePhrase[] {
    const phrases: EchoablePhrase[] = []

    // 1. User's key words (high importance - what user said matters most!)
    const userWords = this.extractKeyWords(userMessage)
    for (const word of userWords) {
      phrases.push({
        text: word,
        importance: 1.0,  // User messages are always important
        source: 'user'
      })
    }

    // 2. Companion's own words (medium importance - reinforce own speech)
    const selfWords = this.extractKeyWords(companionResponse)
    for (const word of selfWords) {
      phrases.push({
        text: word,
        importance: 0.6,
        source: 'self'
      })
    }

    // 3. Emotional context boosts importance
    if (emotion && Math.abs(emotion.valence - 0.5) > 0.3) {
      // High emotional valence = more memorable
      const emotionalBoost = Math.abs(emotion.valence - 0.5) * 0.4
      phrases.forEach(p => {
        p.importance = Math.min(1.0, p.importance + emotionalBoost)
      })
    }

    // Sort by importance
    return phrases.sort((a, b) => b.importance - a.importance)
  }

  /**
   * Extract key words from text
   * Simple heuristic: words > minLength, filter common words
   */
  private extractKeyWords(text: string): string[] {
    // Thai/English mixed text
    const words = text
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, '') // Keep Thai + English + numbers
      .split(/\s+/)
      .filter(w => w.length >= this.config.minPhraseLength)

    // Filter common words (stopwords)
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'ผม', 'ฉัน', 'คุณ', 'เขา', 'เธอ', 'มัน', 'นั้น', 'นี้', 'อัน', 'ที่',
      'ไป', 'มา', 'ได้', 'แล้ว', 'จะ', 'อยู่', 'ครับ', 'ค่ะ', 'นะ', 'เลย'
    ])

    return words.filter(w => !stopwords.has(w))
  }

  /**
   * Perform echo rehearsal
   * Returns phrases that should be recorded internally
   */
  async rehearse(phrases: EchoablePhrase[]): Promise<string[]> {
    if (!this.config.enabled || phrases.length === 0) {
      return []
    }

    const echoed: string[] = []

    // Echo top N phrases based on importance
    const topPhrases = phrases.slice(0, 5)  // Top 5 most important

    for (const phrase of topPhrases) {
      // Echo multiple times (spaced repetition!)
      for (let i = 0; i < this.config.echoCount; i++) {
        echoed.push(phrase.text)

        // Small delay for "mental processing"
        if (this.config.echoDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.config.echoDelay))
        }
      }
    }

    return echoed
  }

  /**
   * Get echo statistics
   */
  getStats(phrases: EchoablePhrase[]): {
    totalPhrases: number
    userPhrases: number
    selfPhrases: number
    avgImportance: number
  } {
    return {
      totalPhrases: phrases.length,
      userPhrases: phrases.filter(p => p.source === 'user').length,
      selfPhrases: phrases.filter(p => p.source === 'self').length,
      avgImportance: phrases.reduce((sum, p) => sum + p.importance, 0) / (phrases.length || 1)
    }
  }
}
