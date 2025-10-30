/**
 * MDS Layer 5.9 - Material Pressure System Test
 * Tests resource needs: depletion, critical state, emotional impact
 */

// Import MDS
import { World } from '../dist/mds-core.esm.js'

let passCount = 0
let failCount = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passCount++
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`)
    console.error(e.stack)
    failCount++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

console.log('\n🧪 MDS Layer 5.9 - Material Pressure System Test\n')

// Test 1: Entity spawns with needs from MDM
test('Entity spawns with needs from material definition', () => {
  const world = new World({
    features: {
      ontology: true,
      rendering: 'headless'
    }
  })

  const entity = world.spawn({
    essence: 'Desert Traveler',
    needs: {
      resources: [
        {
          id: 'water',
          initial: 1.0,
          depletionRate: 0.01,  // Depletes fast for testing
          criticalThreshold: 0.2,
          emotionalImpact: {
            valence: -0.5,
            arousal: 0.3,
            dominance: -0.2
          }
        }
      ]
    }
  }, { x: 100, y: 100 })

  assert(entity.needs, 'Entity should have needs')
  assert(entity.needs.size === 1, 'Entity should have 1 need')

  const waterNeed = entity.getNeed('water')
  assert(waterNeed, 'Should have water need')
  assert(waterNeed.current === 1.0, 'Initial water should be 1.0')
  assert(waterNeed.depletionRate === 0.01, 'Depletion rate should match')

  world.destroy()
})

// Test 2: Needs deplete over time
test('Needs deplete over time during tick', () => {
  const world = new World({
    features: {
      ontology: true,
      rendering: 'headless'
    }
  })

  const entity = world.spawn({
    $schema: 'v5',  // Enable ontology (emotion system)
    essence: 'Thirsty Entity',
    needs: {
      resources: [
        {
          id: 'water',
          initial: 1.0,
          depletionRate: 0.1,  // Fast depletion
          criticalThreshold: 0.2
        }
      ]
    }
  }, { x: 100, y: 100 })

  const initialWater = entity.getNeed('water').current
  assert(initialWater === 1.0, 'Initial water should be 1.0')

  // Simulate 5 seconds
  for (let i = 0; i < 5; i++) {
    entity.updateNeeds(1, i)
  }

  const afterWater = entity.getNeed('water').current
  assert(afterWater < initialWater, `Water should have depleted (${afterWater} < ${initialWater})`)
  assert(Math.abs(afterWater - 0.5) < 0.001, `After 5s at 0.1/s, water should be ~0.5 (got ${afterWater})`)

  world.destroy()
})

// Test 3: Critical needs affect emotion
test('Critical needs affect emotion (PAD model)', () => {
  const world = new World({
    features: {
      ontology: true,
      rendering: 'headless'
    }
  })

  const entity = world.spawn({
    $schema: 'v5',  // Enable ontology (emotion system)
    essence: 'Emotional Entity',
    emotion: {
      base_state: 'neutral'
    },
    needs: {
      resources: [
        {
          id: 'water',
          initial: 0.1,  // Start critical!
          depletionRate: 0.01,
          criticalThreshold: 0.2,
          emotionalImpact: {
            valence: -0.5,  // Negative pleasure
            arousal: 0.3,   // Increased arousal
            dominance: -0.2 // Decreased dominance
          }
        }
      ]
    }
  }, { x: 100, y: 100 })

  const initialValence = entity.emotion.valence

  // Simulate time (needs should affect emotion)
  for (let i = 0; i < 10; i++) {
    entity.updateNeeds(1, i)
  }

  const afterValence = entity.emotion.valence

  assert(
    afterValence < initialValence,
    `Valence should decrease when critical (${afterValence} < ${initialValence})`
  )

  world.destroy()
})

// Test 4: isCritical() detection
test('isCritical() correctly detects critical needs', () => {
  const world = new World({
    features: {
      ontology: true,
      rendering: 'headless'
    }
  })

  const entity = world.spawn({
    essence: 'Test Entity',
    needs: {
      resources: [
        {
          id: 'water',
          initial: 0.5,
          depletionRate: 0.01,
          criticalThreshold: 0.3
        },
        {
          id: 'food',
          initial: 0.1,
          depletionRate: 0.01,
          criticalThreshold: 0.2
        }
      ]
    }
  }, { x: 100, y: 100 })

  assert(!entity.isCritical('water'), 'Water at 0.5 should not be critical (threshold 0.3)')
  assert(entity.isCritical('food'), 'Food at 0.1 should be critical (threshold 0.2)')

  const critical = entity.getCriticalNeeds()
  assert(critical.length === 1, `Should have 1 critical need (got ${critical.length})`)
  assert(critical[0] === 'food', `Critical need should be food (got ${critical[0]})`)

  world.destroy()
})

// Test 5: satisfyNeed() increases level
test('satisfyNeed() increases resource level', () => {
  const world = new World({
    features: {
      ontology: true,
      rendering: 'headless'
    }
  })

  const entity = world.spawn({
    essence: 'Test Entity',
    needs: {
      resources: [
        {
          id: 'water',
          initial: 0.3,
          depletionRate: 0.01,
          criticalThreshold: 0.2
        }
      ]
    }
  }, { x: 100, y: 100 })

  const beforeWater = entity.getNeed('water').current
  assert(beforeWater === 0.3, 'Initial water should be 0.3')

  entity.satisfyNeed('water', 0.5)  // Drink water

  const afterWater = entity.getNeed('water').current
  assert(afterWater === 0.8, `After drinking 0.5, water should be 0.8 (got ${afterWater})`)
  assert(!entity.isCritical('water'), 'Water should no longer be critical')

  world.destroy()
})

// Test 6: getNeedsSnapshot()
test('getNeedsSnapshot() returns all resource levels', () => {
  const world = new World({
    features: {
      ontology: true,
      rendering: 'headless'
    }
  })

  const entity = world.spawn({
    essence: 'Multi-Need Entity',
    needs: {
      resources: [
        { id: 'water', initial: 0.8, depletionRate: 0.01 },
        { id: 'food', initial: 0.6, depletionRate: 0.01 },
        { id: 'energy', initial: 0.4, depletionRate: 0.01 }
      ]
    }
  }, { x: 100, y: 100 })

  const snapshot = entity.getNeedsSnapshot()
  assert(Object.keys(snapshot).length === 3, 'Should have 3 needs in snapshot')
  assert(snapshot.water === 0.8, 'Water level should be 0.8')
  assert(snapshot.food === 0.6, 'Food level should be 0.6')
  assert(snapshot.energy === 0.4, 'Energy level should be 0.4')

  world.destroy()
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50))

if (failCount === 0) {
  console.log('\n✅ All needs system tests passed!')
  console.log('\nTask 1.1 Complete:')
  console.log('  ✓ Needs system added to Entity schema')
  console.log('  ✓ Resource depletion over time')
  console.log('  ✓ Critical state detection')
  console.log('  ✓ Emotional impact when critical')
  console.log('  ✓ Need satisfaction API')
  console.log('\nNext: Task 1.2 - Create ResourceField in World')
} else {
  console.log('\n❌ Some tests failed')
  process.exit(1)
}
