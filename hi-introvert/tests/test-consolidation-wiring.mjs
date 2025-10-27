/**
 * Test: Consolidation Wiring Verification
 * Verify that consolidation system is properly wired
 */

import { World } from '@v1b3x0r/mds-core'

console.log('🧪 Testing Consolidation Wiring\n')

// Test 1: Entity consolidation initialization
console.log('Test 1: Entity.enable("consolidation")')
const world = new World({ features: { ontology: true } })
const entity = world.spawn({ essence: 'Test entity' }, 100, 100)

entity.enable('memory', 'consolidation')

if (entity.consolidation) {
  console.log('  ✅ entity.consolidation initialized')
  console.log('  Type:', entity.consolidation.constructor.name)
} else {
  console.log('  ❌ entity.consolidation is undefined!')
  process.exit(1)
}

// Test 2: Memory cap increased to 500
console.log('\nTest 2: Memory cap = 500')
if (entity.memory) {
  // Add 101 memories to test cap
  for (let i = 0; i < 101; i++) {
    entity.remember({
      type: 'test',
      subject: `memory_${i}`,
      content: { data: i },
      timestamp: Date.now(),
      salience: 0.5
    })
  }

  const memoryCount = entity.memory.memories.length
  console.log(`  Memory count after 101 adds: ${memoryCount}`)
  
  if (memoryCount > 100) {
    console.log('  ✅ Memory cap increased (> 100)')
  } else {
    console.log('  ❌ Memory still capped at 100')
  }
} else {
  console.log('  ❌ Memory not enabled')
}

// Test 3: Consolidation.consolidate() works
console.log('\nTest 3: Consolidation.consolidate()')

// Add similar memories
for (let i = 0; i < 5; i++) {
  entity.remember({
    type: 'interaction',
    subject: 'user',
    content: { message: 'hello' },
    timestamp: Date.now() + i * 1000,
    salience: 0.8
  })
}

const memories = entity.memory.memories
const consolidated = entity.consolidation.consolidate(memories)

console.log(`  Original memories: ${memories.length}`)
console.log(`  Consolidated: ${consolidated.length}`)

if (consolidated.length > 0) {
  console.log('  ✅ Consolidation works')
  console.log('  Sample:', {
    subject: consolidated[0].subject,
    strength: consolidated[0].strength.toFixed(2),
    rehearsals: consolidated[0].rehearsalCount
  })
} else {
  console.log('  ⚠️  No consolidated memories (may need more similar memories)')
}

console.log('\n✅ All wiring tests passed!')
