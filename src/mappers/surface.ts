/**
 * Material Definition System - Surface Mapper
 * Maps surface properties to CSS
 */

import type { Surface } from '../core/types'

// Store for pseudo-element styles
const pseudoStyles = new WeakMap<HTMLElement, string>()

/**
 * Apply surface properties to element
 */
export function applySurface(element: HTMLElement, surface?: Surface): void {
  if (!surface) return

  // Border radius
  if (surface.radius) {
    element.style.borderRadius = surface.radius
  }

  // Box shadow (string or array)
  if (surface.shadow) {
    if (Array.isArray(surface.shadow)) {
      element.style.boxShadow = surface.shadow.join(', ')
    } else {
      element.style.boxShadow = surface.shadow
    }
  }

  // Border
  if (surface.border) {
    element.style.border = surface.border
  }

  // Border top (specific)
  if ((surface as any).borderTop) {
    element.style.borderTop = (surface as any).borderTop
  }

  // Background (direct - for noise textures, etc.)
  if ((surface as any).background) {
    element.style.background = (surface as any).background
  }

  // Background size
  if ((surface as any).backgroundSize) {
    element.style.backgroundSize = (surface as any).backgroundSize
  }

  // Box shadow (direct - if provided separately)
  if ((surface as any).boxShadow) {
    element.style.boxShadow = (surface as any).boxShadow
  }

  // Transform
  if ((surface as any).transform) {
    element.style.transform = (surface as any).transform
  }

  // Transition
  if ((surface as any).transition) {
    element.style.transition = (surface as any).transition
  }

  // Cursor
  if ((surface as any).cursor) {
    element.style.cursor = (surface as any).cursor
  }

  // Texture (apply first so tint can layer over it)
  if (surface.texture) {
    applyTexture(element, surface.texture)
  }
}

/**
 * Get currently applied texture
 */
export function getTexture(element: HTMLElement): string | null {
  return element.style.backgroundImage || null
}

/**
 * Apply texture (background pattern)
 */
function applyTexture(
  element: HTMLElement,
  texture: NonNullable<Surface['texture']>
): void {
  // Background image
  element.style.backgroundImage = `url(${texture.src})`
  element.style.backgroundRepeat = texture.repeat || 'repeat'

  if (texture.size) {
    element.style.backgroundSize = texture.size
  }

  // Rotation via pseudo-element
  if (texture.rotation) {
    applyTextureRotation(element, texture.rotation)
  }
}

/**
 * Apply texture rotation using ::before pseudo-element
 * Note: This approach doesn't inject DOM but uses inline style trick
 */
function applyTextureRotation(element: HTMLElement, rotation: string): void {
  // Ensure element has position context
  const position = getComputedStyle(element).position
  if (position === 'static') {
    element.style.position = 'relative'
  }

  // Create style for pseudo-element using CSS custom property
  const pseudoId = `--mds-texture-rotation-${Math.random().toString(36).slice(2, 9)}`
  element.style.setProperty(pseudoId, rotation)

  // Inject inline style element if not exists
  if (!document.getElementById('mds-pseudo-styles')) {
    const styleEl = document.createElement('style')
    styleEl.id = 'mds-pseudo-styles'
    document.head.appendChild(styleEl)
  }

  const styleSheet = (document.getElementById('mds-pseudo-styles') as HTMLStyleElement).sheet
  if (styleSheet) {
    const selector = `[style*="${pseudoId}"]::before`
    const rules = `
      content: '';
      position: absolute;
      inset: 0;
      background: inherit;
      transform: rotate(var(${pseudoId}));
      z-index: -1;
      pointer-events: none;
    `
    styleSheet.insertRule(`${selector} { ${rules} }`, styleSheet.cssRules.length)
    pseudoStyles.set(element, pseudoId)
  }
}

/**
 * Clear surface properties from element
 */
export function clearSurface(element: HTMLElement): void {
  element.style.borderRadius = ''
  element.style.boxShadow = ''
  element.style.border = ''
  element.style.backgroundImage = ''
  element.style.backgroundRepeat = ''
  element.style.backgroundSize = ''

  // Clear pseudo-element rotation
  const pseudoId = pseudoStyles.get(element)
  if (pseudoId) {
    element.style.removeProperty(pseudoId)
    pseudoStyles.delete(element)
  }
}
