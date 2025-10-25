/**
 * MDS v5.5 - Cognitive Network Tests
 * Tests for ResonanceField and CognitiveLink systems
 */

import {
  World,
  ResonanceField,
  CognitiveLinkManager
} from '../dist/mds-core.esm.js'

// Test counter
let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ ${message}`)
    failed++
  }
}

console.log('\n🧠 Testing Cognitive Network (v5.5)')
console.log('=' .repeat(50))

// Test 1: Cognitive Link Creation
console.log('\n1. Cognitive Link Creation')
{
  const world = new World({ features: { rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)

  entityA.connectTo(entityB, { strength: 0.8, bidirectional: true })

  assert(entityA.isConnectedTo(entityB.id), 'Entity A connected to B')
  assert(entityB.isConnectedTo(entityA.id), 'Entity B connected to A (bidirectional)')
  assert(entityA.getLinkStrength(entityB.id) === 0.8, 'Link strength is 0.8')
}

// Test 2: Link Reinforcement
console.log('\n2. Link Reinforcement')
{
  const world = new World({ features: { rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)

  entityA.connectTo(entityB, { strength: 0.5 })
  const initialStrength = entityA.getLinkStrength(entityB.id)

  entityA.reinforceLink(entityB.id, 0.2)
  const newStrength = entityA.getLinkStrength(entityB.id)

  assert(newStrength > initialStrength, 'Link strength increased after reinforcement')
  assert(Math.abs(newStrength - 0.7) < 0.01, 'Strength increased by ~0.2')
}

// Test 3: Link Decay
console.log('\n3. Link Decay')
{
  const world = new World({ features: { rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)

  entityA.connectTo(entityB, { strength: 0.8 })
  const initialStrength = entityA.getLinkStrength(entityB.id)

  // Decay for 10 seconds at 1% per second
  entityA.decayCognitiveLinks(10, 0.01)
  const newStrength = entityA.getLinkStrength(entityB.id)

  assert(newStrength < initialStrength, 'Link strength decreased after decay')
  assert(Math.abs(newStrength - 0.7) < 0.05, 'Strength decayed by ~10%')
}

// Test 4: Link Auto-Pruning
console.log('\n4. Link Auto-Pruning')
{
  const world = new World({ features: { rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)

  entityA.connectTo(entityB, { strength: 0.15 })  // Weak link
  assert(entityA.getCognitiveLinksCount() === 1, 'Link created')

  // Decay below minimum threshold (0.1)
  entityA.decayCognitiveLinks(10, 0.01)  // Should prune
  assert(entityA.getCognitiveLinksCount() === 0, 'Weak link pruned')
}

// Test 5: Resonance Field - Memory Propagation
console.log('\n5. Resonance Field - Memory Propagation')
{
  const world = new World({ features: { ontology: true, rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)
  const entityC = world.spawn({ essence: 'Entity C' }, 300, 300)

  // Enable memory for entities
  entityA.enable('memory')
  entityB.enable('memory')
  entityC.enable('memory')

  // Connect A -> B -> C
  entityA.connectTo(entityB, { strength: 0.9 })
  entityB.connectTo(entityC, { strength: 0.8 })

  // Entity A remembers something
  entityA.memory.add({
    timestamp: 0,
    type: 'observation',
    subject: 'world',
    content: { event: 'sunrise' },
    salience: 0.9
  })

  const memory = entityA.memory.recall()[0]

  // Propagate memory signal
  const field = new ResonanceField({ decayRate: 0.2 })
  const result = field.propagate(
    {
      type: 'memory',
      source: entityA.id,
      timestamp: 0,
      payload: memory,
      strength: 0.9
    },
    entityA,
    [entityA, entityB, entityC]
  )

  assert(result.reached.includes(entityB.id), 'Signal reached Entity B')
  assert(result.reached.includes(entityC.id), 'Signal reached Entity C (2 hops)')
  assert(result.hops === 2, 'Signal traveled 2 hops')

  // Check that B received the memory
  const bMemories = entityB.memory.recall({ subject: entityA.id })
  assert(bMemories.length > 0, 'Entity B has indirect memory from A')
}

// Test 6: Resonance Field - Emotion Propagation
console.log('\n6. Resonance Field - Emotion Propagation')
{
  const world = new World({ features: { ontology: true, rendering: "headless" } })
  const entityA = world.spawn({ $schema: 'mdspec/v5.0', essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ $schema: 'mdspec/v5.0', essence: 'Entity B' }, 200, 200)

  entityA.connectTo(entityB, { strength: 1.0 })

  // Set A's emotion to happy
  entityA.emotion.valence = 0.8
  entityA.emotion.arousal = 0.6
  entityA.emotion.dominance = 0.5

  // B starts neutral
  entityB.emotion.valence = 0
  entityB.emotion.arousal = 0.5
  entityB.emotion.dominance = 0.5

  // Propagate emotion
  const field = new ResonanceField({ decayRate: 0 })
  field.propagate(
    {
      type: 'emotion',
      source: entityA.id,
      timestamp: 0,
      payload: entityA.emotion,
      strength: 0.5  // 50% resonance
    },
    entityA,
    [entityA, entityB]
  )

  // B should be happier now (resonance)
  assert(entityB.emotion.valence > 0, 'Entity B valence increased')
  assert(entityB.emotion.arousal > 0.5, 'Entity B arousal increased')
}

// Test 7: Signal Decay Over Distance
console.log('\n7. Signal Decay Over Distance')
{
  const world = new World({ features: { ontology: true, rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)
  const entityC = world.spawn({ essence: 'Entity C' }, 300, 300)

  // Enable memory
  entityA.enable('memory')
  entityB.enable('memory')
  entityC.enable('memory')

  // A -> B -> C chain
  entityA.connectTo(entityB, { strength: 0.9 })
  entityB.connectTo(entityC, { strength: 0.9 })

  // Propagate with high decay
  const field = new ResonanceField({ decayRate: 0.5, minStrength: 0.3 })

  const result = field.propagate(
    {
      type: 'memory',
      source: entityA.id,
      timestamp: 0,
      payload: { type: 'observation', subject: 'test', timestamp: 0, salience: 1 },
      strength: 1.0
    },
    entityA,
    [entityA, entityB, entityC]
  )

  // With 50% decay, signal should not reach C (strength drops too low)
  assert(result.reached.includes(entityB.id), 'Signal reached B')
  assert(!result.reached.includes(entityC.id), 'Signal did not reach C (too weak)')
}

// Test 8: Bidirectional Links
console.log('\n8. Bidirectional Links')
{
  const world = new World({ features: { rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)

  entityA.connectTo(entityB, { strength: 0.8, bidirectional: false })

  assert(entityA.isConnectedTo(entityB.id), 'A connected to B')
  assert(!entityB.isConnectedTo(entityA.id), 'B not connected to A (unidirectional)')
}

// Test 9: Disconnection
console.log('\n9. Disconnection')
{
  const world = new World({ features: { rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)

  entityA.connectTo(entityB, { strength: 0.8 })
  assert(entityA.isConnectedTo(entityB.id), 'Link created')

  entityA.disconnectFrom(entityB.id)
  assert(!entityA.isConnectedTo(entityB.id), 'Link removed')
  assert(entityA.getCognitiveLinksCount() === 0, 'Link count is 0')
}

// Test 10: Multiple Links
console.log('\n10. Multiple Links')
{
  const world = new World({ features: { rendering: "headless" } })
  const entityA = world.spawn({ essence: 'Entity A' }, 100, 100)
  const entityB = world.spawn({ essence: 'Entity B' }, 200, 200)
  const entityC = world.spawn({ essence: 'Entity C' }, 300, 300)

  entityA.connectTo(entityB, { strength: 0.8 })
  entityA.connectTo(entityC, { strength: 0.6 })

  assert(entityA.getCognitiveLinksCount() === 2, 'Entity A has 2 links')

  const connected = entityA.getConnectedEntities()
  assert(connected.includes(entityB.id), 'Connected to B')
  assert(connected.includes(entityC.id), 'Connected to C')
}

// Results
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
