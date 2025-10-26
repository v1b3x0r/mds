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

// Memory crystallization (v5.2 Phase 2.2)
export type {
  CrystalMemory,
  CrystallizationConfig
} from './crystallization'

export {
  MemoryCrystallizer,
  createCrystallizer,
  crystallizeMemories
} from './crystallization'

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
  resonate,  // v5.5: P2P emotional resonance
  EMOTION_BASELINES
} from './emotion'

// Emotion detector (v5.8: Thai/English emotion recognition)
export {
  EMOTION_BASELINES_TH,
  THAI_EMOTION_KEYWORDS,
  ENGLISH_EMOTION_KEYWORDS,
  detectEmotionFromText,
  detectAllEmotions,
  blendMultipleEmotions,
  findClosestThaiEmotion
} from './emotion-detector'

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

// Intent reasoning (v5.2 Phase 2.4)
export type {
  ReasonedIntent,
  ReasoningContext,
  ReasoningConfig
} from './reasoning'

export {
  IntentReasoner,
  createReasoner,
  reasonAbout,
  chooseBestIntent
} from './reasoning'

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

// Relationship decay (v5.2 Phase 2.5)
export type {
  DecayCurve,
  DecayConfig,
  DecayStats
} from './relationship-decay'

export {
  RelationshipDecayManager,
  createDecayManager,
  applyDecay,
  shouldPrune,
  DECAY_PRESETS
} from './relationship-decay'
