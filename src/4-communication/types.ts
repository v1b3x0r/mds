/**
 * MDS v5.2 - Communication Type Definitions
 * Shared interfaces to break Entity ↔ Communication circular dependency
 *
 * These minimal interfaces allow communication modules to work with entities
 * without importing the full Entity class, breaking circular dependencies.
 *
 * IMPORTANT: This file must NOT import from other communication modules
 * to avoid circular dependencies. Use forward references (unknown) instead.
 */

/**
 * Message sender interface
 * Minimal interface for entities that can send messages
 *
 * Note: inbox/outbox are typed as unknown to avoid circular import
 */
export interface MessageSender {
  id: string
  outbox?: unknown  // MessageQueue type (avoid circular import)
}

/**
 * Message receiver interface
 * Minimal interface for entities that can receive messages
 */
export interface MessageReceiver {
  id: string
  inbox?: unknown   // MessageQueue type (avoid circular import)
  x?: number  // Optional: for proximity-based delivery
  y?: number
}

/**
 * Combined message participant interface
 * For entities that both send and receive messages
 */
export interface MessageParticipant extends MessageSender, MessageReceiver {
  id: string
  inbox?: unknown   // MessageQueue type (avoid circular import)
  outbox?: unknown  // MessageQueue type (avoid circular import)
  x?: number
  y?: number
}

/**
 * Dialogue participant interface
 * For entities that can participate in dialogues
 *
 * Includes minimal state needed for dialogue conditions and callbacks
 */
export interface DialogueParticipant {
  id: string
  emotion?: {
    valence: number
    arousal: number
    dominance: number
  }
  memory?: unknown  // MemoryBuffer type (avoid circular import)
  relationships?: unknown  // Map<string, Relationship> (avoid circular import)
}
