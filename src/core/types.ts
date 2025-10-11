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
 * Behavior domain - Tactile simulation properties
 */
export interface Behavior {
  // Physics system (v3) - preferred
  physics?: string         // Path to .js file (relative to manifest)
  physicsInline?: string   // Inline function code (for CDN distribution)
  physicsParams?: Record<string, any>  // Params for physics simulation

  // Deprecated (v2) - auto-migrates to physicsParams
  /** @deprecated Use physicsParams.elasticity instead. Auto-migrates with console warning. */
  elasticity?: number

  /** @deprecated Use physicsParams.viscosity instead. Auto-migrates with console warning. */
  viscosity?: number

  /** @deprecated Use physicsParams.snapBack instead. Auto-migrates with console warning. */
  snapBack?: boolean
}

/**
 * State types for material interactions
 */
export type StateType = 'base' | 'hover' | 'press' | 'pressed-and-moving' | 'focus' | 'disabled'

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

  // Advanced: Custom CSS properties (escape hatch for CSS experts)
  // Supports ANY valid CSS property not covered by optics/surface/behavior
  customCSS?: Record<string, string>

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
