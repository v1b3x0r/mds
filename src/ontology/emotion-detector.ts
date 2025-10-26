/**
 * MDS v5.8 - Emotion Detector
 * Auto-detect emotions from Thai/English text in essence or dialogue
 *
 * Design: Keyword-based NLP for cultural emotional richness
 * Supports backwards compatibility - .mdm files don't need explicit emotion field
 */

import { EmotionalState, EMOTION_BASELINES } from './emotion'

/**
 * Thai emotion baselines (v5.8) - Comprehensive PAD coverage
 * 40+ emotions covering all PAD space quadrants
 */
export const EMOTION_BASELINES_TH: Record<string, EmotionalState> = {
  // ============================================
  // POSITIVE VALENCE + LOW AROUSAL (calm, content)
  // ============================================
  'สงบ': { valence: 0.3, arousal: 0.1, dominance: 0.5, vitality: 0.6 },
  'สบาย': { valence: 0.4, arousal: 0.2, dominance: 0.6, vitality: 0.7 },
  'ผ่อนคลาย': { valence: 0.3, arousal: 0.1, dominance: 0.4, vitality: 0.5 },
  'พอใจ': { valence: 0.5, arousal: 0.3, dominance: 0.6, vitality: 0.6 },

  // ============================================
  // POSITIVE VALENCE + HIGH AROUSAL (excited, joyful)
  // ============================================
  'ดีใจ': { valence: 0.7, arousal: 0.7, dominance: 0.6, vitality: 0.8 },
  'ตื่นเต้น': { valence: 0.5, arousal: 0.8, dominance: 0.5, vitality: 0.7 },
  'สนุก': { valence: 0.6, arousal: 0.7, dominance: 0.6, vitality: 0.8 },
  'ร่าเริง': { valence: 0.6, arousal: 0.6, dominance: 0.6, vitality: 0.7 },
  'สะใจ': { valence: 0.7, arousal: 0.8, dominance: 0.8, vitality: 0.8 },

  // ============================================
  // POSITIVE VALENCE + MEDIUM AROUSAL (grateful, proud)
  // ============================================
  'กตัญญู': { valence: 0.6, arousal: 0.4, dominance: 0.4, vitality: 0.6 },
  'ภูมิใจ': { valence: 0.7, arousal: 0.5, dominance: 0.7, vitality: 0.7 },
  'ซาบซึ้ง': { valence: 0.6, arousal: 0.4, dominance: 0.4, vitality: 0.6 },
  'สะเทือนใจ': { valence: 0.5, arousal: 0.6, dominance: 0.4, vitality: 0.6 },
  'ประทับใจ': { valence: 0.6, arousal: 0.5, dominance: 0.5, vitality: 0.7 },

  // ============================================
  // NEUTRAL VALENCE (calm, indifferent)
  // ============================================
  'เฉย': { valence: 0.0, arousal: 0.3, dominance: 0.5, vitality: 0.5 },
  'ปกติ': { valence: 0.0, arousal: 0.5, dominance: 0.5, vitality: 0.5 },
  'เพิกเฉย': { valence: -0.1, arousal: 0.2, dominance: 0.6, vitality: 0.4 },

  // ============================================
  // NEGATIVE VALENCE + LOW AROUSAL (sad, tired)
  // ============================================
  'เศร้า': { valence: -0.5, arousal: 0.2, dominance: 0.3, vitality: 0.3 },
  'เหงา': { valence: -0.3, arousal: 0.2, dominance: 0.3, vitality: 0.3 },
  'อ้างว้าง': { valence: -0.5, arousal: 0.1, dominance: 0.2, vitality: 0.2 },
  'เหนื่อยใจ': { valence: -0.4, arousal: 0.2, dominance: 0.3, vitality: 0.2 },
  'เหนื่อยกาย': { valence: -0.2, arousal: 0.1, dominance: 0.4, vitality: 0.1 },
  'ท้อแท้': { valence: -0.6, arousal: 0.2, dominance: 0.2, vitality: 0.2 },
  'หมดหวัง': { valence: -0.8, arousal: 0.3, dominance: 0.1, vitality: 0.1 },

  // ============================================
  // NEGATIVE VALENCE + MEDIUM AROUSAL (worried, disappointed)
  // ============================================
  'กังวล': { valence: -0.4, arousal: 0.5, dominance: 0.3, vitality: 0.4 },
  'เครียด': { valence: -0.5, arousal: 0.6, dominance: 0.3, vitality: 0.3 },
  'ผิดหวัง': { valence: -0.5, arousal: 0.4, dominance: 0.3, vitality: 0.3 },
  'เสียใจ': { valence: -0.6, arousal: 0.4, dominance: 0.4, vitality: 0.3 },
  'เสียดาย': { valence: -0.4, arousal: 0.4, dominance: 0.4, vitality: 0.4 },

  // ============================================
  // NEGATIVE VALENCE + HIGH AROUSAL (angry, scared)
  // ============================================
  'โกรธ': { valence: -0.6, arousal: 0.8, dominance: 0.7, vitality: 0.7 },
  'หงุดหงิด': { valence: -0.5, arousal: 0.7, dominance: 0.5, vitality: 0.5 },
  'รำคาญ': { valence: -0.4, arousal: 0.6, dominance: 0.4, vitality: 0.5 },
  'กลัว': { valence: -0.7, arousal: 0.8, dominance: 0.1, vitality: 0.4 },
  'ตกใจ': { valence: -0.5, arousal: 0.9, dominance: 0.2, vitality: 0.6 },
  'ตื่นกลัว': { valence: -0.8, arousal: 0.9, dominance: 0.1, vitality: 0.3 },

  // ============================================
  // SOCIAL/COMPLEX EMOTIONS
  // ============================================
  'อาย': { valence: -0.4, arousal: 0.6, dominance: 0.1, vitality: 0.3 },
  'อิจฉา': { valence: -0.4, arousal: 0.6, dominance: 0.3, vitality: 0.5 },
  'ริษยา': { valence: -0.5, arousal: 0.7, dominance: 0.4, vitality: 0.6 },
  'อดทน': { valence: -0.1, arousal: 0.3, dominance: 0.7, vitality: 0.4 },

  // ============================================
  // BOREDOM & LISTLESSNESS
  // ============================================
  'เบื่อ': { valence: -0.3, arousal: 0.2, dominance: 0.4, vitality: 0.3 },
  'เซ็ง': { valence: -0.4, arousal: 0.2, dominance: 0.3, vitality: 0.2 },
  'เฉาๆ': { valence: -0.2, arousal: 0.1, dominance: 0.3, vitality: 0.2 },
}

/**
 * Thai emotion keywords → emotion labels
 * Maps descriptive words/phrases to emotion baselines
 */
export const THAI_EMOTION_KEYWORDS: Record<string, string> = {
  // ความอาย (shame/shyness)
  'ขี้อาย': 'อาย',
  'อาย': 'อาย',
  'อับอาย': 'อาย',
  'เขินอาย': 'อาย',

  // ความเหงา (loneliness)
  'เหงา': 'เหงา',
  'โดดเดี่ยว': 'เหงา',
  'อ้างว้าง': 'อ้างว้าง',
  'อยู่คนเดียว': 'เหงา',

  // ความเหนื่อย (fatigue)
  'เหนื่อยใจ': 'เหนื่อยใจ',
  'เหนื่อยกาย': 'เหนื่อยกาย',
  'เหนื่อย': 'เหนื่อยกาย',
  'เพลีย': 'เหนื่อยกาย',
  'อ่อนล้า': 'เหนื่อยใจ',

  // ความโกรธ/หงุดหงิด (anger/irritation)
  'โกรธ': 'angry',
  'หงุดหงิด': 'หงุดหงิด',
  'รำคาญ': 'รำคาญ',
  'ขี้โมโห': 'angry',

  // ความเบื่อ (boredom)
  'เบื่อ': 'เบื่อ',
  'เซ็ง': 'เซ็ง',
  'เบื่อหน่าย': 'เบื่อ',

  // ความสุข (happiness)
  'มีความสุข': 'happy',
  'ร่าเริง': 'happy',
  'สนุกสนาน': 'excited',
  'ตื่นเต้น': 'excited',

  // ความเศร้า (sadness)
  'เศร้า': 'sad',
  'เสียใจ': 'เสียใจ',
  'ผิดหวัง': 'ผิดหวัง',

  // อารมณ์ซับซ้อน (complex emotions)
  'อิจฉา': 'อิจฉา',
  'ริษยา': 'ริษยา',
  'สะใจ': 'สะใจ',
  'สะเทือนใจ': 'สะเทือนใจ',
  'ซาบซึ้ง': 'ซาบซึ้ง',
  'กตัญญู': 'กตัญญู',
}

/**
 * English emotion keywords → emotion labels
 */
export const ENGLISH_EMOTION_KEYWORDS: Record<string, string> = {
  'shy': 'อาย',
  'ashamed': 'อาย',
  'embarrassed': 'อาย',

  'lonely': 'เหงา',
  'isolated': 'เหงา',
  'alone': 'เหงา',

  'tired': 'เหนื่อยกาย',
  'exhausted': 'เหนื่อยใจ',
  'fatigued': 'เหนื่อยกาย',
  'drained': 'เหนื่อยใจ',
  'burnt out': 'เหนื่อยใจ',
  'burnout': 'เหนื่อยใจ',

  'angry': 'angry',
  'irritated': 'หงุดหงิด',
  'annoyed': 'รำคาญ',

  'bored': 'เบื่อ',
  'fed up': 'เซ็ง',

  'happy': 'happy',
  'excited': 'excited',
  'joyful': 'happy',

  'sad': 'sad',
  'disappointed': 'ผิดหวัง',
  'regretful': 'เสียดาย',

  'envious': 'อิจฉา',
  'jealous': 'ริษยา',
  'grateful': 'กตัญญู',
  'touched': 'สะเทือนใจ',
  'moved': 'ซาบซึ้ง',
}

/**
 * Detect emotion from text (essence or dialogue)
 *
 * @param text - Text to analyze (Thai or English)
 * @returns Detected EmotionalState or null
 *
 * @example
 * detectEmotionFromText("เด็กขี้อาย")  // → PAD for "อาย"
 * detectEmotionFromText("A shy kid")   // → Same PAD
 */
export function detectEmotionFromText(text: string): EmotionalState | null {
  if (!text) return null

  const normalized = text.toLowerCase()

  // Try Thai keywords first
  for (const [keyword, emotionLabel] of Object.entries(THAI_EMOTION_KEYWORDS)) {
    if (normalized.includes(keyword.toLowerCase())) {
      // Look up emotion state
      if (EMOTION_BASELINES_TH[emotionLabel]) {
        return { ...EMOTION_BASELINES_TH[emotionLabel] }
      }
      const baselineEmotion = (EMOTION_BASELINES as Record<string, EmotionalState>)[emotionLabel]
      if (baselineEmotion) {
        return { ...baselineEmotion }
      }
    }
  }

  // Try English keywords
  for (const [keyword, emotionLabel] of Object.entries(ENGLISH_EMOTION_KEYWORDS)) {
    if (normalized.includes(keyword.toLowerCase())) {
      // Look up emotion state
      if (EMOTION_BASELINES_TH[emotionLabel]) {
        return { ...EMOTION_BASELINES_TH[emotionLabel] }
      }
      const baselineEmotion = (EMOTION_BASELINES as Record<string, EmotionalState>)[emotionLabel]
      if (baselineEmotion) {
        return { ...baselineEmotion }
      }
    }
  }

  return null
}

/**
 * Detect multiple emotions from text (for complex descriptions)
 *
 * @example
 * detectAllEmotions("เด็กขี้อาย เหงา")  // → ["อาย", "เหงา"]
 */
export function detectAllEmotions(text: string): string[] {
  if (!text) return []

  const normalized = text.toLowerCase()
  const detected: string[] = []

  // Thai keywords
  for (const [keyword, emotionLabel] of Object.entries(THAI_EMOTION_KEYWORDS)) {
    if (normalized.includes(keyword.toLowerCase()) && !detected.includes(emotionLabel)) {
      detected.push(emotionLabel)
    }
  }

  // English keywords
  for (const [keyword, emotionLabel] of Object.entries(ENGLISH_EMOTION_KEYWORDS)) {
    if (normalized.includes(keyword.toLowerCase()) && !detected.includes(emotionLabel)) {
      detected.push(emotionLabel)
    }
  }

  return detected
}

/**
 * Blend multiple emotions into single PAD state
 *
 * @example
 * const emotions = ["อาย", "เหงา"]
 * blendMultipleEmotions(emotions)  // → Averaged PAD
 */
export function blendMultipleEmotions(emotionLabels: string[]): EmotionalState | null {
  if (emotionLabels.length === 0) return null

  const states: EmotionalState[] = []

  for (const label of emotionLabels) {
    if (EMOTION_BASELINES_TH[label]) {
      states.push(EMOTION_BASELINES_TH[label])
    } else {
      const baselineEmotion = (EMOTION_BASELINES as Record<string, EmotionalState>)[label]
      if (baselineEmotion) {
        states.push(baselineEmotion)
      }
    }
  }

  if (states.length === 0) return null

  // Average all dimensions
  const blended: EmotionalState = {
    valence: 0,
    arousal: 0,
    dominance: 0,
    vitality: 0
  }

  for (const state of states) {
    blended.valence += state.valence
    blended.arousal += state.arousal
    blended.dominance += state.dominance
    blended.vitality! += (state.vitality || 0.5)
  }

  blended.valence /= states.length
  blended.arousal /= states.length
  blended.dominance /= states.length
  blended.vitality! /= states.length

  return blended
}

/**
 * Find closest Thai emotion label from PAD state
 *
 * @example
 * const state = { valence: -0.4, arousal: 0.2, dominance: 0.3 }
 * findClosestThaiEmotion(state)  // → "เหนื่อยใจ"
 */
export function findClosestThaiEmotion(state: EmotionalState): string {
  let closest = 'ปกติ'
  let minDistance = Infinity

  // Helper: Euclidean distance in PAD space
  const distance = (a: EmotionalState, b: EmotionalState) => {
    const dv = a.valence - b.valence
    const da = a.arousal - b.arousal
    const dd = a.dominance - b.dominance
    const dvit = (a.vitality || 0.5) - (b.vitality || 0.5)
    return Math.sqrt(dv * dv + da * da + dd * dd + dvit * dvit)
  }

  // Search Thai baselines
  for (const [label, baseline] of Object.entries(EMOTION_BASELINES_TH)) {
    const dist = distance(state, baseline)
    if (dist < minDistance) {
      minDistance = dist
      closest = label
    }
  }

  // If no close match, fallback to English baselines
  if (minDistance > 0.6) {
    for (const [label, baseline] of Object.entries(EMOTION_BASELINES)) {
      const dist = distance(state, baseline)
      if (dist < minDistance) {
        minDistance = dist
        closest = label
      }
    }
  }

  return closest
}
