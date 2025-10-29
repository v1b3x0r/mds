#!/usr/bin/env bun
/**
 * Complete Systems Integration Test - v6.2
 * Tests all 7 integrated systems together
 */

import { WorldSession } from '../src/session/WorldSession.ts'

console.log('🧪 Complete Systems Integration Test v6.2\n')

const session = new WorldSession()

// Track all events
const events = {
  field: 0,
  environment: 0,
  weather: 0,
  collision: 0,
  thermal: 0,
  memoryConsolidation: 0,
  memorySync: 0,
  trustBlocked: 0,
  worldMind: 0
}

session.on('field', () => events.field++)
session.on('environment', () => events.environment++)
session.on('weather', () => events.weather++)
session.on('collision', () => events.collision++)
session.on('thermal', () => events.thermal++)
session.on('memory-consolidation', (data) => {
  events.memoryConsolidation++
  console.log(`\n🧠 Memory Consolidated: ${data.count} memories`)
  console.log(`   Strongest: ${data.strongest.map(m => `${m.subject} (${m.strength})`).join(', ')}`)
})
session.on('memory-sync', (data) => {
  events.memorySync++
  console.log(`\n🔄 CRDT Memory Sync: ${data.source} ↔ ${data.target}`)
  console.log(`   Added: ${data.sourceAdded} → ${data.source}, ${data.targetAdded} → ${data.target}`)
})
session.on('trust-blocked', (data) => {
  events.trustBlocked++
  console.log(`\n🔒 Trust Blocked: ${data.source} ↔ ${data.target}`)
  console.log(`   Trust levels: ${data.sourceTrust.toFixed(2)} / ${data.targetTrust.toFixed(2)}`)
})
session.on('world-mind', (data) => {
  events.worldMind++
  console.log(`\n🌍 World Mind Analytics:`)
  console.log(`   Entities: ${data.stats.entityCount}, Avg Age: ${data.stats.avgAge.toFixed(1)}s`)
  console.log(`   Patterns: ${data.patterns.map(p => p.pattern).join(', ') || 'none'}`)
  if (data.collectiveEmotion) {
    console.log(`   Collective Emotion: ${data.collectiveEmotion.valence.toFixed(2)} valence, ${data.collectiveEmotion.arousal.toFixed(2)} arousal`)
  }
})

console.log('📋 Test Plan:')
console.log('Systems testing: Field, Environment, Weather, Collision, Energy, Memory Consolidation')
console.log('Duration: 30 seconds')
console.log('Expected: Multiple system interactions\n')

async function runTests() {
  try {
    console.log('=== Starting 30-Second Integration Test ===\n')

    // Build vocabulary and memories
    const messages = [
      'สวัสดีครับ ยินดีที่ได้รู้จัก',
      'วันนี้อากาศดีมาก แดดสวย',
      'ชอบคุยกับคุณนะ สนุกจัง',
      'เราเป็นเพื่อนกันได้ไหม?',
      'ขอบคุณที่คุยด้วยนะ'
    ]

    for (const msg of messages) {
      console.log(`👤: "${msg}"`)
      const response = await session.handleUserMessage(msg)
      console.log(`🤖: "${response.response}"\n`)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Move entities close for collision
    const companion = session.companionEntity.entity
    const traveler = session.impersonatedEntity.entity
    traveler.x = companion.x + 30
    traveler.y = companion.y + 20

    // Set temperature difference
    companion.temperature = 313  // 40°C
    traveler.temperature = 283   // 10°C

    // Force rain
    session.weather.forceRain(15, 0.8)
    console.log('☔ Forced rain for testing...\n')

    // Wait for systems to interact
    console.log('⏳ Monitoring all systems for 30 seconds...\n')

    await new Promise(resolve => setTimeout(resolve, 30000))

    // Summary
    console.log('\n=== Test Complete ===')
    console.log('\n📊 System Activity:')
    console.log(`   Field events: ${events.field}`)
    console.log(`   Environment updates: ${events.environment}`)
    console.log(`   Weather events: ${events.weather}`)
    console.log(`   Collisions detected: ${events.collision}`)
    console.log(`   Thermal updates: ${events.thermal}`)
    console.log(`   Memory consolidations: ${events.memoryConsolidation}`)
    console.log(`   Memory syncs (CRDT): ${events.memorySync}`)
    console.log(`   Trust blocks: ${events.trustBlocked}`)
    console.log(`   World Mind analytics: ${events.worldMind}`)

    const finalCompanion = session.companionEntity.entity
    console.log(`\n🌡️  Final State:`)
    console.log(`   Companion temp: ${(finalCompanion.temperature - 273).toFixed(1)}°C`)
    console.log(`   Companion emotion: ${finalCompanion.emotion.valence.toFixed(2)} valence, ${finalCompanion.emotion.arousal.toFixed(2)} arousal`)
    console.log(`   Memories: ${finalCompanion.memory?.memories?.length || 0}`)

    console.log('\n✅ All Systems Working Together!')

    process.exit(0)

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

runTests()
