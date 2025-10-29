/**
 * MDS v5.0 - Renderer Adapter
 * Abstract interface for visual rendering (DOM, Canvas, Headless)
 *
 * Design principles:
 * - Separation of concerns: Logic vs Presentation
 * - Multiple rendering backends (DOM, Canvas, WebGL, Headless)
 * - State-driven rendering (visual computed from entity state)
 */

import type { Entity } from '@mds/0-foundation/entity'
import type { Field } from '@mds/0-foundation/field'
import { emotionToColor, emotionToHex } from '@mds/1-ontology/emotion'
import type { Intent } from '@mds/1-ontology'

/**
 * Visual style computed from entity state
 */
export interface VisualStyle {
  emoji?: string
  color?: string       // CSS color or hex
  scale?: number       // 1.0 = normal size
  opacity?: number     // 0..1
  rotation?: number    // Degrees
  filter?: string      // CSS filter
  trail?: boolean      // Show movement history
}

/**
 * Renderer interface (all renderers must implement)
 */
export interface RendererAdapter {
  /**
   * Initialize renderer (optional container)
   */
  init(container?: HTMLElement): void

  /**
   * Create visual representation for entity
   */
  spawn(entity: Entity): void

  /**
   * Update visual representation
   */
  update(entity: Entity, dt: number): void

  /**
   * Remove visual representation
   */
  destroy(entity: Entity): void

  /**
   * Render field (optional)
   */
  renderField?(field: Field): void

  /**
   * Update field visual (optional)
   */
  updateField?(field: Field, dt: number): void

  /**
   * Batch render all entities and fields (optional, for Canvas/WebGL)
   * If not implemented, World will call update() per entity instead
   */
  renderAll?(entities: Entity[], fields: Field[]): void

  /**
   * Clear all visuals
   */
  clear(): void

  /**
   * Cleanup and destroy renderer
   */
  dispose(): void
}

/**
 * State mapper: Entity state → Visual style
 */
export class StateMapper {
  /**
   * Map intent to animation cue
   */
  static intentToAnimation(intent?: Intent): string {
    if (!intent) return 'idle'

    switch (intent.goal) {
      case 'approach': return 'pulse'
      case 'avoid': return 'jitter'
      case 'bond': return 'glow'
      case 'observe': return 'rotate'
      default: return 'idle'
    }
  }

  /**
   * Map memory count to trail visibility
   */
  static memoryToTrail(memoryCount: number): boolean {
    return memoryCount > 50  // Rich memory = visible trail
  }

  /**
   * Map intent motivation to scale
   */
  static intentToScale(intent?: Intent): number {
    if (!intent) return 1.0
    return 1.0 + (intent.motivation * 0.3)  // Up to 30% larger
  }

  /**
   * Compute complete visual style from entity state
   */
  static compute(entity: Entity): VisualStyle {
    return {
      emoji: entity.m.manifestation?.emoji ?? '📄',
      color: entity.emotion ? emotionToColor(entity.emotion) : undefined,
      scale: entity.intent ? this.intentToScale(entity.intent.current()) : 1.0,
      opacity: entity.opacity,
      rotation: 0,
      filter: entity.emotion
        ? `brightness(${100 + (entity.emotion.arousal ?? 0) * 50}%)`
        : undefined,
      trail: entity.memory ? this.memoryToTrail(entity.memory.count()) : false
    }
  }

  /**
   * Compute visual style for Canvas/WebGL rendering
   */
  static computeForCanvas(entity: Entity): VisualStyle & { hexColor?: string } {
    const base = this.compute(entity)
    return {
      ...base,
      hexColor: entity.emotion ? emotionToHex(entity.emotion) : '#888888'
    }
  }
}

/**
 * Linear interpolation helper
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
