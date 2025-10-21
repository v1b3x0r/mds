/**
 * MDS v5.0 - Canvas Renderer
 * Canvas2D-based renderer (lightweight, better performance)
 *
 * Benefits:
 * - Single draw call per frame
 * - Better performance for many entities (>50)
 * - Hardware accelerated
 * - Memory trail support built-in
 */

import type { Entity } from '../core/entity'
import type { Field } from '../core/field'
import { RendererAdapter, StateMapper } from './adapter'

interface TrailPoint {
  x: number
  y: number
  opacity: number
}

/**
 * Canvas-based renderer
 */
export class CanvasRenderer implements RendererAdapter {
  private canvas!: HTMLCanvasElement  // Initialized in init()
  private ctx!: CanvasRenderingContext2D  // Initialized in init()
  private trails = new Map<string, TrailPoint[]>()
  private entities: Entity[] = []

  init(container?: HTMLElement): void {
    // Create canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.pointerEvents = 'none'

    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    // Append to container
    ;(container ?? document.body).appendChild(this.canvas)

    // Auto-resize canvas
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
    })
  }

  spawn(entity: Entity): void {
    // Canvas has no persistent objects, just track entities
    this.entities.push(entity)

    // Initialize trail if needed
    const style = StateMapper.compute(entity)
    if (style.trail) {
      this.trails.set(entity.id, [])
    }
  }

  update(entity: Entity, _dt: number): void {
    // Update trail positions
    const style = StateMapper.compute(entity)
    if (style.trail) {
      let trail = this.trails.get(entity.id)
      if (!trail) {
        trail = []
        this.trails.set(entity.id, trail)
      }

      trail.push({ x: entity.x, y: entity.y, opacity: 1.0 })

      // Keep last 30 positions
      if (trail.length > 30) {
        trail.shift()
      }

      // Fade trail
      for (let i = 0; i < trail.length; i++) {
        trail[i].opacity = (i / trail.length) * 0.5
      }
    } else {
      // Remove trail if no longer needed
      this.trails.delete(entity.id)
    }

    // Render will happen in batch (called from renderAll)
  }

  destroy(entity: Entity): void {
    const index = this.entities.indexOf(entity)
    if (index !== -1) {
      this.entities.splice(index, 1)
    }
    this.trails.delete(entity.id)
  }

  renderField(_field: Field): void {
    // Fields rendered in batch (no persistent storage needed)
  }

  updateField(_field: Field, _dt: number): void {
    // No-op (fields rendered in batch)
  }

  clear(): void {
    this.entities = []
    this.trails.clear()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  dispose(): void {
    this.clear()
    this.canvas.remove()
  }

  /**
   * Render all entities (called once per frame by World)
   */
  renderAll(entities: Entity[], fields: Field[]): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw trails first (under entities)
    for (const entity of entities) {
      const trail = this.trails.get(entity.id)
      if (!trail || trail.length < 2) continue

      const style = StateMapper.computeForCanvas(entity)

      this.ctx.strokeStyle = style.hexColor ?? '#888888'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.moveTo(trail[0].x, trail[0].y)

      for (let i = 1; i < trail.length; i++) {
        this.ctx.globalAlpha = trail[i].opacity
        this.ctx.lineTo(trail[i].x, trail[i].y)
      }

      this.ctx.stroke()
      this.ctx.globalAlpha = 1
    }

    // Draw fields
    for (const field of fields) {
      if (field.expired) continue

      const fadeProgress = field.t / field.f.duration
      const opacity = 1 - fadeProgress * 0.5

      this.ctx.globalAlpha = opacity * 0.3

      // Create radial gradient
      const gradient = this.ctx.createRadialGradient(
        field.x, field.y, 0,
        field.x, field.y, field.f.radius
      )
      gradient.addColorStop(0, 'rgba(255, 200, 100, 0.2)')
      gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.05)')
      gradient.addColorStop(1, 'transparent')

      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(field.x, field.y, field.f.radius, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.globalAlpha = 1
    }

    // Draw entities
    this.ctx.font = '32px serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    for (const entity of entities) {
      const style = StateMapper.computeForCanvas(entity)

      this.ctx.save()
      this.ctx.translate(entity.x, entity.y)
      this.ctx.scale(style.scale ?? 1, style.scale ?? 1)
      this.ctx.globalAlpha = style.opacity ?? 1

      // Draw background circle (emotional color)
      if (style.hexColor) {
        this.ctx.fillStyle = style.hexColor
        this.ctx.beginPath()
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2)
        this.ctx.fill()
      }

      // Draw emoji
      this.ctx.fillStyle = '#ffffff'
      this.ctx.globalAlpha = (style.opacity ?? 1)
      this.ctx.fillText(style.emoji ?? '📄', 0, 0)

      this.ctx.restore()
    }
  }
}
