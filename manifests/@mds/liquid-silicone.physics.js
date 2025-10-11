/**
 * Liquid Silicone Physics (Basic Version)
 *
 * Simple elastic drag behavior with spring simulation
 * - Semi-implicit Euler integration
 * - Scale + skew transform (4-direction deformation)
 * - Parallax background effect
 *
 * @param {HTMLElement} element - Target element
 * @param {Object} params - Physics parameters
 * @param {number} [params.tension=22] - Spring stiffness K
 * @param {number} [params.damping=18] - Spring damping D
 * @param {number} [params.maxStretchX=0.18] - Max X stretch (0..1)
 * @param {number} [params.maxStretchY=0.12] - Max Y stretch (0..1)
 * @param {number} [params.parallax=14] - Light parallax effect (%)
 * @returns {Function} Cleanup function
 */
export default function elasticPhysics(element, params = {}) {
  // Physics parameters (mapped from MDSpec behavior.physicsParams)
  const K = params.tension ?? 22
  const D = params.damping ?? 18
  const MAXX = params.maxStretchX ?? 0.18
  const MAXY = params.maxStretchY ?? 0.12
  const PARALLAX = params.parallax ?? 14

  // State
  let rect
  let dragging = false
  let startX = 0
  let startY = 0

  // Spring state
  let x = 0, y = 0       // Current deform
  let vx = 0, vy = 0     // Velocity
  let tx = 0, ty = 0     // Target deform

  let rafId

  // Utility: Clamp value
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

  // Event: Pointer down (start drag)
  const onPointerDown = (e) => {
    // Skip if clicking on interactive elements inside
    if (e.target !== element && e.target.closest) {
      const interactive = e.target.closest('button, a, input, select, textarea, [role="button"]')
      if (interactive) return
    }

    rect = element.getBoundingClientRect()
    dragging = true
    startX = e.clientX
    startY = e.clientY

    try {
      element.setPointerCapture(e.pointerId)
    } catch {}
  }

  // Event: Pointer move (update target deform)
  const onPointerMove = (e) => {
    if (!dragging) return

    const dx = (e.clientX - startX) / rect.width
    const dy = (e.clientY - startY) / rect.height

    // Update target deform (clamped)
    tx = clamp(dx, -MAXX, MAXX)
    ty = clamp(dy, -MAXY, MAXY)
  }

  // Event: Pointer end (release drag, snap back)
  const onPointerEnd = (e) => {
    if (!dragging) return
    dragging = false
    tx = 0
    ty = 0  // Snap back to origin

    try {
      element.releasePointerCapture(e.pointerId)
    } catch {}
  }

  // Spring simulation loop (semi-implicit Euler)
  let last = performance.now()
  function tick(t) {
    const dt = Math.min(1 / 60, (t - last) / 1000)  // Max 16.67ms (60fps)
    last = t

    // X axis spring physics: F = -kx - cv
    const ax = -K * (x - tx) - D * vx
    vx += ax * dt  // v' = v + a*dt
    x += vx * dt   // x' = x + v'*dt

    // Y axis spring physics
    const ay = -K * (y - ty) - D * vy
    vy += ay * dt
    y += vy * dt

    // Apply transform: scale + skew for soft material feel
    const skewX = (x * 6).toFixed(3)   // degrees
    const skewY = (y * -6).toFixed(3)  // degrees (inverted)
    const sx = (1 + x).toFixed(4)
    const sy = (1 + y).toFixed(4)

    element.style.transform = `skew(${skewY}deg, ${skewX}deg) scale(${sx}, ${sy})`

    // Parallax effect: light/highlight follows drag direction
    if (PARALLAX > 0) {
      element.style.backgroundPosition = `${50 + x * PARALLAX}% ${50 + y * PARALLAX}%`
    }

    rafId = requestAnimationFrame(tick)
  }

  // Attach event listeners
  element.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerEnd)
  window.addEventListener('pointercancel', onPointerEnd)

  // Start animation loop
  rafId = requestAnimationFrame(tick)

  // Return cleanup function
  return () => {
    element.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerEnd)
    window.removeEventListener('pointercancel', onPointerEnd)
    cancelAnimationFrame(rafId)
    element.style.transform = ''
    element.style.backgroundPosition = ''
  }
}
