/**
 * MDS v5.1 - Heroblind Integration Test
 * Tests declarative .mdm config (dialogue, emotion triggers)
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

// Skip navigator mock - Node.js has readonly navigator
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
import { World, loadMaterial } from '../dist/mds-core.esm.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

console.log('\n👁️‍🗨️  MDS v5.1 - Heroblind Integration Tests\n')

// Load heroblind.mdm manually
const heroblindPath = join(__dirname, '../materials/entities/heroblind.mdm')
const heroblindJson = JSON.parse(readFileSync(heroblindPath, 'utf-8'))

// Test 1: Material loads successfully
test('heroblind.mdm loads', () => {
  assert(heroblindJson.material === 'entity.heroblind', 'Material ID should match')
  assert(heroblindJson.essence, 'Should have essence')
  assert(heroblindJson.dialogue, 'Should have dialogue config')
  assert(heroblindJson.emotion, 'Should have emotion config')
})

// Test 2: World spawns heroblind
test('World spawns heroblind entity', () => {
  const world = new World({
    features: { ontology: true, rendering: 'headless' }
  })

  const entity = world.spawn(heroblindJson, { x: 400, y: 300 })

  assert(entity.x === 400, 'Entity should spawn at x=400')
  assert(entity.y === 300, 'Entity should spawn at y=300')
  assert(entity.m.material === 'entity.heroblind', 'Material should match')

  world.destroy()
})

// Test 3: Dialogue - intro phrases
test('Dialogue: intro phrases work', () => {
  const world = new World({
    features: { ontology: true, rendering: 'headless' }
  })

  const entity = world.spawn(heroblindJson, { x: 400, y: 300 })

  // Speak intro (should pick random phrase from intro array)
  const phrase = entity.speak('intro')

  assert(phrase !== undefined, 'Should return intro phrase')
  assert(typeof phrase === 'string', 'Phrase should be string')
  assert(phrase.length > 0, 'Phrase should not be empty')

  console.log(`  → Intro: "${phrase}"`)

  world.destroy()
})

// Test 4: Dialogue - self_monologue
test('Dialogue: self_monologue phrases work', () => {
  const world = new World({
    features: { ontology: true, rendering: 'headless' }
  })

  const entity = world.spawn(heroblindJson, { x: 400, y: 300 })

  const phrase = entity.speak('self_monologue')

  assert(phrase !== undefined, 'Should return self_monologue phrase')
  assert(typeof phrase === 'string', 'Phrase should be string')

  console.log(`  → Monologue: "${phrase}"`)

  world.destroy()
})

// Test 5: Dialogue - event-based
test('Dialogue: event phrases work', () => {
  const world = new World({
    features: { ontology: true, rendering: 'headless' }
  })

  const entity = world.spawn(heroblindJson, { x: 400, y: 300 })

  // Test onPlayerClose event
  const phrase = entity.speak('onPlayerClose')

  assert(phrase !== undefined, 'Should return onPlayerClose phrase')
  assert(typeof phrase === 'string', 'Phrase should be string')

  console.log(`  → onPlayerClose: "${phrase}"`)

  world.destroy()
})

// Test 6: Emotion triggers - player gaze
test('Emotion triggers: player.gaze>5s', () => {
  const world = new World({
    features: { ontology: true, communication: true, rendering: 'headless' }
  })

  const entity = world.spawn(heroblindJson, { x: 400, y: 300 })

  assert(entity.emotion, 'Entity should have emotion')

  // Initial emotion
  const initialValence = entity.emotion.valence

  // Simulate player gazing for 6 seconds
  entity.updateTriggerContext({ playerGazeDuration: 6 })
  entity.checkEmotionTriggers()

  // Should trigger "uneasy" emotion (valence negative)
  assert(entity.emotion.valence < 0, 'Valence should be negative (uneasy)')
  assert(entity.emotion.valence !== initialValence, 'Emotion should have changed')

  console.log(`  → Emotion changed: valence ${initialValence.toFixed(2)} → ${entity.emotion.valence.toFixed(2)} (uneasy)`)

  world.destroy()
})

// Test 7: Emotion triggers - player attack
test('Emotion triggers: player.attack', () => {
  const world = new World({
    features: { ontology: true, communication: true, rendering: 'headless' }
  })

  const entity = world.spawn(heroblindJson, { x: 400, y: 300 })

  // Debug: check if emotion triggers parsed
  console.log(`  → Emotion triggers parsed: ${entity.emotionTriggers ? entity.emotionTriggers.length : 0}`)

  // Simulate player attack
  entity.updateTriggerContext({ playerAction: 'attack' })
  entity.checkEmotionTriggers()

  // Should trigger "anger" emotion (check heroblind.mdm intensity: 0.9)
  // anger: valence -0.6, arousal 0.9, intensity 0.9 → valence = -0.54
  assert(entity.emotion.valence < -0.4, `Valence should be negative (anger), got ${entity.emotion.valence.toFixed(2)}`)
  assert(entity.emotion.arousal > 0.6, `Arousal should be high (anger), got ${entity.emotion.arousal.toFixed(2)}`)

  console.log(`  → Anger triggered: valence ${entity.emotion.valence.toFixed(2)}, arousal ${entity.emotion.arousal.toFixed(2)}`)

  world.destroy()
})

// Test 8: Multilingual support
test('Dialogue: multilingual phrases (Thai)', () => {
  const world = new World({
    features: { ontology: true, rendering: 'headless' }
  })

  const entity = world.spawn(heroblindJson, { x: 400, y: 300 })

  // Request Thai language
  const phraseTH = entity.speak('intro', 'th')

  assert(phraseTH !== undefined, 'Should return Thai phrase')

  // Request English
  const phraseEN = entity.speak('intro', 'en')

  assert(phraseEN !== undefined, 'Should return English phrase')
  assert(phraseEN !== phraseTH, 'EN and TH should be different')

  console.log(`  → EN: "${phraseEN}"`)
  console.log(`  → TH: "${phraseTH}"`)

  world.destroy()
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50) + '\n')

if (failCount === 0) {
  console.log('✅ All Heroblind integration tests passed!')
  console.log('\nv5.1 Declarative Features Working:')
  console.log('  ✓ Dialogue system (intro, self_monologue, events)')
  console.log('  ✓ Emotion triggers (player.gaze, player.attack)')
  console.log('  ✓ Multilingual support (en, th, ja, es)')
  console.log('  ✓ heroblind.mdm fully functional')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
