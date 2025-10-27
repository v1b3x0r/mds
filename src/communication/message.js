/**
 * MDS v5 Phase 6 - Message System
 * Entity-to-entity communication via typed messages
 *
 * Design principles:
 * - Messages are typed (dialogue, signal, emotion, action)
 * - Messages have priority (urgent > normal > low)
 * - Messages can be direct (1-to-1) or broadcast (1-to-many)
 * - Message history is stored for memory
 *
 * v5.2: Uses MessageParticipant interface to avoid circular dependency with Entity
 */
/**
 * Message builder for fluent API
 * v5.2: Uses MessageParticipant instead of Entity
 */
export class MessageBuilder {
    message;
    constructor(sender) {
        this.message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender,
            priority: 'normal',
            timestamp: Date.now(),
            delivered: false,
            read: false
        };
    }
    type(type) {
        this.message.type = type;
        return this;
    }
    to(receiver) {
        this.message.receiver = receiver;
        return this;
    }
    broadcast() {
        this.message.receiver = undefined;
        return this;
    }
    priority(priority) {
        this.message.priority = priority;
        return this;
    }
    content(content) {
        this.message.content = content;
        return this;
    }
    metadata(metadata) {
        this.message.metadata = metadata;
        return this;
    }
    build() {
        if (!this.message.type)
            throw new Error('Message type is required');
        if (!this.message.content)
            throw new Error('Message content is required');
        return this.message;
    }
}
/**
 * Message queue for entity inbox/outbox
 */
export class MessageQueue {
    messages = [];
    maxSize;
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }
    /**
     * Add message to queue
     */
    enqueue(message) {
        // Insert by priority (urgent first)
        const priorityOrder = { urgent: 0, normal: 1, low: 2 };
        const insertIndex = this.messages.findIndex(m => priorityOrder[m.priority] > priorityOrder[message.priority]);
        if (insertIndex === -1) {
            this.messages.push(message);
        }
        else {
            this.messages.splice(insertIndex, 0, message);
        }
        // Enforce max size (remove oldest low-priority messages)
        if (this.messages.length > this.maxSize) {
            const lowPriorityIndex = this.messages.findIndex(m => m.priority === 'low');
            if (lowPriorityIndex !== -1) {
                this.messages.splice(lowPriorityIndex, 1);
            }
            else {
                this.messages.shift(); // Remove oldest
            }
        }
    }
    /**
     * Get next message (highest priority, unread)
     */
    dequeue() {
        const index = this.messages.findIndex(m => !m.read);
        if (index === -1)
            return undefined;
        const message = this.messages[index];
        message.read = true;
        return message;
    }
    /**
     * Peek at next message without marking as read
     */
    peek() {
        return this.messages.find(m => !m.read);
    }
    /**
     * Get all messages
     */
    getAll() {
        return [...this.messages];
    }
    /**
     * Get unread messages
     */
    getUnread() {
        return this.messages.filter(m => !m.read);
    }
    /**
     * Get messages by type
     */
    getByType(type) {
        return this.messages.filter(m => m.type === type);
    }
    /**
     * Get messages from sender
     */
    getFromSender(sender) {
        return this.messages.filter(m => m.sender.id === sender.id);
    }
    /**
     * Mark all as read
     */
    markAllRead() {
        for (const message of this.messages) {
            message.read = true;
        }
    }
    /**
     * Clear old messages (older than maxAge milliseconds)
     */
    clearOld(maxAge = 60000) {
        const now = Date.now();
        this.messages = this.messages.filter(m => now - m.timestamp < maxAge);
    }
    /**
     * Clear all messages
     */
    clear() {
        this.messages = [];
    }
    /**
     * Get queue size
     */
    size() {
        return this.messages.length;
    }
    /**
     * Get unread count
     */
    unreadCount() {
        return this.messages.filter(m => !m.read).length;
    }
}
/**
 * Message delivery system
 */
export class MessageDelivery {
    /**
     * Deliver message to receiver(s)
     */
    static deliver(message, entities) {
        if (message.receiver) {
            // Direct message (1-to-1)
            this.deliverDirect(message, message.receiver);
        }
        else {
            // Broadcast message (1-to-many)
            this.deliverBroadcast(message, entities);
        }
    }
    /**
     * Deliver direct message
     * v5.6: Defensive - skip if receiver has no inbox (natural filtering)
     */
    static deliverDirect(message, receiver) {
        // Entity ไม่มี inbox = ไม่ต้องการรับข้อความ (e.g., ก้อนหินธรรมดา)
        if (!receiver.inbox) {
            return;
        }
        receiver.inbox.enqueue(message);
        message.delivered = true;
    }
    /**
     * Deliver broadcast message (to all entities except sender)
     * v5.6: Defensive - skip entities without inbox (natural filtering)
     */
    static deliverBroadcast(message, entities) {
        for (const entity of entities) {
            if (entity.id === message.sender.id)
                continue;
            // v5.6: Skip entities without inbox (e.g., ก้อนหินธรรมดา, entities ที่ไม่มี dialogue)
            if (!entity.inbox)
                continue;
            // Clone message for each receiver
            const cloned = { ...message, receiver: entity };
            entity.inbox.enqueue(cloned);
        }
        message.delivered = true;
    }
    /**
     * Deliver message to entities within radius (proximity broadcast)
     */
    static deliverProximity(message, entities, radius) {
        const sender = message.sender;
        for (const entity of entities) {
            if (entity.id === sender.id)
                continue;
            // Check if spatial data exists
            if (entity.x === undefined || entity.y === undefined ||
                sender.x === undefined || sender.y === undefined) {
                continue;
            }
            const dx = entity.x - sender.x;
            const dy = entity.y - sender.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= radius) {
                if (!entity.inbox) {
                    entity.inbox = new MessageQueue();
                }
                const cloned = { ...message, receiver: entity };
                entity.inbox.enqueue(cloned);
            }
        }
        message.delivered = true;
    }
}
/**
 * Helper: Create message
 */
/**
 * Create a message (convenience function)
 * v5.2: Uses MessageParticipant instead of Entity
 */
export function createMessage(sender, type, content, receiver, priority = 'normal') {
    return new MessageBuilder(sender)
        .type(type)
        .content(content)
        .priority(priority)[receiver ? 'to' : 'broadcast'](receiver)
        .build();
}
