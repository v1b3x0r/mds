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
    stack = [];
    /**
     * Add new intent to stack (sorted by priority)
     */
    push(intent) {
        const fullIntent = {
            goal: intent.goal,
            target: intent.target,
            motivation: intent.motivation ?? 0.5,
            priority: intent.priority ?? 1,
            created: Date.now(),
            timeout: intent.timeout
        };
        this.stack.push(fullIntent);
        // Sort by priority (highest first)
        this.stack.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Remove and return highest priority intent
     */
    pop() {
        return this.stack.shift();
    }
    /**
     * Get current intent (highest priority) without removing
     */
    current() {
        return this.stack[0];
    }
    /**
     * Get all intents (for inspection)
     */
    all() {
        return [...this.stack];
    }
    /**
     * Check if stack has intent with specific goal
     */
    has(goal) {
        return this.stack.some(i => i.goal === goal);
    }
    /**
     * Remove all intents with specific goal
     */
    remove(goal) {
        this.stack = this.stack.filter(i => i.goal !== goal);
    }
    /**
     * Remove intent targeting specific entity
     */
    removeTarget(target) {
        this.stack = this.stack.filter(i => i.target !== target);
    }
    /**
     * Clear all intents
     */
    clear() {
        this.stack = [];
    }
    /**
     * Update intents (remove expired timeouts)
     */
    update(currentTime) {
        this.stack = this.stack.filter(intent => {
            if (!intent.timeout || !intent.created)
                return true;
            const elapsed = (currentTime - intent.created) / 1000;
            return elapsed < intent.timeout;
        });
    }
    /**
     * Get stack size
     */
    count() {
        return this.stack.length;
    }
    /**
     * Check if stack is empty
     */
    isEmpty() {
        return this.stack.length === 0;
    }
    /**
     * Get all intents (for serialization)
     */
    getAll() {
        return [...this.stack];
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            stack: this.stack
        };
    }
    /**
     * Restore from JSON
     */
    static fromJSON(data) {
        const stack = new IntentStack();
        stack.stack = data.stack;
        return stack;
    }
}
/**
 * Helper: Create intent
 */
export function createIntent(options) {
    return {
        goal: options.goal,
        target: options.target,
        motivation: options.motivation ?? 0.5,
        priority: options.priority ?? 1,
        created: Date.now(),
        timeout: options.timeout
    };
}
/**
 * Predefined intent templates
 */
export const INTENT_TEMPLATES = {
    idle: { goal: 'rest', motivation: 0.2, priority: 0 },
    wander: { goal: 'wander', motivation: 0.4, priority: 1 },
    curious: { goal: 'observe', motivation: 0.6, priority: 2 },
    social: { goal: 'bond', motivation: 0.8, priority: 3 },
    fearful: { goal: 'avoid', motivation: 0.9, priority: 4 }
};
