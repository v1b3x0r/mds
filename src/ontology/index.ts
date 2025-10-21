/**
 * MDS v5.0 - Ontology Layer
 * Living entities with memory, emotion, intent, and relationships
 */

// Memory system
export type {
  Memory,
  MemoryType,
  MemoryFilter,
  MemoryOptions
} from './memory'

export {
  MemoryBuffer,
  createMemory
} from './memory'

// Emotional state
export type {
  EmotionalState,
  EmotionalDelta
} from './emotion'

export {
  blendEmotions,
  emotionDistance,
  applyEmotionalDelta,
  driftToBaseline,
  emotionToColor,
  emotionToHex,
  EMOTION_BASELINES
} from './emotion'

// Intent system
export type {
  Intent,
  IntentGoal,
  IntentOptions
} from './intent'

export {
  IntentStack,
  createIntent,
  INTENT_TEMPLATES
} from './intent'

// Relationship system
export type {
  Relationship,
  RelationshipEntry
} from './relationship'

export {
  createRelationship,
  updateRelationship,
  relationshipStrength,
  isBonded,
  decayRelationship
} from './relationship'
