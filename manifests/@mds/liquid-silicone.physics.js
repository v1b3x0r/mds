/**
 * Liquid Silicone Physics
 *
 * Elastic drag behavior with spring simulation
 * - Semi-implicit Euler integration for spring physics
 * - Directional stretch aligned with drag vector
 * - Optional parallax effect (light follows drag direction)
 *
 * @param {HTMLElement} element - Target element
 * @param {Object} params - Physics parameters
 * @param {number} [params.tension=22] - Spring stiffness K
 * @param {number} [params.damping=18] - Spring damping D
 * @param {number} [params.maxStretchX=0.18] - Max X stretch (0..1)
 * @param {number} [params.maxStretchY=0.12] - Max Y stretch (0..1)
 * @param {number} [params.parallax=14] - Light parallax effect (%)
 * @param {string} [params.axes='xy'] - Movement axes: 'x', 'y', or 'xy'
 * @returns {Function} Cleanup function
 */
export default function elasticPhysics(element, params = {}) {
  const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"]'

  // Parameters (with defaults from original script)
  const K = params.tension ?? 22
  const D = params.damping ?? 18
  const MAXX = params.maxStretchX ?? 0.18
  const MAXY = params.maxStretchY ?? 0.12
  const PARALLAX = params.parallax ?? 14
  const axes = params.axes ?? 'xy'
  const snapSegments = typeof params.directionSnap === 'number' && params.directionSnap > 0
    ? Math.max(1, Math.floor(params.directionSnap))
    : 0
  const snapThreshold = typeof params.snapThreshold === 'number' ? params.snapThreshold : 0.06
  const snapEase = typeof params.snapEase === 'number' ? params.snapEase : 0.28

  // Ensure we have a dedicated wrapper for content so we can counter-transform it
  let contentWrapper = Array.from(element.children).find(
    child => child instanceof HTMLElement && child.hasAttribute('data-mds-content')
  )

  if (!contentWrapper) {
    contentWrapper = document.createElement('span')
    contentWrapper.setAttribute('data-mds-content', '')
    contentWrapper.style.display = 'inline-block'
    contentWrapper.style.width = '100%'
    contentWrapper.style.height = '100%'
    contentWrapper.style.transformOrigin = 'inherit'
    contentWrapper.style.willChange = 'transform'

    while (element.firstChild) {
      contentWrapper.appendChild(element.firstChild)
    }

    element.appendChild(contentWrapper)
  } else {
    contentWrapper.style.transformOrigin = 'inherit'
    contentWrapper.style.willChange = 'transform'
  }

  const contentEl = contentWrapper

  // State variables
  let rect, dragging = false, startX = 0, startY = 0
  let x = 0, y = 0, vx = 0, vy = 0  // Current deform & velocity
  let tx = 0, ty = 0  // Target deform
  let rafId
  let captured = false
  const isInteractive = element.matches(INTERACTIVE_SELECTOR)

  // Utility: Clamp value between min and max
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

  // Event: Pointer down (start drag)
  const onPointerDown = (e) => {
    const owner = e.target instanceof HTMLElement
      ? e.target.closest('[data-material]')
      : null
    if (owner && owner !== element) {
      return
    }

    // If the target is an interactive control inside this material,
    // do not start silicone dragging here to preserve native clicks.
    if (e.target instanceof HTMLElement) {
      const interactiveTarget = e.target.matches(INTERACTIVE_SELECTOR) || !!e.target.closest(INTERACTIVE_SELECTOR)
      if (interactiveTarget) {
        return
      }
    }

    rect = element.getBoundingClientRect()
    dragging = true
    startX = e.clientX
    startY = e.clientY
    captured = false
    if (!isInteractive) {
      try {
        element.setPointerCapture(e.pointerId)
        captured = true
      } catch {}
    }
  }

  // Event: Pointer move (update target deform)
  const onPointerMove = (e) => {
    if (!dragging) return

    const dx = (e.clientX - startX) / rect.width
    const dy = (e.clientY - startY) / rect.height

    // Update target deform (clamped by max stretch)
    if (axes.includes('x')) tx = clamp(dx, -MAXX, MAXX)
    if (axes.includes('y')) ty = clamp(dy, -MAXY, MAXY)
  }

  // Event: Pointer end (release drag, snap back)
  const onPointerEnd = (e) => {
    if (!dragging) return
    dragging = false
    tx = 0
    ty = 0  // Snap back to origin
    try {
      if (captured) {
        element.releasePointerCapture(e.pointerId)
      }
    } catch {}
    captured = false
  }

  // Spring simulation loop (semi-implicit Euler integration)
  let last = performance.now()
  function tick(t) {
    const dt = Math.min(1 / 60, (t - last) / 1000)  // Max dt = 16.67ms (60fps)
    last = t

    // X axis spring physics
    const ax = -K * (x - tx) - D * vx  // F = -kx - cv
    vx += ax * dt  // v' = v + a*dt
    x += vx * dt   // x' = x + v'*dt

    // Y axis spring physics
    const ay = -K * (y - ty) - D * vy
    vy += ay * dt
    y += vy * dt

    // Apply transform: directional stretch aligned with drag vector
    const vecX = axes.includes('x') ? x : 0
    const vecY = axes.includes('y') ? y : 0
    const magnitude = Math.min(0.25, Math.hypot(vecX, vecY))
    const gain = typeof params.directionalGain === 'number' ? params.directionalGain : 1
    const poisson = typeof params.poisson === 'number' ? params.poisson : 0.35

    let angle = 0
    if (magnitude > 1e-4) {
      angle = Math.atan2(vecY, vecX)

      if (snapSegments > 0 && magnitude >= snapThreshold) {
        const segmentSize = (Math.PI * 2) / snapSegments
        const snapped = Math.round(angle / segmentSize) * segmentSize
        angle = angle + (snapped - angle) * snapEase
      }
    }

    const stretch = 1 + magnitude * gain
    const squeeze = Math.max(0.7, 1 - magnitude * gain * poisson)

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    // Compose rotation-scale-rotation using matrix multiplication to keep transforms minimal
    const m11 = stretch * cos * cos + squeeze * sin * sin
    const m12 = (stretch - squeeze) * sin * cos
    const m21 = (stretch - squeeze) * sin * cos
    const m22 = stretch * sin * sin + squeeze * cos * cos

    element.style.transform = `matrix(${m11.toFixed(4)}, ${m21.toFixed(4)}, ${m12.toFixed(4)}, ${m22.toFixed(4)}, 0, 0)`

    if (contentEl instanceof HTMLElement) {
      const invStretch = stretch !== 0 ? 1 / stretch : 1
      const invSqueeze = squeeze !== 0 ? 1 / squeeze : 1

      const invM11 = invStretch * cos * cos + invSqueeze * sin * sin
      const invM12 = (invStretch - invSqueeze) * sin * cos
      const invM21 = (invStretch - invSqueeze) * sin * cos
      const invM22 = invStretch * sin * sin + invSqueeze * cos * cos

      contentEl.style.transform = `matrix(${invM11.toFixed(4)}, ${invM21.toFixed(4)}, ${invM12.toFixed(4)}, ${invM22.toFixed(4)}, 0, 0)`
    }

    // Parallax effect (light follows drag direction)
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
    if (contentEl instanceof HTMLElement) {
      contentEl.style.transform = ''
    }
    cancelAnimationFrame(rafId)
  }
}
