/**
 * Generic Trigger Tests
 * v5.8.0 - Tests dot-notation trigger patterns
 *
 * Supports: key>value, key<value, key>=value, key<=value
 * Examples: cpu.usage>0.8, memory.usage<0.2, battery.level<=0.15
 */

import { MdmParser } from '../dist/mds-core.esm.js'

const parser = new MdmParser()

// Test cases for generic triggers
const testCases = [
  // CPU triggers
  { trigger: 'cpu.usage>0.8', context: { 'cpu.usage': 0.9 }, expected: true },
  { trigger: 'cpu.usage>0.8', context: { 'cpu.usage': 0.7 }, expected: false },
  { trigger: 'cpu.usage>=0.8', context: { 'cpu.usage': 0.8 }, expected: true },
  { trigger: 'cpu.usage>=0.8', context: { 'cpu.usage': 0.79 }, expected: false },

  // Memory triggers
  { trigger: 'memory.usage<0.2', context: { 'memory.usage': 0.15 }, expected: true },
  { trigger: 'memory.usage<0.2', context: { 'memory.usage': 0.25 }, expected: false },
  { trigger: 'memory.usage<=0.5', context: { 'memory.usage': 0.5 }, expected: true },
  { trigger: 'memory.usage<=0.5', context: { 'memory.usage': 0.51 }, expected: false },

  // Battery triggers
  { trigger: 'battery.level<0.15', context: { 'battery.level': 0.1 }, expected: true },
  { trigger: 'battery.level<0.15', context: { 'battery.level': 0.2 }, expected: false },
  { trigger: 'battery.level>0.9', context: { 'battery.level': 0.95 }, expected: true },
  { trigger: 'battery.level>0.9', context: { 'battery.level': 0.85 }, expected: false },

  // User silence (time-based)
  { trigger: 'user.silence>60', context: { 'user.silence': 65 }, expected: true },
  { trigger: 'user.silence>60', context: { 'user.silence': 30 }, expected: false },
  { trigger: 'user.silence>60s', context: { 'user.silence': 65 }, expected: true },
  { trigger: 'user.silence>60000ms', context: { 'user.silence': 61 }, expected: true },

  // System metrics
  { trigger: 'system.load>5', context: { 'system.load': 6.5 }, expected: true },
  { trigger: 'system.load>5', context: { 'system.load': 3.2 }, expected: false },
  { trigger: 'system.uptime>3600', context: { 'system.uptime': 7200 }, expected: true },

  // Edge cases
  { trigger: 'cpu.usage>0.8', context: {}, expected: false },  // Missing context
  { trigger: 'cpu.usage>0.8', context: { 'cpu.usage': undefined }, expected: false },
  { trigger: 'cpu.usage>0.8', context: { 'memory.usage': 0.9 }, expected: false },  // Wrong key

  // Decimal precision
  { trigger: 'battery.level>0.15', context: { 'battery.level': 0.150001 }, expected: true },
  { trigger: 'battery.level<0.15', context: { 'battery.level': 0.149999 }, expected: true },

  // Negative values
  { trigger: 'temperature>-10', context: { 'temperature': -5 }, expected: true },
  { trigger: 'temperature<-10', context: { 'temperature': -15 }, expected: true },

  // Boolean-like (1/0)
  { trigger: 'battery.charging>0', context: { 'battery.charging': 1 }, expected: true },
  { trigger: 'battery.charging>0', context: { 'battery.charging': 0 }, expected: false },
]

// Run all tests
let passCount = 0
let failCount = 0
const failures = []

console.log('⚙️  Generic Trigger Tests (v5.8.0)\n')
console.log(`Testing ${testCases.length} cases...\n`)

for (const test of testCases) {
  const condition = parser.parseTriggerCondition(test.trigger)
  const result = condition(test.context)

  if (result === test.expected) {
    passCount++
  } else {
    failCount++
    failures.push({
      trigger: test.trigger,
      context: test.context,
      expected: test.expected,
      got: result
    })
    console.log(`✗ Trigger: "${test.trigger}"`)
    console.log(`  Context: ${JSON.stringify(test.context)}`)
    console.log(`  Expected: ${test.expected}, Got: ${result}\n`)
  }
}

// Summary
console.log(`\n${'='.repeat(60)}`)
console.log(`📊 Results: ${passCount}/${testCases.length} passed`)
console.log(`✓ Pass: ${passCount}`)
console.log(`✗ Fail: ${failCount}`)
console.log(`${'='.repeat(60)}\n`)

if (failures.length > 0) {
  console.log('❌ Failed tests:')
  for (const failure of failures) {
    console.log(`  - "${failure.trigger}" with context: ${JSON.stringify(failure.context)}`)
    console.log(`    Expected: ${failure.expected}, Got: ${failure.got}`)
  }
  process.exit(1)
} else {
  console.log('✅ All generic trigger tests passed!')
  console.log(`\n⚙️  Trigger patterns validated:`)
  const uniqueTriggers = [...new Set(testCases.map(t => t.trigger.replace(/[><]=?.*/, 'OPERATOR')))]
  console.log(`   ${uniqueTriggers.join('\n   ')}`)
  process.exit(0)
}
