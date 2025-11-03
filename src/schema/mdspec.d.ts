/**
 * MDS v5.0 - Material Definition Specification (MDSpec)
 * Schema for living material descriptions (not configs)
 *
 * File extension: .mdm (Material Definition)
 * World files: .world.mdm
 *
 * v5.0 Changes:
 * - Complete architecture upgrade
 * - Ontology: memory, emotion, relationships
 * - Physics: collision, temperature, weather
 * - Communication: messages, dialogue trees, LLM
 * - Cognitive: learning, skills, consolidation
 * - World mind: collective intelligence, pattern detection
 *
 * v4.2 Changes:
 * - Lifecycle hooks (onSpawn/onUpdate/onDestroy)
 * - Serialization (snapshot/restore)
 * - Deterministic mode (seeded random)
 *
 * v4.1 Changes:
 * - Entity lifecycle support
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

export interface MdsBehaviorTimer {
  id: string
  interval: string
  emit: string
  payload?: Record<string, any>
  context?: Record<string, any>
}

export interface MdsBehaviorEmotionRule {
  broadcast?: {
    event?: string
    payload?: Record<string, any>
    context?: Record<string, any>
  }
}

export interface MdsBehaviorEventRule {
  resetTimers?: string[]
}

export interface MdsBehaviorTrigger {
  id?: string
  description?: string
  on: string                  // e.g., "time.every(1d)", "mention(any)"
  where?: string              // optional expression filter
  actions: MdsBehaviorAction[]
}

export type MdsBehaviorAction =
  | {
      say: {
        mode?: 'auto' | 'emoji' | 'proto' | 'short'
        text?: string
        lang?: string
      }
    }
  | {
      'mod.emotion': {
        v?: string
        a?: string
        d?: string
      }
    }
  | {
      'relation.update': {
        target?: string
        metric?: string
        formula: string
      }
    }
  | {
      'memory.write': {
        target?: string
        kind?: MdsMemoryType | string
        salience?: string
        value?: string
      }
    }
  | {
      'memory.recall': {
        target?: string
        kind?: MdsMemoryType | string
        window?: string
      }
    }
  | {
      'context.set': Record<string, string>
    }
  | {
      emit: {
        event: string
        payload?: Record<string, string>
      }
    }
  | {
      log: {
        text: string
      }
    }
  | {
      'translation.learn': {
        source?: string
        lang: string
        text: string
      }
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
 * Memory configuration (v5.1 declarative)
 */
export interface MdsMemoryConfig {
  short_term?: {
    retention?: string        // e.g., "120s"
    scope?: string[]          // e.g., ["player_name", "recent_action"]
  }
  long_term?: {
    retention?: string        // e.g., "infinite"
    events?: string[]         // e.g., ["first_summon", "first_interaction"]
  }
  emotional_trace?: {
    keys?: string[]           // e.g., ["trust", "curiosity", "fear"]
  }
  bindings?: MdsMemoryBinding[]
  flags?: MdsMemoryFlag[]
}

export type MdsMemoryType =
  | 'interaction'
  | 'emotion'
  | 'observation'
  | 'field_spawn'
  | 'intent_change'
  | 'spawn'
  | 'fact'
  | 'custom'

export interface MdsMemoryBinding {
  trigger: string
  target: string
  value: string
  type?: MdsMemoryType
  salience?: number
}

export interface MdsMemoryFlag {
  id: string
  trigger: string
  retention?: string   // e.g., "infinite", "3600s"
}

export interface MdsStateConfig {
  initial: string
  states: Record<string, MdsStateDefinition>
  transitions?: MdsStateTransition[]
}

export interface MdsStateDefinition {
  emoji?: string
}

export interface MdsStateTransition {
  from?: string
  to: string
  trigger: string
  condition?: string
  effect?: string
}

/**
 * Emotion configuration (v5.1 declarative)
 */
export interface MdsEmotionConfig {
  base_state?: string         // e.g., "neutral", "curious"
  states?: Record<string, MdsEmotionStateDefinition>
  transitions?: Array<{
    trigger: string           // e.g., "player.gaze>5s", "distance<2"
    from?: string              // optional source emotion filter
    to: string                // target emotion: "uneasy", "happy", "angry"
    intensity?: number        // 0..1 strength of emotion change
    expression?: string       // visual effect: "particle.flicker", "dim.fade"
  }>
}

export interface MdsEmotionStateDefinition {
  valence?: number
  arousal?: number
  dominance?: number
}

/**
 * Dialogue phrase entry
 */
export interface MdsDialoguePhrase {
  lang: Record<string, string>  // { en: "...", th: "...", ja: "..." }
  emotion?: string              // emotion tag: "curious", "sad", "reflective"
  voice_hint?: string           // voice style: "whisper.low", "echo.distorted"
  frequency?: 'rare' | 'medium' | 'common'  // for self_monologue
  when?: string                 // declarative condition, e.g., "memory.flags.quest_done"
}

/**
 * Dialogue configuration (v5.1 declarative)
 */
export interface MdsDialogueConfig {
  intro?: MdsDialoguePhrase[]           // Initial greetings
  self_monologue?: MdsDialoguePhrase[]  // Internal thoughts
  event?: Record<string, MdsDialoguePhrase[]>  // Event-triggered dialogue
}

/**
 * Learnable skill definition
 */
export interface MdsLearnableSkill {
  name: string              // e.g., "mimic_voice", "phase_shift"
  trigger: string           // condition: "player.chat", "light_level<2"
  growth: number            // progress per trigger: 0..1
  description?: string      // human-readable description
  max_level?: number        // max skill level (default: infinite)
}

/**
 * Skills configuration (v5.1 declarative)
 */
export interface MdsSkillsConfig {
  learnable?: MdsLearnableSkill[]
}

/**
 * Cognition configuration (v5.1 declarative)
 */
export interface MdsCognitionConfig {
  learning_rate?: number      // overall learning speed multiplier
  concepts?: string[]         // known concepts: ["courage", "fear", "memory"]
  reasoning_pattern?: string  // reasoning loop description
}

/**
 * Relationship entry (from heroblind.mdm)
 */
export interface MdsRelationshipEntry {
  trust?: number              // 0..1
  fear?: number               // 0..1
  curiosity?: number          // 0..1
  bond?: string               // bond type: "ancient-memory"
  resonance_field?: number    // 0..1
  conflict?: string           // internal conflict description
  loop?: string               // behavioral loop pattern
}

/**
 * Relationships configuration (v5.1 declarative)
 */
export interface MdsRelationshipsConfig {
  [entityId: string]: MdsRelationshipEntry
}

/**
 * World mind configuration (v5.1 declarative)
 */
export interface MdsWorldMindConfig {
  collective_role?: string    // e.g., "observer-node", "broadcaster"
  network_field?: string      // field type: "dark_resonance"
  sync_rate?: string          // sync interval: "30s"
  pattern_detection?: {
    type: string              // detection type: "behavioral-field"
    threshold: number         // 0..1 detection sensitivity
    output: string            // output type: "dream_fragment"
  }
}

/**
 * Language profile configuration (v5.7 - Entity language autonomy)
 */
export interface MdsLanguageProfile {
  native?: string             // Native language code (e.g., "ja", "th", "en")
  weights?: Record<string, number>  // Language distribution (e.g., { ja: 0.8, en: 0.2 })
  adaptToContext?: boolean    // Whether entity adapts language to listener (default: false)
}

export interface MdsLocaleOverlayProtoConfig {
  syllables?: string[]
  minWords?: number
  maxWords?: number
  join?: string
  emoji?: string[]
}

export interface MdsLocaleOverlay {
  replacements?: Record<string, string>
  particles?: string[]
  emoji?: string[]
  interjections?: string[]
  proto?: MdsLocaleOverlayProtoConfig
}

export interface MdsUtterancePolicy {
  modes?: string[]
  defaultMode?: string
  locale?: {
    overlay?: string | MdsLocaleOverlay
  }
}

export interface MdsUtteranceConfig {
  policy?: MdsUtterancePolicy
}

/**
 * Resource need definition (v5.9 - Material Pressure System)
 */
export interface MdsNeedConfig {
  id: string                    // Resource identifier (e.g., "water", "food", "energy")
  initial?: number              // Initial level (0..1, default: 1.0)
  depletionRate: number         // Depletion per second (e.g., 0.001 = depletes in ~16 minutes)
  criticalThreshold?: number    // When to trigger critical state (default: 0.2)
  emotionalImpact?: {           // How critical need affects emotion (PAD model)
    valence: number             // Change to pleasure (-1..1, typically negative)
    arousal: number             // Change to arousal (0..1, typically increases)
    dominance: number           // Change to dominance (0..1, typically decreases)
  }
}

/**
 * Needs configuration (v5.9 - Material Pressure System)
 */
export interface MdsNeedsConfig {
  resources?: MdsNeedConfig[]   // Array of resource needs
}

/**
 * Complete material definition (v5.1+)
 */
export interface MdsMaterial {
  $schema?: string            // schema version (default: "5.0")
  material: string            // unique ID (e.g., "paper.shy", "entity.heroblind")
  intent?: string             // short verb/noun (e.g., "observe", "resonate")
  essence?: LangText          // semantic description (essence-first design)
  properties?: Record<string, any>

  // v5.7: Language autonomy
  nativeLanguage?: string     // Shorthand for language.native
  languageProfile?: MdsLanguageProfile  // Full language configuration
  utterance?: MdsUtteranceConfig

  behavior?: {
    onHover?: MdsBehaviorRule
   onIdle?: MdsBehaviorRule
   onRepeatHover?: MdsBehaviorRule
   onProximity?: MdsBehaviorRule
    onBind?: MdsBehaviorRule
    onDesync?: MdsBehaviorRule
    timers?: MdsBehaviorTimer[]
    onEmotion?: Record<string, MdsBehaviorEmotionRule>
    onEvent?: Record<string, MdsBehaviorEventRule>
    triggers?: MdsBehaviorTrigger[]
  }

  physics?: MdsPhysics
  manifestation?: MdsManifest
  ai_binding?: MdsAiBinding
  state?: MdsStateConfig

  // v5.1 Declarative configuration
  memory?: MdsMemoryConfig
  emotion?: MdsEmotionConfig
  relationships?: MdsRelationshipsConfig
  dialogue?: MdsDialogueConfig
  skills?: MdsSkillsConfig
  cognition?: MdsCognitionConfig
  world_mind?: MdsWorldMindConfig
  needs?: MdsNeedsConfig      // v5.9: Resource needs (water, food, energy)

  notes?: string[]            // design notes
}
