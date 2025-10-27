/**
 * Hi-Introvert: Phrase Selector (v6.5 Phase 2)
 *
 * Smart phrase selection that considers:
 * - Recent phrase history (avoid repetition)
 * - Emotional state (weight phrases that match current mood)
 * - Memory relevance (prefer phrases that reference known concepts)
 *
 * Philosophy: "Weighted Randomness" - not purely random, but probabilistically guided
 */

import type { Entity } from '@v1b3x0r/mds-core'

/**
 * Phrase with metadata for smart selection
 */
export interface WeightedPhrase {
  text: string
  weight: number  // 0-1, higher = more likely to be selected
  reason?: string  // Debug: why this weight was assigned
}

/**
 * Selection context
 */
export interface SelectionContext {
  /** Recent phrases used (to avoid repetition) */
  recentPhrases: string[]
  /** User message (for contextual matching) */
  userMessage?: string
  /** Memory context keys (for relevance weighting) */
  memoryKeys?: string[]
}

/**
 * Phrase Selector
 *
 * Intelligently selects from multiple phrase options using weighted probability.
 */
export class PhraseSelector {
  private maxHistory = 50  // Track last 50 phrases

  constructor() {}

  /**
   * Select best phrase from candidates using weighted probability
   *
   * @param candidates - Array of phrase candidates
   * @param entity - Entity that will speak (for emotion state)
   * @param context - Selection context (recent phrases, user message, etc.)
   * @returns Selected phrase
   */
  select(
    candidates: string[],
    entity: Entity,
    context: SelectionContext = { recentPhrases: [] }
  ): string {
    if (candidates.length === 0) {
      return '...'  // Fallback for empty candidates
    }

    if (candidates.length === 1) {
      return candidates[0]  // Only one option
    }

    // Calculate weights for each candidate
    const weightedPhrases = candidates.map(phrase => {
      const weight = this.calculateWeight(phrase, entity, context)
      return { text: phrase, weight }
    })

    // Select using weighted random
    return this.weightedRandomSelect(weightedPhrases)
  }

  /**
   * Calculate weight for a phrase based on multiple factors
   */
  private calculateWeight(
    phrase: string,
    entity: Entity,
    context: SelectionContext
  ): number {
    let weight = 1.0  // Base weight

    // Factor 1: Repetition penalty (reduce weight if used recently)
    const repetitionPenalty = this.getRepetitionPenalty(phrase, context.recentPhrases)
    weight *= (1 - repetitionPenalty)

    // Factor 2: Emotion alignment (boost weight if phrase matches emotion)
    const emotionBoost = this.getEmotionAlignment(phrase, entity)
    weight *= (1 + emotionBoost)

    // Factor 3: Memory relevance (boost if phrase references memory)
    if (context.memoryKeys && context.memoryKeys.length > 0) {
      const memoryBoost = this.getMemoryRelevance(phrase, context.memoryKeys)
      weight *= (1 + memoryBoost)
    }

    // Factor 4: User message context (boost if phrase responds appropriately)
    if (context.userMessage) {
      const contextBoost = this.getContextAlignment(phrase, context.userMessage)
      weight *= (1 + contextBoost)
    }

    // Clamp weight to reasonable range [0.1, 3.0]
    return Math.max(0.1, Math.min(3.0, weight))
  }

  /**
   * Get repetition penalty (0-0.9)
   * Higher penalty if phrase was used very recently
   */
  private getRepetitionPenalty(phrase: string, recentPhrases: string[]): number {
    if (recentPhrases.length === 0) return 0

    const normalizedPhrase = phrase.toLowerCase().trim()

    // Check last 10 phrases
    const recentWindow = recentPhrases.slice(0, 10)

    // Exact match in last 3 phrases → heavy penalty
    if (recentWindow.slice(0, 3).some(p => p.toLowerCase().trim() === normalizedPhrase)) {
      return 0.9  // 90% penalty
    }

    // Exact match in last 10 phrases → medium penalty
    if (recentWindow.some(p => p.toLowerCase().trim() === normalizedPhrase)) {
      return 0.6  // 60% penalty
    }

    // Similar phrase (>70% similarity) in last 5 phrases → light penalty
    const similarMatch = recentWindow.slice(0, 5).some(p => {
      return this.similarity(p, phrase) > 0.7
    })

    if (similarMatch) {
      return 0.3  // 30% penalty
    }

    return 0  // No penalty
  }

  /**
   * Get emotion alignment boost (0-0.5)
   * Boost phrases that contain emotion-appropriate words
   */
  private getEmotionAlignment(phrase: string, entity: Entity): number {
    const emotion = entity.emotion
    if (!emotion) return 0

    const { valence, arousal } = emotion
    const lowerPhrase = phrase.toLowerCase()

    // Positive valence → boost positive words
    if (valence > 0.5) {
      const positiveWords = ['!', 'yay', 'good', 'nice', 'love', 'ดี', 'ชอบ', 'เย้', ':)', '✨']
      if (positiveWords.some(word => lowerPhrase.includes(word))) {
        return 0.5
      }
    }

    // Negative valence → boost negative/sad words
    if (valence < -0.3) {
      const negativeWords = ['...', 'sorry', 'oh', 'down', 'ขอโทษ', 'เสียใจ', 'โอ้']
      if (negativeWords.some(word => lowerPhrase.includes(word))) {
        return 0.4
      }
    }

    // High arousal → boost energetic words
    if (arousal > 0.7) {
      const energeticWords = ['!', '!!', 'wow', 'really', 'amazing', 'ว้าว', 'เจ๋ง', '*']
      if (energeticWords.some(word => lowerPhrase.includes(word))) {
        return 0.5
      }
    }

    // Low arousal → boost calm/quiet words
    if (arousal < 0.3) {
      const calmWords = ['...', 'yawn', 'quiet', 'หาว', 'เงียบ', 'zzz']
      if (calmWords.some(word => lowerPhrase.includes(word))) {
        return 0.4
      }
    }

    return 0  // No boost
  }

  /**
   * Get memory relevance boost (0-0.3)
   * Boost if phrase references a memory keyword
   */
  private getMemoryRelevance(phrase: string, memoryKeys: string[]): number {
    const lowerPhrase = phrase.toLowerCase()

    for (const key of memoryKeys) {
      if (lowerPhrase.includes(key.toLowerCase())) {
        return 0.3  // Phrase references a memory!
      }
    }

    return 0
  }

  /**
   * Get context alignment boost (0-0.2)
   * Boost if phrase appropriately responds to user message
   */
  private getContextAlignment(phrase: string, userMessage: string): number {
    const lowerPhrase = phrase.toLowerCase()
    const lowerUser = userMessage.toLowerCase()

    // If user asks question, prefer questioning/thinking phrases
    if (lowerUser.includes('?')) {
      if (lowerPhrase.includes('?') || lowerPhrase.includes('hmm') || lowerPhrase.includes('อืม')) {
        return 0.2
      }
    }

    // If user uses exclamation, prefer excited phrases
    if (lowerUser.includes('!')) {
      if (lowerPhrase.includes('!') || lowerPhrase.includes('wow') || lowerPhrase.includes('ว้าว')) {
        return 0.2
      }
    }

    // If user message is long (>50 chars), prefer thoughtful phrases
    if (userMessage.length > 50) {
      if (lowerPhrase.includes('think') || lowerPhrase.includes('คิด') || lowerPhrase.includes('...')) {
        return 0.15
      }
    }

    return 0
  }

  /**
   * Weighted random selection
   * Higher weight = higher probability of selection
   */
  private weightedRandomSelect(weightedPhrases: WeightedPhrase[]): string {
    // Calculate total weight
    const totalWeight = weightedPhrases.reduce((sum, p) => sum + p.weight, 0)

    if (totalWeight === 0) {
      // All weights are 0, fallback to random
      return weightedPhrases[Math.floor(Math.random() * weightedPhrases.length)].text
    }

    // Generate random value in range [0, totalWeight)
    let random = Math.random() * totalWeight

    // Select phrase based on cumulative weight
    for (const wp of weightedPhrases) {
      random -= wp.weight
      if (random <= 0) {
        return wp.text
      }
    }

    // Fallback (shouldn't reach here)
    return weightedPhrases[weightedPhrases.length - 1].text
  }

  /**
   * Calculate string similarity (Levenshtein-based, simplified)
   */
  private similarity(a: string, b: string): number {
    if (a === b) return 1
    if (a.length === 0 || b.length === 0) return 0

    const longer = a.length > b.length ? a : b
    const shorter = a.length > b.length ? b : a

    const editDistance = this.levenshtein(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Levenshtein distance (edit distance between strings)
   */
  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,  // substitution
            matrix[i][j - 1] + 1,      // insertion
            matrix[i - 1][j] + 1       // deletion
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }
}
