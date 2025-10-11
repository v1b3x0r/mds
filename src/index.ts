/**
 * Material Definition System (MDS) v2.0.0
 * Think in materials, not CSS properties
 */

import type { Material, MaterialManifest, StateType } from './core/types'
import { MaterialRegistry } from './core/registry'
import { ThemeManager } from './theme/manager'
import { deepMerge } from './core/utils'
import { loadManifests } from './manifest/loader'
import { applyOptics } from './mappers/optics'
import { applySurface } from './mappers/surface'
import { applyBehavior } from './mappers/behavior'
import { StateMachine } from './states/machine'
import { attachPointerEvents } from './states/events'
import { isInteractiveElement } from './states/interactive'

/**
 * Main Material System class
 */
class MaterialSystem {
  private registry = new MaterialRegistry()
  private themeManager = new ThemeManager()
  private observer: MutationObserver | null = null
  private elementStates = new WeakMap<HTMLElement, StateMachine>()
  private elementCleanup = new WeakMap<HTMLElement, (() => void)[]>()  // Array-based unified cleanup

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
  async apply(root: Element = document.documentElement): Promise<void> {
    const elements: HTMLElement[] = []

    // If root itself has data-material, include it
    if (root instanceof HTMLElement && root.hasAttribute('data-material')) {
      elements.push(root)
    }

    // Also find children with data-material
    root.querySelectorAll('[data-material]').forEach(el => {
      if (el instanceof HTMLElement) {
        elements.push(el)
      }
    })

    await Promise.all(elements.map(el => this.applyToElement(el)))
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

    // Safely observe when DOM is ready
    const startObserving = () => {
      if (document.body && document.body instanceof Node && this.observer) {
        this.observer.observe(document.body, {
          childList: true,
          subtree: true
        })
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startObserving)
    } else {
      // Use RAF to ensure DOM is fully rendered
      requestAnimationFrame(startObserving)
    }

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
   * === PRIVATE HELPERS ===
   */

  /**
   * Apply material styles (surface + optics + customCSS)
   */
  private applyMaterialStyles(element: HTMLElement, material: Material): void {
    applySurface(element, material.surface)
    applyOptics(element, material.optics)

    // Apply customCSS if present
    material.customCSS && Object.entries(material.customCSS).forEach(([prop, value]) => {
      const camelProp = prop.replace(/-([a-z])/g, (_, g) => g.toUpperCase())
      ;(element.style as any)[camelProp] = value
    })
  }

  /**
   * Auto-migrate deprecated behavior fields to physicsParams
   */
  private migrateDeprecatedFields(behavior: any, params: Record<string, any>): void {
    ['viscosity', 'elasticity', 'snapBack'].forEach(field => {
      if (behavior[field] !== undefined && params[field] === undefined) {
        params[field] = behavior[field]
        console.warn(`[MDS] behavior.${field} is deprecated. Use physicsParams.${field} instead.`)
      }
    })
  }

  /**
   * Add cleanup function for element
   */
  private addCleanup(element: HTMLElement, cleanup: () => void): void {
    const cleanups = this.elementCleanup.get(element) ?? []
    cleanups.push(cleanup)
    this.elementCleanup.set(element, cleanups)
  }

  /**
   * Cleanup all resources for element
   */
  private cleanupElement(element: HTMLElement): void {
    this.elementCleanup.get(element)?.forEach(fn => fn())
    this.elementCleanup.delete(element)
    this.elementStates.delete(element)
  }

  /**
   * Apply material to single element
   */
  private async applyToElement(element: HTMLElement): Promise<void> {
    const materialName = element.getAttribute('data-material')
    if (!materialName) return

    // Cleanup all previous resources
    this.cleanupElement(element)

    // Resolve material with inheritance
    let material: Material
    try {
      material = this.registry.resolve(materialName)
    } catch (error) {
      console.warn(`Material "${materialName}" not found`)
      return
    }

    // Merge theme + base state
    const currentTheme = this.themeManager.getTheme()
    const mergedMaterial: Material = deepMerge({}, material, material.theme?.[currentTheme] || {})
    const finalMaterial: Material = deepMerge({}, mergedMaterial, mergedMaterial.states?.base || {})

    // Clear old styles before applying new material
    element.style.cssText = ''

    // Apply new material styles
    this.applyMaterialStyles(element, finalMaterial)

    // Initialize physics if defined
    await this.initPhysics(element, finalMaterial)

    // Setup interactive states if applicable
    if (isInteractiveElement(element)) {
      const stateMachine = new StateMachine()
      this.elementStates.set(element, stateMachine)

      const cleanup = attachPointerEvents(element, stateMachine, (state) => {
        const stateMaterial = mergedMaterial.states?.[state]
        if (stateMaterial) {
          const stateSpecific: Material = deepMerge({}, finalMaterial, stateMaterial as any)
          this.applyMaterialStyles(element, stateSpecific)
        }
        applyBehavior(element, finalMaterial.behavior, state)
      })

      this.addCleanup(element, cleanup)
    }
  }

  /**
   * Initialize physics for an element
   *
   * Supports two modes:
   * 1. External file: behavior.physics (path to .js file)
   * 2. Inline script: behavior.physicsInline (function code string)
   */
  private async initPhysics(element: HTMLElement, material: Material): Promise<void> {
    const behavior = material.behavior
    if (!behavior) return

    const params = behavior.physicsParams ?? {}
    this.migrateDeprecatedFields(behavior, params)

    // Option A: External .js file
    if (behavior.physics) {
      try {
        const physicsPath = behavior.physics.replace(/^\.\//, '/')
        const module = await import(/* @vite-ignore */ physicsPath)
        const physicsFn = module.default || module

        if (typeof physicsFn === 'function') {
          const cleanup = physicsFn(element, params)
          if (typeof cleanup === 'function') {
            this.addCleanup(element, cleanup)
          }
        }
      } catch (error) {
        console.error(`[MDS] Failed to load physics: ${behavior.physics}`, error)
      }
      return
    }

    // Option B: Inline script
    if (behavior.physicsInline) {
      try {
        const physicsFn = new Function('element', 'params', `
          return (${behavior.physicsInline})(element, params)
        `)
        const cleanup = physicsFn(element, params)
        if (typeof cleanup === 'function') {
          this.addCleanup(element, cleanup)
        }
      } catch (error) {
        console.error('[MDS] Failed to execute inline physics', error)
      }
    }
  }

  /**
   * Public API for External Interaction Layer
   * Allows behavior engines (e.g., UICP) to integrate with MDS tactile substrate
   */

  /** Get material definition for element */
  getMaterial(element: HTMLElement): Material | null {
    const name = element.getAttribute('data-material')
    if (!name) return null
    try {
      return this.registry.resolve(name)
    } catch {
      return null
    }
  }

  /** Get current visual state */
  getState(element: HTMLElement): StateType | null {
    return this.elementStates.get(element)?.getState() ?? null
  }

  /** Manually set visual state (for behavior engines) */
  setState(element: HTMLElement, state: StateType): void {
    const stateMachine = this.elementStates.get(element)
    if (stateMachine) {
      stateMachine.transition(state)
    }
  }

  /** Check if element has tactile physics */
  hasTactilePhysics(element: HTMLElement): boolean {
    const material = this.getMaterial(element)
    return !!(material?.behavior?.physics || material?.behavior?.physicsInline)
  }

  /** Get physics parameters (for behavior engines to match feel) */
  getPhysicsParams(element: HTMLElement): Record<string, any> | null {
    const material = this.getMaterial(element)
    return material?.behavior?.physicsParams ?? null
  }
}

// Create and export singleton instance
const MDS = new MaterialSystem()

// Auto-initialize (deferred to ensure DOM is ready)
if (typeof window !== 'undefined') {
  // Expose globally first (for backward compatibility)
  ;(window as any).MaterialSystem = MDS

  // Only auto-init if not in demo mode (demo will call init() manually after install())
  const isDemo = window.location.pathname.includes('/demo/')

  if (!isDemo) {
    // Defer init to ensure DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => MDS.init())
    } else {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => MDS.init(), 0)
    }
  }
}

// Export singleton as default + named
export { MDS as materialSystem }
export default MDS

// Export class for advanced users
export { MaterialSystem }

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
