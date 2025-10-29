/**
 * Layer 0: Foundation
 * Absolute base - Engine, Entity, Field
 */

export { Engine } from '@mds/0-foundation/engine'
export type { EngineOptions, WorldBounds, BoundaryBehavior } from '@mds/0-foundation/engine'
export { Entity } from '@mds/0-foundation/entity'
export type { ReflectionResult } from '@mds/0-foundation/entity'
export { Field } from '@mds/0-foundation/field'
export { MaterialRegistry } from '@mds/0-foundation/registry'
export { LANGUAGE_FALLBACK_PRIORITY } from '@mds/0-foundation/language'
export type { LanguageFallbackCode } from '@mds/0-foundation/language'
export type { Intent, IntentGoal } from '@mds/1-ontology/intent/intent'
