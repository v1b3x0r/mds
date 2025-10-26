#!/usr/bin/env bun
/**
 * Test proto-language generation
 */

import { WorldSession } from '../dist/index.js'

console.log('🗣️  Proto-Language Generation Test\n')

const session = new WorldSession()
session.setSilentMode(true)

const companion = session.companionEntity.entity
const world = session.world

console.log('📊 Linguistics System Check:')
console.log(`  World has transcript: ${world.transcript !== undefined}`)
console.log(`  World has lexicon: ${world.lexicon !== undefined}`)
console.log(`  World has crystallizer: ${world.crystallizer !== undefined}`)
console.log(`  World has protoGenerator: ${world.protoGenerator !== undefined}`)

if (world.transcript) {
  console.log(`  Transcript buffer size: ${world.transcript.buffer?.length || 0}`)
}

if (world.lexicon) {
  const stats = world.lexicon.getStats()
  console.log(`  Lexicon total words: ${stats.total}`)
  console.log(`  Proto-language active: ${stats.total >= 50}`)
}

console.log('\n🧪 Testing 10 messages (need 50+ words for proto):\n')

const prompts = [
  'สวัสดีครับ',
  'คุณชื่ออะไร',
  'วันนี้อากาศดี',
  'ชอบอ่านหนังสือไหม',
  'เล่าเรื่องให้ฟังหน่อย',
  'คุณรู้สึกอย่างไร',
  'มีอะไรให้ช่วยไหม',
  'เราเป็นเพื่อนกันได้ไหม',
  'ขอบคุณนะ',
  'ลาก่อน'
]

for (let i = 0; i < prompts.length; i++) {
  const response = await session.handleUserMessage(prompts[i])
  console.log(`${i+1}. "${prompts[i]}" → "${response.response.substring(0, 60)}..."`)
  
  if (world.lexicon) {
    const stats = world.lexicon.getStats()
    console.log(`   Words: ${stats.total}`)
  }
}

console.log('\n📈 Final State:')
if (world.lexicon) {
  const stats = world.lexicon.getStats()
  console.log(`  Total words learned: ${stats.total}`)
  console.log(`  Learned words: ${stats.learnedWords}`)
  console.log(`  Proto active: ${stats.total >= 50 ? 'YES ✅' : 'NO ❌'}`)
}

if (world.transcript) {
  console.log(`  Transcript entries: ${world.transcript.buffer?.length || 0}`)
}

if (world.protoGenerator && world.lexicon) {
  const stats = world.lexicon.getStats()
  if (stats.total >= 50) {
    console.log('\n🎲 Testing proto-language generation:')
    const proto = world.protoGenerator.generateSentence({ 
      intent: 'greeting',
      emotion: companion.emotion
    })
    console.log(`  Generated: "${proto}"`)
  } else {
    console.log('\n⚠️  Not enough words for proto-language (need 50, got ${stats.total})')
  }
}
