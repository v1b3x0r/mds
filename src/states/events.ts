/**
 * Material Definition System - Pointer Event Handlers
 */

import type { StateType } from '../core/types'
import { StateMachine } from './machine'

const DRAG_THRESHOLD = 5 // pixels

/**
 * Pointer tracking data
 */
interface PointerData {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isDragging: boolean
}

/**
 * Event handler cleanup functions
 */
type CleanupFn = () => void

/**
 * Attach pointer event handlers to element
 */
export function attachPointerEvents(
  element: HTMLElement,
  stateMachine: StateMachine,
  onStateChange: (state: StateType, pointerData?: PointerData) => void
): CleanupFn {
  let pointerData: PointerData | null = null

  // Pointer enter (hover start)
  const onPointerEnter = () => {
    if (stateMachine.transition('hover')) {
      onStateChange('hover')
    }
  }

  // Pointer leave (back to base)
  const onPointerLeave = () => {
    // Clean up drag state if active
    if (pointerData?.isDragging) {
      pointerData = null
    }

    if (stateMachine.transition('base')) {
      onStateChange('base')
    }
  }

  // Pointer down (press start)
  const onPointerDown = (e: PointerEvent) => {
    pointerData = {
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false
    }

    if (stateMachine.transition('press')) {
      onStateChange('press', pointerData)
    }

    // Capture pointer for reliable drag tracking
    element.setPointerCapture(e.pointerId)
  }

  // Pointer move (potential drag)
  const onPointerMove = (e: PointerEvent) => {
    if (!pointerData) return

    pointerData.currentX = e.clientX
    pointerData.currentY = e.clientY

    // Check if movement exceeds threshold for drag
    if (!pointerData.isDragging && stateMachine.getState() === 'press') {
      const deltaX = pointerData.currentX - pointerData.startX
      const deltaY = pointerData.currentY - pointerData.startY
      const distance = Math.hypot(deltaX, deltaY)

      if (distance > DRAG_THRESHOLD) {
        pointerData.isDragging = true
        if (stateMachine.transition('drag')) {
          onStateChange('drag', pointerData)
        }
      }
    }

    // Continue drag if active
    if (pointerData.isDragging) {
      onStateChange('drag', pointerData)
    }
  }

  // Pointer up (release)
  const onPointerUp = (e: PointerEvent) => {
    const currentState = stateMachine.getState()

    if (currentState === 'press' || currentState === 'drag') {
      // Transition back to hover or base
      const wasInside = element.matches(':hover')
      const targetState: StateType = wasInside ? 'hover' : 'base'

      if (stateMachine.transition(targetState)) {
        onStateChange(targetState)
      }
    }

    pointerData = null
    element.releasePointerCapture(e.pointerId)
  }

  // Focus events
  const onFocus = () => {
    if (stateMachine.transition('focus')) {
      onStateChange('focus')
    }
  }

  const onBlur = () => {
    if (stateMachine.transition('base')) {
      onStateChange('base')
    }
  }

  // Attach all listeners
  element.addEventListener('pointerenter', onPointerEnter)
  element.addEventListener('pointerleave', onPointerLeave)
  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointermove', onPointerMove)
  element.addEventListener('pointerup', onPointerUp)
  element.addEventListener('pointercancel', onPointerUp) // Treat cancel as release
  element.addEventListener('focus', onFocus)
  element.addEventListener('blur', onBlur)

  // Return cleanup function
  return () => {
    element.removeEventListener('pointerenter', onPointerEnter)
    element.removeEventListener('pointerleave', onPointerLeave)
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', onPointerUp)
    element.removeEventListener('pointercancel', onPointerUp)
    element.removeEventListener('focus', onFocus)
    element.removeEventListener('blur', onBlur)
  }
}

/**
 * Get pointer delta from pointer data
 */
export function getPointerDelta(pointerData: PointerData): { x: number; y: number } {
  return {
    x: pointerData.currentX - pointerData.startX,
    y: pointerData.currentY - pointerData.startY
  }
}
