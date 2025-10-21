/**
 * MDS v5 Phase 7 - Cognitive Module
 * Learning, memory consolidation, and skill acquisition
 */

// Learning system
export {
  LearningSystem,
  createExperience,
  calculateReward
} from './learning'

export type {
  Experience,
  Pattern,
  LearningStats,
  LearningConfig
} from './learning'

// Memory consolidation
export {
  MemoryConsolidation,
  memorySimilarity
} from './consolidation'

export type {
  ConsolidatedMemory,
  ConsolidationConfig
} from './consolidation'

// Skill system
export {
  SkillSystem,
  createSkill,
  SKILL_PRESETS
} from './skills'

export type {
  Skill,
  SkillLevel,
  SkillConfig
} from './skills'
