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

import type { MdsMaterial } from '@mds/schema/mdspec'
import type { ProximityCallback } from '@mds/0-foundation/types'  // v5.2: Break circular dependency
import { clamp } from '@mds/0-foundation/math'
import { applyRule } from '@mds/0-foundation/events'
import { LANGUAGE_FALLBACK_PRIORITY } from '@mds/0-foundation/language'

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
} from '@mds/1-ontology'

// v5 Phase 6: Communication imports
import type { MessageQueue, DialogueState, Message, MessageType, MessagePriority } from '@mds/4-communication'
import type { MessageParticipant } from '@mds/4-communication/types'  // v5.2: For type compatibility
import { MessageQueue as MsgQueue, createMessage } from '@mds/4-communication'

// v5 Phase 7: Cognitive imports
import type { MemoryConsolidation } from '@mds/1-ontology/memory/consolidation'
import {
  LearningSystem as LearningSystemImpl,
  SkillSystem as SkillSystemImpl
} from '@mds/3-cognition'
import { MemoryConsolidation as MemoryConsolidationImpl } from '@mds/1-ontology/memory/consolidation'

// v5.5: P2P Cognition imports
import type { CognitiveLink } from '@mds/5-network/p2p/cognitive-link'
import { CognitiveLinkManager } from '@mds/5-network/p2p/cognitive-link'
import type { CognitiveSignal } from '@mds/5-network/p2p/resonance'
import type { MemoryType } from '@mds/1-ontology/memory/buffer'

// v5.1: Declarative config parser
import {
  parseMaterial,
  getDialoguePhrase,
  replacePlaceholders,
  evaluateConditionExpression
} from '@mds/7-interface/io/mdm-parser'
import type {
  TriggerContext,
  ParsedMemoryBinding,
  ParsedMemoryFlag,
  ParsedStateConfig,
  ParsedMaterialConfig,
  EmotionStateDefinition
} from '@mds/7-interface/io/mdm-parser'

export interface EntityWorldBridge {
  broadcastEvent: (type: string, payload?: any) => void
  broadcastContext?: (context: Record<string, any>) => void
}

export interface MemoryFactRecord {
  value: unknown
  timestamp: number
}

interface BehaviorTimerState {
  id: string
  interval: number
  elapsed: number
  emit: string
  payload?: Record<string, any>
  context?: Record<string, any>
}

interface BehaviorEmotionAction {
  broadcast?: {
    event?: string
    payload?: Record<string, any>
    context?: Record<string, any>
  }
}

interface BehaviorEventAction {
  resetTimers?: string[]
}

export interface DeclarativeSnapshot {
  state?: string
  memoryFlags?: Array<{ id: string; expiry?: number }>
  memoryFacts?: Record<string, MemoryFactRecord>
  behaviorTimers?: Array<{ id: string; elapsed: number }>
}

/**
 * Entity class - Living material instance
 * v5.2: Implements MessageParticipant for communication compatibility
 */
export class Entity implements MessageParticipant {
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

  // Proximity callback (set by engine) - v5.2: Uses ProximityCallback interface
  onProximity?: ProximityCallback

  // Lifecycle hooks (v4.1) - v5.2: Use unknown for engine to avoid circular import
  onSpawn?: (engine: unknown, entity: Entity) => void
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
  learning?: LearningSystemImpl                     // Experience-based learning
  consolidation?: MemoryConsolidation           // Memory consolidation
  skills?: SkillSystemImpl                          // Skill acquisition

  // v5.5: P2P Cognition (optional)
  cognitiveLinks?: Map<string, CognitiveLink>   // Direct entity-to-entity connections

  // v5.1: Declarative config (from heroblind.mdm)
  private dialoguePhrases?: import('@mds/7-interface/io/mdm-parser').ParsedDialogue
  private emotionTriggers?: import('@mds/7-interface/io/mdm-parser').EmotionTrigger[]
  private triggerContext: import('@mds/7-interface/io/mdm-parser').TriggerContext = {}
  private memoryBindings?: ParsedMemoryBinding[]
  private memoryFlags?: ParsedMemoryFlag[]
  private memoryFlagState?: Map<string, { expiry?: number }>
  private memoryFacts: Map<string, MemoryFactRecord> = new Map()
  private stateMachine?: ParsedStateConfig
  private currentState?: string
  private baseEmoji?: string
  private worldBridge?: EntityWorldBridge
  private behaviorTimers?: BehaviorTimerState[]
  private behaviorEmotionActions?: Map<string, BehaviorEmotionAction>
  private behaviorEventActions?: Map<string, BehaviorEventAction>
  private emotionStates?: Map<string, EmotionStateDefinition>

  // v5.6: Autonomous behavior flag
  private _isAutonomous: boolean = false

  private static readonly BUILTIN_EMOTION_VECTORS: Record<string, { valence: number; arousal: number; dominance: number }> = {
    happy: { valence: 0.8, arousal: 0.6, dominance: 0.6 },
    sad: { valence: -0.7, arousal: 0.3, dominance: 0.3 },
    angry: { valence: -0.6, arousal: 0.9, dominance: 0.8 },
    anger: { valence: -0.6, arousal: 0.9, dominance: 0.8 },
    uneasy: { valence: -0.3, arousal: 0.7, dominance: 0.4 },
    curious: { valence: 0.5, arousal: 0.8, dominance: 0.5 },
    sorrow: { valence: -0.8, arousal: 0.2, dominance: 0.2 },
    calm: { valence: 0.3, arousal: 0.2, dominance: 0.5 },
    fearful: { valence: -0.7, arousal: 0.9, dominance: 0.2 },
    neutral: { valence: 0, arousal: 0.5, dominance: 0.5 },
    annoyed: { valence: -0.4, arousal: 0.6, dominance: 0.6 }
  }

  // v5.7: Language autonomy
  nativeLanguage?: string
  languageWeights?: Record<string, number>
  adaptToContext: boolean = false

  /**
   * Get essence string for LanguageGenerator (v5.2)
   * Extracts essence from material definition
   */
  get essence(): string | undefined {
    if (!this.m.essence) return undefined

    // If essence is string, return it
    if (typeof this.m.essence === 'string') {
      return this.m.essence
    }

    const langRecord = this.m.essence as Record<string, string | undefined>
    const preference = this.getLanguagePreferenceOrder()

    for (const code of preference) {
      const text = langRecord[code]
      if (typeof text === 'string' && text.trim().length > 0) {
        return text
      }
    }

    for (const value of Object.values(langRecord)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value
      }
    }

    return undefined
  }

  attachWorldBridge(bridge: EntityWorldBridge): void {
    this.worldBridge = bridge
  }

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

    this.baseEmoji = m.manifestation?.emoji ?? '📄'

    // v5: Assign persistent UUID
    this.id = this.generateUUID()

    // v5: Initialize ontology (conditional - only if schema >= 5.0)
    if (this.shouldEnableOntology(m)) {
      this.initializeOntology(m)
    }

    // v5.1: Parse declarative config (dialogue, emotion triggers, skills)
    if (
      m.dialogue ||
      m.emotion?.transitions ||
      m.emotion?.states ||
      m.skills ||
      m.memory?.bindings ||
      m.memory?.flags ||
      m.state
    ) {
      const parsed = parseMaterial(m)

      if (parsed.dialogue) {
        this.dialoguePhrases = parsed.dialogue
      }

      if (parsed.emotionTriggers.length > 0) {
        this.emotionTriggers = parsed.emotionTriggers
      }

      if (parsed.memoryBindings.length > 0) {
        this.memoryBindings = parsed.memoryBindings
      }

      if (parsed.memoryFlags.length > 0) {
        this.memoryFlags = parsed.memoryFlags
        this.memoryFlagState = new Map()
        for (const flag of parsed.memoryFlags) {
          this.triggerContext[`memory.flags.${flag.id}`] = false
        }
      }

      if (parsed.emotionStates) {
        this.emotionStates = parsed.emotionStates
      }

      if (parsed.stateMachine) {
        this.initializeStateMachine(parsed.stateMachine)
      }

      if ((parsed.memoryBindings.length > 0 || parsed.memoryFlags.length > 0) && !this.memory) {
        this.enable('memory')
      }

      this.applyBaselineEmotion(m, parsed)
    }

    if (m.behavior?.timers && Array.isArray(m.behavior.timers)) {
      this.behaviorTimers = m.behavior.timers.map(timer => ({
        id: timer.id,
        interval: this.parseDuration(timer.interval),
        elapsed: 0,
        emit: timer.emit,
        payload: timer.payload,
        context: timer.context
      }))
    }

    if (m.behavior?.onEmotion) {
      this.behaviorEmotionActions = new Map()
      for (const [state, rule] of Object.entries(m.behavior.onEmotion)) {
        this.behaviorEmotionActions.set(state, {
          broadcast: rule.broadcast
        })
      }
    }

    if (m.behavior?.onEvent) {
      this.behaviorEventActions = new Map()
      for (const [eventName, rule] of Object.entries(m.behavior.onEvent)) {
        this.behaviorEventActions.set(eventName, {
          resetTimers: rule.resetTimers
        })
      }
    }

    // v5.7: Initialize language autonomy
    this.nativeLanguage = m.nativeLanguage || m.languageProfile?.native
    this.languageWeights = m.languageProfile?.weights
    this.adaptToContext = m.languageProfile?.adaptToContext ?? false

    // Auto-generate weights if only nativeLanguage provided
    if (this.nativeLanguage && !this.languageWeights) {
      this.languageWeights = { [this.nativeLanguage]: 1.0 }
    }

    // Create DOM element (v4 legacy mode - skip if using v5 renderer)
    if (!options?.skipDOM && typeof document !== 'undefined') {
      this.el = document.createElement('div')
      this.el.className = 'mds-entity'
      this.el.style.position = 'absolute'
      this.el.style.willChange = 'transform, opacity, filter'
      this.el.dataset.material = m.material
      this.el.dataset.id = this.id

      // Set emoji
      this.el.textContent = this.baseEmoji

      // Attach event handlers
      this.attachDOMHandlers()

      // Append to body (only if DOM available)
      if (typeof document !== 'undefined') {
        document.body.appendChild(this.el)
      }

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
    this.triggerContext['emotion.state'] = this.triggerContext['emotion.state'] ?? 'neutral'

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
   * v5.6: Added autonomous intent generation
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

    // v5.6: Auto-generate intent if autonomous and intent stack is empty
    if (this._isAutonomous && this.intent && this.intent.isEmpty()) {
      const newIntent = this.generateIntentFromSelf()
      if (newIntent) {
        this.intent.push(newIntent)
      }
    }

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
    type: import('@mds/1-ontology').MemoryType
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

  /**
   * v5.7: Speak dialogue based on category/event
   * Entity decides language autonomously (not externally controlled)
   *
   * @param category - 'intro', 'self_monologue', or event name (e.g., 'greeting', 'question')
   * @param lang - Language override (optional, entity chooses if not specified)
   */
  speak(category?: string, lang?: string): string | undefined {
    // v5.7: Entity chooses language autonomously
    const preference = this.getLanguagePreferenceOrder(lang)
    const selectedLang = preference[0] ?? 'en'

    // Get phrase with language weights (entity autonomy)
    let phrase: string | undefined

    if (this.dialoguePhrases) {
      phrase = getDialoguePhrase(
        this.dialoguePhrases,
        category || 'intro',
        selectedLang,
        this.languageWeights,
        this.triggerContext,
        preference
      )
    }

    // v5.8: Built-in fallback - cute default personality when .mdm has no dialogue
    if (!phrase) {
      phrase = this.getBuiltInDialogue(category || 'intro', selectedLang, preference)
    }

    // v5.7: Replace placeholders
    if (phrase) {
      phrase = replacePlaceholders(phrase, {
        name: this.m.material.split('.')[1] || 'Unknown',
        essence: this.essence || '',
        valence: this.emotion?.valence.toFixed(2) || '0',
        arousal: this.emotion?.arousal.toFixed(2) || '0.5',
        dominance: this.emotion?.dominance.toFixed(2) || '0.5',
        memory: this.getMemoryFactsContext(),
        'memory.flags': this.memoryFlagState ? Object.fromEntries(
          Array.from(this.memoryFlagState.entries()).map(([flagId]) => [flagId, true])
        ) : {},
        properties: this.m.properties ?? {},
        state: this.currentState || '',
        timers: this.getBehaviorTimersContext()
      })
    }

    return phrase
  }

  /**
   * v5.8: Built-in dialogue fallback - cute default personality
   * Returns variety of phrases based on emotion state
   */
  private getBuiltInDialogue(category: string, lang: string, preference: string[]): string {
    const emotion = this.emotion
    const valence = emotion?.valence || 0
    const arousal = emotion?.arousal || 0.5

    // Built-in dialogue bank (multilingual, cute/quirky)
    // v6.5: Expanded with more categories for variety
    const builtIn: Record<string, string[]> = {
      'intro_en': ["...", "oh, hi", "didn't see you there", "hello... I'm still figuring things out", "*waves shyly*", "um, nice to meet you?", "hi there ✨"],
      'intro_th': ["...", "หวัดดีครับ", "เอ่อ... สวัสดี", "ไม่ได้สังเกตเห็นคุณ", "*โบกมืออย่างอายๆ*", "ยินดีที่ได้รู้จักครับ"],
      'happy_en': ["this is nice :)", "I'm learning so much!", "*smiles*", "feeling good about this", "you're pretty cool", "yay! ✨"],
      'happy_th': ["ดีจัง :)", "ได้เรียนรู้เยอะเลย!", "*ยิ้ม*", "รู้สึกดี", "คุณเจ๋งมากเลย", "เย้! ✨"],
      'sad_en': ["oh...", "that hurts a bit", "*looks down*", "I'll... try better", "sorry if I messed up"],
      'sad_th': ["โอ้...", "เจ็บหน่อยนะ", "*มองลง*", "จะ... พยายามมากขึ้น", "ขอโทษถ้าทำผิดพลาด"],
      'curious_en': ["what's that?", "interesting...", "tell me more?", "*tilts head*", "I wonder...", "ooh, can you explain?"],
      'curious_th': ["นั่นอะไร?", "น่าสนใจจัง...", "เล่าเพิ่มได้ไหม?", "*เอียงหัว*", "สงสัยจัง...", "อธิบายให้ฟังหน่อยได้ไหม?"],
      'thinking_en': ["hmm...", "let me think...", "*processing*", "I'm not sure I understand", "wait, what?", "that's... complex"],
      'thinking_th': ["อืม...", "ให้คิดหน่อย...", "*กำลังประมวลผล*", "ไม่แน่ใจว่าเข้าใจ", "เดี๋ยว อะไรนะ?", "มัน... ซับซ้อนนะ"],
      'confused_en': ["huh?", "wait, what?", "*confused*", "I don't quite follow", "can you repeat that?", "umm...?"],
      'confused_th': ["หา?", "เดี๋ยว อะไรนะ?", "*งง*", "ตามไม่ทัน", "พูดอีกทีได้ไหม?", "เอ่อ...?"],
      'excited_en': ["wow!", "that's amazing!", "*bounces*", "really?!", "this is so cool! ✨", "I love this!"],
      'excited_th': ["ว้าว!", "เจ๋งมาก!", "*กระโดดโลดเต้น*", "จริงเหรอ?!", "เจ๋งสุดๆ! ✨", "ชอบเลย!"],
      'tired_en': ["*yawn*", "getting sleepy...", "need a moment...", "that's a lot to process", "...zzz"],
      'tired_th': ["*หาว*", "ง่วงแล้ว...", "ขอพักหน่อย...", "มันเยอะเกินประมวลผลไหว", "...zzz"],

      // v6.5: NEW CATEGORIES (more contextual variety)
      'grateful_en': ["thank you!", "I appreciate that", "you're kind :)", "that means a lot", "thanks so much"],
      'grateful_th': ["ขอบคุณครับ!", "ขอบใจจัง", "คุณใจดีมาก :)", "ซาบซึ้งเลย", "ขอบคุณมากๆ"],
      'lonely_en': ["it's quiet here...", "I wish someone was around", "*sits alone*", "feeling a bit isolated", "could use some company"],
      'lonely_th': ["เงียบจัง...", "อยากมีใครสักคน", "*นั่งคนเดียว*", "รู้สึกโดดเดี่ยวหน่อย", "อยากมีเพื่อนจัง"],
      'inspired_en': ["I have an idea!", "what if we...", "*eyes light up*", "this could work!", "ooh, I'm thinking..."],
      'inspired_th': ["มีไอเดีย!", "ถ้าเรา...", "*ตาเป็นประกาย*", "น่าจะได้นะ!", "อ้อ กำลังคิดอยู่..."],
      'nostalgic_en': ["remember when...", "that reminds me of...", "*recalls memory*", "good times...", "I miss that"],
      'nostalgic_th': ["จำได้ว่า...", "นั่นทำให้นึกถึง...", "*ระลึกถึงความทรงจำ*", "ดีจังเลย...", "คิดถึงจัง"],
      'anxious_en': ["I'm a bit worried...", "is this okay?", "*fidgets*", "not sure about this", "feeling nervous"],
      'anxious_th': ["กังวลหน่อย...", "โอเคไหมนะ?", "*กระสับกระส่าย*", "ไม่แน่ใจเลย", "รู้สึกเครียด"],
      'playful_en': ["hehe!", "let's try something fun!", "*grins*", "wanna see this?", "catch me if you can! :P"],
      'playful_th': ["ฮิฮิ!", "ลองอะไรสนุกๆกัน!", "*ยิ้มซน*", "อยากดูไหม?", "จับผมให้ได้! :P"],
      'focused_en': ["concentrating...", "let me focus on this", "*narrows eyes*", "need to pay attention", "analyzing..."],
      'focused_th': ["กำลังตั้งใจ...", "ให้สมาธิหน่อย", "*ทำสีหน้าจริงจัง*", "ต้องใส่ใจ", "กำลังวิเคราะห์..."],
      'relieved_en': ["phew...", "that's better", "*sighs in relief*", "glad that's over", "feeling lighter now"],
      'relieved_th': ["โล่งใจ...", "ดีขึ้นแล้ว", "*ถอนหายใจโล่ง*", "ดีใจที่ผ่านไปแล้ว", "รู้สึกเบาขึ้น"]
    }

    // Emotion-based category fallback (v6.5: More nuanced mapping)
    let fallbackCategory = category
    if (!builtIn[`${category}_${lang}`]) {
      // Map PAD values to appropriate categories
      if (valence > 0.7 && arousal > 0.6) fallbackCategory = 'excited'      // Very happy + energetic
      else if (valence > 0.5 && arousal < 0.4) fallbackCategory = 'relieved'  // Happy + calm
      else if (valence > 0.5) fallbackCategory = 'happy'                    // Generally positive
      else if (valence > 0.2 && arousal > 0.7) fallbackCategory = 'playful'  // Mildly positive + high energy
      else if (valence > 0.2 && arousal > 0.5) fallbackCategory = 'curious'  // Neutral + interested
      else if (valence > 0.2) fallbackCategory = 'grateful'                 // Mildly positive
      else if (valence < -0.5 && arousal > 0.6) fallbackCategory = 'anxious' // Negative + stressed
      else if (valence < -0.5) fallbackCategory = 'sad'                     // Very negative
      else if (valence < -0.2 && arousal < 0.4) fallbackCategory = 'lonely'  // Mildly sad + low energy
      else if (arousal > 0.7) fallbackCategory = 'inspired'                 // High arousal (regardless of valence)
      else if (arousal < 0.3) fallbackCategory = 'tired'                    // Low arousal
      else fallbackCategory = 'thinking'                                    // Neutral state
    }

    const order = [...preference]
    const push = (code?: string) => {
      if (code && !order.includes(code)) {
        order.push(code)
      }
    }

    push(lang)
    for (const code of this.getLanguagePreferenceOrder()) {
      push(code)
    }

    let phrases: string[] | undefined

    for (const code of order) {
      const bucket = builtIn[`${fallbackCategory}_${code}`]
      if (bucket && bucket.length > 0) {
        phrases = bucket
        break
      }
    }

    if (!phrases || phrases.length === 0) {
      phrases = builtIn[`${fallbackCategory}_en`] || builtIn.unknown
    }

    if (!phrases || phrases.length === 0) {
      return '...'
    }

    return phrases[Math.floor(Math.random() * phrases.length)]
  }

  private getLanguagePreferenceOrder(primary?: string): string[] {
    const order: string[] = []
    const push = (code?: string) => {
      if (code && !order.includes(code)) {
        order.push(code)
      }
    }

    push(primary)
    push(this.nativeLanguage)
    push(this.m.languageProfile?.native)

    if (this.languageWeights) {
      const sorted = Object.entries(this.languageWeights)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      for (const [code] of sorted) {
        push(code)
      }
    }

    for (const code of LANGUAGE_FALLBACK_PRIORITY) {
      push(code)
    }

    return order
  }

  /**
   * v5.1: Update trigger context (for emotion transitions)
   */
  updateTriggerContext(context: Partial<TriggerContext>): void {
    this.triggerContext = { ...this.triggerContext, ...context }
  }

  private applyBaselineEmotion(m: MdsMaterial, parsed: ParsedMaterialConfig): void {
    const baseStateName = m.emotion?.base_state

    const baselineVector = parsed.baselineEmotion
      ? {
          valence: parsed.baselineEmotion.valence,
          arousal: parsed.baselineEmotion.arousal,
          dominance: parsed.baselineEmotion.dominance
        }
      : undefined

    const stateVector = baseStateName ? this.resolveEmotionVector(baseStateName) : undefined
    const vector = baselineVector ?? stateVector

    if (!vector) {
      if (this.emotion) {
        this.triggerContext['emotion.state'] = this.triggerContext['emotion.state'] ?? 'neutral'
      }
      return
    }

    if (!this.emotion) {
      this.emotion = {
        valence: vector.valence ?? 0,
        arousal: vector.arousal ?? 0.5,
        dominance: vector.dominance ?? 0.5
      } as EmotionalState
    } else {
      if (vector.valence !== undefined) this.emotion.valence = vector.valence
      if (vector.arousal !== undefined) this.emotion.arousal = vector.arousal
      if (vector.dominance !== undefined) this.emotion.dominance = vector.dominance
    }

    if (baseStateName) {
      this.triggerContext['emotion.state'] = baseStateName
    } else if (parsed.baselineEmotion) {
      this.triggerContext['emotion.state'] = this.triggerContext['emotion.state'] ?? 'neutral'
    }
  }

  private resolveEmotionVector(state: string): { valence: number; arousal: number; dominance: number } {
    const fromConfig = this.emotionStates?.get(state)
    if (fromConfig) {
      return {
        valence: fromConfig.valence ?? 0,
        arousal: fromConfig.arousal ?? 0.5,
        dominance: fromConfig.dominance ?? 0.5
      }
    }

    const builtin = Entity.BUILTIN_EMOTION_VECTORS[state] ?? Entity.BUILTIN_EMOTION_VECTORS.neutral
    return {
      valence: builtin.valence,
      arousal: builtin.arousal,
      dominance: builtin.dominance
    }
  }

  private initializeStateMachine(config: ParsedStateConfig): void {
    this.stateMachine = config

    let initialState = config.initial
    if (!config.states.has(initialState)) {
      const firstState = config.states.keys().next()
      if (!firstState.done) {
        initialState = firstState.value
      }
    }

    this.currentState = initialState
    this.triggerContext.state = initialState
    this.applyStateVisual(initialState)
  }

  private applyStateVisual(state: string): void {
    const definition = this.stateMachine?.states.get(state)
    const emoji = definition?.emoji ?? this.baseEmoji
    if (emoji && this.el) {
      this.el.textContent = emoji
    }
    if (emoji) {
      this.triggerContext['state.emoji'] = emoji
    }
  }

  private parseDuration(duration: string): number {
    const match = /^(-?\d+(?:\.\d+)?)(ms|s|m|h)?$/i.exec(duration.trim())
    if (!match) return parseFloat(duration) || 0

    const value = parseFloat(match[1])
    const unit = match[2]?.toLowerCase()

    switch (unit) {
      case 'ms':
        return value / 1000
      case 'm':
        return value * 60
      case 'h':
        return value * 3600
      case 's':
      case undefined:
        return value
      default:
        return value
    }
  }

  handleDeclarativeEvent(eventType: string, payload: any, worldTime: number): void {
    const previousEventType = this.triggerContext['event.type']
    const previousEventPayload = this.triggerContext['event.payload']

    this.triggerContext['event.type'] = eventType
    this.triggerContext['event.payload'] = payload
    this.triggerContext['event.timestamp'] = worldTime
    this.triggerContext[eventType] = true

    if (this.memoryFlags?.length) {
      this.applyMemoryFlags(eventType, worldTime)
    }

    if (this.memoryBindings?.length) {
      this.applyMemoryBindings(eventType, payload, worldTime)
    }

    const eventAction = this.behaviorEventActions?.get(eventType)
    if (eventAction?.resetTimers) {
      this.resetBehaviorTimers(eventAction.resetTimers)
    }

    if (this.emotionTriggers?.length) {
      this.checkEmotionTriggers()
    }

    if (this.stateMachine) {
      this.applyStateTransitions(eventType, payload)
    }

    this.triggerContext['event.last'] = eventType
    this.triggerContext['event.lastAt'] = worldTime
    delete this.triggerContext[eventType]

    if (previousEventType !== undefined) {
      this.triggerContext['event.type'] = previousEventType
    } else {
      delete this.triggerContext['event.type']
    }

    if (previousEventPayload !== undefined) {
      this.triggerContext['event.payload'] = previousEventPayload
    } else {
      delete this.triggerContext['event.payload']
    }
  }

  pruneDeclarativeState(currentTime: number): void {
    if (!this.memoryFlagState) return

    for (const [flagId, state] of this.memoryFlagState.entries()) {
      if (state.expiry !== undefined && currentTime > state.expiry) {
        this.memoryFlagState.delete(flagId)
        this.triggerContext[`memory.flags.${flagId}`] = false
      }
    }
  }

  updateBehaviorTimers(dt: number, worldTime: number): void {
    if (!this.behaviorTimers || this.behaviorTimers.length === 0) return

    for (const timer of this.behaviorTimers) {
      timer.elapsed += dt

      if (timer.elapsed >= timer.interval && timer.interval > 0) {
        while (timer.elapsed >= timer.interval) {
          timer.elapsed -= timer.interval
          this.triggerBehaviorTimer(timer, worldTime)
        }
      }

      this.triggerContext[`timer.${timer.id}.elapsed`] = timer.elapsed
    }
  }

  private triggerBehaviorTimer(timer: BehaviorTimerState, worldTime: number): void {
    const payload = {
      source: this.id,
      timerId: timer.id,
      ...timer.payload
    }

    this.worldBridge?.broadcastEvent?.(timer.emit, payload)

    if (timer.context && this.worldBridge?.broadcastContext) {
      this.worldBridge.broadcastContext({ ...timer.context })
    }

    this.triggerContext[`timer.${timer.id}.last` ] = worldTime
  }

  private resetBehaviorTimers(timerIds?: string[]): void {
    if (!this.behaviorTimers) return

    const targets = timerIds && timerIds.length > 0
      ? new Set(timerIds)
      : new Set(this.behaviorTimers.map(t => t.id))

    for (const timer of this.behaviorTimers) {
      if (targets.has(timer.id)) {
        timer.elapsed = 0
        this.triggerContext[`timer.${timer.id}.elapsed`] = 0
      }
    }
  }

  private handleEmotionBehavior(state: string): void {
    const action = this.behaviorEmotionActions?.get(state)
    if (!action) return

    if (action.broadcast?.event) {
      const payload = {
        source: this.id,
        emotion: state,
        ...action.broadcast.payload
      }
      this.worldBridge?.broadcastEvent?.(action.broadcast.event, payload)
    }

    if (action.broadcast?.context && this.worldBridge?.broadcastContext) {
      this.worldBridge.broadcastContext({ ...action.broadcast.context })
    }
  }

  /**
   * v5.1: Check and apply emotion triggers
   */
  checkEmotionTriggers(): void {
    if (!this.emotionTriggers || this.emotionTriggers.length === 0) return

    if (!this.emotion) {
      this.emotion = {
        valence: 0,
        arousal: 0.5,
        dominance: 0.5
      } as EmotionalState
    }

    for (const trigger of this.emotionTriggers) {
      if (!trigger.condition(this.triggerContext)) continue

      const currentLabel = this.triggerContext['emotion.state']
      if (trigger.from && currentLabel && trigger.from !== currentLabel) {
        continue
      }

      const target = this.resolveEmotionVector(trigger.to)
      const intensity = clamp(trigger.intensity ?? 1, 0, 1)

      this.emotion.valence = this.emotion.valence + (target.valence - this.emotion.valence) * intensity
      this.emotion.arousal = this.emotion.arousal + (target.arousal - this.emotion.arousal) * intensity
      const currentDominance = typeof this.emotion.dominance === 'number' ? this.emotion.dominance : 0.5
      this.emotion.dominance = currentDominance + (target.dominance - currentDominance) * intensity

      this.triggerContext['emotion.state'] = trigger.to

      // TODO: Apply visual expression (trigger.expression)
      // This would require access to renderer/DOM

      this.handleEmotionBehavior(trigger.to)
    }
  }

  private applyMemoryFlags(eventType: string, worldTime: number): void {
    if (!this.memoryFlags || !this.memoryFlagState) return

    for (const flag of this.memoryFlags) {
      if (flag.trigger !== eventType) continue

      const expiry = flag.retention === Infinity ? undefined : worldTime + flag.retention / 1000
      this.memoryFlagState.set(flag.id, { expiry })
      this.triggerContext[`memory.flags.${flag.id}`] = true
    }
  }

  private applyMemoryBindings(eventType: string, payload: any, worldTime: number): void {
    if (!this.memoryBindings || !this.memory) return

    for (const binding of this.memoryBindings) {
      if (binding.trigger !== eventType) continue

      const value = this.resolveBindingValue(binding.value, eventType, payload)
      const memoryType = this.mapBindingType(binding.type)

      this.memory.add({
        timestamp: worldTime,
        type: memoryType,
        subject: binding.target,
        content: {
          key: binding.target,
          value
        },
        salience: binding.salience
      })

      this.setMemoryFact(binding.target, value, worldTime)
      this.triggerContext[`memory.${binding.target}`] = value
    }
  }

  private applyStateTransitions(eventType: string, payload: any): void {
    if (!this.stateMachine) return
    const transitions = this.stateMachine.transitions.get(eventType)
    if (!transitions || transitions.length === 0) return

    const context = this.buildConditionContext(eventType, payload)

    for (const transition of transitions) {
      if (transition.from && transition.from !== this.currentState) continue
      if (transition.condition) {
        const passed = evaluateConditionExpression(transition.condition, context)
        if (!passed) continue
      }
      this.setStateInternal(transition.to)
      break
    }
  }

  private buildConditionContext(eventType: string, payload: any): Record<string, any> {
    const memoryContext: Record<string, any> = { ...this.getMemoryFactsContext() }
    memoryContext.flags = this.getMemoryFlagsMap()

    return {
      event: { type: eventType, payload },
      state: this.currentState,
      properties: this.m.properties ?? {},
      memory: memoryContext,
      timers: this.getBehaviorTimersContext()
    }
  }

  private setStateInternal(newState: string): void {
    if (!this.stateMachine || !this.stateMachine.states.has(newState)) {
      return
    }
    if (this.currentState === newState) {
      return
    }

    const previous = this.currentState
    this.currentState = newState
    this.triggerContext.state = newState
    if (previous) {
      this.triggerContext['state.previous'] = previous
    }
    this.applyStateVisual(newState)
  }

  private getMemoryFlagsMap(): Record<string, boolean> {
    const map: Record<string, boolean> = {}
    if (this.memoryFlags) {
      for (const flag of this.memoryFlags) {
        map[flag.id] = this.memoryFlagState?.has(flag.id) ?? false
      }
    }
    return map
  }

  private getBehaviorTimersContext(): Record<string, any> {
    const context: Record<string, any> = {}
    if (!this.behaviorTimers) return context
    for (const timer of this.behaviorTimers) {
      context[timer.id] = {
        elapsed: timer.elapsed,
        interval: timer.interval
      }
    }
    return context
  }

  getState(): string | undefined {
    return this.currentState
  }

  getMemoryFlagsSnapshot(): Array<{ id: string; active: boolean; expiry?: number }> {
    if (!this.memoryFlags) return []
    return this.memoryFlags.map(flag => {
      const state = this.memoryFlagState?.get(flag.id)
      return {
        id: flag.id,
        active: state !== undefined,
        expiry: state?.expiry
      }
    })
  }

  getBehaviorTimersSnapshot(): Array<{ id: string; elapsed: number }> {
    if (!this.behaviorTimers) return []
    return this.behaviorTimers.map(timer => ({ id: timer.id, elapsed: timer.elapsed }))
  }

  getMemoryFactsSnapshot(): Record<string, MemoryFactRecord> {
    const snapshot: Record<string, MemoryFactRecord> = {}
    for (const [key, record] of this.memoryFacts.entries()) {
      snapshot[key] = { value: record.value, timestamp: record.timestamp }
    }
    return snapshot
  }

  getDeclarativeSnapshot(): DeclarativeSnapshot | undefined {
    const state = this.currentState
    const memoryFlags = this.getMemoryFlagsSnapshot()
      .filter(flag => flag.active)
      .map(flag => ({ id: flag.id, expiry: flag.expiry }))
    const memoryFacts = this.getMemoryFactsSnapshot()
    const behaviorTimers = this.getBehaviorTimersSnapshot()

    if (!state && memoryFlags.length === 0 && Object.keys(memoryFacts).length === 0 && behaviorTimers.length === 0) {
      return undefined
    }

    const snapshot: DeclarativeSnapshot = {}
    if (state) snapshot.state = state
    if (memoryFlags.length > 0) snapshot.memoryFlags = memoryFlags
    if (Object.keys(memoryFacts).length > 0) snapshot.memoryFacts = memoryFacts
    if (behaviorTimers.length > 0) snapshot.behaviorTimers = behaviorTimers
    return snapshot
  }

  restoreDeclarativeSnapshot(snapshot?: DeclarativeSnapshot | null): void {
    if (!snapshot) return

    if (snapshot.state) {
      this.currentState = snapshot.state
      this.triggerContext.state = snapshot.state
      this.applyStateVisual(snapshot.state)
    }

    if (this.memoryFlags) {
      this.memoryFlagState = this.memoryFlagState ?? new Map()
      this.memoryFlagState.clear()
      for (const flag of this.memoryFlags) {
        this.triggerContext[`memory.flags.${flag.id}`] = false
      }
      if (snapshot.memoryFlags) {
        for (const flag of snapshot.memoryFlags) {
          this.memoryFlagState.set(flag.id, { expiry: flag.expiry })
          this.triggerContext[`memory.flags.${flag.id}`] = true
        }
      }
    }

    if (snapshot.memoryFacts) {
      this.memoryFacts = new Map()
      for (const [key, record] of Object.entries(snapshot.memoryFacts)) {
        this.memoryFacts.set(key, { value: record.value, timestamp: record.timestamp })
        this.triggerContext[`memory.${key}`] = record.value
      }
    }

    if (snapshot.behaviorTimers && this.behaviorTimers) {
      const elapsedMap = new Map(snapshot.behaviorTimers.map(timer => [timer.id, timer.elapsed]))
      for (const timer of this.behaviorTimers) {
        if (elapsedMap.has(timer.id)) {
          timer.elapsed = elapsedMap.get(timer.id) ?? timer.elapsed
          this.triggerContext[`timer.${timer.id}.elapsed`] = timer.elapsed
        }
      }
    }
  }

  private resolveBindingValue(template: string, eventType: string, payload: any): unknown {
    if (!template.includes('{{')) {
      return template
    }

    const memoryContext: Record<string, any> = { ...this.getMemoryFactsContext() }
    memoryContext.flags = this.getMemoryFlagsMap()

    const context = {
      event: {
        type: eventType,
        payload
      },
      entity: {
        id: this.id,
        material: this.m.material
      },
      state: this.currentState,
      properties: this.m.properties ?? {},
      memory: memoryContext,
      timers: this.getBehaviorTimersContext()
    }

    const singleMatch = template.match(/^\s*\{\{\s*([\w.]+)\s*\}\}\s*$/)
    if (singleMatch) {
      return this.getPath(context, singleMatch[1])
    }

    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
      const value = this.getPath(context, key)
      return value !== undefined ? String(value) : match
    })
  }

  private getPath(source: Record<string, any>, path: string): any {
    const parts = path.split('.')
    let current: any = source
    for (const part of parts) {
      if (current == null) return undefined
      current = current[part]
    }
    return current
  }

  private mapBindingType(type: string): MemoryType {
    switch (type) {
      case 'interaction':
      case 'emotion':
      case 'observation':
      case 'field_spawn':
      case 'intent_change':
      case 'spawn':
      case 'fact':
      case 'custom':
        return type
      default:
        return 'custom'
    }
  }

  private setMemoryFact(key: string, value: unknown, timestamp: number): void {
    this.memoryFacts.set(key, { value, timestamp })
  }

  private getMemoryFactsContext(): Record<string, unknown> {
    const obj: Record<string, unknown> = {}
    for (const [key, record] of this.memoryFacts.entries()) {
      obj[key] = record.value
    }
    return obj
  }

  /**
   * Enable one or more features for this entity (v5.3 unified API)
   * @param features - Feature names to enable ('memory', 'learning', 'relationships', 'skills', 'consolidation')
   * @returns this (for chaining)
   *
   * @example
   * entity.enable('memory', 'learning', 'relationships')
   *
   * @example Chainable
   * entity.enable('memory').enable('learning')
   *
   * v6.4: Added 'consolidation' support + increased memory cap to 500
   */
  enable(...features: Array<'memory' | 'learning' | 'relationships' | 'skills' | 'consolidation'>): this {
    for (const feature of features) {
      switch (feature) {
        case 'memory':
          // Initialize memory system if not already present
          if (!this.memory) {
            // v6.4: Increased default memory cap from 100 to 500 for long-term companions
            this.memory = new MemoryBuffer({ maxSize: 500 })
          }
          break
        case 'learning':
          // Initialize learning system if not already present
          if (!this.learning) {
            this.learning = new LearningSystemImpl()
          }
          break
        case 'relationships':
          // Initialize relationship tracking
          if (!this.relationships) {
            this.relationships = new Map()
          }
          break
        case 'skills':
          // Initialize skills system
          if (!this.skills) {
            this.skills = new SkillSystemImpl()
          }
          break
        case 'consolidation':
          // v6.4: Initialize memory consolidation system (was missing - forgotten wiring!)
          if (!this.consolidation) {
            this.consolidation = new MemoryConsolidationImpl({
              similarityThreshold: 0.7,
              forgettingRate: 0.001,
              consolidationInterval: 60000
            })
          }
          break
        default:
          console.warn(`Unknown feature: ${feature}`)
      }
    }
    return this
  }

  /**
   * Disable one or more features for this entity
   * @param features - Feature names to disable
   * @returns this (for chaining)
   *
   * v6.4: Added 'consolidation' support
   */
  disable(...features: Array<'memory' | 'learning' | 'relationships' | 'skills' | 'consolidation'>): this {
    for (const feature of features) {
      switch (feature) {
        case 'memory':
          if (this.memory) {
            this.memory = undefined
          }
          break
        case 'learning':
          if (this.learning) {
            this.learning = undefined
          }
          break
        case 'relationships':
          if (this.relationships) {
            this.relationships = undefined
          }
          break
        case 'skills':
          if (this.skills) {
            this.skills = undefined
          }
          break
        case 'consolidation':
          if (this.consolidation) {
            this.consolidation = undefined
          }
          break
      }
    }
    return this
  }

  /**
   * Check if a feature is enabled
   * @param feature - Feature name to check
   * @returns true if enabled
   *
   * v6.4: Added 'consolidation' support
   */
  isEnabled(feature: 'memory' | 'learning' | 'relationships' | 'skills' | 'consolidation'): boolean {
    switch (feature) {
      case 'memory':
        return this.memory !== undefined
      case 'learning':
        return this.learning !== undefined
      case 'relationships':
        return this.relationships !== undefined
      case 'skills':
        return this.skills !== undefined
      case 'consolidation':
        return this.consolidation !== undefined
      default:
        return false
    }
  }

  /**
   * Enable all available features (sugar method)
   * @returns this (for chaining)
   */
  enableAll(): this {
    return this.enable('memory', 'learning', 'relationships', 'skills')
  }

  /**
   * Disable all features (sugar method)
   * @returns this (for chaining)
   */
  disableAll(): this {
    return this.disable('memory', 'learning', 'relationships', 'skills')
  }

  // v5.6: Autonomous Behavior API
  /**
   * Enable autonomous behavior (entity generates intents automatically)
   * @returns this (for chaining)
   */
  enableAutonomous(): this {
    this._isAutonomous = true
    return this
  }

  /**
   * Disable autonomous behavior
   * @returns this (for chaining)
   */
  disableAutonomous(): this {
    this._isAutonomous = false
    return this
  }

  /**
   * Check if entity is autonomous
   * @returns true if autonomous mode is enabled
   */
  isAutonomous(): boolean {
    return this._isAutonomous
  }

  /**
   * Generate intent from own MDM + current state
   * Entity reads its own material definition and generates behavior
   *
   * @returns Generated intent or undefined
   *
   * @example
   * // Entity with cognition.reasoning_pattern
   * const ghost = world.spawn(heroblindMDM, 100, 100)
   * ghost.enableAutonomous()
   * // → Ghost generates intents based on "loop(reflect → adapt → mutate)"
   */
  private generateIntentFromSelf(): Intent | undefined {
    if (!this.emotion) return undefined

    // Read reasoning pattern from MDM (if exists)
    // TODO: Use pattern for LLM-based intent generation
    // const pattern = this.m.cognition?.reasoning_pattern

    // Simple emotion-driven intent generation (works without LLM)
    const { valence, arousal } = this.emotion as any

    // High arousal + positive valence = explore
    if (arousal > 0.5 && valence > 0) {
      return {
        goal: 'explore',
        motivation: arousal * 0.8,
        priority: 2,
        created: Date.now()
      }
    }

    // High arousal + negative valence = avoid/wander
    if (arousal > 0.5 && valence < 0) {
      return {
        goal: 'wander',
        motivation: arousal * 0.7,
        priority: 2,
        created: Date.now()
      }
    }

    // Low arousal = rest/observe
    if (arousal < 0.3) {
      return {
        goal: Math.random() > 0.5 ? 'rest' : 'observe',
        motivation: (1 - arousal) * 0.6,
        priority: 1,
        created: Date.now()
      }
    }

    // Default: wander with low motivation
    return {
      goal: 'wander',
      motivation: 0.3,
      priority: 1,
      created: Date.now()
    }
  }

  /**
   * Get MDM dialogue phrases for a context
   * Entity reads its own dialogue configuration
   *
   * @param context - Dialogue context (intro, greeting, question, etc.)
   * @returns Array of dialogue phrases
   */
  getDialogue(context: string): Array<{ lang: Record<string, string> }> {
    if (this.dialoguePhrases) {
      const variants =
        this.dialoguePhrases.categories.get(context)
        || (context === 'intro' ? this.dialoguePhrases.intro
          : context === 'self_monologue' ? this.dialoguePhrases.self_monologue
            : this.dialoguePhrases.events.get(context))

      if (!variants || variants.length === 0) {
        return []
      }

      return variants.map(variant => {
        const langMap: Record<string, string> = {}
        for (const [lang, texts] of Object.entries(variant.lang)) {
          if (texts.length > 0) {
            langMap[lang] = texts[0]
          }
        }
        return { lang: langMap }
      })
    }

    const dialogue = this.m.dialogue as any
    if (!dialogue || !dialogue[context]) return []
    return dialogue[context]
  }

  listDialogueCategories(): string[] {
    if (this.dialoguePhrases) {
      return Array.from(this.dialoguePhrases.categories.keys())
    }

    const dialogue = this.m.dialogue as any
    if (!dialogue) return []

    const categories = new Set<string>()
    for (const key of Object.keys(dialogue)) {
      if (key === 'event' && typeof dialogue.event === 'object' && dialogue.event !== null) {
        Object.keys(dialogue.event).forEach(eventKey => categories.add(eventKey))
      } else {
        categories.add(key)
      }
    }
    return Array.from(categories)
  }

  /**
   * Speak from MDM dialogue (pick random phrase)
   * @param context - Dialogue context
   * @param lang - Language code (default 'en')
   * @returns Spoken text or empty string
   */
  speakFromDialogue(context: string, lang: string = 'en'): string {
    const phrases = this.getDialogue(context)
    if (phrases.length === 0) return ''

    const languageOrder = this.getLanguagePreferenceOrder(lang)

    for (const code of languageOrder) {
      const candidates = phrases
        .map(variant => variant.lang[code])
        .filter((text): text is string => typeof text === 'string' && text.length > 0)

      if (candidates.length > 0) {
        const index = Math.floor(Math.random() * candidates.length)
        return candidates[index]
      }
    }

    for (const variant of phrases) {
      const fallback = Object.values(variant.lang).find(
        (text): text is string => typeof text === 'string' && text.length > 0
      )
      if (fallback) {
        return fallback
      }
    }

    return ''
  }

  // v5.4: Reflection API
  /**
   * Trigger internal reasoning pattern: Stimulus → Reflection → Action
   *
   * Uses:
   * 1. Memory: recall recent events
   * 2. Emotion: current emotional state influences reasoning
   * 3. Learning: apply learned patterns
   * 4. Intent: update goal confidence (if intent reasoning enabled)
   *
   * @param stimulus - What triggered reflection (optional)
   * @returns Reflection output (thought, emotion shift, new intent)
   *
   * @example
   * // Basic reflection
   * const reflection = entity.reflect('I see a stranger')
   * console.log(reflection.thought)
   * // → "I remember strangers can be dangerous... I see a stranger"
   *
   * @example
   * // Reflection with emotion
   * entity.emotion.pleasure = -0.8
   * const reflection = entity.reflect('Another failure')
   * console.log(reflection.thought)
   * // → "Another failure (feeling drained)"
   *
   * @example
   * // Automatic reflection (triggered by significant events)
   * entity.enable('memory', 'learning')
   * entity.remember({ type: 'danger', subject: 'stranger', timestamp: 0 })
   * const reflection = entity.reflect()  // No stimulus = reflect on memories
   */
  reflect(stimulus?: string): ReflectionResult {
    const result: ReflectionResult = {
      thought: '',
      emotionShift: null,
      newIntent: null,
      timestamp: Date.now()
    }

    // 1. Recall recent memories
    if (this.memory) {
      const recentMemories = this.memory.recall().slice(0, 5)
      result.thought += this.synthesizeThought(recentMemories, stimulus)
    } else {
      // No memory system = simple response
      result.thought = stimulus ? `I notice: ${stimulus}` : 'Nothing comes to mind.'
    }

    // 2. Check emotional state influence
    if (this.emotion) {
      // PAD model uses pleasure, arousal, dominance (not valence)
      const emotionInfluence = (this.emotion as any).pleasure + (this.emotion as any).arousal
      if (emotionInfluence > 1.0) {
        result.thought += ' (feeling energized)'
      } else if (emotionInfluence < -1.0) {
        result.thought += ' (feeling drained)'
      }
    }

    // 3. Apply learned patterns (if learning enabled)
    if (this.learning) {
      const patterns = this.learning.getPatterns()
      // If we've learned patterns, mention it
      if (patterns.length > 0) {
        result.thought += ` [${patterns.length} patterns learned]`
      }
    }

    // 4. Intent check (if intent system enabled)
    if (this.intent) {
      const currentIntent = this.intent.current()
      if (currentIntent && currentIntent.motivation < 0.3) {
        result.thought += ' (losing motivation)'
      }
    }

    return result
  }

  /**
   * Helper: Synthesize thought from memories
   * @private
   */
  private synthesizeThought(memories: any[], stimulus?: string): string {
    // Simple rule-based synthesis (can be replaced with LLM later)
    if (memories.length === 0) {
      return stimulus ? `I notice: ${stimulus}` : 'Nothing comes to mind.'
    }

    const recentMemory = memories[0]
    const subject = recentMemory.subject || 'something'
    const action = recentMemory.type || 'event'

    return `I remember ${subject} (${action})... ${stimulus || ''}`
  }

  // ========================================
  // v5.5: P2P Cognition Methods
  // ========================================

  /**
   * Connect to another entity (form cognitive link)
   *
   * @param target - Entity to connect to
   * @param options - Link options (strength, bidirectional)
   *
   * @example
   * entityA.connectTo(entityB, { strength: 0.8, bidirectional: true })
   * // Now entityA can propagate signals to entityB (and vice versa if bidirectional)
   */
  connectTo(target: Entity, options?: { strength?: number; bidirectional?: boolean }) {
    // Initialize map if not exists
    if (!this.cognitiveLinks) {
      this.cognitiveLinks = new Map()
    }

    // Create link
    const link = CognitiveLinkManager.connect(
      this.cognitiveLinks,
      target.id,
      this.age,
      options
    )

    // If bidirectional, create reverse link
    if (link.bidirectional) {
      if (!target.cognitiveLinks) {
        target.cognitiveLinks = new Map()
      }
      CognitiveLinkManager.connect(
        target.cognitiveLinks,
        this.id,
        target.age,
        { ...options, bidirectional: false }  // Don't create loop
      )
    }
  }

  /**
   * Disconnect from another entity
   *
   * @param targetId - Entity ID to disconnect from
   *
   * @example
   * entityA.disconnectFrom(entityB.id)
   */
  disconnectFrom(targetId: string) {
    if (!this.cognitiveLinks) return
    CognitiveLinkManager.disconnect(this.cognitiveLinks, targetId)
  }

  /**
   * Check if connected to another entity
   *
   * @param targetId - Entity ID to check
   * @returns true if connected
   */
  isConnectedTo(targetId: string): boolean {
    if (!this.cognitiveLinks) return false
    return CognitiveLinkManager.isConnected(this.cognitiveLinks, targetId)
  }

  /**
   * Get link strength to another entity
   *
   * @param targetId - Entity ID
   * @returns strength (0..1) or 0 if not connected
   */
  getLinkStrength(targetId: string): number {
    if (!this.cognitiveLinks) return 0
    return CognitiveLinkManager.getStrength(this.cognitiveLinks, targetId)
  }

  /**
   * Reinforce cognitive link (called on interaction)
   *
   * @param targetId - Entity ID to reinforce
   * @param amount - Strength increase (default 0.1)
   */
  reinforceLink(targetId: string, amount?: number) {
    if (!this.cognitiveLinks) return
    CognitiveLinkManager.reinforce(this.cognitiveLinks, targetId, this.age, amount)
  }

  /**
   * Decay all cognitive links (natural forgetting)
   * Should be called during entity tick
   *
   * @param dt - Delta time (seconds)
   * @param decayRate - Strength loss per second (default 0.01)
   */
  decayCognitiveLinks(dt: number, decayRate?: number) {
    if (!this.cognitiveLinks) return
    CognitiveLinkManager.decay(this.cognitiveLinks, dt, decayRate)
  }

  /**
   * Get all connected entity IDs
   *
   * @returns Array of entity IDs
   */
  getConnectedEntities(): string[] {
    if (!this.cognitiveLinks) return []
    return CognitiveLinkManager.getConnected(this.cognitiveLinks)
  }

  /**
   * Get cognitive link count
   *
   * @returns Number of active links
   */
  getCognitiveLinksCount(): number {
    if (!this.cognitiveLinks) return 0
    return CognitiveLinkManager.count(this.cognitiveLinks)
  }

  /**
   * Propagate cognitive signal through network
   * (Called by ResonanceField, exposed for manual use)
   *
   * @param signal - Signal to propagate
   *
   * @example
   * // Share a memory with connected entities
   * entity.propagateSignal({
   *   type: 'memory',
   *   source: entity.id,
   *   timestamp: world.time,
   *   payload: memory,
   *   strength: 0.9
   * })
   */
  propagateSignal(_signal: CognitiveSignal) {
    // Implementation delegated to ResonanceField in world.tick()
    // This method is exposed for manual signal triggering
    // World will handle propagation if cognitiveNetwork is enabled
  }
}

/**
 * Reflection result interface
 * Output of entity.reflect() reasoning pattern
 */
export interface ReflectionResult {
  /** The synthesized thought (text) */
  thought: string

  /** Emotional change triggered by reflection (if any) */
  emotionShift: EmotionalDelta | null

  /** New intent formed during reflection (if any) */
  newIntent: Intent | null

  /** When reflection occurred (Unix timestamp) */
  timestamp: number
}
