/**
 * MDS v5.2 - Lite Bundle Entry Point
 *
 * Minimal bundle with core features only (~120 KB target)
 * Excludes: Communication, Physics, WorldMind, Cognitive, Advanced Phase 2 features
 *
 * Use this for basic simulations where bundle size matters.
 * For full features, use main entry: `import { ... } from '@v1b3x0r/mds-core'`
 *
 * @packageDocumentation
 */

// Core engine (v4 legacy - fully supported)
export { Engine } from './core/engine'
export type { EngineOptions, WorldBounds, BoundaryBehavior } from './core/engine'
export { Entity } from './core/entity'
export { Field } from './core/field'

// World container (v5 - minimal ontology only)
export { World } from './world'
export type { WorldOptions, SpawnOptions, WorldEvent } from './world'

// Basic ontology (memory, emotion, intent, relationship)
export {
  driftToBaseline,
  EMOTION_BASELINES,
  blendEmotions,
  emotionDistance,
  createMemory,
  createIntent
} from './ontology'

export type {
  Memory,
  MemoryType,
  EmotionalState,
  Intent,
  IntentGoal,
  RelationshipEntry
} from './ontology'

// Renderer (DOM only for lite bundle)
export { DOMRenderer, HeadlessRenderer, StateMapper } from './render'
export type { RendererAdapter, VisualStyle } from './render'

// IO (loader only, no LLM)
export { loadMaterial, loadMaterials } from './io/loader'

// Schema types
export type { MdsMaterial } from './schema/mdspec'
export type { MdsField } from './schema/fieldspec'

// Utilities
export { distance, clamp, similarity, lerp } from './utils/math'
export { parseSeconds, applyRule } from './utils/events'

// Registry (MaterialRegistry not needed in lite bundle - use World.registerMaterial)
// Validator
export { validateName } from './core/validator'
