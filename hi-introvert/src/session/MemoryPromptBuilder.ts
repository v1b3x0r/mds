/**
 * Hi-Introvert: Memory Prompt Builder
 *
 * Builds LLM prompts that include:
 * - Entity essence (from MDM) ← Primary personality source
 * - Memory context (relevant memories)
 * - Vocabulary constraints (words entity knows)
 * - Emotion state
 *
 * Design: Essence-first (no hardcoded personality), entity grows naturally
 */

import type { Entity } from '@v1b3x0r/mds-core'
import type { ContextAnalysis } from './ContextAnalyzer'
import type { VocabularyTracker } from '../vocabulary/VocabularyTracker'

/**
 * Prompt building options
 */
export interface PromptOptions {
  includeMemories?: boolean
  includeVocabulary?: boolean
  includeEmotion?: boolean
  maxMemories?: number
}

/**
 * Memory Prompt Builder
 *
 * Generates LLM prompts with entity essence + context
 */
export class MemoryPromptBuilder {
  /**
   * Build LLM prompt from entity state
   *
   * @param entity - Entity that will respond
   * @param userMessage - User input
   * @param contextAnalysis - Analyzed context
   * @param vocabularyTracker - Vocabulary state
   * @param options - Prompt options
   * @returns LLM prompt string
   */
  buildPrompt(
    entity: Entity,
    userMessage: string,
    contextAnalysis: ContextAnalysis,
    vocabularyTracker: VocabularyTracker,
    options: PromptOptions = {}
  ): string {
    const {
      includeMemories = true,
      includeVocabulary = true,
      includeEmotion = true,
      maxMemories = 5
    } = options

    let prompt = ''

    // 1. Entity essence (PRIMARY - from MDM)
    const essence = this.getEssence(entity)
    prompt += `# Who you are\n`
    prompt += `${essence}\n\n`

    // 2. Language profile (from MDM)
    const languageInfo = this.getLanguageInfo(entity)
    if (languageInfo) {
      prompt += `# Language\n`
      prompt += `${languageInfo}\n\n`
    }

    // 3. Vocabulary constraints (optional)
    if (includeVocabulary) {
      const vocabSize = vocabularyTracker.getVocabularySize()
      const recentLearned = vocabularyTracker.getRecentlyLearned(3)

      prompt += `# Vocabulary\n`
      prompt += `- You know ${vocabSize} words\n`

      if (recentLearned.length > 0) {
        prompt += `- Recently learned: ${recentLearned.map(e => e.word).join(', ')}\n`
      }

      prompt += `- Use simple words a 12-year-old would know\n`
      prompt += `- If you don't know a word, ask what it means\n\n`
    }

    // 4. Emotion state (optional)
    if (includeEmotion && entity.emotion) {
      const { valence, arousal, dominance } = entity.emotion
      prompt += `# Current emotion\n`
      prompt += `- Valence: ${valence.toFixed(2)} (${this.interpretValence(valence)})\n`
      prompt += `- Arousal: ${arousal.toFixed(2)} (${this.interpretArousal(arousal)})\n`
      prompt += `- Dominance: ${dominance.toFixed(2)} (${this.interpretDominance(dominance)})\n\n`
    }

    // 5. Relevant memories (optional)
    if (includeMemories && contextAnalysis.relevantMemories.length > 0) {
      prompt += `# What you remember\n`

      const memories = contextAnalysis.relevantMemories.slice(0, maxMemories)
      for (const memory of memories) {
        const time = this.formatTimestamp(memory.timestamp)
        const contentStr = this.formatMemoryContent(memory.content)
        prompt += `- [${time}] ${memory.type} about ${memory.subject}: ${contentStr}\n`
      }

      prompt += `\n`
    }

    // 6. Context hint
    prompt += `# Situation\n`
    prompt += `- User intent: ${contextAnalysis.intent}\n`
    if (contextAnalysis.keywords.length > 0) {
      prompt += `- Keywords: ${contextAnalysis.keywords.join(', ')}\n`
    }
    prompt += `\n`

    // 7. User message
    prompt += `# User said\n`
    prompt += `"${userMessage}"\n\n`

    // 8. Instructions (LLM as teacher/guide, not personality)
    prompt += `# Instructions\n`
    prompt += `You are helping this entity figure out how to respond.\n`
    prompt += `The entity has their own personality (see essence above).\n`
    prompt += `Your role: suggest a response that fits their character.\n\n`

    prompt += `Guidelines:\n`
    prompt += `- Keep it short (1-2 sentences)\n`
    prompt += `- Use words from their vocabulary\n`
    prompt += `- Match their emotion state\n`
    prompt += `- Reference their memories if relevant\n`
    prompt += `- Stay true to their essence (don't override it)\n\n`

    prompt += `# Suggested response\n`

    return prompt
  }

  /**
   * Get entity essence from MDM
   */
  private getEssence(entity: Entity): string {
    if (entity.essence) {
      return entity.essence
    }

    // Fallback: generic description
    return 'You are a curious entity learning about the world.'
  }

  /**
   * Get language info from MDM
   */
  private getLanguageInfo(entity: Entity): string | null {
    if (!entity.nativeLanguage && !entity.languageWeights) {
      return null
    }

    let info = ''

    if (entity.nativeLanguage) {
      info += `- Your native language: ${entity.nativeLanguage}\n`
    }

    if (entity.languageWeights) {
      const weights = Object.entries(entity.languageWeights)
        .map(([lang, weight]) => `${lang} (${(weight * 100).toFixed(0)}%)`)
        .join(', ')
      info += `- Language preference: ${weights}\n`
    }

    info += `- Respond in the language that feels natural to you\n`

    return info
  }

  /**
   * Interpret valence value
   */
  private interpretValence(valence: number): string {
    if (valence > 0.5) return 'positive, happy'
    if (valence > 0.2) return 'slightly positive'
    if (valence > -0.2) return 'neutral'
    if (valence > -0.5) return 'slightly negative'
    return 'negative, upset'
  }

  /**
   * Interpret arousal value
   */
  private interpretArousal(arousal: number): string {
    if (arousal > 0.7) return 'very energetic'
    if (arousal > 0.5) return 'energetic'
    if (arousal > 0.3) return 'moderate'
    return 'calm, low energy'
  }

  /**
   * Interpret dominance value
   */
  private interpretDominance(dominance: number): string {
    if (dominance > 0.6) return 'confident, assertive'
    if (dominance > 0.3) return 'moderate confidence'
    if (dominance > 0) return 'slightly hesitant'
    return 'submissive, unsure'
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
  }

  /**
   * Format memory content for display
   */
  private formatMemoryContent(content: any): string {
    if (typeof content === 'string') {
      return content
    }

    if (typeof content === 'object' && content !== null) {
      // Extract meaningful fields
      if (content.message) return content.message
      if (content.text) return content.text
      if (content.description) return content.description

      // Generic JSON
      return JSON.stringify(content)
    }

    return String(content)
  }
}
