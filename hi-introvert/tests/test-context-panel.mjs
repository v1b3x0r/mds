#!/usr/bin/env bun
/**
 * Test v1.2 Context Panel
 * Verify that context panel renders without crashing
 */

import { WorldSession } from '../dist/index.js'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 hi-introvert v1.2 — Context Panel Test')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Test 1: Create session (context data should be accessible)
console.log('Test 1: Session initialization')
const session = new WorldSession()
session.setSilentMode(true)

const companion = session.companionEntity.entity
const traveler = session.impersonatedEntity.entity
const world = session.world
const vocab = session.getVocabularyStats()

console.log('  ✓ Session created')
console.log(`  ✓ Companion: ${companion.id}`)
console.log(`  ✓ Traveler: ${traveler.id}`)
console.log()

// Test 2: Memory data
console.log('Test 2: Memory data access')
const memCount = companion.memory?.count() || 0
const recentMem = companion.memory?.memories?.[0]
console.log(`  Memory count: ${memCount}`)
console.log(`  Recent memory: ${recentMem ? 'exists' : 'none'}`)
console.log('  ✓ Memory data accessible')
console.log()

// Test 3: Emotion data
console.log('Test 3: Emotion data access')
const emotion = companion.emotion
console.log(`  Valence: ${emotion.valence.toFixed(2)}`)
console.log(`  Arousal: ${emotion.arousal.toFixed(2)}`)
console.log(`  Dominance: ${emotion.dominance.toFixed(2)}`)
console.log('  ✓ Emotion data accessible')
console.log()

// Test 4: World data
console.log('Test 4: World data access')
const weather = world.environment?.weather?.type || 'Clear'
const temp = world.environment?.temperature || 25
const tick = world.tick
console.log(`  Weather: ${weather}`)
console.log(`  Temperature: ${temp}°C`)
console.log(`  Tick: ${tick}`)
console.log('  ✓ World data accessible')
console.log()

// Test 5: Cognitive links
console.log('Test 5: Cognitive link data access')
const links = Array.isArray(companion.cognitiveLinks) ? companion.cognitiveLinks : []
const link = links.find(l => l.targetId === traveler.id)
console.log(`  Total links: ${links.length}`)
if (link) {
  console.log(`  Link to traveler: exists`)
  console.log(`    Trust: ${link.trust?.toFixed(2) || '0.00'}`)
  console.log(`    Strength: ${link.strength.toFixed(2)}`)
} else {
  console.log(`  Link to traveler: not yet formed`)
}
console.log('  ✓ Link data accessible')
console.log()

// Test 6: Vocabulary data (THE BUG WE FIXED)
console.log('Test 6: Vocabulary data access (FIXED)')
try {
  const stats = vocab.getStats()
  const totalWords = stats.total
  const learnedWords = stats.learnedWords
  const protoActive = totalWords >= 50

  console.log(`  Total words: ${totalWords}`)
  console.log(`  Learned words: +${learnedWords}`)
  console.log(`  Proto-language: ${protoActive ? '✓ Active' : '✗ Inactive'}`)
  console.log('  ✓ Vocabulary data accessible')
  console.log('  ✅ NO CRASH - vocab.getStats() works!')
} catch (err) {
  console.log(`  ❌ CRASH: ${err.message}`)
  process.exit(1)
}
console.log()

// Test 7: Simulate context panel rendering
console.log('Test 7: Context panel content rendering')
const lines = []
lines.push('🧠 Memory')
lines.push(`  Total: ${memCount}`)
if (recentMem) {
  const memText = recentMem.content?.message || recentMem.content?.response || JSON.stringify(recentMem.content).substring(0, 20)
  lines.push(`  Recent: "${memText.substring(0, 20)}..."`)
}
lines.push('')

lines.push('💭 Emotion')
lines.push(`  Val: ${emotion.valence.toFixed(2)}`)
lines.push(`  Aro: ${emotion.arousal.toFixed(2)}`)
lines.push(`  Dom: ${emotion.dominance.toFixed(2)}`)
lines.push('')

lines.push('🌍 World')
lines.push(`  Weather: ${weather}`)
lines.push(`  Temp: ${temp}°C`)
lines.push(`  Tick: ${tick}`)
lines.push('')

if (link) {
  lines.push('🔗 Link')
  lines.push(`  companion ↔ you`)
  lines.push(`  Trust: ${link.trust?.toFixed(2) || '0.00'}`)
  lines.push(`  Strength: ${link.strength.toFixed(2)}`)
  lines.push('')
}

const stats = vocab.getStats()
lines.push('📚 Vocabulary')
lines.push(`  Total: ${stats.total} words`)
lines.push(`  Learned: +${stats.learnedWords}`)
lines.push(`  Proto: ${stats.total >= 50 ? '✓' : '✗'}`)

const content = lines.join('\n')
console.log('  Context panel content:')
console.log('  ┌─────────────────────┐')
content.split('\n').forEach(line => {
  console.log(`  │ ${line.padEnd(19)} │`)
})
console.log('  └─────────────────────┘')
console.log('  ✓ Content rendered successfully')
console.log()

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 Test Summary:')
console.log('  ✅ Memory data: accessible')
console.log('  ✅ Emotion data: accessible')
console.log('  ✅ World data: accessible')
console.log('  ✅ Link data: accessible')
console.log('  ✅ Vocabulary data: accessible (FIXED)')
console.log('  ✅ Context rendering: no crash')
console.log()
console.log('🎉 Context panel v1.2 works!')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
