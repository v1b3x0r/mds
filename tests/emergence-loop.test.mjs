/**
 * MDS Layer 5 - Emergence Loop Integration Test
 * Tests emergence observability: metrics, events, and state tracking
 */

// Mock DOM for Node.js
global.document = {
  createElement: () => ({
    style: {},
    dataset: {},
    className: '',
    textContent: '',
    addEventListener: () => {},
    remove: () => {},
    appendChild: () => {}
  }),
  body: {
    appendChild: () => {}
  }
}

if (typeof navigator === 'undefined') {
  global.navigator = {
    language: 'en-US'
  }
}

global.performance = {
  now: () => Date.now()
}

global.requestAnimationFrame = (fn) => setTimeout(fn, 16)

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

console.log('\n🧪 MDS Layer 5 - Emergence Loop Integration Test\n')

// Test 1: World has emergence state
test('World has emergence property', () => {
  const world = new World({
    features: {
      linguistics: true,
      ontology: true,
      rendering: 'headless'
    }
  })

  assert(world.emergence, 'World should have emergence property')
  assert(typeof world.emergence.novelty === 'number', 'emergence.novelty should be number')
  assert(typeof world.emergence.coherence === 'number', 'emergence.coherence should be number')
  assert(typeof world.emergence.lexiconSize === 'number', 'emergence.lexiconSize should be number')
  assert(typeof world.emergence.activePatterns === 'number', 'emergence.activePatterns should be number')
  assert(typeof world.emergence.emotionalDensity === 'number', 'emergence.emotionalDensity should be number')

  world.destroy()
})

// Test 2: getEmergenceState() works
test('getEmergenceState() returns snapshot', () => {
  const world = new World({
    features: {
      linguistics: true,
      ontology: true,
      rendering: 'headless'
    }
  })

  const state = world.getEmergenceState()
  assert(state, 'Should return state object')
  assert(state !== world.emergence, 'Should return copy, not reference')
  assert(state.novelty === 0, 'Initial novelty should be 0')
  assert(state.coherence === 0, 'Initial coherence should be 0')
  assert(state.lexiconSize === 0, 'Initial lexiconSize should be 0')

  world.destroy()
})

// Test 3: Emergence events fire
test('emergence.chunk event fires when patterns emerge', (done) => {
  const world = new World({
    features: {
      linguistics: true,
      ontology: true,
      rendering: 'headless'
    },
    linguistics: {
      enabled: true,
      analyzeEvery: 5,  // analyze every 5 ticks
      minUsage: 2       // lower threshold for testing
    }
  })

  const entities = [
    world.spawn({ essence: 'Teacher' }, { x: 100, y: 100 }),
    world.spawn({ essence: 'Student' }, { x: 120, y: 100 })
  ]

  let chunkCount = 0
  let lastEvent = null

  world.on('emergence.chunk', (data) => {
    chunkCount++
    lastEvent = data
  })

  // Simulate conversation (more repetition to ensure patterns emerge)
  for (let i = 0; i < 50; i++) {
    world.recordSpeech(entities[0], `hello ${i % 3}`)  // more repetition (% 3 instead of % 5)
    world.recordSpeech(entities[1], `hi ${i % 3}`)
    world.tick(1)
  }

  assert(chunkCount > 0, `Should emit emergence.chunk events (got ${chunkCount})`)
  assert(lastEvent !== null, 'Should have event data')
  assert(lastEvent.newTerms > 0, `Should report new terms (got ${lastEvent.newTerms})`)
  assert(lastEvent.totalTerms > 0, `Should report total terms (got ${lastEvent.totalTerms})`)

  world.destroy()
})

// Test 4: Emergence state updates
test('Emergence state updates after patterns emerge', () => {
  const world = new World({
    features: {
      linguistics: true,
      ontology: true,
      rendering: 'headless'
    },
    linguistics: {
      enabled: true,
      analyzeEvery: 5,
      minUsage: 2
    }
  })

  const entities = [
    world.spawn({ essence: 'A' }, { x: 100, y: 100 }),
    world.spawn({ essence: 'B' }, { x: 120, y: 100 })
  ]

  // Initial state
  const before = world.getEmergenceState()
  assert(before.lexiconSize === 0, 'Should start with 0 lexicon size')

  // Simulate conversation
  for (let i = 0; i < 30; i++) {
    world.recordSpeech(entities[0], `hello ${i % 3}`)
    world.recordSpeech(entities[1], `hi there ${i % 3}`)
    world.tick(1)
  }

  // After state
  const after = world.getEmergenceState()
  assert(after.lexiconSize > 0, `Lexicon should have terms (got ${after.lexiconSize})`)
  assert(after.novelty >= 0 && after.novelty <= 1, 'Novelty should be 0..1')
  assert(after.coherence >= 0 && after.coherence <= 1, 'Coherence should be 0..1')

  world.destroy()
})

// Test 5: Emotional density tracking
test('Emotional density metric exists', () => {
  const world = new World({
    features: {
      linguistics: true,
      ontology: true,  // Need ontology for emotion
      rendering: 'headless'
    },
    linguistics: {
      enabled: true
    }
  })

  // Spawn with emotion config to initialize emotion system
  const entity = world.spawn({
    essence: 'Excited entity',
    emotion: {
      initial: { valence: 0.5, arousal: 0.8, dominance: 0.5 }
    }
  }, { x: 100, y: 100 })

  // Tick to update emergence state
  world.tick(1)

  const state = world.getEmergenceState()

  // Check that emotional density metric exists and is valid
  assert(typeof state.emotionalDensity === 'number', 'Emotional density should be a number')
  assert(state.emotionalDensity >= 0, 'Emotional density should be >= 0')
  assert(state.emotionalDensity <= 1, 'Emotional density should be <= 1')

  // If entity has emotion, density should reflect it
  if (entity.emotion) {
    assert(state.emotionalDensity > 0, `Entity has arousal ${entity.emotion.arousal}, density should be > 0 (got ${state.emotionalDensity.toFixed(2)})`)
  }

  world.destroy()
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50))

if (failCount === 0) {
  console.log('\n✅ All emergence loop tests passed!')
  console.log('\nLayer 5 Complete:')
  console.log('  ✓ Emergence state tracking')
  console.log('  ✓ Event emission (emergence.chunk)')
  console.log('  ✓ Metrics calculation (novelty, coherence, density)')
  console.log('  ✓ Integration with linguistics system')
} else {
  console.log('\n❌ Some tests failed')
  process.exit(1)
}
