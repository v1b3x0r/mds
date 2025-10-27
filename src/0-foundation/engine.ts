/**
 * MDS v4.0 - Engine Class
 * Info-physics simulation engine with autonomous behavior
 */

import type { MdsMaterial } from '../schema/mdspec'
import type { MdsField as MdsFieldSpec } from '../schema/fieldspec'
import { Entity } from './entity'
import { Field } from './field'
import { seededRandom } from '../0-foundation/random'

export type BoundaryBehavior = 'none' | 'clamp' | 'bounce'

export interface WorldBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface EngineOptions {
  worldBounds?: WorldBounds
  boundaryBehavior?: BoundaryBehavior
  boundaryBounceDamping?: number
  seed?: number  // Deterministic mode (v4.2)
  headless?: boolean  // v6.1: Headless mode (no DOM)
}

export class Engine {
  private entities: Entity[] = []
  private fields: Field[] = []
  private running = false
  private last = 0
  private options: EngineOptions
  private rng: () => number  // Deterministic RNG (v4.2)
  private headless: boolean  // v6.1: Headless flag

  constructor(options: EngineOptions = {}) {
    this.options = {
      boundaryBehavior: options.boundaryBehavior ?? 'none',
      boundaryBounceDamping: options.boundaryBounceDamping ?? 0.85,
      worldBounds: options.worldBounds,
      seed: options.seed,
      headless: options.headless ?? false
    }
    this.headless = this.options.headless || false

    // Initialize RNG (v4.2)
    if (options.seed !== undefined) {
      // Deterministic mode
      this.rng = seededRandom(options.seed)
    } else {
      // Non-deterministic mode (default)
      this.rng = Math.random
    }
  }

  /**
   * Spawn a new material entity
   * @param options - v5: skipDOM option for renderer abstraction
   */
  spawn(material: MdsMaterial, x?: number, y?: number, options?: { skipDOM?: boolean }): Entity {
    const e = new Entity(material, x, y, this.rng, options)
    this.entities.push(e)
    // Call lifecycle hook (v4.1)
    e.onSpawn?.(this, e)
    return e
  }

  /**
   * Get RNG function (v4.2)
   */
  getRng(): () => number {
    return this.rng
  }

  /**
   * Spawn a new field at position
   * v6.1: Respects headless mode
   */
  spawnField(fs: MdsFieldSpec, x: number, y: number): Field {
    const f = new Field(fs, x, y, this.headless)
    this.fields.push(f)
    return f
  }

  /**
   * Start the simulation loop
   */
  start(): void {
    if (this.running) return

    this.running = true
    this.last = performance.now()

    const loop = (t: number) => {
      if (!this.running) return

      const dt = (t - this.last) / 1000  // Convert to seconds
      this.last = t

      this.tick(dt)

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
  }

  /**
   * Stop the simulation loop
   */
  stop(): void {
    this.running = false
  }

  /**
   * Main simulation tick
   * Implements info-physics: proximity + similarity forces
   *
   * Note: Made public in v5 to allow World class delegation
   */
  tick(dt: number): void {
    // 1. Update all entities (age, decay, friction)
    for (const e of this.entities) {
      e.update(dt)
    }

    // 2. Pairwise info-physics forces
    // O(n²) complexity, but acceptable for small n (~5-20 entities)
    for (let i = 0; i < this.entities.length; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const a = this.entities[i]
        const b = this.entities[j]

        // Calculate distance
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 1  // Avoid division by zero

        // Calculate similarity (based on entropy difference)
        // Similar entities (close entropy values) attract more strongly
        const sim = 1 - Math.abs(a.entropy - b.entropy)

        // Force constant (tuned value from V4-UPGRADE.md)
        const k = 0.05 * sim

        // Apply force if within proximity threshold
        if (dist < 160) {
          // Normalize direction
          const fx = (dx / dist) * k
          const fy = (dy / dist) * k

          // Apply forces (Newton's third law: equal and opposite)
          a.vx += fx * dt
          a.vy += fy * dt
          b.vx -= fx * dt
          b.vy -= fy * dt
        }

        // Trigger proximity callbacks (for field spawning, etc.)
        if (dist < 80) {
          a.onProximity?.(this, b, dist)
          b.onProximity?.(this, a, dist)
        }
      }
    }

    // 3. Update fields and apply effects
    for (const f of this.fields) {
      f.update(dt, this.entities)
    }

    // Remove expired fields
    this.fields = this.fields.filter(f => !f.expired)

    // 4. Integrate motion, apply bounds, and render all entities
    for (const e of this.entities) {
      e.integrate(dt)
      this.applyBounds(e)
      e.render()
    }
  }

  /**
   * Get all entities
   */
  getEntities(): Entity[] {
    return this.entities
  }

  /**
   * Get all fields
   */
  getFields(): Field[] {
    return this.fields
  }

  /**
   * Remove an entity
   */
  removeEntity(entity: Entity): void {
    const idx = this.entities.indexOf(entity)
    if (idx !== -1) {
      this.entities.splice(idx, 1)
      entity.destroy()
    }
  }

  /**
   * Clear all entities and fields
   */
  clear(): void {
    for (const e of this.entities) {
      e.destroy()
    }
    for (const f of this.fields) {
      f.destroy()
    }
    this.entities = []
    this.fields = []
  }

  configure(options: Partial<EngineOptions>): void {
    this.options = {
      ...this.options,
      ...options,
      boundaryBehavior: options.boundaryBehavior ?? this.options.boundaryBehavior,
      boundaryBounceDamping: options.boundaryBounceDamping ?? this.options.boundaryBounceDamping
    }
  }

  getOptions(): EngineOptions {
    return { ...this.options }
  }

  /**
   * Cleanup and destroy engine
   */
  destroy(): void {
    this.stop()
    this.clear()
  }

  /**
   * Create a snapshot of engine state (v4.2)
   */
  snapshot() {
    return {
      entities: this.entities.map(e => e.toJSON()),
      fields: this.fields.map(f => f.toJSON()),
      timestamp: performance.now()
    }
  }

  /**
   * Restore engine state from snapshot (v4.2)
   * Note: Requires material definitions to be loaded separately
   */
  restore(
    snapshot: ReturnType<Engine['snapshot']>,
    materialMap: Map<string, MdsMaterial>,
    fieldMap: Map<string, MdsFieldSpec>
  ): void {
    // Clear current state
    this.clear()

    // Restore entities
    for (const data of snapshot.entities) {
      const material = materialMap.get(data.material)
      if (material) {
        const entity = Entity.fromJSON(data, material, this.rng)
        this.entities.push(entity)
      }
    }

    // Restore fields
    for (const data of snapshot.fields) {
      const fieldSpec = fieldMap.get(data.material)
      if (fieldSpec) {
        const field = Field.fromJSON(data, fieldSpec)
        this.fields.push(field)
      }
    }
  }

  private applyBounds(entity: Entity): void {
    const bounds = this.options.worldBounds
    const behavior = this.options.boundaryBehavior ?? 'none'

    if (!bounds || behavior === 'none') {
      return
    }

    if (behavior === 'clamp') {
      if (entity.x < bounds.minX) {
        entity.x = bounds.minX
        entity.vx = 0
      } else if (entity.x > bounds.maxX) {
        entity.x = bounds.maxX
        entity.vx = 0
      }

      if (entity.y < bounds.minY) {
        entity.y = bounds.minY
        entity.vy = 0
      } else if (entity.y > bounds.maxY) {
        entity.y = bounds.maxY
        entity.vy = 0
      }
      return
    }

    if (behavior === 'bounce') {
      const damping = this.options.boundaryBounceDamping ?? 0.85

      if (entity.x < bounds.minX) {
        entity.x = bounds.minX
        entity.vx = Math.abs(entity.vx) * damping
      } else if (entity.x > bounds.maxX) {
        entity.x = bounds.maxX
        entity.vx = -Math.abs(entity.vx) * damping
      }

      if (entity.y < bounds.minY) {
        entity.y = bounds.minY
        entity.vy = Math.abs(entity.vy) * damping
      } else if (entity.y > bounds.maxY) {
        entity.y = bounds.maxY
        entity.vy = -Math.abs(entity.vy) * damping
      }
    }
  }
}
