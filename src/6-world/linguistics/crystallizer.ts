/**
 * MDS v6.0 - Linguistic Crystallizer
 * Analyzes transcript and extracts emergent patterns
 *
 * Design:
 * - Runs every N ticks (configurable)
 * - Local pattern detection (frequency-based, no LLM)
 * - Optional LLM enhancement (future)
 * - Adds patterns to world lexicon
 */

import type { TranscriptBuffer, Utterance } from '@mds/6-world/linguistics/transcript'
import type { WorldLexicon, LexiconEntry } from '@mds/6-world/linguistics/lexicon'

/**
 * Crystallizer configuration
 */
export interface CrystallizerConfig {
  enabled: boolean
  analyzeEvery: number      // Ticks between analysis (default: 50)
  minUsage: number          // Minimum occurrences to crystallize (default: 3)
  minLength: number         // Minimum phrase length (default: 2 chars)
  maxLength: number         // Maximum phrase length (default: 100 chars)
}

/**
 * Analyzes conversations and crystallizes patterns into lexicon
 */
export class LinguisticCrystallizer {
  private config: Required<CrystallizerConfig>
  private lastAnalysis: number = 0
  private tickCount: number = 0

  constructor(config: Partial<CrystallizerConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      analyzeEvery: config.analyzeEvery ?? 50,
      minUsage: config.minUsage ?? 3,
      minLength: config.minLength ?? 2,
      maxLength: config.maxLength ?? 100
    }
  }

  /**
   * Called every world tick
   */
  tick(transcript: TranscriptBuffer, lexicon: WorldLexicon): void {
    if (!this.config.enabled) return

    this.tickCount++

    // Run analysis every N ticks
    if (this.tickCount % this.config.analyzeEvery === 0) {
      this.analyze(transcript, lexicon)
    }

    // Decay unused terms
    lexicon.decay(1000)  // Assume 1 tick ≈ 1 second
  }

  /**
   * Analyze transcript and extract patterns
   */
  private analyze(transcript: TranscriptBuffer, lexicon: WorldLexicon): void {
    const recent = transcript.getSince(this.lastAnalysis)
    this.lastAnalysis = Date.now()

    if (recent.length === 0) return

    // Local pattern detection (frequency-based)
    const patterns = this.detectLocalPatterns(recent)

    // Add to lexicon
    for (const pattern of patterns) {
      lexicon.add(pattern)
    }
  }

  /**
   * Detect patterns using local frequency analysis (no LLM)
   *
   * Algorithm:
   * 1. Normalize all utterances (trim, lowercase)
   * 2. Count frequency of each phrase
   * 3. Track speakers + emotion context
   * 4. Return phrases used ≥ minUsage times
   */
  private detectLocalPatterns(
    utterances: Utterance[]
  ): Omit<LexiconEntry, 'weight' | 'decayRate'>[] {
    const phrases = new Map<
      string,
      {
        count: number
        speakers: Set<string>
        firstSeen: number
        lastUsed: number
        emotions: { valence: number; arousal: number }[]
      }
    >()

    // Phase 1: Collect phrase data
    for (const utt of utterances) {
      const normalized = this.normalize(utt.text)

      // Skip if too short or too long
      if (
        normalized.length < this.config.minLength ||
        normalized.length > this.config.maxLength
      ) {
        continue
      }

      if (!phrases.has(normalized)) {
        phrases.set(normalized, {
          count: 0,
          speakers: new Set(),
          firstSeen: utt.timestamp,
          lastUsed: utt.timestamp,
          emotions: []
        })
      }

      const entry = phrases.get(normalized)!
      entry.count++
      entry.speakers.add(utt.speaker)
      entry.lastUsed = Math.max(entry.lastUsed, utt.timestamp)
      entry.emotions.push({
        valence: utt.emotion.valence,
        arousal: utt.emotion.arousal
      })
    }

    // Phase 2: Extract patterns that meet threshold
    const results: Omit<LexiconEntry, 'weight' | 'decayRate'>[] = []

    for (const [phrase, data] of phrases.entries()) {
      if (data.count >= this.config.minUsage) {
        // Calculate average emotion
        const avgEmotion = data.emotions.reduce(
          (acc, e) => ({
            valence: acc.valence + e.valence / data.emotions.length,
            arousal: acc.arousal + e.arousal / data.emotions.length
          }),
          { valence: 0, arousal: 0 }
        )

        // Detect category (heuristic)
        const category = this.detectCategory(phrase, avgEmotion)

        results.push({
          term: phrase,
          meaning: `Used ${data.count} times by ${data.speakers.size} entity(ies)`,
          origin: Array.from(data.speakers)[0],
          category,
          usageCount: data.count,
          lastUsed: data.lastUsed,
          firstSeen: data.firstSeen,
          relatedTerms: [],
          emotionContext: avgEmotion
        })
      }
    }

    return results
  }

  /**
   * Normalize text for comparison
   */
  private normalize(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Collapse whitespace
  }

  /**
   * Detect category using heuristics
   */
  private detectCategory(
    phrase: string,
    emotion: { valence: number; arousal: number }
  ): string {
    // Greeting patterns
    if (/^(hi|hello|hey|sup|こんにちは|สวัสดี)/.test(phrase)) {
      return 'greeting'
    }

    // Question patterns
    if (phrase.includes('?') || /^(why|what|how|when|where)/.test(phrase)) {
      return 'question'
    }

    // High arousal = expression
    if (emotion.arousal > 0.7) {
      return 'expression'
    }

    // Positive valence = affirmation
    if (emotion.valence > 0.5) {
      return 'affirmation'
    }

    // Negative valence = concern
    if (emotion.valence < -0.5) {
      return 'concern'
    }

    // Default
    return 'statement'
  }

  /**
   * Get statistics
   */
  getStats(): {
    tickCount: number
    lastAnalysis: number
    config: CrystallizerConfig
  } {
    return {
      tickCount: this.tickCount,
      lastAnalysis: this.lastAnalysis,
      config: this.config
    }
  }

  /**
   * Reset counters (for testing)
   */
  reset(): void {
    this.tickCount = 0
    this.lastAnalysis = 0
  }
}
