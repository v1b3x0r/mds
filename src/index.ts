/**
 * MDS v4.0 → v5.0 - Info-Physics Engine
 * Living materials with autonomous behavior
 *
 * v5 additions:
 * - Memory system (MemoryBuffer)
 * - Emotional state (PAD model)
 * - Intent system (goal-driven behavior)
 * - Relationships (entity bonds)
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * // v4 usage (still works)
 * import { Engine, loadMaterial } from '@v1b3x0r/mds-core'
 *
 * const engine = new Engine()
 * const material = await loadMaterial('./paper.shy.mdspec.json')
 * const entity = engine.spawn(material, 100, 100)
 * engine.start()
 *
 * // v5 usage (with ontology)
 * const entity = engine.spawn(materialV5, 100, 100)
 * entity.remember({ type: 'observation', subject: 'world', timestamp: 0 })
 * entity.feel({ valence: 0.5, arousal: 0.3, dominance: 0.5 })
 * entity.setIntent({ goal: 'wander', motivation: 0.4 })
 * ```
 */

// Core engine
export { Engine } from './core/engine'
export type { EngineOptions, WorldBounds, BoundaryBehavior } from './core/engine'
export { Entity } from './core/entity'
export { Field } from './core/field'

// IO
export { loadMaterial, loadMaterials } from './io/loader'
export { setLlmBridge, getLlmBridge, DummyBridge } from './io/bridge-llm'
export type { LlmBridge } from './io/bridge-llm'
export {
  enableLLM,
  setCreatorContext,
  clearCreatorContext,
  getCreatorContext,
  isLlmEnabled,
  resetLlmAdapter
} from './io/llmAdapter'

// Utils
export { clamp, distance, similarity, lerp, randRange, randInt } from './utils/math'
export { parseSeconds, applyRule } from './utils/events'
export { seededRandom, noise1D } from './utils/random'

// Types
export type {
  MdsMaterial,
  LangText,
  MdsBehaviorRule,
  MdsPhysics,
  MdsManifest,
  MdsAiBinding
} from './schema/mdspec'

export type {
  MdsField,
  MdsFieldVisual
} from './schema/fieldspec'

export type { CreatorContext } from './types'

// v5 Ontology (optional features)
export {
  MemoryBuffer,
  createMemory,
  blendEmotions,
  emotionDistance,
  applyEmotionalDelta,
  driftToBaseline,
  emotionToColor,
  emotionToHex,
  EMOTION_BASELINES,
  IntentStack,
  createIntent,
  INTENT_TEMPLATES,
  createRelationship,
  updateRelationship,
  relationshipStrength,
  isBonded,
  decayRelationship
} from './ontology'

export type {
  Memory,
  MemoryType,
  MemoryFilter,
  EmotionalState,
  EmotionalDelta,
  Intent,
  IntentGoal,
  Relationship,
  RelationshipEntry
} from './ontology'
