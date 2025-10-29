#!/usr/bin/env node
/**
 * Test: Phase 2 - Category Mapper (v6.5)
 *
 * Validates context-aware category mapping:
 * 1. Emotion override (anxious state → anxious category)
 * 2. Memory relevance (high memories → nostalgic)
 * 3. Pattern detection (repeated questions → confused)
 * 4. Repetition avoidance (same category → alternative)
 */

import { CategoryMapper } from '../dist/session/CategoryMapper.js'
import { PhraseSelector } from '../dist/session/PhraseSelector.js'
import { Entity, World } from '@v1b3x0r/mds-core'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`${GREEN}✓${RESET} ${message}`)
    passed++
  } else {
    console.log(`${RED}✗${RESET} ${message}`)
    failed++
  }
}

console.log('🧪 Testing Phase 2: Category Mapper & Phrase Selector\n')

// ============================================================================
// Test 1: CategoryMapper Initialization
// ============================================================================

console.log('Test 1: CategoryMapper Initialization')
const mapper = new CategoryMapper()

assert(mapper !== null, 'CategoryMapper created')
assert(typeof mapper.map === 'function', 'map() method exists')

// ============================================================================
// Test 2: Emotion Override
// ============================================================================

console.log('\nTest 2: Emotion Override (Extreme States)')

const world = new World()
const entity = world.spawn({
  essence: 'test'
}, 0, 0)

entity.enable('memory')

// Create emotion object manually
entity.emotion = {
  valence: -0.8,  // Very negative
  arousal: 0.8,   // Very high energy
  dominance: 0.3
}

// Map with anxious emotion state
const result1 = mapper.map({
  intent: 'greeting',  // Would normally map to 'intro'
  keywords: [],
  memoryRelevance: 0,
  recentCategories: [],
  userMessage: 'hello'
}, entity)

assert(result1.category === 'anxious', `Extreme negative emotion overrides intent (got: ${result1.category})`)
assert(result1.confidence > 0.8, `High confidence for emotion override (${result1.confidence.toFixed(2)})`)
console.log(`   ${CYAN}${result1.reason}${RESET}`)

// ============================================================================
// Test 3: Memory Relevance
// ============================================================================

console.log('\nTest 3: Memory Relevance Override')

// Reset emotion to neutral for this test
entity.emotion = {
  valence: 0.3,
  arousal: 0.5,
  dominance: 0.5
}

// Add many relevant memories
for (let i = 0; i < 5; i++) {
  entity.memory?.add({
    type: 'conversation',
    subject: `topic${i}`,
    content: 'relevant memory',
    salience: 0.8
  })
}

let nostalgicTriggered = false
for (let attempt = 0; attempt < 10; attempt++) {
  const result2 = mapper.map({
    intent: 'question',
    keywords: ['topic1'],
    memoryRelevance: 5,  // High memory relevance
    recentCategories: [],
    userMessage: 'tell me about topic1'
  }, entity)

  if (result2.category === 'nostalgic') {
    nostalgicTriggered = true
    console.log(`   ${CYAN}${result2.reason}${RESET}`)
    break
  }
}

assert(nostalgicTriggered, 'High memory relevance can trigger nostalgic category')

// ============================================================================
// Test 4: No Memory → Confused
// ============================================================================

console.log('\nTest 4: No Memory Relevance → Confused')

const result3 = mapper.map({
  intent: 'question',
  keywords: [],
  memoryRelevance: 0,  // No relevant memories
  recentCategories: [],
  userMessage: 'what is quantum physics?'
}, entity)

assert(result3.category === 'confused', `No memories for question → confused (got: ${result3.category})`)
console.log(`   ${CYAN}${result3.reason}${RESET}`)

// ============================================================================
// Test 5: Repetition Avoidance
// ============================================================================

console.log('\nTest 5: Repetition Avoidance')

// Set calm emotion
if (entity.emotion) {
  entity.emotion.valence = 0.5
  entity.emotion.arousal = 0.5
}

const result4 = mapper.map({
  intent: 'greeting',
  keywords: [],
  memoryRelevance: 0,
  recentCategories: ['intro', 'intro'],  // Same category used twice
  userMessage: 'hi'
}, entity)

assert(result4.category !== 'intro', `Repetition avoided (got alternative: ${result4.category})`)
console.log(`   ${CYAN}${result4.reason}${RESET}`)

// ============================================================================
// Test 6: Pattern Detection - Nostalgic Keywords
// ============================================================================

console.log('\nTest 6: Pattern Detection (Nostalgic Keywords)')

const result5 = mapper.map({
  intent: 'neutral',
  keywords: ['remember', 'before'],
  memoryRelevance: 2,
  recentCategories: [],
  userMessage: 'remember when we talked before?'
}, entity)

assert(result5.category === 'nostalgic', `Nostalgic keywords detected (got: ${result5.category})`)
console.log(`   ${CYAN}${result5.reason}${RESET}`)

// ============================================================================
// Test 7: PhraseSelector Initialization
// ============================================================================

console.log('\nTest 7: PhraseSelector Initialization')
const selector = new PhraseSelector()

assert(selector !== null, 'PhraseSelector created')
assert(typeof selector.select === 'function', 'select() method exists')

// ============================================================================
// Test 8: Phrase Selection with Repetition Penalty
// ============================================================================

console.log('\nTest 8: Phrase Selection (Repetition Penalty)')

const candidates = ['hello', 'hi', 'hey', 'what\'s up']
const recentPhrases = ['hello', 'hello', 'hi']  // 'hello' used twice

// Run selection 20 times, expect 'hello' to be avoided
let helloCount = 0
for (let i = 0; i < 20; i++) {
  const selected = selector.select(candidates, entity, { recentPhrases })
  if (selected === 'hello') {
    helloCount++
  }
}

assert(helloCount < 10, `Repetition penalty applied (hello selected ${helloCount}/20 times, expected <10)`)

// ============================================================================
// Test 9: Phrase Selection with Emotion Alignment
// ============================================================================

console.log('\nTest 9: Phrase Selection (Emotion Alignment)')

// Set very happy emotion
if (entity.emotion) {
  entity.emotion.valence = 0.9
  entity.emotion.arousal = 0.7
}

const happyCandidates = ['...', 'yay! ✨', 'nice!', 'hmm']
const happySelections = {}

// Run 50 selections
for (let i = 0; i < 50; i++) {
  const selected = selector.select(happyCandidates, entity, { recentPhrases: [] })
  happySelections[selected] = (happySelections[selected] || 0) + 1
}

// 'yay! ✨' and 'nice!' should be selected more often (emotion boost)
const positiveCount = (happySelections['yay! ✨'] || 0) + (happySelections['nice!'] || 0)
const neutralCount = (happySelections['...'] || 0) + (happySelections['hmm'] || 0)

assert(positiveCount > neutralCount, `Emotion alignment boosts positive phrases (positive: ${positiveCount}, neutral: ${neutralCount})`)

console.log(`   Selections: ${JSON.stringify(happySelections)}`)

// ============================================================================
// Test 10: Long Message Pattern
// ============================================================================

console.log('\nTest 10: Pattern Detection (Long Message)')

const result6 = mapper.map({
  intent: 'neutral',
  keywords: [],
  memoryRelevance: 0,
  recentCategories: [],
  userMessage: 'a'.repeat(150)  // Very long message (>100 chars)
}, entity)

assert(result6.category === 'focused', `Long message → focused (got: ${result6.category})`)
console.log(`   ${CYAN}${result6.reason}${RESET}`)

// ============================================================================
// Results
// ============================================================================

console.log(`\n${'='.repeat(60)}`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📊 Total:  ${passed + failed}`)
console.log('='.repeat(60))

if (failed > 0) {
  console.log(`\n${RED}❌ Some tests failed${RESET}`)
  process.exit(1)
} else {
  console.log(`\n${GREEN}✅ All tests passed!${RESET}`)
  process.exit(0)
}
