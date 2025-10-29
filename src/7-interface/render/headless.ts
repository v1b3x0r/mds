/**
 * MDS v5.0 - Headless Renderer
 * No visual output (for simulation-only mode)
 *
 * Benefits:
 * - Zero rendering overhead
 * - Perfect for testing
 * - Server-side simulations
 * - Batch processing
 * - Performance benchmarking
 */

import type { Entity } from '@mds/0-foundation/entity'
import type { Field } from '@mds/0-foundation/field'
import { RendererAdapter } from '@mds/7-interface/render/adapter'

/**
 * Headless renderer (no visual output)
 */
export class HeadlessRenderer implements RendererAdapter {
  private stats = {
    entityCount: 0,
    fieldCount: 0,
    updateCount: 0,
    spawnCount: 0,
    destroyCount: 0
  }

  init(_container?: HTMLElement): void {
    // No-op
  }

  spawn(_entity: Entity): void {
    this.stats.entityCount++
    this.stats.spawnCount++
  }

  update(_entity: Entity, _dt: number): void {
    this.stats.updateCount++
  }

  destroy(_entity: Entity): void {
    this.stats.entityCount--
    this.stats.destroyCount++
  }

  renderField(_field: Field): void {
    this.stats.fieldCount++
  }

  updateField(_field: Field, _dt: number): void {
    // No-op
  }

  clear(): void {
    this.stats.entityCount = 0
    this.stats.fieldCount = 0
    // Keep update/spawn/destroy counts for debugging
  }

  dispose(): void {
    // No-op
  }

  /**
   * Get renderer statistics (for debugging/testing)
   */
  getStats() {
    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      entityCount: 0,
      fieldCount: 0,
      updateCount: 0,
      spawnCount: 0,
      destroyCount: 0
    }
  }
}
