/**
 * Material Definition System (MDS) v2.0.0
 * Think in materials, not CSS properties
 */

import type { Material, MaterialManifest } from './core/types'
import { MaterialRegistry } from './core/registry'
import { ThemeManager } from './theme/manager'
import { deepMerge } from './core/utils'
import { loadManifests } from './manifest/loader'
import { applyOptics } from './mappers/optics'
import { applySurface } from './mappers/surface'
import { applyBehavior } from './mappers/behavior'
import { StateMachine } from './states/machine'
import { attachPointerEvents, getPointerDelta } from './states/events'
import { isInteractiveElement } from './states/interactive'
import { springToOrigin } from './physics/spring'
import { applyDrag } from './physics/drag'

/**
 * Main Material System class
 */
export class MaterialSystem {
  private registry = new MaterialRegistry()
  private themeManager = new ThemeManager()
  private observer: MutationObserver | null = null
  private elementStates = new WeakMap<HTMLElement, StateMachine>()
  private elementCleanup = new WeakMap<HTMLElement, () => void>()

  /**
   * Register a material
   */
  register(name: string, material: Material): void {
    this.registry.register(name, material)
  }

  /**
   * Register material from JSON manifest
   */
  async registerFromManifest(manifest: MaterialManifest): Promise<void> {
    if (!manifest.name) {
      throw new Error('Manifest must have a name field')
    }
    this.register(manifest.name, manifest)
  }

  /**
   * Extend existing material with overrides
   */
  extend(name: string, baseName: string, overrides: Partial<Material>): void {
    const base = this.registry.get(baseName)
    if (!base) {
      throw new Error(`Base material "${baseName}" not found`)
    }

    const extended = deepMerge({}, base, overrides)
    this.register(name, extended)
  }

  /**
   * Install materials from CDN
   */
  async install(
    names: string | string[],
    options: { cdn?: string } = {}
  ): Promise<void> {
    const nameList = Array.isArray(names) ? names : [names]
    const manifests = await loadManifests(nameList, options)

    for (const manifest of manifests) {
      await this.registerFromManifest(manifest)
    }
  }

  /**
   * Apply materials to elements
   */
  apply(root: Element = document.documentElement): void {
    const elements = root.querySelectorAll('[data-material]')
    elements.forEach(el => {
      if (el instanceof HTMLElement) {
        this.applyToElement(el)
      }
    })
  }

  /**
   * Set theme
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.themeManager.setTheme(theme)
    this.apply() // Re-apply all materials with new theme
  }

  /**
   * Get current theme
   */
  getTheme(): 'light' | 'dark' {
    return this.themeManager.getTheme()
  }

  /**
   * Get theme mode (may return 'auto')
   */
  getThemeMode(): 'light' | 'dark' | 'auto' {
    return this.themeManager.getThemeMode()
  }

  /**
   * Initialize MDS (auto-apply + observer + theme listener)
   */
  init(): void {
    // Apply on DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.apply())
    } else {
      this.apply()
    }

    // Watch for dynamic content
    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            this.apply(node)
          }
        })
      })
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Listen for theme changes
    this.themeManager.onChange(() => {
      this.apply()
    })
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.observer?.disconnect()
    this.registry.clear()
  }

  /**
   * Apply material to single element
   */
  private applyToElement(element: HTMLElement): void {
    const materialName = element.getAttribute('data-material')
    if (!materialName) return

    // Cleanup previous state if any
    const cleanup = this.elementCleanup.get(element)
    if (cleanup) {
      cleanup()
      this.elementCleanup.delete(element)
    }

    // Resolve material with inheritance
    let material: Material
    try {
      material = this.registry.resolve(materialName)
    } catch (error) {
      console.warn(`Material "${materialName}" not found`)
      return
    }

    // Get current theme
    const currentTheme = this.themeManager.getTheme()
    const themeMaterial = material.theme?.[currentTheme]

    // Merge base + theme
    const mergedMaterial: Material = deepMerge({}, material, themeMaterial || {})

    // Apply base state
    const baseState = mergedMaterial.states?.base || {}
    const finalMaterial: Material = deepMerge({}, mergedMaterial, baseState as any)

    applySurface(element, finalMaterial.surface)  // Apply texture first
    applyOptics(element, finalMaterial.optics)    // Then tint layers over it

    // Apply customCSS (escape hatch for advanced users)
    if (finalMaterial.customCSS) {
      Object.entries(finalMaterial.customCSS).forEach(([prop, value]) => {
        // Convert kebab-case to camelCase for style properties
        const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        ;(element.style as any)[camelProp] = value
      })
    }

    // Setup interactive states if applicable
    if (isInteractiveElement(element)) {
      const stateMachine = new StateMachine()
      this.elementStates.set(element, stateMachine)

      const cleanup = attachPointerEvents(element, stateMachine, (state, pointerData) => {
        // Get state-specific material
        const stateMaterial = mergedMaterial.states?.[state]
        if (stateMaterial) {
          const stateSpecific: Material = deepMerge({}, finalMaterial, stateMaterial as any)
          applySurface(element, stateSpecific.surface)  // Texture first
          applyOptics(element, stateSpecific.optics)    // Tint second

          // Apply state-specific customCSS
          if (stateSpecific.customCSS) {
            Object.entries(stateSpecific.customCSS).forEach(([prop, value]) => {
              const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
              ;(element.style as any)[camelProp] = value
            })
          }
        }

        // Apply behavior
        applyBehavior(element, finalMaterial.behavior, state)

        // Handle drag physics
        if (state === 'drag' && pointerData && finalMaterial.behavior) {
          const delta = getPointerDelta(pointerData)
          applyDrag(
            element,
            delta,
            finalMaterial.behavior.viscosity || 0,
            finalMaterial.behavior.elasticity || 0
          )
        }

        // Handle snap back
        if (state === 'base' && stateMachine.getPreviousState() === 'drag') {
          if (finalMaterial.behavior?.snapBack) {
            const hasElasticity = (finalMaterial.behavior?.elasticity || 0) > 0
            springToOrigin(element, hasElasticity)
          }
        }
      })

      this.elementCleanup.set(element, cleanup)
    }
  }
}

// Create and export singleton instance
export const materialSystem = new MaterialSystem()

// Auto-initialize
if (typeof window !== 'undefined') {
  materialSystem.init()

  // Expose globally
  ;(window as any).MaterialSystem = materialSystem
}

// Export types
export type {
  Material,
  MaterialManifest,
  Optics,
  Surface,
  Behavior,
  StateType,
  ThemeType
} from './core/types'
