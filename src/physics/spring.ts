/**
 * Material Definition System - Spring Animation
 * Implements snapBack behavior with spring physics
 */

import { parseTransform } from '../core/utils'

const SPRING_CONSTANT = 0.15 // Spring stiffness
const MIN_DISTANCE = 0.5 // Minimum distance before stopping (pixels)

/**
 * Active spring animation state
 */
interface SpringAnimation {
  x: number
  y: number
  vx: number // velocity X
  vy: number // velocity Y
  scaleX: number
  scaleY: number
  rafId: number
}

// Store active animations per element
const activeAnimations = new WeakMap<HTMLElement, SpringAnimation>()

/**
 * Animate element back to origin using spring physics with liquid squish
 */
export function springToOrigin(element: HTMLElement, hasElasticity: boolean = false): void {
  // Cancel any existing animation
  const existing = activeAnimations.get(element)
  if (existing) {
    cancelAnimationFrame(existing.rafId)
    activeAnimations.delete(element)
  }

  // Parse current transform
  const transform = getComputedStyle(element).transform
  const { x, y } = parseTransform(transform)

  // If already at origin, no need to animate
  if (Math.abs(x) < MIN_DISTANCE && Math.abs(y) < MIN_DISTANCE) {
    element.style.transform = ''
    return
  }

  // Create animation state
  const anim: SpringAnimation = {
    x,
    y,
    vx: 0,
    vy: 0,
    scaleX: 1,
    scaleY: 1,
    rafId: 0
  }
  activeAnimations.set(element, anim)

  // Animation step function
  function step() {
    // Spring force towards origin (F = -k * x)
    const forceX = -anim.x * SPRING_CONSTANT
    const forceY = -anim.y * SPRING_CONSTANT

    // Update velocity (with damping)
    anim.vx = (anim.vx + forceX) * 0.92
    anim.vy = (anim.vy + forceY) * 0.92

    // Update position
    anim.x += anim.vx
    anim.y += anim.vy

    // Liquid squish effect during spring back
    if (hasElasticity) {
      // Calculate velocity magnitude (how fast it's moving back)
      const speed = Math.sqrt(anim.vx * anim.vx + anim.vy * anim.vy)
      const squishIntensity = Math.min(speed / 10, 0.15) // max 15% squish

      // Direction of movement
      const angle = Math.atan2(anim.vy, anim.vx)
      const absAngle = Math.abs(angle)
      const isHorizontal = absAngle < Math.PI / 4 || absAngle > (3 * Math.PI) / 4

      if (isHorizontal) {
        // Moving horizontally: stretch X, compress Y (like liquid being pulled)
        anim.scaleX = 1 + squishIntensity
        anim.scaleY = 1 - squishIntensity * 0.5
      } else {
        // Moving vertically: stretch Y, compress X
        anim.scaleX = 1 - squishIntensity * 0.5
        anim.scaleY = 1 + squishIntensity
      }

      // Gradually return to normal scale
      anim.scaleX += (1 - anim.scaleX) * 0.15
      anim.scaleY += (1 - anim.scaleY) * 0.15
    }

    // Apply transform
    if (hasElasticity) {
      element.style.transform =
        `translate(${anim.x}px, ${anim.y}px) scale(${anim.scaleX}, ${anim.scaleY})`
    } else {
      element.style.transform = `translate(${anim.x}px, ${anim.y}px)`
    }

    // Continue if not close enough to origin
    if (
      Math.abs(anim.x) > MIN_DISTANCE ||
      Math.abs(anim.y) > MIN_DISTANCE ||
      Math.abs(anim.vx) > 0.01 ||
      Math.abs(anim.vy) > 0.01
    ) {
      anim.rafId = requestAnimationFrame(step)
    } else {
      // Snap to origin and cleanup
      element.style.transform = ''
      activeAnimations.delete(element)
    }
  }

  // Start animation
  anim.rafId = requestAnimationFrame(step)
}

/**
 * Cancel spring animation for element
 */
export function cancelSpring(element: HTMLElement): void {
  const anim = activeAnimations.get(element)
  if (anim) {
    cancelAnimationFrame(anim.rafId)
    activeAnimations.delete(element)
  }
}

/**
 * Check if element has active spring animation
 */
export function hasActiveSpring(element: HTMLElement): boolean {
  return activeAnimations.has(element)
}
