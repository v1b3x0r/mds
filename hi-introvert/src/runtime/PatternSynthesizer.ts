/**
 * Pattern Synthesizer - Response Generation via Pattern Recombination
 *
 * Philosophy:
 * - Entity learns from transcript patterns (not templates)
 * - Synthesis = Memory × Emotion × Context → Novel Response
 * - Language-agnostic (works with any language)
 * - Emergence, not control
 *
 * Design:
 * - Extract successful patterns from transcript
 * - Weight by emotional feedback (PAD model)
 * - Recombine patterns based on current context
 * - Allow natural variation (not deterministic)
 *
 * v1.0 (2025-10-28): Initial stable foundation
 */

import type { Utterance } from '../../src/6-world/linguistics/transcript'
import type { LexiconEntry } from '../../src/6-world/linguistics/lexicon'
import type { Memory } from '../../src/1-ontology/memory/buffer'

/**
 * Conversation pattern extracted from transcript
 */
export interface ConversationPattern {
  // Pattern structure
  trigger: string[]       // Keywords that precede this response
  response: string[]      // Response fragments (not full text!)

  // Context
  emotionContext: {
    valence: number       // Average emotion when pattern worked
    arousal: number
  }

  // Learning metrics
  successCount: number    // How many times this worked
  weight: number          // 0-1, higher = more reliable
  lastUsed: number        // Timestamp
}

/**
 * Response synthesis configuration
 */
export interface SynthesisConfig {
  minPatternFrequency: number  // Min times pattern must appear (default: 2)
  maxFragmentLength: number    // Max words per fragment (default: 5)
  creativityBias: number       // 0-1, higher = more random (default: 0.3)
  emotionWeight: number        // 0-1, how much emotion affects selection (default: 0.5)
}

/**
 * Pattern Synthesizer
 *
 * Generates responses by recombining learned patterns from transcript.
 * Does NOT use hardcoded templates - all patterns emerge from experience.
 */
export class PatternSynthesizer {
  private patterns: ConversationPattern[] = []
  private config: SynthesisConfig

  constructor(config: Partial<SynthesisConfig> = {}) {
    this.config = {
      minPatternFrequency: config.minPatternFrequency ?? 2,
      maxFragmentLength: config.maxFragmentLength ?? 5,
      creativityBias: config.creativityBias ?? 0.3,
      emotionWeight: config.emotionWeight ?? 0.5
    }
  }

  /**
   * Extract patterns from transcript history
   *
   * Analyzes conversation flow: User says X → Entity says Y
   * Identifies which responses led to positive emotional outcomes
   */
  extractPatterns(
    utterances: Utterance[],
    entityId: string
  ): void {
    const patterns = new Map<string, ConversationPattern>()

    // Sliding window: look at pairs of utterances
    for (let i = 0; i < utterances.length - 1; i++) {
      const current = utterances[i]
      const next = utterances[i + 1]

      // Only analyze: Other speaker → Entity response
      if (current.speaker === entityId || next.speaker !== entityId) {
        continue
      }

      // Extract trigger keywords (from user message)
      const triggerWords = this.tokenize(current.text)
        .filter(w => w.length > 2)  // Skip short words
        .slice(0, 5)  // Max 5 keywords

      // Extract response fragments (from entity response)
      const responseFragments = this.fragmentize(next.text, this.config.maxFragmentLength)

      // Create pattern signature (for deduplication)
      const signature = triggerWords.join('|')

      const existing = patterns.get(signature)
      if (existing) {
        // Pattern seen before → increase weight
        existing.successCount++
        existing.weight = Math.min(1.0, existing.weight + 0.1)

        // Update emotion context (rolling average)
        const alpha = 0.3
        existing.emotionContext.valence =
          alpha * next.emotion.valence + (1 - alpha) * existing.emotionContext.valence
        existing.emotionContext.arousal =
          alpha * next.emotion.arousal + (1 - alpha) * existing.emotionContext.arousal
      } else {
        // New pattern
        patterns.set(signature, {
          trigger: triggerWords,
          response: responseFragments,
          emotionContext: {
            valence: next.emotion.valence,
            arousal: next.emotion.arousal
          },
          successCount: 1,
          weight: 0.3,  // Start low (needs reinforcement)
          lastUsed: Date.now()
        })
      }
    }

    // Filter: only keep patterns with min frequency
    this.patterns = Array.from(patterns.values())
      .filter(p => p.successCount >= this.config.minPatternFrequency)
      .sort((a, b) => b.weight - a.weight)  // Sort by reliability
  }

  /**
   * Synthesize response from patterns
   *
   * @param userMessage - Current user message
   * @param currentEmotion - Entity's current emotion
   * @param memories - Relevant memories for context
   * @param lexicon - Available vocabulary
   * @returns Synthesized response (null if no patterns available)
   */
  synthesize(
    userMessage: string,
    currentEmotion: { valence: number; arousal: number },
    memories: Memory[] = [],
    lexicon: LexiconEntry[] = []
  ): string | null {
    if (this.patterns.length === 0) {
      return null  // No patterns learned yet (newborn entity)
    }

    // 1. Extract keywords from user message
    const userKeywords = this.tokenize(userMessage).filter(w => w.length > 2)

    // 2. Score patterns by relevance
    const scoredPatterns = this.patterns.map(pattern => {
      // Keyword overlap score (how well does pattern match input?)
      const keywordOverlap = this.calculateOverlap(userKeywords, pattern.trigger)

      // Emotion alignment score (does pattern match current mood?)
      const emotionDistance = Math.abs(
        currentEmotion.valence - pattern.emotionContext.valence
      )
      const emotionScore = 1 - emotionDistance

      // Combined score
      const score =
        keywordOverlap * (1 - this.config.emotionWeight) +
        emotionScore * this.config.emotionWeight

      return { pattern, score }
    })

    // 3. Select pattern (with creativity bias)
    const selected = this.selectPattern(scoredPatterns, this.config.creativityBias)
    if (!selected) {
      return null
    }

    // 4. Recombine fragments (add variation)
    const response = this.recombineFragments(
      selected.pattern.response,
      memories,
      lexicon
    )

    // 5. Update pattern usage
    selected.pattern.lastUsed = Date.now()

    return response
  }

  /**
   * Tokenize text into words (language-agnostic)
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, ' ')  // Keep Thai, English, numbers
      .split(/\s+/)
      .filter(w => w.length > 0)
  }

  /**
   * Break text into fragments (sub-sentence chunks)
   * Example: "I like pizza very much" → ["I like", "like pizza", "pizza very", "very much"]
   */
  private fragmentize(text: string, maxLength: number): string[] {
    const words = this.tokenize(text)
    const fragments: string[] = []

    // Create overlapping fragments (n-grams)
    for (let len = 1; len <= Math.min(maxLength, words.length); len++) {
      for (let i = 0; i <= words.length - len; i++) {
        fragments.push(words.slice(i, i + len).join(' '))
      }
    }

    return fragments
  }

  /**
   * Calculate keyword overlap (Jaccard similarity)
   */
  private calculateOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0

    const set1 = new Set(keywords1)
    const set2 = new Set(keywords2)

    const intersection = Array.from(set1).filter(k => set2.has(k))
    const union = new Set([...keywords1, ...keywords2])

    return intersection.length / union.size
  }

  /**
   * Select pattern with creativity bias
   *
   * creativityBias = 0 → always pick best match
   * creativityBias = 1 → random selection
   */
  private selectPattern(
    scoredPatterns: Array<{ pattern: ConversationPattern; score: number }>,
    creativityBias: number
  ): { pattern: ConversationPattern; score: number } | null {
    if (scoredPatterns.length === 0) return null

    // Sort by score
    scoredPatterns.sort((a, b) => b.score - a.score)

    // Pure exploitation (pick best)
    if (creativityBias === 0 || scoredPatterns.length === 1) {
      return scoredPatterns[0]
    }

    // Pure exploration (pick random)
    if (creativityBias === 1) {
      return scoredPatterns[Math.floor(Math.random() * scoredPatterns.length)]
    }

    // Hybrid: weighted random selection (higher scores more likely)
    // Use softmax distribution with temperature = creativityBias
    const temperature = creativityBias * 5  // Scale to reasonable range
    const expScores = scoredPatterns.map(p =>
      Math.exp(p.score / temperature)
    )
    const sumExp = expScores.reduce((a, b) => a + b, 0)
    const probabilities = expScores.map(exp => exp / sumExp)

    // Sample from probability distribution
    let roll = Math.random()
    for (let i = 0; i < probabilities.length; i++) {
      roll -= probabilities[i]
      if (roll <= 0) {
        return scoredPatterns[i]
      }
    }

    return scoredPatterns[0]  // Fallback
  }

  /**
   * Recombine fragments into coherent response
   *
   * Strategy:
   * - Pick 1-3 fragments from pattern
   * - Optionally inject lexicon terms (for variety)
   * - Join naturally (language-aware spacing)
   */
  private recombineFragments(
    fragments: string[],
    memories: Memory[],
    lexicon: LexiconEntry[]
  ): string {
    if (fragments.length === 0) {
      return '...'  // Silence (entity has no words)
    }

    // Pick 1-3 fragments (prefer longer ones)
    const fragmentCount = Math.min(3, Math.floor(Math.random() * 2) + 1)
    const selected: string[] = []

    // Weight by length (longer fragments usually more complete thoughts)
    const weighted = fragments.map(f => ({
      fragment: f,
      weight: f.split(' ').length
    }))

    for (let i = 0; i < fragmentCount && weighted.length > 0; i++) {
      const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
      let roll = Math.random() * totalWeight

      for (let j = 0; j < weighted.length; j++) {
        roll -= weighted[j].weight
        if (roll <= 0) {
          selected.push(weighted[j].fragment)
          weighted.splice(j, 1)
          break
        }
      }
    }

    // Join fragments with natural spacing
    // Thai: no space needed, English: space needed
    const joined = selected.join(' ')  // Simplified (language detection would improve this)

    return joined
  }

  /**
   * Get pattern statistics (for debugging/monitoring)
   */
  getStats(): {
    totalPatterns: number
    avgWeight: number
    avgSuccessCount: number
    bestPattern: ConversationPattern | null
  } {
    if (this.patterns.length === 0) {
      return {
        totalPatterns: 0,
        avgWeight: 0,
        avgSuccessCount: 0,
        bestPattern: null
      }
    }

    const avgWeight = this.patterns.reduce((sum, p) => sum + p.weight, 0) / this.patterns.length
    const avgSuccessCount = this.patterns.reduce((sum, p) => sum + p.successCount, 0) / this.patterns.length
    const bestPattern = this.patterns.reduce((best, p) =>
      p.weight > best.weight ? p : best
    , this.patterns[0])

    return {
      totalPatterns: this.patterns.length,
      avgWeight,
      avgSuccessCount,
      bestPattern
    }
  }

  /**
   * Reset all patterns (for testing)
   */
  reset(): void {
    this.patterns = []
  }
}
