/**
 * Chat Context Provider
 * v5.8.0 - Chat app → trigger context
 *
 * Provides:
 * - user.message: Latest user message (string)
 * - user.silence: Seconds since last message (number)
 *
 * Usage:
 * ```typescript
 * const chatProvider = new ChatContextProvider()
 * const context = chatProvider.getContext("Hello!")
 * // → { 'user.message': 'Hello!', 'user.silence': 0 }
 *
 * // Later (after 30 seconds of silence)
 * const context2 = chatProvider.getContext()
 * // → { 'user.message': '', 'user.silence': 30 }
 * ```
 */

import { BaseContextProvider } from './ContextProvider'

export class ChatContextProvider extends BaseContextProvider {
  name = 'chat'
  private lastMessageTime = Date.now()
  private lastMessage = ''

  /**
   * Get current chat context
   * @param message - Optional new message from user
   */
  getContext(message?: string): Record<string, any> {
    const now = Date.now()
    const silenceDuration = (now - this.lastMessageTime) / 1000

    // Update state if new message provided
    if (message !== undefined && message !== '') {
      this.lastMessageTime = now
      this.lastMessage = message
    }

    return {
      'user.message': this.lastMessage,
      'user.silence': silenceDuration
    }
  }

  /**
   * Reset silence timer (e.g., when user starts typing)
   */
  resetSilence(): void {
    this.lastMessageTime = Date.now()
  }

  /**
   * Get current silence duration without updating context
   */
  getCurrentSilence(): number {
    return (Date.now() - this.lastMessageTime) / 1000
  }
}
