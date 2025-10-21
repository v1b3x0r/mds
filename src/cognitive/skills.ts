/**
 * MDS v5 Phase 7 - Skill System
 * Skill acquisition, proficiency development, and decay
 *
 * Design principles:
 * - Skills improve with practice (learning curve)
 * - Skills decay without use (forgetting curve)
 * - Different skills have different learning rates
 * - Proficiency levels: Novice → Competent → Proficient → Expert → Master
 */

/**
 * Skill proficiency levels
 */
export type SkillLevel = 'novice' | 'competent' | 'proficient' | 'expert' | 'master'

/**
 * Skill definition
 */
export interface Skill {
  name: string
  proficiency: number         // 0..1 (0 = novice, 1 = master)
  experience: number          // Total practice time/count
  lastPracticed: number       // Timestamp of last practice
  learningRate: number        // How fast this skill is learned (0..1)
  decayRate: number           // How fast this skill decays (0..1)
  relatedSkills?: string[]    // Skills that boost this one
}

/**
 * Skill system configuration
 */
export interface SkillConfig {
  defaultLearningRate?: number
  defaultDecayRate?: number
  practiceBonus?: number      // Bonus per practice session
  relatedSkillBonus?: number  // Bonus from related skills
}

/**
 * Skill system
 * Manages skill acquisition and development
 */
export class SkillSystem {
  private skills: Map<string, Skill> = new Map()
  private config: Required<SkillConfig>

  constructor(config: SkillConfig = {}) {
    this.config = {
      defaultLearningRate: config.defaultLearningRate ?? 0.1,
      defaultDecayRate: config.defaultDecayRate ?? 0.001,
      practiceBonus: config.practiceBonus ?? 0.05,
      relatedSkillBonus: config.relatedSkillBonus ?? 0.02
    }
  }

  /**
   * Add or update skill
   */
  addSkill(name: string, options: Partial<Skill> = {}): Skill {
    const existing = this.skills.get(name)

    if (existing) {
      // Update existing skill
      Object.assign(existing, options)
      return existing
    }

    // Create new skill
    const skill: Skill = {
      name,
      proficiency: options.proficiency ?? 0,
      experience: options.experience ?? 0,
      lastPracticed: options.lastPracticed ?? Date.now(),
      learningRate: options.learningRate ?? this.config.defaultLearningRate,
      decayRate: options.decayRate ?? this.config.defaultDecayRate,
      relatedSkills: options.relatedSkills
    }

    this.skills.set(name, skill)
    return skill
  }

  /**
   * Practice a skill (increase proficiency)
   */
  practice(name: string, intensity: number = 1): boolean {
    const skill = this.skills.get(name)
    if (!skill) return false

    const now = Date.now()

    // Learning curve (diminishing returns at higher proficiency)
    const learningFactor = (1 - skill.proficiency) * skill.learningRate
    const gain = learningFactor * intensity * this.config.practiceBonus

    // Bonus from related skills
    let relatedBonus = 0
    if (skill.relatedSkills) {
      for (const relatedName of skill.relatedSkills) {
        const related = this.skills.get(relatedName)
        if (related) {
          relatedBonus += related.proficiency * this.config.relatedSkillBonus
        }
      }
    }

    // Update skill
    skill.proficiency = Math.min(1, skill.proficiency + gain + relatedBonus)
    skill.experience += intensity
    skill.lastPracticed = now

    return true
  }

  /**
   * Apply skill decay (forgetting)
   */
  applyDecay(dt: number): void {
    const now = Date.now()

    for (const skill of this.skills.values()) {
      const timeSinceLastPractice = (now - skill.lastPracticed) / 86400000  // days

      // Exponential decay (slower at higher proficiency - "it's like riding a bike")
      const decayFactor = skill.decayRate * (1 - skill.proficiency * 0.5)
      const decay = decayFactor * timeSinceLastPractice * dt

      skill.proficiency = Math.max(0, skill.proficiency - decay)
    }
  }

  /**
   * Get skill level (novice → master)
   */
  getSkillLevel(name: string): SkillLevel | null {
    const skill = this.skills.get(name)
    if (!skill) return null

    if (skill.proficiency >= 0.9) return 'master'
    if (skill.proficiency >= 0.7) return 'expert'
    if (skill.proficiency >= 0.5) return 'proficient'
    if (skill.proficiency >= 0.3) return 'competent'
    return 'novice'
  }

  /**
   * Get skill
   */
  getSkill(name: string): Skill | null {
    return this.skills.get(name) || null
  }

  /**
   * Get all skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  /**
   * Get top skills (sorted by proficiency)
   */
  getTopSkills(limit: number = 5): Skill[] {
    return Array.from(this.skills.values())
      .sort((a, b) => b.proficiency - a.proficiency)
      .slice(0, limit)
  }

  /**
   * Check if has skill at minimum level
   */
  hasSkill(name: string, minProficiency: number = 0.3): boolean {
    const skill = this.skills.get(name)
    return skill ? skill.proficiency >= minProficiency : false
  }

  /**
   * Remove skill
   */
  removeSkill(name: string): boolean {
    return this.skills.delete(name)
  }

  /**
   * Clear all skills
   */
  clear(): void {
    this.skills.clear()
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      skills: Array.from(this.skills.entries())
    }
  }

  /**
   * Restore from JSON
   */
  static fromJSON(data: ReturnType<SkillSystem['toJSON']>): SkillSystem {
    const system = new SkillSystem()
    system.skills = new Map(data.skills)
    return system
  }
}

/**
 * Helper: Create skill
 */
export function createSkill(
  name: string,
  learningRate: number = 0.1,
  relatedSkills?: string[]
): Skill {
  return {
    name,
    proficiency: 0,
    experience: 0,
    lastPracticed: Date.now(),
    learningRate,
    decayRate: 0.001,
    relatedSkills
  }
}

/**
 * Common skill presets
 */
export const SKILL_PRESETS = {
  // Social skills
  communication: createSkill('communication', 0.15, ['empathy', 'listening']),
  empathy: createSkill('empathy', 0.12),
  persuasion: createSkill('persuasion', 0.08, ['communication']),

  // Cognitive skills
  problem_solving: createSkill('problem_solving', 0.1, ['pattern_recognition']),
  pattern_recognition: createSkill('pattern_recognition', 0.12),
  memory: createSkill('memory', 0.1),

  // Physical skills (in abstract sense)
  navigation: createSkill('navigation', 0.13, ['spatial_awareness']),
  spatial_awareness: createSkill('spatial_awareness', 0.11),

  // Creative skills
  creativity: createSkill('creativity', 0.09),
  adaptation: createSkill('adaptation', 0.11, ['flexibility']),
  flexibility: createSkill('flexibility', 0.1)
} as const
