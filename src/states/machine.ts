/**
 * Material Definition System - State Machine
 */

import type { StateType } from '../core/types'

/**
 * Valid state transitions
 */
const STATE_FLOW: Record<StateType, StateType[]> = {
  base: ['hover', 'focus', 'disabled'],
  hover: ['press', 'base', 'disabled'],
  press: ['pressed-and-moving', 'hover', 'base', 'focus', 'disabled'],
  'pressed-and-moving': ['hover', 'base', 'disabled'],
  focus: ['base', 'hover', 'disabled'],
  disabled: [] // No transitions from disabled (except programmatic)
}

/**
 * State machine for managing material state transitions
 */
export class StateMachine {
  private currentState: StateType = 'base'
  private previousState: StateType = 'base'
  private debug: boolean = false // Set to true to enable transition warnings

  /**
   * Check if transition to target state is valid
   */
  canTransition(to: StateType): boolean {
    // Always allow transition from/to disabled (programmatic control)
    if (to === 'disabled' || this.currentState === 'disabled') {
      return true
    }

    return STATE_FLOW[this.currentState].includes(to)
  }

  /**
   * Attempt state transition
   * @returns true if transition succeeded
   */
  transition(to: StateType): boolean {
    if (this.currentState === to) {
      return false // Already in target state
    }

    if (!this.canTransition(to)) {
      if (this.debug) {
        console.warn(`Invalid state transition: ${this.currentState} → ${to}`)
      }
      return false
    }

    this.previousState = this.currentState
    this.currentState = to
    return true
  }

  /**
   * Force transition (ignore validity check)
   * Use for programmatic control only
   */
  forceTransition(to: StateType): void {
    this.previousState = this.currentState
    this.currentState = to
  }

  /**
   * Get current state
   */
  getState(): StateType {
    return this.currentState
  }

  /**
   * Get previous state
   */
  getPreviousState(): StateType {
    return this.previousState
  }

  /**
   * Reset to base state
   */
  reset(): void {
    this.previousState = this.currentState
    this.currentState = 'base'
  }
}
