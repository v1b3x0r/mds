/**
 * ChatRuntime - v6.7
 * Conversational runtime extending MDSRuntime
 *
 * Purpose: Handle human-companion conversations with:
 * - MDM dialogue → LLM fallback pipeline
 * - Memory recording (interaction memories)
 * - Name extraction (v6.6 feature)
 * - Field spawning (syncMoment, longingField)
 * - Growth tracking (vocabulary, maturity)
 *
 * Architecture:
 * - Extends MDSRuntime (generic orchestration)
 * - Domain-specific: conversation, memory, growth
 * - Event-driven: emits message, growth, field events
 */

import { MDSRuntime, type RuntimeConfig, type AnalyticsData } from './runtime/MDSRuntime'
import {
  Entity,
  type EmotionalState,
  type Memory,
  type LexiconEntry,
  type Relationship,
  createMemoryLog,
  TrustSystem,
  MemoryConsolidation,
  createRelationship,
  relationshipStrength
} from '@v1b3x0r/mds-core'
import { mapTextToPAD } from '@v1b3x0r/mds-core'
import { ContextAnalyzer } from './session/ContextAnalyzer'
import { MemoryPromptBuilder } from './session/MemoryPromptBuilder'
import { GrowthTracker } from './session/GrowthTracker'
import { CompanionLoader } from './session/CompanionLoader'
import { EchoSystem } from './runtime/EchoSystem'
import { KeywordExtractor } from './utils/KeywordExtractor'
import { TextSimilarity } from './utils/TextSimilarity'
import { PatternSynthesizer } from './runtime/PatternSynthesizer'
import { MonologueEngine } from './runtime/MonologueEngine'
import { WorldRecorder } from './runtime/WorldRecorder'
import { SalienceDetector } from './utils/SalienceDetector'
import { ExtendedSensors } from './sensors/ExtendedSensors'

type MemoryWithKeywords = Memory & {
  keywords?: string[]
  content?: Record<string, unknown>
}

type MemoryWithConfidence = MemoryWithKeywords & { confidence: number }

type CompanionRelationship = Relationship & {
  formationTime?: number
}

/**
 * Chat-specific configuration
 */
export interface ChatRuntimeConfig extends Omit<RuntimeConfig, 'entities'> {
  // Companion selection
  companion: {
    name?: string  // Specific companion (e.g., 'hi_introvert'), or random if undefined
    material?: any // Direct material override
  }

  // User entity
  user?: {
    name?: string
    material?: any
  }

  // Growth tracking
  growth?: {
    enabled?: boolean
  }

  // Debug mode
  silentMode?: boolean
}

/**
 * Message response structure
 */
export interface MessageResponse {
  name: string
  response: string
  emotion: EmotionalState
  previousValence: number
  metadata?: {
    usedMDM?: boolean
    memoryCount?: number
    newConcepts?: string[]
  }
}

/**
 * Chat Runtime
 * Conversational layer on top of MDSRuntime
 */
export class ChatRuntime extends MDSRuntime {
  // User and companion entities
  user!: Entity
  companion!: Entity

  // Chat-specific helpers
  private contextAnalyzer: ContextAnalyzer
  private promptBuilder: MemoryPromptBuilder
  private growthTracker: GrowthTracker
  private companionLoader: CompanionLoader
  private echoSystem: EchoSystem
  private synthesizer: PatternSynthesizer

  // Tracking
  private conversationCount: number = 0
  private lastMessageTime: number = 0
  private previousValence: number = 0
  private silentMode: boolean

  // WorldMind data (from parent analytics)
  private worldMindCache: any = {}
  private extendedSensors: ExtendedSensors
  private intervals: NodeJS.Timeout[] = []
  private memoryLogs = new Map<string, ReturnType<typeof createMemoryLog>>()
  private trustSystems = new Map<string, TrustSystem>()
  private memoryConsolidation: MemoryConsolidation
  private sessionStart: number = Date.now()
  private monologueEngine!: MonologueEngine
  private worldRecorder!: WorldRecorder
  private lastTranscriptCount: number = 0
  private loggingEnabled: boolean = false
  private monologueEnabled: boolean = true

  constructor(config: ChatRuntimeConfig) {
    // Convert ChatRuntimeConfig → RuntimeConfig
    const companionLoader = new CompanionLoader()
    const companionMetadata = config.companion.material
      ? null
      : companionLoader.getOrDefault(config.companion.name)

    const companionMDM = config.companion.material || companionMetadata?.material
    const userMDM = config.user?.material || { essence: 'Traveler', emotion: { baseline: { valence: 0.5, arousal: 0.5, dominance: 0.5 } } }

    const runtimeConfig: RuntimeConfig = {
      ...config,
      entities: [
        { name: 'user', material: userMDM, x: 100, y: 200 },
        { name: 'companion', material: companionMDM, x: 300, y: 200 }
      ]
    }

    super(runtimeConfig)

    // Get entity references
    const userEntity = this.entities.get('user')
    const companionEntity = this.entities.get('companion')

    if (!userEntity || !companionEntity) {
      throw new Error('ChatRuntime: Failed to spawn user or companion entity')
    }

    this.user = userEntity
    this.companion = companionEntity

    // Enable all features
    this.user.enableAll()
    this.companion.enableAll()

    // Initialize chat helpers
    this.contextAnalyzer = new ContextAnalyzer()
    this.promptBuilder = new MemoryPromptBuilder(this.world)
    this.growthTracker = new GrowthTracker()
    this.companionLoader = companionLoader
    this.echoSystem = new EchoSystem({
      enabled: true,
      echoCount: 1,      // Echo 1 time per phrase (strong rehearsal!)
      minPhraseLength: 3
    })
    this.synthesizer = new PatternSynthesizer({
      minPatternFrequency: 2,   // Pattern must appear 2+ times
      maxFragmentLength: 5,     // Max 5 words per fragment
      creativityBias: 0.3,      // 70% exploitation, 30% exploration
      emotionWeight: 0.5        // Balance keyword + emotion matching
    })

    // Silent mode (disable debug output for TUI)
    this.silentMode = config.silentMode ?? false

    // Subscribe to analytics for WorldMind caching
    this.on('analytics', (data: AnalyticsData) => {
      this.worldMindCache = data.worldMind
      if (this.loggingEnabled && this.worldRecorder) {
        this.worldRecorder.logAnalytics(data)
      }
    })

    // Initial valence
    this.previousValence = this.companion.emotion?.valence ?? 0.5
    this.extendedSensors = new ExtendedSensors()
    this.memoryConsolidation = new MemoryConsolidation({
      similarityThreshold: 0.7,
      forgettingRate: 0.001,
      consolidationInterval: 45000
    })
    this.sessionStart = Date.now()
    this.initializeEntitySystems()
    this.setupCognitiveLink()
    this.initializeCompanionSkills()

    // Initialize Monologue + Recorder before loops
    this.monologueEngine = new MonologueEngine({
      world: this.world,
      companion: this.companion,
      getEmotion: () => ({
        valence: this.companion.emotion?.valence ?? 0,
        arousal: this.companion.emotion?.arousal ?? 0
      }),
      getMemories: () => this.companion.memory?.memories ?? []
    })
    this.worldRecorder = new WorldRecorder({ path: 'sessions/world.log.ndjson', enabled: true })

    this.setupSupportLoops()

    this.debug('ChatRuntime initialized')
    this.debug(`  User: ${this.user.id}`)
    this.debug(`  Companion: ${this.companion.id} (${config.companion.name || 'random'})`)
  }

  private initializeEntitySystems(): void {
    for (const entity of this.entities.values()) {
      const entityId = entity.id
      if (!entityId) continue

      if (!this.memoryLogs.has(entityId)) {
        this.memoryLogs.set(entityId, createMemoryLog(entityId))
      }

      if (!this.trustSystems.has(entityId)) {
        const trust = new TrustSystem({
          initialTrust: 0.5,
          trustThreshold: 0.6
        })
        trust.setSharePolicy('emotion', 'public')
        trust.setSharePolicy('memory', 'trust')
        this.trustSystems.set(entityId, trust)
      }
    }
  }

  private setupCognitiveLink(): void {
    if (typeof this.companion.connectTo === 'function') {
      try {
        this.companion.connectTo(this.user, {
          strength: 0.7,
          bidirectional: true
        })
        this.debug('[Cognition] Companion connected to traveler')
      } catch (error) {
        this.debug(`[Cognition] Failed to establish link: ${String(error)}`)
      }
    }
  }

  private initializeCompanionSkills(): void {
    const skills = this.companion.skills as any
    if (!skills || typeof skills.addSkill !== 'function') return

    const ensureSkill = (name: string, config: Record<string, any>) => {
      if (typeof skills.hasSkill === 'function' && skills.hasSkill(name)) return
      skills.addSkill(name, config)
    }

    ensureSkill('conversation', {
      proficiency: 0.3,
      learningRate: 0.15,
      decayRate: 0.002
    })

    ensureSkill('creativity', {
      proficiency: 0.5,
      learningRate: 0.2,
      decayRate: 0.001
    })

    ensureSkill('empathy', {
      proficiency: 0.4,
      learningRate: 0.1,
      decayRate: 0.0015,
      relatedSkills: ['conversation']
    })

    ensureSkill('learning', {
      proficiency: 0.6,
      learningRate: 0.25,
      decayRate: 0.0005
    })
  }

  private setupSupportLoops(): void {
    if (this.intervals.length > 0) return

    const timeInterval = setInterval(() => {
      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()

      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'night'
      if (hour >= 5 && hour < 12) timeOfDay = 'morning'
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening'

      this.world.broadcastEvent('time_update', {
        hour,
        minute,
        timeOfDay,
        timestamp: now.toISOString()
      })
    }, 30000)
    this.intervals.push(timeInterval)

    const durationInterval = setInterval(() => {
      const minutes = Math.floor((Date.now() - this.sessionStart) / 60000)
      if (minutes <= 0) return

      this.world.broadcastEvent('session_duration', {
        minutes,
        duration: Date.now() - this.sessionStart
      })
    }, 300000)
    this.intervals.push(durationInterval)

    const longingInterval = setInterval(() => {
      this.handleLongingField()
    }, 120000)
    this.intervals.push(longingInterval)

    const extendedInterval = setInterval(() => {
      const metrics = this.extendedSensors.getAllMetrics()

      this.world.broadcastContext({
        'network.connected': metrics.network.connected ? 1 : 0,
        'network.interfaceCount': metrics.network.interfaceCount,
        'network.hasIPv6': metrics.network.hasIPv6 ? 1 : 0,
        'network.latency': metrics.network.latency || 0,
        'storage.totalGB': metrics.storage.totalGB,
        'storage.freeGB': metrics.storage.freeGB,
        'storage.usagePercent': metrics.storage.usagePercent,
        'circadian.phase': metrics.circadian,
        'circadian.isDawn': metrics.circadian === 'dawn' ? 1 : 0,
        'circadian.isMorning': metrics.circadian === 'morning' ? 1 : 0,
        'circadian.isNoon': metrics.circadian === 'noon' ? 1 : 0,
        'circadian.isAfternoon': metrics.circadian === 'afternoon' ? 1 : 0,
        'circadian.isDusk': metrics.circadian === 'dusk' ? 1 : 0,
        'circadian.isEvening': metrics.circadian === 'evening' ? 1 : 0,
        'circadian.isNight': metrics.circadian === 'night' ? 1 : 0,
        'screen.brightness': metrics.brightness,
        'system.processCount': metrics.processCount,
        'git.inRepo': metrics.git.inRepo ? 1 : 0,
        'git.diffLines': metrics.git.diffLines,
        'git.stagedLines': metrics.git.stagedLines,
        'git.hasChanges': metrics.git.hasChanges ? 1 : 0
      })

      this.emit('extended-sensors', metrics)
    }, 30000)
    this.intervals.push(extendedInterval)

    const memoryInterval = setInterval(() => {
      this.runMemoryConsolidation()
    }, 60000)
    this.intervals.push(memoryInterval)

    // Idle monologue + transcript flush to log
    const monologueInterval = setInterval(() => {
      // 1) monologue
      if (this.monologueEnabled && this.monologueEngine) {
        const spoke = this.monologueEngine.maybeSpeak(Date.now(), this.lastMessageTime)
        if (spoke) this.emit('monologue', { speaker: this.companion.id })
      }

      // 2) transcript → log
      if (this.loggingEnabled && this.worldRecorder) {
        const count = this.world.transcript?.count ?? 0
        if (count > this.lastTranscriptCount) {
          const news = this.world.transcript?.getAll().slice(this.lastTranscriptCount) ?? []
          for (const utt of news) {
            this.worldRecorder.logUtterance(utt.speaker, utt.text, utt.listener, utt.emotion)
          }
          this.lastTranscriptCount = count
        }
      }
    }, 10000)
    this.intervals.push(monologueInterval)
  }

  private handleLongingField(): void {
    const relationship = this.companion.relationships?.get(this.user.id) as CompanionRelationship | undefined
    if (!relationship) return

    const lastInteraction = relationship.lastInteraction ?? relationship.formationTime ?? 0
    const elapsed = Date.now() - lastInteraction

    const bondStrength = relationshipStrength(relationship)
    if (bondStrength < 0.6 || elapsed < 120000) return

    if (typeof this.world.spawnField === 'function') {
      const centerX = (this.companion.x + this.user.x) / 2
      const centerY = (this.companion.y + this.user.y) / 2

      try {
        this.world.spawnField(
          {
            essence: 'Quiet longing',
            radius: 150,
            strength: Math.min(1, bondStrength),
            duration: 8,
            type: 'longing'
          } as any,
          centerX,
          centerY
        )
      } catch (error) {
        this.debug(`[Field] Failed to spawn longing field: ${String(error)}`)
      }
    }

    this.emit('field', {
      type: 'longing',
      source: this.companion.id,
      target: this.user.id,
      elapsed
    })
  }

  private runMemoryConsolidation(): void {
    const memories = this.companion.memory?.memories as any[] | undefined
    if (!memories || memories.length === 0) return

    const consolidated = this.memoryConsolidation.consolidate(memories) as any[]
    if (consolidated.length > 0) {
      const weakMemories = memories
        .map((memory: any, index: number) => ({ memory, index }))
        .filter((item: { memory: any; index: number }) => (item.memory?.salience ?? 0) < 0.3)
        .sort(
          (a: { memory: any }, b: { memory: any }) =>
            (a.memory?.salience ?? 0) - (b.memory?.salience ?? 0)
        )

      const replacements = Math.min(consolidated.length, weakMemories.length)
      for (let i = 0; i < replacements; i++) {
        const strong = consolidated[i] as any
        const targetIndex = weakMemories[i].index

        memories[targetIndex] = {
          type: strong.type,
          subject: strong.subject,
          content: strong.content,
          salience: strong.salience,
          timestamp: strong.lastRehearsal
        }
      }

      this.emit('memory-consolidation', {
        entity: this.companion.id,
        count: consolidated.length,
        replacements
      })
    }

    this.memoryConsolidation.applyForgetting(60)

    for (const trust of this.trustSystems.values()) {
      trust.decayTrust(60)
    }
  }

  /**
   * Debug logging (respects silentMode)
   */
  private debug(...args: any[]): void {
    if (!this.silentMode) {
      console.log(...args)
    }
  }

  /**
   * Send message to companion
   * Main conversation method
   */
  async sendMessage(message: string): Promise<MessageResponse> {
    this.debug(`\n[Message] "${message}"`)

    // 1. Broadcast context (user message + silence duration)
    const now = Date.now()
    const silenceDuration = this.lastMessageTime ? (now - this.lastMessageTime) / 1000 : 0

    const semantic = mapTextToPAD(message, {
      scale: 1,
      diminishing: 0.6,
      cap: { valence: 0.18, arousal: 0.18, dominance: 0.12 }
    })

    const contextPayload: Record<string, any> = {
      'user.message': message,
      'user.silence': silenceDuration,
      'semantic.source': this.user.id
    }

    if (Math.abs(semantic.delta.valence) > 0) {
      contextPayload['emotion.delta.valence'] = semantic.delta.valence
    }
    if (Math.abs(semantic.delta.arousal) > 0) {
      contextPayload['emotion.delta.arousal'] = semantic.delta.arousal
    }
    if (Math.abs(semantic.delta.dominance) > 0) {
      contextPayload['emotion.delta.dominance'] = semantic.delta.dominance
    }
    if (semantic.tags.length > 0) {
      contextPayload['semantic.tags'] = semantic.tags
    }

    this.world.broadcastContext(contextPayload)

    // Log user utterance immediately
    if (this.loggingEnabled && this.worldRecorder) {
      this.worldRecorder.logUtterance(this.user.id, message, undefined, this.user.emotion)
    }

    this.lastMessageTime = now

    // 2. Record user's speech (for linguistics/crystallization)
    this.world.recordSpeech(this.user, message)

    // 3. Analyze context (from companion's perspective)
    const context = this.contextAnalyzer.analyzeIntent(message, this.companion)

    // 4. Broadcast emotion hint (for MDM triggers)
    if (context.emotionHint) {
      this.world.broadcastContext({
        'context.valence': context.emotionHint.valence,
        'context.arousal': context.emotionHint.arousal,
        'user.intent': context.intent
      })
    }

    // 5. User remembers own message
    if (this.user.memory) {
      this.user.remember({
        type: 'interaction',
        subject: 'companion',
        content: { message, intent: context.intent },
        timestamp: now,
        salience: 0.7
      })
    }

    // 6. Companion remembers user's message (DYNAMIC SALIENCE - v7.0)
    // Use physics-based salience detection instead of hardcoded values
    const keywords = KeywordExtractor.extract(message, 10)

    // Build known concepts set for novelty detection
    const knownConcepts = new Set<string>()
    this.companion.memory?.memories?.forEach((memory: MemoryWithKeywords) => {
      memory.keywords?.forEach((keyword: string) => knownConcepts.add(keyword))
    })

    // Detect salience (info-physics!)
    const salienceResult = SalienceDetector.detect(message, {
      knownConcepts,
      currentEmotion: this.companion.emotion
    })

    this.debug(`  [Salience] ${salienceResult.salience.toFixed(2)} - ${salienceResult.reasoning}`)

    // Check for duplicate (novelty detection)
    const existingMemory = this.companion.memory?.findSimilar(
      { text: message },
      0.9  // 90% similarity threshold
    )

    if (existingMemory) {
      // Boost existing memory instead of creating duplicate
      this.companion.memory?.boostSalience(existingMemory, 0.2)
      this.debug(`  [Memory] Duplicate detected, boosted salience: ${existingMemory.salience.toFixed(2)}`)
    } else {
      // Create new memory with DYNAMIC salience (not hardcoded!)
      this.companion.remember({
        type: 'interaction',
        subject: 'user',
        content: { message, text: message, intent: context.intent, keywords },
        timestamp: now,
        salience: salienceResult.salience  // Physics-based! (0-2)
      })
      this.debug(`  [Memory] New memory created (salience: ${salienceResult.salience.toFixed(2)}) with keywords: ${keywords.slice(0, 3).join(', ')}`)
    }

    // 7. Extract names from message (v6.6 feature)
    this.extractNames(message)

    // 8. Form/reinforce relationship (not cognitive link - that's P2P feature)
    // Use the relationships system directly
    if (this.companion.relationships) {
      const existing = this.companion.relationships.get(this.user.id) as CompanionRelationship | undefined
      if (existing) {
        existing.trust = Math.min(1, existing.trust + 0.05)
        existing.familiarity = Math.min(1, (existing.familiarity ?? 0) + 0.05)
        existing.interactionCount = (existing.interactionCount ?? 0) + 1
        existing.lastInteraction = now
      } else {
        const relationship = createRelationship(0.6, 0.5) as CompanionRelationship
        relationship.lastInteraction = now
        relationship.interactionCount = 1
        relationship.formationTime = now
        this.companion.relationships.set(this.user.id, relationship)
      }
    }

    // 9. Get response from companion (MDM → Pattern Synthesis → LLM fallback)
    // Let physics determine response - no hardcoded acknowledgments
    let response = await this.getCompanionResponse(message, context)

    // 10. Companion remembers own response (also check for duplicate)
    const responseDupe = this.companion.memory?.findSimilar({ text: response }, 0.9)
    if (!responseDupe) {
      this.companion.remember({
        type: 'interaction',
        subject: 'self',
        content: { response, text: response, keywords: KeywordExtractor.extract(response, 5) },
        timestamp: now,
        salience: 0.4
      })
    }

    // 11. Record companion's speech
    this.world.recordSpeech(this.companion, response)
    if (this.loggingEnabled && this.worldRecorder) {
      this.worldRecorder.logUtterance(this.companion.id, response, this.user.id, this.companion.emotion)
    }

    // 11.5. Echo system - Inner voice rehearsal (เสียงในหัว)
    // Companion mentally repeats key phrases to strengthen learning
    // This accelerates proto-language emergence by increasing phrase frequency
    const phrases = this.echoSystem.extractPhrases(
      message,
      response,
      this.companion.emotion
    )

    const echoedPhrases = await this.echoSystem.rehearse(phrases)

    // Record echoes to world transcript (contributes to world.lexicon)
    for (const phrase of echoedPhrases) {
      this.world.recordSpeech(this.companion, phrase)
    }

    this.debug(`  [Echo] Rehearsed ${echoedPhrases.length} phrases internally`)

    // NO FORCED TICKING - let world tick naturally via autoTick
    // Proto-language will emerge when physics is ready

    // 12. Q-learning (emotion-based reward)
    const companionEmotion = this.companion.emotion ?? { valence: 0, arousal: 0, dominance: 0 }
    const emotionDelta = companionEmotion.valence - this.previousValence
    if (Math.abs(emotionDelta) > 0.1 && this.companion.learning) {
      this.companion.learning.addExperience({
        timestamp: now,
        action: 'respond',
        context: { intent: context.intent },
        outcome: emotionDelta > 0 ? 'positive' : 'negative',
        reward: emotionDelta,
        success: emotionDelta > 0
      })
    }

    // 13. Update growth tracker
    this.conversationCount++
    this.updateGrowth(context)

    // 14. Update previous valence
    const previousValence = this.previousValence
    this.previousValence = companionEmotion.valence

    // 15. Check for sync moment (emotional alignment)
    this.checkSyncMoment()

    // 16. Emit message event
    this.emit('message', {
      message,
      response,
      emotion: { ...companionEmotion },
      conversationCount: this.conversationCount
    })

    return {
      name: 'companion',
      response,
      emotion: { ...companionEmotion },
      previousValence,
      metadata: {
        memoryCount: this.companion.memory?.memories?.length || 0,
        newConcepts: context.keywords.filter(k => k.length > 3)
      }
    }
  }

  /**
   * Get companion response (MDM dialogue → Pattern Synthesis → LLM fallback)
   * v6.9: Added PatternSynthesizer for natural emergence
   */
  private async getCompanionResponse(
    userMessage: string,
    context: ReturnType<ContextAnalyzer['analyzeIntent']>
  ): Promise<string> {
    // SPECIAL CASE: Name queries bypass MDM dialogue (physics priority!)
    // "ชื่อผมอะไร?" should ALWAYS check memory first
    const isNameQuery = /ชื่อ.*อะไร|what.*name|who am i|ชื่อ.*ใคร/i.test(userMessage)

    if (isNameQuery) {
      this.debug('  [Response] Name query detected - checking memory')

      // Search all memories for name-type
      const allMemories = (this.companion.memory?.memories || []) as MemoryWithKeywords[]
      const nameMemory = allMemories.find((memory: MemoryWithKeywords) => {
        const content = memory.content as { type?: string; owner?: string } | undefined
        return content?.type === 'name' && content?.owner === 'user'
      })

      const nameMemoryCount = allMemories.filter((memory: MemoryWithKeywords) => {
        const content = memory.content as { type?: string } | undefined
        return content?.type === 'name'
      }).length

      this.debug(`  [Name Search] Found ${nameMemoryCount} name memories`)

      const nameContent = nameMemory?.content as { name?: string } | undefined

      if (nameContent?.name) {
        const name = nameContent.name
        this.debug(`  [Name Retrieved] ${name}`)
        const responses = [
          `ชื่อคุณ ${name} นะ`,
          `${name} ใช่ไหม?`,
          `คุณบอกว่าชื่อ ${name}`,
          `จำได้ ชื่อ ${name}`
        ]
        return responses[Math.floor(Math.random() * responses.length)]
      } else {
        this.debug(`  [Name Search] No name memory found`)
      }
    }

    // Try MDM dialogue
    const mdmResponse = this.companion.speak?.(context.intent)

    if (mdmResponse && !isNameQuery) {  // Don't use MDM for name queries
      this.debug('  [Response] MDM dialogue')
      return mdmResponse
    }

    // v6.8: Extract keywords from user message for semantic retrieval
    const keywords = KeywordExtractor.extract(userMessage, 5)

    // Retrieve relevant memories by topic (not just recent!)
    // Use keyword overlap as a simple proxy for semantic resonance
    const relevantMemories = (this.companion.memory?.recallByTopic?.(keywords, 10) || []) as MemoryWithKeywords[]

    // Calculate confidence for each memory (salience × recency × resonance)
    const now = this.companion.age
    const memoriesWithConfidence = relevantMemories.map((memory: MemoryWithKeywords) => {
      const baseConfidence = this.companion.memory?.calculateConfidence?.(memory, now) ?? 0

      // Resonance factor: keyword overlap score (already in recallByTopic)
      // This acts as a semantic field resonance proxy
      const keywordOverlap = memory.keywords
        ? keywords.filter((kw: string) => memory.keywords!.includes(kw)).length / Math.max(keywords.length, 1)
        : 0

      // Combined confidence: salience × recency × resonance
      const confidence = baseConfidence * (0.7 + keywordOverlap * 0.3)

      return { ...memory, confidence }
    })

    // Filter low-confidence memories (too old/weak)
    const confidentMemories: MemoryWithConfidence[] = memoriesWithConfidence.filter(
      (memory: MemoryWithConfidence) => memory.confidence > 0.3
    )

    this.debug(`  [Memory] Retrieved ${confidentMemories.length}/${relevantMemories.length} confident memories (resonance-weighted)`)

    // If no confident memories about this topic, express uncertainty
    if (relevantMemories.length > 0 && confidentMemories.length === 0) {
      this.debug('  [Response] Low confidence - expressing uncertainty')
      const uncertaintyResponses = [
        'จำไม่ค่อยได้แล้ว...',
        'ไม่แน่ใจนะ...',
        'อาจจะนานไปแล้ว จำเลือนๆ',
        'I\'m not sure...',
        'I don\'t quite remember...'
      ]
      return uncertaintyResponses[Math.floor(Math.random() * uncertaintyResponses.length)]
    }

    // v6.9: Try Pattern Synthesis (learn from transcript)
    // Update patterns from world transcript
    const transcript = this.world.transcript?.getAll() || []
    if (transcript.length > 0) {
      this.synthesizer.extractPatterns(transcript, this.companion.id)
    }

    // Try to synthesize response from learned patterns
    const lexicon = this.world.lexicon ? this.world.lexicon.getAll() : []
    const companionEmotion = this.companion.emotion ?? { valence: 0, arousal: 0 }
    const synthesizedResponse = this.synthesizer.synthesize(
      userMessage,
      {
        valence: companionEmotion.valence,
        arousal: companionEmotion.arousal
      },
      confidentMemories,
      lexicon
    )

    if (synthesizedResponse) {
      const stats = this.synthesizer.getStats()
      this.debug(`  [Response] Pattern synthesis (${stats.totalPatterns} patterns, weight: ${stats.avgWeight.toFixed(2)})`)

      // v6.10: If user is asking about past topics, prefer memory-based response
      const isPastTopicQuery = /จำ|remember|บอก|เคย|told|recall|พูดถึง/.test(userMessage)
      if (isPastTopicQuery && confidentMemories.length > 0) {
        this.debug(`  [Response] Override: Past topic query detected, using memory-based response instead`)
        return this.getFallbackResponse(context, confidentMemories)
      }

      return synthesizedResponse
    }

    // Fallback to LLM (if configured)
    const llmAdapter = (this.world as any).llm
    if (llmAdapter?.generate) {
      this.debug('  [Response] LLM fallback with context')

      // Build prompt with relevant memories (sorted by confidence)
      const promptContext = {
        ...context,
        relevantMemories: confidentMemories
          .slice(0, 5)
          .map(({ confidence: _confidence, ...memory }) => memory as Memory)
      } as ReturnType<ContextAnalyzer['analyzeIntent']>

      const prompt = this.promptBuilder.buildPrompt(
        this.companion,
        userMessage,
        promptContext,
        { maxMemories: 5 }
      )

      try {
        const llmResponse = await llmAdapter.generate(this.companion, prompt)
        if (typeof llmResponse === 'string') {
          return llmResponse
        }
        if (llmResponse?.text) {
          return llmResponse.text
        }
        return String(llmResponse)
      } catch (error) {
        this.debug(`  [Error] LLM failed: ${error}`)
      }
    }

    // Ultimate fallback (with context awareness)
    return this.getFallbackResponse(context, confidentMemories)
  }

  /**
   * Fallback response when no MDM/LLM available
   * v6.8: Enhanced with context-aware responses
   */
  private getFallbackResponse(
    context: ReturnType<ContextAnalyzer['analyzeIntent']>,
    memories: MemoryWithKeywords[] = []
  ): string {
    // Check if question is about past topics (contextual recall test)
    // More comprehensive keyword matching including Thai partial matches
    const messageText = context.keywords.join(' ')
    const isPastTopicQuery =
      /จำ|remember|บอก|เคย|told|recall|พูดถึง/.test(messageText) ||
      context.intent === 'question'

    if (isPastTopicQuery && memories.length > 0) {
      // Extract actual content from memories (not just keywords)
      const memoryContents = memories
        .map((memory: MemoryWithKeywords) => {
          const content = memory.content as { message?: string; text?: string } | undefined
          if (content?.message) return content.message
          if (content?.text) return content.text
          return null
        })
        .filter((value): value is string => Boolean(value))
        .slice(0, 3)

      // If we have actual memory content, reference it
      if (memoryContents.length > 0) {
        const firstMemory = memoryContents[0]
        // Extract key phrases (5-15 chars)
        const phrases = firstMemory.match(/[\u0E00-\u0E7F\w]{5,15}/g) || []
        const keyPhrase = phrases[0] || 'นั่น'

        const contextualResponses = [
          `จำได้นะ เกี่ยวกับ ${keyPhrase}...`,
          `เรื่อง ${keyPhrase} ใช่ไหม?`,
          `คุณเคยพูดถึง ${keyPhrase}`,
          `อ๋อ ${keyPhrase} สินะ`,
        ]
        return contextualResponses[Math.floor(Math.random() * contextualResponses.length)]
      }

      // Fallback: use keywords
      const memoryKeywords = memories
        .flatMap((memory: MemoryWithKeywords) => memory.keywords || [])
        .filter((keyword: string) => keyword.length > 2)  // Skip short keywords
        .slice(0, 3)
        .join(', ')

      if (memoryKeywords) {
        const contextualResponses = [
          `จำได้นะ เกี่ยวกับ ${memoryKeywords}...`,
          `เรื่อง ${memoryKeywords} ใช่ไหม?`,
          `คิดว่าคุณเคยพูดถึง ${memoryKeywords}`,
        ]
        return contextualResponses[Math.floor(Math.random() * contextualResponses.length)]
      }
    }

    // Default fallbacks (more varied and natural)
    const fallbacks = {
      greeting: ['สวัสดี', 'Hi', 'Hello', 'ว่าไง', 'Hey there'],
      question: [
        '...', 'ไม่รู้จะตอบยังไง', 'I\'m not sure',
        'น่าสนใจนะ', 'Interesting question...',
        'ให้คิดหน่อยนะ', 'Let me think...'
      ],
      emotion: [
        'เข้าใจนะ', 'I understand', 'Hmm...',
        'รู้สึกเหมือนกันเลย', 'I feel that too',
        'ฟังดูเหมือนว่า...', 'Sounds like...'
      ],
      default: [
        '...', '🤔', 'ฟังอยู่นะ',
        'บอกต่อได้เลย', 'Tell me more',
        'อืม...', 'Hmm...',
        'เป็นยังไงบ้าง?', 'How are you feeling?'
      ]
    }

    const options = fallbacks[context.intent as keyof typeof fallbacks] || fallbacks.default
    return options[Math.floor(Math.random() * options.length)]
  }

  /**
   * Extract names from message (v6.6 feature)
   */
  private extractNames(message: string): void {
    const namePatterns = [
      { pattern: /(?:ผม|ฉัน|กู)ชื่อ\s*(\S+)/gi, owner: 'user' },  // \s* = optional space
      { pattern: /ชื่อ(?:ผม|ฉัน|กู)\s*(\S+)/gi, owner: 'user' },  // "ชื่อผม X"
      { pattern: /(?:my|our)\s+name\s+is\s+(\w+)/gi, owner: 'user' },
      { pattern: /call\s+me\s+(\w+)/gi, owner: 'user' },
      { pattern: /คุณชื่อ\s*(\S+)/gi, owner: 'companion' },
      { pattern: /your\s+name\s+is\s+(\w+)/gi, owner: 'companion' }
    ]

    for (const { pattern, owner } of namePatterns) {
      const matches = [...message.matchAll(pattern)]
      for (const match of matches) {
        const name = match[1]
        if (name && name.length > 1) {
          this.companion.remember({
            type: 'interaction',
            subject: name,
            content: {
              type: 'name',
              owner,
              name,
              introducedAt: Date.now(),
              keywords: [name, 'ชื่อ', 'name']
            },
            timestamp: Date.now(),
            salience: 1.5  // Names have super-strong field
          })

          this.debug(`  [Name] Extracted: ${name} (owner: ${owner})`)
        }
      }
    }
  }

  /**
   * Update growth tracker
   */
  private updateGrowth(context: ReturnType<ContextAnalyzer['analyzeIntent']>): void {
    const memoryCount = this.companion.memory?.memories?.length || 0
    const emotionHistory = (this.companion.memory?.memories.filter(
      (memory: MemoryWithKeywords) => memory.type === 'emotion'
    ) || []) as MemoryWithKeywords[]

    // Calculate emotional maturity
    const avgValence = emotionHistory.length > 0
      ? emotionHistory.reduce((sum: number, memory: MemoryWithKeywords) => {
        const content = memory.content as { valence?: number } | undefined
        return sum + Math.abs(content?.valence ?? 0)
      }, 0) / emotionHistory.length
      : 0.5

    const emotionStability = 1 - Math.min(1, avgValence)
    const relationship = this.companion.relationships?.get(this.user.id)
    const relationshipStrengthValue = relationship ? relationshipStrength(relationship) : 0

    const emotionalMaturity = Math.min(1, (
      (this.conversationCount / 100) * 0.3 +
      (memoryCount / 500) * 0.2 +
      emotionStability * 0.3 +
      relationshipStrengthValue * 0.2
    ))

    // Get vocabulary from lexicon (if available)
    const topWords = this.world.lexicon?.getRecent(10).map((entry: LexiconEntry) => entry.term) || []
    const vocabularySize = this.world.lexicon?.size || 0

    this.growthTracker.update({
      vocabularySize,
      vocabularyWords: topWords,
      conversationCount: this.conversationCount,
      memoryCount,
      emotionalMaturity
    })

    // Track concepts
    for (const keyword of context.keywords) {
      if (keyword.length > 3) {
        this.growthTracker.learnConcept(keyword)
      }
    }
  }

  /**
   * Check for emotional alignment → spawn sync moment field
   */
  private checkSyncMoment(): void {
    if (!this.user.emotion || !this.companion.emotion) return

    const valenceDiff = Math.abs(this.companion.emotion.valence - this.user.emotion.valence)
    const arousalDiff = Math.abs(this.companion.emotion.arousal - this.user.emotion.arousal)
    const alignment = 1 - (valenceDiff + arousalDiff) / 2

    if (alignment > 0.6) {
      this.debug(`  [Field] Sync moment detected (alignment: ${alignment.toFixed(2)})`)

      // Spawn resonance field (if world supports it)
      if (this.world.spawnField) {
        const centerX = (this.user.x + this.companion.x) / 2
        const centerY = (this.user.y + this.companion.y) / 2
        this.world.spawnField(
          {
            essence: 'Moment of connection',
            radius: 50,
            strength: alignment,
            duration: 10,
            type: 'resonance'
          } as any,
          centerX,
          centerY
        )
      }

      const companionId = this.companion.id
      const userId = this.user.id
      const companionTrust = companionId ? this.trustSystems.get(companionId) : undefined
      const userTrust = userId ? this.trustSystems.get(userId) : undefined

      if (companionTrust && userTrust) {
        const trustDelta = alignment * 0.15
        companionTrust.updateTrust(userId, trustDelta)
        userTrust.updateTrust(companionId, trustDelta)
      }

      const companionLog = companionId ? this.memoryLogs.get(companionId) : undefined
      const userLog = userId ? this.memoryLogs.get(userId) : undefined

      if (
        companionLog &&
        userLog &&
        companionTrust?.shouldShare('memory', userId) &&
        userTrust?.shouldShare('memory', companionId)
      ) {
        if (this.companion.memory?.memories) {
          for (const mem of this.companion.memory.memories.slice(-5)) {
            companionLog.append(mem)
          }
        }
        if (this.user.memory?.memories) {
          for (const mem of this.user.memory.memories.slice(-5)) {
            userLog.append(mem)
          }
        }

        const companionMerge = companionLog.merge(userLog)
        const userMerge = userLog.merge(companionLog)

        if (companionMerge.added > 0 || userMerge.added > 0) {
          this.emit('memory-sync', {
            source: this.companion.id,
            target: this.user.id,
            alignment,
            added: {
              companion: companionMerge.added,
              user: userMerge.added
            }
          })
        }
      } else if (companionTrust && userTrust) {
        this.emit('trust-blocked', {
          source: this.companion.id,
          target: this.user.id,
          companionTrust: companionTrust.getTrust(userId),
          userTrust: userTrust.getTrust(companionId)
        })
      }

      this.emit('sync-moment', { alignment, entities: ['user', 'companion'] })
    }
  }

  /**
   * Get growth metrics
   */
  getGrowth() {
    const metrics = this.growthTracker.getMetrics()

    // Get vocabulary words from lexicon
    const vocabularyWords = this.world.lexicon
      ? Array.from(this.world.lexicon as unknown as Iterable<[string, number]>)
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))  // Sort by frequency
          .map(([word]) => word)
      : []

    return {
      conversationCount: this.conversationCount,
      vocabularySize: this.world.lexicon?.size || 0,
      vocabularyWords,
      memoryCount: this.companion.memory?.memories?.length || 0,
      totalMemories: this.companion.memory?.memories?.length || 0,
      maturity: metrics.emotionalMaturity || 0,
      concepts: metrics.conceptsLearned || []
    }
  }

  getTrustSnapshot(): Array<{ target: string; trust: number; interactions: number }> {
    const trustSystem = this.trustSystems.get(this.companion.id)
    if (!trustSystem) return []

    return trustSystem.getAllTrust().map((entry: any) => ({
      target: this.findEntityName(entry.entityId) ?? entry.entityId,
      trust: Number((entry.trust ?? 0).toFixed(2)),
      interactions: entry.interactions ?? 0
    }))
  }

  private findEntityName(entityId: string): string | undefined {
    for (const [name, entity] of this.entities.entries()) {
      if (entity.id === entityId) {
        return name
      }
    }
    return undefined
  }

  stop(): void {
    this.destroy()
  }

  destroy(): void {
    for (const interval of this.intervals) {
      clearInterval(interval)
    }
    this.intervals = []
    super.destroy()
  }

  // ---------------- Public toggles & helpers ----------------
  toggleMonologue(): boolean {
    this.monologueEnabled = !this.monologueEnabled
    this.debug(`[Monologue] ${this.monologueEnabled ? 'on' : 'off'}`)
    return this.monologueEnabled
  }

  isMonologueEnabled(): boolean { return this.monologueEnabled }

  toggleLogging(): boolean {
    this.loggingEnabled = !this.loggingEnabled
    this.debug(`[Logging] ${this.loggingEnabled ? 'on' : 'off'}`)
    if (!this.loggingEnabled) {
      this.lastTranscriptCount = this.world.transcript?.count ?? 0
    }
    return this.loggingEnabled
  }

  isLogging(): boolean { return this.loggingEnabled }

  tailLog(count = 20): string[] {
    return this.worldRecorder ? this.worldRecorder.tail(count) : []
  }
}
