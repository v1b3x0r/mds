/**
 * MDS v4.0 - Material Definition Specification
 * Schema for living material descriptions (not configs)
 */

/**
 * Multilingual text support
 */
export type LangText = string | { th?: string; en?: string; [k: string]: string | undefined }

/**
 * Behavior rule for autonomous material responses
 */
export interface MdsBehaviorRule {
  condition?: string          // e.g., "proximity<80 && repeats>=3"
  threshold?: number          // e.g., for repeat-hover count
  effect?: string             // e.g., "glow.soft", "slide.away", "follow.cursor"
  spawn?: string              // field material id to spawn
  emoji?: string              // optional emoji change
  after?: string              // e.g., "12s" duration
}

/**
 * Physics properties for material movement
 */
export interface MdsPhysics {
  mass?: number               // affects inertia
  friction?: number           // drag coefficient (0..1)
  bounce?: number             // elasticity (0..1)
}

/**
 * Visual manifestation properties
 */
export interface MdsManifest {
  emoji?: string              // emoji representation
  visual?: string             // visual style hint
  aging?: {
    start_opacity?: number    // initial opacity (0..1)
    decay_rate?: number       // fade per second
  }
}

/**
 * AI integration hints (optional)
 */
export interface MdsAiBinding {
  model_hint?: string         // preferred model
  simulate?: boolean          // use simulation instead of real AI
}

/**
 * Complete material definition (v4.0)
 */
export interface MdsMaterial {
  $schema?: string            // schema version
  material: string            // unique ID (e.g., "paper.shy", "emotion.trust")
  intent?: string             // short verb/noun (e.g., "observe", "resonate")
  essence?: LangText          // semantic description (essence-first design)

  behavior?: {
    onHover?: MdsBehaviorRule
    onIdle?: MdsBehaviorRule
    onRepeatHover?: MdsBehaviorRule
    onProximity?: MdsBehaviorRule
    onBind?: MdsBehaviorRule
    onDesync?: MdsBehaviorRule
  }

  physics?: MdsPhysics
  manifestation?: MdsManifest
  ai_binding?: MdsAiBinding
  notes?: string[]            // design notes
}
