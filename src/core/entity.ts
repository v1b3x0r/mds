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

  constructor(m: MdsMaterial, x = Math.random() * 480, y = Math.random() * 320) {
    this.m = m
    this.x = x
    this.y = y

    // Initialize info-physics properties
    this.entropy = Math.random()
    this.energy = Math.random()

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
  }

  /**
   * Integrate velocity and update DOM position
   */
  integrateAndRender(_dt: number): void {
    // Update position
    this.x += this.vx
    this.y += this.vy

    // Render to DOM
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
    this.el.remove()
  }
}
