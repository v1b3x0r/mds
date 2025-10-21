/**
 * MDS v5 - World Container Test
 * Tests World class with three-phase tick loop
 */

// Mock DOM for Node.js
global.document = {
  createElement: () => ({
    style: {},
    dataset: {},
    addEventListener: () => {},
    remove: () => {},
    appendChild: () => {}
  }),
  body: {
    appendChild: () => {}
  }
}

global.performance = {
  now: () => Date.now()
}

global.requestAnimationFrame = (fn) => setTimeout(fn, 16)

// Import MDS
import { World, Engine } from './dist/mds-core.esm.js'

let passCount = 0
let failCount = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passCount++
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`)
    failCount++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

console.log('\n🌍 MDS v5 - World Container Tests\n')

// Test 1: World instantiation
test('World instantiation', () => {
  const world = new World({ seed: 12345 })
  assert(world, 'World should be created')
  assert(world.id, 'World should have UUID')
  assert(world.worldTime === 0, 'World time should start at 0')
  assert(world.tickCount === 0, 'Tick count should start at 0')
})

// Test 2: World spawns entities
test('World spawns entities', () => {
  const v4Material = {
    material: 'test.world',
    manifestation: { emoji: '🌍' }
  }

  const world = new World()
  const entity = world.spawn(v4Material, { x: 100, y: 200 })

  assert(entity.x === 100, 'Entity should spawn at x=100')
  assert(entity.y === 200, 'Entity should spawn at y=200')
  assert(world.entities.length === 1, 'World should have 1 entity')
})

// Test 3: World tick updates time
test('World tick updates time', () => {
  const world = new World()
  const material = { material: 'test.tick', manifestation: { emoji: '⏱️' } }
  world.spawn(material)

  const initialTime = world.worldTime
  const initialCount = world.tickCount

  world.tick(0.016)  // 60 FPS

  assert(world.worldTime > initialTime, 'World time should increase')
  assert(world.tickCount > initialCount, 'Tick count should increase')
})

// Test 4: v4 compatibility (World without ontology)
test('v4 compatibility (ontology disabled)', () => {
  const v4Material = {
    material: 'test.v4compat',
    manifestation: { emoji: '📄' }
  }

  const world = new World({ features: { ontology: false } })
  const entity = world.spawn(v4Material, { x: 0, y: 0 })

  // v5 ontology should NOT be initialized
  assert(!entity.memory, 'Memory should not be initialized')
  assert(!entity.emotion, 'Emotion should not be initialized')
  assert(!entity.intent, 'Intent should not be initialized')
})

// Test 5: v5 ontology enabled
test('v5 ontology enabled with feature flag', () => {
  const v5Material = {
    $schema: 'https://mds.v1b3.dev/schema/v5',
    material: 'test.v5',
    manifestation: { emoji: '🧠' },
    ontology: {
      memorySize: 50,
      emotionBaseline: { valence: 0, arousal: 0.5, dominance: 0.5 }
    }
  }

  const world = new World({ features: { ontology: true } })
  const entity = world.spawn(v5Material, { x: 0, y: 0 })

  // v5 ontology SHOULD be initialized
  assert(entity.memory, 'Memory should be initialized')
  assert(entity.emotion, 'Emotion should be initialized')
  assert(entity.intent, 'Intent should be initialized')
})

// Test 6: Mental update phase (memory decay)
test('Mental update phase (memory decay)', () => {
  const v5Material = {
    $schema: 'https://mds.v1b3.dev/schema/v5',
    material: 'test.mental',
    manifestation: { emoji: '💭' },
    ontology: {}
  }

  const world = new World({ features: { ontology: true } })
  const entity = world.spawn(v5Material)

  // Add a memory
  entity.remember({
    timestamp: 0,
    type: 'spawn',
    subject: 'world',
    salience: 1.0
  })

  const initialSalience = entity.memory.recall()[0].salience

  // Tick multiple times (simulate 10 seconds)
  for (let i = 0; i < 600; i++) {  // 600 frames @ 60 FPS = 10 seconds
    world.tick(0.016)
  }

  const finalSalience = entity.memory.recall()[0]?.salience ?? 0

  assert(finalSalience < initialSalience, 'Memory salience should decay')
  assert(finalSalience >= 0, 'Salience should not go below 0')
})

// Test 7: Relational update phase (emotional contagion)
test('Relational update phase (emotional contagion)', () => {
  const v5Material = {
    $schema: 'https://mds.v1b3.dev/schema/v5',
    material: 'test.relational',
    manifestation: { emoji: '❤️' },
    ontology: {}
  }

  const world = new World({ features: { ontology: true } })

  // Spawn two entities close together
  const entityA = world.spawn(v5Material, { x: 50, y: 50 })
  const entityB = world.spawn(v5Material, { x: 60, y: 60 })  // ~14px apart

  // Set different emotions
  entityA.emotion.valence = 0.8  // Happy
  entityB.emotion.valence = -0.5 // Sad

  const initialValenceA = entityA.emotion.valence
  const initialValenceB = entityB.emotion.valence

  // Tick multiple times to allow contagion
  for (let i = 0; i < 60; i++) {  // 1 second
    world.tick(0.016)
  }

  const finalValenceA = entityA.emotion.valence
  const finalValenceB = entityB.emotion.valence

  // A should become sadder (influenced by B)
  assert(finalValenceA < initialValenceA, 'EntityA valence should decrease (contagion from B)')

  // B should become happier (influenced by A)
  assert(finalValenceB > initialValenceB, 'EntityB valence should increase (contagion from A)')
})

// Test 8: Memory-based attraction
test('Memory-based attraction (bonus force)', () => {
  const v5Material = {
    $schema: 'https://mds.v1b3.dev/schema/v5',
    material: 'test.memory.attraction',
    manifestation: { emoji: '🧲' },
    physics: { friction: 0.001 },  // Low friction to see movement
    ontology: {}
  }

  const world = new World({ features: { ontology: true } })

  // Spawn two entities close enough to form memories
  const entityA = world.spawn(v5Material, { x: 50, y: 50 })
  const entityB = world.spawn(v5Material, { x: 90, y: 90 })  // ~56px apart (within 80px threshold)

  entityA.vx = 0
  entityA.vy = 0
  entityB.vx = 0
  entityB.vy = 0

  // Tick to form memories (close proximity)
  for (let i = 0; i < 60; i++) {
    world.tick(0.016)
  }

  // Check memories formed
  const memoryStrengthA = entityA.memory.getStrength(entityB.id)
  assert(memoryStrengthA > 0, 'EntityA should have memory of EntityB')

  // Check if attraction force applied (velocity should increase)
  const hasMovement = entityA.vx !== 0 || entityA.vy !== 0
  assert(hasMovement, 'Entities should have movement from memory-based attraction')
})

// Test 9: History tracking (event log)
test('History tracking (event log)', () => {
  const material = { material: 'test.history', manifestation: { emoji: '📜' } }

  const world = new World({ features: { history: true } })

  assert(world.historyEnabled, 'History should be enabled')
  assert(world.eventLog.length === 0, 'Event log should start empty')

  world.spawn(material, { x: 0, y: 0 })

  assert(world.eventLog.length === 1, 'Event log should have 1 event')
  assert(world.eventLog[0].type === 'spawn', 'Event should be spawn type')
})

// Test 10: World backward compatible with Engine
test('World backward compatible with Engine API', () => {
  const material = { material: 'test.compat', manifestation: { emoji: '🔄' } }

  // Engine usage (v4)
  const engine = new Engine()
  const entityEngine = engine.spawn(material, 100, 100)

  // World usage (v5)
  const world = new World()
  const entityWorld = world.spawn(material, { x: 100, y: 100 })

  // Both should have same properties
  assert(entityEngine.x === entityWorld.x, 'Both should have same x')
  assert(entityEngine.y === entityWorld.y, 'Both should have same y')
  assert(entityEngine.m.material === entityWorld.m.material, 'Both should have same material')
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50) + '\n')

if (failCount === 0) {
  console.log('✅ All World container tests passed!')
  console.log('\nPhase 2 Complete:')
  console.log('  ✓ World class wraps Engine')
  console.log('  ✓ Three-phase tick loop (Physical → Mental → Relational)')
  console.log('  ✓ Memory decay working')
  console.log('  ✓ Emotional contagion working')
  console.log('  ✓ Memory-based attraction working')
  console.log('  ✓ Event log working')
  console.log('  ✓ Backward compatible with v4')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
