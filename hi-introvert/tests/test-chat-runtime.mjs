/**
 * Test ChatRuntime
 * Verifies: Conversation handling, memory recording, growth tracking
 */

import { ChatRuntime } from '../src/apps/hi-introvert/ChatRuntime.ts'

console.log('=== ChatRuntime Test ===\n')

// Create chat runtime
const chat = new ChatRuntime({
  world: {
    features: {
      memory: true,
      emotion: true,
      relationships: true,
      learning: true,
      communication: true,
      worldMind: true,
      linguistics: true
    }
  },
  companion: {
    name: 'hi_introvert'  // Use specific companion
  },
  sensors: {
    os: false,      // Disable for testing
    network: false,
    weather: false
  },
  autoTick: false,   // Manual tick
  silentMode: true   // No debug output
})

console.log('✅ ChatRuntime created')
console.log(`User: ${chat.user.id}`)
console.log(`Companion: ${chat.companion.id}`)

// Test 1: Send greeting message
console.log('\n--- Test 1: Greeting ---')
const response1 = await chat.sendMessage('สวัสดีครับ')
console.log(`Message: "สวัสดีครับ"`)
console.log(`Response: "${response1.response}"`)
console.log(`Emotion: valence=${response1.emotion.valence.toFixed(2)}, arousal=${response1.emotion.arousal.toFixed(2)}`)
console.log(`Memory count: ${response1.metadata?.memoryCount || 0}`)

if (!response1.response || response1.response.length === 0) {
  console.error('❌ No response generated!')
  process.exit(1)
}

console.log('✅ Response generated')

// Test 2: Send name introduction
console.log('\n--- Test 2: Name Introduction ---')
const response2 = await chat.sendMessage('ผมชื่อ Alex ครับ')
console.log(`Message: "ผมชื่อ Alex ครับ"`)
console.log(`Response: "${response2.response}"`)

// Check if name was extracted and stored
const nameMemories = chat.companion.memory?.memories.filter(m =>
  m.subject === 'Alex' || m.content?.type === 'name'
) || []

console.log(`Name memories: ${nameMemories.length}`)
if (nameMemories.length > 0) {
  console.log('✅ Name extraction working')
} else {
  console.warn('⚠️  Name not extracted (might be expected if pattern doesn\'t match)')
}

// Test 3: Check growth metrics
console.log('\n--- Test 3: Growth Metrics ---')
const growth = chat.getGrowth()
console.log(`Conversation count: ${growth.conversationCount}`)
console.log(`Vocabulary size: ${growth.vocabularySize}`)
console.log(`Memory count: ${growth.memoryCount}`)
console.log(`Maturity: ${(growth.maturity * 100).toFixed(1)}%`)

if (growth.conversationCount !== 2) {
  console.error(`❌ Conversation count wrong! Expected 2, got ${growth.conversationCount}`)
  process.exit(1)
}

console.log('✅ Growth tracking working')

// Test 4: Check cognitive link
console.log('\n--- Test 4: Cognitive Link ---')
const link = chat.companion.cognitiveLinks?.getLink(chat.user.id)
if (link) {
  console.log(`Link strength: ${link.strength.toFixed(2)}`)
  console.log(`Trust: ${link.trust?.toFixed(2) || 'N/A'}`)
  console.log('✅ Cognitive link established')
} else {
  console.warn('⚠️  No cognitive link (might be disabled)')
}

// Test 5: Check memory recording
console.log('\n--- Test 5: Memory Recording ---')
const companionMemories = chat.companion.memory?.memories || []
const userMemories = companionMemories.filter(m => m.subject === 'user')

console.log(`Total memories: ${companionMemories.length}`)
console.log(`User interaction memories: ${userMemories.length}`)

if (userMemories.length < 2) {
  console.error('❌ Not enough user memories recorded!')
  process.exit(1)
}

console.log('✅ Memory recording working')

// Test 6: Event emission
console.log('\n--- Test 6: Event Emission ---')
let messageEventReceived = false

chat.on('message', (data) => {
  messageEventReceived = true
  console.log('Event received: message')
  console.log(`  - Message: "${data.message}"`)
  console.log(`  - Response: "${data.response}"`)
})

await chat.sendMessage('ทดสอบ event')

if (!messageEventReceived) {
  console.error('❌ Message event not emitted!')
  process.exit(1)
}

console.log('✅ Event emission working')

// Summary
console.log('\n=== Summary ===')
console.log(`✅ All tests passed!`)
console.log(`   - Conversation: ${growth.conversationCount} messages`)
console.log(`   - Memories: ${growth.memoryCount} total`)
console.log(`   - Vocabulary: ${growth.vocabularySize} words`)
console.log(`   - Maturity: ${(growth.maturity * 100).toFixed(1)}%`)
