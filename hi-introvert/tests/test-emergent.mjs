#!/usr/bin/env bun
/**
 * Test emergent behavior - does companion respond unpredictably?
 */

import { WorldSession } from '../dist/index.js'

console.log('🎲 Emergent Behavior Test\n')

const session = new WorldSession()
session.setSilentMode(true)

const companion = session.companionEntity.entity

console.log('📊 Systems Check:')
console.log(`  Memory enabled: ${companion.isEnabled('memory')}`)
console.log(`  Learning enabled: ${companion.isEnabled('learning')}`)
console.log(`  Skills enabled: ${companion.isEnabled('skills')}`)
console.log(`  Emotion: V=${companion.emotion.valence.toFixed(2)} A=${companion.emotion.arousal.toFixed(2)}`)
console.log()

console.log('🧪 Testing same prompt 3 times (should vary):\n')

const prompt = 'สวัสดีครับ'

for (let i = 1; i <= 3; i++) {
  const response = await session.handleUserMessage(prompt)
  console.log(`Test ${i}: "${response.response}"`)
  console.log(`  Emotion after: V=${companion.emotion.valence.toFixed(2)} A=${companion.emotion.arousal.toFixed(2)}`)
  console.log()
  
  // Wait a bit between messages
  await new Promise(resolve => setTimeout(resolve, 100))
}

console.log('📈 Analysis:')
console.log('  If all 3 responses are similar → No emergence')
console.log('  If responses vary → Emergence working')
