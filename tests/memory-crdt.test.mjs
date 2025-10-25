/**
 * MDS v5.5 - Memory CRDT Tests
 * Tests for distributed memory with conflict-free replication
 */

import { MemoryLog, createMemoryLog, mergeLogs } from '../dist/mds-core.esm.js'

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

console.log('\n💾 Testing Memory CRDT (v5.5)')
console.log('=' .repeat(50))

// Test 1: Basic Append
console.log('\n1. Basic Append')
{
  const log = createMemoryLog('entity-a')

  const result = log.append({
    timestamp: 0,
    type: 'observation',
    subject: 'world',
    content: { event: 'sunrise' },
    salience: 0.8
  })

  assert(result.id === 'entity-a:1', 'Event ID is entity-a:1')
  assert(log.size() === 1, 'Log has 1 event')
}

// Test 2: Vector Clock Increment
console.log('\n2. Vector Clock Increment')
{
  const log = createMemoryLog('entity-a')

  log.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })
  log.append({ timestamp: 1, type: 'observation', subject: 'test', salience: 0.5 })
  log.append({ timestamp: 2, type: 'observation', subject: 'test', salience: 0.5 })

  const clock = log.getClock()
  assert(clock.get('entity-a') === 3, 'Vector clock is 3 after 3 appends')
}

// Test 3: Simple Merge (No Conflicts)
console.log('\n3. Simple Merge (No Conflicts)')
{
  const logA = createMemoryLog('entity-a')
  const logB = createMemoryLog('entity-b')

  logA.append({ timestamp: 0, type: 'observation', subject: 'world', salience: 0.8 })
  logB.append({ timestamp: 1, type: 'interaction', subject: 'entity-a', salience: 0.7 })

  const result = logA.merge(logB)

  assert(result.added === 1, 'Added 1 event from B')
  assert(result.conflicts === 0, 'No conflicts (CRDT)')
  assert(logA.size() === 2, 'Log A has 2 events after merge')
}

// Test 4: Merge Updates Vector Clock
console.log('\n4. Merge Updates Vector Clock')
{
  const logA = createMemoryLog('entity-a')
  const logB = createMemoryLog('entity-b')

  logA.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })
  logB.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })
  logB.append({ timestamp: 1, type: 'observation', subject: 'test', salience: 0.5 })

  logA.merge(logB)

  const clock = logA.getClock()
  assert(clock.get('entity-a') === 1, 'Clock for entity-a is 1')
  assert(clock.get('entity-b') === 2, 'Clock for entity-b is 2 (from B)')
}

// Test 5: Idempotent Merge (Same Event Twice)
console.log('\n5. Idempotent Merge (Same Event Twice)')
{
  const logA = createMemoryLog('entity-a')
  const logB = createMemoryLog('entity-b')

  logB.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })

  const result1 = logA.merge(logB)
  const result2 = logA.merge(logB)

  assert(result1.added === 1, 'First merge added 1 event')
  assert(result2.added === 0, 'Second merge added 0 events (idempotent)')
  assert(logA.size() === 1, 'Log has 1 event (not duplicated)')
}

// Test 6: Get Memories with Filter
console.log('\n6. Get Memories with Filter')
{
  const log = createMemoryLog('entity-a')

  log.append({ timestamp: 0, type: 'observation', subject: 'world', salience: 0.9 })
  log.append({ timestamp: 1, type: 'interaction', subject: 'entity-b', salience: 0.7 })
  log.append({ timestamp: 2, type: 'observation', subject: 'world', salience: 0.6 })

  const observations = log.getMemories({ type: 'observation' })
  assert(observations.length === 2, 'Filtered 2 observations')

  const worldMemories = log.getMemories({ subject: 'world' })
  assert(worldMemories.length === 2, 'Filtered 2 memories about world')

  const importantMemories = log.getMemories({ minSalience: 0.8 })
  assert(importantMemories.length === 1, 'Filtered 1 important memory')
}

// Test 7: Memory Strength
console.log('\n7. Memory Strength')
{
  const log = createMemoryLog('entity-a')

  log.append({ timestamp: 0, type: 'observation', subject: 'entity-b', salience: 0.5 })
  log.append({ timestamp: 1, type: 'observation', subject: 'entity-b', salience: 0.3 })
  log.append({ timestamp: 2, type: 'observation', subject: 'entity-c', salience: 0.8 })

  const strengthB = log.getStrength('entity-b')
  const strengthC = log.getStrength('entity-c')

  assert(Math.abs(strengthB - 0.8) < 0.01, 'Strength for entity-b is 0.8 (sum)')
  assert(Math.abs(strengthC - 0.8) < 0.01, 'Strength for entity-c is 0.8')
}

// Test 8: Has Seen Check
console.log('\n8. Has Seen Check')
{
  const logA = createMemoryLog('entity-a')
  const logB = createMemoryLog('entity-b')

  logB.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })
  logB.append({ timestamp: 1, type: 'observation', subject: 'test', salience: 0.5 })

  assert(!logA.hasSeen('entity-b', 1), 'A has not seen B:1 yet')

  logA.merge(logB)

  assert(logA.hasSeen('entity-b', 1), 'A has seen B:1 after merge')
  assert(logA.hasSeen('entity-b', 2), 'A has seen B:2 after merge')
  assert(!logA.hasSeen('entity-b', 3), 'A has not seen B:3')
}

// Test 9: Prune Old Events
console.log('\n9. Prune Old Events')
{
  const log = createMemoryLog('entity-a')

  log.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })
  log.append({ timestamp: 5, type: 'observation', subject: 'test', salience: 0.5 })
  log.append({ timestamp: 15, type: 'observation', subject: 'test', salience: 0.5 })

  const pruned = log.prune(10, 20)  // Keep last 10 seconds, current time = 20

  assert(pruned === 2, 'Pruned 2 old events')
  assert(log.size() === 1, 'Only 1 event remains')
}

// Test 10: Serialization
console.log('\n10. Serialization')
{
  const log = createMemoryLog('entity-a')

  log.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.9 })
  log.append({ timestamp: 1, type: 'interaction', subject: 'entity-b', salience: 0.7 })

  const json = log.toJSON()
  const restored = MemoryLog.fromJSON(json)

  assert(restored.size() === 2, 'Restored log has 2 events')
  assert(restored.getClock().get('entity-a') === 2, 'Vector clock restored')

  const memories = restored.getMemories()
  assert(memories.length === 2, 'All memories restored')
  assert(memories[0].type === 'interaction', 'Memory data intact (newest first)')
}

// Test 11: Merge Logs (Utility)
console.log('\n11. Merge Logs (Utility)')
{
  const logA = createMemoryLog('entity-a')
  const logB = createMemoryLog('entity-b')
  const logC = createMemoryLog('entity-c')

  logA.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })
  logB.append({ timestamp: 1, type: 'observation', subject: 'test', salience: 0.5 })
  logC.append({ timestamp: 2, type: 'observation', subject: 'test', salience: 0.5 })

  const merged = mergeLogs([logA, logB, logC])

  assert(merged.size() === 3, 'Merged log has 3 events')
  assert(merged.hasSeen('entity-a', 1), 'Merged log saw A')
  assert(merged.hasSeen('entity-b', 1), 'Merged log saw B')
  assert(merged.hasSeen('entity-c', 1), 'Merged log saw C')
}

// Test 12: Causal History
console.log('\n12. Causal History')
{
  const logA = createMemoryLog('entity-a')
  const logB = createMemoryLog('entity-b')
  const logC = createMemoryLog('entity-c')

  logA.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })
  logB.append({ timestamp: 0, type: 'observation', subject: 'test', salience: 0.5 })

  logA.merge(logB)
  logA.merge(logC)  // C is empty

  const history = logA.getCausalHistory()

  // Note: history includes A, B, and C (even though C is empty, merge adds it to clock)
  assert(history.length >= 2, 'Causal history has at least 2 entities')

  const entityIds = history.map(([id]) => id)
  assert(entityIds.includes('entity-a'), 'History includes entity-a')
  assert(entityIds.includes('entity-b'), 'History includes entity-b')
}

// Results
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
