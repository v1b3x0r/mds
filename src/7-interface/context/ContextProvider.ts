/**
 * Context Provider Interface
 * v5.8.0 - Auto-context injection system
 *
 * Context providers automatically populate trigger context for entities
 * without requiring manual updateTriggerContext() calls.
 *
 * Examples:
 * - ChatContextProvider: user.message, user.silence
 * - OSContextProvider: cpu.usage, memory.usage, battery.level
 * - IoTContextProvider: sensor.temperature, sensor.humidity
 * - GameContextProvider: player.distance, player.action
 */

export interface ContextProvider {
  /**
   * Provider name (for debugging/logging)
   */
  name: string

  /**
   * Get current context as key-value pairs
   * Called automatically by World at poll intervals
   *
   * @returns Context object with dot-notation keys
   * @example
   * {
   *   'cpu.usage': 0.75,
   *   'memory.usage': 0.82,
   *   'battery.level': 0.45
   * }
   */
  getContext(...args: any[]): Record<string, any>
}

/**
 * Base context provider with common utilities
 */
export abstract class BaseContextProvider implements ContextProvider {
  abstract name: string

  abstract getContext(...args: any[]): Record<string, any>

  /**
   * Normalize value to 0-1 range
   */
  protected normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)))
  }

  /**
   * Map value from one range to another
   */
  protected map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
  }
}
