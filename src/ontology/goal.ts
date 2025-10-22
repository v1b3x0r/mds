/**
 * MDS v5.2 Phase 3.1 - Goal System
 * Hierarchical goal management with prerequisites and progress tracking
 *
 * Design principles:
 * - Goals are long-term objectives (unlike Intents which are immediate)
 * - Goals can have sub-goals (hierarchical tree structure)
 * - Goals have prerequisites that must be satisfied first
 * - Goal completion generates satisfaction/frustration emotions
 * - Goals automatically generate Intents for execution
 */

import type { Intent, IntentGoal } from './intent'

/**
 * Goal status
 */
export type GoalStatus =
  | 'pending'      // Not started
  | 'active'       // Currently pursuing
  | 'blocked'      // Waiting for prerequisites
  | 'completed'    // Successfully finished
  | 'abandoned'    // Given up
  | 'failed'       // Could not complete

/**
 * Goal priority levels
 */
export type GoalPriority =
  | 'critical'     // Must do (survival, safety)
  | 'high'         // Very important (relationships, growth)
  | 'medium'       // Important (skills, exploration)
  | 'low'          // Optional (hobbies, curiosity)

/**
 * Goal definition
 */
export interface Goal {
  id: string                    // Unique goal ID
  description: string           // Human-readable goal description
  status: GoalStatus            // Current status
  priority: GoalPriority        // Importance level
  progress: number              // Completion progress (0..1)

  // Hierarchy
  parentId?: string             // Parent goal ID (if sub-goal)
  subGoalIds?: string[]         // Child goal IDs

  // Prerequisites
  requiresGoals?: string[]      // Must complete these goals first
  requiresSkills?: string[]     // Must have these skills (skill IDs)

  // Execution
  generatesIntent?: IntentGoal  // What intent to create when active
  targetEntity?: string         // Target for generated intent

  // Tracking
  createdAt: number             // When goal was created
  startedAt?: number            // When goal became active
  completedAt?: number          // When goal was completed/failed

  // Metadata
  category?: string             // Goal category (social, survival, growth, etc.)
  reward?: number               // Satisfaction value on completion (0..1)
  metadata?: Record<string, any>
}

/**
 * Goal creation options
 */
export interface GoalOptions {
  description: string
  priority?: GoalPriority
  parentId?: string
  requiresGoals?: string[]
  requiresSkills?: string[]
  generatesIntent?: IntentGoal
  targetEntity?: string
  category?: string
  reward?: number
}

/**
 * Goal Manager
 * Manages hierarchical goals with prerequisites
 */
export class GoalManager {
  private goals: Map<string, Goal> = new Map()
  private nextId = 1

  /**
   * Create new goal
   */
  createGoal(options: GoalOptions, currentTime: number = Date.now()): Goal {
    const goal: Goal = {
      id: `goal_${this.nextId++}`,
      description: options.description,
      status: 'pending',
      priority: options.priority ?? 'medium',
      progress: 0,
      parentId: options.parentId,
      subGoalIds: [],
      requiresGoals: options.requiresGoals,
      requiresSkills: options.requiresSkills,
      generatesIntent: options.generatesIntent,
      targetEntity: options.targetEntity,
      createdAt: currentTime,
      category: options.category,
      reward: options.reward ?? 0.3,
      metadata: {}
    }

    this.goals.set(goal.id, goal)

    // Add to parent's subGoalIds
    if (goal.parentId) {
      const parent = this.goals.get(goal.parentId)
      if (parent) {
        if (!parent.subGoalIds) parent.subGoalIds = []
        parent.subGoalIds.push(goal.id)
      }
    }

    return goal
  }

  /**
   * Get goal by ID
   */
  getGoal(goalId: string): Goal | undefined {
    return this.goals.get(goalId)
  }

  /**
   * Get all goals
   */
  getAllGoals(): Goal[] {
    return Array.from(this.goals.values())
  }

  /**
   * Get goals by status
   */
  getGoalsByStatus(status: GoalStatus): Goal[] {
    return Array.from(this.goals.values()).filter(g => g.status === status)
  }

  /**
   * Get goals by priority
   */
  getGoalsByPriority(priority: GoalPriority): Goal[] {
    return Array.from(this.goals.values()).filter(g => g.priority === priority)
  }

  /**
   * Get root goals (no parent)
   */
  getRootGoals(): Goal[] {
    return Array.from(this.goals.values()).filter(g => !g.parentId)
  }

  /**
   * Get sub-goals of a goal
   */
  getSubGoals(goalId: string): Goal[] {
    const goal = this.goals.get(goalId)
    if (!goal || !goal.subGoalIds) return []
    return goal.subGoalIds
      .map(id => this.goals.get(id))
      .filter((g): g is Goal => g !== undefined)
  }

  /**
   * Check if goal is blocked by prerequisites
   */
  isBlocked(goalId: string, skillIds: string[] = []): boolean {
    const goal = this.goals.get(goalId)
    if (!goal) return true

    // Check required goals
    if (goal.requiresGoals) {
      for (const reqId of goal.requiresGoals) {
        const reqGoal = this.goals.get(reqId)
        if (!reqGoal || reqGoal.status !== 'completed') {
          return true
        }
      }
    }

    // Check required skills
    if (goal.requiresSkills) {
      for (const skillId of goal.requiresSkills) {
        if (!skillIds.includes(skillId)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Activate goal (change status to active)
   */
  activateGoal(goalId: string, currentTime: number = Date.now()): boolean {
    const goal = this.goals.get(goalId)
    if (!goal) return false

    if (goal.status === 'pending' || goal.status === 'blocked') {
      goal.status = 'active'
      goal.startedAt = currentTime
      return true
    }

    return false
  }

  /**
   * Update goal progress
   */
  updateProgress(goalId: string, progress: number): void {
    const goal = this.goals.get(goalId)
    if (!goal) return

    goal.progress = Math.max(0, Math.min(1, progress))

    // Auto-complete if progress reaches 1.0
    if (goal.progress >= 1.0 && goal.status === 'active') {
      this.completeGoal(goalId)
    }
  }

  /**
   * Complete goal
   */
  completeGoal(goalId: string, currentTime: number = Date.now()): boolean {
    const goal = this.goals.get(goalId)
    if (!goal) return false

    if (goal.status === 'active') {
      goal.status = 'completed'
      goal.progress = 1.0
      goal.completedAt = currentTime

      // If all sub-goals complete, propagate to parent
      if (goal.subGoalIds && goal.subGoalIds.length > 0) {
        const allSubGoalsComplete = goal.subGoalIds.every(id => {
          const subGoal = this.goals.get(id)
          return subGoal?.status === 'completed'
        })

        if (allSubGoalsComplete && goal.parentId) {
          const parent = this.goals.get(goal.parentId)
          if (parent) {
            // Update parent progress based on completed children
            const subGoals = this.getSubGoals(goal.parentId)
            const completedCount = subGoals.filter(sg => sg.status === 'completed').length
            parent.progress = completedCount / subGoals.length
          }
        }
      }

      return true
    }

    return false
  }

  /**
   * Abandon goal
   */
  abandonGoal(goalId: string, currentTime: number = Date.now()): boolean {
    const goal = this.goals.get(goalId)
    if (!goal) return false

    goal.status = 'abandoned'
    goal.completedAt = currentTime
    return true
  }

  /**
   * Fail goal
   */
  failGoal(goalId: string, currentTime: number = Date.now()): boolean {
    const goal = this.goals.get(goalId)
    if (!goal) return false

    goal.status = 'failed'
    goal.completedAt = currentTime
    return true
  }

  /**
   * Generate intent from active goal
   */
  generateIntent(goalId: string): Intent | null {
    const goal = this.goals.get(goalId)
    if (!goal || goal.status !== 'active' || !goal.generatesIntent) {
      return null
    }

    return {
      goal: goal.generatesIntent,
      target: goal.targetEntity,
      motivation: this.priorityToMotivation(goal.priority),
      priority: this.priorityToIntentPriority(goal.priority)
    }
  }

  /**
   * Get next goal to pursue (highest priority unblocked goal)
   */
  getNextGoal(skillIds: string[] = []): Goal | null {
    const priorityOrder: GoalPriority[] = ['critical', 'high', 'medium', 'low']

    for (const priority of priorityOrder) {
      const goals = this.getGoalsByPriority(priority)
        .filter(g => g.status === 'pending' || g.status === 'blocked')
        .filter(g => !this.isBlocked(g.id, skillIds))

      if (goals.length > 0) {
        return goals[0]
      }
    }

    return null
  }

  /**
   * Update all goal statuses based on prerequisites
   */
  updateStatuses(skillIds: string[] = []): void {
    for (const goal of this.goals.values()) {
      if (goal.status === 'pending' || goal.status === 'blocked') {
        if (this.isBlocked(goal.id, skillIds)) {
          goal.status = 'blocked'
        } else {
          goal.status = 'pending'
        }
      }
    }
  }

  /**
   * Remove goal (and optionally its sub-goals)
   */
  removeGoal(goalId: string, recursive: boolean = false): boolean {
    const goal = this.goals.get(goalId)
    if (!goal) return false

    // Remove from parent's subGoalIds
    if (goal.parentId) {
      const parent = this.goals.get(goal.parentId)
      if (parent && parent.subGoalIds) {
        parent.subGoalIds = parent.subGoalIds.filter(id => id !== goalId)
      }
    }

    // Recursively remove sub-goals if requested
    if (recursive && goal.subGoalIds) {
      for (const subGoalId of goal.subGoalIds) {
        this.removeGoal(subGoalId, true)
      }
    }

    return this.goals.delete(goalId)
  }

  /**
   * Clear all goals
   */
  clearGoals(): void {
    this.goals.clear()
    this.nextId = 1
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      goals: Array.from(this.goals.values()),
      nextId: this.nextId
    }
  }

  /**
   * Restore from JSON
   */
  static fromJSON(data: ReturnType<GoalManager['toJSON']>): GoalManager {
    const manager = new GoalManager()
    manager.nextId = data.nextId
    for (const goal of data.goals) {
      manager.goals.set(goal.id, goal)
    }
    return manager
  }

  /**
   * Helper: Convert priority to motivation value
   */
  private priorityToMotivation(priority: GoalPriority): number {
    switch (priority) {
      case 'critical': return 1.0
      case 'high': return 0.8
      case 'medium': return 0.5
      case 'low': return 0.3
    }
  }

  /**
   * Helper: Convert priority to intent priority
   */
  private priorityToIntentPriority(priority: GoalPriority): number {
    switch (priority) {
      case 'critical': return 5
      case 'high': return 4
      case 'medium': return 2
      case 'low': return 1
    }
  }
}

/**
 * Helper: Create goal manager
 */
export function createGoalManager(): GoalManager {
  return new GoalManager()
}

/**
 * Helper: Create simple goal
 */
export function createGoal(
  description: string,
  priority: GoalPriority = 'medium'
): GoalOptions {
  return { description, priority }
}

/**
 * Predefined goal templates
 */
export const GOAL_TEMPLATES = {
  // Social goals
  makeFriend: {
    description: 'Make a new friend',
    priority: 'high' as GoalPriority,
    generatesIntent: 'approach' as IntentGoal,
    category: 'social',
    reward: 0.6
  },

  deepenBond: {
    description: 'Deepen bond with someone',
    priority: 'high' as GoalPriority,
    generatesIntent: 'bond' as IntentGoal,
    category: 'social',
    reward: 0.7
  },

  // Exploration goals
  exploreWorld: {
    description: 'Explore the environment',
    priority: 'medium' as GoalPriority,
    generatesIntent: 'explore' as IntentGoal,
    category: 'exploration',
    reward: 0.4
  },

  // Self-care goals
  rest: {
    description: 'Take a rest',
    priority: 'medium' as GoalPriority,
    generatesIntent: 'rest' as IntentGoal,
    category: 'self-care',
    reward: 0.3
  },

  // Learning goals
  learnSkill: {
    description: 'Learn a new skill',
    priority: 'medium' as GoalPriority,
    generatesIntent: 'observe' as IntentGoal,
    category: 'learning',
    reward: 0.5
  }
}
