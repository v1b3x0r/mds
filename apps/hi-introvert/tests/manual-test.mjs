/**
 * Manual Test Script - Verify .mdm file loading and dialogue variety
 */
import { WorldSession } from './dist/session/WorldSession.js'

console.log('🌱 Starting hi-introvert manual test...\n')

const session = new WorldSession()

// Load session
const restored = session.loadSession()
console.log(`📁 Session restored: ${restored}\n`)

// Get greeting
const entityInfo = session.getEntityInfo()
console.log(`✨ Entity: ${entityInfo.name}`)
console.log(`😊 Emotion: valence=${entityInfo.entity.emotion.valence.toFixed(2)}, arousal=${entityInfo.entity.emotion.arousal.toFixed(2)}`)
console.log(`💬 Greeting: "${session.getGreeting()}"\n`)

// Test multiple conversations to see dialogue variety
console.log('🔁 Testing dialogue variety (10 conversations)...\n')

const testMessages = [
  'สวัสดีครับ',
  'คุณเป็นยังไงบ้าง',
  'วันนี้อากาศดีจัง',
  'เจ๋งมากเลย!',
  'ไม่ค่อยดีเท่าไหร่',
  'คุณชอบอะไร',
  'quantum physics',
  'ผมชื่อโจครับ',
  'ช่วยฉันหน่อย',
  'ขอบคุณมากนะ'
]

for (const msg of testMessages) {
  console.log(`👤 User: ${msg}`)

  const response = await session.handleUserMessage(msg)

  console.log(`🤖 ${response.name}: "${response.response}"`)
  console.log(`   emotion: valence=${response.emotion.valence.toFixed(2)}, arousal=${response.emotion.arousal.toFixed(2)}`)

  // Check if response came from .mdm dialogue
  if (response.response && response.response.length > 0) {
    console.log(`   ✅ Response generated successfully`)
  } else {
    console.log(`   ⚠️  Empty response (potential issue)`)
  }

  console.log()
}

// Final status
console.log('📊 Final Status:')
const status = session.getStatusSummary()
console.log(status)

console.log('\n✨ Test complete!')
