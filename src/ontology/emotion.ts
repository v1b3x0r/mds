/**
 * MDS v5.0 - Emotional State System
 * PAD model (Pleasure-Arousal-Dominance)
 *
 * Design principles:
 * - Continuous values enable smooth transitions
 * - More expressive than discrete emotions ("happy", "sad")
 * - Maps naturally to visual properties (color, size, motion)
 *
 * Reference: Mehrabian & Russell (1974)
 * https://en.wikipedia.org/wiki/PAD_emotional_state_model
 */

/**
 * Emotional state using PAD model
 *
 * @property valence - Pleasure dimension: Positive (1) to Negative (-1)
 * @property arousal - Arousal dimension: Calm (0) to Excited (1)
 * @property dominance - Dominance dimension: Submissive (0) to Dominant (1)
 *
 * @example
 * // Happy: high pleasure, moderate arousal, neutral dominance
 * { valence: 0.8, arousal: 0.6, dominance: 0.5 }
 *
 * // Anxious: low pleasure, high arousal, low dominance
 * { valence: -0.3, arousal: 0.9, dominance: 0.2 }
 *
 * // Content: moderate pleasure, low arousal, neutral dominance
 * { valence: 0.5, arousal: 0.2, dominance: 0.5 }
 */
export interface EmotionalState {
  valence: number      // -1..1 (negative to positive)
  arousal: number      // 0..1 (calm to excited)
  dominance: number    // 0..1 (submissive to dominant)
}

/**
 * Emotion change delta (for applying effects)
 */
export type EmotionalDelta = Partial<EmotionalState>

/**
 * Clamp value to range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Blend two emotional states
 *
 * @param a - First emotion
 * @param b - Second emotion
 * @param t - Blend factor (0 = fully a, 1 = fully b)
 * @returns Blended emotion
 */
export function blendEmotions(
  a: EmotionalState,
  b: EmotionalState,
  t: number
): EmotionalState {
  return {
    valence: lerp(a.valence, b.valence, t),
    arousal: lerp(a.arousal, b.arousal, t),
    dominance: lerp(a.dominance, b.dominance, t)
  }
}

/**
 * Calculate distance between two emotional states
 * Uses Euclidean distance in PAD space
 *
 * @param a - First emotion
 * @param b - Second emotion
 * @returns Distance (0..~1.7)
 */
export function emotionDistance(
  a: EmotionalState,
  b: EmotionalState
): number {
  const dv = a.valence - b.valence
  const da = a.arousal - b.arousal
  const dd = a.dominance - b.dominance
  return Math.sqrt(dv * dv + da * da + dd * dd)
}

/**
 * Apply emotional delta (clamps to valid ranges)
 *
 * @param state - Current emotional state
 * @param delta - Change to apply
 * @returns New emotional state
 */
export function applyEmotionalDelta(
  state: EmotionalState,
  delta: EmotionalDelta
): EmotionalState {
  return {
    valence: clamp(
      state.valence + (delta.valence ?? 0),
      -1,
      1
    ),
    arousal: clamp(
      state.arousal + (delta.arousal ?? 0),
      0,
      1
    ),
    dominance: clamp(
      state.dominance + (delta.dominance ?? 0),
      0,
      1
    )
  }
}

/**
 * Drift emotion toward baseline (natural decay)
 *
 * @param current - Current emotional state
 * @param baseline - Target baseline state
 * @param rate - Drift rate (0..1, typically 0.01 = 1% per call)
 * @returns New emotional state
 */
export function driftToBaseline(
  current: EmotionalState,
  baseline: EmotionalState,
  rate: number
): EmotionalState {
  return {
    valence: current.valence + (baseline.valence - current.valence) * rate,
    arousal: current.arousal + (baseline.arousal - current.arousal) * rate,
    dominance: current.dominance + (baseline.dominance - current.dominance) * rate
  }
}

/**
 * Map emotional state to color (HSL)
 *
 * Mapping strategy:
 * - Valence → Hue (negative=red 0°, neutral=yellow 60°, positive=blue 240°)
 * - Arousal → Saturation (calm=desaturated, excited=vibrant)
 * - Dominance → Lightness (submissive=dark, dominant=bright)
 *
 * @param emotion - Emotional state
 * @returns CSS HSL color string
 */
export function emotionToColor(emotion: EmotionalState): string {
  // Valence → Hue (map -1..1 to 0..240)
  const hue = lerp(0, 240, (emotion.valence + 1) / 2)

  // Arousal → Saturation (0..1 to 0..100%)
  const sat = emotion.arousal * 100

  // Dominance → Lightness (0..1 to 30..70%)
  const light = lerp(30, 70, emotion.dominance)

  return `hsl(${Math.round(hue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`
}

/**
 * Map emotional state to hex color (for canvas rendering)
 *
 * @param emotion - Emotional state
 * @returns Hex color string (e.g., "#ff6b9d")
 */
export function emotionToHex(emotion: EmotionalState): string {
  const hue = lerp(0, 240, (emotion.valence + 1) / 2)
  const sat = emotion.arousal
  const light = lerp(0.3, 0.7, emotion.dominance)

  // HSL to RGB conversion
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = light - c / 2

  let r = 0, g = 0, b = 0

  if (hue < 60) {
    r = c; g = x; b = 0
  } else if (hue < 120) {
    r = x; g = c; b = 0
  } else if (hue < 180) {
    r = 0; g = c; b = x
  } else if (hue < 240) {
    r = 0; g = x; b = c
  } else if (hue < 300) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Predefined emotional baselines
 */
export const EMOTION_BASELINES = {
  neutral: { valence: 0, arousal: 0.5, dominance: 0.5 } as EmotionalState,
  happy: { valence: 0.8, arousal: 0.6, dominance: 0.5 } as EmotionalState,
  sad: { valence: -0.6, arousal: 0.3, dominance: 0.4 } as EmotionalState,
  anxious: { valence: -0.3, arousal: 0.9, dominance: 0.2 } as EmotionalState,
  content: { valence: 0.5, arousal: 0.2, dominance: 0.5 } as EmotionalState,
  angry: { valence: -0.5, arousal: 0.8, dominance: 0.8 } as EmotionalState,
  calm: { valence: 0.3, arousal: 0.1, dominance: 0.5 } as EmotionalState,
  excited: { valence: 0.7, arousal: 0.9, dominance: 0.6 } as EmotionalState
}
