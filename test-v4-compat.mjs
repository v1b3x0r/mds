/**
 * MDS v5 - v4 Backward Compatibility Test (Node.js)
 * Tests that v4 materials work without breaking changes
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
import { Engine, MemoryBuffer, IntentStack, EMOTION_BASELINES } from './dist/mds-core.esm.js'

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

console.log('\n🧪 MDS v5 - v4 Backward Compatibility Tests\n')

// Test 1: Engine instantiation
test('Engine instantiation (v4)', () => {
  const engine = new Engine({ seed: 12345 })
  assert(engine, 'Engine should be created')
})

// Test 2: Spawn v4 material (no ontology)
test('Spawn v4 material without ontology', () => {
  const v4Material = {
    material: 'test.v4',
    intent: 'test',
    essence: 'v4 backward compat test',
    manifestation: {
      emoji: '📝',
      aging: {
        start_opacity: 1,
        decay_rate: 0.01
      }
    },
    physics: {
      mass: 0.1,
      friction: 0.02
    }
  }

  const engine = new Engine({ seed: 12345 })
  const entity = engine.spawn(v4Material, 100, 100)

  // Check v4 properties exist
  assert(entity.x === 100, 'Entity should have x position')
  assert(entity.y === 100, 'Entity should have y position')
  assert(entity.vx === 0, 'Entity should have vx velocity')
  assert(entity.vy === 0, 'Entity should have vy velocity')
  assert(entity.age === 0, 'Entity should have age')
  assert(entity.entropy >= 0 && entity.entropy <= 1, 'Entity should have entropy')
})

// Test 3: v5 ontology NOT enabled for v4 materials
test('v5 ontology disabled for v4 materials', () => {
  const v4Material = {
    material: 'test.v4.noontology',
    manifestation: { emoji: '📄' }
  }

  const engine = new Engine()
  const entity = engine.spawn(v4Material, 0, 0)

  // v5 properties should be undefined (not initialized)
  assert(!entity.memory, 'Memory should not be initialized for v4 material')
  assert(!entity.emotion, 'Emotion should not be initialized for v4 material')
  assert(!entity.intent, 'Intent should not be initialized for v4 material')
})

// Test 4: UUID always assigned (v5 enhancement)
test('Entity UUID assigned (v5 addition)', () => {
  const v4Material = {
    material: 'test.uuid',
    manifestation: { emoji: '🔑' }
  }

  const engine = new Engine()
  const entity = engine.spawn(v4Material, 0, 0)

  assert(entity.id, 'Entity should have UUID')
  assert(entity.id.includes('-'), 'UUID should contain hyphens')
  assert(entity.id.length === 36, 'UUID should be 36 characters')
})

// Test 5: v4 tick loop
test('v4 tick loop working', () => {
  const v4Material = {
    material: 'test.ticker',
    manifestation: { emoji: '⏱️' }
  }

  const engine = new Engine()
  const entity = engine.spawn(v4Material, 0, 0)

  const initialAge = entity.age

  // Manual tick
  engine.tick(0.016)  // ~60 FPS

  assert(entity.age > initialAge, 'Entity age should increase')
})

// Test 6: v4 serialization
test('v4 serialization working', () => {
  const v4Material = {
    material: 'test.serialize',
    manifestation: { emoji: '💾' }
  }

  const engine = new Engine({ seed: 12345 })
  const entity = engine.spawn(v4Material, 300, 300)

  const snapshot = engine.snapshot()

  assert(snapshot.entities, 'Snapshot should have entities array')
  assert(snapshot.entities.length === 1, 'Snapshot should have 1 entity')

  const entityData = snapshot.entities[0]
  assert(entityData.material === 'test.serialize', 'Snapshot should preserve material ID')
  assert(entityData.x === 300, 'Snapshot should preserve x position')
  assert(entityData.y === 300, 'Snapshot should preserve y position')
})

// Test 7: v4 material can be restored
test('v4 material can be restored from snapshot', () => {
  const v4Material = {
    material: 'test.restore',
    manifestation: { emoji: '♻️' }
  }

  const engine = new Engine({ seed: 12345 })
  const entity = engine.spawn(v4Material, 100, 200)
  entity.vx = 5
  entity.vy = -3

  const snapshot = engine.snapshot()

  // Clear and restore
  engine.clear()

  const materialMap = new Map([['test.restore', v4Material]])
  const fieldMap = new Map()
  engine.restore(snapshot, materialMap, fieldMap)

  const entities = engine.getEntities()
  assert(entities.length === 1, 'Should restore 1 entity')

  const restored = entities[0]
  assert(restored.x === 100, 'Should restore x position')
  assert(restored.y === 200, 'Should restore y position')
  assert(restored.vx === 5, 'Should restore vx velocity')
  assert(restored.vy === -3, 'Should restore vy velocity')
})

// Test 8: v5 classes are exported
test('v5 ontology classes exported', () => {
  assert(MemoryBuffer, 'MemoryBuffer should be exported')
  assert(IntentStack, 'IntentStack should be exported')
  assert(EMOTION_BASELINES, 'EMOTION_BASELINES should be exported')
})

// Test 9: v5 MemoryBuffer works independently
test('v5 MemoryBuffer standalone usage', () => {
  const memory = new MemoryBuffer({ maxSize: 10 })

  memory.add({
    timestamp: 0,
    type: 'spawn',
    subject: 'world',
    content: {},
    salience: 1.0
  })

  assert(memory.count() === 1, 'MemoryBuffer should have 1 memory')

  const recalled = memory.recall()
  assert(recalled.length === 1, 'Should recall 1 memory')
  assert(recalled[0].type === 'spawn', 'Should recall correct type')
})

// Test 10: v5 IntentStack works independently
test('v5 IntentStack standalone usage', () => {
  const stack = new IntentStack()

  stack.push({ goal: 'wander', motivation: 0.3, priority: 1 })
  stack.push({ goal: 'bond', motivation: 0.8, priority: 2 })

  const current = stack.current()
  assert(current, 'Should have current intent')
  assert(current.goal === 'bond', 'Should return highest priority intent')
  assert(current.motivation === 0.8, 'Should preserve motivation')
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50) + '\n')

if (failCount === 0) {
  console.log('✅ All v4 backward compatibility tests passed!')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
