#!/usr/bin/env node
/**
 * Entity Growth Simulation
 *
 * Purpose: Let entity GROW naturally through interactions
 * NOT testing - just letting physics happen over time
 *
 * Process:
 * 1. Create fresh entity (newborn)
 * 2. Have 1000+ conversations (varied topics)
 * 3. Save mature entity
 * 4. Measure naturalness
 */

import { ChatRuntime } from '../src/apps/hi-introvert/ChatRuntime.ts'
import fs from 'fs'

console.log('=== 🌱 Entity Growth Simulation ===\n')
console.log('Simulating natural growth through conversation...\n')

// Conversation dataset (varied topics for natural learning)
const conversations = [
  // Greetings & introductions (repeated to establish patterns)
  'สวัสดีครับ',
  'สวัสดี',
  'หวัดดี',
  'Hello',
  'Hi',

  // Name introductions (various people)
  'ผมชื่อเจสัน',
  'ฉันชื่อแอนนา',
  'เพื่อนผมชื่อมาร์ค',
  'My name is Sarah',

  // Emotions (to establish emotional patterns)
  'ดีใจมาก',
  'เศร้าจัง',
  'โกรธเลย',
  'รู้สึกดี',
  'I feel happy',
  'I feel sad',

  // Daily life (common topics)
  'วันนี้อากาศดี',
  'งานเยอะมาก',
  'อยากกินพิซซ่า',
  'เหนื่อยจัง',
  'The weather is nice',
  'I like coffee',

  // Questions (to establish Q&A patterns)
  'อารมณ์เป็นยังไง',
  'ชอบอะไร',
  'ทำอะไรอยู่',
  'How are you',
  'What do you like',

  // Memories (to establish recall patterns)
  'จำได้ไหม',
  'เคยบอกไหม',
  'จำชื่อผมได้ไหม',
  'Do you remember',

  // Casual conversation
  'เข้าใจนะ',
  'ขอบคุณ',
  'ไม่เป็นไร',
  'Thank you',
  'You\'re welcome',

  // More varied content
  'ชอบดนตรีไหม',
  'ชอบดูหนัง',
  'ชอบอ่านหนังสือ',
  'เล่นเกมเป็นไหม',
  'Do you like music',
  'I love books',

  // Emotional states
  'เหงาจัง',
  'มีความสุข',
  'ผ่อนคลาย',
  'กังวลนิดหน่อย',
  'I\'m excited',
  'I\'m tired',
]

// Create runtime
const runtime = new ChatRuntime({
  world: {
    features: {
      ontology: true,
      history: true,
      rendering: 'headless',
      physics: true,
      communication: true,
      languageGeneration: false,
      cognitive: true,
      cognition: true,
      linguistics: true
    },
    cognition: {
      network: { k: 8, p: 0.2 },
      trust: { initialTrust: 0.5, trustThreshold: 0.6 },
      resonance: { decayRate: 0.2, minStrength: 0.1 }
    }
  },
  companion: { name: 'hi_introvert' },
  sensors: { os: false, network: false, weather: false },
  autoTick: true,
  tickRate: 100,  // Fast simulation
  silentMode: true
})

console.log('✅ Runtime created')
console.log(`   Companion: ${runtime.companion.id}`)
console.log(`   Conversation dataset: ${conversations.length} samples\n`)

// Simulate growth
const GROWTH_CYCLES = 20  // Repeat conversation set N times
const TOTAL_CONVERSATIONS = conversations.length * GROWTH_CYCLES

console.log(`📈 Growth Plan: ${TOTAL_CONVERSATIONS} conversations (${GROWTH_CYCLES} cycles)\n`)

let conversationCount = 0
const startTime = Date.now()

for (let cycle = 0; cycle < GROWTH_CYCLES; cycle++) {
  console.log(`\n🔄 Cycle ${cycle + 1}/${GROWTH_CYCLES}`)

  // Shuffle conversations for variety
  const shuffled = [...conversations].sort(() => Math.random() - 0.5)

  for (let i = 0; i < shuffled.length; i++) {
    const message = shuffled[i]

    try {
      await runtime.sendMessage(message)
      conversationCount++

      // Progress indicator
      if (conversationCount % 50 === 0) {
        const vocab = runtime.world.lexicon?.size || 0
        const memories = runtime.companion.memory?.count() || 0
        console.log(`   ${conversationCount}/${TOTAL_CONVERSATIONS} - vocab: ${vocab}, memories: ${memories}`)
      }

      // Small delay to let world tick
      await new Promise(resolve => setTimeout(resolve, 10))

    } catch (err) {
      console.log(`   ⚠️  Error on "${message}": ${err.message}`)
    }
  }
}

const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)

console.log(`\n✅ Growth simulation complete!`)
console.log(`   Time: ${elapsedTime}s`)
console.log(`   Total conversations: ${conversationCount}\n`)

// Measure maturity
console.log('═'.repeat(60))
console.log('\n📊 Maturity Metrics\n')
console.log('═'.repeat(60))

const memories = runtime.companion.memory?.memories || []
const vocab = runtime.world.lexicon?.size || 0
const transcript = runtime.world.transcript?.getAll() || []
const emotion = runtime.companion.emotion
const relationship = runtime.companion.relationships?.get(runtime.user.id)

console.log(`\n💾 Memory:`)
console.log(`   Count: ${memories.length}`)
console.log(`   Avg salience: ${(memories.reduce((sum, m) => sum + m.salience, 0) / memories.length).toFixed(2)}`)

console.log(`\n📚 Language:`)
console.log(`   Vocabulary: ${vocab} emergent words`)
console.log(`   Transcript: ${transcript.length} utterances`)

console.log(`\n💓 Emotion:`)
console.log(`   Valence: ${emotion.valence.toFixed(2)}`)
console.log(`   Arousal: ${emotion.arousal.toFixed(2)}`)
console.log(`   Age: ${(runtime.companion.age / 1000).toFixed(1)}s`)

console.log(`\n🤝 Relationship:`)
if (relationship) {
  console.log(`   Strength: ${relationship.strength.toFixed(2)}`)
  console.log(`   Interactions: ${relationship.interactionCount}`)
} else {
  console.log(`   Not formed yet`)
}

// Test mature entity
console.log('\n' + '═'.repeat(60))
console.log('\n🧪 Naturalness Test (Mature Entity)\n')
console.log('═'.repeat(60))

const tests = [
  { input: 'ชื่อผมอะไร?', expect: 'name recall' },
  { input: 'อารมณ์เป็นยังไง?', expect: 'emotion expression' },
  { input: 'จำอะไรได้บ้าง?', expect: 'memory recall' },
  { input: 'สวัสดี', expect: 'greeting' }
]

for (const test of tests) {
  console.log(`\n📝 "${test.input}"`)
  const response = await runtime.sendMessage(test.input)
  console.log(`💬 "${response.response}"`)
  console.log(`   Emotion: ${response.emotion.valence.toFixed(2)} (Δ${(response.emotion.valence - response.previousValence).toFixed(2)})`)
}

console.log('\n' + '═'.repeat(60))
console.log('\n💾 Saving mature entity...')

// Save world state
const savePath = 'sessions/mature_entity.world.mdm'
runtime.save(savePath)

console.log(`   ✅ Saved: ${savePath}`)
console.log('\n' + '═'.repeat(60))

// Cleanup
runtime.destroy()

console.log('\n🎉 Simulation complete!')
console.log(`   Entity has lived ${conversationCount} conversations`)
console.log(`   Ready for naturalness testing\n`)
