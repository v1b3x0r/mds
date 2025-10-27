/**
 * MDS v5.0 - DOM Renderer
 * DOM-based renderer (v4 legacy, refactored)
 *
 * Extracted from Entity class to decouple rendering from logic
 */

import type { Entity } from '../../0-foundation/entity'
import type { Field } from '../../0-foundation/field'
import { RendererAdapter, StateMapper } from './adapter'
import { applyRule } from '../../0-foundation/events'

/**
 * DOM-based renderer
 * Uses HTML elements with CSS transforms
 */
export class DOMRenderer implements RendererAdapter {
  private elements = new Map<string, HTMLDivElement>()
  private fieldElements = new Map<string, HTMLDivElement>()
  private container!: HTMLElement  // Initialized in init()

  init(container?: HTMLElement): void {
    // Safe for headless/Node.js: only use document.body if available
    this.container = container ?? (typeof document !== 'undefined' ? document.body : null as any)
  }

  spawn(entity: Entity): void {
    // Skip if no DOM available (headless/Node.js)
    if (typeof document === 'undefined' || !this.container) return

    // Create DOM element
    const el = document.createElement('div')
    el.className = 'mds-entity'
    el.style.position = 'absolute'
    el.style.willChange = 'transform, opacity, filter'
    el.dataset.id = entity.id
    el.dataset.material = entity.m.material

    // Set initial emoji
    const style = StateMapper.compute(entity)
    el.textContent = style.emoji ?? '📄'

    // Attach to DOM
    this.container.appendChild(el)
    this.elements.set(entity.id, el)

    // Attach event handlers (interactive behaviors)
    this.attachHandlers(entity, el)
  }

  update(entity: Entity, _dt: number): void {
    const el = this.elements.get(entity.id)
    if (!el) return

    // Compute visual style from entity state
    const style = StateMapper.compute(entity)

    // Apply physical transform
    let transform = `translate(${entity.x}px, ${entity.y}px)`

    // Apply scale (from intent motivation)
    if (style.scale && style.scale !== 1.0) {
      transform += ` scale(${style.scale})`
    }

    el.style.transform = transform

    // Apply opacity
    el.style.opacity = String(style.opacity ?? 1)

    // Apply emotional color (v5 only)
    if (style.color) {
      el.style.color = style.color
    }

    // Apply filter (brightness from arousal)
    if (style.filter) {
      el.style.filter = style.filter
    }

    // Apply trail effect (v5 only)
    if (style.trail) {
      el.style.boxShadow = '0 0 20px currentColor'
    } else {
      el.style.boxShadow = ''
    }
  }

  destroy(entity: Entity): void {
    const el = this.elements.get(entity.id)
    if (el) {
      el.remove()
      this.elements.delete(entity.id)
    }
  }

  renderField(field: Field): void {
    // Create field visual element
    const el = document.createElement('div')
    el.className = 'mds-field'
    el.style.position = 'absolute'
    el.style.pointerEvents = 'none'
    el.style.willChange = 'opacity, transform'

    // Set size and position
    const diameter = field.f.radius * 2
    el.style.width = `${diameter}px`
    el.style.height = `${diameter}px`
    el.style.transform = `translate(${field.x - field.f.radius}px, ${field.y - field.f.radius}px)`

    // Apply visual style (amber aura)
    el.style.borderRadius = '50%'
    el.style.background = `radial-gradient(
      circle,
      rgba(255, 200, 100, 0.2) 0%,
      rgba(255, 200, 100, 0.05) 50%,
      transparent 100%
    )`

    // Add to DOM
    this.container.appendChild(el)

    // Store element with field ID (generate if not present)
    const fieldId = `field_${field.x}_${field.y}_${field.f.material}`
    this.fieldElements.set(fieldId, el)
  }

  updateField(field: Field, _dt: number): void {
    const fieldId = `field_${field.x}_${field.y}_${field.f.material}`
    const el = this.fieldElements.get(fieldId)
    if (!el) return

    // Update visual fade (based on lifetime)
    const fadeProgress = field.t / field.f.duration
    const opacity = 1 - fadeProgress * 0.5  // Fade to 50% at end
    el.style.opacity = String(opacity)

    // Remove if expired
    if (field.expired) {
      el.remove()
      this.fieldElements.delete(fieldId)
    }
  }

  clear(): void {
    for (const el of this.elements.values()) {
      el.remove()
    }
    this.elements.clear()

    for (const el of this.fieldElements.values()) {
      el.remove()
    }
    this.fieldElements.clear()
  }

  dispose(): void {
    this.clear()
  }

  /**
   * Attach DOM event handlers for interactive behavior
   */
  private attachHandlers(entity: Entity, el: HTMLDivElement): void {
    el.addEventListener('mouseover', () => {
      const now = performance.now()

      // Track hover repeats (within 700ms window)
      if (now - entity.lastHoverTime < 700) {
        entity.hoverCount++
      } else {
        entity.hoverCount = 1
      }
      entity.lastHoverTime = now

      // Apply onHover behavior
      const rule = entity.m.behavior?.onHover
      if (rule) applyRule(rule, entity)

      // Apply onRepeatHover if threshold met
      const r2 = entity.m.behavior?.onRepeatHover
      if (r2 && entity.hoverCount >= (r2.threshold ?? 3)) {
        applyRule(r2, entity)
      }
    })
  }
}
