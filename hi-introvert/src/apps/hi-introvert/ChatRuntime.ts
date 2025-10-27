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

import { MDSRuntime, type RuntimeConfig, type AnalyticsData } from '../../runtime/MDSRuntime'
import { Entity, type EmotionalState } from '@v1b3x0r/mds-core'
import { ContextAnalyzer } from '../../session/ContextAnalyzer'
import { MemoryPromptBuilder } from '../../session/MemoryPromptBuilder'
import { GrowthTracker } from '../../session/GrowthTracker'
import { CompanionLoader } from '../../session/CompanionLoader'
import { EchoSystem } from './EchoSystem'
import { KeywordExtractor } from '../../utils/KeywordExtractor'
import { TextSimilarity } from '../../utils/TextSimilarity'
import { PatternSynthesizer } from '../../runtime/PatternSynthesizer'
import { SalienceDetector } from '../../utils/SalienceDetector'

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
    this.promptBuilder = new MemoryPromptBuilder()
    this.growthTracker = new GrowthTracker()
    this.companionLoader = companionLoader
    this.echoSystem = new EchoSystem({
      enabled: true,
      echoCount: 5,      // Echo 5 times per phrase (strong rehearsal!)
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
    })

    // Initial valence
    this.previousValence = this.companion.emotion?.valence ?? 0.5

    this.debug('ChatRuntime initialized')
    this.debug(`  User: ${this.user.id}`)
    this.debug(`  Companion: ${this.companion.id} (${config.companion.name || 'random'})`)
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

    this.world.broadcastContext({
      'user.message': message,
      'user.silence': silenceDuration
    })

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
    this.companion.memory?.memories?.forEach(m => {
      m.keywords?.forEach(kw => knownConcepts.add(kw))
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
        content: { message, text: message, intent: context.intent },
        timestamp: now,
        salience: salienceResult.salience,  // Physics-based! (0-2)
        keywords  // Topic tags for semantic retrieval
      })
      this.debug(`  [Memory] New memory created (salience: ${salienceResult.salience.toFixed(2)}) with keywords: ${keywords.slice(0, 3).join(', ')}`)
    }

    // 7. Extract names from message (v6.6 feature)
    this.extractNames(message)

    // 8. Form/reinforce relationship (not cognitive link - that's P2P feature)
    // Use the relationships system directly
    if (this.companion.relationships) {
      const existing = this.companion.relationships.get(this.user.id)
      if (existing) {
        // Strengthen existing relationship
        existing.strength = Math.min(1.0, existing.strength + 0.05)
        existing.interactionCount++
      } else {
        // Create new relationship
        this.companion.relationships.set(this.user.id, {
          targetId: this.user.id,
          strength: 0.7,
          interactionCount: 1,
          lastInteraction: now,
          formationTime: now
        })
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
        content: { response, text: response },
        timestamp: now,
        salience: 0.4,
        keywords: KeywordExtractor.extract(response, 5)
      })
    }

    // 11. Record companion's speech
    this.world.recordSpeech(this.companion, response)

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
    const emotionDelta = this.companion.emotion.valence - this.previousValence
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
    this.previousValence = this.companion.emotion.valence

    // 15. Check for sync moment (emotional alignment)
    this.checkSyncMoment()

    // 16. Emit message event
    this.emit('message', {
      message,
      response,
      emotion: { ...this.companion.emotion },
      conversationCount: this.conversationCount
    })

    return {
      name: 'companion',
      response,
      emotion: { ...this.companion.emotion },
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
      const allMemories = this.companion.memory?.memories || []
      const nameMemory = allMemories.find(m => m.content?.type === 'name' && m.content?.owner === 'user')

      this.debug(`  [Name Search] Found ${allMemories.filter(m => m.content?.type === 'name').length} name memories`)

      if (nameMemory && nameMemory.content?.name) {
        const name = nameMemory.content.name
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
    const relevantMemories = this.companion.memory?.recallByTopic(keywords, 10) || []

    // Calculate confidence for each memory (salience × recency × resonance)
    const now = this.companion.age
    const memoriesWithConfidence = relevantMemories.map(m => {
      const baseConfidence = this.companion.memory?.calculateConfidence(m, now) || 0

      // Resonance factor: keyword overlap score (already in recallByTopic)
      // This acts as a semantic field resonance proxy
      const keywordOverlap = m.keywords
        ? keywords.filter(kw => m.keywords!.includes(kw)).length / Math.max(keywords.length, 1)
        : 0

      // Combined confidence: salience × recency × resonance
      const confidence = baseConfidence * (0.7 + keywordOverlap * 0.3)

      return { ...m, confidence }
    })

    // Filter low-confidence memories (too old/weak)
    const confidentMemories = memoriesWithConfidence.filter(m => m.confidence > 0.3)

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
    const synthesizedResponse = this.synthesizer.synthesize(
      userMessage,
      {
        valence: this.companion.emotion.valence,
        arousal: this.companion.emotion.arousal
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
    if (this.world.llm) {
      this.debug('  [Response] LLM fallback with context')

      // Build prompt with relevant memories (sorted by confidence)
      const prompt = this.promptBuilder.buildPrompt({
        message: userMessage,
        memories: confidentMemories.slice(0, 5),  // Top 5 most confident
        emotion: this.companion.emotion,
        context: keywords.join(', ')
      })

      try {
        const llmResponse = await this.world.llm.generate(this.companion, prompt)
        return llmResponse
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
    memories: any[] = []
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
        .map(m => {
          if (m.content?.message) return m.content.message
          if (m.content?.text) return m.content.text
          return null
        })
        .filter(Boolean)
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
        .flatMap(m => m.keywords || [])
        .filter(kw => kw.length > 2)  // Skip short keywords
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
            content: { type: 'name', owner, name, introducedAt: Date.now() },
            timestamp: Date.now(),
            salience: 1.5,  // Names have super-strong field
            keywords: [name, 'ชื่อ', 'name']  // Tag with name + name-related keywords
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
    const emotionHistory = this.companion.memory?.memories.filter(m => m.type === 'emotion') || []

    // Calculate emotional maturity
    const avgValence = emotionHistory.length > 0
      ? emotionHistory.reduce((sum, m) => sum + Math.abs((m.content as any).valence || 0), 0) / emotionHistory.length
      : 0.5

    const emotionStability = 1 - Math.min(1, avgValence)
    const relationshipStrength = this.companion.relationships?.get(this.user.id)?.strength || 0

    const emotionalMaturity = Math.min(1, (
      (this.conversationCount / 100) * 0.3 +
      (memoryCount / 500) * 0.2 +
      emotionStability * 0.3 +
      relationshipStrength * 0.2
    ))

    // Get vocabulary from lexicon (if available)
    const topWords = this.world.lexicon?.getRecent(10).map(e => e.term) || []
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
        this.world.spawnField({
          essence: 'Moment of connection',
          x: (this.user.x + this.companion.x) / 2,
          y: (this.user.y + this.companion.y) / 2,
          radius: 50,
          strength: alignment,
          duration: 10,
          type: 'resonance'
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
      ? Array.from(this.world.lexicon)
          .sort((a, b) => b[1] - a[1])  // Sort by frequency
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

  /**
   * Debug logging
   */
  private debug(message: string): void {
    if (!this.silentMode) {
      console.log(message)
    }
  }
}
