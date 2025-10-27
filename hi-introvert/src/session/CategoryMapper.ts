/**
 * Hi-Introvert: Category Mapper (v6.5 Phase 2)
 *
 * Context-aware dialogue category selection.
 * Maps user intent → entity dialogue category by considering:
 * - Base intent (from ContextAnalyzer)
 * - Entity's emotional state
 * - Recent conversation history
 * - Memory relevance
 *
 * Philosophy: "Context over Rules" - same intent can map to different categories
 */

import type { Entity } from '@v1b3x0r/mds-core'

/**
 * Context for category mapping
 */
export interface CategoryContext {
  /** User's detected intent (from ContextAnalyzer) */
  intent: string
  /** Keywords extracted from user message */
  keywords: string[]
  /** Number of relevant memories found */
  memoryRelevance: number
  /** Recent dialogue categories used (to avoid repetition) */
  recentCategories: string[]
  /** User message text (for pattern matching) */
  userMessage: string
}

/**
 * Mapping result with confidence score
 */
export interface MappingResult {
  category: string
  confidence: number  // 0-1, how confident this mapping is
  reason?: string     // Debug: why this category was chosen
}

/**
 * Category Mapper
 *
 * Intelligently maps intents to dialogue categories based on full context.
 */
export class CategoryMapper {
  // Base intent → category mapping (fallback when no context override)
  private baseMapping: Record<string, string> = {
    'greeting': 'intro',
    'praise': 'happy',
    'gratitude': 'grateful',
    'criticism': 'sad',
    'question': 'thinking',
    'farewell': 'intro',
    'curiosity': 'curious',
    'excitement': 'excited',
    'confusion': 'confused',
    'neutral': 'thinking',
    'introspection': 'nostalgic',
    'worry': 'anxious',
    'loneliness': 'lonely',
    'inspiration': 'inspired',
    'nostalgia': 'nostalgic',
    'playfulness': 'playful',
    'focus': 'focused',
    'relief': 'relieved'
  }

  constructor() {}

  /**
   * Map intent to dialogue category with context awareness
   *
   * @param context - Full context including intent, emotion, memories
   * @param entity - Entity that will speak (for emotion state)
   * @returns Mapping result with category and confidence
   */
  map(context: CategoryContext, entity: Entity): MappingResult {
    const { intent, keywords, memoryRelevance, recentCategories, userMessage } = context

    // 1. Check for emotion-triggered overrides (entity's current state)
    const emotionOverride = this.checkEmotionOverride(entity, intent)
    if (emotionOverride) {
      return emotionOverride
    }

    // 2. Check for memory-triggered responses
    const memoryOverride = this.checkMemoryOverride(memoryRelevance, intent, recentCategories)
    if (memoryOverride) {
      return memoryOverride
    }

    // 3. Check for conversation pattern overrides
    const patternOverride = this.checkPatternOverride(userMessage, keywords, recentCategories)
    if (patternOverride) {
      return patternOverride
    }

    // 4. Check for repetition avoidance
    const baseCategory = this.baseMapping[intent] || 'thinking'

    // v6.5: Enhanced repetition check - avoid if category appears in recent 3
    const recentThree = recentCategories.slice(0, 3)
    const timesUsedRecently = recentThree.filter(c => c === baseCategory).length

    if (timesUsedRecently > 0) {
      // Category was used recently - try to vary
      const alternative = this.getAlternativeCategory(baseCategory, entity)
      return {
        category: alternative,
        confidence: 0.7,
        reason: `Repetition avoidance: ${baseCategory} used ${timesUsedRecently}x in recent → ${alternative}`
      }
    }

    // 5. Default: Use base mapping
    return {
      category: baseCategory,
      confidence: 0.8,
      reason: `Base mapping: ${intent} → ${baseCategory}`
    }
  }

  /**
   * Check if entity's emotional state should override intent mapping
   */
  private checkEmotionOverride(entity: Entity, intent: string): MappingResult | null {
    const emotion = entity.emotion
    if (!emotion) return null

    const { valence, arousal } = emotion

    // If entity is in extreme emotional state, express that regardless of intent
    // (unless intent is explicitly emotion-related)
    if (intent === 'praise' || intent === 'criticism' || intent === 'gratitude') {
      return null  // Don't override emotion-related intents
    }

    // Very sad/anxious state (negative + high arousal)
    if (valence < -0.6 && arousal > 0.6) {
      return {
        category: 'anxious',
        confidence: 0.9,
        reason: 'Entity in anxious state (valence < -0.6, arousal > 0.6)'
      }
    }

    // Very happy/excited state (positive + high arousal)
    if (valence > 0.7 && arousal > 0.7) {
      return {
        category: 'excited',
        confidence: 0.9,
        reason: 'Entity in excited state (valence > 0.7, arousal > 0.7)'
      }
    }

    // Very tired/withdrawn state (low arousal)
    if (arousal < 0.2) {
      return {
        category: 'tired',
        confidence: 0.85,
        reason: 'Entity in tired state (arousal < 0.2)'
      }
    }

    return null
  }

  /**
   * Check if memory relevance should trigger specific categories
   */
  private checkMemoryOverride(
    memoryRelevance: number,
    intent: string,
    recentCategories: string[]
  ): MappingResult | null {
    // High memory relevance (>3 relevant memories) → nostalgic response
    if (memoryRelevance > 3 && Math.random() < 0.3) {
      // Don't trigger if recently used nostalgic
      if (!recentCategories.slice(0, 3).includes('nostalgic')) {
        return {
          category: 'nostalgic',
          confidence: 0.75,
          reason: `High memory relevance (${memoryRelevance} memories)`
        }
      }
    }

    // No memory relevance + question intent → confused
    if (memoryRelevance === 0 && intent === 'question') {
      return {
        category: 'confused',
        confidence: 0.85,
        reason: 'No relevant memories for question'
      }
    }

    return null
  }

  /**
   * Check for conversation patterns that should trigger specific categories
   */
  private checkPatternOverride(
    userMessage: string,
    keywords: string[],
    recentCategories: string[]
  ): MappingResult | null {
    const lowerMessage = userMessage.toLowerCase()

    // Pattern 1: Repeated questions → anxious/confused
    if (lowerMessage.includes('?') && recentCategories.slice(0, 2).includes('thinking')) {
      return {
        category: 'confused',
        confidence: 0.8,
        reason: 'Repeated questions pattern detected'
      }
    }

    // Pattern 2: Long message (>100 chars) → focused
    if (userMessage.length > 100) {
      return {
        category: 'focused',
        confidence: 0.75,
        reason: 'Long message detected (>100 chars)'
      }
    }

    // Pattern 3: Short burst messages (recent categories all same) → playful
    const lastThree = recentCategories.slice(0, 3)
    if (lastThree.length === 3 && new Set(lastThree).size === 1) {
      return {
        category: 'playful',
        confidence: 0.7,
        reason: 'Repetitive pattern detected (breaking monotony)'
      }
    }

    // Pattern 4: Keywords indicating nostalgia
    const nostalgicKeywords = ['remember', 'จำได้', 'เมื่อก่อน', 'before', 'used to', 'เคย']
    if (keywords.some(kw => nostalgicKeywords.some(nk => kw.includes(nk)))) {
      return {
        category: 'nostalgic',
        confidence: 0.85,
        reason: 'Nostalgic keywords detected'
      }
    }

    // Pattern 5: Keywords indicating relief
    const reliefKeywords = ['finally', 'done', 'finished', 'เสร็จ', 'สำเร็จ', 'phew']
    if (keywords.some(kw => reliefKeywords.some(rk => kw.includes(rk)))) {
      return {
        category: 'relieved',
        confidence: 0.8,
        reason: 'Relief keywords detected'
      }
    }

    return null
  }

  /**
   * Get alternative category to avoid repetition
   */
  private getAlternativeCategory(original: string, entity: Entity): string {
    const emotion = entity.emotion
    if (!emotion) return 'thinking'

    // Category similarity groups (can substitute within group)
    const groups: Record<string, string[]> = {
      'positive': ['happy', 'excited', 'grateful', 'playful', 'inspired', 'relieved'],
      'negative': ['sad', 'anxious', 'lonely', 'confused'],
      'neutral': ['thinking', 'focused', 'curious', 'nostalgic'],
      'greeting': ['intro', 'happy', 'curious', 'playful'],  // v6.5: Added intro variations
      'energy_low': ['tired', 'lonely', 'relieved'],
      'energy_high': ['excited', 'playful', 'inspired', 'anxious']
    }

    // Find which group the original category belongs to
    for (const [groupName, categories] of Object.entries(groups)) {
      if (categories.includes(original)) {
        // Pick a different category from same group
        const alternatives = categories.filter(c => c !== original)
        if (alternatives.length > 0) {
          return alternatives[Math.floor(Math.random() * alternatives.length)]
        }
      }
    }

    // Fallback: Use emotion-based selection
    const { valence, arousal } = emotion
    if (valence > 0.5) return 'happy'
    if (valence < -0.3) return 'sad'
    if (arousal > 0.6) return 'excited'
    if (arousal < 0.3) return 'tired'
    return 'thinking'
  }

  /**
   * Export state (for debugging/logging)
   */
  toJSON() {
    return {
      baseMapping: this.baseMapping
    }
  }
}
