/**
 * MDS v5.2 - Symbolic-Physical Coupling Tests
 * Test emotion → physics translation system
 */

import assert from 'node:assert'
import {
  SymbolicPhysicalCoupler,
  createCoupler,
  emotionToSpeed,
  emotionToMass,
  emotionToForce,
  emotionToPhysicsColor,
  COUPLING_PRESETS
} from '../dist/mds-core.esm.js'

console.log('\n🔗 MDS v5.2 - Symbolic-Physical Coupling Tests\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`✗ ${name}`)
    console.error(`  ${err.message}`)
    failed++
  }
}

// Test 1: SymbolicPhysicalCoupler instantiation
test('SymbolicPhysicalCoupler instantiation', () => {
  const coupler = new SymbolicPhysicalCoupler()
  assert(coupler.isEnabled() === true, 'Should be enabled by default')
})

// Test 2: Create coupler with config
test('Create coupler with custom config', () => {
  const coupler = createCoupler({
    arousalToSpeed: 1.0,
    valenceToMass: 0.5
  })
  const config = coupler.getConfig()
  assert(config.arousalToSpeed === 1.0, 'Should use custom arousalToSpeed')
  assert(config.valenceToMass === 0.5, 'Should use custom valenceToMass')
})

// Test 3: High arousal → increased speed
test('High arousal → increased speed', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const highArousal = { valence: 0, arousal: 1.0, dominance: 0 }
  const lowArousal = { valence: 0, arousal: -1.0, dominance: 0 }

  const highPhysics = coupler.emotionToPhysics(highArousal)
  const lowPhysics = coupler.emotionToPhysics(lowArousal)

  assert(highPhysics.speed > lowPhysics.speed, 'High arousal should increase speed')
  assert(highPhysics.speed > 1.0, 'High arousal should be faster than baseline')
})

// Test 4: Negative valence → increased mass
test('Negative valence → increased mass (sadness weighs down)', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const sad = { valence: -1.0, arousal: 0, dominance: 0 }
  const happy = { valence: 1.0, arousal: 0, dominance: 0 }

  const sadPhysics = coupler.emotionToPhysics(sad)
  const happyPhysics = coupler.emotionToPhysics(happy)

  assert(sadPhysics.mass > happyPhysics.mass, 'Sadness should increase mass')
  assert(sadPhysics.mass > 1.0, 'Sad mass should be above baseline')
})

// Test 5: High dominance → increased force
test('High dominance → increased force', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const dominant = { valence: 0, arousal: 0, dominance: 1.0 }
  const submissive = { valence: 0, arousal: 0, dominance: -1.0 }

  const dominantPhysics = coupler.emotionToPhysics(dominant)
  const submissivePhysics = coupler.emotionToPhysics(submissive)

  assert(dominantPhysics.forceMultiplier > submissivePhysics.forceMultiplier,
    'Dominance should increase force')
})

// Test 6: Negative valence → increased friction
test('Negative valence → increased friction', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const negative = { valence: -0.8, arousal: 0, dominance: 0 }
  const positive = { valence: 0.8, arousal: 0, dominance: 0 }

  const negativePhysics = coupler.emotionToPhysics(negative)
  const positivePhysics = coupler.emotionToPhysics(positive)

  assert(negativePhysics.friction > positivePhysics.friction,
    'Negative valence should increase friction (stuck, sluggish)')
})

// Test 7: Memory strength → attraction
test('Memory strength → attraction multiplier', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const weakMemory = coupler.memoryToAttraction(0.0)
  const strongMemory = coupler.memoryToAttraction(1.0)

  assert(strongMemory > weakMemory, 'Strong memories should increase attraction')
  assert(weakMemory === 1.0, 'No memory should be neutral (1.0)')
  assert(strongMemory > 1.0, 'Strong memory should increase attraction above baseline')
})

// Test 8: Intent to movement bias
test('Intent to movement bias', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const intent = {
    goal: 'approach',
    motivation: 0.8,
    priority: 1.0,
    confidence: 0.9
  }

  const targetPos = { x: 100, y: 100 }
  const currentPos = { x: 0, y: 0 }

  const bias = coupler.intentToMovement(intent, targetPos, currentPos)

  assert(bias.x > 0, 'Should bias towards target X')
  assert(bias.y > 0, 'Should bias towards target Y')
  assert(Math.abs(bias.x - bias.y) < 0.01, 'Should be equal for diagonal direction')
})

// Test 9: Intent without target (no bias)
test('Intent without target (no bias)', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const intent = {
    goal: 'wander',
    motivation: 0.5,
    priority: 1.0,
    confidence: 0.5
  }

  const bias = coupler.intentToMovement(intent, null, { x: 0, y: 0 })

  assert(bias.x === 0, 'No target should give zero X bias')
  assert(bias.y === 0, 'No target should give zero Y bias')
})

// Test 10: Modulate velocity (speed boost from arousal)
test('Modulate velocity (speed boost from arousal)', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const highArousal = { valence: 0, arousal: 1.0, dominance: 0 }
  const velocity = { vx: 10, vy: 10 }

  const modulated = coupler.modulateVelocity(velocity, highArousal)

  assert(modulated.vx > velocity.vx, 'High arousal should increase velocity X')
  assert(modulated.vy > velocity.vy, 'High arousal should increase velocity Y')
})

// Test 11: Modulate force (with emotion)
test('Modulate force (with emotion and memory)', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const dominant = { valence: 0, arousal: 0, dominance: 1.0 }
  const force = { fx: 5, fy: 5 }
  const memoryStrength = 0.8

  const modulated = coupler.modulateForce(force, dominant, memoryStrength)

  assert(modulated.fx > force.fx, 'Dominance + memory should amplify force X')
  assert(modulated.fy > force.fy, 'Dominance + memory should amplify force Y')
})

// Test 12: Get complete physical profile
test('Get complete physical profile', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const emotion = { valence: 0.5, arousal: 0.7, dominance: 0.3 }
  const profile = coupler.getPhysicalProfile(emotion)

  assert(typeof profile.mass === 'number', 'Profile should have mass')
  assert(typeof profile.friction === 'number', 'Profile should have friction')
  assert(typeof profile.speed === 'number', 'Profile should have speed')
  assert(typeof profile.forceMultiplier === 'number', 'Profile should have forceMultiplier')
  assert(typeof profile.bounce === 'number', 'Profile should have bounce')
})

// Test 13: Disable coupling
test('Disable coupling (no modulation)', () => {
  const coupler = new SymbolicPhysicalCoupler()

  coupler.setEnabled(false)
  assert(coupler.isEnabled() === false, 'Should be disabled')

  const emotion = { valence: 1.0, arousal: 1.0, dominance: 1.0 }
  const physics = coupler.emotionToPhysics(emotion)

  assert(Object.keys(physics).length === 0, 'Disabled coupler should return empty object')
})

// Test 14: Re-enable coupling
test('Re-enable coupling', () => {
  const coupler = new SymbolicPhysicalCoupler({ enabled: false })

  assert(coupler.isEnabled() === false, 'Should start disabled')

  coupler.setEnabled(true)
  assert(coupler.isEnabled() === true, 'Should be enabled after setEnabled(true)')

  const emotion = { valence: 0, arousal: 1.0, dominance: 0 }
  const physics = coupler.emotionToPhysics(emotion)

  assert(physics.speed !== undefined, 'Enabled coupler should return physics')
})

// Test 15: Update config
test('Update config', () => {
  const coupler = new SymbolicPhysicalCoupler()

  coupler.updateConfig({ arousalToSpeed: 2.0 })

  const config = coupler.getConfig()
  assert(config.arousalToSpeed === 2.0, 'Config should be updated')
})

// Test 16: emotionToSpeed helper
test('emotionToSpeed helper', () => {
  const highArousal = { valence: 0, arousal: 1.0, dominance: 0 }
  const lowArousal = { valence: 0, arousal: -1.0, dominance: 0 }

  const highSpeed = emotionToSpeed(highArousal)
  const lowSpeed = emotionToSpeed(lowArousal)

  assert(highSpeed > lowSpeed, 'High arousal should give higher speed')
  assert(highSpeed > 1.0, 'High arousal speed should be above baseline')
})

// Test 17: emotionToMass helper
test('emotionToMass helper', () => {
  const sad = { valence: -1.0, arousal: 0, dominance: 0 }
  const happy = { valence: 1.0, arousal: 0, dominance: 0 }

  const sadMass = emotionToMass(sad)
  const happyMass = emotionToMass(happy)

  assert(sadMass > happyMass, 'Sadness should give higher mass')
  assert(sadMass > 1.0, 'Sad mass should be above baseline')
})

// Test 18: emotionToForce helper
test('emotionToForce helper', () => {
  const dominant = { valence: 0, arousal: 0, dominance: 1.0 }
  const submissive = { valence: 0, arousal: 0, dominance: -1.0 }

  const dominantForce = emotionToForce(dominant)
  const submissiveForce = emotionToForce(submissive)

  assert(dominantForce > submissiveForce, 'Dominance should give higher force')
  assert(dominantForce > 1.0, 'Dominant force should be above baseline')
})

// Test 19: emotionToPhysicsColor helper
test('emotionToPhysicsColor helper', () => {
  const emotion = { valence: 0.5, arousal: 0.7, dominance: 0.3 }
  const color = emotionToPhysicsColor(emotion)

  assert(typeof color === 'string', 'Should return string')
  assert(color.startsWith('rgb('), 'Should be RGB format')
})

// Test 20: COUPLING_PRESETS - subtle
test('COUPLING_PRESETS - subtle', () => {
  const coupler = new SymbolicPhysicalCoupler(COUPLING_PRESETS.subtle)
  const config = coupler.getConfig()

  assert(config.arousalToSpeed < 0.5, 'Subtle should have low arousalToSpeed')
  assert(config.valenceToMass < 0.3, 'Subtle should have low valenceToMass')
})

// Test 21: COUPLING_PRESETS - extreme
test('COUPLING_PRESETS - extreme', () => {
  const coupler = new SymbolicPhysicalCoupler(COUPLING_PRESETS.extreme)
  const config = coupler.getConfig()

  assert(config.arousalToSpeed >= 1.0, 'Extreme should have high arousalToSpeed')
  assert(config.valenceToMass >= 0.5, 'Extreme should have high valenceToMass')
})

// Test 22: COUPLING_PRESETS - disabled
test('COUPLING_PRESETS - disabled', () => {
  const coupler = new SymbolicPhysicalCoupler(COUPLING_PRESETS.disabled)

  assert(coupler.isEnabled() === false, 'Disabled preset should disable coupling')
})

// Test 23: Mass clamping (0.5 - 2.0 range)
test('Mass clamping (0.5 - 2.0 range)', () => {
  const coupler = new SymbolicPhysicalCoupler({ valenceToMass: 10.0 }) // Extreme config

  const extremeSad = { valence: -1.0, arousal: 0, dominance: 0 }
  const extremeHappy = { valence: 1.0, arousal: 0, dominance: 0 }

  const sadPhysics = coupler.emotionToPhysics(extremeSad)
  const happyPhysics = coupler.emotionToPhysics(extremeHappy)

  assert(sadPhysics.mass <= 2.0, 'Mass should be capped at 2.0')
  assert(happyPhysics.mass >= 0.5, 'Mass should be floored at 0.5')
})

// Test 24: Speed never zero
test('Speed never zero (minimum 0.1)', () => {
  const coupler = new SymbolicPhysicalCoupler({ arousalToSpeed: -10.0 }) // Extreme config

  const extremeLowArousal = { valence: 0, arousal: -1.0, dominance: 0 }
  const physics = coupler.emotionToPhysics(extremeLowArousal)

  assert(physics.speed >= 0.1, 'Speed should never go below 0.1')
})

// Test 25: Friction clamping (0.1 - 1.0 range)
test('Friction clamping (0.1 - 1.0 range)', () => {
  const coupler = new SymbolicPhysicalCoupler()

  const extremeNegative = { valence: -1.0, arousal: 0, dominance: 0 }
  const physics = coupler.emotionToPhysics(extremeNegative)

  assert(physics.friction >= 0.1, 'Friction should be floored at 0.1')
  assert(physics.friction <= 1.0, 'Friction should be capped at 1.0')
})

// Summary
console.log('\n==================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('==================================================\n')

if (failed > 0) {
  console.error('❌ Coupling tests failed!')
  process.exit(1)
} else {
  console.log('✅ All coupling tests passed!\n')
  console.log('v5.2 Phase 2.3 Status:')
  console.log('  ✓ Emotion → Speed coupling (arousal)')
  console.log('  ✓ Emotion → Mass coupling (valence)')
  console.log('  ✓ Emotion → Force coupling (dominance)')
  console.log('  ✓ Memory → Attraction coupling')
  console.log('  ✓ Intent → Movement bias')
  console.log('  ✓ Velocity/force modulation')
  console.log('  ✓ Coupling presets (subtle/standard/extreme/disabled)')
  console.log('  ✓ Safety clamping (mass/speed/friction ranges)')
}
