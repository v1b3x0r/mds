/**
 * MDS v4.0 - Info-Physics Engine
 * Living materials with autonomous behavior
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { Engine, loadMaterial } from '@v1b3x0r/mds-core'
 *
 * const engine = new Engine()
 * const material = await loadMaterial('./paper.shy.mdspec.json')
 * const entity = engine.spawn(material, 100, 100)
 * engine.start()
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
