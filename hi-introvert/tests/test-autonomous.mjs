#!/usr/bin/env node
/**
 * Test Suite: Autonomous Behavior
 *
 * ทดสอบว่า entities คุยกันเองโดยไม่ต้อง UI
 * - Autonomous intent generation
 * - Emotion-driven dialogue
 * - Memory persistence
 * - ResonanceField propagation
 */

import { WorldSession } from '../src/session/WorldSession.js'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 MDS Test Suite: Autonomous Behavior')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// Create world session
console.log('🌍 Initializing world...')
const session = new WorldSession()

// Track statistics
const stats = {
  messagesSpoken: 0,
  entitiesActive: new Set(),
  emotionChanges: 0,
  memoryEntries: 0
}

// Log every time entity speaks
session.onAutonomousMessage = (name, text, emotion, target) => {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
  const targetStr = target || 'everyone'
  const emotionStr = `v:${emotion.valence.toFixed(1)} a:${emotion.arousal.toFixed(1)}`

  console.log(`[${timestamp}] ${name} → ${targetStr}: "${text}"`)
  console.log(`          emotion: ${emotionStr}`)
  console.log('')

  stats.messagesSpoken++
  stats.entitiesActive.add(name)
}

// Monitor emotion changes
const entities = Array.from(session.entities.values())
setInterval(() => {
  entities.forEach(info => {
    const currentValence = info.entity.emotion?.valence ?? 0
    const delta = Math.abs(currentValence - info.previousValence)

    if (delta > 0.05) {
      stats.emotionChanges++
      console.log(`💭 ${info.name} emotion changed: ${info.previousValence.toFixed(2)} → ${currentValence.toFixed(2)}`)
      info.previousValence = currentValence
    }
  })
}, 1000)

// Start autonomous conversation
console.log('▶️  Starting autonomous conversation loop...')
console.log('⏱️  Test duration: 30 seconds')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

session.startAutonomousConversation()

// Run for 30 seconds
setTimeout(() => {
  session.stopAutonomousConversation()

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Test Results')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log(`💬 Messages spoken: ${stats.messagesSpoken}`)
  console.log(`👥 Active entities: ${stats.entitiesActive.size} (${[...stats.entitiesActive].join(', ')})`)
  console.log(`💭 Emotion changes: ${stats.emotionChanges}`)

  // Check memory
  entities.forEach(info => {
    const memoryCount = info.entity.memory?.getAll().length ?? 0
    console.log(`🧠 ${info.name} memories: ${memoryCount}`)
    stats.memoryEntries += memoryCount
  })

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Test Criteria')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  // Evaluate results
  const checks = [
    {
      name: 'Entities spoke autonomously',
      passed: stats.messagesSpoken > 0,
      actual: stats.messagesSpoken,
      expected: '> 0'
    },
    {
      name: 'Multiple entities active',
      passed: stats.entitiesActive.size >= 2,
      actual: stats.entitiesActive.size,
      expected: '>= 2'
    },
    {
      name: 'Emotions changed',
      passed: stats.emotionChanges > 0,
      actual: stats.emotionChanges,
      expected: '> 0'
    },
    {
      name: 'Memories created',
      passed: stats.memoryEntries > 0,
      actual: stats.memoryEntries,
      expected: '> 0'
    }
  ]

  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌'
    console.log(`${icon} ${check.name}`)
    console.log(`   Expected: ${check.expected}, Got: ${check.actual}`)
  })

  console.log('')

  const allPassed = checks.every(c => c.passed)
  if (allPassed) {
    console.log('🎉 All tests passed!')
    console.log('✅ Autonomous behavior is working correctly')
  } else {
    console.log('⚠️  Some tests failed')
    console.log('❌ Autonomous behavior needs debugging')
  }

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  process.exit(allPassed ? 0 : 1)
}, 30000)
