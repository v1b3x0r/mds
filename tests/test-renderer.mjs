/**
 * MDS v5 - Renderer Abstraction Tests
 * Tests DOMRenderer, CanvasRenderer, and HeadlessRenderer
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

global.requestAnimationFrame = (fn) => setTimeout(fn, 16)

// Import MDS
import { World } from '../dist/mds-core.esm.js'

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

console.log('\n🎨 MDS v5 - Renderer Abstraction Tests\n')

// Test material
const testMaterial = {
  material: 'test.renderer',
  manifestation: { emoji: '🎨' }
}

const v5Material = {
  $schema: 'https://mds.v1b3.dev/schema/v5',
  material: 'test.v5.renderer',
  manifestation: { emoji: '🧠' },
  ontology: {}
}

// Test 1: DOM renderer (default)
test('DOM renderer (default mode)', () => {
  const world = new World()
  const entity = world.spawn(testMaterial, { x: 100, y: 100 })

  assert(entity.x === 100, 'Entity should spawn at x=100')
  assert(entity.y === 100, 'Entity should spawn at y=100')
  assert(entity.el, 'Entity should have DOM element in DOM mode')

  world.destroy()
})

// Test 2: DOM renderer (explicit)
test('DOM renderer (explicit)', () => {
  const world = new World({ features: { rendering: 'dom' } })
  const entity = world.spawn(testMaterial, { x: 50, y: 50 })

  assert(entity.el, 'Entity should have DOM element with explicit DOM renderer')

  world.destroy()
})

// Test 3: Canvas renderer
test('Canvas renderer', () => {
  const world = new World({ features: { rendering: 'canvas' } })
  const entity = world.spawn(testMaterial, { x: 200, y: 200 })

  assert(!entity.el, 'Entity should NOT have DOM element in Canvas mode')
  assert(entity.x === 200, 'Entity physics still work')

  world.destroy()
})

// Test 4: Headless renderer
test('Headless renderer', () => {
  const world = new World({ features: { rendering: 'headless' } })
  const entity = world.spawn(testMaterial, { x: 300, y: 300 })

  assert(!entity.el, 'Entity should NOT have DOM element in Headless mode')
  assert(entity.x === 300, 'Entity physics still work')

  world.destroy()
})

// Test 5: Canvas renderer with ontology
test('Canvas renderer with ontology', () => {
  const world = new World({
    features: {
      rendering: 'canvas',
      ontology: true
    }
  })
  const entity = world.spawn(v5Material, { x: 100, y: 100 })

  assert(!entity.el, 'No DOM element in Canvas mode')
  assert(entity.memory, 'Ontology should be initialized')
  assert(entity.emotion, 'Emotion should be initialized')

  world.destroy()
})

// Test 6: Headless renderer with ontology
test('Headless renderer with ontology', () => {
  const world = new World({
    features: {
      rendering: 'headless',
      ontology: true
    }
  })
  const entity = world.spawn(v5Material, { x: 100, y: 100 })

  assert(!entity.el, 'No DOM element in Headless mode')
  assert(entity.memory, 'Ontology should be initialized')
  assert(entity.emotion, 'Emotion should be initialized')

  world.destroy()
})

// Test 7: Tick loop with Canvas renderer
test('Tick loop with Canvas renderer', () => {
  const world = new World({ features: { rendering: 'canvas' } })
  world.spawn(testMaterial, { x: 0, y: 0 })

  const initialTime = world.worldTime
  world.tick(0.016)  // One frame

  assert(world.worldTime > initialTime, 'World time should advance')
  assert(world.tickCount === 1, 'Tick count should increment')

  world.destroy()
})

// Test 8: Tick loop with Headless renderer
test('Tick loop with Headless renderer', () => {
  const world = new World({ features: { rendering: 'headless' } })
  world.spawn(testMaterial, { x: 0, y: 0 })

  const initialTime = world.worldTime
  world.tick(0.016)  // One frame

  assert(world.worldTime > initialTime, 'World time should advance')
  assert(world.tickCount === 1, 'Tick count should increment')

  world.destroy()
})

// Test 9: Multiple entities with Canvas renderer
test('Multiple entities with Canvas renderer', () => {
  const world = new World({
    features: {
      rendering: 'canvas',
      ontology: true
    }
  })

  const e1 = world.spawn(v5Material, { x: 50, y: 50 })
  const e2 = world.spawn(v5Material, { x: 100, y: 100 })

  assert(world.entities.length === 2, 'Should have 2 entities')
  assert(!e1.el && !e2.el, 'Neither should have DOM elements')

  // Tick a few times
  for (let i = 0; i < 60; i++) {
    world.tick(0.016)
  }

  assert(world.tickCount === 60, 'Should complete 60 ticks')

  world.destroy()
})

// Test 10: Entity removal with renderers
test('Entity removal with renderers', () => {
  const world = new World({ features: { rendering: 'canvas' } })
  const entity = world.spawn(testMaterial, { x: 0, y: 0 })

  assert(world.entities.length === 1, 'Should have 1 entity')

  world.removeEntity(entity)

  assert(world.entities.length === 0, 'Should have 0 entities after removal')

  world.destroy()
})

// Test 11: Clear with renderers
test('Clear with renderers', () => {
  const world = new World({ features: { rendering: 'headless' } })
  world.spawn(testMaterial, { x: 0, y: 0 })
  world.spawn(testMaterial, { x: 100, y: 100 })
  world.spawn(testMaterial, { x: 200, y: 200 })

  assert(world.entities.length === 3, 'Should have 3 entities')

  world.clear()

  assert(world.entities.length === 0, 'Should have 0 entities after clear')

  world.destroy()
})

// Test 12: Renderer mode switching (via new World)
test('Renderer mode switching (new World)', () => {
  const worldDOM = new World({ features: { rendering: 'dom' } })
  const entityDOM = worldDOM.spawn(testMaterial, { x: 0, y: 0 })
  assert(entityDOM.el, 'DOM mode should create DOM element')
  worldDOM.destroy()

  const worldCanvas = new World({ features: { rendering: 'canvas' } })
  const entityCanvas = worldCanvas.spawn(testMaterial, { x: 0, y: 0 })
  assert(!entityCanvas.el, 'Canvas mode should not create DOM element')
  worldCanvas.destroy()

  const worldHeadless = new World({ features: { rendering: 'headless' } })
  const entityHeadless = worldHeadless.spawn(testMaterial, { x: 0, y: 0 })
  assert(!entityHeadless.el, 'Headless mode should not create DOM element')
  worldHeadless.destroy()
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50) + '\n')

if (failCount === 0) {
  console.log('✅ All Renderer abstraction tests passed!')
  console.log('\nPhase 3 Renderer Tests Complete:')
  console.log('  ✓ DOM renderer works (default + explicit)')
  console.log('  ✓ Canvas renderer works (no DOM elements)')
  console.log('  ✓ Headless renderer works (simulation only)')
  console.log('  ✓ Renderers work with ontology enabled')
  console.log('  ✓ Tick loop works with all renderers')
  console.log('  ✓ Entity removal/clear works with all renderers')
  console.log('  ✓ Renderer modes are independent and switchable')
  process.exit(0)
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}
