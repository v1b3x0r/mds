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
import type { MdsMaterial } from '@mds/schema/mdspec'
import type { MdsField as MdsFieldSpec } from '@mds/schema/fieldspec'
import { Entity } from '@mds/0-foundation/entity'
import { Field } from '@mds/0-foundation/field'
import {
  driftToBaseline,
  EMOTION_BASELINES
} from '@mds/1-ontology'
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
  PatternDetection
} from '@mds/3-cognition/world-mind'

// v5.8.4: Direct imports to avoid circular dependency (world/index.ts exports World)
import { TranscriptBuffer } from '@mds/6-world/linguistics/transcript'
import type { Utterance } from '@mds/6-world/linguistics/transcript'

import { WorldLexicon } from '@mds/6-world/linguistics/lexicon'
import type { LexiconEntry } from '@mds/6-world/linguistics/lexicon'

import { LinguisticCrystallizer } from '@mds/6-world/linguistics/crystallizer'
import type { CrystallizerConfig } from '@mds/6-world/linguistics/crystallizer'

import { ProtoLanguageGenerator } from '@mds/6-world/linguistics/proto-language'
import type { ContextProvider } from '@mds/7-interface/context'

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

  // Options
  options: WorldOptions

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
    const crystallizerConfig: CrystallizerConfig = {
      enabled: true,
      analyzeEvery: options.linguistics?.analyzeEvery ?? 50,
      minUsage: options.linguistics?.minUsage ?? 3,
      minLength: options.linguistics?.minLength ?? 2,
      maxLength: options.linguistics?.maxLength ?? 100
    }

    this.crystallizer = new LinguisticCrystallizer(crystallizerConfig)

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

    // Phase 3.5: Cognitive update (Phase 7 - if enabled)
    if (this.options.features?.cognitive) {
      this.updateCognitive(effectiveDt)
    }

    // Phase 4: World mind update (Phase 8 - statistics & patterns)
    this.updateWorldMind()

    // Phase 4.5: Linguistics update (Phase 10 / v6.0 - if enabled)
    if (this.options.features?.linguistics && this.crystallizer) {
      this.updateLinguistics()

      // Layer 5: Update emergence state after linguistics
      this.updateEmergenceState()
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

            // A influenced by B's emotion
            const deltaA = {
              valence: (b.emotion.valence - a.emotion.valence) * contagionRate,
              arousal: (b.emotion.arousal - a.emotion.arousal) * contagionRate,
              dominance: (b.emotion.dominance - a.emotion.dominance) * contagionRate
            }

            a.feel(deltaA)

            // B influenced by A's emotion (reciprocal)
            const deltaB = {
              valence: (a.emotion.valence - b.emotion.valence) * contagionRate,
              arousal: (a.emotion.arousal - b.emotion.arousal) * contagionRate,
              dominance: (a.emotion.dominance - b.emotion.dominance) * contagionRate
            }

            b.feel(deltaB)
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

    // Run crystallizer and get number of new terms
    const newTerms = this.crystallizer.tick(this.transcript, this.lexicon)

    // Emit emergence.chunk event if new patterns emerged
    if (newTerms > 0) {
      this.emit('emergence.chunk', {
        newTerms,
        totalTerms: this.lexicon.getAll().length,
        novelty: this.emergence.novelty
      })
    }
  }

  /**
   * Layer 5: Update emergence state
   * Analyzes lexicon and entity emotions to calculate emergence metrics
   */
  private updateEmergenceState(): void {
    if (!this.lexicon) return

    const entries = this.lexicon.getAll()
    const now = Date.now()
    const recentWindow = 60000  // 1 minute

    // Recently used patterns (active in last minute)
    const recentlyUsed = entries.filter(e => now - e.lastUsed < recentWindow)

    // New patterns (created in last 10 seconds)
    const newTerms = entries.filter(e => now - e.firstSeen < 10000)

    // Update metrics
    this.emergence.lexiconSize = entries.length
    this.emergence.activePatterns = recentlyUsed.length

    // Novelty = ratio of new terms (high at start, decreases over time)
    this.emergence.novelty = entries.length > 0
      ? newTerms.length / entries.length
      : 0

    // Coherence = how similar emotions are across patterns
    this.emergence.coherence = this.calculatePatternCoherence(entries)

    // Emotional Density = avg arousal across all entities
    if (this.entities.length > 0) {
      const totalArousal = this.entities.reduce((sum, e) => {
        return sum + (e.emotion?.arousal ?? 0)
      }, 0)
      this.emergence.emotionalDensity = totalArousal / this.entities.length
    } else {
      this.emergence.emotionalDensity = 0
    }
  }

  /**
   * Calculate pattern coherence (how organized the lexicon is)
   * Higher = more emotionally coherent patterns
   */
  private calculatePatternCoherence(entries: import('@mds/6-world/linguistics/lexicon').LexiconEntry[]): number {
    if (entries.length < 2) return 0

    // Compare emotion contexts of all pattern pairs
    let coherenceSum = 0
    let comparisons = 0

    for (let i = 0; i < entries.length - 1; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i].emotionContext
        const b = entries[j].emotionContext

        if (a && b) {
          // Similarity = 1 - distance in valence space
          const valenceDist = Math.abs(a.valence - b.valence)
          const similarity = 1 - valenceDist
          coherenceSum += similarity
          comparisons++
        }
      }
    }

    return comparisons > 0 ? coherenceSum / comparisons : 0
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
  recordSpeech(speaker: Entity, text: string, listener?: Entity): void {
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

    this.transcript.add(utterance)
    this.emit('utterance', utterance)
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
   * Get emergence state (Layer 5)
   * Returns metrics about pattern formation and emotional climate
   *
   * @returns Emergence metrics for UI/analytics
   *
   * @example
   * const state = world.getEmergenceState()
   * console.log(`Lexicon size: ${state.lexiconSize}`)
   * console.log(`Novelty: ${state.novelty.toFixed(2)}`)
   */
  getEmergenceState() {
    return { ...this.emergence }
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

    for (const entity of this.entities) {
      if (typeof entity.handleDeclarativeEvent === 'function') {
        entity.handleDeclarativeEvent(type, data, this.worldTime)
      }
    }

    this.emit('event', event)
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
   * Cleanup and destroy world
   */
  destroy(): void {
    this.disposeAllContextProviders()
    // Dispose renderer resources
    this.renderer.dispose()

    // Destroy engine
    this.engine.destroy()
  }
}
