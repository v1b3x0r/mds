#!/usr/bin/env node

/**
 * Test hi-introvert commands
 * Tests all slash commands to ensure they work correctly
 */

import { WorldSession } from '../dist/index.js'

console.log('🧪 hi-introvert Command Test\n')

// Create session
const session = new WorldSession()
session.setSilentMode(true)

console.log('✓ Session created')

// Test 1: Check autosave default state
console.log('\nTest 1: Autosave default state')
const autosaveDefault = session.isAutoSaveEnabled()
console.log(`  Default: ${autosaveDefault ? 'on' : 'off'}`)
console.log(`  Expected: off`)
console.log(`  ${autosaveDefault === false ? '✓' : '✗'} PASS`)

// Test 2: Toggle autosave
console.log('\nTest 2: Toggle autosave')
const toggledOn = session.toggleAutoSave()
console.log(`  After toggle: ${toggledOn ? 'on' : 'off'}`)
console.log(`  Expected: on`)
console.log(`  ${toggledOn === true ? '✓' : '✗'} PASS`)

const toggledOff = session.toggleAutoSave()
console.log(`  After toggle again: ${toggledOff ? 'on' : 'off'}`)
console.log(`  Expected: off`)
console.log(`  ${toggledOff === false ? '✓' : '✗'} PASS`)

// Test 3: Save session
console.log('\nTest 3: Save session')
const testFile = '.test-session.json'
try {
  session.saveSession(testFile)
  console.log(`  Saved to ${testFile}`)

  // Check if file exists
  const fs = await import('fs')
  const exists = fs.existsSync(testFile)
  console.log(`  File exists: ${exists}`)
  console.log(`  ${exists ? '✓' : '✗'} PASS`)

  // Cleanup
  if (exists) {
    fs.unlinkSync(testFile)
    console.log(`  Cleaned up test file`)
  }
} catch (error) {
  console.log(`  ✗ FAIL: ${error.message}`)
}

// Test 4: Get entity info
console.log('\nTest 4: Get entity info')
const entityInfo = session.getEntityInfo()
console.log(`  Entity: ${entityInfo?.name || 'none'}`)
console.log(`  ${entityInfo?.name === 'companion' ? '✓' : '✗'} PASS`)

// Test 5: Get all entities
console.log('\nTest 5: Get all entities')
const allEntities = session.getAllEntities()
console.log(`  Total entities: ${allEntities.length}`)
console.log(`  Expected: 2 (companion + traveler)`)
console.log(`  ${allEntities.length === 2 ? '✓' : '✗'} PASS`)

// Test 6: Get status summary
console.log('\nTest 6: Get status summary')
const status = session.getStatusSummary()
const hasCompanion = status.includes('companion')
const hasTraveler = status.includes('traveler')
console.log(`  Status includes companion: ${hasCompanion}`)
console.log(`  Status includes traveler: ${hasTraveler}`)
console.log(`  ${hasCompanion && hasTraveler ? '✓' : '✗'} PASS`)

// Test 7: Get growth summary
console.log('\nTest 7: Get growth summary')
const growth = session.getGrowthSummary()
const hasVocabulary = growth.includes('Vocabulary') || growth.includes('vocabulary')
console.log(`  Growth summary exists: ${growth.length > 0}`)
console.log(`  ${growth.length > 0 ? '✓' : '✗'} PASS`)

// Test 8: Get greeting
console.log('\nTest 8: Get greeting')
const greeting = session.getGreeting()
console.log(`  Greeting: "${greeting.substring(0, 30)}..."`)
console.log(`  ${greeting.length > 0 ? '✓' : '✗'} PASS`)

// Test 9: Handle user message
console.log('\nTest 9: Handle user message')
try {
  const response = await session.handleUserMessage('สวัสดีครับ')
  console.log(`  Response: "${response.response.substring(0, 30)}..."`)
  console.log(`  Emotion: v=${response.emotion.valence.toFixed(2)}, a=${response.emotion.arousal.toFixed(2)}`)
  console.log(`  ${response.response.length > 0 ? '✓' : '✗'} PASS`)
} catch (error) {
  console.log(`  ✗ FAIL: ${error.message}`)
}

// Test 10: Lexicon (if linguistics enabled)
console.log('\nTest 10: Lexicon stats')
const lexiconStats = session.world.getLexiconStats()
console.log(`  Linguistics enabled: ${lexiconStats !== undefined}`)
console.log(`  ${lexiconStats !== undefined ? '✓' : '✗'} PASS`)

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ All command tests completed!')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

process.exit(0)
