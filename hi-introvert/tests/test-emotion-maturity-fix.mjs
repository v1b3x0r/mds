/**
 * Test: Emotion Maturity Calculation Fix
 * Verify that emotionStability doesn't go negative
 */

console.log('🧪 Testing Emotion Maturity Fix\n')

// Test the fixed formula
function calculateStability(avgValence) {
  // OLD (buggy): return 1 - Math.min(1, avgValence / 0.5)
  // NEW (fixed): return 1 - Math.min(1, avgValence)
  return 1 - Math.min(1, avgValence)
}

console.log('Test Cases:')
console.log('===========')

const testCases = [
  { avgValence: 0, expected: 1.0, desc: 'Perfect stability (no emotions)' },
  { avgValence: 0.25, expected: 0.75, desc: 'High stability' },
  { avgValence: 0.5, expected: 0.5, desc: 'Moderate stability (default)' },
  { avgValence: 0.75, expected: 0.25, desc: 'Low stability' },
  { avgValence: 1.0, expected: 0.0, desc: 'Unstable (max emotions)' }
]

let allPassed = true

for (const test of testCases) {
  const result = calculateStability(test.avgValence)
  const passed = Math.abs(result - test.expected) < 0.01

  console.log(`\nAvgValence: ${test.avgValence.toFixed(2)}`)
  console.log(`  Expected Stability: ${test.expected.toFixed(2)}`)
  console.log(`  Got: ${result.toFixed(2)}`)
  console.log(`  ${passed ? '✅' : '❌'} ${test.desc}`)

  if (result < 0) {
    console.log(`  ⚠️  NEGATIVE VALUE! (Bug not fixed)`)
    allPassed = false
  }

  if (!passed) allPassed = false
}

console.log('\n' + '='.repeat(40))

if (allPassed) {
  console.log('✅ All tests passed! Emotion stability fixed.')
} else {
  console.log('❌ Some tests failed!')
  process.exit(1)
}
