/**
 * MDS v5.2 Phase 2.4 - Intent Reasoning System
 * Intelligent goal selection based on memory, emotion, and relationships
 *
 * Design principles:
 * - Intents should emerge from entity state (not random)
 * - Confidence guides commitment to goals
 * - Memory crystallization informs intent priorities
 * - Emotional state modulates goal selection
 * - Relationship strength affects social intents
 */

import type { Intent } from '@mds/1-ontology/intent/intent'
import type { Memory } from '@mds/1-ontology/memory/buffer'
import type { CrystalMemory } from '@mds/1-ontology/memory/crystallization'
import type { EmotionalState } from '@mds/1-ontology/emotion/state'
import type { RelationshipEntry } from '@mds/1-ontology/relationships/bond'
import { relationshipStrength } from '@mds/1-ontology/relationships/bond'

/**
 * Intent with reasoning metadata
 */
export interface ReasonedIntent extends Intent {
  confidence: number        // How confident in pursuing this goal (0..1)
  reasoning: string[]       // Why this intent was selected
  relevance: number         // How relevant to current context (0..1)
  lastEvaluated?: number    // When confidence was last checked
}

/**
 * Context for intent reasoning
 */
export interface ReasoningContext {
  emotion?: EmotionalState
  memories?: Memory[]
  crystals?: CrystalMemory[]
  relationships?: RelationshipEntry[]
  age?: number              // Entity age in seconds
  currentTime?: number      // Simulation time
}

/**
 * Intent reasoning configuration
 */
export interface ReasoningConfig {
  confidenceThreshold?: number       // Min confidence to pursue (default: 0.3)
  memoryInfluence?: number           // How much memories affect intent (0..1, default: 0.5)
  emotionInfluence?: number          // How much emotion affects intent (0..1, default: 0.6)
  relationshipInfluence?: number     // How much relationships affect intent (0..1, default: 0.7)
  reevaluationInterval?: number      // Seconds between confidence checks (default: 5)
}

/**
 * Intent Reasoner
 * Evaluates context and suggests/scores intents
 */
export class IntentReasoner {
  private config: Required<ReasoningConfig>

  constructor(config: ReasoningConfig = {}) {
    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 0.3,
      memoryInfluence: config.memoryInfluence ?? 0.5,
      emotionInfluence: config.emotionInfluence ?? 0.6,
      relationshipInfluence: config.relationshipInfluence ?? 0.7,
      reevaluationInterval: config.reevaluationInterval ?? 5
    }
  }

  /**
   * Reason about intent given context
   * Returns confidence and reasoning for pursuing this intent
   */
  reason(intent: Intent, context: ReasoningContext): ReasonedIntent {
    const reasoning: string[] = []
    let confidence = intent.motivation // Start with base motivation

    // 1. Emotion influence
    if (context.emotion) {
      const emotionFactor = this.evaluateEmotionalFit(intent, context.emotion, reasoning)
      confidence = confidence * (1 - this.config.emotionInfluence) + emotionFactor * this.config.emotionInfluence
    }

    // 2. Memory influence
    if (context.memories || context.crystals) {
      const memoryFactor = this.evaluateMemorySupport(intent, context, reasoning)
      confidence = confidence * (1 - this.config.memoryInfluence) + memoryFactor * this.config.memoryInfluence
    }

    // 3. Relationship influence (for targeted intents)
    if (intent.target && context.relationships) {
      const relationshipFactor = this.evaluateRelationshipSupport(intent, context.relationships, reasoning)
      confidence = confidence * (1 - this.config.relationshipInfluence) + relationshipFactor * this.config.relationshipInfluence
    }

    // 4. Calculate relevance (how well this intent fits current context)
    const relevance = this.calculateRelevance(intent, context)

    return {
      ...intent,
      confidence: Math.max(0, Math.min(1, confidence)),
      reasoning,
      relevance,
      lastEvaluated: context.currentTime ?? Date.now()
    }
  }

  /**
   * Suggest intents based on context
   * Returns ranked list of potential goals with reasoning
   */
  suggest(context: ReasoningContext): ReasonedIntent[] {
    const suggestions: ReasonedIntent[] = []

    // Social intents (if have relationships)
    if (context.relationships && context.relationships.length > 0) {
      const strongBonds = context.relationships.filter(r => relationshipStrength(r.bond) > 0.6)
      const weakBonds = context.relationships.filter(r => r.bond.trust < 0.3)

      if (strongBonds.length > 0) {
        const target = strongBonds[0].entityId
        suggestions.push(this.reason({
          goal: 'approach',
          target,
          motivation: relationshipStrength(strongBonds[0].bond),
          priority: 3
        }, context))
      }

      if (weakBonds.length > 0) {
        const target = weakBonds[0].entityId
        suggestions.push(this.reason({
          goal: 'avoid',
          target,
          motivation: 1 - weakBonds[0].bond.trust,
          priority: 3
        }, context))
      }
    }

    // Emotion-driven intents
    if (context.emotion) {
      const { valence, arousal } = context.emotion

      // High arousal + positive = explore
      if (arousal > 0.5 && valence > 0.3) {
        suggestions.push(this.reason({
          goal: 'explore',
          motivation: arousal,
          priority: 2
        }, context))
      }

      // Low arousal = rest
      if (arousal < -0.3) {
        suggestions.push(this.reason({
          goal: 'rest',
          motivation: 1 - Math.abs(arousal),
          priority: 1
        }, context))
      }

      // Negative valence + high arousal = wander (restless)
      if (valence < -0.3 && arousal > 0.3) {
        suggestions.push(this.reason({
          goal: 'wander',
          motivation: Math.abs(valence),
          priority: 2
        }, context))
      }
    }

    // Memory-driven intents (crystallized patterns)
    if (context.crystals && context.crystals.length > 0) {
      const interactionCrystals = context.crystals.filter(c => c.type === 'interaction')

      if (interactionCrystals.length > 0) {
        const strongest = interactionCrystals.reduce((max, c) => c.strength > max.strength ? c : max)
        suggestions.push(this.reason({
          goal: 'bond',
          target: strongest.subject,
          motivation: strongest.strength,
          priority: 4
        }, context))
      }
    }

    // Default fallback: wander
    if (suggestions.length === 0) {
      suggestions.push(this.reason({
        goal: 'wander',
        motivation: 0.4,
        priority: 1
      }, context))
    }

    // Sort by confidence × relevance
    return suggestions.sort((a, b) => {
      const scoreA = a.confidence * a.relevance
      const scoreB = b.confidence * b.relevance
      return scoreB - scoreA
    })
  }

  /**
   * Re-evaluate existing intent confidence
   * Returns updated intent with new confidence score
   */
  reevaluate(intent: ReasonedIntent, context: ReasoningContext): ReasonedIntent {
    // Check if enough time has passed
    if (intent.lastEvaluated && context.currentTime) {
      const elapsed = (context.currentTime - intent.lastEvaluated) / 1000
      if (elapsed < this.config.reevaluationInterval) {
        return intent // Too soon, return unchanged
      }
    }

    // Re-reason about this intent
    return this.reason(intent, context)
  }

  /**
   * Check if intent should be abandoned
   */
  shouldAbandon(intent: ReasonedIntent, context: ReasoningContext): boolean {
    const updated = this.reevaluate(intent, context)
    return updated.confidence < this.config.confidenceThreshold
  }

  /**
   * Evaluate how well emotion supports this intent
   */
  private evaluateEmotionalFit(intent: Intent, emotion: EmotionalState, reasoning: string[]): number {
    const { valence, arousal } = emotion

    switch (intent.goal) {
      case 'approach':
      case 'bond':
        // Positive valence + moderate arousal = good for bonding
        if (valence > 0.3 && arousal > 0) {
          reasoning.push('Positive emotional state supports bonding')
          return 0.8
        }
        if (valence < -0.3) {
          reasoning.push('Negative emotional state hinders bonding')
          return 0.3
        }
        return 0.5

      case 'avoid':
        // Negative valence or high arousal = supports avoidance
        if (valence < -0.3 || arousal > 0.7) {
          reasoning.push('Emotional state supports avoidance')
          return 0.8
        }
        return 0.4

      case 'explore':
        // High arousal + positive valence = exploratory
        if (arousal > 0.5 && valence > 0) {
          reasoning.push('High arousal encourages exploration')
          return 0.9
        }
        return 0.5

      case 'rest':
        // Low arousal = supports rest
        if (arousal < -0.3) {
          reasoning.push('Low arousal supports resting')
          return 0.9
        }
        if (arousal > 0.5) {
          reasoning.push('High arousal makes resting difficult')
          return 0.2
        }
        return 0.5

      case 'wander':
        // Moderate arousal = supports wandering
        if (Math.abs(arousal) < 0.3) {
          reasoning.push('Moderate arousal supports wandering')
          return 0.7
        }
        return 0.5

      default:
        return 0.5
    }
  }

  /**
   * Evaluate how well memories support this intent
   */
  private evaluateMemorySupport(intent: Intent, context: ReasoningContext, reasoning: string[]): number {
    let support = 0.5 // Neutral baseline

    // Check short-term memories
    if (context.memories && intent.target) {
      const relevantMemories = context.memories.filter(m => m.subject === intent.target)

      if (relevantMemories.length > 0) {
        const avgSalience = relevantMemories.reduce((sum, m) => sum + m.salience, 0) / relevantMemories.length

        if (intent.goal === 'approach' || intent.goal === 'bond') {
          // Positive memories support approach
          const positiveMemories = relevantMemories.filter(m => m.type === 'interaction' || m.type === 'emotion')
          if (positiveMemories.length > 0) {
            support = 0.5 + avgSalience * 0.5
            reasoning.push(`${positiveMemories.length} positive memories of target`)
          }
        }

        if (intent.goal === 'avoid') {
          // Any memories = familiarity = less need to avoid
          support = Math.max(0.3, 0.8 - avgSalience * 0.5)
          reasoning.push('Familiarity reduces avoidance')
        }
      }
    }

    // Check crystallized memories (stronger signal)
    if (context.crystals && intent.target) {
      const relevantCrystals = context.crystals.filter(c => c.subject === intent.target)

      if (relevantCrystals.length > 0) {
        const strongestCrystal = relevantCrystals.reduce((max, c) => c.strength > max.strength ? c : max)

        if (intent.goal === 'bond' && strongestCrystal.type === 'interaction') {
          // Crystallized memories have stronger influence (0.7 base + 0.3 scaled)
          support = Math.max(support, 0.7 + strongestCrystal.strength * 0.3)
          reasoning.push(`Strong crystallized bond with ${intent.target}`)
        }
      }
    }

    return support
  }

  /**
   * Evaluate how well relationships support this intent
   */
  private evaluateRelationshipSupport(intent: Intent, relationships: RelationshipEntry[], reasoning: string[]): number {
    const rel = relationships.find(r => r.entityId === intent.target)

    if (!rel) return 0.5 // No relationship = neutral

    const strength = relationshipStrength(rel.bond)
    const trust = rel.bond.trust

    switch (intent.goal) {
      case 'approach':
      case 'bond':
        // High strength = strong support
        if (strength > 0.6) {
          reasoning.push(`Strong bond (${strength.toFixed(2)}) with target`)
          return 0.7 + strength * 0.3
        }
        if (trust < 0.3) {
          reasoning.push(`Low trust (${trust.toFixed(2)}) hinders bonding`)
          return 0.3
        }
        return 0.5 + strength * 0.3

      case 'avoid':
        // Low trust = strong support for avoidance
        if (trust < 0.3) {
          reasoning.push(`Low trust (${trust.toFixed(2)}) supports avoidance`)
          return 0.8 + (1 - trust) * 0.2
        }
        if (strength > 0.6) {
          reasoning.push(`Strong bond reduces avoidance`)
          return 0.2
        }
        return 0.5 + (1 - trust) * 0.3

      default:
        return 0.5
    }
  }

  /**
   * Calculate how relevant this intent is to current context
   */
  private calculateRelevance(intent: Intent, context: ReasoningContext): number {
    let relevance = 0.5 // Baseline

    // Targeted intents are more relevant if target exists in context
    if (intent.target) {
      const hasMemory = context.memories?.some(m => m.subject === intent.target) ?? false
      const hasCrystal = context.crystals?.some(c => c.subject === intent.target) ?? false
      const hasRelationship = context.relationships?.some(r => r.entityId === intent.target) ?? false

      if (hasRelationship) relevance += 0.3
      else if (hasCrystal) relevance += 0.2
      else if (hasMemory) relevance += 0.1
    }

    // Emotion alignment increases relevance
    if (context.emotion) {
      const emotionFit = this.evaluateEmotionalFit(intent, context.emotion, [])
      relevance = relevance * 0.6 + emotionFit * 0.4
    }

    return Math.max(0, Math.min(1, relevance))
  }

  /**
   * Get configuration
   */
  getConfig(): Required<ReasoningConfig> {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReasoningConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * Helper: Create reasoner with default config
 */
export function createReasoner(config?: ReasoningConfig): IntentReasoner {
  return new IntentReasoner(config)
}

/**
 * Helper: Quick reasoning for single intent
 */
export function reasonAbout(intent: Intent, context: ReasoningContext): ReasonedIntent {
  const reasoner = new IntentReasoner()
  return reasoner.reason(intent, context)
}

/**
 * Helper: Get best intent from options
 */
export function chooseBestIntent(intents: Intent[], context: ReasoningContext): ReasonedIntent | null {
  if (intents.length === 0) return null

  const reasoner = new IntentReasoner()
  const reasoned = intents.map(i => reasoner.reason(i, context))

  // Sort by confidence × relevance
  reasoned.sort((a, b) => {
    const scoreA = a.confidence * a.relevance
    const scoreB = b.confidence * b.relevance
    return scoreB - scoreA
  })

  return reasoned[0]
}
