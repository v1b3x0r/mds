/**
 * MDS v5.5 - Emotional Resonance Tests
 * Tests for emotion.resonate() function
 */

import { resonate, EMOTION_BASELINES } from '../dist/mds-core.esm.js'

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

function assertClose(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected)
  if (diff <= tolerance) {
    console.log(`  ✓ ${message} (${actual.toFixed(2)} ≈ ${expected.toFixed(2)})`)
    passed++
  } else {
    console.error(`  ✗ ${message} (${actual.toFixed(2)} != ${expected.toFixed(2)})`)
    failed++
  }
}

console.log('\n💓 Testing Emotional Resonance (v5.5)')
console.log('=' .repeat(50))

// Test 1: Basic Resonance (50%)
console.log('\n1. Basic Resonance (50%)')
{
  const self = { valence: 0, arousal: 0.5, dominance: 0.5 }
  const other = { valence: 0.8, arousal: 0.7, dominance: 0.6 }

  resonate(self, other, 0.5)

  // Expected: halfway between original and other
  assertClose(self.valence, 0.4, 0.01, 'Valence moved halfway')
  assertClose(self.arousal, 0.6, 0.01, 'Arousal moved halfway')
  assertClose(self.dominance, 0.55, 0.01, 'Dominance moved halfway')
}

// Test 2: Full Resonance (100%)
console.log('\n2. Full Resonance (100%)')
{
  const self = { valence: 0, arousal: 0.5, dominance: 0.5 }
  const other = { valence: 0.8, arousal: 0.7, dominance: 0.6 }

  resonate(self, other, 1.0)

  assertClose(self.valence, 0.8, 0.01, 'Valence fully copied')
  assertClose(self.arousal, 0.7, 0.01, 'Arousal fully copied')
  assertClose(self.dominance, 0.6, 0.01, 'Dominance fully copied')
}

// Test 3: No Resonance (0%)
console.log('\n3. No Resonance (0%)')
{
  const self = { valence: 0.2, arousal: 0.4, dominance: 0.5 }
  const other = { valence: 0.8, arousal: 0.7, dominance: 0.6 }

  resonate(self, other, 0)

  assertClose(self.valence, 0.2, 0.01, 'Valence unchanged')
  assertClose(self.arousal, 0.4, 0.01, 'Arousal unchanged')
  assertClose(self.dominance, 0.5, 0.01, 'Dominance unchanged')
}

// Test 4: Valence Clamping (Positive Limit)
console.log('\n4. Valence Clamping (Positive Limit)')
{
  const self = { valence: 0.9, arousal: 0.5, dominance: 0.5 }
  const other = { valence: 1.0, arousal: 0.5, dominance: 0.5 }

  resonate(self, other, 1.0)

  assertClose(self.valence, 1.0, 0.01, 'Valence clamped to 1.0')
}

// Test 5: Valence Clamping (Negative Limit)
console.log('\n5. Valence Clamping (Negative Limit)')
{
  const self = { valence: -0.9, arousal: 0.5, dominance: 0.5 }
  const other = { valence: -1.0, arousal: 0.5, dominance: 0.5 }

  resonate(self, other, 1.0)

  assertClose(self.valence, -1.0, 0.01, 'Valence clamped to -1.0')
}

// Test 6: Arousal Clamping (Lower Limit)
console.log('\n6. Arousal Clamping (Lower Limit)')
{
  const self = { valence: 0, arousal: 0.1, dominance: 0.5 }
  const other = { valence: 0, arousal: 0, dominance: 0.5 }

  resonate(self, other, 1.0)

  assertClose(self.arousal, 0, 0.01, 'Arousal clamped to 0')
}

// Test 7: Arousal Clamping (Upper Limit)
console.log('\n7. Arousal Clamping (Upper Limit)')
{
  const self = { valence: 0, arousal: 0.9, dominance: 0.5 }
  const other = { valence: 0, arousal: 1.0, dominance: 0.5 }

  resonate(self, other, 1.0)

  assertClose(self.arousal, 1.0, 0.01, 'Arousal clamped to 1.0')
}

// Test 8: Dominance Clamping
console.log('\n8. Dominance Clamping')
{
  const self = { valence: 0, arousal: 0.5, dominance: 0.1 }
  const other = { valence: 0, arousal: 0.5, dominance: 0 }

  resonate(self, other, 1.0)

  assertClose(self.dominance, 0, 0.01, 'Dominance clamped to 0')
}

// Test 9: Emotional Contagion (Happy → Neutral)
console.log('\n9. Emotional Contagion (Happy → Neutral)')
{
  const neutral = { ...EMOTION_BASELINES.neutral }
  const happy = { ...EMOTION_BASELINES.happy }

  resonate(neutral, happy, 0.3)  // 30% contagion

  assert(neutral.valence > 0, 'Neutral became slightly happier')
  assert(neutral.arousal > 0.5, 'Neutral became more excited')
}

// Test 10: Emotional Contagion (Anxious → Calm)
console.log('\n10. Emotional Contagion (Anxious → Calm)')
{
  const anxious = { ...EMOTION_BASELINES.anxious }
  const calm = { ...EMOTION_BASELINES.calm }

  resonate(anxious, calm, 0.5)  // 50% calming

  assert(anxious.valence > EMOTION_BASELINES.anxious.valence, 'Anxiety reduced')
  assert(anxious.arousal < EMOTION_BASELINES.anxious.arousal, 'Arousal decreased')
}

// Test 11: Strength Over-Clamping
console.log('\n11. Strength Over-Clamping')
{
  const self = { valence: 0, arousal: 0.5, dominance: 0.5 }
  const other = { valence: 0.8, arousal: 0.7, dominance: 0.6 }

  // Strength > 1.0 should be clamped to 1.0
  resonate(self, other, 2.0)

  assertClose(self.valence, 0.8, 0.01, 'Valence (strength clamped to 1.0)')
  assertClose(self.arousal, 0.7, 0.01, 'Arousal (strength clamped to 1.0)')
}

// Test 12: Negative Strength Clamping
console.log('\n12. Negative Strength Clamping')
{
  const self = { valence: 0.5, arousal: 0.5, dominance: 0.5 }
  const other = { valence: 0.8, arousal: 0.7, dominance: 0.6 }

  // Negative strength should be clamped to 0
  resonate(self, other, -0.5)

  assertClose(self.valence, 0.5, 0.01, 'Valence unchanged (negative strength)')
  assertClose(self.arousal, 0.5, 0.01, 'Arousal unchanged (negative strength)')
}

// Test 13: Repeated Resonance
console.log('\n13. Repeated Resonance')
{
  const self = { valence: 0, arousal: 0.5, dominance: 0.5 }
  const other = { valence: 0.8, arousal: 0.7, dominance: 0.6 }

  // Apply resonance multiple times
  resonate(self, other, 0.1)
  resonate(self, other, 0.1)
  resonate(self, other, 0.1)

  // Should converge toward other
  assert(self.valence > 0.2, 'Valence increased over time')
  assert(self.arousal > 0.5, 'Arousal increased over time')
}

// Test 14: Divergent Emotions
console.log('\n14. Divergent Emotions')
{
  const self = { valence: 0.5, arousal: 0.6, dominance: 0.5 }
  const other = { valence: -0.5, arousal: 0.3, dominance: 0.4 }

  resonate(self, other, 0.5)

  assert(self.valence < 0.5, 'Valence decreased (pulled toward negative)')
  assert(self.arousal < 0.6, 'Arousal decreased')
  assert(self.dominance < 0.5, 'Dominance decreased')
}

// Test 15: Identical Emotions (No Change)
console.log('\n15. Identical Emotions (No Change)')
{
  const self = { valence: 0.5, arousal: 0.5, dominance: 0.5 }
  const other = { valence: 0.5, arousal: 0.5, dominance: 0.5 }

  resonate(self, other, 0.8)

  assertClose(self.valence, 0.5, 0.01, 'Valence unchanged (identical emotions)')
  assertClose(self.arousal, 0.5, 0.01, 'Arousal unchanged (identical emotions)')
  assertClose(self.dominance, 0.5, 0.01, 'Dominance unchanged (identical emotions)')
}

// Results
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
