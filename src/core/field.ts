/**
 * MDS v4.0 - Field Class (v6.1: Abstract mode support)
 * Emergent relationship field spawned by entity interactions
 *
 * Fields work in all rendering modes:
 * - DOM/Canvas: Visual auras
 * - Headless: Abstract influence (emotion, relationship, sync)
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

  // DOM element for visual representation (optional)
  el?: HTMLDivElement

  constructor(f: MdsField, x: number, y: number, headless = false) {
    this.f = f
    this.x = x
    this.y = y

    // Create visual element only if not headless and visual spec exists
    // v6.1: headless parameter allows abstract fields (no DOM)
    if (!headless && f.visual && typeof document !== 'undefined') {
      this.createVisualElement()
    }
  }

  /**
   * Create DOM element for field visualization
   * (Only in DOM mode)
   */
  private createVisualElement(): void {
    // Skip if no DOM available (headless/Node.js)
    if (typeof document === 'undefined') return

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

    // Add to DOM (only if DOM available)
    if (typeof document !== 'undefined') {
      document.body.appendChild(this.el)
    }
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

    // Calculate field strength (fades over time)
    const fadeProgress = this.t / this.f.duration
    const fieldStrength = 1 - fadeProgress * 0.5  // Fades to 50% at end

    // Apply effects to entities within radius
    for (const e of entities) {
      const d = distance(this.x, this.y, e.x, e.y)

      if (d <= this.f.radius) {
        // Distance-based intensity (stronger at center)
        const distanceFactor = 1 - (d / this.f.radius)
        const intensity = fieldStrength * distanceFactor

        // v4.0: Visual effects (DOM only)
        if (typeof this.f.effect_on_others?.opacity === 'number') {
          const targetOpacity = Number(this.f.effect_on_others.opacity)
          e.opacity = Math.max(e.opacity, Math.min(1, targetOpacity))
        }

        // v6.1: Abstract effects (all modes)
        this.applyAbstractEffects(e, intensity)
      }
    }

    // Update visual fade (DOM only)
    if (this.el) {
      this.el.style.opacity = String(fieldStrength)
    }
  }

  /**
   * v6.1: Apply abstract field effects (emotion, relationship)
   * Works in all rendering modes (including headless)
   */
  private applyAbstractEffects(entity: Entity, intensity: number): void {
    const effects = this.f.effect_on_others

    if (!effects) return

    // Emotion effects (PAD model)
    if (entity.emotion) {
      // Valence boost (trust, safety, warmth)
      if (typeof effects.valence === 'number') {
        const boost = Number(effects.valence) * intensity * 0.01  // Gentle nudge
        entity.emotion.valence = Math.max(-1, Math.min(1, entity.emotion.valence + boost))
      }

      // Arousal boost/reduction (energy, calm)
      if (typeof effects.arousal === 'number') {
        const boost = Number(effects.arousal) * intensity * 0.01
        entity.emotion.arousal = Math.max(0, Math.min(1, entity.emotion.arousal + boost))
      }

      // Dominance boost/reduction (confidence, submission)
      if (typeof effects.dominance === 'number') {
        const boost = Number(effects.dominance) * intensity * 0.01
        entity.emotion.dominance = Math.max(0, Math.min(1, entity.emotion.dominance + boost))
      }
    }

    // Relationship effects (if field has source entity)
    if (effects.relationshipBoost && typeof effects.sourceEntity === 'string') {
      const sourceId = String(effects.sourceEntity)

      // Boost relationship trust with field source
      if (entity.relationships) {
        const rel = entity.relationships.get(sourceId)
        if (rel) {
          const boost = Number(effects.relationshipBoost) * intensity * 0.001
          rel.trust = Math.max(0, Math.min(1, rel.trust + boost))
          rel.familiarity = Math.max(0, Math.min(1, rel.familiarity + boost * 0.5))
        }
      }
    }

    // Cognitive link strengthening (if both entities connected)
    if (effects.linkStrength && typeof effects.sourceEntity === 'string') {
      const sourceId = String(effects.sourceEntity)

      if (entity.cognitiveLinks?.has(sourceId)) {
        const boost = Number(effects.linkStrength) * intensity * 0.001
        entity.reinforceLink(sourceId, boost)
      }
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
