/**
 * MDS v5 Phase 7 - Learning System
 * Experience-based learning and pattern recognition
 *
 * Design principles:
 * - Learn from action-outcome pairs
 * - Simple reinforcement learning (reward-based)
 * - Pattern recognition (detect recurring sequences)
 * - Adaptive behavior (modify actions based on success/failure)
 */

/**
 * Experience entry (action → outcome → reward)
 */
export interface Experience {
  timestamp: number
  action: string
  context: Record<string, any>
  outcome: string
  reward: number        // -1..1 (negative = punishment, positive = reward)
  success: boolean
}

/**
 * Pattern (recurring sequence of experiences)
 */
export interface Pattern {
  sequence: string[]    // Action sequence
  frequency: number     // How many times observed
  avgReward: number     // Average reward for this pattern
  lastSeen: number      // Timestamp of last occurrence
}

/**
 * Learning statistics
 */
export interface LearningStats {
  totalExperiences: number
  successRate: number
  avgReward: number
  patternsDetected: number
}

/**
 * Learning system configuration
 */
export interface LearningConfig {
  maxExperiences?: number       // Max experiences to store
  patternMinLength?: number     // Minimum pattern length to detect
  patternMaxLength?: number     // Maximum pattern length
  forgettingRate?: number       // How fast to forget old patterns (0..1)
  learningRate?: number         // How fast to learn from new experiences (0..1)
}

/**
 * Learning system
 * Tracks experiences, detects patterns, and adapts behavior
 */
export class LearningSystem {
  private experiences: Experience[] = []
  private patterns: Map<string, Pattern> = new Map()
  private actionValues: Map<string, number> = new Map()  // Q-values for actions
  private config: Required<LearningConfig>

  constructor(config: LearningConfig = {}) {
    this.config = {
      maxExperiences: config.maxExperiences ?? 200,
      patternMinLength: config.patternMinLength ?? 2,
      patternMaxLength: config.patternMaxLength ?? 5,
      forgettingRate: config.forgettingRate ?? 0.01,
      learningRate: config.learningRate ?? 0.1
    }
  }

  /**
   * Record an experience
   */
  addExperience(exp: Experience): void {
    this.experiences.push(exp)

    // Update action value (simple Q-learning)
    const currentValue = this.actionValues.get(exp.action) ?? 0
    const newValue = currentValue + this.config.learningRate * (exp.reward - currentValue)
    this.actionValues.set(exp.action, newValue)

    // Enforce max size
    if (this.experiences.length > this.config.maxExperiences) {
      this.experiences.shift()
    }

    // Detect patterns after adding experience
    this.detectPatterns()
  }

  /**
   * Detect recurring patterns in experience history
   */
  private detectPatterns(): void {
    const actions = this.experiences.map(e => e.action)
    if (actions.length < this.config.patternMinLength) return

    // Sliding window pattern detection
    for (let len = this.config.patternMinLength; len <= this.config.patternMaxLength; len++) {
      if (actions.length < len) continue

      const sequence = actions.slice(-len)
      const patternKey = sequence.join('→')

      // Check if pattern exists
      const existing = this.patterns.get(patternKey)

      if (existing) {
        // Update pattern
        existing.frequency++
        existing.lastSeen = Date.now()

        // Update average reward
        const recentExps = this.experiences.slice(-len)
        const totalReward = recentExps.reduce((sum, e) => sum + e.reward, 0)
        existing.avgReward = (existing.avgReward * (existing.frequency - 1) + totalReward / len) / existing.frequency
      } else {
        // New pattern
        const recentExps = this.experiences.slice(-len)
        const avgReward = recentExps.reduce((sum, e) => sum + e.reward, 0) / len

        this.patterns.set(patternKey, {
          sequence,
          frequency: 1,
          avgReward,
          lastSeen: Date.now()
        })
      }
    }
  }

  /**
   * Get best action based on learned values
   */
  getBestAction(availableActions: string[]): string | null {
    if (availableActions.length === 0) return null

    let bestAction: string | null = null
    let bestValue = -Infinity

    for (const action of availableActions) {
      const value = this.actionValues.get(action) ?? 0
      if (value > bestValue) {
        bestValue = value
        bestAction = action
      }
    }

    return bestAction
  }

  /**
   * Get action value (Q-value)
   */
  getActionValue(action: string): number {
    return this.actionValues.get(action) ?? 0
  }

  /**
   * Get recent pattern (if any)
   */
  getRecentPattern(): Pattern | null {
    if (this.patterns.size === 0) return null

    const actions = this.experiences.slice(-this.config.patternMaxLength).map(e => e.action)

    // Try to find matching pattern (longest first)
    for (let len = this.config.patternMaxLength; len >= this.config.patternMinLength; len--) {
      if (actions.length < len) continue

      const sequence = actions.slice(-len)
      const patternKey = sequence.join('→')
      const pattern = this.patterns.get(patternKey)

      if (pattern) return pattern
    }

    return null
  }

  /**
   * Get all detected patterns (sorted by frequency)
   */
  getPatterns(): Pattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * Get learning statistics
   */
  getStats(): LearningStats {
    const successfulExps = this.experiences.filter(e => e.success)
    const totalReward = this.experiences.reduce((sum, e) => sum + e.reward, 0)

    return {
      totalExperiences: this.experiences.length,
      successRate: this.experiences.length > 0
        ? successfulExps.length / this.experiences.length
        : 0,
      avgReward: this.experiences.length > 0
        ? totalReward / this.experiences.length
        : 0,
      patternsDetected: this.patterns.size
    }
  }

  /**
   * Forget old patterns (decay based on time)
   */
  forgetOldPatterns(currentTime: number, maxAge: number = 300000): void {
    for (const [key, pattern] of this.patterns) {
      const age = currentTime - pattern.lastSeen

      if (age > maxAge) {
        // Forget pattern entirely
        this.patterns.delete(key)
      } else {
        // Decay frequency
        pattern.frequency *= (1 - this.config.forgettingRate)

        if (pattern.frequency < 0.1) {
          this.patterns.delete(key)
        }
      }
    }
  }

  /**
   * Clear all learning data
   */
  clear(): void {
    this.experiences = []
    this.patterns.clear()
    this.actionValues.clear()
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      experiences: this.experiences,
      patterns: Array.from(this.patterns.entries()),
      actionValues: Array.from(this.actionValues.entries())
    }
  }

  /**
   * Restore from JSON
   */
  static fromJSON(data: ReturnType<LearningSystem['toJSON']>): LearningSystem {
    const system = new LearningSystem()
    system.experiences = data.experiences
    system.patterns = new Map(data.patterns)
    system.actionValues = new Map(data.actionValues)
    return system
  }
}

/**
 * Helper: Create experience
 */
export function createExperience(
  action: string,
  outcome: string,
  reward: number,
  context: Record<string, any> = {}
): Experience {
  return {
    timestamp: Date.now(),
    action,
    context,
    outcome,
    reward,
    success: reward > 0
  }
}

/**
 * Helper: Calculate reward from outcome
 * Simple heuristic: positive outcomes = positive reward
 */
export function calculateReward(outcome: string, expectedOutcome?: string): number {
  // Exact match
  if (expectedOutcome && outcome === expectedOutcome) {
    return 1.0
  }

  // Keyword-based reward
  const positiveKeywords = ['success', 'good', 'win', 'happy', 'achieve']
  const negativeKeywords = ['fail', 'bad', 'lose', 'sad', 'error']

  const outcomeLower = outcome.toLowerCase()

  for (const keyword of positiveKeywords) {
    if (outcomeLower.includes(keyword)) return 0.5
  }

  for (const keyword of negativeKeywords) {
    if (outcomeLower.includes(keyword)) return -0.5
  }

  // Neutral
  return 0
}
