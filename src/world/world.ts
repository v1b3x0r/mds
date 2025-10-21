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
   * Main tick loop (three-phase update)
   *
   * Phase 1: Physical (v4 delegation)
   * Phase 2: Mental (v5 ontology - memory decay, emotion drift)
   * Phase 3: Relational (v5 ontology - emotional contagion, memory formation)
   * Phase 4: Rendering (v5 renderer delegation)
   */
  tick(dt: number): void {
    this.worldTime += dt
    this.tickCount++

    // Phase 1: Physical update (v4 delegation)
    this.engine.tick(dt)

    // Phase 2: Mental update (v5 ontology - if enabled)
    if (this.options.features?.ontology) {
      this.updateMental(dt)
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
   * Phase 2: Mental update
   * - Memory decay
   * - Memory pruning
   * - Emotion drift to baseline
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
