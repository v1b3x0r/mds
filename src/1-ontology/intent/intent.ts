/**
 * MDS v5.0 - Intent System
 * Goal-driven behavior with priority stacking
 *
 * Design principles:
 * - Intents are goals, not commands (declarative, not imperative)
 * - Stack allows multiple simultaneous goals with priorities
 * - Current intent drives behavior (top of stack)
 * - Intents can be satisfied (popped) or abandoned (cleared)
 */

/**
 * Intent goal types
 */
export type IntentGoal =
  | 'approach'      // Move toward target
  | 'avoid'         // Move away from target
  | 'bond'          // Form relationship with target
  | 'observe'       // Watch target without moving
  | 'wander'        // Random movement
  | 'rest'          // Reduce movement
  | 'explore'       // Seek new areas
  | 'follow'        // Track target's movement
  | 'custom'        // User-defined goal

/**
 * Individual intent (goal + context)
 */
export interface Intent {
  goal: IntentGoal     // What the entity wants to do
  target?: string      // Entity ID, position, or undefined (for goalless intents)
  motivation: number   // Strength of desire (0..1)
  priority: number     // Stack priority (higher = more important)
  created?: number     // When intent was created (for timeout)
  timeout?: number     // Auto-remove after N seconds
}

/**
 * Intent creation options
 */
export interface IntentOptions {
  goal: IntentGoal
  target?: string
  motivation?: number
  priority?: number
  timeout?: number
}

/**
 * Intent stack (priority queue)
 *
 * @example
 * const stack = new IntentStack()
 *
 * // Add intents
 * stack.push({ goal: 'wander', motivation: 0.3, priority: 1 })
 * stack.push({ goal: 'bond', target: otherEntity.id, motivation: 0.8, priority: 2 })
 *
 * // Current intent (highest priority)
 * const current = stack.current()  // { goal: 'bond', ... }
 *
 * // Remove current intent
 * stack.pop()
 *
 * // Check if has intent
 * if (stack.has('approach')) { ... }
 *
 * // Clear all intents
 * stack.clear()
 */
export class IntentStack {
  private stack: Intent[] = []

  /**
   * Add new intent to stack (sorted by priority)
   */
  push(intent: Intent | IntentOptions): void {
    const fullIntent: Intent = {
      goal: intent.goal,
      target: intent.target,
      motivation: intent.motivation ?? 0.5,
      priority: intent.priority ?? 1,
      created: Date.now(),
      timeout: intent.timeout
    }

    this.stack.push(fullIntent)

    // Sort by priority (highest first)
    this.stack.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Remove and return highest priority intent
   */
  pop(): Intent | undefined {
    return this.stack.shift()
  }

  /**
   * Get current intent (highest priority) without removing
   */
  current(): Intent | undefined {
    return this.stack[0]
  }

  /**
   * Get all intents (for inspection)
   */
  all(): Intent[] {
    return [...this.stack]
  }

  /**
   * Check if stack has intent with specific goal
   */
  has(goal: IntentGoal): boolean {
    return this.stack.some(i => i.goal === goal)
  }

  /**
   * Remove all intents with specific goal
   */
  remove(goal: IntentGoal): void {
    this.stack = this.stack.filter(i => i.goal !== goal)
  }

  /**
   * Remove intent targeting specific entity
   */
  removeTarget(target: string): void {
    this.stack = this.stack.filter(i => i.target !== target)
  }

  /**
   * Clear all intents
   */
  clear(): void {
    this.stack = []
  }

  /**
   * Update intents (remove expired timeouts)
   */
  update(currentTime: number): void {
    this.stack = this.stack.filter(intent => {
      if (!intent.timeout || !intent.created) return true
      const elapsed = (currentTime - intent.created) / 1000
      return elapsed < intent.timeout
    })
  }

  /**
   * Get stack size
   */
  count(): number {
    return this.stack.length
  }

  /**
   * Check if stack is empty
   */
  isEmpty(): boolean {
    return this.stack.length === 0
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      stack: this.stack
    }
  }

  /**
   * Restore from JSON
   */
  static fromJSON(data: ReturnType<IntentStack['toJSON']>): IntentStack {
    const stack = new IntentStack()
    stack.stack = data.stack
    return stack
  }
}

/**
 * Helper: Create intent
 */
export function createIntent(options: IntentOptions): Intent {
  return {
    goal: options.goal,
    target: options.target,
    motivation: options.motivation ?? 0.5,
    priority: options.priority ?? 1,
    created: Date.now(),
    timeout: options.timeout
  }
}

/**
 * Predefined intent templates
 */
export const INTENT_TEMPLATES = {
  idle: { goal: 'rest' as IntentGoal, motivation: 0.2, priority: 0 },
  wander: { goal: 'wander' as IntentGoal, motivation: 0.4, priority: 1 },
  curious: { goal: 'observe' as IntentGoal, motivation: 0.6, priority: 2 },
  social: { goal: 'bond' as IntentGoal, motivation: 0.8, priority: 3 },
  fearful: { goal: 'avoid' as IntentGoal, motivation: 0.9, priority: 4 }
}
