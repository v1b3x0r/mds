/**
 * Material Definition System - Drag Physics
 * Implements viscosity-based drag damping
 */

/**
 * Apply drag transform with viscosity damping and liquid squish effect
 */
export function applyDrag(
  element: HTMLElement,
  delta: { x: number; y: number },
  viscosity: number = 0,
  elasticity: number = 0
): void {
  // Damping factor (0 = no drag, 1 = full drag)
  const damping = 1 - viscosity

  // Apply damped translation
  const dx = delta.x * damping
  const dy = delta.y * damping

  // Liquid squish effect (iOS-style)
  // More elasticity = more squish when dragging
  if (elasticity > 0) {
    // Calculate drag velocity/intensity
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 200 // max pixels for full squish
    const intensity = Math.min(distance / maxDistance, 1) * elasticity

    // Calculate drag direction angle
    const angle = Math.atan2(dy, dx)

    // Squish perpendicular to drag direction (like liquid being compressed)
    // When dragging right: scale X down (compressed), Y up (bulging)
    const squishFactor = 1 - intensity * 0.15 // max 15% squish
    const bulgeFactor = 1 + intensity * 0.08  // max 8% bulge

    // Determine which axis to squish based on drag direction
    const absAngle = Math.abs(angle)
    const isHorizontal = absAngle < Math.PI / 4 || absAngle > (3 * Math.PI) / 4

    let scaleX, scaleY, skewY, skewX

    if (isHorizontal) {
      // Dragging horizontally: compress X, bulge Y
      scaleX = squishFactor
      scaleY = bulgeFactor
      skewY = (dy / 100) * intensity * 2 // slight skew in Y based on vertical component
      skewX = 0
    } else {
      // Dragging vertically: compress Y, bulge X
      scaleX = bulgeFactor
      scaleY = squishFactor
      skewX = (dx / 100) * intensity * 2 // slight skew in X based on horizontal component
      skewY = 0
    }

    element.style.transform =
      `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY}) skew(${skewX}deg, ${skewY}deg)`
    element.style.transition = 'none' // Instant during drag
  } else {
    element.style.transform = `translate(${dx}px, ${dy}px)`
  }
}

/**
 * Clear drag transform with elastic bounce-back
 */
export function clearDrag(element: HTMLElement, hasElasticity: boolean = false): void {
  if (hasElasticity) {
    // iOS-style elastic bounce: quick settle with slight overshoot
    element.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
  } else {
    element.style.transition = ''
  }

  element.style.transform = ''

  // Clear transition after animation completes
  if (hasElasticity) {
    setTimeout(() => {
      element.style.transition = ''
    }, 600)
  }
}

/**
 * Get effective drag distance based on viscosity
 * Higher viscosity = shorter effective distance
 */
export function getEffectiveDragDistance(
  actualDistance: number,
  viscosity: number
): number {
  const damping = 1 - viscosity
  return actualDistance * damping
}
