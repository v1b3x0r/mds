/**
 * MDS v5.0 - Ontology Layer
 * Living entities with memory, emotion, intent, and relationships
 */
export { MemoryBuffer, createMemory } from './memory';
export { MemoryCrystallizer, createCrystallizer, crystallizeMemories } from './crystallization';
export { blendEmotions, emotionDistance, applyEmotionalDelta, driftToBaseline, emotionToColor, emotionToHex, resonate, // v5.5: P2P emotional resonance
EMOTION_BASELINES } from './emotion';
// Emotion detector (v5.8: Thai/English emotion recognition)
export { EMOTION_BASELINES_TH, THAI_EMOTION_KEYWORDS, ENGLISH_EMOTION_KEYWORDS, detectEmotionFromText, detectAllEmotions, blendMultipleEmotions, findClosestThaiEmotion } from './emotion-detector';
export { IntentStack, createIntent, INTENT_TEMPLATES } from './intent';
export { IntentReasoner, createReasoner, reasonAbout, chooseBestIntent } from './reasoning';
export { createRelationship, updateRelationship, relationshipStrength, isBonded, decayRelationship } from './relationship';
export { RelationshipDecayManager, createDecayManager, applyDecay, shouldPrune, DECAY_PRESETS } from './relationship-decay';
