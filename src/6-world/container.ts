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

import { Engine } from '../0-foundation/engine'
import type { WorldBounds, BoundaryBehavior } from '../0-foundation/engine'
import type { MdsMaterial } from '../schema/mdspec'
import type { MdsField as MdsFieldSpec } from '../schema/fieldspec'
import { Entity } from '../0-foundation/entity'
import { Field } from '../0-foundation/field'
import {
  driftToBaseline,
  EMOTION_BASELINES
} from '../1-ontology'
import {
  RendererAdapter,
  DOMRenderer,
  CanvasRenderer,
  HeadlessRenderer
} from '../7-interface/render'
import {
  Environment,
  Weather,
  CollisionDetector,
  EnergySystem,
  EnvironmentConfig,
  WeatherConfig,
  createEnvironment,
  createWeather
} from '../2-physics'
import {
  DialogueManager,
  LanguageGenerator,
  SemanticSimilarity,
  MessageDelivery,
  MessageQueue
} from '../4-communication'
import {
  CollectiveIntelligence,
  WorldStats,
  PatternDetection
} from '../3-cognition/world-mind'

// v5.8.4: Direct imports to avoid circular dependency (world/index.ts exports World)
import { TranscriptBuffer } from './linguistics/transcript'
import type { Utterance } from './linguistics/transcript'

import { WorldLexicon } from './linguistics/lexicon'
import type { LexiconEntry } from './linguistics/lexicon'

import { LinguisticCrystallizer } from './linguistics/crystallizer'
import type { CrystallizerConfig } from './linguistics/crystallizer'

import { ProtoLanguageGenerator } from './linguistics/proto-language'

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
  private statsUpdateInterval: number = 1000 // Update stats every 1 second
  private lastStatsUpdate: number = 0

  // Phase 9 / v5.5: P2P Cognition (optional)
  cognitiveNetwork?: import('../3-cognition').CognitiveNetwork
  resonanceField?: import('../3-cognition').ResonanceField

  // Phase 10 / v6.0: Linguistics (optional)
  transcript?: TranscriptBuffer
  lexicon?: WorldLexicon
  private crystallizer?: LinguisticCrystallizer
  protoGenerator?: import('./linguistics/proto-language').ProtoLanguageGenerator  // v6.1: Emergent language generation

  // Options
  options: WorldOptions

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
    this.worldTime += dt
    this.tickCount++

    // Phase 1: Physical update (v4 delegation)
    this.engine.tick(dt)

    // Phase 1.5: Environmental Physics (Phase 5 - if enabled)
    if (this.options.features?.physics) {
      this.updatePhysics(dt)
    }

    // Phase 2: Mental update (v5 ontology - if enabled)
    if (this.options.features?.ontology) {
      this.updateMental(dt)
    }

    // Phase 2.5: Communication update (Phase 6 - if enabled)
    if (this.options.features?.communication) {
      this.updateCommunication(dt)
    }

    // Phase 3: Relational update (v5 ontology - if enabled)
    if (this.options.features?.ontology) {
      this.updateRelational(dt)
    }

    for (const entity of this.entities) {
      if (typeof entity.pruneDeclarativeState === 'function') {
        entity.pruneDeclarativeState(this.worldTime)
      }
      if (typeof entity.updateBehaviorTimers === 'function') {
        entity.updateBehaviorTimers(dt, this.worldTime)
      }
    }

    // Phase 3.5: Cognitive update (Phase 7 - if enabled)
    if (this.options.features?.cognitive) {
      this.updateCognitive(dt)
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
        this.renderer.update(entity, dt)
      }

      // Update fields if renderer supports it
      if (this.renderer.updateField) {
        for (const field of this.fields) {
          this.renderer.updateField(field, dt)
        }
      }
    }
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
    for (const entity of this.entities) {
      entity.updateTriggerContext(context)
      entity.checkEmotionTriggers()
    }
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
   */
  private updateLinguistics(): void {
    if (!this.crystallizer || !this.transcript || !this.lexicon) return

    this.crystallizer.tick(this.transcript, this.lexicon)
  }

  /**
   * Phase 8: Update world mind
   * - Calculate world statistics
   * - Detect emergent patterns
   */
  private updateWorldMind(): void {
    const now = Date.now()

    // Update stats at intervals (not every tick)
    if (now - this.lastStatsUpdate >= this.statsUpdateInterval) {
      this.worldStats = CollectiveIntelligence.calculateStats(this.entities)
      this.patterns = CollectiveIntelligence.detectPatterns(this.entities)
      this.lastStatsUpdate = now
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
  getCollectiveEmotion(): import('../1-ontology').EmotionalState | null {
    return CollectiveIntelligence.calculateCollectiveEmotion(this.entities)
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

    for (const entity of this.entities) {
      if (typeof entity.handleDeclarativeEvent === 'function') {
        entity.handleDeclarativeEvent(type, data, this.worldTime)
      }
    }
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

  /**
   * Cleanup and destroy world
   */
  destroy(): void {
    // Dispose renderer resources
    this.renderer.dispose()

    // Destroy engine
    this.engine.destroy()
  }
}
