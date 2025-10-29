/**
 * Hi-Introvert: Context Analyzer
 *
 * Analyzes user message to find relevant memories and understand intent
 * Design: Help entity respond contextually (not just emotionally)
 */

import type { Entity } from '@v1b3x0r/mds-core'
import type { Memory } from '@v1b3x0r/mds-core'

/**
 * User intent types
 */
export type UserIntent =
  | 'question'       // User asks something
  | 'statement'      // User states a fact
  | 'greeting'       // User greets
  | 'emotion'        // User expresses emotion
  | 'teaching'       // User teaches something new
  | 'farewell'       // User says goodbye
  | 'praise'         // User praises entity
  | 'criticism'      // User criticizes entity

/**
 * Context analysis result
 */
export interface ContextAnalysis {
  intent: UserIntent
  context: string
  relevantMemories: Memory[]
  keywords: string[]
  emotionHint?: {
    valence: number   // Expected emotional reaction (-1 to 1)
    arousal: number   // Expected energy level (0 to 1)
  }
}

/**
 * Context Analyzer
 *
 * Analyzes user message to provide context for entity response
 */
export class ContextAnalyzer {
  /**
   * Analyze user message
   *
   * @param message - User input
   * @param entity - Entity that will respond
   * @returns Context analysis
   */
  analyzeIntent(message: string, entity: Entity): ContextAnalysis {
    const normalized = message.toLowerCase().trim()

    // Detect intent
    const intent = this.detectIntent(normalized)

    // Extract keywords
    const keywords = this.extractKeywords(normalized)

    // Find relevant memories
    const relevantMemories = this.findRelevantMemories(entity, keywords)

    // Build context string
    const context = this.buildContext(intent, keywords, relevantMemories)

    // Estimate emotion hint
    const emotionHint = this.estimateEmotionHint(intent, normalized)

    return {
      intent,
      context,
      relevantMemories,
      keywords,
      emotionHint
    }
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): UserIntent {
    // Greeting patterns
    if (/^(hi|hello|hey|sup|สวัสดี|หวัดดี|ว่าไง)/.test(message)) {
      return 'greeting'
    }

    // Farewell patterns
    if (/(bye|goodbye|see you|later|ไปละ|บาย|ไปก่อน)/.test(message)) {
      return 'farewell'
    }

    // Question patterns
    if (
      message.includes('?') ||
      /^(what|why|how|when|where|who|อะไร|ทำไม|ยังไง|เมื่อไหร่|ที่ไหน|ใคร)/.test(message)
    ) {
      return 'question'
    }

    // Praise patterns
    if (/(good|great|awesome|amazing|cool|เก่ง|เจ๋ง|เท่|ดี)/.test(message)) {
      return 'praise'
    }

    // Criticism patterns
    if (/(bad|boring|stupid|wrong|แย่|เบื่อ|โง่|ผิด)/.test(message)) {
      return 'criticism'
    }

    // Emotion expressions
    if (/(feel|felt|happy|sad|angry|scared|รู้สึก|ดีใจ|เศร้า|โกรธ|กลัว)/.test(message)) {
      return 'emotion'
    }

    // Teaching patterns (user explains something)
    if (/(is|means|คือ|หมายความว่า|แปลว่า)/.test(message)) {
      return 'teaching'
    }

    // Default: statement
    return 'statement'
  }

  /**
   * Extract keywords from message
   */
  private extractKeywords(message: string): string[] {
    // Simple tokenization (split by space + punctuation)
    const words = message
      .split(/[\s,!?.;:()\[\]{}]+/)
      .filter(w => w.length > 2)  // Skip very short words
      .map(w => w.toLowerCase())

    // Remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did',
      'ก็', 'ที่', 'เป็น', 'มี', 'ได้', 'แล้ว'
    ])

    return words.filter(w => !stopWords.has(w))
  }

  /**
   * Find relevant memories based on keywords
   */
  private findRelevantMemories(entity: Entity, keywords: string[]): Memory[] {
    if (!entity.memory) return []

    const allMemories = entity.memory.recall()
    const relevant: Array<{ memory: Memory, score: number }> = []

    for (const memory of allMemories) {
      let score = 0

      // Check if memory content contains keywords
      const contentStr = JSON.stringify(memory.content).toLowerCase()
      for (const keyword of keywords) {
        if (contentStr.includes(keyword)) {
          score += 1
        }
      }

      // Check if memory subject matches keywords
      if (keywords.includes(memory.subject.toLowerCase())) {
        score += 2
      }

      // Weight by salience
      score *= memory.salience

      if (score > 0) {
        relevant.push({ memory, score })
      }
    }

    // Sort by score (descending) and return top 5
    return relevant
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => r.memory)
  }

  /**
   * Build context string from analysis
   */
  private buildContext(
    intent: UserIntent,
    keywords: string[],
    memories: Memory[]
  ): string {
    let context = `Intent: ${intent}\n`

    if (keywords.length > 0) {
      context += `Keywords: ${keywords.join(', ')}\n`
    }

    if (memories.length > 0) {
      context += `Relevant memories:\n`
      for (const memory of memories) {
        const contentStr = typeof memory.content === 'string'
          ? memory.content
          : JSON.stringify(memory.content)
        context += `  - ${memory.type} (${memory.subject}): ${contentStr}\n`
      }
    }

    return context
  }

  /**
   * Estimate emotion hint from intent + message
   */
  private estimateEmotionHint(intent: UserIntent, message: string): {
    valence: number
    arousal: number
  } | undefined {
    switch (intent) {
      case 'greeting':
        return { valence: 0.3, arousal: 0.4 }

      case 'praise':
        return { valence: 0.7, arousal: 0.6 }

      case 'criticism':
        return { valence: -0.5, arousal: 0.7 }

      case 'question':
        return { valence: 0.1, arousal: 0.5 }

      case 'emotion':
        // Try to detect emotion from message
        if (/(happy|good|ดี|สนุก)/.test(message)) {
          return { valence: 0.6, arousal: 0.5 }
        } else if (/(sad|bad|เศร้า|แย่)/.test(message)) {
          return { valence: -0.6, arousal: 0.3 }
        } else if (/(angry|โกรธ)/.test(message)) {
          return { valence: -0.5, arousal: 0.8 }
        }
        return { valence: 0.0, arousal: 0.5 }

      case 'farewell':
        return { valence: -0.2, arousal: 0.3 }

      default:
        return undefined
    }
  }
}
