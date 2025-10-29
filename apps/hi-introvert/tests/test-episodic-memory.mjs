#!/usr/bin/env bun
/**
 * Test episodic memory persistence across save/load cycles
 */

import { WorldSession } from '../dist/index.js'
import fs from 'fs'

const TEST_FILE = '.test-episodic-session.json'

console.log('🧪 Episodic Memory Persistence Test\n')

// Cleanup old test file
if (fs.existsSync(TEST_FILE)) {
  fs.unlinkSync(TEST_FILE)
}

// === Phase 1: Create session and add memories ===
console.log('Phase 1: Creating session and adding memories...')
const session1 = new WorldSession()
session1.setSilentMode(true)

// Simulate conversation
const msg1 = await session1.handleUserMessage('My name is Alice')
console.log(`✓ Message 1: "${msg1.response.substring(0, 50)}..."`)

const msg2 = await session1.handleUserMessage('I like reading books')
console.log(`✓ Message 2: "${msg2.response.substring(0, 50)}..."`)

const msg3 = await session1.handleUserMessage('What is my name?')
console.log(`✓ Message 3: "${msg3.response.substring(0, 50)}..."`)

// Check companion memories before save
const companionBefore = session1.companionEntity.entity
const memoriesBefore = companionBefore.memory?.memories || []
console.log(`\n📝 Memories before save: ${memoriesBefore.length}`)

// Filter interaction memories (exclude spawn/distance tracking)
const interactionsBefore = memoriesBefore.filter(m => 
  m.type === 'interaction' && 
  m.content && 
  (m.content.message || m.content.intent || m.content.response)
)
console.log(`   Interaction memories: ${interactionsBefore.length}`)

if (interactionsBefore.length > 0) {
  console.log(`   Sample: "${interactionsBefore[0].content.message || interactionsBefore[0].content.response || 'N/A'}"`)
}

// === Phase 2: Save session ===
console.log(`\nPhase 2: Saving session to ${TEST_FILE}...`)
session1.saveSession(TEST_FILE)
console.log('✓ Session saved')

// === Phase 3: Load session in NEW instance ===
console.log('\nPhase 3: Loading session in new instance...')
const session2 = new WorldSession()
session2.setSilentMode(true)

const loadSuccess = session2.loadSession(TEST_FILE)
if (!loadSuccess) {
  console.error('❌ Failed to load session!')
  process.exit(1)
}
console.log('✓ Session loaded')

// Check companion memories after load
const companionAfter = session2.companionEntity.entity
const memoriesAfter = companionAfter.memory?.memories || []
console.log(`\n📝 Memories after load: ${memoriesAfter.length}`)

const interactionsAfter = memoriesAfter.filter(m => 
  m.type === 'interaction' && 
  m.content && 
  (m.content.message || m.content.intent || m.content.response)
)
console.log(`   Interaction memories: ${interactionsAfter.length}`)

if (interactionsAfter.length > 0) {
  console.log(`   Sample: "${interactionsAfter[0].content.message || interactionsAfter[0].content.response || 'N/A'}"`)
}

// === Phase 4: Test recall ===
console.log('\nPhase 4: Testing memory recall...')
const msg4 = await session2.handleUserMessage('Do you remember my name?')
console.log(`✓ Recall test: "${msg4.response.substring(0, 80)}..."`)

const aliceInResponse = msg4.response.toLowerCase().includes('alice')
console.log(`   Contains "Alice": ${aliceInResponse ? '✅ YES' : '❌ NO'}`)

// === Phase 5: Analyze memory content ===
console.log('\nPhase 5: Memory content analysis...')
console.log('Before save (first 3):')
interactionsBefore.slice(0, 3).forEach((m, i) => {
  const content = m.content.message || m.content.response || m.content.intent || JSON.stringify(m.content)
  console.log(`  ${i+1}. ${m.type} - "${content.substring(0, 60)}"`)
})

console.log('\nAfter load (first 3):')
interactionsAfter.slice(0, 3).forEach((m, i) => {
  const content = m.content.message || m.content.response || m.content.intent || JSON.stringify(m.content)
  console.log(`  ${i+1}. ${m.type} - "${content.substring(0, 60)}"`)
})

// === Results ===
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 Test Results:')
console.log(`   Total memories: ${memoriesBefore.length} → ${memoriesAfter.length}`)
console.log(`   Interaction memories: ${interactionsBefore.length} → ${interactionsAfter.length}`)
console.log(`   Memory recall works: ${aliceInResponse ? '✅ YES' : '❌ NO'}`)

if (interactionsAfter.length > 0 && aliceInResponse) {
  console.log('\n✅ Episodic memory FIXED - memories persist across save/load!')
} else if (memoriesAfter.length > 0 && interactionsAfter.length === 0) {
  console.log('\n⚠️  PARTIAL FIX - memories saved but only distance tracking, no conversations')
} else {
  console.log('\n❌ Episodic memory BROKEN - memories lost after load')
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Cleanup
fs.unlinkSync(TEST_FILE)
console.log(`\n🧹 Cleaned up ${TEST_FILE}`)
