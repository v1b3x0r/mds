/**
 * Salience Detector - Info-Physics Field Strength Calculator
 *
 * Philosophy:
 * In info-physics, not all information has equal gravitational pull.
 * Some data (names, emotions, goals) creates stronger fields.
 *
 * This detector calculates field strength (salience) based on:
 * - Semantic type (name > emotion > fact > filler)
 * - Novelty (new concept > repeated concept)
 * - Emotional charge (high arousal/valence > neutral)
 * - Context resonance (relevant to current state > irrelevant)
 *
 * NOT a rule engine. This is physics - fields emerge from properties.
 */

export interface SalienceFactors {
  semanticType: number    // 0-1, based on word type
  novelty: number         // 0-1, is this new info?
  emotionalCharge: number // 0-1, emotional intensity
  contextResonance: number// 0-1, relevance to current state
}

export interface SalienceResult {
  salience: number        // Final field strength (0-2, can exceed 1!)
  factors: SalienceFactors
  reasoning: string       // Why this salience? (for debugging)
}

/**
 * Salience Detector
 *
 * Calculates information field strength based on content analysis.
 * Not ML-based - uses linguistic patterns and heuristics.
 */
export class SalienceDetector {
  // Semantic patterns (language-agnostic where possible)
  private static readonly NAME_PATTERNS = [
    // Thai
    /ชื่อ/,                    // "ชื่อ" anywhere = name context
    /เรียกว่า/,               // "เรียกว่า"
    /ผมชื่อ/,                 // "ผมชื่อ"
    /ฉันชื่อ/,                // "ฉันชื่อ"
    /ชื่อผม/,                 // "ชื่อผม"
    /ชื่อฉัน/,                // "ชื่อฉัน"
    // English
    /(my name is|i'm|i am|call me)/i,
    /name/i                    // "name" anywhere = name context
  ]

  private static readonly EMOTION_WORDS = new Set([
    // Thai
    'รัก', 'เกลียด', 'ดีใจ', 'เศร้า', 'โกรธ', 'กลัว', 'ตื่นเต้น', 'เหงา',
    'ผิดหวัง', 'ภูมิใจ', 'อับอาย', 'สบายใจ', 'กังวล', 'เครียด',
    // English
    'love', 'hate', 'happy', 'sad', 'angry', 'scared', 'excited', 'lonely',
    'disappointed', 'proud', 'ashamed', 'calm', 'worried', 'stressed'
  ])

  private static readonly GOAL_KEYWORDS = new Set([
    // Thai
    'ต้องการ', 'อยาก', 'จะ', 'ฝัน', 'หวัง', 'เป้าหมาย', 'แผน',
    // English
    'want', 'need', 'wish', 'hope', 'goal', 'plan', 'dream'
  ])

  private static readonly FILLER_WORDS = new Set([
    // Thai
    'ครับ', 'ค่ะ', 'นะ', 'เลย', 'แหละ', 'สิ', 'จ้ะ', 'จ๊ะ',
    'เหรอ', 'เหมือนกัน', 'ด้วย', 'ก็', 'แล้ว',
    // English
    'um', 'uh', 'like', 'you know', 'well', 'so', 'just', 'really',
    'actually', 'basically', 'literally'
  ])

  /**
   * Detect salience of a message
   *
   * @param message - Text to analyze
   * @param context - Optional context (previous memories, current emotion)
   * @returns Salience score and breakdown
   */
  static detect(
    message: string,
    context?: {
      knownConcepts?: Set<string>  // Concepts entity already knows
      currentEmotion?: { valence: number; arousal: number }
    }
  ): SalienceResult {
    const normalized = message.toLowerCase().trim()
    const words = this.tokenize(normalized)

    // Factor 1: Semantic Type
    const semanticType = this.detectSemanticType(message, words)

    // Factor 2: Novelty
    const novelty = this.detectNovelty(words, context?.knownConcepts)

    // Factor 3: Emotional Charge
    const emotionalCharge = this.detectEmotionalCharge(words)

    // Factor 4: Context Resonance
    const contextResonance = this.detectContextResonance(
      words,
      context?.currentEmotion
    )

    // SPECIAL CASE: Names are ALWAYS max salience (physics law!)
    // Names create the strongest information field - this is non-negotiable
    if (semanticType >= 1.0) {
      return {
        salience: 1.5,  // Super-strong field for names
        factors: { semanticType, novelty, emotionalCharge, contextResonance },
        reasoning: 'NAME DETECTED - maximum field strength'
      }
    }

    // Combine factors (weighted sum) for non-names
    // Semantic type is most important
    const salience =
      semanticType * 0.5 +       // 50% - what IS this?
      novelty * 0.2 +             // 20% - is it new?
      emotionalCharge * 0.2 +     // 20% - does it have energy?
      contextResonance * 0.1      // 10% - does it fit current state?

    // Boost for multi-factor alignment (synergy)
    let boostedSalience = salience
    if (semanticType > 0.8 && emotionalCharge > 0.5) {
      boostedSalience *= 1.2  // High importance + emotion = extra strong field
    }

    // Generate reasoning
    const reasoning = this.generateReasoning({
      semanticType,
      novelty,
      emotionalCharge,
      contextResonance
    })

    return {
      salience: Math.min(2.0, boostedSalience),  // Cap at 2.0 (allow super-important)
      factors: {
        semanticType,
        novelty,
        emotionalCharge,
        contextResonance
      },
      reasoning
    }
  }

  /**
   * Detect semantic type (what kind of information is this?)
   */
  private static detectSemanticType(message: string, words: string[]): number {
    // 1. Names (highest priority)
    for (const pattern of this.NAME_PATTERNS) {
      if (pattern.test(message)) {
        return 1.0  // Max salience - names are always critical
      }
    }

    // 2. Goals/Intentions
    const hasGoal = words.some(w => this.GOAL_KEYWORDS.has(w))
    if (hasGoal) {
      return 0.85
    }

    // 3. Emotions
    const hasEmotion = words.some(w => this.EMOTION_WORDS.has(w))
    if (hasEmotion) {
      return 0.75
    }

    // 4. Questions (need attention)
    if (message.includes('?') || message.includes('ไหม') || message.includes('หรือ')) {
      return 0.6
    }

    // 5. Filler words (low importance)
    const fillerRatio = words.filter(w => this.FILLER_WORDS.has(w)).length / Math.max(words.length, 1)
    if (fillerRatio > 0.5) {
      return 0.2  // Mostly filler
    }

    // 6. Default (normal statement)
    return 0.5
  }

  /**
   * Detect novelty (is this new information?)
   */
  private static detectNovelty(
    words: string[],
    knownConcepts?: Set<string>
  ): number {
    if (!knownConcepts || knownConcepts.size === 0) {
      return 1.0  // Everything is new to newborn entity
    }

    // Count new vs known words
    const newWords = words.filter(w => !knownConcepts.has(w))
    const noveltyRatio = newWords.length / Math.max(words.length, 1)

    return noveltyRatio
  }

  /**
   * Detect emotional charge (how much energy does this carry?)
   */
  private static detectEmotionalCharge(words: string[]): number {
    // Count emotion words
    const emotionCount = words.filter(w => this.EMOTION_WORDS.has(w)).length

    // Detect intensity markers
    const intensityMarkers = ['มาก', 'เลย', 'สุด', 'จริงๆ', 'very', 'so', 'really', 'extremely']
    const hasIntensity = words.some(w => intensityMarkers.includes(w))

    // Detect exclamation/emphasis
    const hasEmphasis = /[!！]+/.test(words.join(' '))

    let charge = Math.min(emotionCount * 0.3, 0.7)
    if (hasIntensity) charge += 0.2
    if (hasEmphasis) charge += 0.1

    return Math.min(charge, 1.0)
  }

  /**
   * Detect context resonance (does this fit current state?)
   */
  private static detectContextResonance(
    words: string[],
    currentEmotion?: { valence: number; arousal: number }
  ): number {
    if (!currentEmotion) return 0.5  // Neutral if no context

    // If message matches current emotion, higher resonance
    const positiveWords = ['ดี', 'สนุก', 'ชอบ', 'happy', 'good', 'fun', 'like']
    const negativeWords = ['แย่', 'เศร้า', 'เกลียด', 'bad', 'sad', 'hate']

    const hasPositive = words.some(w => positiveWords.includes(w))
    const hasNegative = words.some(w => negativeWords.includes(w))

    if (hasPositive && currentEmotion.valence > 0.5) return 0.8
    if (hasNegative && currentEmotion.valence < 0.5) return 0.8

    return 0.4  // Mismatch or neutral
  }

  /**
   * Tokenize text (language-agnostic)
   */
  private static tokenize(text: string): string[] {
    return text
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s?]/g, ' ')  // Keep Thai, English, numbers, ?
      .split(/\s+/)
      .filter(w => w.length > 0)
  }

  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(factors: SalienceFactors): string {
    const parts: string[] = []

    if (factors.semanticType > 0.8) {
      parts.push('critical info (name/goal)')
    } else if (factors.semanticType > 0.6) {
      parts.push('important info')
    }

    if (factors.novelty > 0.7) {
      parts.push('new concept')
    }

    if (factors.emotionalCharge > 0.5) {
      parts.push('emotionally charged')
    }

    if (factors.contextResonance > 0.6) {
      parts.push('resonates with current state')
    }

    if (parts.length === 0) {
      return 'routine information'
    }

    return parts.join(', ')
  }
}
