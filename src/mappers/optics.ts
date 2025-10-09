/**
 * Material Definition System - Optics Mapper
 * Maps optics properties to CSS
 */

import type { Optics } from '../core/types'

/**
 * Apply optics properties to element
 */
export function applyOptics(element: HTMLElement, optics?: Optics): void {
  if (!optics) return

  // Opacity
  if (optics.opacity != null) {
    element.style.opacity = String(optics.opacity)
  }

  // Text color
  if ((optics as any).color) {
    element.style.color = (optics as any).color
  }

  // Background color (direct)
  if ((optics as any).backgroundColor) {
    element.style.backgroundColor = (optics as any).backgroundColor
  }

  // Backdrop filter (blur + saturation for glassmorphism)
  const backdropFilters: string[] = []
  if (optics.blur) {
    backdropFilters.push(`blur(${optics.blur})`)
  }
  if (optics.saturation && optics.blur) {
    backdropFilters.push(`saturate(${optics.saturation})`)
  }
  if (backdropFilters.length > 0) {
    const backdropFilterValue = backdropFilters.join(' ')
    element.style.backdropFilter = backdropFilterValue
    // Webkit prefix for Safari
    ;(element.style as any).webkitBackdropFilter = backdropFilterValue
  }

  // backdropFilter directly (if provided as string)
  if ((optics as any).backdropFilter) {
    element.style.backdropFilter = (optics as any).backdropFilter
  }
  if ((optics as any).WebkitBackdropFilter) {
    ;(element.style as any).webkitBackdropFilter = (optics as any).WebkitBackdropFilter
  }

  // Element filters (brightness, contrast, saturation)
  const filters: string[] = []
  if (optics.brightness) {
    filters.push(`brightness(${optics.brightness})`)
  }
  if (optics.contrast) {
    filters.push(`contrast(${optics.contrast})`)
  }
  if (optics.saturation && !optics.blur) {
    // Only apply saturation as filter if not using backdrop-filter
    filters.push(`saturate(${optics.saturation})`)
  }
  if (filters.length > 0) {
    element.style.filter = filters.join(' ')
  }

  // Tint (color overlay)
  if (optics.tint) {
    applyTint(element, optics.tint)
  }
}

/**
 * Apply tint as gradient overlay
 * Preserves existing background if present
 */
function applyTint(element: HTMLElement, tint: string): void {
  const computedStyle = getComputedStyle(element)
  const existingBg = computedStyle.backgroundImage

  if (existingBg && existingBg !== 'none') {
    // Layer tint over existing background
    element.style.backgroundImage = `linear-gradient(${tint}, ${tint}), ${existingBg}`
  } else {
    // Simple background color
    element.style.backgroundColor = tint
  }
}

/**
 * Clear optics properties from element
 */
export function clearOptics(element: HTMLElement): void {
  element.style.opacity = ''
  element.style.backdropFilter = ''
  ;(element.style as any).webkitBackdropFilter = ''
  element.style.filter = ''
  element.style.backgroundColor = ''
  element.style.backgroundImage = ''
}
