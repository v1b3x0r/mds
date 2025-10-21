/**
 * MDS v4.0 → v5.0 - Entity Class
 * A living material instance with autonomous behavior
 *
 * v5 additions:
 * - Persistent identity (UUID)
 * - Memory system (MemoryBuffer)
 * - Emotional state (PAD model)
 * - Intent system (goal stack)
 * - Relationships (bond graph)
 */

import type { MdsMaterial } from '../schema/mdspec'
import type { Engine } from './engine'
import { clamp } from '../utils/math'
import { applyRule } from '../utils/events'

// v5 ontology imports (optional features)
import {
  MemoryBuffer,
  EmotionalState,
  EmotionalDelta,
  IntentStack,
  Intent,
  Relationship,
  applyEmotionalDelta,
  EMOTION_BASELINES
} from '../ontology'

// v5 Phase 6: Communication imports
import type { MessageQueue, DialogueState, Message, MessageType, MessagePriority } from '../communication'
import { MessageQueue as MsgQueue, createMessage } from '../communication'

// v5 Phase 7: Cognitive imports
import type { LearningSystem, MemoryConsolidation, SkillSystem } from '../cognitive'

export class Entity {
  // Material definition
  m: MdsMaterial

  // Spatial properties
  x: number
  y: number
  vx = 0
  vy = 0

  // Temporal properties
  age = 0
  repeats = 0

  // Info-physics properties
  entropy: number
  energy: number
  opacity = 1

  // DOM element (optional in v5 renderer mode)
  el?: HTMLDivElement

  // Interaction tracking
  hoverCount = 0
  lastHoverTime = 0

  // Proximity callback (set by engine)
  onProximity?: (engine: Engine, other: Entity, dist: number) => void

  // Lifecycle hooks (v4.1)
  onSpawn?: (engine: Engine, entity: Entity) => void
  onUpdate?: (dt: number, entity: Entity) => void
  onDestroy?: (entity: Entity) => void

  // v5 Ontology (optional - only initialized if schema >= 5.0)
  id: string                                    // Persistent UUID
  memory?: MemoryBuffer                         // Memory ring buffer
  emotion?: EmotionalState                      // PAD emotional state
  intent?: IntentStack                          // Goal stack
  relationships?: Map<string, Relationship>     // Entity bonds

  // v5 Phase 5: Environmental physics (optional)
  temperature?: number                          // Kelvin
  humidity?: number                             // 0..1
  density?: number                              // kg/m³
  conductivity?: number                         // Thermal transfer rate (0..1)

  // v5 Phase 6: Communication (optional)
  inbox?: MessageQueue                          // Received messages
  outbox?: MessageQueue                         // Sent messages
  dialogue?: DialogueState                      // Current dialogue state

  // v5 Phase 7: Cognitive (optional)
  learning?: LearningSystem                     // Experience-based learning
  consolidation?: MemoryConsolidation           // Memory consolidation
  skills?: SkillSystem                          // Skill acquisition

  constructor(
    m: MdsMaterial,
    x?: number,
    y?: number,
    rng: () => number = Math.random,
    options?: { skipDOM?: boolean }  // v5: Allow DOM-less entities
  ) {
    this.m = m
    this.x = x ?? rng() * 480
    this.y = y ?? rng() * 320

    // Initialize info-physics properties (v4.2: use provided RNG)
    this.entropy = rng()
    this.energy = rng()

    // Override opacity if specified
    if (m.manifestation?.aging?.start_opacity !== undefined) {
      this.opacity = m.manifestation.aging.start_opacity
    }

    // v5: Assign persistent UUID
    this.id = this.generateUUID()

    // v5: Initialize ontology (conditional - only if schema >= 5.0)
    if (this.shouldEnableOntology(m)) {
      this.initializeOntology(m)
    }

    // Create DOM element (v4 legacy mode - skip if using v5 renderer)
    if (!options?.skipDOM) {
      this.el = document.createElement('div')
      this.el.className = 'mds-entity'
      this.el.style.position = 'absolute'
      this.el.style.willChange = 'transform, opacity, filter'
      this.el.dataset.material = m.material
      this.el.dataset.id = this.id

      // Set emoji
      const emoji = m.manifestation?.emoji ?? '📄'
      this.el.textContent = emoji

      // Attach event handlers
      this.attachDOMHandlers()

      // Append to body
      document.body.appendChild(this.el)

      // Initial render
      this.render()
    }
  }

  /**
   * Generate UUID (v5)
   */
  private generateUUID(): string {
    // Simple UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Check if ontology features should be enabled (v5)
   */
  private shouldEnableOntology(m: MdsMaterial): boolean {
    // Enable if schema version is 5.0 or higher
    if (m.$schema?.includes('v5')) return true

    // Enable if material has ontology-specific fields (implicit v5)
    // @ts-ignore - checking for v5 fields not in v4 schema yet
    if (m.ontology) return true

    // Disabled by default (backward compatible)
    return false
  }

  /**
   * Initialize ontology features (v5)
   */
  private initializeOntology(m: MdsMaterial): void {
    // Memory buffer
    // @ts-ignore - v5 schema extension
    const memorySize = m.ontology?.memorySize ?? 100
    this.memory = new MemoryBuffer({ maxSize: memorySize })

    // Emotional state
    // @ts-ignore - v5 schema extension
    const emotionBaseline = m.ontology?.emotionBaseline ?? EMOTION_BASELINES.neutral
    this.emotion = { ...emotionBaseline }

    // Intent stack
    this.intent = new IntentStack()

    // @ts-ignore - v5 schema extension
    const defaultIntent = m.ontology?.intentDefault
    if (defaultIntent) {
      this.intent.push(defaultIntent)
    }

    // Relationships (empty initially)
    this.relationships = new Map()

    // Phase 5: Environmental physics properties
    // @ts-ignore - v5 Phase 5 extension
    this.temperature = m.physics?.temperature ?? 293  // 20°C default
    // @ts-ignore - v5 Phase 5 extension
    this.humidity = m.physics?.humidity ?? 0.5
    // @ts-ignore - v5 Phase 5 extension
    this.density = m.physics?.density ?? 1.0  // kg/m³
    // @ts-ignore - v5 Phase 5 extension
    this.conductivity = m.physics?.conductivity ?? 0.5  // 0..1

    // Phase 6: Communication (lazy initialization - created on first use)
    // this.inbox and this.outbox will be created when first message is sent/received
    // this.dialogue will be set by DialogueManager when dialogue starts

    // Log spawn memory
    this.remember({
      timestamp: 0,
      type: 'spawn',
      subject: 'world',
      content: { material: m.material },
      salience: 1.0
    })
  }

  /**
   * Attach DOM event handlers for interactive behavior
   */
  private attachDOMHandlers(): void {
    if (!this.el) return

    this.el.addEventListener('mouseover', () => {
      const now = performance.now()

      // Track hover repeats (within 700ms window)
      if (now - this.lastHoverTime < 700) {
        this.hoverCount++
      } else {
        this.hoverCount = 1
      }
      this.lastHoverTime = now

      // Apply onHover behavior
      const rule = this.m.behavior?.onHover
      if (rule) applyRule(rule, this)

      // Apply onRepeatHover if threshold met
      const r2 = this.m.behavior?.onRepeatHover
      if (r2 && this.hoverCount >= (r2.threshold ?? 3)) {
        applyRule(r2, this)
      }
    })
  }

  /**
   * Update entity state (aging, decay, friction)
   */
  update(dt: number): void {
    // Age increases
    this.age += dt

    // Opacity decay
    const decay = this.m.manifestation?.aging?.decay_rate ?? 0
    if (decay > 0) {
      this.opacity = clamp(this.opacity - decay * dt, 0, 1)
    }

    // Apply friction to velocity
    const fr = this.m.physics?.friction ?? 0.02
    this.vx *= (1 - fr)
    this.vy *= (1 - fr)

    // Call lifecycle hook (v4.1)
    this.onUpdate?.(dt, this)
  }

  /**
   * Integrate velocity and update DOM position
   */
  integrate(_dt: number): void {
    this.x += this.vx
    this.y += this.vy
  }

  integrateAndRender(dt: number): void {
    this.integrate(dt)
    this.render()
  }

  /**
   * Update DOM styles (v4 legacy mode only)
   */
  render(): void {
    if (!this.el) return
    this.el.style.opacity = String(this.opacity)
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`
  }

  /**
   * Cleanup DOM element (v4 legacy mode only)
   */
  destroy(): void {
    // Call lifecycle hook (v4.1)
    this.onDestroy?.(this)
    this.el?.remove()
  }

  /**
   * Apply emotional change (v5)
   */
  feel(delta: EmotionalDelta): void {
    if (!this.emotion) return
    this.emotion = applyEmotionalDelta(this.emotion, delta)
  }

  /**
   * Add a memory (v5)
   */
  remember(memory: {
    timestamp: number
    type: import('../ontology').MemoryType
    subject: string
    content?: any
    salience?: number
  }): void {
    if (!this.memory) return
    this.memory.add({
      timestamp: memory.timestamp,
      type: memory.type,
      subject: memory.subject,
      content: memory.content ?? {},
      salience: memory.salience ?? 0.5
    })
  }

  /**
   * Set current intent (v5)
   */
  setIntent(intent: Intent): void {
    if (!this.intent) return
    this.intent.push(intent)
  }

  /**
   * Get current intent (v5)
   */
  getCurrentIntent(): Intent | undefined {
    return this.intent?.current()
  }

  /**
   * Send message to another entity (v5 Phase 6)
   */
  sendMessage(
    type: MessageType,
    content: string,
    receiver?: Entity,
    priority: MessagePriority = 'normal'
  ): Message {
    // Lazy initialization of outbox
    if (!this.outbox) {
      this.outbox = new MsgQueue()
    }

    // Create message
    const message = createMessage(this, type, content, receiver, priority)

    // Add to outbox
    this.outbox.enqueue(message)

    // Remember sending message (if memory enabled)
    if (this.memory) {
      this.remember({
        timestamp: Date.now(),
        type: 'interaction',  // Use valid MemoryType
        subject: receiver?.id || 'broadcast',
        content: { messageType: type, content },
        salience: 0.7
      })
    }

    return message
  }

  /**
   * Get unread messages from inbox (v5 Phase 6)
   */
  getUnreadMessages(): Message[] {
    if (!this.inbox) return []
    return this.inbox.getUnread()
  }

  /**
   * Read next message from inbox (v5 Phase 6)
   */
  readNextMessage(): Message | undefined {
    if (!this.inbox) return undefined

    const message = this.inbox.dequeue()

    if (message && this.memory) {
      // Remember receiving message (if memory enabled)
      this.remember({
        timestamp: Date.now(),
        type: 'interaction',  // Use valid MemoryType
        subject: message.sender.id,
        content: { messageType: message.type, content: message.content },
        salience: message.priority === 'urgent' ? 1.0 : 0.6
      })
    }

    return message
  }

  /**
   * Check if entity has unread messages (v5 Phase 6)
   */
  hasUnreadMessages(): boolean {
    return this.inbox ? this.inbox.unreadCount() > 0 : false
  }

  /**
   * Serialize entity to JSON (v4.2 → v5.0)
   */
  toJSON() {
    return {
      // v4 fields (required)
      material: this.m.material,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      age: this.age,
      opacity: this.opacity,
      entropy: this.entropy,
      energy: this.energy,
      hoverCount: this.hoverCount,
      lastHoverTime: this.lastHoverTime,

      // v5 fields (optional - only if present)
      id: this.id,
      ...(this.memory && { memory: this.memory.toJSON() }),
      ...(this.emotion && { emotion: this.emotion }),
      ...(this.intent && { intent: this.intent.toJSON() }),
      ...(this.relationships && {
        relationships: Array.from(this.relationships.entries())
      })
    }
  }

  /**
   * Restore entity from serialized data (v4.2 → v5.0)
   */
  static fromJSON(
    data: ReturnType<Entity['toJSON']>,
    material: MdsMaterial,
    rng: () => number = Math.random
  ): Entity {
    const entity = new Entity(material, data.x, data.y, rng)

    // Restore v4 fields
    entity.vx = data.vx
    entity.vy = data.vy
    entity.age = data.age
    entity.opacity = data.opacity
    entity.entropy = data.entropy
    entity.energy = data.energy
    entity.hoverCount = data.hoverCount
    entity.lastHoverTime = data.lastHoverTime

    // Restore v5 fields (if present)
    if (data.id) {
      entity.id = data.id
    }

    // @ts-ignore - v5 data may have memory
    if (data.memory) {
      // @ts-ignore
      entity.memory = MemoryBuffer.fromJSON(data.memory)
    }

    // @ts-ignore - v5 data may have emotion
    if (data.emotion) {
      // @ts-ignore
      entity.emotion = data.emotion
    }

    // @ts-ignore - v5 data may have intent
    if (data.intent) {
      // @ts-ignore
      entity.intent = IntentStack.fromJSON(data.intent)
    }

    // @ts-ignore - v5 data may have relationships
    if (data.relationships) {
      entity.relationships = new Map()
      // @ts-ignore
      for (const [entityId, bond] of data.relationships) {
        entity.relationships.set(entityId, bond)
      }
    }

    entity.render()
    return entity
  }
}
