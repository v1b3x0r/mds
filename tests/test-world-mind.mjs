#!/usr/bin/env node

/**
 * MDS v5 Phase 8 Test Suite: World Mind & Collective Intelligence
 *
 * Tests CollectiveIntelligence static methods directly (no DOM dependency)
 */

import { CollectiveIntelligence } from '../dist/mds-core.esm.js'

console.log('🧪 MDS v5 Phase 8: World Mind & Collective Intelligence\n')

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

// Mock entity factory
function createMockEntity(props = {}) {
  return {
    id: `e_${Math.random().toString(36).slice(2, 9)}`,
    m: { material: props.material || 'test', essence: props.essence || 'test entity' },
    x: props.x || 0,
    y: props.y || 0,
    vx: props.vx || 0,
    vy: props.vy || 0,
    age: props.age || 0,
    energy: props.energy || 100,
    entropy: props.entropy || 0.5,
    temperature: props.temperature,
    memory: props.memory,
    emotion: props.emotion,
    learning: props.learning,
    skills: props.skills,
    inbox: props.inbox,
    outbox: props.outbox,
    ...props
  }
}

// Mock memory buffer
function createMockMemory(count) {
  return {
    count: () => count,
    getAll: () => Array(count).fill({ timestamp: Date.now(), type: 'observation', subject: 'test', content: 'data', salience: 0.8 })
  }
}

// Mock skill system
function createMockSkills(skills = []) {
  return {
    getAllSkills: () => skills.map(s => ({ name: s.name, proficiency: s.proficiency }))
  }
}

// ============================================================================
// World Stats Tests
// ============================================================================

console.log('📊 World Statistics\n')

// Test: Basic stats calculation
const entities1 = [
  createMockEntity({ age: 5, energy: 80, entropy: 0.3 }),
  createMockEntity({ age: 10, energy: 60, entropy: 0.7 }),
  createMockEntity({ age: 15, energy: 40, entropy: 0.5 })
]

const stats1 = CollectiveIntelligence.calculateStats(entities1)
assert(stats1.entityCount === 3, 'Stats: entity count')
assert(stats1.avgAge === 10, `Stats: avg age (expected 10, got ${stats1.avgAge})`)
assert(stats1.avgEnergy === 60, `Stats: avg energy (expected 60, got ${stats1.avgEnergy})`)
assert(stats1.avgEntropy === 0.5, `Stats: avg entropy (expected 0.5, got ${stats1.avgEntropy})`)

// Test: Empty entities
const stats2 = CollectiveIntelligence.calculateStats([])
assert(stats2.entityCount === 0, 'Stats: empty entities count')
assert(stats2.avgAge === 0, 'Stats: empty entities avg age')

// Test: Ontology stats
const entities2 = [
  createMockEntity({
    memory: createMockMemory(5),
    emotion: { valence: 0.8, arousal: 0.6, dominance: 0.7 }
  }),
  createMockEntity({
    memory: createMockMemory(3),
    emotion: { valence: 0.4, arousal: 0.2, dominance: 0.3 }
  })
]

const stats3 = CollectiveIntelligence.calculateStats(entities2)
assert(stats3.totalMemories === 8, `Stats: total memories (expected 8, got ${stats3.totalMemories})`)
assert(Math.abs(stats3.avgEmotionalValence - 0.6) < 0.001, `Stats: avg valence (expected 0.6, got ${stats3.avgEmotionalValence})`)
assert(Math.abs(stats3.avgEmotionalArousal - 0.4) < 0.001, `Stats: avg arousal (expected 0.4, got ${stats3.avgEmotionalArousal})`)

// Test: Physics stats
const entities3 = [
  createMockEntity({ temperature: 30, vx: 10, vy: 0 }),
  createMockEntity({ temperature: 20, vx: 0, vy: 10 })
]

const stats4 = CollectiveIntelligence.calculateStats(entities3)
assert(stats4.avgTemperature === 25, `Stats: avg temperature (expected 25, got ${stats4.avgTemperature})`)
assert(stats4.avgVelocity === 10, `Stats: avg velocity (expected 10, got ${stats4.avgVelocity})`)

// Test: Cognitive stats
const entities4 = [
  createMockEntity({
    learning: {
      getStats: () => ({ totalExperiences: 2, successRate: 1, avgReward: 0.8, patternsDetected: 1 })
    },
    skills: createMockSkills([
      { name: 'empathy', proficiency: 0.8 },
      { name: 'pattern_recognition', proficiency: 0.6 }
    ])
  }),
  createMockEntity({
    learning: {
      getStats: () => ({ totalExperiences: 1, successRate: 1, avgReward: 0.5, patternsDetected: 0 })
    },
    skills: createMockSkills([
      { name: 'empathy', proficiency: 0.4 }
    ])
  })
]

const stats5 = CollectiveIntelligence.calculateStats(entities4)
assert(stats5.totalExperiences === 3, `Stats: total experiences (expected 3, got ${stats5.totalExperiences})`)
assert(stats5.avgSkillProficiency === 0.6, `Stats: avg skill proficiency (expected 0.6, got ${stats5.avgSkillProficiency})`)

// Test: Communication stats
const entities5 = [
  createMockEntity({
    inbox: { size: () => 2 }
  }),
  createMockEntity({
    inbox: { size: () => 1 }
  })
]

const stats6 = CollectiveIntelligence.calculateStats(entities5)
assert(stats6.totalMessages === 3, `Stats: total messages (expected 3, got ${stats6.totalMessages})`)

// ============================================================================
// Pattern Detection Tests
// ============================================================================

console.log('\n🔍 Pattern Detection\n')

// Test: Clustering detection
const clustered = [
  createMockEntity({ x: 100, y: 100 }),
  createMockEntity({ x: 105, y: 105 }),
  createMockEntity({ x: 110, y: 110 })
]

const patterns1 = CollectiveIntelligence.detectPatterns(clustered)
const clustering = patterns1.find(p => p.pattern === 'clustering')
assert(clustering !== undefined, 'Pattern: clustering detected')
assert(clustering && clustering.strength > 0.5, `Pattern: clustering strength > 0.5 (got ${clustering?.strength})`)
assert(clustering && clustering.entities.length === 3, 'Pattern: clustering includes all entities')

// Test: Synchronization detection
const synchronized = [
  createMockEntity({ vx: 10, vy: 5 }),
  createMockEntity({ vx: 10, vy: 5 }),
  createMockEntity({ vx: 10, vy: 5 })
]

const patterns2 = CollectiveIntelligence.detectPatterns(synchronized)
const sync = patterns2.find(p => p.pattern === 'synchronization')
assert(sync !== undefined, 'Pattern: synchronization detected')
assert(sync && sync.strength > 0.95, `Pattern: synchronization strength > 0.95 (got ${sync?.strength})`)

// Test: Stillness detection
const still = [
  createMockEntity({ vx: 0, vy: 0 }),
  createMockEntity({ vx: 0, vy: 0 })
]

const patterns3 = CollectiveIntelligence.detectPatterns(still)
const stillness = patterns3.find(p => p.pattern === 'stillness')
assert(stillness !== undefined, 'Pattern: stillness detected')
assert(stillness && stillness.strength === 1, `Pattern: stillness strength = 1 (got ${stillness?.strength})`)

// Test: No patterns (dispersed, moving in different directions)
const dispersed = [
  createMockEntity({ x: 0, y: 0, vx: 10, vy: 0 }),
  createMockEntity({ x: 500, y: 500, vx: -5, vy: 8 })
]

const patterns4 = CollectiveIntelligence.detectPatterns(dispersed)
const noClustering = patterns4.find(p => p.pattern === 'clustering')
const noSync = patterns4.find(p => p.pattern === 'synchronization')
assert(noClustering === undefined, 'Pattern: no clustering when dispersed')
assert(noSync === undefined, 'Pattern: no synchronization when different directions')

// Test: Edge case - too few entities for clustering
const tooFew = [
  createMockEntity({ x: 100, y: 100 }),
  createMockEntity({ x: 105, y: 105 })
]

const patterns5 = CollectiveIntelligence.detectPatterns(tooFew)
const noClusteringFew = patterns5.find(p => p.pattern === 'clustering')
assert(noClusteringFew === undefined, 'Pattern: no clustering with < 3 entities')

// ============================================================================
// Collective Emotion Tests
// ============================================================================

console.log('\n💭 Collective Emotion\n')

// Test: Collective emotion calculation
const withEmotion = [
  createMockEntity({ emotion: { valence: 0.8, arousal: 0.6, dominance: 0.7 } }),
  createMockEntity({ emotion: { valence: 0.6, arousal: 0.4, dominance: 0.5 } }),
  createMockEntity({ emotion: { valence: 0.4, arousal: 0.2, dominance: 0.3 } })
]

const collective1 = CollectiveIntelligence.calculateCollectiveEmotion(withEmotion)
assert(collective1 !== null, 'Collective emotion: calculated')
assert(Math.abs(collective1.valence - 0.6) < 0.001, `Collective emotion: valence (expected 0.6, got ${collective1.valence})`)
assert(Math.abs(collective1.arousal - 0.4) < 0.001, `Collective emotion: arousal (expected 0.4, got ${collective1.arousal})`)
assert(Math.abs(collective1.dominance - 0.5) < 0.001, `Collective emotion: dominance (expected 0.5, got ${collective1.dominance})`)

// Test: No collective emotion when no entities have emotion
const noEmotion = [
  createMockEntity({}),
  createMockEntity({})
]

const collective2 = CollectiveIntelligence.calculateCollectiveEmotion(noEmotion)
assert(collective2 === null, 'Collective emotion: null when no emotions')

// Test: Partial emotions
const partialEmotion = [
  createMockEntity({ emotion: { valence: 1, arousal: 1, dominance: 1 } }),
  createMockEntity({})  // No emotion
]

const collective3 = CollectiveIntelligence.calculateCollectiveEmotion(partialEmotion)
assert(collective3 !== null, 'Collective emotion: calculated with partial')
assert(collective3.valence === 1, 'Collective emotion: ignores entities without emotion')

// ============================================================================
// Summary
// ============================================================================

console.log(`\n📊 Results: ${passed}/${passed + failed} tests passed`)

if (failed > 0) {
  console.log(`\n❌ ${failed} test(s) failed`)
  process.exit(1)
} else {
  console.log('\n✅ All tests passed!')
}
