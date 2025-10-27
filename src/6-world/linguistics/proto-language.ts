/**
 * MDS v6.1 - Proto-Language Generator
 * Emergent language composition from learned vocabulary
 *
 * Design Philosophy:
 * - "Cultivation, not Control" - let entities create their own language
 * - Mix learned words creatively (code-mixing, creole)
 * - Emotion-driven word selection
 * - Gradual complexity increase as vocabulary grows
 */

export interface ProtoSentenceConfig {
  vocabularyPool: string[]      // Available words to use
  emotion?: {
    valence: number              // -1 to 1
    arousal: number              // 0 to 1
  }
  minWords?: number              // Minimum sentence length (default: 1)
  maxWords?: number              // Maximum sentence length (default: 5)
  allowParticles?: boolean       // Allow Thai particles (ครับ, ค่ะ, นะ)
  allowEmoji?: boolean           // Allow emoji interjections
  creativity?: number            // 0-1, how much to mutate/blend (default: 0.5)
}

/**
 * Proto-language generator
 * Creates emergent sentences from vocabulary pool
 */
export class ProtoLanguageGenerator {
  /**
   * Generate proto-language sentence
   * Mixes learned words creatively based on emotion
   */
  generate(config: ProtoSentenceConfig): string {
    const {
      vocabularyPool,
      emotion,
      minWords = 1,
      maxWords = 5,
      allowParticles = true,
      allowEmoji = true,
      creativity = 0.5
    } = config

    if (vocabularyPool.length === 0) {
      return '...'  // No vocabulary yet
    }

    // Emotion-based filtering
    let pool = [...vocabularyPool]
    if (emotion) {
      pool = this.filterByEmotion(pool, emotion)
    }

    // Determine sentence length (based on emotion arousal)
    const arousal = emotion?.arousal ?? 0.5
    const targetLength = Math.floor(
      minWords + (maxWords - minWords) * (arousal * 0.7 + Math.random() * 0.3)
    )

    // Build sentence
    const words: string[] = []
    for (let i = 0; i < targetLength; i++) {
      if (pool.length === 0) break

      // Pick word (biased towards emotion-appropriate words)
      const idx = Math.floor(Math.random() * Math.min(pool.length, 10))
      let word = pool[idx]

      // Apply creativity mutations
      if (creativity > 0.3 && Math.random() < creativity) {
        word = this.mutateWord(word, creativity)
      }

      words.push(word)

      // Don't reuse same word immediately (unless pool is tiny)
      if (pool.length > 5) {
        pool.splice(idx, 1)
      }
    }

    // Add particles (Thai politeness markers)
    if (allowParticles && Math.random() < 0.3) {
      const particles = ['ครับ', 'ค่ะ', 'นะ', 'เนอะ', 'จ้ะ']
      words.push(particles[Math.floor(Math.random() * particles.length)])
    }

    // Add emoji interjections (emotion-based)
    if (allowEmoji && emotion && Math.random() < 0.2) {
      const emoji = this.getEmotionEmoji(emotion.valence, emotion.arousal)
      if (Math.random() < 0.5) {
        words.unshift(emoji)  // Before sentence
      } else {
        words.push(emoji)     // After sentence
      }
    }

    // Add pauses/hesitations (low arousal = more pauses)
    if (emotion && emotion.arousal < 0.4 && Math.random() < 0.3) {
      const pauses = ['...', '..', 'อืม', 'เอ่อ', 'um', 'uh']
      words.unshift(pauses[Math.floor(Math.random() * pauses.length)])
    }

    return words.join(' ')
  }

  /**
   * Filter vocabulary by emotion context
   * Prefers words that match emotional state
   */
  private filterByEmotion(pool: string[], emotion: { valence: number; arousal: number }): string[] {
    const { valence } = emotion

    // Emotion-word associations (simple heuristic)
    const positiveWords = ['ดี', 'สนุก', 'สบาย', 'happy', 'good', 'love', 'like', 'yay', 'wow', 'ชอบ', 'รัก']
    const negativeWords = ['เศร้า', 'เบื่อ', 'โกรธ', 'กลัว', 'sad', 'angry', 'scared', 'tired', 'boring', 'no']

    // High valence → prefer positive
    if (valence > 0.5) {
      const positive = pool.filter(w => positiveWords.some(p => w.includes(p)))
      if (positive.length > 3) return [...positive, ...pool].slice(0, 20)
    }

    // Low valence → prefer negative
    if (valence < -0.3) {
      const negative = pool.filter(w => negativeWords.some(n => w.includes(n)))
      if (negative.length > 3) return [...negative, ...pool].slice(0, 20)
    }

    // Neutral → mix everything
    return pool
  }

  /**
   * Mutate word creatively
   * Creates pidgin/creole-like variations
   */
  private mutateWord(word: string, creativity: number): string {
    const mutations = [
      // Reduplication (Thai/pidgin style)
      () => {
        if (word.length > 2 && Math.random() < creativity) {
          return `${word}-${word}`  // "good-good", "ดี-ดี"
        }
        return word
      },

      // Shortening (slang)
      () => {
        if (word.length > 4 && Math.random() < creativity * 0.5) {
          return word.slice(0, Math.ceil(word.length * 0.7))  // "computer" → "compu"
        }
        return word
      },

      // Add emphasis (lengthening)
      () => {
        if (Math.random() < creativity * 0.3) {
          return word + word[word.length - 1].repeat(1 + Math.floor(Math.random() * 2))  // "good" → "gooddd"
        }
        return word
      }
    ]

    // Apply random mutation
    const mutation = mutations[Math.floor(Math.random() * mutations.length)]
    return mutation()
  }

  /**
   * Get emoji for emotion state
   */
  private getEmotionEmoji(valence: number, arousal: number): string {
    if (valence > 0.5 && arousal > 0.6) return '✨'
    if (valence > 0.5) return ':)'
    if (valence < -0.3) return ':('
    if (arousal > 0.7) return '!!'
    if (arousal < 0.3) return '...'
    return '~'
  }

  /**
   * Generate response based on user message
   * Attempts to mirror/respond appropriately
   */
  generateResponse(userMessage: string, config: ProtoSentenceConfig): string {
    // Simple heuristics for response generation
    const lower = userMessage.toLowerCase()

    // Greeting detection
    if (/(hi|hello|สวัสดี|หวัดดี)/i.test(lower)) {
      const greetings = config.vocabularyPool.filter(w =>
        /(hi|hello|สวัสดี|หวัดดี|hey)/i.test(w)
      )
      if (greetings.length > 0) {
        const greeting = greetings[Math.floor(Math.random() * greetings.length)]
        return greeting + (Math.random() < 0.3 ? ' ครับ' : '')
      }
    }

    // Question detection (end with ?)
    if (userMessage.includes('?') || /(ไหม|หรือ|อะไร|ทำไม)/i.test(lower)) {
      // Respond with thinking/uncertain words
      const thinkingWords = config.vocabularyPool.filter(w =>
        /(think|คิด|know|รู้|maybe|อาจจะ|ไม่แน่ใจ)/i.test(w)
      )
      if (thinkingWords.length > 0) {
        return this.generate({
          ...config,
          vocabularyPool: [...thinkingWords, ...config.vocabularyPool.slice(0, 10)],
          minWords: 1,
          maxWords: 3
        })
      }
    }

    // Default: generate normal sentence
    return this.generate(config)
  }
}
