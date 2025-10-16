/**
 * MDS v4.0 - Field Specification
 * Schema for emergent relationship fields
 */

/**
 * Field visual hints
 */
export interface MdsFieldVisual {
  aura?: string               // visual style (e.g., "gentle amber")
  motion?: string             // animation hint (e.g., "slow ripple")
}

/**
 * Field definition (spawned by material interactions)
 */
export interface MdsField {
  material: string            // unique ID (e.g., "field.trust.core")
  type: "field"               // discriminator
  origin: "self" | "$bind" | "$cursor" | string  // spawn origin hint
  radius: number              // effect radius in px
  duration: number            // lifetime in ms
  visual?: MdsFieldVisual
  effect_on_others?: Record<string, number | string | boolean>  // effects to apply
}
