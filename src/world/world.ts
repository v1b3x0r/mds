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

import { Engine } from '../core/engine'
import type { WorldBounds, BoundaryBehavior } from '../core/engine'
import type { MdsMaterial } from '../schema/mdspec'
import type { MdsField as MdsFieldSpec } from '../schema/fieldspec'
import { Entity } from '../core/entity'
import { Field } from '../core/field'
import {
  driftToBaseline,
  EMOTION_BASELINES
} from '../ontology'
import {
  RendererAdapter,
  DOMRenderer,
  CanvasRenderer,
  HeadlessRenderer
} from '../render'
import {
  Environment,
  Weather,
  CollisionDetector,
  EnergySystem,
  EnvironmentConfig,
  WeatherConfig,
  createEnvironment,
  createWeather
} from '../physics'
import {
  DialogueManager,
  LanguageGenerator,
  SemanticSimilarity,
  MessageDelivery
} from '../communication'

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
  }

  // Phase 5: Environmental physics configuration
  environment?: EnvironmentConfig | 'desert' | 'forest' | 'ocean' | 'arctic'
  weather?: WeatherConfig | 'calm' | 'stormy' | 'dry' | 'variable'
  collision?: boolean         // Enable collision detection

  // Phase 6: Communication configuration
  languageProvider?: 'openrouter' | 'anthropic' | 'openai' | 'mock'
  languageApiKey?: string
  languageModel?: string
  semanticProvider?: 'openai' | 'mock'
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
  dialogueManager?: import('../communication').DialogueManager
  languageGenerator?: import('../communication').LanguageGenerator
  semanticSimilarity?: import('../communication').SemanticSimilarity

  // Options
  options: WorldOptions

  constructor(options: WorldOptions = {}) {
    this.id = this.generateUUID()
    this.createdAt = Date.now()
    this.options = options

    // Create v4 engine (delegate tick logic)
    this.engine = new Engine({
      seed: options.seed,
      worldBounds: options.worldBounds,
      boundaryBehavior: options.boundaryBehavior,
      boundaryBounceDamping: options.boundaryBounceDamping
    })

    // Initialize renderer
    const renderMode = options.features?.rendering ?? 'dom'
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
   * Initialize communication systems (Phase 6)
   */
  private initializeCommunication(options: WorldOptions): void {
    // Create dialogue manager
    this.dialogueManager = new DialogueManager()

    // Create language generator (if enabled)
    if (options.features?.languageGeneration) {
      const provider = options.languageProvider ?? 'mock'
      this.languageGenerator = new LanguageGenerator({
        provider,
        apiKey: options.languageApiKey,
        model: options.languageModel
      })
    }

    // Create semantic similarity system
    const semProvider = options.semanticProvider ?? 'mock'
    this.semanticSimilarity = new SemanticSimilarity({
      provider: semProvider,
      apiKey: options.semanticApiKey
    })
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

    // Phase 4: Rendering update
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
      // Memory decay
      if (entity.memory) {
        entity.memory.decay(dt, 0.01)  // 1% fade per second

        // Forget low-salience memories (every 10 seconds)
        if (this.worldTime % 10 < dt) {
          entity.memory.forget(0.1)  // Remove salience < 0.1
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
