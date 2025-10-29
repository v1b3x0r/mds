/**
 * MDS v5 - WorldFile Persistence Tests
 * Tests save/load functionality with deterministic restoration
 */

// Mock DOM for Node.js
global.document = {
  createElement: (tag) => ({
    style: {},
    dataset: {},
    className: '',
    textContent: '',
    addEventListener: () => {},
    remove: () => {},
    appendChild: () => {},
    width: 800,
    height: 600,
    getContext: () => ({
      clearRect: () => {},
      strokeStyle: '',
      lineWidth: 0,
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      globalAlpha: 1,
      fillStyle: '',
      arc: () => {},
      fill: () => {},
      font: '',
      textAlign: '',
      textBaseline: '',
      save: () => {},
      translate: () => {},
      scale: () => {},
      fillText: () => {},
      restore: () => {},
      createRadialGradient: () => ({
        addColorStop: () => {}
      })
    })
  }),
  body: {
    appendChild: () => {}
  }
}

global.window = {
  innerWidth: 800,
  innerHeight: 600,
  addEventListener: () => {}
}

global.performance = {
  now: () => Date.now()
}

// Import MDS
import {
  World,
  toWorldFile,
  fromWorldFile,
  saveWorldFile,
  loadWorldFile
} from '../dist/mds-core.esm.js'

let passCount = 0
let failCount = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passCount++
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`)
    console.error(e.stack)
    failCount++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

console.log('\n💾 MDS v5 - WorldFile Persistence Tests\n')

// Test materials
const testMaterial = {
  material: 'test.persist',
  manifestation: { emoji: '💾' }
}

const v5Material = {
  $schema: 'https://mds.v1b3.dev/schema/v5',
  material: 'test.v5.persist',
  manifestation: { emoji: '🧠' },
  ontology: {
    memorySize: 50
  }
}

const fieldSpec = {
  material: 'field.test',
  type: 'field',
  origin: 'self',
  radius: 100,
  duration: 5000
}

// Test 1: Basic serialization
test('toWorldFile() serializes world state', () => {
  const world = new World({ seed: 123 })
  world.spawn(testMaterial, { x: 100, y: 100 })
  world.spawn(testMaterial, { x: 200, y: 200 })

  const worldFile = toWorldFile(world, {
    name: 'Test World',
    author: 'Test Suite'
  })

  assert(worldFile.$schema.includes('/v5'), 'Schema should be v5')
  assert(worldFile.version === '5.0.0', 'Version should be 5.0.0')
  assert(worldFile.id === world.id, 'World ID should match')
  assert(worldFile.entities.length === 2, 'Should have 2 entities')
  assert(worldFile.metadata.name === 'Test World', 'Metadata should be saved')

  world.destroy()
})

// Test 2: Basic deserialization
test('fromWorldFile() restores world state', () => {
  const world1 = new World({ seed: 123 })
  world1.spawn(testMaterial, { x: 100, y: 100 })
  world1.spawn(testMaterial, { x: 200, y: 200 })

  const worldFile = toWorldFile(world1)
  world1.destroy()

  const world2 = fromWorldFile(worldFile)

  assert(world2.id === world1.id, 'World ID should match')
  assert(world2.entities.length === 2, 'Should have 2 entities')
  assert(world2.entities[0].x === 100, 'Entity position should be restored')

  world2.destroy()
})

// Test 3: Deterministic restoration
test('Deterministic restoration (same state after load)', () => {
  const world1 = new World({ seed: 42 })
  const e1 = world1.spawn(testMaterial, { x: 50, y: 50 })
  const e2 = world1.spawn(testMaterial, { x: 150, y: 150 })

  // Record initial state
  const id1 = e1.id
  const id2 = e2.id
  const entropy1 = e1.entropy
  const entropy2 = e2.entropy

  const worldFile = toWorldFile(world1)
  world1.destroy()

  // Restore
  const world2 = fromWorldFile(worldFile)
  const restored1 = world2.entities.find(e => e.id === id1)
  const restored2 = world2.entities.find(e => e.id === id2)

  assert(restored1, 'Entity 1 should be restored')
  assert(restored2, 'Entity 2 should be restored')
  assert(restored1.id === id1, 'Entity 1 ID should match')
  assert(restored1.entropy === entropy1, 'Entity 1 entropy should match')
  assert(restored2.entropy === entropy2, 'Entity 2 entropy should match')

  world2.destroy()
})

// Test 4: Ontology state persistence (memory)
test('Memory state persistence', () => {
  const world1 = new World({ features: { ontology: true, rendering: 'headless' }, seed: 123 })
  const entity = world1.spawn(v5Material, { x: 100, y: 100 })

  // Debug: Initial memory count
  const initialCount = entity.memory ? entity.memory.count() : 0

  // Add memories
  entity.remember({
    timestamp: 0,
    type: 'spawn',
    subject: 'world',
    content: { x: 100, y: 100 },
    salience: 1.0
  })

  entity.remember({
    timestamp: 1,
    type: 'observation',
    subject: 'user',
    content: { action: 'click' },
    salience: 0.8
  })

  entity.enable('consolidation')
  if (entity.consolidation && entity.memory) {
    entity.consolidation.consolidate(entity.memory.recall())
  }

  const finalCount = entity.memory.count()
  const expectedCount = initialCount + 2

  assert(finalCount === expectedCount, `Should have ${expectedCount} memories (initial ${initialCount} + 2 added), got ${finalCount}`)

  const worldFile = toWorldFile(world1)
  const serializedConsolidation = worldFile.entities[0].memoryConsolidation
  assert(serializedConsolidation, 'WorldFile should include memory consolidation data')
  assert(serializedConsolidation.memories.length > 0, 'Serialized consolidation should contain merged memories')
  world1.destroy()

  const world2 = fromWorldFile(worldFile)
  const restored = world2.entities[0]

  assert(restored.memory, 'Restored entity should have memory')
  assert(restored.memory.count() === expectedCount, `Should have ${expectedCount} restored memories (same as before save)`)

  assert(restored.consolidation, 'Restored entity should recreate consolidation system')
  const restoredConsolidated = restored.consolidation?.getAllMemories() ?? []
  assert(restoredConsolidated.length > 0, 'Restored consolidation should include merged memory state')

  const memories = restored.memory.recall({ type: 'spawn' })
  assert(memories.length === 2, 'Should recall 2 spawn memories')
  assert(memories.every(m => m.subject === 'world'), 'Memory content should match')

  world2.destroy()
})

// Test 5: Emotional state persistence
test('Emotional state persistence', () => {
  const world1 = new World({ features: { ontology: true, rendering: 'headless' }, seed: 123 })
  const entity = world1.spawn(v5Material, { x: 100, y: 100 })

  // Set emotion
  entity.emotion.valence = 0.7
  entity.emotion.arousal = 0.9
  entity.emotion.dominance = 0.3

  const worldFile = toWorldFile(world1)
  world1.destroy()

  const world2 = fromWorldFile(worldFile)
  const restored = world2.entities[0]

  assert(restored.emotion, 'Restored entity should have emotion')
  assert(restored.emotion.valence === 0.7, 'Valence should match')
  assert(restored.emotion.arousal === 0.9, 'Arousal should match')
  assert(restored.emotion.dominance === 0.3, 'Dominance should match')

  world2.destroy()
})

// Test 6: Intent persistence
test('Intent persistence', () => {
  const world1 = new World({ features: { ontology: true, rendering: 'headless' }, seed: 123 })
  const entity = world1.spawn(v5Material, { x: 100, y: 100 })

  // Add intents
  entity.setIntent({
    goal: 'approach',
    target: 'target-id',
    motivation: 0.8,
    priority: 1
  })

  entity.setIntent({
    goal: 'observe',
    motivation: 0.5,
    priority: 0
  })

  assert(entity.intent.count() === 2, 'Should have 2 intents')

  const worldFile = toWorldFile(world1)
  world1.destroy()

  const world2 = fromWorldFile(worldFile)
  const restored = world2.entities[0]

  assert(restored.intent, 'Restored entity should have intent')
  assert(restored.intent.count() === 2, 'Should have 2 restored intents')

  const current = restored.intent.current()
  assert(current.goal === 'approach', 'Top intent should be approach')
  assert(current.motivation === 0.8, 'Motivation should match')

  world2.destroy()
})

// Test 7: Relationship persistence (two-pass loading)
test('Relationship persistence (two-pass loading)', () => {
  const world1 = new World({ features: { ontology: true, rendering: 'headless' }, seed: 123 })
  const e1 = world1.spawn(v5Material, { x: 50, y: 50 })
  const e2 = world1.spawn(v5Material, { x: 100, y: 100 })

  // Create relationships
  e1.relationships.set(e2.id, {
    trust: 0.8,
    familiarity: 0.6,
    lastInteraction: 1000,
    interactionCount: 5
  })

  e2.relationships.set(e1.id, {
    trust: 0.7,
    familiarity: 0.6,
    lastInteraction: 1000,
    interactionCount: 5
  })

  const worldFile = toWorldFile(world1)
  world1.destroy()

  // Restore (two-pass loading)
  const world2 = fromWorldFile(worldFile)

  const restored1 = world2.entities.find(e => e.id === e1.id)
  const restored2 = world2.entities.find(e => e.id === e2.id)

  assert(restored1.relationships, 'Entity 1 should have relationships')
  assert(restored2.relationships, 'Entity 2 should have relationships')

  const rel1to2 = restored1.relationships.get(e2.id)
  const rel2to1 = restored2.relationships.get(e1.id)

  assert(rel1to2, 'Relationship 1→2 should exist')
  assert(rel2to1, 'Relationship 2→1 should exist')
  assert(rel1to2.trust === 0.8, 'Trust should match')
  assert(rel1to2.familiarity === 0.6, 'Familiarity should match')
  assert(rel1to2.interactionCount === 5, 'Interaction count should match')

  world2.destroy()
})

// Test 8: JSON string serialization
test('saveWorldFile/loadWorldFile (JSON strings)', () => {
  const world1 = new World({ seed: 123 })
  world1.spawn(testMaterial, { x: 100, y: 100 })

  const json = saveWorldFile(world1, { name: 'Test' })

  assert(typeof json === 'string', 'Should return JSON string')
  assert(json.includes('"$schema"'), 'Should be valid JSON')

  world1.destroy()

  const world2 = loadWorldFile(json)

  assert(world2.entities.length === 1, 'Should restore entities')

  world2.destroy()
})

// Test 9: Field persistence
test('Active field persistence', () => {
  const world1 = new World({ seed: 123 })
  world1.registerField('field.test', fieldSpec)

  world1.spawn(testMaterial, { x: 100, y: 100 })
  world1.spawnField(fieldSpec, 150, 150)

  assert(world1.fields.length === 1, 'Should have 1 field')

  const worldFile = toWorldFile(world1)
  world1.destroy()

  const world2 = fromWorldFile(worldFile)

  assert(world2.fields.length === 1, 'Should restore 1 field')
  assert(world2.fields[0].x === 150, 'Field position should match')
  assert(world2.fields[0].y === 150, 'Field position should match')

  world2.destroy()
})

// Test 10: World time/tick restoration
test('World time and tick count restoration', () => {
  const world1 = new World({ seed: 123 })
  world1.spawn(testMaterial, { x: 100, y: 100 })

  // Simulate time
  world1.tick(0.016)
  world1.tick(0.016)
  world1.tick(0.016)

  const time1 = world1.worldTime
  const ticks1 = world1.tickCount

  assert(ticks1 === 3, 'Should have 3 ticks')

  const worldFile = toWorldFile(world1)
  world1.destroy()

  const world2 = fromWorldFile(worldFile)

  assert(Math.abs(world2.worldTime - time1) < 0.001, 'World time should match')
  assert(world2.tickCount === ticks1, 'Tick count should match')

  world2.destroy()
})

// Test 11: Delta compression (optional fields)
test('Delta compression (optional fields omitted)', () => {
  const world1 = new World({ seed: 123 })
  const entity = world1.spawn(testMaterial, { x: 100, y: 100 })

  // Entity has default hoverCount (0) and lastHoverTime (0)
  assert(entity.hoverCount === 0, 'Default hoverCount is 0')

  const worldFile = toWorldFile(world1)

  // Check that optional fields are omitted when default
  const serialized = worldFile.entities[0]
  assert(serialized.hoverCount === undefined, 'hoverCount should be omitted (delta compression)')
  assert(serialized.lastHoverTime === undefined, 'lastHoverTime should be omitted')

  world1.destroy()
})

// Test 12: Event log persistence (if history enabled)
test('Event log persistence (history enabled)', () => {
  const world1 = new World({ features: { history: true }, seed: 123 })
  world1.spawn(testMaterial, { x: 100, y: 100 })
  world1.spawn(testMaterial, { x: 200, y: 200 })

  assert(world1.eventLog.length === 2, 'Should have 2 spawn events')

  const worldFile = toWorldFile(world1)
  world1.destroy()

  const world2 = fromWorldFile(worldFile)

  assert(world2.historyEnabled, 'History should be enabled')
  assert(world2.eventLog.length === 2, 'Event log should be restored')
  assert(world2.eventLog[0].type === 'spawn', 'Event type should match')

  world2.destroy()
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50) + '\n')

if (failCount === 0) {
  console.log('✅ All WorldFile persistence tests passed!')
  console.log('\nPhase 4 WorldFile Tests Complete:')
  console.log('  ✓ Serialization (toWorldFile)')
  console.log('  ✓ Deserialization (fromWorldFile)')
  console.log('  ✓ Deterministic restoration')
  console.log('  ✓ Memory persistence')
  console.log('  ✓ Emotional state persistence')
  console.log('  ✓ Intent persistence')
  console.log('  ✓ Relationship persistence (two-pass loading)')
  console.log('  ✓ JSON string save/load')
  console.log('  ✓ Active field persistence')
  console.log('  ✓ World time/tick restoration')
  console.log('  ✓ Delta compression (optional fields)')
  console.log('  ✓ Event log persistence')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
