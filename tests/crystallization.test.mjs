/**
 * MDS v5.2 - Memory Crystallization Tests
 * Test long-term memory consolidation system
 */

import assert from 'node:assert'
import {
  createMemory,
  MemoryCrystallizer,
  createCrystallizer,
  crystallizeMemories
} from '../dist/mds-core.esm.js'

console.log('\n💎 MDS v5.2 - Memory Crystallization Tests\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`✗ ${name}`)
    console.error(`  ${err.message}`)
    failed++
  }
}

// Test 1: MemoryCrystallizer instantiation
test('MemoryCrystallizer instantiation', () => {
  const crystallizer = new MemoryCrystallizer()
  assert(crystallizer.count() === 0, 'Should start with 0 crystals')
})

// Test 2: Create crystallizer with config
test('Create crystallizer with custom config', () => {
  const crystallizer = createCrystallizer({
    minOccurrences: 5,
    minStrength: 2.0,
    maxCrystals: 100
  })
  assert(crystallizer.count() === 0, 'Should start empty')
})

// Test 3: Crystallize - insufficient memories
test('Crystallize - insufficient memories (below threshold)', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = [
    createMemory({ timestamp: 0, type: 'interaction', subject: 'entity1', salience: 0.5 }),
    createMemory({ timestamp: 1, type: 'interaction', subject: 'entity1', salience: 0.5 })
  ]

  const crystals = crystallizer.crystallize(memories, 10)

  assert(crystals.length === 0, 'Should not crystallize with only 2 memories (min: 3)')
})

// Test 4: Crystallize - meets threshold
test('Crystallize - meets threshold', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = [
    createMemory({ timestamp: 0, type: 'interaction', subject: 'entity1', salience: 0.6 }),
    createMemory({ timestamp: 1, type: 'interaction', subject: 'entity1', salience: 0.6 }),
    createMemory({ timestamp: 2, type: 'interaction', subject: 'entity1', salience: 0.6 })
  ]

  const crystals = crystallizer.crystallize(memories, 10)

  assert(crystals.length === 1, 'Should form 1 crystal')
  assert(crystals[0].subject === 'entity1', 'Crystal should have correct subject')
  assert(crystals[0].type === 'interaction', 'Crystal should have correct type')
  assert(crystals[0].count === 3, 'Crystal should contain 3 memories')
})

// Test 5: Crystal strength calculation
test('Crystal strength calculation', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = [
    createMemory({ timestamp: 0, type: 'interaction', subject: 'friend', salience: 0.7 }),
    createMemory({ timestamp: 1, type: 'interaction', subject: 'friend', salience: 0.8 }),
    createMemory({ timestamp: 2, type: 'interaction', subject: 'friend', salience: 0.9 })
  ]

  crystallizer.crystallize(memories, 10)

  const strength = crystallizer.getCrystalStrength('friend')
  assert(strength > 0.7 && strength <= 1, `Crystal strength should be high (got ${strength})`)
})

// Test 6: Multiple subjects
test('Multiple subjects create separate crystals', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = [
    createMemory({ timestamp: 0, type: 'interaction', subject: 'entity1', salience: 0.6 }),
    createMemory({ timestamp: 1, type: 'interaction', subject: 'entity1', salience: 0.6 }),
    createMemory({ timestamp: 2, type: 'interaction', subject: 'entity1', salience: 0.6 }),
    createMemory({ timestamp: 3, type: 'interaction', subject: 'entity2', salience: 0.6 }),
    createMemory({ timestamp: 4, type: 'interaction', subject: 'entity2', salience: 0.6 }),
    createMemory({ timestamp: 5, type: 'interaction', subject: 'entity2', salience: 0.6 })
  ]

  const crystals = crystallizer.crystallize(memories, 10)

  assert(crystals.length === 2, 'Should form 2 crystals (one per subject)')
  assert(crystallizer.getCrystalsBySubject('entity1').length === 1, 'Entity1 should have 1 crystal')
  assert(crystallizer.getCrystalsBySubject('entity2').length === 1, 'Entity2 should have 1 crystal')
})

// Test 7: Crystal reinforcement
test('Crystal reinforcement (repeated crystallization)', () => {
  const crystallizer = new MemoryCrystallizer()

  // First batch
  const batch1 = [
    createMemory({ timestamp: 0, type: 'interaction', subject: 'friend', salience: 0.6 }),
    createMemory({ timestamp: 1, type: 'interaction', subject: 'friend', salience: 0.6 }),
    createMemory({ timestamp: 2, type: 'interaction', subject: 'friend', salience: 0.6 })
  ]

  crystallizer.crystallize(batch1, 10)
  const initialCount = crystallizer.getCrystalsBySubject('friend')[0].count

  // Second batch (reinforcement)
  const batch2 = [
    createMemory({ timestamp: 10, type: 'interaction', subject: 'friend', salience: 0.7 }),
    createMemory({ timestamp: 11, type: 'interaction', subject: 'friend', salience: 0.7 }),
    createMemory({ timestamp: 12, type: 'interaction', subject: 'friend', salience: 0.7 })
  ]

  crystallizer.crystallize(batch2, 20)

  const reinforcedCount = crystallizer.getCrystalsBySubject('friend')[0].count

  assert(reinforcedCount > initialCount, 'Crystal should be reinforced (count increased)')
  assert(crystallizer.getAllCrystals().length === 1, 'Should still be only 1 crystal (same subject/type)')
})

// Test 8: Pattern identification
test('Pattern identification (repeated vs frequent)', () => {
  const crystallizer = new MemoryCrystallizer()

  // Repeated pattern (5 memories)
  const repeatedMemories = Array.from({ length: 5 }, (_, i) =>
    createMemory({ timestamp: i, type: 'observation', subject: 'world', salience: 0.6 })
  )

  const crystals1 = crystallizer.crystallize(repeatedMemories, 10)
  assert(crystals1[0].pattern === 'repeated_observation', 'Should identify as repeated pattern')

  // Frequent pattern (10+ memories)
  const frequentMemories = Array.from({ length: 10 }, (_, i) =>
    createMemory({ timestamp: i, type: 'emotion', subject: 'self', salience: 0.5 })
  )

  const crystals2 = crystallizer.crystallize(frequentMemories, 20)
  assert(crystals2[0].pattern === 'frequent_emotion', 'Should identify as frequent pattern')
})

// Test 9: Essence generation
test('Essence generation', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = [
    createMemory({ timestamp: 0, type: 'interaction', subject: 'ghost', salience: 0.6 }),
    createMemory({ timestamp: 1, type: 'interaction', subject: 'ghost', salience: 0.6 }),
    createMemory({ timestamp: 2, type: 'interaction', subject: 'ghost', salience: 0.6 })
  ]

  const crystals = crystallizer.crystallize(memories, 10)

  assert(crystals[0].essence.includes('ghost'), 'Essence should mention subject')
  assert(crystals[0].essence.includes('3'), 'Essence should mention count')
})

// Test 10: Get crystals by type
test('Get crystals by type', () => {
  const crystallizer = new MemoryCrystallizer()

  const interactions = Array.from({ length: 3 }, (_, i) =>
    createMemory({ timestamp: i, type: 'interaction', subject: 'e1', salience: 0.6 })
  )

  const emotions = Array.from({ length: 3 }, (_, i) =>
    createMemory({ timestamp: i, type: 'emotion', subject: 'e2', salience: 0.6 })
  )

  crystallizer.crystallize([...interactions, ...emotions], 10)

  const interactionCrystals = crystallizer.getCrystalsByType('interaction')
  const emotionCrystals = crystallizer.getCrystalsByType('emotion')

  assert(interactionCrystals.length === 1, 'Should have 1 interaction crystal')
  assert(emotionCrystals.length === 1, 'Should have 1 emotion crystal')
})

// Test 11: hasCrystals check
test('hasCrystals check', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = Array.from({ length: 3 }, (_, i) =>
    createMemory({ timestamp: i, type: 'interaction', subject: 'friend', salience: 0.6 })
  )

  assert(crystallizer.hasCrystals('friend') === false, 'Should not have crystals initially')

  crystallizer.crystallize(memories, 10)

  assert(crystallizer.hasCrystals('friend') === true, 'Should have crystals after crystallization')
  assert(crystallizer.hasCrystals('stranger') === false, 'Should not have crystals for unknown subject')
})

// Test 12: Max crystals limit
test('Max crystals limit (pruning)', () => {
  const crystallizer = new MemoryCrystallizer({ maxCrystals: 3 })

  // Create 4 different crystal groups
  for (let i = 0; i < 4; i++) {
    const memories = Array.from({ length: 3 }, (_, j) =>
      createMemory({ timestamp: j, type: 'interaction', subject: `entity${i}`, salience: i === 3 ? 0.9 : 0.6 })
    )
    crystallizer.crystallize(memories, 10)
  }

  assert(crystallizer.count() === 3, 'Should enforce max crystal limit (3)')
  assert(crystallizer.hasCrystals('entity3') === true, 'Strongest crystal should remain')
})

// Test 13: Clear crystals
test('Clear crystals', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = Array.from({ length: 3 }, (_, i) =>
    createMemory({ timestamp: i, type: 'interaction', subject: 'e1', salience: 0.6 })
  )

  crystallizer.crystallize(memories, 10)
  assert(crystallizer.count() > 0, 'Should have crystals')

  crystallizer.clear()
  assert(crystallizer.count() === 0, 'Should have no crystals after clear')
})

// Test 14: Serialization (toJSON/fromJSON)
test('Serialization (toJSON/fromJSON)', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = Array.from({ length: 3 }, (_, i) =>
    createMemory({ timestamp: i, type: 'interaction', subject: 'friend', salience: 0.6 })
  )

  crystallizer.crystallize(memories, 10)

  const json = crystallizer.toJSON()
  const restored = MemoryCrystallizer.fromJSON(json)

  assert(restored.count() === crystallizer.count(), 'Restored should have same count')
  assert(restored.hasCrystals('friend'), 'Restored should have same crystals')
})

// Test 15: crystallizeMemories helper
test('crystallizeMemories helper', () => {
  const memories = Array.from({ length: 3 }, (_, i) =>
    createMemory({ timestamp: i, type: 'observation', subject: 'world', salience: 0.6 })
  )

  const result = crystallizeMemories(memories, 10)

  assert(result.crystals.length === 1, 'Should form 1 crystal')
  assert(typeof result.summary === 'string', 'Should return summary string')
  assert(result.summary.includes('crystal'), 'Summary should mention crystal')
})

// Test 16: Insufficient strength (high occurrence, low salience)
test('Insufficient strength (high occurrence, low salience)', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = Array.from({ length: 10 }, (_, i) =>
    createMemory({ timestamp: i, type: 'interaction', subject: 'weak', salience: 0.1 }) // Low salience
  )

  const crystals = crystallizer.crystallize(memories, 10)

  assert(crystals.length === 0, 'Should not crystallize low-salience memories despite high count')
})

// Test 17: Metadata extraction (numeric values)
test('Metadata extraction (numeric average)', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = [
    createMemory({ timestamp: 0, type: 'interaction', subject: 'e1', content: { distance: 10 }, salience: 0.6 }),
    createMemory({ timestamp: 1, type: 'interaction', subject: 'e1', content: { distance: 20 }, salience: 0.6 }),
    createMemory({ timestamp: 2, type: 'interaction', subject: 'e1', content: { distance: 30 }, salience: 0.6 })
  ]

  const crystals = crystallizer.crystallize(memories, 10)

  assert(crystals[0].metadata.distance === 20, 'Should average numeric metadata (got ' + crystals[0].metadata.distance + ')')
})

// Test 18: Metadata extraction (most common value)
test('Metadata extraction (most common value)', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = [
    createMemory({ timestamp: 0, type: 'interaction', subject: 'e1', content: { action: 'wave' }, salience: 0.6 }),
    createMemory({ timestamp: 1, type: 'interaction', subject: 'e1', content: { action: 'wave' }, salience: 0.6 }),
    createMemory({ timestamp: 2, type: 'interaction', subject: 'e1', content: { action: 'nod' }, salience: 0.6 })
  ]

  const crystals = crystallizer.crystallize(memories, 10)

  assert(crystals[0].metadata.action === 'wave', 'Should use most common value for non-numeric metadata')
})

// Test 19: Get crystal by ID
test('Get crystal by ID', () => {
  const crystallizer = new MemoryCrystallizer()

  const memories = Array.from({ length: 3 }, (_, i) =>
    createMemory({ timestamp: i, type: 'interaction', subject: 'e1', salience: 0.6 })
  )

  const crystals = crystallizer.crystallize(memories, 10)
  const crystalId = crystals[0].id

  const retrieved = crystallizer.getCrystal(crystalId)

  assert(retrieved !== undefined, 'Should retrieve crystal by ID')
  assert(retrieved.id === crystalId, 'Retrieved crystal should have correct ID')
})

// Test 20: Empty memories (no crash)
test('Empty memories (no crash)', () => {
  const crystallizer = new MemoryCrystallizer()

  const crystals = crystallizer.crystallize([], 10)

  assert(crystals.length === 0, 'Should return empty array for empty input')
  assert(crystallizer.count() === 0, 'Should have no crystals')
})

// Summary
console.log('\n==================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('==================================================\n')

if (failed > 0) {
  console.error('❌ Crystallization tests failed!')
  process.exit(1)
} else {
  console.log('✅ All crystallization tests passed!\n')
  console.log('v5.2 Phase 2.2 Status:')
  console.log('  ✓ Memory crystallization (pattern consolidation)')
  console.log('  ✓ Crystal reinforcement (repeated patterns)')
  console.log('  ✓ Pattern identification (occasional/repeated/frequent)')
  console.log('  ✓ Essence generation (human-readable summaries)')
  console.log('  ✓ Metadata extraction (numeric averages, common values)')
  console.log('  ✓ Crystal pruning (max size limit)')
  console.log('  ✓ Serialization (save/load support)')
}
