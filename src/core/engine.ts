/**
 * MDS v4.0 - Engine Class
 * Info-physics simulation engine with autonomous behavior
 */

import type { MdsMaterial } from '../schema/mdspec'
import type { MdsField as MdsFieldSpec } from '../schema/fieldspec'
import { Entity } from './entity'
import { Field } from './field'

export class Engine {
  private entities: Entity[] = []
  private fields: Field[] = []
  private running = false
  private last = 0

  /**
   * Spawn a new material entity
   */
  spawn(material: MdsMaterial, x?: number, y?: number): Entity {
    const e = new Entity(material, x, y)
    this.entities.push(e)
    return e
  }

  /**
   * Spawn a new field at position
   */
  spawnField(fs: MdsFieldSpec, x: number, y: number): Field {
    const f = new Field(fs, x, y)
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
   */
  private tick(dt: number): void {
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

    // 4. Integrate motion and render all entities
    for (const e of this.entities) {
      e.integrateAndRender(dt)
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

  /**
   * Cleanup and destroy engine
   */
  destroy(): void {
    this.stop()
    this.clear()
  }
}
