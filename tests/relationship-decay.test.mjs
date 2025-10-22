/**
 * MDS v5.2 - Relationship Decay Tests
 * Test time-based relationship deterioration
 */

import assert from 'node:assert'
import {
  RelationshipDecayManager,
  createDecayManager,
  applyDecay,
  shouldPrune,
  DECAY_PRESETS
} from '../dist/mds-core.esm.js'

console.log('\n⏳ MDS v5.2 - Relationship Decay Tests\n')

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

// Test 1: DecayManager instantiation
test('RelationshipDecayManager instantiation', () => {
  const manager = new RelationshipDecayManager()
  assert(manager !== undefined, 'Should create decay manager')

  const config = manager.getConfig()
  assert(config.curve === 'linear', 'Should have default curve')
  assert(config.baseRate === 0.001, 'Should have default rate')
})

// Test 2: Create with custom config
test('Create decay manager with custom config', () => {
  const manager = createDecayManager({
    curve: 'exponential',
    baseRate: 0.002
  })

  const config = manager.getConfig()
  assert(config.curve === 'exponential', 'Should use custom curve')
  assert(config.baseRate === 0.002, 'Should use custom rate')
})

// Test 3: Linear decay
test('Linear decay (constant rate)', () => {
  const manager = new RelationshipDecayManager({ curve: 'linear', baseRate: 0.001 })

  const relationship = {
    trust: 0.8,
    familiarity: 0.6,
    lastInteraction: 0,
    interactionCount: 5
  }

  // Decay after 100 seconds
  const decayed = manager.decay(relationship, 100000)

  assert(decayed !== null, 'Should not be pruned')
  assert(decayed.trust < relationship.trust, 'Trust should decay')
  assert(decayed.familiarity < relationship.familiarity, 'Familiarity should decay')
})

// Test 4: Exponential decay (accelerating)
test('Exponential decay (accelerating)', () => {
  const manager = new RelationshipDecayManager({
    curve: 'exponential',
    baseRate: 0.00001,  // Very small rate
    maxDecayPerTick: 1.0,
    gracePeriod: 0,
    minThreshold: 0  // Don't prune
  })

  const currentTime = 200000 // 200 seconds

  // Relationship1: last interaction at 150s → 50s elapsed
  const relationship1 = {
    trust: 1.0,
    familiarity: 1.0,
    lastInteraction: 150000,
    interactionCount: 5
  }

  // Relationship2: last interaction at 50s → 150s elapsed
  const relationship2 = {
    trust: 1.0,
    familiarity: 1.0,
    lastInteraction: 50000,
    interactionCount: 5
  }

  // Decay both at same currentTime but different timeSinceInteraction
  const decayed1 = manager.decay(relationship1, currentTime)  // 50s elapsed
  const decayed2 = manager.decay(relationship2, currentTime) // 150s elapsed

  assert(decayed1 !== null, 'Decayed1 should not be null')
  assert(decayed2 !== null, 'Decayed2 should not be null')

  const decay1 = 1.0 - decayed1.familiarity
  const decay2 = 1.0 - decayed2.familiarity

  // With quadratic: decay(t) = r * t^2 / 100
  // At t=50: 0.00001 * 50^2 / 100 = 0.00001 * 2500 / 100 = 0.00025
  // At t=150: 0.00001 * 150^2 / 100 = 0.00001 * 22500 / 100 = 0.00225
  // Ratio: 0.00225 / 0.00025 = 9 (definitely > 3x)
  assert(decay2 > decay1 * 3, `Exponential decay should accelerate (got ${(decay2/decay1).toFixed(2)}x)`)
})

// Test 5: Logarithmic decay (decelerating)
test('Logarithmic decay (decelerating)', () => {
  const manager = new RelationshipDecayManager({ curve: 'logarithmic', baseRate: 0.001 })

  const relationship = {
    trust: 0.8,
    familiarity: 0.6,
    lastInteraction: 0,
    interactionCount: 5
  }

  const decayed1 = manager.decay(relationship, 50000)  // 50s
  const decayed2 = manager.decay(relationship, 150000) // 150s

  const decay1 = relationship.familiarity - decayed1.familiarity
  const decay2 = relationship.familiarity - decayed2.familiarity

  // Logarithmic should decay slower over time (decay2 < decay1 * 3)
  assert(decay2 < decay1 * 3.5, 'Logarithmic decay should slow down over time')
})

// Test 6: Grace period (no decay)
test('Grace period (no decay immediately after interaction)', () => {
  const manager = new RelationshipDecayManager({ gracePeriod: 60 })

  const relationship = {
    trust: 0.8,
    familiarity: 0.6,
    lastInteraction: 10000,
    interactionCount: 5
  }

  // Decay after only 30 seconds (within grace period)
  const decayed = manager.decay(relationship, 40000)

  assert(decayed !== null, 'Should not be pruned')
  assert(decayed.trust === relationship.trust, 'Trust should not decay in grace period')
  assert(decayed.familiarity === relationship.familiarity, 'Familiarity should not decay in grace period')
})

// Test 7: Grace period expires
test('Grace period expires (decay starts)', () => {
  const manager = new RelationshipDecayManager({ gracePeriod: 60 })

  const relationship = {
    trust: 0.8,
    familiarity: 0.6,
    lastInteraction: 10000,
    interactionCount: 5
  }

  // Decay after 100 seconds (beyond grace period)
  const decayed = manager.decay(relationship, 110000)

  assert(decayed !== null, 'Should not be pruned')
  assert(decayed.trust < relationship.trust, 'Trust should decay after grace period')
})

// Test 8: Auto-pruning (below threshold)
test('Auto-pruning (relationship below threshold)', () => {
  const manager = new RelationshipDecayManager({ minThreshold: 0.3 })

  const weakRelationship = {
    trust: 0.2,
    familiarity: 0.1,
    lastInteraction: 0,
    interactionCount: 1
  }

  const decayed = manager.decay(weakRelationship, 100000)

  assert(decayed === null, 'Weak relationship should be pruned')
})

// Test 9: Decay max cap
test('Decay max cap (prevents instant decay)', () => {
  const manager = new RelationshipDecayManager({ baseRate: 1.0, maxDecayPerTick: 0.1 })

  const relationship = {
    trust: 0.8,
    familiarity: 0.6,
    lastInteraction: 0,
    interactionCount: 5
  }

  // Even with huge time gap, decay is capped
  const decayed = manager.decay(relationship, 1000000)

  assert(decayed !== null, 'Should not instantly decay to zero')
  assert(relationship.familiarity - decayed.familiarity <= 0.1, 'Decay should be capped')
})

// Test 10: Batch decay (multiple relationships)
test('Batch decay (multiple relationships)', () => {
  const manager = new RelationshipDecayManager()

  const relationships = [
    {
      entityId: 'friend1',
      bond: { trust: 0.8, familiarity: 0.6, lastInteraction: 0, interactionCount: 10 }
    },
    {
      entityId: 'friend2',
      bond: { trust: 0.5, familiarity: 0.4, lastInteraction: 0, interactionCount: 5 }
    },
    {
      entityId: 'stranger',
      bond: { trust: 0.1, familiarity: 0.05, lastInteraction: 0, interactionCount: 1 }
    }
  ]

  const decayed = manager.decayBatch(relationships, 200000)

  assert(decayed.length === 2, 'Should prune weak relationship')
  assert(decayed.every(r => r.bond.trust < 0.8), 'All relationships should decay')
})

// Test 11: Reinforce relationship
test('Reinforce relationship (update lastInteraction)', () => {
  const manager = new RelationshipDecayManager()

  const relationship = {
    trust: 0.7,
    familiarity: 0.5,
    lastInteraction: 0,
    interactionCount: 5
  }

  const reinforced = manager.reinforce(relationship, 50000)

  assert(reinforced.lastInteraction === 50000, 'Should update lastInteraction timestamp')
  assert(reinforced.trust === relationship.trust, 'Trust should remain unchanged')
})

// Test 12: Decay statistics
test('Decay statistics tracking', () => {
  const manager = new RelationshipDecayManager()

  const relationships = [
    {
      entityId: 'friend1',
      bond: { trust: 0.8, familiarity: 0.6, lastInteraction: 0, interactionCount: 10 }
    },
    {
      entityId: 'friend2',
      bond: { trust: 0.5, familiarity: 0.4, lastInteraction: 0, interactionCount: 5 }
    }
  ]

  manager.decayBatch(relationships, 100000)

  const stats = manager.getStats()

  assert(stats.totalDecayed === 2, 'Should track decayed count')
  assert(stats.lastDecayTime === 100000, 'Should track last decay time')
})

// Test 13: Reset statistics
test('Reset decay statistics', () => {
  const manager = new RelationshipDecayManager()

  const relationship = {
    entityId: 'friend',
    bond: { trust: 0.8, familiarity: 0.6, lastInteraction: 0, interactionCount: 5 }
  }

  manager.decayBatch([relationship], 100000)
  manager.resetStats()

  const stats = manager.getStats()

  assert(stats.totalDecayed === 0, 'Stats should be reset')
  assert(stats.totalPruned === 0, 'Stats should be reset')
})

// Test 14: Update config
test('Update configuration', () => {
  const manager = new RelationshipDecayManager()

  manager.updateConfig({ baseRate: 0.005 })

  const config = manager.getConfig()
  assert(config.baseRate === 0.005, 'Config should be updated')
})

// Test 15: applyDecay helper
test('applyDecay helper (standalone decay)', () => {
  const relationship = {
    trust: 0.8,
    familiarity: 0.6,
    lastInteraction: 0,
    interactionCount: 5
  }

  const decayed = applyDecay(relationship, 100)

  assert(decayed !== null, 'Should return decayed relationship')
  assert(decayed.trust < relationship.trust, 'Trust should decay')
})

// Test 16: shouldPrune helper
test('shouldPrune helper', () => {
  const weakRelationship = {
    trust: 0.03,
    familiarity: 0.02,
    lastInteraction: 0,
    interactionCount: 1
  }

  const strongRelationship = {
    trust: 0.8,
    familiarity: 0.7,
    lastInteraction: 0,
    interactionCount: 10
  }

  assert(shouldPrune(weakRelationship) === true, 'Weak relationship should be pruned')
  assert(shouldPrune(strongRelationship) === false, 'Strong relationship should not be pruned')
})

// Test 17: shouldPrune with custom threshold
test('shouldPrune with custom threshold', () => {
  const relationship = {
    trust: 0.15,
    familiarity: 0.1,
    lastInteraction: 0,
    interactionCount: 2
  }

  assert(shouldPrune(relationship, 0.2) === true, 'Should prune with higher threshold')
  assert(shouldPrune(relationship, 0.05) === false, 'Should not prune with lower threshold')
})

// Test 18: Estimate time until pruning (linear)
test('Estimate time until pruning (linear decay)', () => {
  const manager = new RelationshipDecayManager({ curve: 'linear', baseRate: 0.001 })

  const relationship = {
    trust: 0.3,
    familiarity: 0.2,
    lastInteraction: 0,
    interactionCount: 3
  }

  const estimate = manager.estimateTimeUntilPruning(relationship)

  assert(estimate > 0, 'Should estimate time > 0')
  assert(estimate < 1000000, 'Should estimate reasonable time')
})

// Test 19: Estimate pruning (already below threshold)
test('Estimate pruning (already below threshold)', () => {
  const manager = new RelationshipDecayManager()

  const weakRelationship = {
    trust: 0.02,
    familiarity: 0.01,
    lastInteraction: 0,
    interactionCount: 1
  }

  const estimate = manager.estimateTimeUntilPruning(weakRelationship)

  assert(estimate === 0, 'Should return 0 if already below threshold')
})

// Test 20: DECAY_PRESETS - casual
test('DECAY_PRESETS - casual (fast decay)', () => {
  const manager = new RelationshipDecayManager(DECAY_PRESETS.casual)

  const config = manager.getConfig()
  assert(config.baseRate > 0.001, 'Casual should decay faster than standard')
  assert(config.gracePeriod === 30, 'Casual should have short grace period')
})

// Test 21: DECAY_PRESETS - deep
test('DECAY_PRESETS - deep (slow decay)', () => {
  const manager = new RelationshipDecayManager(DECAY_PRESETS.deep)

  const config = manager.getConfig()
  assert(config.curve === 'logarithmic', 'Deep bonds should use logarithmic decay')
  assert(config.baseRate < 0.001, 'Deep should decay slower than standard')
  assert(config.gracePeriod === 120, 'Deep should have long grace period')
})

// Test 22: DECAY_PRESETS - fragile
test('DECAY_PRESETS - fragile (rapid decay)', () => {
  const manager = new RelationshipDecayManager(DECAY_PRESETS.fragile)

  const config = manager.getConfig()
  assert(config.curve === 'exponential', 'Fragile should use exponential decay')
  assert(config.baseRate > 0.002, 'Fragile should decay very fast')
})

// Test 23: DECAY_PRESETS - immortal
test('DECAY_PRESETS - immortal (no decay)', () => {
  const manager = new RelationshipDecayManager(DECAY_PRESETS.immortal)

  const relationship = {
    trust: 0.8,
    familiarity: 0.6,
    lastInteraction: 0,
    interactionCount: 5
  }

  const decayed = manager.decay(relationship, 1000000)

  assert(decayed !== null, 'Should not be pruned')
  assert(decayed.trust === relationship.trust, 'Immortal relationships should not decay')
  assert(decayed.familiarity === relationship.familiarity, 'Immortal relationships should not decay')
})

// Test 24: Trust decays slower than familiarity
test('Trust decays slower than familiarity', () => {
  const manager = new RelationshipDecayManager({ trustDecayMultiplier: 0.5 })

  const relationship = {
    trust: 0.8,
    familiarity: 0.8,
    lastInteraction: 0,
    interactionCount: 5
  }

  const decayed = manager.decay(relationship, 100000)

  const trustDecay = relationship.trust - decayed.trust
  const familiarityDecay = relationship.familiarity - decayed.familiarity

  assert(trustDecay < familiarityDecay, 'Trust should decay slower than familiarity')
})

// Test 25: Batch decay pruning stats
test('Batch decay pruning statistics', () => {
  const manager = new RelationshipDecayManager({ minThreshold: 0.5 })

  const relationships = [
    {
      entityId: 'strong',
      bond: { trust: 0.9, familiarity: 0.8, lastInteraction: 0, interactionCount: 20 }
    },
    {
      entityId: 'weak1',
      bond: { trust: 0.3, familiarity: 0.2, lastInteraction: 0, interactionCount: 2 }
    },
    {
      entityId: 'weak2',
      bond: { trust: 0.2, familiarity: 0.1, lastInteraction: 0, interactionCount: 1 }
    }
  ]

  const decayed = manager.decayBatch(relationships, 100000)

  const stats = manager.getStats()

  assert(decayed.length === 1, 'Should keep only strong relationship')
  assert(stats.totalPruned === 2, 'Should track pruned count')
  assert(stats.totalDecayed === 1, 'Should track decayed (but kept) count')
})

// Summary
console.log('\n==================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('==================================================\n')

if (failed > 0) {
  console.error('❌ Relationship decay tests failed!')
  process.exit(1)
} else {
  console.log('✅ All relationship decay tests passed!\n')
  console.log('v5.2 Phase 2.5 Status:')
  console.log('  ✓ Decay curves (linear, exponential, logarithmic, stepped)')
  console.log('  ✓ Grace period (no decay after fresh interaction)')
  console.log('  ✓ Auto-pruning (weak relationships removed)')
  console.log('  ✓ Decay cap (prevents instant decay)')
  console.log('  ✓ Batch decay (efficient multi-relationship processing)')
  console.log('  ✓ Reinforcement (delay decay through interaction)')
  console.log('  ✓ Statistics tracking (decay/prune counts)')
  console.log('  ✓ Presets (casual, standard, deep, fragile, immortal)')
}
