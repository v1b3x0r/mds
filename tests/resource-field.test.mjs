/**
 * MDS Phase 1 - Resource Field System Test
 * Tests spatial resource distribution, sensing, and consumption
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

console.log('\n🧪 MDS Phase 1 - Resource Field System Test\n')

// Test 1: Add resource field to world
test('Add resource field to world', () => {
  const world = new World({
    features: {
      rendering: 'headless'
    }
  })

  const field = world.addResourceField({
    id: 'well_1',
    resourceType: 'water',
    type: 'point',
    position: { x: 200, y: 200 },
    intensity: 1.0,
    regenerationRate: 0.005
  })

  assert(field, 'Field should be returned')
  assert(world.getResourceField('well_1'), 'Field should be retrievable by ID')

  const fields = world.getResourceFields('water')
  assert(fields.length === 1, 'Should have 1 water field')

  world.destroy()
})

// Test 2: Point source intensity calculation
test('Point source intensity decreases with distance', () => {
  const world = new World({
    features: {
      rendering: 'headless'
    }
  })

  world.addResourceField({
    id: 'well_1',
    resourceType: 'water',
    type: 'point',
    position: { x: 200, y: 200 },
    intensity: 1.0
  })

  // At source position
  const intensityAtSource = world.getResourceIntensity('water', 200, 200)
  assert(intensityAtSource > 0.9, `Intensity at source should be high (got ${intensityAtSource})`)

  // At distance
  const intensityFar = world.getResourceIntensity('water', 400, 400)
  assert(intensityFar < intensityAtSource, `Intensity should decrease with distance (${intensityFar} < ${intensityAtSource})`)

  world.destroy()
})

// Test 3: Area source uniform intensity
test('Area source has uniform intensity within bounds', () => {
  const world = new World({
    features: {
      rendering: 'headless'
    }
  })

  world.addResourceField({
    id: 'oasis_1',
    resourceType: 'water',
    type: 'area',
    area: { x: 100, y: 100, width: 50, height: 50 },
    intensity: 0.8
  })

  // Inside area
  const insideIntensity = world.getResourceIntensity('water', 125, 125)
  assert(Math.abs(insideIntensity - 0.8) < 0.01, `Intensity inside should be 0.8 (got ${insideIntensity})`)

  // Outside area
  const outsideIntensity = world.getResourceIntensity('water', 200, 200)
  assert(outsideIntensity === 0, `Intensity outside should be 0 (got ${outsideIntensity})`)

  world.destroy()
})

// Test 4: Gradient source falloff
test('Gradient source intensity falls off with distance', () => {
  const world = new World({
    features: {
      rendering: 'headless'
    }
  })

  world.addResourceField({
    id: 'lake_1',
    resourceType: 'water',
    type: 'gradient',
    gradient: { center: { x: 300, y: 300 }, radius: 100, falloff: 0.8 },
    intensity: 1.0
  })

  // At center
  const centerIntensity = world.getResourceIntensity('water', 300, 300)
  assert(centerIntensity > 0.9, `Intensity at center should be high (got ${centerIntensity})`)

  // At edge (within radius)
  const edgeIntensity = world.getResourceIntensity('water', 390, 300)
  assert(edgeIntensity > 0 && edgeIntensity < centerIntensity,
    `Intensity at edge should be between 0 and center (got ${edgeIntensity})`)

  // Outside radius
  const outsideIntensity = world.getResourceIntensity('water', 450, 300)
  assert(outsideIntensity === 0, `Intensity outside radius should be 0 (got ${outsideIntensity})`)

  world.destroy()
})

// Test 5: Find nearest field
test('findNearestResourceField finds closest field', () => {
  const world = new World({
    features: {
      rendering: 'headless'
    }
  })

  world.addResourceField({
    id: 'well_1',
    resourceType: 'water',
    type: 'point',
    position: { x: 100, y: 100 },
    intensity: 1.0
  })

  world.addResourceField({
    id: 'well_2',
    resourceType: 'water',
    type: 'point',
    position: { x: 300, y: 300 },
    intensity: 1.0
  })

  // Entity closer to well_1
  const nearest = world.findNearestResourceField(110, 110, 'water')
  assert(nearest, 'Should find nearest field')
  assert(nearest.id === 'well_1', `Should find well_1 (got ${nearest.id})`)

  // Entity closer to well_2
  const nearest2 = world.findNearestResourceField(290, 290, 'water')
  assert(nearest2.id === 'well_2', `Should find well_2 (got ${nearest2.id})`)

  world.destroy()
})

// Test 6: Consume resource depletes field
test('Consuming resource depletes field intensity', () => {
  const world = new World({
    features: {
      rendering: 'headless'
    }
  })

  world.addResourceField({
    id: 'well_1',
    resourceType: 'water',
    type: 'point',
    position: { x: 200, y: 200 },
    intensity: 1.0
  })

  const beforeIntensity = world.getResourceField('well_1').intensity
  assert(beforeIntensity === 1.0, 'Initial intensity should be 1.0')

  // Consume water
  const consumed = world.consumeResource('water', 200, 200, 0.3)
  assert(consumed > 0, 'Should consume some water')

  const afterIntensity = world.getResourceField('well_1').intensity
  assert(afterIntensity < beforeIntensity,
    `Intensity should decrease after consumption (${afterIntensity} < ${beforeIntensity})`)

  world.destroy()
})

// Test 7: Field regeneration over time
test('Resource fields regenerate over time', () => {
  const world = new World({
    features: {
      rendering: 'headless'
    }
  })

  world.addResourceField({
    id: 'well_1',
    resourceType: 'water',
    type: 'point',
    position: { x: 200, y: 200 },
    intensity: 0.5,  // Start depleted
    regenerationRate: 0.1  // Fast regeneration for testing
  })

  const beforeIntensity = world.getResourceField('well_1').intensity
  assert(beforeIntensity === 0.5, 'Initial intensity should be 0.5')

  // Tick world (triggers field update)
  for (let i = 0; i < 3; i++) {
    world.tick(1)
  }

  const afterIntensity = world.getResourceField('well_1').intensity
  assert(afterIntensity > beforeIntensity,
    `Intensity should regenerate (${afterIntensity} > ${beforeIntensity})`)

  world.destroy()
})

// Test 8: Field depletion over time
test('Resource fields deplete naturally over time', () => {
  const world = new World({
    features: {
      rendering: 'headless'
    }
  })

  world.addResourceField({
    id: 'puddle_1',
    resourceType: 'water',
    type: 'point',
    position: { x: 200, y: 200 },
    intensity: 1.0,
    depletionRate: 0.1  // Fast depletion for testing
  })

  const beforeIntensity = world.getResourceField('puddle_1').intensity
  assert(beforeIntensity === 1.0, 'Initial intensity should be 1.0')

  // Tick world (triggers field update)
  for (let i = 0; i < 5; i++) {
    world.tick(1)
  }

  const afterIntensity = world.getResourceField('puddle_1').intensity
  assert(afterIntensity < beforeIntensity,
    `Intensity should deplete (${afterIntensity} < ${beforeIntensity})`)

  world.destroy()
})

// Summary
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(50))

if (failCount === 0) {
  console.log('\n✅ All resource field tests passed!')
  console.log('\nTask 1.2 Complete:')
  console.log('  ✓ ResourceField type system')
  console.log('  ✓ Point, area, and gradient sources')
  console.log('  ✓ Spatial intensity calculation')
  console.log('  ✓ Resource consumption API')
  console.log('  ✓ Field regeneration and depletion')
  console.log('  ✓ Find nearest field')
  console.log('\nNext: Task 1.3 - Link needs depletion to lexicon')
} else {
  console.log('\n❌ Some tests failed')
  process.exit(1)
}
