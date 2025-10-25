#!/usr/bin/env node
/**
 * Field System Test - v6.2
 * Tests sync moment and longing field spawning
 */

import { WorldSession } from '../src/session/WorldSession.ts'

console.log('🧪 Field System Test v6.2\n')

// Create session
const session = new WorldSession()

// Listen for field events
session.on('field', (data) => {
  console.log(`✨ Field spawned: ${data.type}`)
  if (data.type === 'sync_moment') {
    console.log(`   ${data.source} ↔ ${data.target}`)
    console.log(`   Alignment: ${data.alignment.toFixed(2)}`)
  } else if (data.type === 'longing') {
    console.log(`   ${data.source} → ${data.target}`)
    console.log(`   Familiarity: ${data.familiarity.toFixed(2)}`)
  }
  console.log('')
})

// Listen for vocab events
session.on('vocab', (data) => {
  console.log(`📚 New words learned: ${data.words.join(', ')}`)
})

// Listen for cognitive links
session.on('link', (data) => {
  console.log(`🔗 Cognitive link: ${data.from} → ${data.to} (strength: ${data.strength})`)
})

console.log('📋 Test Plan:')
console.log('1. Send positive message → expect sync moment (high alignment)')
console.log('2. Send negative message → expect no sync moment (low alignment)')
console.log('3. Wait 2+ minutes → expect longing field\n')

// Test 1: Positive message (should trigger sync moment)
console.log('=== Test 1: Positive Message ===')
const greeting = session.getGreeting()
console.log(`🤖 Companion: ${greeting}\n`)

async function runTests() {
  try {
    // Positive message
    console.log('👤 User: "สวัสดี! วันนี้อากาศดีมากเลย ดีใจจัง 😊"\n')
    const response1 = await session.handleUserMessage('สวัสดี! วันนี้อากาศดีมากเลย ดีใจจัง 😊')

    console.log(`🤖 ${response1.name}: ${response1.response}`)
    console.log(`   Emotion: valence=${response1.emotion.valence.toFixed(2)}, arousal=${response1.emotion.arousal.toFixed(2)}`)
    console.log(`   New words: ${response1.newWordsLearned?.length || 0}\n`)

    // Wait for field effects
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 2: Negative message (should NOT trigger sync moment)
    console.log('=== Test 2: Negative Message ===')
    console.log('👤 User: "เบื่อจัง ไม่อยากทำอะไรเลย"\n')
    const response2 = await session.handleUserMessage('เบื่อจัง ไม่อยากทำอะไรเลย')

    console.log(`🤖 ${response2.name}: ${response2.response}`)
    console.log(`   Emotion: valence=${response2.emotion.valence.toFixed(2)}, arousal=${response2.emotion.arousal.toFixed(2)}\n`)

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 3: Another positive (build familiarity)
    console.log('=== Test 3: Building Familiarity ===')
    console.log('👤 User: "เล่นกันต่อไหม? สนุกมาก!"\n')
    const response3 = await session.handleUserMessage('เล่นกันต่อไหม? สนุกมาก!')

    console.log(`🤖 ${response3.name}: ${response3.response}`)
    console.log(`   Emotion: valence=${response3.emotion.valence.toFixed(2)}, arousal=${response3.emotion.arousal.toFixed(2)}\n`)

    // Check relationship stats
    const companion = session.companionEntity.entity
    const traveler = session.impersonatedEntity.entity
    const relationship = companion.relationships?.get(traveler.material)

    if (relationship) {
      console.log('💞 Relationship Stats:')
      console.log(`   Trust: ${relationship.trust.toFixed(2)}`)
      console.log(`   Familiarity: ${relationship.familiarity.toFixed(2)}`)
      console.log(`   Interactions: ${relationship.interactionCount || 0}`)
      console.log(`   Last interaction: ${relationship.lastInteraction ? new Date(relationship.lastInteraction).toLocaleTimeString() : 'never'}\n`)
    }

    // Test 4: Simulate longing by waiting 2 minutes (or manually trigger)
    console.log('=== Test 4: Longing Field (Manual Trigger) ===')
    console.log('Simulating 2-minute wait...\n')

    // Manually modify lastInteraction to simulate time passing
    if (relationship) {
      relationship.lastInteraction = Date.now() - 120000  // 2 minutes ago
      relationship.familiarity = 0.7  // High familiarity
    }

    // Manually trigger longing check
    session.spawnLongingField(session.companionEntity, 'traveler')

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Final stats
    console.log('\n=== Final Summary ===')
    console.log(session.getStatusSummary())

    console.log('\n✅ Test complete!')
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

runTests()
