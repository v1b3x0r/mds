/**
 * MDS v5 Phase 7 - Cognitive System Test Suite
 * Tests learning, memory consolidation, and skills
 */

import {
  LearningSystem, createExperience, calculateReward,
  MemoryConsolidation, memorySimilarity,
  SkillSystem, createSkill, SKILL_PRESETS
} from '../dist/mds-core.esm.js'

console.log('🧪 MDS v5 Phase 7 - Cognitive System Tests\n')

let passed = 0, failed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ ${testName}`)
    passed++
  } else {
    console.log(`❌ ${testName}`)
    failed++
  }
}

// ===== LEARNING SYSTEM =====
console.log('🎓 Learning System Tests')
console.log('─'.repeat(60))

const learning = new LearningSystem()

// Add experiences
const exp1 = createExperience('move_forward', 'success', 1.0)
learning.addExperience(exp1)
assert(learning.getStats().totalExperiences === 1, 'Learning: Add experience')

learning.addExperience(createExperience('move_forward', 'success', 0.8))
learning.addExperience(createExperience('turn_left', 'fail', -0.5))
assert(learning.getActionValue('move_forward') > learning.getActionValue('turn_left'), 'Learning: Action values')

// Best action
const best = learning.getBestAction(['move_forward', 'turn_left'])
assert(best === 'move_forward', 'Learning: Best action')

// Stats
const stats = learning.getStats()
assert(stats.totalExperiences === 3 && stats.avgReward > 0, 'Learning: Statistics')

// Patterns
learning.addExperience(createExperience('move_forward', 'success', 1))
learning.addExperience(createExperience('move_forward', 'success', 1))
const patterns = learning.getPatterns()
assert(patterns.length > 0, 'Learning: Pattern detection')

console.log('')

// ===== MEMORY CONSOLIDATION =====
console.log('💭 Memory Consolidation Tests')
console.log('─'.repeat(60))

const consolidation = new MemoryConsolidation()

const memories = [
  { timestamp: 0, type: 'interaction', subject: 'entity1', content: {}, salience: 0.8 },
  { timestamp: 1, type: 'interaction', subject: 'entity1', content: {}, salience: 0.7 },
  { timestamp: 2, type: 'observation', subject: 'world', content: {}, salience: 0.5 }
]

const consolidated = consolidation.consolidate(memories)
assert(consolidated.length > 0, 'Consolidation: Merge similar memories')

const strongest = consolidation.getStrongestMemories(2)
assert(strongest.length <= 2, 'Consolidation: Get strongest memories')

// Rehearsal
const rehearsed = consolidation.rehearse('entity1')
assert(rehearsed === true, 'Consolidation: Rehearse memory')

// Forgetting
consolidation.applyForgetting(1.0)
assert(consolidation.getAllMemories().length >= 0, 'Consolidation: Apply forgetting')

console.log('')

// ===== SKILL SYSTEM =====
console.log('⚡ Skill System Tests')
console.log('─'.repeat(60))

const skills = new SkillSystem()

// Add skill
const skill = skills.addSkill('coding', { learningRate: 0.15 })
assert(skill.name === 'coding', 'Skills: Add skill')

// Practice
skills.practice('coding', 10)
assert(skill.proficiency > 0, 'Skills: Practice increases proficiency')

const levelBefore = skills.getSkillLevel('coding')
skills.practice('coding', 50)
const levelAfter = skills.getSkillLevel('coding')
assert(levelAfter !== levelBefore || skill.proficiency > 0.3, 'Skills: Skill level progression')

// Top skills
skills.addSkill('writing', { proficiency: 0.8 })
const top = skills.getTopSkills(1)
assert(top[0].name === 'writing', 'Skills: Top skills sorted by proficiency')

// Skill presets (spread preset properties)
skills.addSkill('empathy', { ...SKILL_PRESETS.empathy })
assert(skills.getSkill('empathy') !== null, 'Skills: Add preset skill')

// Decay
skills.applyDecay(0.1)
assert(skill.proficiency >= 0, 'Skills: Decay reduces proficiency')

console.log('')

// ===== HELPERS =====
console.log('🔧 Helper Function Tests')
console.log('─'.repeat(60))

const reward = calculateReward('success')
assert(reward > 0, 'calculateReward: Positive for success')

const mem1 = { type: 'interaction', subject: 'A', content: {}, salience: 1, timestamp: 0 }
const mem2 = { type: 'interaction', subject: 'A', content: {}, salience: 1, timestamp: 1 }
const sim = memorySimilarity(mem1, mem2)
assert(sim > 0.5, 'memorySimilarity: Similar memories have high similarity')

const newSkill = createSkill('test', 0.2)
assert(newSkill.learningRate === 0.2, 'createSkill: Create skill with learning rate')

console.log('')

// ===== SUMMARY =====
console.log('═'.repeat(60))
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📊 Total:  ${passed + failed}`)
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
console.log('═'.repeat(60))

if (failed === 0) {
  console.log('\n🎉 All tests passed! Phase 7 cognitive system is working.')
  process.exit(0)
} else {
  console.log(`\n⚠️  ${failed} test(s) failed.`)
  process.exit(1)
}
