/**
 * MDS v4.0 - LLM Bridge
 * Typed interface for optional AI integration (stub only in v4.0)
 */

/**
 * LLM Bridge interface
 * External implementations can provide real AI functionality
 */
export interface LlmBridge {
  /**
   * Generate speech/response from material
   * @param materialId - Material identifier
   * @param context - Additional context for generation
   * @returns Generated text
   */
  speak(materialId: string, context: Record<string, unknown>): Promise<string>

  /**
   * Compute semantic similarity between two materials
   * @param essenceA - First material essence
   * @param essenceB - Second material essence
   * @returns Similarity score (0..1)
   */
  similarity?(essenceA: string, essenceB: string): Promise<number>
}

/**
 * Dummy bridge implementation (no network calls)
 * Can be replaced with real LLM integration
 */
export const DummyBridge: LlmBridge = {
  async speak(): Promise<string> {
    return ''
  },

  async similarity(): Promise<number> {
    return 0
  }
}

/**
 * Global LLM bridge instance
 * Users can replace with their own implementation:
 *
 * @example
 * import { setLlmBridge } from '@v1b3x0r/mds-core'
 *
 * setLlmBridge({
 *   async speak(materialId, context) {
 *     const response = await fetch('/api/llm', { ... })
 *     return response.text()
 *   }
 * })
 */
let currentBridge: LlmBridge = DummyBridge

export function setLlmBridge(bridge: LlmBridge): void {
  currentBridge = bridge
}

export function getLlmBridge(): LlmBridge {
  return currentBridge
}
