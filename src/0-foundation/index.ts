/**
 * Layer 0: Foundation
 * Absolute base - Engine, Entity, Field
 */

export { Engine } from './engine'
export type { EngineOptions, WorldBounds, BoundaryBehavior } from './engine'
export { Entity } from './entity'
export type { ReflectionResult } from './entity'
export { Field } from './field'
export { MaterialRegistry } from './registry'
export type { Intent, IntentGoal } from '../1-ontology/intent/intent'
