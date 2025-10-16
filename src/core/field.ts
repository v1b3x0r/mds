/**
 * MDS v4.0 - Field Class
 * Emergent relationship field spawned by entity interactions
 */

import type { MdsField } from '../schema/fieldspec'
import type { Entity } from './entity'
import { distance } from '../utils/math'

export class Field {
  // Field definition
  f: MdsField

  // Spatial properties
  x: number
  y: number

  // Temporal properties
  t = 0            // elapsed time in ms
  expired = false

  // DOM element for visual representation
  el?: HTMLDivElement

  constructor(f: MdsField, x: number, y: number) {
    this.f = f
    this.x = x
    this.y = y

    // Create visual element if needed
    if (f.visual) {
      this.createVisualElement()
    }
  }

  /**
   * Create DOM element for field visualization
   */
  private createVisualElement(): void {
    this.el = document.createElement('div')
    this.el.className = 'mds-field'
    this.el.style.position = 'absolute'
    this.el.style.pointerEvents = 'none'
    this.el.style.willChange = 'opacity, transform'

    // Set size and position
    const diameter = this.f.radius * 2
    this.el.style.width = `${diameter}px`
    this.el.style.height = `${diameter}px`
    this.el.style.transform = `translate(${this.x - this.f.radius}px, ${this.y - this.f.radius}px)`

    // Apply visual style (amber aura)
    this.el.style.borderRadius = '50%'
    this.el.style.background = `radial-gradient(
      circle,
      rgba(255, 200, 100, 0.2) 0%,
      rgba(255, 200, 100, 0.05) 50%,
      transparent 100%
    )`

    // Add to DOM
    document.body.appendChild(this.el)
  }

  /**
   * Update field state and apply effects to entities
   */
  update(dt: number, entities: Entity[]): void {
    // Increment time
    this.t += dt * 1000

    // Check expiration
    if (this.t > this.f.duration) {
      this.expired = true
      this.el?.remove()
      return
    }

    // Apply effects to entities within radius
    for (const e of entities) {
      const d = distance(this.x, this.y, e.x, e.y)

      if (d <= this.f.radius) {
        // Opacity effect (gentle boost)
        if (typeof this.f.effect_on_others?.opacity === 'number') {
          const targetOpacity = Number(this.f.effect_on_others.opacity)
          e.opacity = Math.max(e.opacity, Math.min(1, targetOpacity))
        }

        // Behavior depth multiplier (placeholder for future extension)
        if (this.f.effect_on_others?.['behavior.depthMultiplier']) {
          // External behavior engines can read this value
        }
      }
    }

    // Update visual fade (based on lifetime)
    if (this.el) {
      const fadeProgress = this.t / this.f.duration
      const opacity = 1 - fadeProgress * 0.5  // Fade to 50% at end
      this.el.style.opacity = String(opacity)
    }
  }

  /**
   * Cleanup field
   */
  destroy(): void {
    this.expired = true
    this.el?.remove()
  }

  /**
   * Serialize field to JSON (v4.2)
   */
  toJSON() {
    return {
      material: this.f.material,
      x: this.x,
      y: this.y,
      t: this.t,
      expired: this.expired
    }
  }

  /**
   * Restore field from serialized data (v4.2)
   */
  static fromJSON(data: ReturnType<Field['toJSON']>, fieldSpec: MdsField): Field {
    const field = new Field(fieldSpec, data.x, data.y)
    field.t = data.t
    field.expired = data.expired
    return field
  }
}
