/**
 * MDS v5.8 - Emotion Detector
 * Auto-detect emotions from Thai/English text in essence or dialogue
 *
 * Design: Keyword-based NLP for cultural emotional richness
 * Supports backwards compatibility - .mdm files don't need explicit emotion field
 */

import { EmotionalState, EMOTION_BASELINES } from './state'

/**
 * Thai emotion baselines (v5.8) - Comprehensive PAD coverage
 * 40+ emotions covering all PAD space quadrants
 *
 * OPTIMIZED: Delta encoding from neutral baseline (50% size reduction)
 * Format: [dV, dA, dD, dVit?] where d = delta from NEUTRAL
 */

// Neutral baseline for Thai emotions
const NEUTRAL = { valence: 0, arousal: 0.5, dominance: 0.5, vitality: 0.5 }

// Delta-encoded emotion data (compressed format)
const EMOTION_DELTAS_TH: Record<string, [number, number, number, number?]> = {
  // POSITIVE VALENCE + LOW AROUSAL (calm, content)
  'สงบ': [0.3, -0.4, 0, 0.1],
  'สบาย': [0.4, -0.3, 0.1, 0.2],
  'ผ่อนคลาย': [0.3, -0.4, -0.1, 0],
  'พอใจ': [0.5, -0.2, 0.1, 0.1],

  // POSITIVE VALENCE + HIGH AROUSAL (excited, joyful)
  'ดีใจ': [0.7, 0.2, 0.1, 0.3],
  'ตื่นเต้น': [0.5, 0.3, 0, 0.2],
  'สนุก': [0.6, 0.2, 0.1, 0.3],
  'ร่าเริง': [0.6, 0.1, 0.1, 0.2],
  'สะใจ': [0.7, 0.3, 0.3, 0.3],

  // POSITIVE VALENCE + MEDIUM AROUSAL (grateful, proud)
  'กตัญญู': [0.6, -0.1, -0.1, 0.1],
  'ภูมิใจ': [0.7, 0, 0.2, 0.2],
  'ซาบซึ้ง': [0.6, -0.1, -0.1, 0.1],
  'สะเทือนใจ': [0.5, 0.1, -0.1, 0.1],
  'ประทับใจ': [0.6, 0, 0, 0.2],

  // NEUTRAL VALENCE (calm, indifferent)
  'เฉย': [0, -0.2, 0, 0],
  'ปกติ': [0, 0, 0, 0],
  'เพิกเฉย': [-0.1, -0.3, 0.1, -0.1],

  // NEGATIVE VALENCE + LOW AROUSAL (sad, tired)
  'เศร้า': [-0.5, -0.3, -0.2, -0.2],
  'เหงา': [-0.3, -0.3, -0.2, -0.2],
  'อ้างว้าง': [-0.5, -0.4, -0.3, -0.3],
  'เหนื่อยใจ': [-0.4, -0.3, -0.2, -0.3],
  'เหนื่อยกาย': [-0.2, -0.4, -0.1, -0.4],
  'ท้อแท้': [-0.6, -0.3, -0.3, -0.3],
  'หมดหวัง': [-0.8, -0.2, -0.4, -0.4],

  // NEGATIVE VALENCE + MEDIUM AROUSAL (worried, disappointed)
  'กังวล': [-0.4, 0, -0.2, -0.1],
  'เครียด': [-0.5, 0.1, -0.2, -0.2],
  'ผิดหวัง': [-0.5, -0.1, -0.2, -0.2],
  'เสียใจ': [-0.6, -0.1, -0.1, -0.2],
  'เสียดาย': [-0.4, -0.1, -0.1, -0.1],

  // NEGATIVE VALENCE + HIGH AROUSAL (angry, scared)
  'โกรธ': [-0.6, 0.3, 0.2, 0.2],
  'หงุดหงิด': [-0.5, 0.2, 0, 0],
  'รำคาญ': [-0.4, 0.1, -0.1, 0],
  'กลัว': [-0.7, 0.3, -0.4, -0.1],
  'ตกใจ': [-0.5, 0.4, -0.3, 0.1],
  'ตื่นกลัว': [-0.8, 0.4, -0.4, -0.2],

  // SOCIAL/COMPLEX EMOTIONS
  'อาย': [-0.4, 0.1, -0.4, -0.2],
  'อิจฉา': [-0.4, 0.1, -0.2, 0],
  'ริษยา': [-0.5, 0.2, -0.1, 0.1],
  'อดทน': [-0.1, -0.2, 0.2, -0.1],

  // BOREDOM & LISTLESSNESS
  'เบื่อ': [-0.3, -0.3, -0.1, -0.2],
  'เซ็ง': [-0.4, -0.3, -0.2, -0.3],
  'เฉาๆ': [-0.2, -0.4, -0.2, -0.3],
}

// Reconstruct full emotion baselines from deltas (happens at module load, zero runtime cost)
export const EMOTION_BASELINES_TH: Record<string, EmotionalState> = Object.fromEntries(
  Object.entries(EMOTION_DELTAS_TH).map(([key, [dV, dA, dD, dVit]]) => [
    key,
    {
      valence: NEUTRAL.valence + dV,
      arousal: NEUTRAL.arousal + dA,
      dominance: NEUTRAL.dominance + dD,
      vitality: NEUTRAL.vitality + (dVit ?? 0)
    }
  ])
)

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
