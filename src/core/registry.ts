/**
 * Material Definition System - Material Registry
 */

import type { Material } from './types'
import { validateName } from './validator'
import { deepMerge } from './utils'

/**
 * Registry for storing and resolving materials
 */
export class MaterialRegistry {
  private materials = new Map<string, Material>()

  /**
   * Register a material
   */
  register(name: string, material: Material): void {
    validateName(name)
    this.materials.set(name, material)
  }

  /**
   * Get raw material (without inheritance resolution)
   */
  get(name: string): Material | undefined {
    return this.materials.get(name)
  }

  /**
   * Check if material exists
   */
  has(name: string): boolean {
    return this.materials.has(name)
  }

  /**
   * Resolve material with inheritance chain
   */
  resolve(name: string, visited = new Set<string>()): Material {
    // Prevent circular inheritance
    if (visited.has(name)) {
      throw new Error(`Circular inheritance detected for material: "${name}"`)
    }
    visited.add(name)

    const material = this.materials.get(name)
    if (!material) {
      throw new Error(`Material not found: "${name}"`)
    }

    // No inheritance - return as is
    if (!material.inherits) {
      return material
    }

    // Resolve parent and merge
    const parent = this.resolve(material.inherits, visited)
    return deepMerge({}, parent, material)
  }

  /**
   * Get all registered material names
   */
  getNames(): string[] {
    return Array.from(this.materials.keys())
  }

  /**
   * Get materials by scope
   */
  getByScope(scope: string): Material[] {
    const scopePrefix = `@${scope}/`
    return Array.from(this.materials.entries())
      .filter(([name]) => name.startsWith(scopePrefix))
      .map(([, material]) => material)
  }

  /**
   * Clear all materials
   */
  clear(): void {
    this.materials.clear()
  }

  /**
   * Remove a specific material
   */
  delete(name: string): boolean {
    return this.materials.delete(name)
  }
}
