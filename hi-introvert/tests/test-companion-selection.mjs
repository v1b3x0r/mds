#!/usr/bin/env bun

/**
 * Test v1.2 Companion Selection
 * Tests default and specific companion loading
 */

import { WorldSession, CompanionLoader } from '../dist/index.js'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 hi-introvert v1.2 — Companion Selection Test')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Test 1: List available companions
console.log('Test 1: List available companions')
const loader = new CompanionLoader()
const companions = loader.list()
console.log(`  Found ${companions.length} companions:`)
companions.forEach(c => {
  console.log(`    - ${c.id}: "${c.essence.substring(0, 50)}..."`)
})
console.log()

// Test 2: Default companion (no argument)
console.log('Test 2: Default companion (no argument)')
let test1 = false
{
  const session = new WorldSession()
  session.setSilentMode(true)
  console.log(`  Loaded: ${session.companionId}`)
  test1 = session.companionId === 'hi_introvert'
  console.log(`  Expected: hi_introvert (alphabetically first)`)
  console.log(`  Result: ${test1 ? '✓ PASS' : '✗ FAIL'}\n`)
}

// Test 3: Specific companion (orz-archivist)
console.log('Test 3: Specific companion (orz.archivist)')
let test2 = false
{
  const session = new WorldSession({ companionId: 'orz.archivist' })
  session.setSilentMode(true)
  console.log(`  Loaded: ${session.companionId}`)
  test2 = session.companionId === 'orz.archivist'
  console.log(`  Expected: orz.archivist`)
  console.log(`  Result: ${test2 ? '✓ PASS' : '✗ FAIL'}\n`)
}

// Test 4: Invalid companion (should throw error)
console.log('Test 4: Invalid companion (should throw)')
let test3 = false
try {
  const session3 = new WorldSession({ companionId: 'nonexistent' })
  console.log('  ✗ FAIL - No error thrown')
} catch (err) {
  console.log(`  ✓ PASS - Error thrown: ${err.message.substring(0, 60)}...`)
  test3 = true
}
console.log()

// Summary
const allPass = test1 && test2 && test3
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`Results: ${[test1, test2, test3].filter(Boolean).length}/3 passed`)
console.log(allPass ? '✅ All tests passed!' : '❌ Some tests failed')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

process.exit(allPass ? 0 : 1)
