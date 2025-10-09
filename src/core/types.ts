/**
 * Material Definition System (MDS) - Type Definitions
 * MDSpec v2.0.0
 */

/**
 * Optics domain - Light interaction properties
 */
export interface Optics {
  opacity?: number          // 0..1
  tint?: string            // CSS color
  blur?: string            // e.g. "12px"
  brightness?: string      // e.g. "110%"
  contrast?: string        // e.g. "105%"
  saturation?: string      // e.g. "120%"
}

/**
 * Surface domain - Texture and edge properties
 */
export interface Surface {
  radius?: string          // border-radius e.g. "12px"
  shadow?: string          // box-shadow value
  border?: string          // border shorthand e.g. "1px solid rgba(255,255,255,0.2)"
  texture?: {
    src: string            // URL or data URI
    repeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y'
    size?: string          // e.g. "24px 24px"
    rotation?: string      // e.g. "15deg"
  }
}

/**
 * Behavior domain - Physics response properties
 */
export interface Behavior {
  elasticity?: number      // 0..1 (press spring strength)
  viscosity?: number       // 0..1 (drag damping)
  snapBack?: boolean       // return to rest on release
}

/**
 * State types for material interactions
 */
export type StateType = 'base' | 'hover' | 'press' | 'drag' | 'focus' | 'disabled'

/**
 * Theme types
 */
export type ThemeType = 'light' | 'dark'

/**
 * Partial material definition (for states and theme overrides)
 */
export interface PartialMaterial {
  optics?: Partial<Optics>
  surface?: Partial<Surface>
  behavior?: Partial<Behavior>
}

/**
 * Complete material definition
 */
export interface Material {
  // Metadata
  name?: string
  version?: string
  description?: string
  author?: string
  license?: string

  // Inheritance
  inherits?: string

  // Visual domains
  optics?: Optics
  surface?: Surface
  behavior?: Behavior

  // State variants
  states?: Partial<Record<StateType, PartialMaterial>>

  // Theme variants
  theme?: Partial<Record<ThemeType, PartialMaterial>>
}

/**
 * Resolved material (after inheritance and merging)
 */
export interface ResolvedMaterial {
  optics: Optics
  surface: Surface
  behavior: Behavior
  states: Record<StateType, PartialMaterial>
  theme: Record<ThemeType, PartialMaterial>
}

/**
 * Material manifest (.mdm.json format)
 */
export type MaterialManifest = Material
