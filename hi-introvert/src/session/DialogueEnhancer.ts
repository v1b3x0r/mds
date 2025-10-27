/**
 * Hi-Introvert: Dialogue Enhancer (v6.5)
 *
 * Adds natural variation and emotional breathing to dialogue without breaking ontology-first.
 * All modifications are NON-INTRUSIVE - they enhance, not replace, existing systems.
 *
 * Philosophy: "微調整 (Micro-tuning)" - tiny variations that compound into naturalness
 */

import type { Entity } from '@v1b3x0r/mds-core'

/**
 * Micro-variation injector config
 */
export interface MicroVariationConfig {
  /** Enable emotional breathing (slight variation in phrasing based on PAD drift) */
  emotionalBreathing: boolean
  /** Enable memory-aware context (use recent memories to influence word choice) */
  memoryContext: boolean
  /** Enable repetition damping (track recent phrases to avoid same response) */
  repetitionDamping: boolean
}

/**
 * Micro-variation token types
 */
interface MicroToken {
  type: 'prefix' | 'suffix' | 'modifier'
  variants: string[]
  emotionRange?: { minValence?: number; maxValence?: number; minArousal?: number; maxArousal?: number }
}

/**
 * Dialogue Enhancer
 *
 * Adds subtle variations to dialogue output based on:
 * - Emotional state (PAD model)
 * - Recent memories
 * - Conversation history (avoid repetition)
 */
export class DialogueEnhancer {
  private config: MicroVariationConfig
  private recentPhrases: string[] = []
  private maxRecentPhrases = 20

  // Micro-variation tokens (Thai + English)
  private microTokens: Record<string, MicroToken[]> = {
    // Prefixes (add emotional breathing)
    'prefix_th': [
      { type: 'prefix', variants: ['เอ่อ... ', 'อืม... ', ''], emotionRange: { minValence: -0.3, maxValence: 0.3 } },
      { type: 'prefix', variants: ['จริงๆแล้ว ', 'ที่จริง ', ''], emotionRange: { minValence: 0.2 } },
      { type: 'prefix', variants: ['*เงียบไป 2 วินาที*\n', '*ใช้เวลาคิด*\n', ''], emotionRange: { minArousal: 0.3, maxArousal: 0.6 } }
    ],
    'prefix_en': [
      { type: 'prefix', variants: ['um... ', 'uh... ', 'well... ', ''], emotionRange: { minValence: -0.3, maxValence: 0.3 } },
      { type: 'prefix', variants: ['actually, ', 'so, ', ''], emotionRange: { minValence: 0.2 } },
      { type: 'prefix', variants: ['*pauses for 2 seconds*\n', '*thinks for a moment*\n', ''], emotionRange: { minArousal: 0.3, maxArousal: 0.6 } }
    ],

    // Suffixes (add emotional tail)
    'suffix_th': [
      { type: 'suffix', variants: [' นะ', ' ครับ', ''], emotionRange: { minValence: 0.3 } },
      { type: 'suffix', variants: [' ...', ''], emotionRange: { maxValence: -0.2 } },
      { type: 'suffix', variants: [' !!', ' !', ''], emotionRange: { minArousal: 0.7 } }
    ],
    'suffix_en': [
      { type: 'suffix', variants: [' :)', '', ' hehe'], emotionRange: { minValence: 0.5 } },
      { type: 'suffix', variants: [' ...', ''], emotionRange: { maxValence: -0.2 } },
      { type: 'suffix', variants: [' !!', ' !', ''], emotionRange: { minArousal: 0.7 } }
    ],

    // Modifiers (replace repetitive words)
    'modifier_th': [
      { type: 'modifier', variants: ['เข้าใจ', 'รู้แล้ว', 'เข้าใจครับ', 'เข้าใจละ'] },
      { type: 'modifier', variants: ['สวัสดี', 'หวัดดี', 'ว่าไง', 'ดีครับ'] },
      { type: 'modifier', variants: ['ขอโทษ', 'ขอโทษนะ', 'ขอโทษด้วย', 'sorry'] }
    ],
    'modifier_en': [
      { type: 'modifier', variants: ['understand', 'get it', 'got it', 'I see'] },
      { type: 'modifier', variants: ['hello', 'hi', 'hey', 'what\'s up'] },
      { type: 'modifier', variants: ['sorry', 'my bad', 'oops', 'sorry about that'] }
    ]
  }

  constructor(config: Partial<MicroVariationConfig> = {}) {
    this.config = {
      emotionalBreathing: config.emotionalBreathing ?? true,
      memoryContext: config.memoryContext ?? true,
      repetitionDamping: config.repetitionDamping ?? true
    }
  }

  /**
   * Enhance dialogue with micro-variations
   *
   * @param originalPhrase - Base phrase from MDM/built-in/proto-lang
   * @param entity - Entity speaking (for emotion state)
   * @param language - 'th' or 'en'
   * @returns Enhanced phrase with natural variations
   */
  enhance(originalPhrase: string, entity: Entity, language: 'th' | 'en' = 'th'): string {
    let enhanced = originalPhrase

    // Skip if empty or too short
    if (!enhanced || enhanced.trim().length < 2) {
      return enhanced
    }

    // 1. Emotional Breathing (add prefix/suffix based on PAD state)
    if (this.config.emotionalBreathing) {
      enhanced = this.applyEmotionalBreathing(enhanced, entity, language)
    }

    // 2. Repetition Damping (check if phrase was used recently)
    if (this.config.repetitionDamping) {
      enhanced = this.applyRepetitionDamping(enhanced, entity, language)
    }

    // Track this phrase
    this.trackPhrase(enhanced)

    return enhanced
  }

  /**
   * Apply emotional breathing (subtle prefix/suffix based on emotion)
   */
  private applyEmotionalBreathing(phrase: string, entity: Entity, language: 'th' | 'en'): string {
    const emotion = entity.emotion
    if (!emotion) return phrase

    const valence = emotion.valence
    const arousal = emotion.arousal

    // Select appropriate micro-tokens
    const prefixTokens = this.microTokens[`prefix_${language}`]
    const suffixTokens = this.microTokens[`suffix_${language}`]

    // Add prefix (30% chance)
    if (Math.random() < 0.3 && prefixTokens) {
      const validPrefixes = prefixTokens.filter(token => {
        if (!token.emotionRange) return true
        const { minValence = -1, maxValence = 1, minArousal = 0, maxArousal = 1 } = token.emotionRange
        return valence >= minValence && valence <= maxValence &&
               arousal >= minArousal && arousal <= maxArousal
      })

      if (validPrefixes.length > 0) {
        const selectedToken = validPrefixes[Math.floor(Math.random() * validPrefixes.length)]
        const variant = selectedToken.variants[Math.floor(Math.random() * selectedToken.variants.length)]
        phrase = variant + phrase
      }
    }

    // Add suffix (25% chance)
    if (Math.random() < 0.25 && suffixTokens) {
      const validSuffixes = suffixTokens.filter(token => {
        if (!token.emotionRange) return true
        const { minValence = -1, maxValence = 1, minArousal = 0, maxArousal = 1 } = token.emotionRange
        return valence >= minValence && valence <= maxValence &&
               arousal >= minArousal && arousal <= maxArousal
      })

      if (validSuffixes.length > 0) {
        const selectedToken = validSuffixes[Math.floor(Math.random() * validSuffixes.length)]
        const variant = selectedToken.variants[Math.floor(Math.random() * selectedToken.variants.length)]
        phrase = phrase + variant
      }
    }

    return phrase
  }

  /**
   * Apply repetition damping (if phrase was used recently, try to vary it)
   */
  private applyRepetitionDamping(phrase: string, entity: Entity, language: 'th' | 'en'): string {
    // Check if phrase (or very similar) was used recently
    const normalized = phrase.toLowerCase().trim()
    const recentMatch = this.recentPhrases.find(recent => {
      const recentNormalized = recent.toLowerCase().trim()
      // Exact match or very high similarity (>80%)
      return recentNormalized === normalized || this.similarity(recentNormalized, normalized) > 0.8
    })

    if (!recentMatch) {
      return phrase  // Fresh phrase, no damping needed
    }

    // Try to apply modifier substitution (20% chance)
    if (Math.random() < 0.2) {
      const modifierTokens = this.microTokens[`modifier_${language}`]
      if (modifierTokens) {
        for (const token of modifierTokens) {
          for (const variant of token.variants) {
            if (phrase.includes(variant)) {
              // Replace with a different variant
              const otherVariants = token.variants.filter(v => v !== variant)
              if (otherVariants.length > 0) {
                const newVariant = otherVariants[Math.floor(Math.random() * otherVariants.length)]
                return phrase.replace(variant, newVariant)
              }
            }
          }
        }
      }
    }

    // If no substitution possible, add a prefix/suffix to vary it
    const emotion = entity.emotion
    if (emotion && Math.random() < 0.4) {
      const prefixTokens = this.microTokens[`prefix_${language}`]
      if (prefixTokens && prefixTokens.length > 0) {
        const token = prefixTokens[Math.floor(Math.random() * prefixTokens.length)]
        const variant = token.variants[Math.floor(Math.random() * token.variants.length)]
        if (variant) {
          phrase = variant + phrase
        }
      }
    }

    return phrase
  }

  /**
   * Track phrase in recent history
   */
  private trackPhrase(phrase: string): void {
    this.recentPhrases.push(phrase)
    if (this.recentPhrases.length > this.maxRecentPhrases) {
      this.recentPhrases.shift()
    }
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

  /**
   * Get memory-aware context keys (for future extension)
   * Returns keywords from recent strong memories to influence dialogue
   */
  getMemoryContextKeys(entity: Entity, limit: number = 5): string[] {
    if (!this.config.memoryContext || !entity.memory) {
      return []
    }

    // Get recent strong memories (salience > 0.7)
    const strongMemories = entity.memory.memories
      .filter(m => m.salience > 0.7)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)

    // Extract subjects as context keys
    return strongMemories.map(m => m.subject)
  }

  /**
   * Clear recent phrase history
   */
  clearHistory(): void {
    this.recentPhrases = []
  }

  /**
   * Export state (for persistence)
   */
  toJSON() {
    return {
      config: this.config,
      recentPhrases: this.recentPhrases
    }
  }

  /**
   * Restore state (from persistence)
   */
  static fromJSON(data: { config: MicroVariationConfig; recentPhrases: string[] }): DialogueEnhancer {
    const enhancer = new DialogueEnhancer(data.config)
    enhancer.recentPhrases = data.recentPhrases || []
    return enhancer
  }
}
