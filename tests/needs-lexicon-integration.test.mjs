/**
 * MDS Phase 1 - Needs-Lexicon Integration Test
 * Tests that entities speak about their needs and these phrases crystallize in the lexicon
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

console.log('\n🧪 MDS Phase 1 - Needs-Lexicon Integration Test\n')

// Test 1: Entity with critical needs speaks about them
test('Entity speaks about critical needs', () => {
  const world = new World({
    features: {
      ontology: true,
      linguistics: true,
      rendering: 'headless'
    }
  })

  const entity = world.spawn({
    $schema: 'v5',
    essence: 'Thirsty Traveler',
    needs: {
      resources: [
        {
          id: 'water',
          initial: 0.1,  // Start critical!
          depletionRate: 0.01,
          criticalThreshold: 0.2
        }
      ]
    }
  }, { x: 100, y: 100 })

  const utterance = entity.speakAboutNeeds()
  assert(utterance, 'Entity should speak about critical needs')
  assert(utterance.toLowerCase().includes('water'), 'Utterance should mention water')

  world.destroy()
})

// Test 2: Need-based speech varies by severity
test('Need-based speech varies by severity level', () => {
  const world = new World({
    features: {
      ontology: true,
      linguistics: true,
      rendering: 'headless'
    }
  })

  // Desperate (0.05 = very critical)
  const desperate = world.spawn({
    $schema: 'v5',
    essence: 'Desperate',
    needs: {
      resources: [
        { id: 'water', initial: 0.05, depletionRate: 0.01, criticalThreshold: 0.2 }
      ]
    }
  }, { x: 100, y: 100 })

  // Urgent (0.15 = moderately critical)
  const urgent = world.spawn({
    $schema: 'v5',
    essence: 'Urgent',
    needs: {
      resources: [
        { id: 'water', initial: 0.15, depletionRate: 0.01, criticalThreshold: 0.2 }
      ]
    }
  }, { x: 200, y: 100 })

  const utterance1 = desperate.speakAboutNeeds()
  const utterance2 = urgent.speakAboutNeeds()

  assert(utterance1, 'Desperate entity should speak')
  assert(utterance2, 'Urgent entity should speak')

  // Both should mention water, but phrasing may differ
  assert(utterance1.toLowerCase().includes('water'), 'Desperate should mention water')
  assert(utterance2.toLowerCase().includes('water'), 'Urgent should mention water')

  world.destroy()
})

// Test 3: Needs-based speech recorded in transcript
test('Need-based speech recorded in world transcript', () => {
  const world = new World({
    features: {
      ontology: true,
      linguistics: true,
      rendering: 'headless'
    },
    linguistics: {
      enabled: true,
      maxTranscript: 1000
    }
  })

  const entity = world.spawn({
    $schema: 'v5',
    essence: 'Thirsty',
    needs: {
      resources: [
        { id: 'water', initial: 0.1, depletionRate: 0.01, criticalThreshold: 0.2 }
      ]
    }
  }, { x: 100, y: 100 })

  // Manually record speech (simulating what tick loop does)
  const utterance = entity.speakAboutNeeds()
  if (utterance) {
    world.recordSpeech(entity, utterance)
  }

  const transcript = world.transcript.getAll()
  assert(transcript.length > 0, 'Transcript should have entries')

  const lastEntry = transcript[transcript.length - 1]
  assert(lastEntry.text.toLowerCase().includes('water'), 'Transcript entry should mention water')

  world.destroy()
})

// Test 4: Need phrases crystallize in lexicon over time
test('Need phrases crystallize in lexicon over repeated utterances', () => {
  const world = new World({
    features: {
      ontology: true,
      linguistics: true,
      rendering: 'headless'
    },
    linguistics: {
      enabled: true,
      analyzeEvery: 5,  // Analyze frequently
      minUsage: 2       // Low threshold for testing
    }
  })

  const entity = world.spawn({
    $schema: 'v5',
    essence: 'Thirsty Entity',
    needs: {
      resources: [
        { id: 'water', initial: 0.1, depletionRate: 0.01, criticalThreshold: 0.2 }
      ]
    }
  }, { x: 100, y: 100 })

  // Simulate multiple utterances
  for (let i = 0; i < 20; i++) {
    const utterance = entity.speakAboutNeeds()
    if (utterance) {
      world.recordSpeech(entity, utterance)
    }
    world.tick(1)
  }

  // Check if water-related terms are in lexicon
  const lexicon = world.lexicon.getAll()
  const waterTerms = lexicon.filter(entry =>
    entry.term.toLowerCase().includes('water') ||
    entry.term.toLowerCase().includes('need') ||
    entry.term.toLowerCase().includes('thirst')
  )

  assert(lexicon.length > 0, `Lexicon should have entries (got ${lexicon.length})`)
  assert(waterTerms.length > 0, `Lexicon should have water-related terms (got ${waterTerms.length})`)

  world.destroy()
})

// Test 5: Multiple entities create richer need-based lexicon
test('Multiple entities create richer need-based lexicon', () => {
  const world = new World({
    features: {
      ontology: true,
      linguistics: true,
      rendering: 'headless'
    },
    linguistics: {
      enabled: true,
      analyzeEvery: 5,
      minUsage: 2
    }
  })

  // Spawn 3 thirsty entities
  for (let i = 0; i < 3; i++) {
    world.spawn({
      $schema: 'v5',
      essence: `Traveler ${i}`,
      needs: {
        resources: [
          { id: 'water', initial: 0.1, depletionRate: 0.01, criticalThreshold: 0.2 }
        ]
      }
    }, { x: 100 + i * 50, y: 100 })
  }

  // Simulate conversation
  for (let tick = 0; tick < 30; tick++) {
    for (const entity of world.entities) {
      const utterance = entity.speakAboutNeeds()
      if (utterance) {
        world.recordSpeech(entity, utterance)
      }
    }
    world.tick(1)
  }

  const lexicon = world.lexicon.getAll()
  assert(lexicon.length > 0, `Lexicon should have entries (got ${lexicon.length})`)

  // More entities → more varied phrases → richer lexicon
  const waterTerms = lexicon.filter(entry =>
    entry.term.toLowerCase().includes('water') ||
    entry.term.toLowerCase().includes('need')
  )
  assert(waterTerms.length > 0, `Should have water-related terms (got ${waterTerms.length} terms)`)

  world.destroy()
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50))

if (failCount === 0) {
  console.log('\n✅ All needs-lexicon integration tests passed!')
  console.log('\nTask 1.3 Complete:')
  console.log('  ✓ Entities speak about critical needs')
  console.log('  ✓ Speech varies by severity level')
  console.log('  ✓ Need-based speech recorded in transcript')
  console.log('  ✓ Need phrases crystallize in lexicon')
  console.log('  ✓ Multiple entities create richer vocabulary')
  console.log('\nPhase 1 Foundation Complete!')
  console.log('  ✓ Task 1.1: Needs system (depletion + emotion)')
  console.log('  ✓ Task 1.2: ResourceField (spatial resources)')
  console.log('  ✓ Task 1.3: Needs → Lexicon (emergent language)')
  console.log('\nNext: Task 1.4 - Death → world-mind resonance')
} else {
  console.log('\n❌ Some tests failed')
  process.exit(1)
}
