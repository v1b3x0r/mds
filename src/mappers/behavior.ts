/**
 * Material Definition System - Behavior Mapper
 * Maps behavior properties to transforms
 */

import type { Behavior, StateType } from '../core/types'

/**
 * Apply behavior-based transforms for different states
 */
export function applyBehavior(
  element: HTMLElement,
  behavior?: Behavior,
  state?: StateType
): void {
  if (!behavior || !state) return

  switch (state) {
    case 'press':
      applyPressEffect(element, behavior.elasticity)
      break

    case 'drag':
      // Drag is handled in physics/drag.ts with pointer delta
      break

    case 'base':
    case 'hover':
      // Clear transforms
      clearBehaviorTransform(element)
      break
  }
}

/**
 * Apply press effect (subtle scale down based on elasticity)
 */
function applyPressEffect(element: HTMLElement, elasticity?: number): void {
  if (elasticity == null) return

  const scale = 1 - (0.02 * elasticity) // Max 2% scale down
  element.style.transform = `scale(${scale})`
}

/**
 * Clear behavior-related transforms
 */
export function clearBehaviorTransform(element: HTMLElement): void {
  element.style.transform = ''
}
