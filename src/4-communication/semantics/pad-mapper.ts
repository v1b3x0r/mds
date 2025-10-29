/**
 * PAD Mapper — keyword/semantic to PAD delta
 *
 * Goal: provide a light semantic layer that converts user text into
 * bounded PAD deltas, before touching entity state. Built to avoid
 * overfitting to praise/criticism and enable diminishing returns.
 */

import { MULTILINGUAL_TRIGGERS } from '@mds/7-interface/io/trigger-keywords'
import { detectEmotionFromText } from '@mds/1-ontology/emotion/detector'

export interface PADVector { valence: number; arousal: number; dominance: number }

export interface PADMappingOptions {
  // Soft cap for per-message PAD delta
  cap?: PADVector
  // Global scale
  scale?: number
  // Diminishing returns factor for repeated praise/etc. [0..1]
  diminishing?: number
}

const defaultCap: PADVector = { valence: 0.2, arousal: 0.2, dominance: 0.15 }

function clamp01(x: number) { return Math.max(0, Math.min(1, x)) }
function clampN(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)) }

/**
 * Heuristic keyword scores for each category mapped to PAD directions.
 */
function keywordPAD(text: string): PADVector {
  const t = text.toLowerCase()
  const inc = (arr: string[]) => arr.some(k => t.includes(k.toLowerCase()))

  let val = 0, aro = 0, dom = 0
  if (inc(MULTILINGUAL_TRIGGERS.praise))      { val += 0.25; aro += 0.08; dom += 0.05 }
  if (inc(MULTILINGUAL_TRIGGERS.criticism))   { val -= 0.25; aro += 0.06; dom -= 0.05 }
  if (inc(MULTILINGUAL_TRIGGERS.greetings))   { val += 0.08; aro += 0.04 }
  if (inc(MULTILINGUAL_TRIGGERS.enthusiasm_markers)) { aro += 0.12; val += 0.04 }
  if (inc(MULTILINGUAL_TRIGGERS.hostile || []))     { val -= 0.3; aro += 0.1; dom -= 0.08 }
  if (inc(MULTILINGUAL_TRIGGERS.question_markers))  { aro += 0.05 }
  return { valence: val, arousal: aro, dominance: dom }
}

/**
 * Combine local keyword mapping with lightweight emotion detector hints.
 */
export function mapTextToPAD(text: string, opts: PADMappingOptions = {}): { delta: PADVector, tags: string[] } {
  const cap = opts.cap ?? defaultCap
  const scale = typeof opts.scale === 'number' ? opts.scale : 1
  const diminishing = clamp01(opts.diminishing ?? 0.5)

  const kw = keywordPAD(text)

  // Emotion detector returns high-level labels; map to hints
  const detected = detectEmotionFromText(text)
  if (detected) {
    kw.valence += 0.12 * detected.valence
    kw.arousal += 0.12 * (detected.arousal - 0.5)
    const domAdjust = typeof detected.dominance === 'number' ? detected.dominance - 0.5 : 0
    kw.dominance += 0.10 * domAdjust
  }

  // Diminishing returns: compress large deltas
  const compress = (x: number) => x * (1 - diminishing * clamp01(Math.abs(x)))
  let dv = compress(kw.valence * scale)
  let da = compress(kw.arousal * scale)
  let dd = compress(kw.dominance * scale)

  // Soft caps per message
  dv = clampN(dv, -cap.valence, cap.valence)
  da = clampN(da, -cap.arousal, cap.arousal)
  dd = clampN(dd, -cap.dominance, cap.dominance)

  const tags: string[] = []
  if (kw.valence > 0.1) tags.push('praise')
  if (kw.valence < -0.1) tags.push('criticism')
  if (kw.arousal > 0.1)  tags.push('high_arousal')

  return { delta: { valence: dv, arousal: da, dominance: dd }, tags }
}
