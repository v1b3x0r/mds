import type { EmotionalState } from '@v1b3x0r/mds-core'

export function getEmoji(valence: number): string {
  if (valence > 0.5) return '😊'   // Happy
  if (valence > 0.2) return '😐'   // Neutral positive
  if (valence > -0.2) return '😶'  // Neutral
  if (valence > -0.5) return '😔'  // Melancholic
  return '😞'                       // Sad
}

export function getStatus(emotion: EmotionalState): string {
  const { arousal, valence } = emotion

  if (arousal > 0.6) return 'anxious'
  if (arousal > 0.4) return 'alert'
  if (valence > 0.5) return 'happy'
  if (valence < -0.5) return 'sad'
  if (valence > 0) return 'calm'
  return 'quiet'
}
