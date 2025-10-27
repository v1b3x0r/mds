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
export { Engine } from './0-foundation/engine'
export type { EngineOptions, WorldBounds, BoundaryBehavior } from './0-foundation/engine'
export { Entity } from './0-foundation/entity'
export { Field } from './0-foundation/field'

// World container (v5 - minimal ontology only)
export { World } from './6-world'
export type { WorldOptions, SpawnOptions, WorldEvent } from './6-world'

// Basic ontology (memory, emotion, intent, relationship)
export {
  driftToBaseline,
  EMOTION_BASELINES,
  blendEmotions,
  emotionDistance,
  createMemory,
  createIntent
} from './1-ontology'

export type {
  Memory,
  MemoryType,
  EmotionalState,
  Intent,
  IntentGoal,
  RelationshipEntry
} from './1-ontology'

// Renderer (DOM only for lite bundle)
export { DOMRenderer, HeadlessRenderer, StateMapper } from './7-interface/render'
export type { RendererAdapter, VisualStyle } from './7-interface/render'

// IO (loader only, no LLM)
export { loadMaterial, loadMaterials } from './7-interface/io/loader'

// Schema types
export type { MdsMaterial } from './schema/mdspec'
export type { MdsField } from './schema/fieldspec'

// Utilities
export { distance, clamp, similarity, lerp } from './0-foundation/math'
export { parseSeconds, applyRule } from './0-foundation/events'

// Registry (MaterialRegistry not needed in lite bundle - use World.registerMaterial)
// Validator
export { validateName } from './0-foundation/validator'
