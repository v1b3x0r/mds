/**
 * MDS v5 Phase 6 - Message System
 * Entity-to-entity communication via typed messages
 *
 * Design principles:
 * - Messages are typed (dialogue, signal, emotion, action)
 * - Messages have priority (urgent > normal > low)
 * - Messages can be direct (1-to-1) or broadcast (1-to-many)
 * - Message history is stored for memory
 */

import type { Entity } from '../core/entity'

/**
 * Message types
 */
export type MessageType =
  | 'dialogue'    // Spoken communication
  | 'signal'      // Non-verbal signal (gesture, look)
  | 'emotion'     // Emotional broadcast (joy, fear, sadness)
  | 'action'      // Action announcement (move, attack, help)
  | 'thought'     // Internal thought (not heard by others)

/**
 * Message priority
 */
export type MessagePriority = 'urgent' | 'normal' | 'low'

/**
 * Message structure
 */
export interface Message {
  id: string
  type: MessageType
  priority: MessagePriority
  sender: Entity
  receiver?: Entity         // undefined = broadcast
  content: string
  metadata?: Record<string, any>
  timestamp: number
  delivered: boolean
  read: boolean
}

/**
 * Message builder for fluent API
 */
export class MessageBuilder {
  private message: Partial<Message>

  constructor(sender: Entity) {
    this.message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender,
      priority: 'normal',
      timestamp: Date.now(),
      delivered: false,
      read: false
    }
  }

  type(type: MessageType): this {
    this.message.type = type
    return this
  }

  to(receiver: Entity): this {
    this.message.receiver = receiver
    return this
  }

  broadcast(): this {
    this.message.receiver = undefined
    return this
  }

  priority(priority: MessagePriority): this {
    this.message.priority = priority
    return this
  }

  content(content: string): this {
    this.message.content = content
    return this
  }

  metadata(metadata: Record<string, any>): this {
    this.message.metadata = metadata
    return this
  }

  build(): Message {
    if (!this.message.type) throw new Error('Message type is required')
    if (!this.message.content) throw new Error('Message content is required')

    return this.message as Message
  }
}

/**
 * Message queue for entity inbox/outbox
 */
export class MessageQueue {
  private messages: Message[] = []
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  /**
   * Add message to queue
   */
  enqueue(message: Message): void {
    // Insert by priority (urgent first)
    const priorityOrder = { urgent: 0, normal: 1, low: 2 }
    const insertIndex = this.messages.findIndex(
      m => priorityOrder[m.priority] > priorityOrder[message.priority]
    )

    if (insertIndex === -1) {
      this.messages.push(message)
    } else {
      this.messages.splice(insertIndex, 0, message)
    }

    // Enforce max size (remove oldest low-priority messages)
    if (this.messages.length > this.maxSize) {
      const lowPriorityIndex = this.messages.findIndex(m => m.priority === 'low')
      if (lowPriorityIndex !== -1) {
        this.messages.splice(lowPriorityIndex, 1)
      } else {
        this.messages.shift() // Remove oldest
      }
    }
  }

  /**
   * Get next message (highest priority, unread)
   */
  dequeue(): Message | undefined {
    const index = this.messages.findIndex(m => !m.read)
    if (index === -1) return undefined

    const message = this.messages[index]
    message.read = true
    return message
  }

  /**
   * Peek at next message without marking as read
   */
  peek(): Message | undefined {
    return this.messages.find(m => !m.read)
  }

  /**
   * Get all messages
   */
  getAll(): Message[] {
    return [...this.messages]
  }

  /**
   * Get unread messages
   */
  getUnread(): Message[] {
    return this.messages.filter(m => !m.read)
  }

  /**
   * Get messages by type
   */
  getByType(type: MessageType): Message[] {
    return this.messages.filter(m => m.type === type)
  }

  /**
   * Get messages from sender
   */
  getFromSender(sender: Entity): Message[] {
    return this.messages.filter(m => m.sender.id === sender.id)
  }

  /**
   * Mark all as read
   */
  markAllRead(): void {
    for (const message of this.messages) {
      message.read = true
    }
  }

  /**
   * Clear old messages (older than maxAge milliseconds)
   */
  clearOld(maxAge: number = 60000): void {
    const now = Date.now()
    this.messages = this.messages.filter(m => now - m.timestamp < maxAge)
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = []
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.messages.length
  }

  /**
   * Get unread count
   */
  unreadCount(): number {
    return this.messages.filter(m => !m.read).length
  }
}

/**
 * Message delivery system
 */
export class MessageDelivery {
  /**
   * Deliver message to receiver(s)
   */
  static deliver(message: Message, entities: Entity[]): void {
    if (message.receiver) {
      // Direct message (1-to-1)
      this.deliverDirect(message, message.receiver)
    } else {
      // Broadcast message (1-to-many)
      this.deliverBroadcast(message, entities)
    }
  }

  /**
   * Deliver direct message
   */
  private static deliverDirect(message: Message, receiver: Entity): void {
    if (!receiver.inbox) {
      receiver.inbox = new MessageQueue()
    }

    receiver.inbox.enqueue(message)
    message.delivered = true
  }

  /**
   * Deliver broadcast message (to all entities except sender)
   */
  private static deliverBroadcast(message: Message, entities: Entity[]): void {
    for (const entity of entities) {
      if (entity.id === message.sender.id) continue

      if (!entity.inbox) {
        entity.inbox = new MessageQueue()
      }

      // Clone message for each receiver
      const cloned = { ...message, receiver: entity }
      entity.inbox.enqueue(cloned)
    }

    message.delivered = true
  }

  /**
   * Deliver message to entities within radius (proximity broadcast)
   */
  static deliverProximity(message: Message, entities: Entity[], radius: number): void {
    const sender = message.sender

    for (const entity of entities) {
      if (entity.id === sender.id) continue

      const dx = entity.x - sender.x
      const dy = entity.y - sender.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= radius) {
        if (!entity.inbox) {
          entity.inbox = new MessageQueue()
        }

        const cloned = { ...message, receiver: entity }
        entity.inbox.enqueue(cloned)
      }
    }

    message.delivered = true
  }
}

/**
 * Helper: Create message
 */
export function createMessage(
  sender: Entity,
  type: MessageType,
  content: string,
  receiver?: Entity,
  priority: MessagePriority = 'normal'
): Message {
  return new MessageBuilder(sender)
    .type(type)
    .content(content)
    .priority(priority)
    [receiver ? 'to' : 'broadcast'](receiver as any)
    .build()
}
