/**
 * MDS v4.0 - Entity Class
 * A living material instance with autonomous behavior
 */

import type { MdsMaterial } from '../schema/mdspec'
import type { Engine } from './engine'
import { clamp } from '../utils/math'
import { applyRule } from '../utils/events'

export class Entity {
  // Material definition
  m: MdsMaterial

  // Spatial properties
  x: number
  y: number
  vx = 0
  vy = 0

  // Temporal properties
  age = 0
  repeats = 0

  // Info-physics properties
  entropy: number
  energy: number
  opacity = 1

  // DOM element
  el: HTMLDivElement

  // Interaction tracking
  hoverCount = 0
  lastHoverTime = 0

  // Proximity callback (set by engine)
  onProximity?: (engine: Engine, other: Entity, dist: number) => void

  // Lifecycle hooks (v4.1)
  onSpawn?: (engine: Engine, entity: Entity) => void
  onUpdate?: (dt: number, entity: Entity) => void
  onDestroy?: (entity: Entity) => void

  constructor(
    m: MdsMaterial,
    x?: number,
    y?: number,
    rng: () => number = Math.random
  ) {
    this.m = m
    this.x = x ?? rng() * 480
    this.y = y ?? rng() * 320

    // Initialize info-physics properties (v4.2: use provided RNG)
    this.entropy = rng()
    this.energy = rng()

    // Override opacity if specified
    if (m.manifestation?.aging?.start_opacity !== undefined) {
      this.opacity = m.manifestation.aging.start_opacity
    }

    // Create DOM element
    this.el = document.createElement('div')
    this.el.className = 'mds-entity'
    this.el.style.position = 'absolute'
    this.el.style.willChange = 'transform, opacity, filter'
    this.el.dataset.material = m.material

    // Set emoji
    const emoji = m.manifestation?.emoji ?? '📄'
    this.el.textContent = emoji

    // Attach event handlers
    this.attachDOMHandlers()

    // Append to body
    document.body.appendChild(this.el)

    // Initial render
    this.render()
  }

  /**
   * Attach DOM event handlers for interactive behavior
   */
  private attachDOMHandlers(): void {
    this.el.addEventListener('mouseover', () => {
      const now = performance.now()

      // Track hover repeats (within 700ms window)
      if (now - this.lastHoverTime < 700) {
        this.hoverCount++
      } else {
        this.hoverCount = 1
      }
      this.lastHoverTime = now

      // Apply onHover behavior
      const rule = this.m.behavior?.onHover
      if (rule) applyRule(rule, this)

      // Apply onRepeatHover if threshold met
      const r2 = this.m.behavior?.onRepeatHover
      if (r2 && this.hoverCount >= (r2.threshold ?? 3)) {
        applyRule(r2, this)
      }
    })
  }

  /**
   * Update entity state (aging, decay, friction)
   */
  update(dt: number): void {
    // Age increases
    this.age += dt

    // Opacity decay
    const decay = this.m.manifestation?.aging?.decay_rate ?? 0
    if (decay > 0) {
      this.opacity = clamp(this.opacity - decay * dt, 0, 1)
    }

    // Apply friction to velocity
    const fr = this.m.physics?.friction ?? 0.02
    this.vx *= (1 - fr)
    this.vy *= (1 - fr)

    // Call lifecycle hook (v4.1)
    this.onUpdate?.(dt, this)
  }

  /**
   * Integrate velocity and update DOM position
   */
  integrate(_dt: number): void {
    this.x += this.vx
    this.y += this.vy
  }

  integrateAndRender(dt: number): void {
    this.integrate(dt)
    this.render()
  }

  /**
   * Update DOM styles
   */
  render(): void {
    this.el.style.opacity = String(this.opacity)
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  /**
   * Cleanup DOM element
   */
  destroy(): void {
    // Call lifecycle hook (v4.1)
    this.onDestroy?.(this)
    this.el.remove()
  }

  /**
   * Serialize entity to JSON (v4.2)
   */
  toJSON() {
    return {
      material: this.m.material,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      age: this.age,
      opacity: this.opacity,
      entropy: this.entropy,
      energy: this.energy,
      hoverCount: this.hoverCount,
      lastHoverTime: this.lastHoverTime
    }
  }

  /**
   * Restore entity from serialized data (v4.2)
   */
  static fromJSON(
    data: ReturnType<Entity['toJSON']>,
    material: MdsMaterial,
    rng: () => number = Math.random
  ): Entity {
    const entity = new Entity(material, data.x, data.y, rng)
    entity.vx = data.vx
    entity.vy = data.vy
    entity.age = data.age
    entity.opacity = data.opacity
    entity.entropy = data.entropy
    entity.energy = data.energy
    entity.hoverCount = data.hoverCount
    entity.lastHoverTime = data.lastHoverTime
    entity.render()
    return entity
  }
}
