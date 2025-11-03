/**
 * MDS v5.0 - World Container
 * Wraps Engine with ontology tick loop and world state management
 *
 * Design principles:
 * - Delegation pattern: Physical simulation delegated to v4 Engine
 * - Three-phase tick: Physical → Mental → Relational
 * - Feature flags: Opt-in ontology, rendering, history
 * - World clock: Monotonic time tracking
 */

import { Engine } from '@mds/0-foundation/engine'
import type { WorldBounds, BoundaryBehavior } from '@mds/0-foundation/engine'
import type { MdsMaterial, MdsLocaleOverlay } from '@mds/schema/mdspec'
import type { MdsField as MdsFieldSpec } from '@mds/schema/fieldspec'
import { Expression } from '@mds/0-foundation/expression'
import { setPathValue } from '@mds/0-foundation/path'
import { Entity } from '@mds/0-foundation/entity'
import { Field } from '@mds/0-foundation/field'
import {
  driftToBaseline,
  EMOTION_BASELINES,
  createRelationship
} from '@mds/1-ontology'
import type { Relationship } from '@mds/1-ontology'
import type { EmotionalState } from '@mds/1-ontology/emotion/state'
import {
  RendererAdapter,
  DOMRenderer,
  CanvasRenderer,
  HeadlessRenderer
} from '@mds/7-interface/render'
import {
  Environment,
  Weather,
  CollisionDetector,
  EnergySystem,
  EnvironmentConfig,
  WeatherConfig,
  createEnvironment,
  createWeather
} from '@mds/2-physics'
import {
  DialogueManager,
  LanguageGenerator,
  SemanticSimilarity,
  MessageDelivery,
  MessageQueue
} from '@mds/4-communication'
import {
  CollectiveIntelligence,
  WorldStats,
  PatternDetection,
  EmotionalClimate
} from '@mds/3-cognition/world-mind'

// v5.8.4: Direct imports to avoid circular dependency (world/index.ts exports World)
import { TranscriptBuffer } from '@mds/6-world/linguistics/transcript'
import type { Utterance } from '@mds/6-world/linguistics/transcript'

import { WorldLexicon } from '@mds/6-world/linguistics/lexicon'
import type { LexiconEntry } from '@mds/6-world/linguistics/lexicon'

import { LinguisticCrystallizer } from '@mds/6-world/linguistics/crystallizer'
import type { CrystallizerConfig, CrystallizerTickOutcome } from '@mds/6-world/linguistics/crystallizer'

import { ProtoLanguageGenerator } from '@mds/6-world/linguistics/proto-language'
import type { ContextProvider } from '@mds/7-interface/context'
import { MdmParser, replacePlaceholders } from '@mds/7-interface/io/mdm-parser'
import type {
  ParsedBehaviorTrigger,
  ParsedBehaviorAction,
  ParsedLocaleOverlay
} from '@mds/7-interface/io/mdm-parser'
import { WorldLogger } from './logger'
import { PackResolver, type PackResolverOptions, type PackAggregate } from '@mds/0-foundation/pack-resolver'
import type { Memory, MemoryFilter } from '@mds/1-ontology/memory/buffer'

// Phase 1: Resource field system (v5.9)
import type { ResourceField } from '@mds/6-world/resources/field'
import {
  updateResourceField,
  getIntensityAt,
  consumeFrom,
  findNearestField
} from '@mds/6-world/resources/field'

export interface WorldContextProviderConfig {
  provider: ContextProvider
  /**
   * Override provider name. Defaults to provider.name.
   */
  name?: string
  /**
   * Polling interval in milliseconds. Defaults to 10s.
   */
  interval?: number
  /**
   * Run immediately on registration. Defaults to true.
   */
  immediate?: boolean
}

type ContextProviderRegistration = ContextProvider | WorldContextProviderConfig

function isContextProviderConfig(value: ContextProviderRegistration): value is WorldContextProviderConfig {
  return typeof value === 'object' && value !== null && 'provider' in value
}

/**
 * World configuration options
 */
export interface WorldOptions {
  logger?: WorldLogger
  // v4 Engine options (passed through)
  seed?: number
  worldBounds?: WorldBounds
  boundaryBehavior?: BoundaryBehavior
  boundaryBounceDamping?: number

  // v5 World options (new)
  features?: {
    ontology?: boolean        // Enable memory/emotion/intent system
    history?: boolean         // Enable event log (for debugging)
    rendering?: 'dom' | 'canvas' | 'headless'  // Rendering backend
    physics?: boolean         // Enable environmental physics (Phase 5)
    communication?: boolean   // Enable message system (Phase 6)
    languageGeneration?: boolean  // Enable LLM-powered dialogue (Phase 6)
    cognitive?: boolean       // Enable learning/skills (Phase 7)
    cognition?: boolean       // Enable P2P cognition (Phase 9 / v5.5)
    linguistics?: boolean     // Enable emergent linguistics (Phase 10 / v6.0)
  }

  // v6.0: Linguistics system configuration
  linguistics?: {
    enabled?: boolean         // Enable linguistics system (default: false)
    maxTranscript?: number    // Max utterances in buffer (default: 1000)
    analyzeEvery?: number     // Ticks between analysis (default: 50)
    minUsage?: number         // Minimum occurrences (default: 3)
    minLength?: number        // Min phrase length (default: 2)
    maxLength?: number        // Max phrase length (default: 100)
  }

  emergence?: EmergenceOptions

  // v5.5: P2P Cognition configuration
  cognition?: {
    network?: {
      k?: number              // Small-world: neighbors per node (default: 8)
      p?: number              // Small-world: rewiring probability (default: 0.2)
    }
    trust?: {
      initialTrust?: number   // Starting trust level (default: 0.5)
      trustThreshold?: number // Minimum trust for sharing (default: 0.6)
    }
    resonance?: {
      decayRate?: number      // Signal decay per hop (default: 0.2)
      minStrength?: number    // Minimum signal strength (default: 0.1)
    }
  }

  // Phase 5: Environmental physics configuration
  environment?: EnvironmentConfig | 'desert' | 'forest' | 'ocean' | 'arctic'
  weather?: WeatherConfig | 'calm' | 'stormy' | 'dry' | 'variable'
  collision?: boolean         // Enable collision detection

  /**
   * LLM configuration for language generation and semantic similarity (v5.3)
   *
   * @example
   * // Basic (OpenRouter + Claude)
   * llm: {
   *   apiKey: process.env.OPENROUTER_KEY
   * }
   *
   * @example
   * // With embeddings
   * llm: {
   *   apiKey: process.env.OPENROUTER_KEY,
   *   languageModel: 'anthropic/claude-3.5-sonnet',
   *   embeddingModel: 'openai/text-embedding-3-small'
   * }
   *
   * @example
   * // Direct provider
   * llm: {
   *   provider: 'anthropic',
   *   apiKey: process.env.ANTHROPIC_KEY
   * }
   */
  llm?: {
    /**
     * LLM provider
     * @default 'openrouter'
     */
    provider?: 'openrouter' | 'anthropic' | 'openai'

    /**
     * API key for the provider
     * Falls back to process.env.OPENROUTER_KEY if not provided
     */
    apiKey?: string

    /**
     * Model for language generation (dialogue, text)
     * @default 'anthropic/claude-3.5-sonnet'
     */
    languageModel?: string

    /**
     * Model for embeddings (semantic similarity)
     * If not provided, falls back to local similarity (Jaccard/Levenshtein)
     */
    embeddingModel?: string
  }

  // DEPRECATED: Old LLM config (v5.0-5.2) - kept for backward compatibility
  /** @deprecated Use llm.provider instead */
  languageProvider?: 'openrouter' | 'anthropic' | 'openai' | 'mock'
  /** @deprecated Use llm.apiKey instead */
  languageApiKey?: string
  /** @deprecated Use llm.languageModel instead */
  languageModel?: string
  /** @deprecated Use llm.embeddingModel instead (or omit for local) */
  semanticProvider?: 'openai' | 'mock'
  /** @deprecated Use llm.embeddingModel instead */
  semanticApiKey?: string

  /**
   * Auto-register context providers (Phase 3)
   */
  contextProviders?: ContextProviderRegistration[]

  /**
   * Meta-behavior options (adaptive time, etc.)
   */
  meta?: {
    adaptiveTime?: boolean
    timeDilationStrength?: number  // 0..1 (default 0.2)
    /**
     * Micro random drift applied to emotions each tick to avoid flatlines.
     * 0 = off (default). Typical 0.01–0.05.
     */
    microDriftStrength?: number
  }
}

/**
 * Spawn options for entities
 */
export interface SpawnOptions {
  x?: number
  y?: number
}


export interface WorldEntityDefinition {
  id?: string
  alias?: string
  material: string | MdsMaterial
  spawn?: SpawnOptions
  [key: string]: any
}

export interface WorldDefinition {
  material?: string
  include?: string[]
  world?: Record<string, any>
  options?: Partial<WorldOptions>
  features?: WorldOptions['features']
  materials?: Record<string, MdsMaterial>
  fields?: Record<string, MdsFieldSpec>
  localeOverlays?: Record<string, MdsLocaleOverlay>
  entities?: WorldEntityDefinition[]
  notes?: string
  [key: string]: any
}

export type WorldBootstrapSource = string | WorldDefinition

export interface WorldBootstrapOptions {
  fetch?: (url: string) => Promise<any>
  materials?: Record<string, MdsMaterial>
  fields?: Record<string, MdsFieldSpec>
  localeOverlays?: Record<string, MdsLocaleOverlay>
  worldOptions?: WorldOptions
  logger?: WorldLogger
  autoSpawn?: boolean
  packLoader?: PackResolverOptions['loader']
}

/**
 * World event (for history tracking)
 */
export interface WorldEvent {
  time: number      // World time when event occurred
  type: string      // Event type
  id?: string       // Entity/field ID
  data?: any        // Additional data
}

export interface WorldContextEvent {
  context: Record<string, any>
  diff: Record<string, any>
}

export interface WorldAnalyticsEvent {
  stats?: WorldStats
  patterns?: PatternDetection[]
  collectiveEmotion: EmotionalState | null
}

export interface WorldEmergenceEvent {
  newTerms: number      // Number of new terms created
  totalTerms: number    // Total terms in lexicon
  novelty: number       // Current novelty metric (0..1)
}

type WorldEventMap = {
  tick: { time: number; dt: number }
  context: WorldContextEvent
  event: WorldEvent
  analytics: WorldAnalyticsEvent
  utterance: Utterance
  'emergence.chunk': WorldEmergenceEvent  // Layer 5: Pattern emergence
}

type BehaviorTriggerPattern =
  | { kind: 'time.every'; interval: number; nextFire: number }
  | { kind: 'mention'; target: 'any' | 'self' | 'others'; entityRef?: string }
  | { kind: 'event'; event: string; match: 'any' | 'exact' | 'prefix' }

interface BehaviorTriggerRuntime {
  entity: Entity
  config: ParsedBehaviorTrigger
  pattern: BehaviorTriggerPattern
  where?: Expression
  actions: BehaviorActionRuntime[]
}

type BehaviorActionRuntime =
  | { kind: 'say'; mode?: string; text?: string; lang?: string }
  | { kind: 'mod.emotion'; v?: Expression; a?: Expression; d?: Expression }
  | { kind: 'relation.update'; target?: string; metric: string; expr: Expression; mode: 'absolute' | 'delta' }
  | { kind: 'memory.write'; target?: string; memoryKind?: string; salience?: Expression; value?: string }
  | { kind: 'memory.recall'; target?: string; memoryKind?: string; window?: string }
  | { kind: 'context.set'; entries: Record<string, Expression | string> }
  | { kind: 'emit'; event: string; payload?: Record<string, Expression> }
  | { kind: 'log'; text: string }
  | { kind: 'translation.learn'; source?: string; lang: string; text: string }

interface BehaviorEventContext {
  type: 'time' | 'mention' | 'event'
  utterance?: Utterance
  speaker?: Entity
  listener?: Entity
  metrics?: Record<string, number>
  event?: WorldEvent
}

export interface EmergenceOptions {
  windowSeconds?: number
  noveltyHalfLife?: number
  chunking?: Partial<{
    analyzeEvery: number
    minUsage: number
    minSpeakers: number
    warmUpTicks: number
    warmUpMinUsage: number
  }>
  blending?: Partial<{
    chance: number
  }>
  learning?: Partial<{
    rate: number
  }>
}

interface EmergenceConfig {
  windowSeconds: number
  noveltyHalfLife: number
  chunking: {
    analyzeEvery: number
    minUsage: number
    minSpeakers: number
    warmUpTicks: number
    warmUpMinUsage: number
  }
  blending: {
    chance: number
  }
  learning: {
    rate: number
  }
}

export interface WorldEmergenceState {
  novelty: number
  diversity: number
  learning: number
  lexiconSize: number
  windowUtterances: number
  chunkCount: number
  blendCount: number
  lastChunkAt?: number
  lastBlendAt?: number
}

interface InternalEmergenceState extends WorldEmergenceState {
  lastUpdateTime: number
}

const DEFAULT_EMERGENCE_CONFIG: EmergenceConfig = {
  windowSeconds: 120,
  noveltyHalfLife: 45,
  chunking: {
    analyzeEvery: 25,
    minUsage: 3,
    minSpeakers: 1,
    warmUpTicks: 10,
    warmUpMinUsage: 2
  },
  blending: {
    chance: 0.12
  },
  learning: {
    rate: 0.15
  }
}

const DEFAULT_EMERGENCE_STATE: InternalEmergenceState = {
  novelty: 0,
  diversity: 0,
  learning: 0.5,
  lexiconSize: 0,
  windowUtterances: 0,
  chunkCount: 0,
  blendCount: 0,
  lastUpdateTime: 0
}

function cloneEmergenceConfig(config: EmergenceConfig): EmergenceConfig {
  return {
    windowSeconds: config.windowSeconds,
    noveltyHalfLife: config.noveltyHalfLife,
    chunking: { ...config.chunking },
    blending: { ...config.blending },
    learning: { ...config.learning }
  }
}

function cloneEmergenceState(state: InternalEmergenceState): InternalEmergenceState {
  return { ...state }
}

/**
 * World Container
 *
 * Wraps v4 Engine with v5 ontology features:
 * - Three-phase tick loop (Physical → Mental → Relational)
 * - World clock (monotonic time tracking)
 * - Feature flags (opt-in ontology)
 * - Event log (debugging history)
 *
 * @example
 * // v4-compatible usage (no ontology)
 * const world = new World()
 * const entity = world.spawn(material, { x: 100, y: 100 })
 * world.start()
 *
 * // v5 usage (with ontology)
 * const world = new World({ features: { ontology: true } })
 * const entity = world.spawn(materialV5, { x: 100, y: 100 })
 * entity.remember({ type: 'observation', subject: 'world', timestamp: 0 })
 * world.start()
 */
export class World {
  // Identity
  id: string
  createdAt: number

  // Time tracking
  worldTime = 0      // Monotonic simulation time (seconds)
  tickCount = 0      // Frame counter

  // Core engine (v4 delegation)
  private engine: Engine

  // Registries
  materialRegistry = new Map<string, MdsMaterial>()
  fieldRegistry = new Map<string, MdsFieldSpec>()

  // State (delegated to engine, but exposed for direct access)
  get entities() {
    return this.engine.getEntities()
  }

  get fields() {
    return this.engine.getFields()
  }

  // History (optional)
  historyEnabled = false
  eventLog: WorldEvent[] = []

  // Renderer (v5)
  private renderer: RendererAdapter

  // Phase 5: Physics systems (optional)
  environment?: Environment
  weather?: Weather
  private collisionDetector?: CollisionDetector
  private energySystem?: EnergySystem

  // Phase 6: Communication systems (optional)
  dialogueManager?: DialogueManager
  languageGenerator?: LanguageGenerator
  semanticSimilarity?: SemanticSimilarity

  // Phase 8: World mind (optional)
  private worldStats?: WorldStats
  private patterns: PatternDetection[] = []
  // v6.7: Analytics by simulation ticks (deterministic in sandbox)
  private statsUpdateIntervalTicks: number = 60  // ~1 sec at 60 FPS
  private lastStatsTick: number = 0

  // Phase 9 / v5.5: P2P Cognition (optional)
  cognitiveNetwork?: import('@mds/3-cognition').CognitiveNetwork
  resonanceField?: import('@mds/3-cognition').ResonanceField

  // Phase 10 / v6.0: Linguistics (optional)
  transcript?: TranscriptBuffer
  lexicon?: WorldLexicon
  private crystallizer?: LinguisticCrystallizer
  protoGenerator?: import('@mds/6-world/linguistics/proto-language').ProtoLanguageGenerator  // v6.1: Emergent language generation

  // Layer 5: Emergence Observability (v5.9)
  emergence = {
    novelty: 0,           // 0..1 (ratio of new patterns recently)
    coherence: 0,         // 0..1 (how organized patterns are)
    lexiconSize: 0,       // total terms in lexicon
    activePatterns: 0,    // patterns used recently
    emotionalDensity: 0   // avg emotional intensity (arousal)
  }

  // Phase 1: Resource fields (v5.9 - Material Pressure System)
  resourceFields = new Map<string, ResourceField>()

  // Task 1.4: Emotional climate (world-mind collective emotion)
  emotionalClimate: EmotionalClimate
  private cachedClimateInfluence: { valence: number; arousal: number; dominance: number } = { valence: 0, arousal: 0, dominance: 0 }

  // Options
  options: WorldOptions
  definition?: WorldDefinition
  readonly logger: WorldLogger
  private bootstrapEntityMap?: Map<string, Entity>
  private behaviorTimeTriggers: BehaviorTriggerRuntime[] = []
  private behaviorMentionTriggers: BehaviorTriggerRuntime[] = []
  private behaviorEventTriggers: BehaviorTriggerRuntime[] = []
  private lastUtterance?: { text: string; speaker: string }
  private packFunctions: Record<string, unknown> = {}
  private packCompose: Record<string, unknown> = {}
  private packEmergence: Record<string, unknown> = {}
  private expressionFunctions: Record<string, Function> = {}
  private emergenceConfig: EmergenceConfig = cloneEmergenceConfig(DEFAULT_EMERGENCE_CONFIG)
  private emergenceState: InternalEmergenceState = cloneEmergenceState(DEFAULT_EMERGENCE_STATE)
  private localeOverlayRegistry = new Map<string, ParsedLocaleOverlay>()
  private mdmParser = new MdmParser()


  // Context + events
  private contextState: Record<string, any> = {}
  private listeners = new Map<keyof WorldEventMap, Set<(payload: any) => void>>()
  private cachedCollectiveEmotion: EmotionalState | null = null
  private isBroadcastingContext = false
  private pendingContext: Record<string, any> | null = null
  private contextProviders = new Map<string, ContextProvider>()
  private contextProviderHandles = new Map<string, ReturnType<typeof setInterval>>()
  private contextProviderLocks = new Map<string, boolean>()

  constructor(options: WorldOptions = {}) {
    this.id = this.generateUUID()
    this.createdAt = Date.now()
    this.options = options
    this.logger = options.logger ?? new WorldLogger()
    this.emergenceConfig = cloneEmergenceConfig(this.emergenceConfig)
    this.emergenceState = cloneEmergenceState(this.emergenceState)
    this.emergenceState.lastUpdateTime = this.worldTime

    // Migrate old LLM config to new format (backward compatibility)
    this.migrateLLMConfig(options)

    // Create v4 engine (delegate tick logic)
    const renderMode = options.features?.rendering ?? 'dom'
    this.engine = new Engine({
      seed: options.seed,
      worldBounds: options.worldBounds,
      boundaryBehavior: options.boundaryBehavior,
      boundaryBounceDamping: options.boundaryBounceDamping,
      headless: renderMode === 'headless'  // v6.1: Pass headless flag to Engine
    })

    // Initialize renderer
    this.renderer = this.createRenderer(renderMode)
    this.renderer.init()
    this.logger.push({
      type: 'world.init',
      data: { id: this.id, rendering: renderMode },
      text: `[init] world ${this.id} (render=${renderMode})`
    })

    // Enable history if requested
    this.historyEnabled = options.features?.history ?? false

    // Phase 5: Initialize physics systems (if enabled)
    if (options.features?.physics) {
      this.initializePhysics(options)
    }

    // Phase 6: Initialize communication systems (if enabled)
    if (options.features?.communication) {
      this.initializeCommunication(options)
    }

    // Phase 10 / v6.0: Initialize linguistics systems (if enabled)
    if (options.features?.linguistics || options.linguistics?.enabled) {
      this.initializeLinguistics(options)
    }

    // Task 1.4: Initialize emotional climate
    this.emotionalClimate = CollectiveIntelligence.createEmotionalClimate()

    if (options.contextProviders && options.contextProviders.length > 0) {
      for (const registration of options.contextProviders) {
        if (!registration) continue

        if (isContextProviderConfig(registration)) {
          this.registerContextProvider(registration.provider, {
            name: registration.name,
            interval: registration.interval,
            immediate: registration.immediate
          })
        } else {
          this.registerContextProvider(registration)
        }
      }
    }
  }

  /**
   * Migrate old LLM config to new format (backward compatibility)
   */
  private migrateLLMConfig(options: WorldOptions): void {
    // Auto-migrate old config to new format
    if (options.languageProvider || options.languageApiKey || options.semanticProvider) {
      if (!options.llm) {
        options.llm = {}
      }

      // Migrate language provider (skip 'mock')
      if (options.languageProvider && options.languageProvider !== 'mock') {
        options.llm.provider = options.languageProvider
      }

      // Migrate API keys
      if (options.languageApiKey) {
        options.llm.apiKey = options.languageApiKey
      }

      // Migrate models
      if (options.languageModel) {
        options.llm.languageModel = options.languageModel
      }

      // Migrate semantic config (OpenAI → embedding model)
      if (options.semanticProvider === 'openai' && options.semanticApiKey) {
        // Assume embedding model if semantic was enabled
        if (!options.llm.embeddingModel) {
          options.llm.embeddingModel = 'text-embedding-3-small'
        }
        // If API key differs, warn (can't support 2 keys in new format)
        if (options.llm.apiKey && options.llm.apiKey !== options.semanticApiKey) {
          console.warn('Migration: semanticApiKey differs from languageApiKey. Using languageApiKey for both.')
        }
      }
    }

    // Set defaults and env fallback
    if (options.llm) {
      // Default provider
      options.llm.provider = options.llm.provider ?? 'openrouter'

      // API key fallback to env (Node.js only)
      if (!options.llm.apiKey) {
        try {
          // @ts-ignore - process may not be defined in browser
          const envKey = typeof process !== 'undefined' && process.env ? process.env.OPENROUTER_KEY : undefined
          if (envKey) {
            options.llm.apiKey = envKey
            console.info('LLM: Using OPENROUTER_KEY from environment')
          }
        } catch (e) {
          // process.env not available (browser environment)
        }
      }

      // Default language model
      options.llm.languageModel = options.llm.languageModel ?? 'anthropic/claude-3.5-sonnet'

      // embeddingModel remains undefined if not specified (local fallback)
    }
  }

  /**
   * Create renderer based on mode
   */
  private createRenderer(mode: 'dom' | 'canvas' | 'headless'): RendererAdapter {
    switch (mode) {
      case 'dom':
        return new DOMRenderer()
      case 'canvas':
        return new CanvasRenderer()
      case 'headless':
        return new HeadlessRenderer()
      default:
        return new DOMRenderer()
    }
  }

  /**
   * Initialize physics systems (Phase 5)
   */
  private initializePhysics(options: WorldOptions): void {
    // Create environment
    if (typeof options.environment === 'string') {
      // Preset
      this.environment = createEnvironment(options.environment)
    } else if (options.environment) {
      // Custom config
      this.environment = new Environment(options.environment)
    } else {
      // Default
      this.environment = new Environment()
    }

    // Create weather
    if (typeof options.weather === 'string') {
      // Preset
      this.weather = createWeather(options.weather)
    } else if (options.weather) {
      // Custom config
      this.weather = new Weather(options.weather)
    } else {
      // Default
      this.weather = new Weather()
    }

    // Create collision detector (if enabled)
    if (options.collision) {
      const bounds = {
        width: options.worldBounds?.maxX ?? 1920,
        height: options.worldBounds?.maxY ?? 1080
      }
      this.collisionDetector = new CollisionDetector(100, bounds)
    }

    // Create energy system
    this.energySystem = new EnergySystem()
  }

  /**
   * Initialize linguistics systems (Phase 10 / v6.0)
   */
  private initializeLinguistics(options: WorldOptions): void {
    console.info('v6.0: Initializing emergent linguistics system')

    // Create transcript buffer
    const maxTranscript = options.linguistics?.maxTranscript ?? 1000
    this.transcript = new TranscriptBuffer(maxTranscript)

    // Create lexicon
    this.lexicon = new WorldLexicon()

    // Create crystallizer with config
    // Priority: user linguistics config > emergence config > defaults
    const crystallizerConfig: CrystallizerConfig = {
      enabled: true,
      analyzeEvery: options.linguistics?.analyzeEvery ?? this.emergenceConfig.chunking.analyzeEvery ?? 50,
      minUsage: options.linguistics?.minUsage ?? this.emergenceConfig.chunking.minUsage ?? 3,
      minLength: options.linguistics?.minLength ?? 2,
      maxLength: options.linguistics?.maxLength ?? 100,
      warmUpTicks: this.emergenceConfig.chunking.warmUpTicks,
      warmUpMinUsage: this.emergenceConfig.chunking.warmUpMinUsage,
      coiningChance: this.emergenceConfig.blending.chance,
      minSpeakers: this.emergenceConfig.chunking.minSpeakers
    }

    this.crystallizer = new LinguisticCrystallizer(crystallizerConfig)
    this.emergenceState.lastUpdateTime = this.worldTime
    this.updateEmergenceStateWithOutcome({ newEntries: [], coinedEntries: [] })

    // v6.1: Create proto-language generator
    this.protoGenerator = new ProtoLanguageGenerator()

    console.info(`v6.0: Linguistics initialized (buffer=${maxTranscript}, analyze every ${crystallizerConfig.analyzeEvery} ticks)`)
    console.info(`v6.1: Proto-language generator created`)
  }

  /**
   * Subscribe to world events (tick, context, analytics, utterance, event).
   * Returns an unsubscribe handler for convenience.
   */
  on<K extends keyof WorldEventMap>(event: K, listener: (payload: WorldEventMap[K]) => void): () => void {
    const existing = this.listeners.get(event) ?? new Set<(payload: any) => void>()
    existing.add(listener as unknown as (payload: any) => void)
    this.listeners.set(event, existing)
    return () => this.off(event, listener)
  }

  /**
   * Subscribe once, then auto-unsubscribe after first emission.
   */
  once<K extends keyof WorldEventMap>(event: K, listener: (payload: WorldEventMap[K]) => void): () => void {
    const wrapper = (payload: WorldEventMap[K]) => {
      try {
        listener(payload)
      } finally {
        this.off(event, wrapper as unknown as (payload: WorldEventMap[K]) => void)
      }
    }
    return this.on(event, wrapper as unknown as (payload: WorldEventMap[K]) => void)
  }

  /**
   * Remove a listener from a world event.
   */
  off<K extends keyof WorldEventMap>(event: K, listener: (payload: WorldEventMap[K]) => void): void {
    const existing = this.listeners.get(event)
    if (!existing) return
    existing.delete(listener as unknown as (payload: any) => void)
    if (existing.size === 0) {
      this.listeners.delete(event)
    }
  }

  /**
   * Snapshot of the current broadcast context state.
   */
  getContextSnapshot(): Record<string, any> {
    return { ...this.contextState }
  }

  registerContextProvider(
    provider: ContextProvider,
    options: { name?: string; interval?: number; immediate?: boolean } = {}
  ): () => void {
    const name = options.name ?? provider.name ?? `provider_${Date.now()}`

    if (this.contextProviders.has(name)) {
      console.warn(`[World] Context provider "${name}" already registered.`)
      return () => this.disposeContextProvider(name)
    }

    this.contextProviders.set(name, provider)

    const interval = options.interval ?? 10000
    const immediate = options.immediate !== false

    const runProvider = () => {
      try {
        if (this.contextProviderLocks.get(name)) {
          return
        }

        const result = provider.getContext(this)
        if (result && typeof (result as Promise<Record<string, any>>).then === 'function') {
          this.contextProviderLocks.set(name, true)
          ;(result as Promise<Record<string, any> | void>)
            .then(context => {
              if (!this.contextProviders.has(name)) {
                return
              }
              if (context && typeof context === 'object') {
                this.broadcastContext(context as Record<string, any>)
              }
            })
            .catch(error => {
              console.error(`[World] Context provider "${name}" failed`, error)
            })
            .finally(() => {
              this.contextProviderLocks.delete(name)
            })
        } else if (result && typeof result === 'object') {
          this.broadcastContext(result as Record<string, any>)
        }
      } catch (error) {
        console.error(`[World] Context provider "${name}" crashed`, error)
      }
    }

    if (immediate) {
      runProvider()
    }

    const handle = setInterval(runProvider, interval)
    this.contextProviderHandles.set(name, handle)

    return () => this.disposeContextProvider(name)
  }

  disposeContextProvider(name: string): void {
    const handle = this.contextProviderHandles.get(name)
    if (handle !== undefined) {
      clearInterval(handle)
      this.contextProviderHandles.delete(name)
    }
    const provider = this.contextProviders.get(name)
    if (provider && typeof provider.dispose === 'function') {
      try {
        const maybePromise = provider.dispose()
        if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
          ;(maybePromise as Promise<void>).catch(error => {
            console.error(`[World] Context provider "${name}" dispose failed`, error)
          })
        }
      } catch (error) {
        console.error(`[World] Context provider "${name}" dispose failed`, error)
      }
    }
    this.contextProviders.delete(name)
    this.contextProviderLocks.delete(name)
  }

  disposeAllContextProviders(): void {
    for (const name of Array.from(this.contextProviders.keys())) {
      this.disposeContextProvider(name)
    }
    this.contextProviders.clear()
    this.contextProviderHandles.clear()
    this.contextProviderLocks.clear()
  }

  private emit<K extends keyof WorldEventMap>(event: K, payload: WorldEventMap[K]): void {
    const listeners = this.listeners.get(event)
    if (!listeners || listeners.size === 0) return

    for (const handler of Array.from(listeners)) {
      try {
        handler(payload)
      } catch (error) {
        console.error(`[World] listener error for "${String(event)}"`, error)
      }
    }
  }

  /**
   * Initialize communication systems (Phase 6)
   */
  private initializeCommunication(options: WorldOptions): void {
    // Create dialogue manager
    this.dialogueManager = new DialogueManager()

    // Create language generator (if enabled)
    if (options.features?.languageGeneration) {
      // Use new llm config if available, fall back to old
      const provider = options.llm?.provider ?? 'openrouter'
      const apiKey = options.llm?.apiKey
      const model = options.llm?.languageModel ?? 'anthropic/claude-3.5-sonnet'

      if (!apiKey) {
        console.warn('LLM: languageGeneration enabled but no apiKey provided. Falling back to mock provider.')
      }

      this.languageGenerator = new LanguageGenerator({
        provider: apiKey ? provider : 'mock',
        apiKey,
        model
      })
    }

    // Create semantic similarity system
    const embeddingModel = options.llm?.embeddingModel
    const llmProvider = options.llm?.provider ?? 'openrouter'
    const apiKey = options.llm?.apiKey

    if (embeddingModel && apiKey) {
      // Use external embeddings (only openrouter/openai support embeddings)
      const semanticProvider = (llmProvider === 'openrouter' || llmProvider === 'openai') ? llmProvider : 'openrouter'
      console.info(`LLM: Using ${semanticProvider} embeddings (${embeddingModel}) for semantic similarity`)
      this.semanticSimilarity = new SemanticSimilarity({
        provider: semanticProvider,
        apiKey,
        model: embeddingModel
      })
    } else {
      // Fallback to local similarity
      console.info('LLM: Using local similarity methods (Jaccard/Levenshtein) for semantic clustering')
      this.semanticSimilarity = new SemanticSimilarity({
        provider: 'mock'
      })
    }
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Register material definition
   */
  registerMaterial(id: string, material: MdsMaterial): void {
    this.materialRegistry.set(id, material)
  }

  /**
   * Register field definition
   */
  registerField(id: string, field: MdsFieldSpec): void {
    this.fieldRegistry.set(id, field)
  }

  /**
   * Get material by ID
   */
  getMaterial(id: string): MdsMaterial | undefined {
    return this.materialRegistry.get(id)
  }

  /**
   * Get field by ID
   */
  getField(id: string): MdsFieldSpec | undefined {
    return this.fieldRegistry.get(id)
  }

  /**
   * Spawn entity (evolved from engine.spawn)
   */
  spawn(material: MdsMaterial, options?: SpawnOptions): Entity {
    // Determine if we should skip DOM creation
    const renderMode = this.options.features?.rendering ?? 'dom'
    const skipDOM = renderMode !== 'dom'

    // Spawn entity (with or without DOM)
    const entity = this.engine.spawn(material, options?.x, options?.y, { skipDOM })

    // v5.6: Auto-enable features based on MDM content
    if (material.dialogue) {
      // Has dialogue → enable message/communication features automatically
      if (!entity.inbox) entity.inbox = new MessageQueue()
      if (!entity.outbox) entity.outbox = new MessageQueue()
    }

    if (material.cognition) {
      // Has cognition config → enable autonomous behavior
      if (entity.emotion && entity.intent) {
        entity.enableAutonomous()
      }
    }

    if (material.memory) {
      // Has memory config → ensure memory is enabled
      if (!entity.memory) {
        entity.enable('memory')
      }
    }

    if (material.relationships) {
      // Has relationships config → enable relationship tracking
      if (!entity.relationships) {
        entity.enable('relationships')
      }
    }

    if (material.skills) {
      // Has skills config → enable skill system
      if (!entity.skills) {
        entity.enable('skills')
      }
    }

    const utterancePolicy = entity.getUtterancePolicy()
    if (utterancePolicy) {
      let overlay: ParsedLocaleOverlay | undefined = utterancePolicy.overlay
      if (!overlay && utterancePolicy.overlayRef) {
        overlay = this.localeOverlayRegistry.get(utterancePolicy.overlayRef)
        if (!overlay) {
          console.warn(`[World] Locale overlay "${utterancePolicy.overlayRef}" not found for entity ${entity.id}`)
        }
      }
      entity.applyLocaleOverlay(overlay)
    }

    this.registerBehaviorTriggers(entity)

    if (typeof (entity as any).attachWorldBridge === 'function') {
      entity.attachWorldBridge({
        broadcastEvent: (type: string, payload?: any) => this.broadcastEvent(type, payload),
        broadcastContext: (context: Record<string, any>) => this.broadcastContext(context)
      })
    }

    // Delegate rendering to renderer
    this.renderer.spawn(entity)

    // Log event if history enabled
    if (this.historyEnabled) {
      this.eventLog.push({
        time: this.worldTime,
        type: 'spawn',
        id: entity.id,
        data: { material: material.material }
      })
    }

    return entity
  }

  /**
   * Spawn field
   */
  spawnField(fieldSpec: MdsFieldSpec, x: number, y: number): Field {
    const field = this.engine.spawnField(fieldSpec, x, y)

    // Delegate field rendering if renderer supports it
    this.renderer.renderField?.(field)

    // Log event if history enabled
    if (this.historyEnabled) {
      this.eventLog.push({
        time: this.worldTime,
        type: 'field_spawn',
        data: { material: fieldSpec.material, x, y }
      })
    }

    return field
  }

  /**
   * Main tick loop (multi-phase update)
   *
   * Phase 1: Physical (v4 delegation - motion, forces)
   * Phase 1.5: Environmental Physics (Phase 5 - if enabled)
   * Phase 2: Mental (v5 ontology - memory decay, emotion drift, emotion-physics coupling)
   * Phase 3: Relational (v5 ontology - emotional contagion, memory formation)
   * Phase 4: Rendering (v5 renderer delegation)
   */
  tick(dt: number): void {
    // v6.7: Optional adaptive time dilation based on collective emotion
    let effectiveDt = dt
    if (this.options.meta?.adaptiveTime) {
      const col = this.cachedCollectiveEmotion ?? { valence: 0, arousal: 0.5, dominance: 0.5 }
      const arousalEnergy = Math.abs(col.arousal - 0.5) * 2  // 0..1
      const valenceTension = Math.min(1, Math.abs(col.valence))
      const energy = Math.min(1, (arousalEnergy * 0.7 + valenceTension * 0.3))
      const k = Math.max(0, Math.min(1, this.options.meta?.timeDilationStrength ?? 0.2))
      effectiveDt = dt * (1 + k * (energy - 0.2))
    }

    this.worldTime += effectiveDt
    this.tickCount++

    // Phase 1: Physical update (v4 delegation)
    this.engine.tick(effectiveDt)

    // Phase 1.5: Environmental Physics (Phase 5 - if enabled)
    if (this.options.features?.physics) {
      this.updatePhysics(effectiveDt)
    }

    // Phase 1.6: Resource Fields (Phase 1 / v5.9 - Material Pressure System)
    this.updateResourceFields(effectiveDt)

    // Phase 2: Mental update (v5 ontology - if enabled)
    if (this.options.features?.ontology) {
      this.updateMental(effectiveDt)
    }

    // Phase 2.5: Communication update (Phase 6 - if enabled)
    if (this.options.features?.communication) {
      this.updateCommunication(effectiveDt)
    }

    // Phase 3: Relational update (v5 ontology - if enabled)
    if (this.options.features?.ontology) {
      this.updateRelational(effectiveDt)
    }

    for (const entity of this.entities) {
      if (typeof entity.pruneDeclarativeState === 'function') {
        entity.pruneDeclarativeState(this.worldTime)
      }
      if (typeof entity.updateBehaviorTimers === 'function') {
        entity.updateBehaviorTimers(effectiveDt, this.worldTime)
      }
    }

    this.evaluateTimeTriggers()

    // Phase 3.5: Cognitive update (Phase 7 - if enabled)
    if (this.options.features?.cognitive) {
      this.updateCognitive(effectiveDt)
    }

    // Phase 4: World mind update (Phase 8 - statistics & patterns)
    this.updateWorldMind()

    // Phase 4.5: Linguistics update (Phase 10 / v6.0 - if enabled)
    if (this.options.features?.linguistics && this.crystallizer) {
      this.updateLinguistics()
    }

    // Phase 5: Rendering update
    if (this.renderer.renderAll) {
      // Batch rendering (Canvas/WebGL)
      this.renderer.renderAll(this.entities, this.fields)
    } else {
      // Per-entity rendering (DOM)
      for (const entity of this.entities) {
        this.renderer.update(entity, effectiveDt)
      }

      // Update fields if renderer supports it
      if (this.renderer.updateField) {
        for (const field of this.fields) {
          this.renderer.updateField(field, effectiveDt)
        }
      }
    }

    this.emit('tick', { time: this.worldTime, dt: effectiveDt })
  }

  /**
   * Broadcast context to all entities
   * v5.8.0 - Auto-context injection system
   *
   * Updates trigger context for ALL entities and checks emotion triggers.
   * Replaces manual entity.updateTriggerContext() + entity.checkEmotionTriggers() calls.
   *
   * @param context - Key-value pairs using dot notation
   * @example
   * world.broadcastContext({
   *   'cpu.usage': 0.85,
   *   'memory.usage': 0.72,
   *   'user.message': 'Hello!'
   * })
   *
   * @example
   * // MDM triggers automatically evaluate against this context:
   * { "trigger": "cpu.usage>0.8", "to": "anxious" }  // Will fire!
   * { "trigger": "user.message", "to": "attentive" } // Will fire!
   */
  broadcastContext(context: Record<string, any>): void {
    if (this.isBroadcastingContext) {
      if (!this.pendingContext) {
        this.pendingContext = { ...context }
      } else {
        Object.assign(this.pendingContext, context)
      }
      return
    }

    this.isBroadcastingContext = true
    try {
      this.applyContext(context)

      while (this.pendingContext) {
        const nextContext = this.pendingContext
        this.pendingContext = null
        this.applyContext(nextContext)
      }
    } finally {
      this.isBroadcastingContext = false
    }
  }

  private applyContext(context: Record<string, any>): void {
    if (!context || Object.keys(context).length === 0) {
      return
    }

    const diff: Record<string, any> = {}
    let changed = false

    for (const [key, value] of Object.entries(context)) {
      if (value === undefined) {
        if (Object.prototype.hasOwnProperty.call(this.contextState, key)) {
          changed = true
          diff[key] = undefined
          delete this.contextState[key]
        }
      } else if (!Object.is(this.contextState[key], value)) {
        changed = true
        diff[key] = value
        this.contextState[key] = value
      }
    }

    for (const entity of this.entities) {
      entity.updateTriggerContext(context)
      entity.applyExternalEmotionDelta(context, this.worldTime)
      entity.checkEmotionTriggers()
    }

    if (!changed) {
      return
    }

    this.emit('context', {
      context: { ...this.contextState },
      diff: { ...diff }
    })
  }

  /**
   * Phase 1.5: Environmental Physics update (Phase 5)
   * - Environment and weather updates
   * - Collision detection and response
   * - Thermal energy transfer (entity ↔ entity, entity ↔ environment)
   * - Humidity exchange
   * - Thermal decay
   */
  private updatePhysics(dt: number): void {
    const entities = this.entities

    // Update environment and weather
    this.environment?.update(dt)
    this.weather?.update(dt)

    // Collision detection and response
    if (this.collisionDetector) {
      this.collisionDetector.update(entities)
      const collisions = this.collisionDetector.detectCollisions(entities)

      for (const collision of collisions) {
        CollisionDetector.resolve(collision)
      }
    }

    // Energy transfer (thermal)
    if (this.energySystem && this.environment) {
      // Entity ↔ Entity thermal transfer
      this.energySystem.updateEntityTransfer(entities, dt)

      // Entity ↔ Environment thermal transfer
      this.energySystem.updateEnvironmentTransfer(entities, this.environment, dt)

      // Entity ↔ Environment humidity exchange
      this.energySystem.updateHumidityTransfer(entities, this.environment, dt)

      // Apply thermal decay (hot entities decay faster)
      for (const entity of entities) {
        this.energySystem.applyThermalDecay(entity, dt)
      }
    }

    // Apply weather effects
    if (this.weather) {
      const weatherState = this.weather.getState()

      // Wind affects velocity
      const windMultiplier = weatherState.windStrength
      if (this.environment) {
        for (const entity of entities) {
          const envState = this.environment.getState(entity.x, entity.y)
          entity.vx += envState.windVx * windMultiplier * dt * 0.01
          entity.vy += envState.windVy * windMultiplier * dt * 0.01
        }
      }

      // Rain increases humidity
      if (weatherState.rain) {
        for (const entity of entities) {
          if (entity.humidity !== undefined) {
            entity.humidity = Math.min(1, entity.humidity + weatherState.rainIntensity * dt * 0.1)
          }
        }
      }

      // Evaporation decreases humidity
      for (const entity of entities) {
        if (entity.humidity !== undefined) {
          entity.humidity = Math.max(0, entity.humidity - weatherState.evaporationRate * dt)
        }
      }
    }
  }

  /**
   * Phase 2: Mental update
   * - Memory decay
   * - Memory pruning
   * - Emotion drift to baseline
   * - Emotion-physics coupling (Phase 5)
   * - Intent timeout evaluation
   */
  private updateMental(dt: number): void {
    for (const entity of this.entities) {
      // Memory decay (v6.5: Reduced rate for longer memory retention)
      if (entity.memory) {
        entity.memory.decay(dt, 0.003)  // 0.3% fade per second (was 0.01 = 1%)
        // Memory lifespan: ~300s (5 min) instead of ~90s (1.5 min)

        // Forget low-salience memories (every 10 seconds)
        // v6.5: Lower threshold to give weak memories more time
        if (this.worldTime % 10 < dt) {
          entity.memory.forget(0.05)  // Remove salience < 0.05 (was 0.1)
        }
      }

      // Emotion drift toward baseline (slowly)
      if (entity.emotion) {
        const baseline = EMOTION_BASELINES.neutral
        const driftRate = 0.01 * dt
        entity.emotion = driftToBaseline(entity.emotion, baseline, driftRate)

        // v6.7: Micro-drift (optional) to prevent long flatlines in homogeneous groups
        const micro = Math.max(0, Math.min(1, this.options.meta?.microDriftStrength ?? 0))
        if (micro > 0) {
          const jitter = (scale: number) => (Math.random() - 0.5) * 2 * scale
          entity.emotion.valence = Math.max(-1, Math.min(1, entity.emotion.valence + jitter(0.01 * micro)))
          entity.emotion.arousal = Math.max(0, Math.min(1, entity.emotion.arousal + jitter(0.01 * micro)))
          const dom = typeof entity.emotion.dominance === 'number' ? entity.emotion.dominance : 0.5
          entity.emotion.dominance = Math.max(0, Math.min(1, dom + jitter(0.01 * micro)))
        }
      }

      // Phase 1.6b: Resource needs update (Task 1.1)
      if (entity.needs && entity.emotion) {
        entity.updateNeeds(dt, this.worldTime)

        // Task 1.4: Record suffering in emotional climate when needs are critical
        const criticalNeeds = entity.getCriticalNeeds()
        if (criticalNeeds.length > 0) {
          // Calculate suffering intensity (average of all critical needs)
          let totalSuffering = 0
          for (const needId of criticalNeeds) {
            const need = entity.getNeed(needId)
            if (need) {
              // Severity = how critical (0 = at threshold, 1 = depleted)
              const severity = 1 - (need.current / need.criticalThreshold)
              totalSuffering += severity
            }
          }
          const avgSuffering = totalSuffering / criticalNeeds.length

          // Record suffering occasionally (1% chance per tick to avoid spam)
          if (Math.random() < 0.01) {
            CollectiveIntelligence.recordSuffering(
              this.emotionalClimate,
              avgSuffering * 0.3,  // Scale down for gentle influence
              this.worldTime
            )
          }
        }

        // Task 1.3: Entities speak about critical needs (link to lexicon)
        if (this.transcript && this.options.features?.linguistics) {
          // Occasional utterances when needs are critical (average of 1 utterance every 20 ticks)
          const speakChance = 0.05  // 5% chance per tick when critical
          if (Math.random() < speakChance) {
            const utterance = entity.speakAboutNeeds()
            if (utterance) {
              this.recordSpeech(entity, utterance)
            }
          }
        }
      }

      // Phase 5: Emotion-Physics coupling (if physics enabled)
      if (this.options.features?.physics && entity.emotion) {
        // Joy (high valence) → reduces entropy (order increases)
        if (entity.emotion.valence > 0.5) {
          const joyStrength = (entity.emotion.valence - 0.5) * 2  // 0..1
          entity.entropy *= Math.pow(0.99, joyStrength * 10)  // Max 10% reduction
        }

        // Fear (high arousal, low dominance) → increases kinetic randomness
        if (entity.emotion.arousal > 0.7 && entity.emotion.dominance < 0.3) {
          const fearStrength = entity.emotion.arousal * (1 - entity.emotion.dominance)
          const randomAngle = Math.random() * Math.PI * 2
          const randomSpeed = fearStrength * 30  // Max 30 px/s
          entity.vx += Math.cos(randomAngle) * randomSpeed * dt
          entity.vy += Math.sin(randomAngle) * randomSpeed * dt
        }

        // Sadness (low valence) → increases viscosity (slows down)
        if (entity.emotion.valence < -0.3) {
          const sadnessStrength = Math.abs(entity.emotion.valence + 0.3) / 1.3  // 0..1
          const dampingFactor = 1 - (sadnessStrength * 0.05)  // Max 5% damping
          entity.vx *= dampingFactor
          entity.vy *= dampingFactor
        }
      }

      // Intent timeout evaluation
      if (entity.intent) {
        entity.intent.update(Date.now())
      }
    }

    // Task 1.4: Update emotional climate (decay over time)
    CollectiveIntelligence.updateEmotionalClimate(this.emotionalClimate, dt)

    // Task 1.5: Calculate climate influence (but don't apply yet)
    // Will be adaptively blended with contagion in Phase 3
    this.cachedClimateInfluence = CollectiveIntelligence.getClimateInfluence(this.emotionalClimate)
  }

  /**
   * Phase 3: Relational update
   * - Pairwise interactions (memory formation, emotional contagion)
   * - Field-based effects
   */
  private updateRelational(dt: number): void {
    const entities = this.entities

    // Pairwise entity interactions
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i]
        const b = entities[j]

        // Skip if either entity doesn't have ontology
        if (!a.memory || !b.memory) continue

        // Calculate distance
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 1

        // Close proximity triggers interactions
        if (dist < 80) {
          // Memory formation (both entities remember each other)
          a.remember({
            timestamp: a.age,
            type: 'interaction',
            subject: b.id,
            content: { distance: dist },
            salience: 1.0 - (dist / 80)  // Closer = more salient
          })

          b.remember({
            timestamp: b.age,
            type: 'interaction',
            subject: a.id,
            content: { distance: dist },
            salience: 1.0 - (dist / 80)
          })

          // Emotional contagion (if both have emotions)
          if (a.emotion && b.emotion) {
            const contagionRate = 0.05 * dt  // 5% per second

            // Calculate pure contagion deltas
            const contagionDeltaA = {
              valence: (b.emotion.valence - a.emotion.valence) * contagionRate,
              arousal: (b.emotion.arousal - a.emotion.arousal) * contagionRate,
              dominance: (b.emotion.dominance - a.emotion.dominance) * contagionRate
            }

            const contagionDeltaB = {
              valence: (a.emotion.valence - b.emotion.valence) * contagionRate,
              arousal: (a.emotion.arousal - b.emotion.arousal) * contagionRate,
              dominance: (a.emotion.dominance - b.emotion.dominance) * contagionRate
            }

            // Adaptive weighting: blend contagion + climate
            // α (contagion weight) = 0.7 default
            // β (climate weight) = 0.3 default
            // Climate influence reduced by tension and population
            const α = 0.7
            const β = 0.3
            const tensionFactor = 1 - this.emotionalClimate.tension
            const populationScale = 1 / (1 + this.entities.length * 0.05)
            const climateWeight = β * tensionFactor * populationScale

            // Blend for entity A
            const blendedDeltaA = {
              valence: (contagionDeltaA.valence * α) + (this.cachedClimateInfluence.valence * climateWeight),
              arousal: (contagionDeltaA.arousal * α) + (this.cachedClimateInfluence.arousal * climateWeight),
              dominance: (contagionDeltaA.dominance * α) + (this.cachedClimateInfluence.dominance * climateWeight)
            }

            // Blend for entity B
            const blendedDeltaB = {
              valence: (contagionDeltaB.valence * α) + (this.cachedClimateInfluence.valence * climateWeight),
              arousal: (contagionDeltaB.arousal * α) + (this.cachedClimateInfluence.arousal * climateWeight),
              dominance: (contagionDeltaB.dominance * α) + (this.cachedClimateInfluence.dominance * climateWeight)
            }

            a.feel(blendedDeltaA)
            b.feel(blendedDeltaB)
          }

          // Memory-based attraction (bonus force based on shared history)
          if (a.memory && b.memory) {
            const memoryStrengthA = a.memory.getStrength(b.id)
            const memoryStrengthB = b.memory.getStrength(a.id)
            const avgMemoryStrength = (memoryStrengthA + memoryStrengthB) / 2

            // Apply bonus attraction if strong memory bond exists
            if (avgMemoryStrength > 0.3) {
              const bonusK = 0.01 * avgMemoryStrength
              const fx = (dx / dist) * bonusK
              const fy = (dy / dist) * bonusK

              a.vx += fx * dt
              a.vy += fy * dt
              b.vx -= fx * dt
              b.vy -= fy * dt
            }
          }
        }
      }
    }

    // Apply climate influence to entities without nearby interactions
    // (solo entities or those beyond interaction range)
    const β = 0.3
    const tensionFactor = 1 - this.emotionalClimate.tension
    const populationScale = 1 / (1 + this.entities.length * 0.05)
    const soloClimateWeight = β * tensionFactor * populationScale

    if (Math.abs(this.cachedClimateInfluence.valence) + Math.abs(this.cachedClimateInfluence.arousal) > 0.001) {
      for (const entity of entities) {
        if (entity.emotion) {
          // Track if entity had any interactions this tick
          let hadInteraction = false
          for (let j = 0; j < entities.length; j++) {
            if (entities[j] === entity) continue
            const other = entities[j]
            const dx = other.x - entity.x
            const dy = other.y - entity.y
            const dist = Math.hypot(dx, dy)
            if (dist < 80 && entity.memory && other.memory) {
              hadInteraction = true
              break
            }
          }

          // Solo entities get pure climate influence (no contagion to blend with)
          if (!hadInteraction) {
            const soloClimateDelta = {
              valence: this.cachedClimateInfluence.valence * soloClimateWeight,
              arousal: this.cachedClimateInfluence.arousal * soloClimateWeight,
              dominance: this.cachedClimateInfluence.dominance * soloClimateWeight
            }
            entity.feel(soloClimateDelta)
          }
        }
      }
    }
  }

  /**
   * Phase 2.5: Communication update (Phase 6)
   * - Message delivery
   * - Dialogue updates (auto-advance)
   * - Language generation triggers
   */
  private updateCommunication(dt: number): void {
    const entities = this.entities

    // Process outbox messages (deliver all pending messages)
    for (const entity of entities) {
      if (!entity.outbox) continue

      const messages = entity.outbox.getAll()
      for (const message of messages) {
        if (!message.delivered) {
          // Deliver message to recipients
          if (message.receiver) {
            // Direct message
            MessageDelivery.deliver(message, entities)
          } else {
            // Broadcast (within radius 200px)
            MessageDelivery.deliverProximity(message, entities, 200)
          }
        }
      }

      // Clear old messages from outbox
      entity.outbox.clearOld(30000)  // Keep last 30 seconds
    }

    // Update dialogues (auto-advance)
    if (this.dialogueManager) {
      this.dialogueManager.update(dt)
    }

    // Clean up old messages from inboxes
    for (const entity of entities) {
      if (entity.inbox) {
        entity.inbox.clearOld(60000)  // Keep last 60 seconds
      }
    }
  }

  /**
   * Phase 3.5: Cognitive update (Phase 7)
   * - Skill decay
   * - Memory consolidation
   * - Pattern forgetting
   */
  private updateCognitive(dt: number): void {
    const entities = this.entities
    const now = Date.now()

    for (const entity of entities) {
      // Skill decay (unused skills deteriorate)
      if (entity.skills) {
        entity.skills.applyDecay(dt)
      }

      // Memory consolidation (merge similar memories periodically)
      if (entity.consolidation && entity.memory) {
        if (entity.consolidation.shouldConsolidate(now)) {
          const memories = entity.memory.getAll()
          entity.consolidation.consolidate(memories)
        }

        // Apply forgetting curve
        entity.consolidation.applyForgetting(dt)
      }

      // Learning pattern forgetting
      if (entity.learning) {
        entity.learning.forgetOldPatterns(now, 300000)  // Forget patterns older than 5 min
      }
    }
  }

  /**
   * Phase 4.5: Linguistics update (Phase 10 / v6.0)
   * - Run crystallizer to detect patterns in transcript
   * - Update lexicon with new terms
   * - Emit emergence events (Layer 5)
   */
  private updateLinguistics(): void {
    if (!this.crystallizer || !this.transcript || !this.lexicon) return

    const outcome = this.crystallizer.tick(this.transcript, this.lexicon)
    this.updateEmergenceStateWithOutcome(outcome)
  }

  private updateEmergenceStateWithOutcome(outcome: CrystallizerTickOutcome): void {
    if (!this.transcript || !this.lexicon) return

    const nowMs = Date.now()
    const windowMs = this.emergenceConfig.windowSeconds * 1000
    const recent = this.transcript.getSince(nowMs - windowMs)
    const total = recent.length

    const normalized = new Set<string>()
    const speakers = new Set<string>()
    for (const utt of recent) {
      normalized.add(LinguisticCrystallizer.normalizeText(utt.text))
      speakers.add(utt.speaker)
    }

    const noveltyInstant = total === 0 ? 0 : normalized.size / total
    const diversityInstant = total === 0 ? 0 : speakers.size / total
    const stats = this.lexicon.getStats()
    const learningInstant = stats.avgWeight || 0

    const prev = this.emergenceState
    const delta = Math.max(1e-3, this.worldTime - prev.lastUpdateTime)
    const halfLife = this.emergenceConfig.noveltyHalfLife
    const noveltyAlpha = halfLife > 0 ? 1 - Math.pow(0.5, delta / halfLife) : 1
    const diversityAlpha = noveltyAlpha
    const learningAlpha = Math.min(1, Math.max(0, this.emergenceConfig.learning.rate * delta))

    const novelty = prev.novelty + noveltyAlpha * (noveltyInstant - prev.novelty)
    const diversity = prev.diversity + diversityAlpha * (diversityInstant - prev.diversity)
    const learning = prev.learning + learningAlpha * (learningInstant - prev.learning)

    const chunkCount = prev.chunkCount + outcome.newEntries.length
    const blendCount = prev.blendCount + outcome.coinedEntries.length
    const lastChunkAt = outcome.newEntries.length > 0 ? this.worldTime : prev.lastChunkAt
    const lastBlendAt = outcome.coinedEntries.length > 0 ? this.worldTime : prev.lastBlendAt

    this.emergenceState = {
      novelty,
      diversity,
      learning,
      lexiconSize: stats.totalTerms,
      windowUtterances: total,
      chunkCount,
      blendCount,
      lastChunkAt,
      lastBlendAt,
      lastUpdateTime: this.worldTime
    }

    if (outcome.newEntries.length > 0) {
      for (const entry of outcome.newEntries) {
        this.logger.push({
          type: 'emergence.chunk',
          data: {
            term: entry.term,
            usage: entry.usageCount,
            origin: entry.origin,
            category: entry.category
          },
          text: `[emergence] chunk "${entry.term}" (${entry.usageCount}×)`
        })
        this.broadcastEvent('emergence.chunk', {
          term: entry.term,
          usage: entry.usageCount,
          origin: entry.origin,
          category: entry.category
        })
      }
    }

    if (outcome.coinedEntries.length > 0) {
      for (const entry of outcome.coinedEntries) {
        this.logger.push({
          type: 'emergence.blend',
          data: {
            term: entry.term,
            usage: entry.usageCount,
            related: entry.relatedTerms
          },
          text: `[emergence] blend "${entry.term}" ⇐ ${entry.relatedTerms?.join(' + ') ?? ''}`.trim()
        })
        this.broadcastEvent('emergence.blend', {
          term: entry.term,
          usage: entry.usageCount,
          related: entry.relatedTerms
        })
      }
    }

    const contextPayload: Record<string, number> = {
      'emergence.novelty': Number(novelty.toFixed(3)),
      'emergence.diversity': Number(diversity.toFixed(3)),
      'emergence.learning': Number(learning.toFixed(3)),
      'emergence.lexicon': stats.totalTerms,
      'emergence.windowUtterances': total
    }

    this.broadcastContext(contextPayload)
  }

  /**
   * Phase 8: Update world mind
   * - Calculate world statistics
   * - Detect emergent patterns
   */
  private updateWorldMind(): void {
    // v6.7: Deterministic analytics update by simulation ticks
    if ((this.tickCount - this.lastStatsTick) >= this.statsUpdateIntervalTicks) {
      this.worldStats = CollectiveIntelligence.calculateStats(this.entities)
      this.patterns = CollectiveIntelligence.detectPatterns(this.entities)
      this.cachedCollectiveEmotion = CollectiveIntelligence.calculateCollectiveEmotion(this.entities)
      this.lastStatsTick = this.tickCount

      this.emit('analytics', {
        stats: this.worldStats,
        patterns: this.patterns,
        collectiveEmotion: this.cachedCollectiveEmotion
      })

      const climateSummary = CollectiveIntelligence.describeClimate(this.emotionalClimate)
      this.broadcastContext({
        'climate.grief': Number(this.emotionalClimate.grief.toFixed(3)),
        'climate.vitality': Number(this.emotionalClimate.vitality.toFixed(3)),
        'climate.tension': Number(this.emotionalClimate.tension.toFixed(3)),
        'climate.harmony': Number(this.emotionalClimate.harmony.toFixed(3)),
        'climate.mood': climateSummary
      })
    }
  }

  /**
   * Get current world statistics
   */
  getWorldStats(): WorldStats | undefined {
    return this.worldStats
  }

  /**
   * Get detected emergent patterns
   */
  getPatterns(): PatternDetection[] {
    return this.patterns
  }

  /**
   * Get collective emotion (world mood)
   */
  getCollectiveEmotion(): import('@mds/1-ontology').EmotionalState | null {
    if (this.cachedCollectiveEmotion === null) {
      this.cachedCollectiveEmotion = CollectiveIntelligence.calculateCollectiveEmotion(this.entities)
    }
    return this.cachedCollectiveEmotion
  }

  getEmergenceState(): WorldEmergenceState {
    const { lastUpdateTime, ...publicState } = this.emergenceState
    return { ...publicState }
  }

  /**
   * v6.0: Record entity speech to transcript
   *
   * @param speaker - Entity who is speaking
   * @param text - What was said
   * @param listener - Optional target entity (if direct message)
   *
   * @example
   * const yuki = world.spawn(yukiMaterial, 100, 100)
   * const says = yuki.speak('greeting')
   * world.recordSpeech(yuki, says)
   */
  recordSpeech(speaker: Entity, text: string, listener?: Entity, mode?: string): void {
    if (!this.transcript) {
      console.warn('v6.0: recordSpeech called but linguistics not enabled')
      return
    }

    // Map PAD emotion model to valence-arousal for linguistics
    // PAD model uses 'pleasure' field, but EmotionalState may use 'valence'
    const emotion = speaker.emotion as any
    const valence = emotion?.pleasure ?? emotion?.valence ?? 0
    const arousal = emotion?.arousal ?? 0.5

    const utterance: Utterance = {
      id: this.generateUUID(),
      speaker: speaker.id,
      text,
      listener: listener?.id,
      timestamp: Date.now(),
      emotion: {
        valence,
        arousal
      }
    }

    if (mode) {
      utterance.mode = mode
    }

    this.transcript.add(utterance)
    this.lastUtterance = { text, speaker: speaker.id }
    this.emit('utterance', utterance)
    this.handleUtteranceTriggers(utterance)

    this.logger.push({
      type: 'utterance',
      text: `${speaker.id}: ${text}`,
      data: {
        entity: speaker.id,
        listener: listener?.id,
        text,
        mode
      }
    })
  }

  /**
   * v6.0: Get lexicon statistics
   *
   * @returns Lexicon stats or undefined if linguistics not enabled
   *
   * @example
   * const stats = world.getLexiconStats()
   * console.log(`Terms: ${stats.totalTerms}, Usage: ${stats.totalUsage}`)
   */
  getLexiconStats(): ReturnType<WorldLexicon['getStats']> | undefined {
    return this.lexicon?.getStats()
  }

  /**
   * v6.0: Get popular terms from lexicon
   *
   * @param minUsage - Minimum usage count (default: 5)
   * @returns Popular terms or empty array if linguistics not enabled
   *
   * @example
   * const popular = world.getPopularTerms(3)
   * console.log(popular.map(e => `${e.term} (${e.usageCount}×)`))
   */
  getPopularTerms(minUsage: number = 5): LexiconEntry[] {
    return this.lexicon?.getPopular(minUsage) ?? []
  }

  /**
   * v6.0: Get recent utterances from transcript
   *
   * @param count - Number of recent utterances (default: 10)
   * @returns Recent utterances or empty array if linguistics not enabled
   *
   * @example
   * const recent = world.getRecentUtterances(5)
   * for (const utt of recent) {
   *   console.log(`${utt.speaker}: ${utt.text}`)
   * }
   */
  getRecentUtterances(count: number = 10): Utterance[] {
    return this.transcript?.getRecent(count) ?? []
  }

  /**
   * Start the simulation loop
   */
  start(): void {
    this.engine.start()
  }

  /**
   * Stop the simulation loop
   */
  stop(): void {
    this.engine.stop()
  }

  /**
   * Remove a specific entity
   */
  removeEntity(entity: Entity): void {
    // Cleanup renderer resources first
    this.renderer.destroy(entity)

    // Remove from engine
    this.engine.removeEntity(entity)

    // Log event if history enabled
    if (this.historyEnabled) {
      this.eventLog.push({
        time: this.worldTime,
        type: 'entity_removed',
        id: entity.id
      })
    }
  }

  /**
   * Clear all entities and fields
   */
  clear(): void {
    // Clear renderer resources
    this.renderer.clear()

    // Clear engine state
    this.engine.clear()
  }

  // v5.4: World Event System API
  /**
   * Event log access (alias for eventLog)
   * Provides broadcast + listen + relay semantics
   *
   * @example
   * // Access event history
   * console.log(world.events)  // Same as world.eventLog
   *
   * @example
   * // Filter events
   * const spawnEvents = world.events.filter(e => e.type === 'spawn')
   */
  get events(): WorldEvent[] {
    return this.eventLog
  }

  /**
   * Broadcast event to world and optionally relay to all entities
   *
   * @param type - Event type (e.g., 'sunrise', 'alarm', 'sensor_reading')
   * @param data - Event payload (any JSON-serializable data)
   * @param relay - If true, send message to all entities via communication system
   *
   * @example
   * // Simple event broadcast
   * world.broadcastEvent('sunrise', { intensity: 0.8 })
   *
   * @example
   * // Broadcast with relay to entities
   * world.broadcastEvent('alarm', { zone: 'living_room' }, true)
   */
  broadcastEvent(type: string, data?: any, relay: boolean = false): void {
    const event: WorldEvent = {
      time: this.worldTime,
      type,
      data
    }

    // Add to event log if history enabled
    if (this.historyEnabled) {
      this.eventLog.push(event)
    }

    // Relay to all entities via communication system
    if (relay && this.options.features?.communication) {
      for (const entity of this.entities) {
        if (entity.inbox) {
          // Create system message
          const systemMessage = {
            id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'signal' as const,
            priority: 'normal' as const,
            sender: { id: 'world', x: 0, y: 0 }, // System sender
            content: `[SYSTEM] ${type}`,
            metadata: { eventData: data },
            timestamp: Date.now(),
            delivered: true,
            read: false
          }
          entity.inbox.enqueue(systemMessage)
        }
      }
    }

    if (this.behaviorEventTriggers.length > 0) {
      this.handleEventTriggers(event)
    }

    for (const entity of this.entities) {
      if (typeof entity.handleDeclarativeEvent === 'function') {
        entity.handleDeclarativeEvent(type, data, this.worldTime)
      }
    }

    this.emit('event', event)
  }

  static async bootstrap(source: WorldBootstrapSource, options: WorldBootstrapOptions = {}): Promise<World> {
    const definition = await World.resolveBootstrapDefinition(source, options)
    const worldOptions = World.mergeWorldOptions(definition, options)
    if (options.logger) {
      worldOptions.logger = options.logger
    }

    const world = new World(worldOptions)
    await world.applyBootstrapDefinition(definition, options)
    world.logger.push({
      type: 'world.bootstrap',
      data: {
        include: definition.include ?? [],
        entities: world.entities.length
      },
      text: `[bootstrap] world ready (${world.entities.length} entities)`
    })
    return world
  }

  private static async resolveBootstrapDefinition(source: WorldBootstrapSource, options: WorldBootstrapOptions): Promise<WorldDefinition> {
    if (typeof source === 'string') {
      const trimmed = source.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed) as WorldDefinition
        return World.cloneDefinition(parsed)
      }
      const payload = await World.fetchDefinition(trimmed, options.fetch)
      return World.cloneDefinition(payload as WorldDefinition)
    }
    return World.cloneDefinition(source)
  }

  private static async fetchDefinition(url: string, fetcher?: (url: string) => Promise<any>): Promise<any> {
    const fn = fetcher ?? (typeof globalThis !== 'undefined' && typeof (globalThis as any).fetch === 'function'
      ? (globalThis as any).fetch.bind(globalThis)
      : undefined)

    if (!fn) {
      throw new Error('World.bootstrap: fetch is not available in this environment. Provide options.fetch.')
    }

    const response = await fn(url)

    if (response && typeof response.json === 'function') {
      if ('ok' in response && response.ok === false) {
        const status = 'status' in response ? response.status : 'unknown'
        throw new Error(`World.bootstrap: failed to fetch ${url} (status ${status})`)
      }
      return await response.json()
    }

    if (response && typeof response.text === 'function') {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch (error) {
        throw new Error(`World.bootstrap: invalid JSON from ${url}: ${(error as Error).message}`)
      }
    }

    if (typeof response === 'string') {
      try {
        return JSON.parse(response)
      } catch (error) {
        throw new Error(`World.bootstrap: invalid JSON string from ${url}: ${(error as Error).message}`)
      }
    }

    return response
  }

  private static cloneDefinition(definition: WorldDefinition): WorldDefinition {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).structuredClone === 'function') {
      return (globalThis as any).structuredClone(definition)
    }
    return JSON.parse(JSON.stringify(definition)) as WorldDefinition
  }

  private static mergeWorldOptions(definition: WorldDefinition, options: WorldBootstrapOptions): WorldOptions {
    const defaults: WorldOptions['features'] = {
      ontology: true,
      history: true,
      communication: true,
      linguistics: true
    }

    const merged: WorldOptions = {}
    const candidateOptions: Array<Partial<WorldOptions> | undefined> = [
      definition.options,
      (definition.world?.options as Partial<WorldOptions> | undefined),
      options.worldOptions
    ]

    for (const candidate of candidateOptions) {
      if (candidate) {
        Object.assign(merged, candidate)
      }
    }

    const featureSources: Array<WorldOptions['features'] | undefined> = [
      defaults,
      (definition.features ?? definition.world?.features) as WorldOptions['features'] | undefined,
      definition.options?.features,
      options.worldOptions?.features
    ]

    merged.features = {}
    for (const feature of featureSources) {
      if (feature) {
        merged.features = { ...merged.features, ...feature }
      }
    }

    merged.features = { ...defaults, ...merged.features }

    return merged
  }

  private async applyBootstrapDefinition(definition: WorldDefinition, options: WorldBootstrapOptions): Promise<void> {
    this.definition = definition

    const packAggregate = await this.loadBootstrapPacks(definition.include, {
      fetch: options.fetch,
      loader: options.packLoader
    })

    if (packAggregate) {
      this.packFunctions = { ...this.packFunctions, ...packAggregate.functions }
      this.packCompose = { ...this.packCompose, ...packAggregate.compose }
      this.packEmergence = { ...this.packEmergence, ...packAggregate.emergence }
      this.rebuildExpressionFunctions()

      this.registerBootstrapMaterials(packAggregate.materials)
      this.registerBootstrapFields(packAggregate.fields)
      this.registerLocaleOverlays(packAggregate.localeOverlays)

      if (packAggregate.notes.length > 0) {
        for (const note of packAggregate.notes) {
          this.logger.push({
            type: 'bootstrap.pack.note',
            data: { note },
            text: `[pack] ${note}`
          })
        }
      }
    }

    this.registerBootstrapMaterials(definition.materials, true)
    if (options.materials) {
      this.registerBootstrapMaterials(options.materials, true)
    }

    this.registerBootstrapFields(definition.fields, true)
    if (options.fields) {
      this.registerBootstrapFields(options.fields, true)
    }

    this.registerLocaleOverlays(definition.localeOverlays, true)
    if (options.localeOverlays) {
      this.registerLocaleOverlays(options.localeOverlays, true)
    }

    this.configureEmergence(definition, options)

    if (options.autoSpawn !== false) {
      this.spawnBootstrapEntities(definition, options)
    }
  }


  private async loadBootstrapPacks(include: string[] | undefined, resolverOpts: PackResolverOptions): Promise<PackAggregate | undefined> {
    if (!include || include.length === 0) return undefined

    const aggregate = await PackResolver.resolve(include, resolverOpts)
    if (aggregate.ids.length > 0) {
      this.logger.push({
        type: 'bootstrap.pack.resolve',
        data: { include, resolved: aggregate.ids },
        text: `[pack] resolved ${aggregate.ids.length} packs`
      })
    }
    return aggregate
  }

  private registerBootstrapMaterials(materials?: Record<string, MdsMaterial>, overwrite = false): void {
    if (!materials) return
    for (const [id, material] of Object.entries(materials)) {
      if (!id || !material) continue
      if (overwrite || !this.materialRegistry.has(id)) {
        this.registerMaterial(id, material)
      }
    }
  }

  private registerBootstrapFields(fields?: Record<string, MdsFieldSpec>, overwrite = false): void {
    if (!fields) return
    for (const [id, field] of Object.entries(fields)) {
      if (!id || !field) continue
      if (overwrite || !this.fieldRegistry.has(id)) {
        this.registerField(id, field)
      }
    }
  }

  private registerLocaleOverlays(
    overlays?: Record<string, MdsLocaleOverlay>,
    overwrite = false
  ): void {
    if (!overlays) return
    for (const [id, spec] of Object.entries(overlays)) {
      if (!id || !spec) continue
      if (!overwrite && this.localeOverlayRegistry.has(id)) continue
      try {
        const parsed = this.mdmParser.parseLocaleOverlay(spec)
        this.localeOverlayRegistry.set(id, parsed)
        this.logger.push({
          type: 'locale.overlay.register',
          data: { id },
          text: `[locale] overlay registered (${id})`
        })
      } catch (error) {
        console.warn(`[World] Failed to parse locale overlay "${id}":`, error)
      }
    }
  }

  private spawnBootstrapEntities(definition: WorldDefinition, options: WorldBootstrapOptions): void {
    if (!Array.isArray(definition.entities) || definition.entities.length === 0) return
    let index = 0
    for (const entityDef of definition.entities) {
      if (!entityDef) {
        index++
        continue
      }
      const material = this.resolveBootstrapMaterial(entityDef, definition, options, index)
      const entity = this.spawn(material, entityDef.spawn)
      if (entityDef.id) {
        if (!this.bootstrapEntityMap) {
          this.bootstrapEntityMap = new Map<string, Entity>()
        }
        this.bootstrapEntityMap.set(entityDef.id, entity)
        ;(entity as any).bootstrapId = entityDef.id
      }

      this.logger.push({
        type: 'bootstrap.spawn',
        data: {
          bootstrapId: entityDef.id,
          material: typeof entityDef.material === 'string'
            ? entityDef.material
            : entityDef.material.material ?? `inline.${index}`,
          entityId: entity.id
        },
        text: `[spawn] ${entityDef.id ?? entity.id} ← ${
          typeof entityDef.material === 'string'
            ? entityDef.material
            : entityDef.material.material ?? `inline.${index}`
        }`
      })
      index++
    }
  }

  private configureEmergence(definition: WorldDefinition, options: WorldBootstrapOptions): void {
    if (!this.crystallizer || !this.transcript || !this.lexicon) return

    const sources: Array<EmergenceOptions | undefined> = []
    sources.push(this.toEmergenceOptions(this.packEmergence))
    sources.push(this.toEmergenceOptions(definition.world?.emergence))
    sources.push(this.toEmergenceOptions(definition.options?.emergence))
    sources.push(this.toEmergenceOptions(this.options.emergence))
    sources.push(this.toEmergenceOptions(options.worldOptions?.emergence))

    if (this.options.linguistics) {
      const ling = this.options.linguistics
      sources.push({
        chunking: {
          analyzeEvery: ling.analyzeEvery,
          minUsage: ling.minUsage
        }
      })
    }

    const config = this.composeEmergenceConfig(sources)
    this.emergenceConfig = config
    this.crystallizer.applyEmergenceConfig({
      analyzeEvery: config.chunking.analyzeEvery,
      minUsage: config.chunking.minUsage,
      warmUpTicks: config.chunking.warmUpTicks,
      warmUpMinUsage: config.chunking.warmUpMinUsage,
      coiningChance: config.blending.chance,
      minSpeakers: config.chunking.minSpeakers
    })

    this.emergenceState = {
      ...this.emergenceState,
      lexiconSize: this.lexicon.getStats().totalTerms,
      lastUpdateTime: this.worldTime
    }

    this.updateEmergenceStateWithOutcome({ newEntries: [], coinedEntries: [] })
  }

  private toEmergenceOptions(value: unknown): EmergenceOptions | undefined {
    if (!value || typeof value !== 'object') return undefined
    const raw = value as Record<string, any>
    const result: EmergenceOptions = {}

    const windowSeconds = this.coerceSeconds(raw.windowSeconds)
    if (windowSeconds !== undefined) result.windowSeconds = windowSeconds

    const noveltyHalfLife = this.coerceSeconds(raw.noveltyHalfLife)
    if (noveltyHalfLife !== undefined) result.noveltyHalfLife = noveltyHalfLife

    if (raw.chunking && typeof raw.chunking === 'object') {
      const chunking = raw.chunking as Record<string, any>
      const chunkOptions: NonNullable<EmergenceOptions['chunking']> = {}

      const analyzeEvery = this.coerceNumber(chunking.analyzeEvery)
      if (analyzeEvery !== undefined) chunkOptions.analyzeEvery = analyzeEvery

      const minUsage = this.coerceNumber(chunking.minUsage)
      if (minUsage !== undefined) chunkOptions.minUsage = minUsage

      const minSpeakers = this.coerceNumber(chunking.minSpeakers)
      if (minSpeakers !== undefined) chunkOptions.minSpeakers = minSpeakers

      const warmUpTicks = this.coerceNumber(chunking.warmUpTicks)
      if (warmUpTicks !== undefined) chunkOptions.warmUpTicks = warmUpTicks

      const warmUpMinUsage = this.coerceNumber(chunking.warmUpMinUsage)
      if (warmUpMinUsage !== undefined) chunkOptions.warmUpMinUsage = warmUpMinUsage

      if (Object.keys(chunkOptions).length > 0) {
        result.chunking = chunkOptions
      }
    }

    if (raw.blending && typeof raw.blending === 'object') {
      const blending = raw.blending as Record<string, any>
      const chance = this.coerceNumber(blending.chance)
      if (chance !== undefined) {
        result.blending = { chance }
      }
    }

    if (raw.learning && typeof raw.learning === 'object') {
      const learning = raw.learning as Record<string, any>
      const rate = this.coerceNumber(learning.rate)
      if (rate !== undefined) {
        result.learning = { rate }
      }
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  private composeEmergenceConfig(sources: Array<EmergenceOptions | undefined>): EmergenceConfig {
    const config = cloneEmergenceConfig(DEFAULT_EMERGENCE_CONFIG)

    for (const source of sources) {
      if (!source) continue

      if (source.windowSeconds !== undefined && isFinite(source.windowSeconds)) {
        config.windowSeconds = Math.max(5, source.windowSeconds)
      }

      if (source.noveltyHalfLife !== undefined && isFinite(source.noveltyHalfLife)) {
        config.noveltyHalfLife = Math.max(1, source.noveltyHalfLife)
      }

      if (source.chunking) {
        if (source.chunking.analyzeEvery !== undefined && isFinite(source.chunking.analyzeEvery)) {
          config.chunking.analyzeEvery = Math.max(1, Math.floor(source.chunking.analyzeEvery))
        }
        if (source.chunking.minUsage !== undefined && isFinite(source.chunking.minUsage)) {
          config.chunking.minUsage = Math.max(1, Math.floor(source.chunking.minUsage))
        }
        if (source.chunking.minSpeakers !== undefined && isFinite(source.chunking.minSpeakers)) {
          config.chunking.minSpeakers = Math.max(1, Math.floor(source.chunking.minSpeakers))
        }
        if (source.chunking.warmUpTicks !== undefined && isFinite(source.chunking.warmUpTicks)) {
          config.chunking.warmUpTicks = Math.max(0, Math.floor(source.chunking.warmUpTicks))
        }
        if (source.chunking.warmUpMinUsage !== undefined && isFinite(source.chunking.warmUpMinUsage)) {
          config.chunking.warmUpMinUsage = Math.max(1, Math.floor(source.chunking.warmUpMinUsage))
        }
      }

      if (source.blending?.chance !== undefined && isFinite(source.blending.chance)) {
        config.blending.chance = Math.max(0, Math.min(1, source.blending.chance))
      }

      if (source.learning?.rate !== undefined && isFinite(source.learning.rate)) {
        config.learning.rate = Math.max(0, source.learning.rate)
      }
    }

    return config
  }

  private coerceSeconds(value: unknown): number | undefined {
    if (typeof value === 'number' && isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = this.parseDuration(value)
      if (parsed !== undefined && isFinite(parsed)) return parsed
      const numeric = Number(value)
      if (isFinite(numeric)) return numeric
    }
    return undefined
  }

  private coerceNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && isFinite(value)) return value
    if (typeof value === 'string') {
      const numeric = Number(value)
      if (isFinite(numeric)) return numeric
    }
    return undefined
  }

  private resolveBootstrapMaterial(
    entityDef: WorldEntityDefinition,
    definition: WorldDefinition,
    options: WorldBootstrapOptions,
    index: number
  ): MdsMaterial {
    const ref = entityDef.material

    if (typeof ref === 'string') {
      const registryMaterial = this.getMaterial(ref)
      if (registryMaterial) return registryMaterial

      const fromDefinition = definition.materials?.[ref]
      if (fromDefinition) {
        this.registerMaterial(ref, fromDefinition)
        return fromDefinition
      }

      const fromOptions = options.materials?.[ref]
      if (fromOptions) {
        this.registerMaterial(ref, fromOptions)
        return fromOptions
      }

      throw new Error(`World.bootstrap: material "${ref}" not found`)
    }

    const inlineId = ref.material ?? entityDef.id ?? `inline.${index}`
    if (!this.materialRegistry.has(inlineId)) {
      this.registerMaterial(inlineId, ref)
    }
    return this.materialRegistry.get(inlineId) as MdsMaterial
  }

  getBootstrapEntity(id: string): Entity | undefined {
    return this.bootstrapEntityMap?.get(id)
  }

  private registerBehaviorTriggers(entity: Entity): void {
    const configs = entity.getBehaviorTriggersConfig?.()
    if (!configs || configs.length === 0) return

    for (const config of configs) {
      const runtime = this.compileBehaviorTrigger(entity, config)
      if (!runtime) continue
      this.logger.push({
        type: 'behavior.trigger.register',
        data: { entity: entity.id, on: config.on }
      })
      switch (runtime.pattern.kind) {
        case 'time.every':
          this.behaviorTimeTriggers.push(runtime)
          break
        case 'mention':
          this.behaviorMentionTriggers.push(runtime)
          break
        case 'event':
          this.behaviorEventTriggers.push(runtime)
          break
      }
    }
  }

  private compileBehaviorTrigger(entity: Entity, config: ParsedBehaviorTrigger): BehaviorTriggerRuntime | undefined {
    if (!config.on || config.actions.length === 0) return undefined

    let pattern: BehaviorTriggerPattern | undefined
    const timeMatch = config.on.match(/^time\.every\((\d+(?:\.\d+)?)(ms|s|m|h|d)?\)$/)
    if (timeMatch) {
      const value = parseFloat(timeMatch[1])
      if (!isFinite(value)) return undefined
      const unit = timeMatch[2] ?? 's'
      const interval = Math.max(0.001, this.convertIntervalToSeconds(value, unit))
      pattern = { kind: 'time.every', interval, nextFire: this.worldTime + interval }
    } else {
      const mentionMatch = config.on.match(/^mention\(([^)]+)\)$/i)
      if (mentionMatch) {
        const rawTarget = mentionMatch[1].trim()
        const normalised = rawTarget.toLowerCase()
        let mapped: 'any' | 'self' | 'others' = 'any'
        if (normalised === 'self') {
          mapped = 'self'
        } else if (normalised === 'others' || normalised === 'anyone') {
          mapped = 'others'
        } else if (normalised === 'any' || normalised === '*') {
          mapped = 'any'
        }

        let entityRef: string | undefined
        if (mapped === 'any' && normalised !== 'any' && normalised !== '*') {
          entityRef = rawTarget.replace(/^@/, '')
        }

        pattern = { kind: 'mention', target: mapped, entityRef: entityRef ? entityRef.toLowerCase() : undefined }
      } else {
        const eventMatch = config.on.match(/^event\(([^)]+)\)$/i)
        if (eventMatch) {
          const raw = eventMatch[1].trim()
          const normalised = raw.toLowerCase()
          if (normalised === 'any' || raw === '*') {
            pattern = { kind: 'event', event: '*', match: 'any' }
          } else if (raw.endsWith('*')) {
            const prefix = raw.slice(0, -1).trim()
            if (prefix.length > 0) {
              pattern = { kind: 'event', event: prefix.toLowerCase(), match: 'prefix' }
            }
          } else {
            pattern = { kind: 'event', event: normalised, match: 'exact' }
          }
        }
      }
    }

    if (!pattern) {
      console.warn(`[World] Unrecognised behavior trigger pattern "${config.on}" for entity ${entity.id}`)
      return undefined
    }

    const whereExpr = config.where ? this.createExpression(config.where) : undefined
    const actions: BehaviorActionRuntime[] = []
    for (const action of config.actions) {
      const compiled = this.compileBehaviorAction(action)
      if (compiled) actions.push(compiled)
    }

    if (actions.length === 0) return undefined

    return {
      entity,
      config,
      pattern,
      where: whereExpr,
      actions
    }
  }

  private compileBehaviorAction(action: ParsedBehaviorAction): BehaviorActionRuntime | undefined {
    switch (action.kind) {
      case 'say':
        return { kind: 'say', mode: action.mode, text: action.text, lang: action.lang }
      case 'mod.emotion': {
        const v = action.v ? this.createExpression(action.v) : undefined
        const a = action.a ? this.createExpression(action.a) : undefined
        const d = action.d ? this.createExpression(action.d) : undefined
        if (!v && !a && !d) return undefined
        return { kind: 'mod.emotion', v, a, d }
      }
      case 'relation.update': {
        const formulaSource = action.formula
        if (!formulaSource) return undefined
        let metric = action.metric ?? 'trust'
        let mode: 'absolute' | 'delta' = 'absolute'
        let source = formulaSource
        const assignMatch = formulaSource.match(/^([\w.]+)\s*\+=\s*(.+)$/)
        if (assignMatch) {
          metric = action.metric ?? assignMatch[1]
          source = assignMatch[2]
          mode = 'delta'
        }
        const expr = this.createExpression(source)
        if (!expr) return undefined
        return { kind: 'relation.update', target: action.target, metric, expr, mode }
      }
      case 'memory.write': {
        const salience = action.salience ? this.createExpression(action.salience) : undefined
        return {
          kind: 'memory.write',
          target: action.target,
          memoryKind: action.memoryKind,
          salience,
          value: action.value
        }
      }
      case 'memory.recall': {
        return { kind: 'memory.recall', target: action.target, memoryKind: action.memoryKind, window: action.window }
      }
      case 'context.set': {
        const entries: Record<string, Expression | string> = {}
        for (const [key, value] of Object.entries(action.entries)) {
          if (value === undefined || value === null) continue
          const trimmed = String(value).trim()
          if (!trimmed) continue

          const isTemplate = trimmed.includes('{{') && trimmed.includes('}}')
          if (isTemplate) {
            entries[key] = trimmed
            continue
          }

          let expr: Expression | undefined
          try {
            expr = this.createExpression(trimmed)
          } catch (error) {
            expr = undefined
          }
          if (expr) {
            entries[key] = expr
          } else {
            entries[key] = trimmed
          }
        }
        if (Object.keys(entries).length === 0) return undefined
        return { kind: 'context.set', entries }
      }
      case 'emit': {
        const payload: Record<string, Expression> = {}
        if (action.payload) {
          for (const [key, value] of Object.entries(action.payload)) {
            const expr = this.createExpression(value)
            if (expr) payload[key] = expr
          }
        }
        return { kind: 'emit', event: action.event, payload }
      }
      case 'log':
        return { kind: 'log', text: action.text }
      case 'translation.learn':
        return {
          kind: 'translation.learn',
          source: action.source,
          lang: action.lang,
          text: action.text
        }
      default:
        return undefined
    }
  }

  private convertIntervalToSeconds(value: number, unit: string): number {
    switch (unit) {
      case 'ms':
        return value / 1000
      case 'm':
        return value * 60
      case 'h':
        return value * 3600
      case 'd':
        return value * 86400
      case 's':
      default:
        return value
    }
  }

  private parseDuration(value: string): number | undefined {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    if (trimmed.toLowerCase() === 'infinite' || trimmed === 'Infinity') return Infinity
    const match = trimmed.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/)
    if (!match) return undefined
    const amount = parseFloat(match[1])
    if (!isFinite(amount)) return undefined
    const unit = match[2] ?? 's'
    return this.convertIntervalToSeconds(amount, unit)
  }

  private rebuildExpressionFunctions(): void {
    const collected: Record<string, Function> = {}

    const walk = (value: unknown, path: string): void => {
      if (typeof value === 'function') {
        if (path) {
          collected[path] = value as Function
        }
        return
      }
      if (!value || typeof value !== 'object') return
      if (Array.isArray(value)) return

      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const nextPath = path ? `${path}.${key}` : key
        walk(child, nextPath)
      }
    }

    if (this.packFunctions && typeof this.packFunctions === 'object') {
      for (const [key, value] of Object.entries(this.packFunctions)) {
        walk(value, key)
      }
    }

    this.expressionFunctions = collected
  }

  private filterMemoriesByWindow(memories: Memory[], windowSeconds: number): Memory[] {
    if (!isFinite(windowSeconds) || windowSeconds <= 0) {
      return [...memories]
    }
    if (windowSeconds === Infinity) {
      return [...memories]
    }

    const worldThreshold = this.worldTime - windowSeconds
    const realThreshold = Date.now() - windowSeconds * 1000

    return memories.filter(memory => {
      const timestamp = memory.timestamp
      if (typeof timestamp !== 'number') return true

      // Heuristic: timestamps near world time are treated as simulation seconds.
      if (Math.abs(timestamp - this.worldTime) <= windowSeconds * 2) {
        return timestamp >= worldThreshold
      }

      // Otherwise assume real-time milliseconds.
      return timestamp >= realThreshold
    })
  }

  private evaluateTimeTriggers(): void {
    if (this.behaviorTimeTriggers.length === 0) return

    for (const runtime of this.behaviorTimeTriggers) {
      if (runtime.pattern.kind !== 'time.every') continue
      while (this.worldTime >= runtime.pattern.nextFire) {
        runtime.pattern.nextFire += runtime.pattern.interval
        const eventContext: BehaviorEventContext = { type: 'time' }
        this.runBehaviorTrigger(runtime, eventContext)
      }
    }
  }

  private handleUtteranceTriggers(utterance: Utterance): void {
    if (this.behaviorMentionTriggers.length === 0) return
    const speaker = this.entities.find(entity => entity.id === utterance.speaker)

    for (const runtime of this.behaviorMentionTriggers) {
      if (runtime.pattern.kind !== 'mention') continue
      if (runtime.pattern.target === 'self' && speaker?.id !== runtime.entity.id) continue
      if (runtime.pattern.target === 'others' && speaker?.id === runtime.entity.id) continue
      if (!speaker && runtime.pattern.target !== 'any') continue
      if (runtime.pattern.entityRef && speaker) {
        const speakerId = speaker.id.toLowerCase()
        const bootstrapId = (speaker as any)?.bootstrapId
        const bootstrapLower = typeof bootstrapId === 'string' ? bootstrapId.toLowerCase() : undefined
        if (speakerId !== runtime.pattern.entityRef && bootstrapLower !== runtime.pattern.entityRef) {
          continue
        }
      }

      runtime.entity.updateTriggerContext?.({
        userMessage: utterance.text,
        lastSpeaker: speaker?.id,
        userSilenceDuration: 0
      })

      const metrics = { agreement: 1, novelty: 1 }
      const eventContext: BehaviorEventContext = {
        type: 'mention',
        utterance,
        speaker,
        listener: runtime.entity,
        metrics
      }
      this.runBehaviorTrigger(runtime, eventContext)
    }
  }

  private handleEventTriggers(event: WorldEvent): void {
    if (this.behaviorEventTriggers.length === 0) return

    const eventTypeLower = event.type.toLowerCase()

    for (const runtime of this.behaviorEventTriggers) {
      if (runtime.pattern.kind !== 'event') continue
      const pattern = runtime.pattern

      let matches = false
      switch (pattern.match) {
        case 'any':
          matches = true
          break
        case 'exact':
          matches = eventTypeLower === pattern.event
          break
        case 'prefix':
          matches = eventTypeLower.startsWith(pattern.event)
          break
      }
      if (!matches) continue

      runtime.entity.updateTriggerContext?.({
        'event.type': event.type,
        'event.payload': event.data
      })

      const eventContext: BehaviorEventContext = { type: 'event', event }
      this.runBehaviorTrigger(runtime, eventContext)
    }
  }

  private runBehaviorTrigger(runtime: BehaviorTriggerRuntime, eventContext: BehaviorEventContext): void {
    const context = this.buildBehaviorContext(runtime.entity, eventContext)
    if (runtime.where) {
      const result = runtime.where.evaluate(context)
      if (!this.toBoolean(result)) {
        return
      }
    }

    this.executeBehaviorActions(runtime, context, eventContext)
  }

  private executeBehaviorActions(
    runtime: BehaviorTriggerRuntime,
    context: Record<string, any>,
    eventContext: BehaviorEventContext
  ): void {
    for (const action of runtime.actions) {
      switch (action.kind) {
        case 'say': {
          const translationSource = eventContext.utterance?.text
            ?? (eventContext.event && typeof eventContext.event.data?.text === 'string' ? eventContext.event.data.text : undefined)
            ?? this.lastUtterance?.text
            ?? ''
          const translations = translationSource
            ? runtime.entity.translateAll(translationSource)
            : {}
          const templateContext = {
            ...context,
            event: eventContext,
            last: {
              utterance: this.lastUtterance?.text ?? '',
              speaker: this.lastUtterance?.speaker ?? ''
            },
            translate: translations
          }
          const rendered = action.text !== undefined
            ? replacePlaceholders(action.text, templateContext)
            : eventContext.utterance?.text
          const vocabulary = this.lexicon
            ? this.lexicon.getAll().map(entry => entry.term)
            : undefined
          const finalText = runtime.entity.formatUtterance(rendered, {
            mode: action.mode,
            lang: action.lang,
            protoGenerator: this.protoGenerator,
            vocabulary
          })
          if (finalText && finalText.trim().length > 0) {
            const modeUsed = runtime.entity.getLastUtteranceMode?.()
            context.utterance = {
              ...(context.utterance ?? {}),
              text: finalText,
              mode: modeUsed
            }
            runtime.entity.updateTriggerContext?.({
              'utterance.text': finalText,
              'utterance.mode': modeUsed
            })
            this.recordSpeech(runtime.entity, finalText, undefined, modeUsed)
            this.lastUtterance = { text: finalText, speaker: runtime.entity.id }
            this.logger.push({
              type: 'behavior.say',
              text: `${runtime.entity.id}: ${finalText}`,
              data: {
                entity: runtime.entity.id,
                text: finalText,
                mode: modeUsed,
                climate: this.safeClimateSnapshot(runtime.entity),
                needs: runtime.entity.getCriticalNeeds()
              }
            })
          }
          break
        }
        case 'mod.emotion': {
          if (!runtime.entity.emotion) {
            runtime.entity.emotion = {
              valence: 0,
              arousal: 0.5,
              dominance: 0.5
            } as EmotionalState
          }
          const emotion = runtime.entity.emotion
          if (action.v) {
            const value = this.evaluateNumberExpression(action.v, context)
            if (value !== undefined) {
              emotion.valence = Math.max(-1, Math.min(1, value))
              context.v = emotion.valence
            }
          }
          if (action.a) {
            const value = this.evaluateNumberExpression(action.a, context)
            if (value !== undefined) {
              emotion.arousal = Math.max(0, Math.min(1, value))
              context.a = emotion.arousal
            }
          }
          if (action.d) {
            const value = this.evaluateNumberExpression(action.d, context)
            if (value !== undefined) {
              const next = Math.max(0, Math.min(1, value))
              emotion.dominance = next
              context.d = next
            }
          }
          break
        }
        case 'relation.update': {
          let targetId = action.target
          if (!targetId && eventContext.speaker) {
            targetId = eventContext.speaker.id
          }
          if (!targetId) break
          if (!runtime.entity.relationships) {
            runtime.entity.enable?.('relationships')
            runtime.entity.relationships ??= new Map<string, any>()
          }
          const relationships = runtime.entity.relationships
          if (!relationships) break
          let relationship = relationships.get(targetId) as (Relationship & Record<string, number>) | undefined
          if (!relationship) {
            relationship = createRelationship(0, 0) as Relationship & Record<string, number>
            relationships.set(targetId, relationship)
          }
          const metric = action.metric
          const currentValue = typeof relationship[metric] === 'number' ? relationship[metric] : 0
          const contextWithMetric = { ...context, [metric]: currentValue }
          const computedRaw = this.evaluateNumberExpression(action.expr, contextWithMetric)
          if (typeof computedRaw !== 'number') break
          let nextValue = action.mode === 'delta' ? currentValue + computedRaw : computedRaw
          if (nextValue < 0) nextValue = 0
          if (nextValue > 1) nextValue = 1
          relationship[metric] = nextValue
          context[metric] = nextValue
          break
        }
        case 'memory.write': {
          if (!runtime.entity.memory) {
            runtime.entity.enable?.('memory')
          }
          if (!runtime.entity.memory) break
          const salience = action.salience ? this.evaluateNumberExpression(action.salience, context) ?? 0.5 : 0.5
          const templateContext = {
            ...context,
            event: eventContext,
            last: {
              utterance: this.lastUtterance?.text ?? '',
              speaker: this.lastUtterance?.speaker ?? ''
            }
          }
          const value = action.value ? replacePlaceholders(action.value, templateContext) : eventContext.utterance?.text
          runtime.entity.remember({
            timestamp: this.worldTime,
            type: (action.memoryKind as any) ?? 'fact',
            subject: action.target ?? (eventContext.speaker?.id ?? 'event'),
            content: { value },
            salience
          })
          break
        }
        case 'memory.recall': {
          if (!runtime.entity.memory) {
            runtime.entity.enable?.('memory')
          }
          const buffer = runtime.entity.memory
          if (!buffer) break

          const templateContext = {
            ...context,
            event: eventContext,
            last: {
              utterance: this.lastUtterance?.text ?? '',
              speaker: this.lastUtterance?.speaker ?? ''
            }
          }

          let subject = action.target
          if (subject) {
            const rendered = replacePlaceholders(subject, templateContext)
            subject = rendered?.trim().length ? rendered : subject
          } else if (eventContext.speaker) {
            subject = eventContext.speaker.id
          }

          const filter: MemoryFilter = {}
          let windowSeconds: number | undefined

          if (action.memoryKind) {
            filter.type = action.memoryKind as MemoryFilter['type']
          }
          if (subject && subject.trim().length > 0) {
            filter.subject = subject.trim()
          }
          if (action.window) {
            const parsedWindow = this.parseDuration(action.window)
            if (parsedWindow !== undefined && parsedWindow >= 0) {
              windowSeconds = parsedWindow
            }
          }

          const baseFilter = Object.keys(filter).length > 0 ? filter : undefined
          const recalled: Memory[] = buffer.recall(baseFilter)
          const filtered = windowSeconds !== undefined
            ? this.filterMemoriesByWindow(recalled, windowSeconds)
            : recalled
          const latest = filtered.length > 0 ? filtered[filtered.length - 1] : undefined

          setPathValue(context, 'memory.recall.items', filtered)
          setPathValue(context, 'memory.recall.latest', latest)
          setPathValue(context, 'memory.recall.count', filtered.length)
          break
        }
        case 'context.set': {
          if (!action.entries || Object.keys(action.entries).length === 0) break
          const payload: Record<string, any> = {}
          const templateContext = {
            ...context,
            event: eventContext,
            last: {
              utterance: this.lastUtterance?.text ?? '',
              speaker: this.lastUtterance?.speaker ?? ''
            }
          }
          for (const [key, expr] of Object.entries(action.entries)) {
            let value: any
            if (expr instanceof Expression) {
              value = expr.evaluate(context)
            } else if (typeof expr === 'string') {
              value = replacePlaceholders(expr, templateContext)
            } else {
              value = expr
            }
            setPathValue(context, key, value)
            payload[key] = value
          }
          if (Object.keys(payload).length > 0) {
            runtime.entity.updateTriggerContext?.(payload)
            this.broadcastContext(payload)
          }
          break
        }
        case 'emit': {
          const payload: Record<string, any> = {}
          if (action.payload) {
            for (const [key, expr] of Object.entries(action.payload)) {
              payload[key] = expr.evaluate(context)
            }
          }
          this.broadcastEvent(action.event, payload)
          break
        }
        case 'log':
          this.logger.push({
            type: 'behavior.log',
            data: { entity: runtime.entity.id },
            text: action.text
          })
          break
        case 'translation.learn': {
          const templateContext = {
            ...context,
            event: eventContext,
            last: {
              utterance: this.lastUtterance?.text ?? '',
              speaker: this.lastUtterance?.speaker ?? ''
            }
          }
          const rawSource = action.source
            ? replacePlaceholders(action.source, templateContext)
            : (eventContext.utterance?.text ?? this.lastUtterance?.text ?? '')
          const lang = action.lang ? replacePlaceholders(action.lang, templateContext) : ''
          const translatedText = replacePlaceholders(action.text, templateContext)
          if (rawSource && lang && translatedText) {
            runtime.entity.learnTranslation(rawSource, lang, translatedText)
            const translations = runtime.entity.translateAll(rawSource)
            context.translate = translations
            runtime.entity.updateTriggerContext?.({
              'translation.last.source': rawSource,
              'translation.last.lang': lang,
              'translation.last.text': translatedText
            })
            runtime.entity.handleDeclarativeEvent?.(
              'translation.learn',
              { source: rawSource, lang, text: translatedText },
              this.worldTime
            )
            this.logger.push({
              type: 'translation.learn',
              text: `${runtime.entity.id} learned ${lang}: ${translatedText}`,
              data: {
                entity: runtime.entity.id,
                source: rawSource,
                lang,
                text: translatedText
              }
            })
          }
          break
        }
      }
    }
  }

  private buildBehaviorContext(entity: Entity, eventContext: BehaviorEventContext): Record<string, any> {
    const emotion = entity.emotion ?? { valence: 0, arousal: 0.5, dominance: 0.5 }
    return {
      time: { world: this.worldTime, tick: this.tickCount },
      entity: {
        id: entity.id,
        emotion,
        position: { x: entity.x, y: entity.y }
      },
      event: eventContext,
      last: {
        utterance: this.lastUtterance?.text ?? '',
        speaker: this.lastUtterance?.speaker ?? ''
      },
      metrics: eventContext.metrics ?? { agreement: 1, novelty: 1 },
      pack: {
        functions: this.packFunctions,
        compose: this.packCompose,
        emergence: this.packEmergence
      },
      v: emotion.valence ?? 0,
      a: emotion.arousal ?? 0.5,
      d: typeof emotion.dominance === 'number' ? emotion.dominance : 0.5
    }
  }

  private safeClimateSnapshot(entity: Entity): Record<string, number | string> | undefined {
    const context = entity.getTriggerContextSnapshot?.()
    if (!context) return undefined

    const keys = [
      'climate.grief',
      'climate.vitality',
      'climate.tension',
      'climate.harmony',
      'climate.mood'
    ]

    const result: Record<string, number | string> = {}
    for (const key of keys) {
      const value = context[key]
      if (typeof value === 'number' && isFinite(value)) {
        result[key] = Number(value.toFixed(3))
      } else if (typeof value === 'string' && value.trim().length > 0) {
        result[key] = value
      }
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  private createExpression(source?: string): Expression | undefined {
    if (!source) return undefined
    try {
      const functionMap = Object.keys(this.expressionFunctions).length > 0
        ? this.expressionFunctions
        : undefined
      return new Expression(source, functionMap)
    } catch (error) {
      console.warn('[World] Failed to compile expression', source, error)
      return undefined
    }
  }

  private evaluateNumberExpression(expr: Expression | undefined, context: Record<string, any>): number | undefined {
    if (!expr) return undefined
    const value = expr.evaluate(context)
    if (typeof value === 'number' && isFinite(value)) return value
    if (typeof value === 'string') {
      const num = parseFloat(value)
      if (!isNaN(num)) return num
    }
    if (typeof value === 'boolean') return value ? 1 : 0
    return undefined
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value.length > 0 && value !== '0'
    return Boolean(value)
  }

  /**
   * Listen for events matching predicate
   *
   * @param predicate - Filter function (returns true to include event)
   * @returns Array of matching events
   *
   * @example
   * // Get all sunrise events
   * const sunEvents = world.listenForEvents(e => e.type === 'sunrise')
   *
   * @example
   * // Get events in last 10 seconds
   * const recentEvents = world.listenForEvents(e =>
   *   world.worldTime - e.time < 10
   * )
   *
   * @example
   * // Complex filtering
   * const criticalEvents = world.listenForEvents(e =>
   *   e.type.includes('alarm') && e.data?.severity === 'high'
   * )
   */
  listenForEvents(predicate: (event: WorldEvent) => boolean): WorldEvent[] {
    return this.eventLog.filter(predicate)
  }

  /**
   * Snapshot (v4 legacy, lightweight)
   */
  snapshot() {
    return this.engine.snapshot()
  }

  /**
   * Restore from snapshot (v4 legacy)
   */
  restore(
    snapshot: ReturnType<Engine['snapshot']>,
    materialMap: Map<string, MdsMaterial>,
    fieldMap: Map<string, MdsFieldSpec>
  ): void {
    this.engine.restore(snapshot, materialMap, fieldMap)
  }

  /**
   * Get RNG (for entity spawning)
   */
  getRng(): () => number {
    return this.engine.getRng()
  }

  /**
   * Configure options
   */
  configure(options: Partial<WorldOptions>): void {
    this.options = { ...this.options, ...options }

    // Pass through engine options
    if (options.seed !== undefined ||
        options.worldBounds !== undefined ||
        options.boundaryBehavior !== undefined ||
        options.boundaryBounceDamping !== undefined) {
      this.engine.configure({
        seed: options.seed,
        worldBounds: options.worldBounds,
        boundaryBehavior: options.boundaryBehavior,
        boundaryBounceDamping: options.boundaryBounceDamping
      })
    }
  }

  /**
   * Get options
   */
  getOptions(): WorldOptions {
    return { ...this.options }
  }

  // ========================================
  // Phase 1: Resource Field Management (v5.9)
  // ========================================

  /**
   * Add resource field to world
   *
   * @param field - Resource field configuration
   * @returns The added field
   *
   * @example
   * // Add water well
   * world.addResourceField({
   *   id: 'well_1',
   *   resourceType: 'water',
   *   type: 'point',
   *   position: { x: 200, y: 200 },
   *   intensity: 1.0,
   *   regenerationRate: 0.005
   * })
   */
  addResourceField(field: ResourceField): ResourceField {
    this.resourceFields.set(field.id, field)
    return field
  }

  /**
   * Remove resource field from world
   *
   * @param id - Field identifier
   *
   * @example
   * world.removeResourceField('well_1')
   */
  removeResourceField(id: string): void {
    this.resourceFields.delete(id)
  }

  /**
   * Get resource field by ID
   *
   * @param id - Field identifier
   * @returns Resource field or undefined
   */
  getResourceField(id: string): ResourceField | undefined {
    return this.resourceFields.get(id)
  }

  /**
   * Get all resource fields (optionally filtered by type)
   *
   * @param resourceType - Filter by resource type (optional)
   * @returns Array of resource fields
   *
   * @example
   * const waterFields = world.getResourceFields('water')
   */
  getResourceFields(resourceType?: string): ResourceField[] {
    const fields = Array.from(this.resourceFields.values())

    if (resourceType) {
      return fields.filter(field => field.resourceType === resourceType)
    }

    return fields
  }

  /**
   * Get resource intensity at position
   *
   * @param resourceType - Resource type (e.g., 'water')
   * @param x - Position X
   * @param y - Position Y
   * @returns Combined intensity from all fields of that type (0..1+)
   *
   * @example
   * const waterIntensity = world.getResourceIntensity('water', entity.x, entity.y)
   * if (waterIntensity > 0.5) {
   *   entity.satisfyNeed('water', waterIntensity * 0.1)
   * }
   */
  getResourceIntensity(resourceType: string, x: number, y: number): number {
    const fields = this.getResourceFields(resourceType)
    let totalIntensity = 0

    for (const field of fields) {
      totalIntensity += getIntensityAt(field, x, y)
    }

    return totalIntensity
  }

  /**
   * Find nearest resource field to position
   *
   * @param x - Position X
   * @param y - Position Y
   * @param resourceType - Filter by resource type (optional)
   * @returns Nearest field or undefined
   *
   * @example
   * const nearestWater = world.findNearestResourceField(entity.x, entity.y, 'water')
   * if (nearestWater) {
   *   console.log(`Water field "${nearestWater.id}" at distance ${distance}`)
   * }
   */
  findNearestResourceField(
    x: number,
    y: number,
    resourceType?: string
  ): ResourceField | undefined {
    return findNearestField(Array.from(this.resourceFields.values()), x, y, resourceType)
  }

  /**
   * Consume resource from field at position
   *
   * @param resourceType - Resource type to consume
   * @param x - Position X
   * @param y - Position Y
   * @param amount - Amount to consume (0..1)
   * @returns Actual amount consumed (may be less if field is depleted)
   *
   * @example
   * const consumed = world.consumeResource('water', entity.x, entity.y, 0.3)
   * entity.satisfyNeed('water', consumed)
   */
  consumeResource(resourceType: string, x: number, y: number, amount: number): number {
    const fields = this.getResourceFields(resourceType)
    let totalConsumed = 0
    let remaining = amount

    // Try to consume from all nearby fields until satisfied
    for (const field of fields) {
      if (remaining <= 0) break

      const consumed = consumeFrom(field, x, y, remaining, this.worldTime)
      totalConsumed += consumed
      remaining -= consumed
    }

    return totalConsumed
  }

  /**
   * Update all resource fields (depletion and regeneration)
   * Called automatically during tick loop
   *
   * @param dt - Delta time in seconds
   */
  private updateResourceFields(dt: number): void {
    for (const field of this.resourceFields.values()) {
      updateResourceField(field, dt, this.worldTime)
    }
  }

  /**
   * Record entity death in emotional climate (Task 1.4)
   *
   * @param entity - Entity that died
   * @param intensity - How significant the death (0..1, default: 0.5)
   *
   * @example
   * // When entity dies of thirst
   * world.recordEntityDeath(entity, 0.8)  // High intensity
   * world.despawn(entity)
   */
  recordEntityDeath(entity: Entity, intensity: number = 0.5): void {
    CollectiveIntelligence.recordDeath(
      this.emotionalClimate,
      entity.id,
      intensity,
      this.worldTime
    )
  }

  /**
   * Get current emotional climate state
   *
   * @returns Emotional climate snapshot
   *
   * @example
   * const climate = world.getEmotionalClimate()
   * console.log(`Grief: ${climate.grief}, Vitality: ${climate.vitality}`)
   * console.log(CollectiveIntelligence.describeClimate(climate))
   * // → "Grieving and tense"
   */
  getEmotionalClimate(): EmotionalClimate {
    return { ...this.emotionalClimate }
  }

  /**
   * Cleanup and destroy world
   */
  destroy(): void {
    this.disposeAllContextProviders()
    // Dispose renderer resources
    this.renderer.dispose()

    // Destroy engine
    this.engine.destroy()
  }
  getPackFunction(name: string): unknown {
    return this.packFunctions[name]
  }

  getPackCompose(): Record<string, unknown> {
    return { ...this.packCompose }
  }

  getPackEmergence(): Record<string, unknown> {
    return { ...this.packEmergence }
  }

  getLocaleOverlay(id: string): ParsedLocaleOverlay | undefined {
    return this.localeOverlayRegistry.get(id)
  }

}
