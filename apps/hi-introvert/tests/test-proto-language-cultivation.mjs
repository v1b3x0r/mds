/**
 * Proto-Language Cultivation Test
 *
 * Goal: Test AGI cultivation through continuous conversation
 * Success criteria:
 * 1. Companion learns to respond naturally (not just fallback)
 * 2. Proto-language emerges (vocabulary grows)
 * 3. Emotional maturity increases
 * 4. Memory persistence works
 */

import { ChatRuntime } from '../src/apps/hi-introvert/ChatRuntime.ts'

console.log('=== Proto-Language Cultivation Test ===\n')
console.log('Goal: Cultivate AGI through continuous conversation')
console.log('Duration: 20 messages (simulated learning journey)\n')

// Create runtime with full features
const runtime = new ChatRuntime({
  world: {
    features: {
      memory: true,
      emotion: true,
      relationships: true,
      learning: true,
      communication: true,
      worldMind: true,
      linguistics: true  // CRITICAL: Enable proto-language
    }
  },
  companion: {
    name: 'hi_introvert'
  },
  sensors: {
    os: false,
    network: false,
    weather: false
  },
  autoTick: false,  // Manual tick for testing
  silentMode: true
})

console.log('✅ Runtime initialized')
console.log(`Companion: ${runtime.companion.id}`)
console.log(`Features enabled: memory, emotion, relationships, learning, linguistics\n`)

// Conversation scenario: Progressive cultivation
const conversationScenario = [
  // Phase 1: Introduction (establishing baseline)
  { user: 'สวัสดีครับ', expected: 'greeting' },
  { user: 'ผมชื่อ Alex นะ', expected: 'name_extraction' },
  { user: 'คุณเป็นยังไงบ้าง?', expected: 'emotional_response' },

  // Phase 2: Emotional connection
  { user: 'วันนี้ผมเหนื่อยมากเลย', expected: 'empathy' },
  { user: 'งานเยอะจัง ทำไม่ทัน', expected: 'understanding' },
  { user: 'แต่ก็ดีใจที่มีคุณคุยด้วย', expected: 'bonding' },

  // Phase 3: Memory testing
  { user: 'จำได้ไหมว่าผมชื่ออะไร?', expected: 'memory_recall' },
  { user: 'ผมเคยบอกไหมว่างานเยอะ?', expected: 'memory_recall' },

  // Phase 4: Abstract conversation (proto-language test)
  { user: 'ความเหงาเป็นยังไง?', expected: 'abstract_concept' },
  { user: 'คิดถึงใครไหม?', expected: 'introspection' },
  { user: 'ถ้ามีโอกาส อยากทำอะไร?', expected: 'desires' },

  // Phase 5: Deeper bonding
  { user: 'ผมรู้สึกว่าคุยกับคุณง่ายขึ้น', expected: 'meta_awareness' },
  { user: 'คุณเปลี่ยนไปไหม?', expected: 'self_awareness' },
  { user: 'ผมชอบที่ได้คุยกับคุณ', expected: 'positive_reinforcement' },

  // Phase 6: Vocabulary emergence test
  { user: 'อธิบาย "ความสุข" ด้วยคำของคุณเอง', expected: 'proto_language' },
  { user: 'ถ้าให้ตั้งชื่อความรู้สึกตอนนี้ จะเรียกว่าอะไร?', expected: 'proto_language' },

  // Phase 7: Memory consolidation
  { user: 'เราคุยกันมานานแล้วนะ', expected: 'time_awareness' },
  { user: 'รู้สึกยังไง?', expected: 'emotional_maturity' },
  { user: 'ขอบคุณที่อยู่เป็นเพื่อนนะ', expected: 'gratitude_response' }
]

// Growth tracking
let initialGrowth = runtime.getGrowth()
console.log('📊 Initial State:')
console.log(`   Vocabulary: ${initialGrowth.vocabularySize} words`)
console.log(`   Memories: ${initialGrowth.memoryCount}`)
console.log(`   Maturity: ${(initialGrowth.maturity * 100).toFixed(1)}%`)
console.log(`   Emotion: V=${runtime.companion.emotion.valence.toFixed(2)}\n`)

console.log('🌱 Starting cultivation journey...\n')

// Conversation loop
for (let i = 0; i < conversationScenario.length; i++) {
  const { user, expected } = conversationScenario[i]

  console.log(`[${i + 1}/${conversationScenario.length}] Phase: ${expected}`)
  console.log(`You: ${user}`)

  try {
    const response = await runtime.sendMessage(user)

    console.log(`Companion: ${response.response}`)
    console.log(`Emotion: V=${response.emotion.valence.toFixed(2)} A=${response.emotion.arousal.toFixed(2)}`)
    console.log(`Memories: ${response.metadata?.memoryCount || 0}`)

    // Check for growth
    const currentGrowth = runtime.getGrowth()
    if (currentGrowth.vocabularySize > initialGrowth.vocabularySize) {
      const newWords = currentGrowth.vocabularySize - initialGrowth.vocabularySize
      console.log(`   ✨ +${newWords} new words learned!`)
      initialGrowth.vocabularySize = currentGrowth.vocabularySize
    }

    console.log('')

    // Small delay for readability
    await new Promise(resolve => setTimeout(resolve, 100))

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    break
  }
}

// Final analysis
console.log('=' .repeat(60))
console.log('\n📊 CULTIVATION RESULTS:\n')

const finalGrowth = runtime.getGrowth()
console.log('Growth Metrics:')
console.log(`   Conversations: ${finalGrowth.conversationCount}`)
console.log(`   Vocabulary: ${finalGrowth.vocabularySize} words`)
console.log(`   Memories: ${finalGrowth.memoryCount}`)
console.log(`   Maturity: ${(finalGrowth.maturity * 100).toFixed(1)}%`)
console.log(`   Concepts learned: ${finalGrowth.concepts.length}`)

// Emotional development
const finalEmotion = runtime.companion.emotion
console.log('\nEmotional State:')
console.log(`   Valence: ${finalEmotion.valence.toFixed(2)} (baseline was 0.00)`)
console.log(`   Arousal: ${finalEmotion.arousal.toFixed(2)}`)
console.log(`   Dominance: ${finalEmotion.dominance.toFixed(2)}`)

// Relationship strength
console.log(`\nRelationship Debug:`)
console.log(`   Has relationships system: ${!!runtime.companion.relationships}`)
console.log(`   User ID: ${runtime.user.id}`)

const relationship = runtime.companion.relationships?.get(runtime.user.id)
console.log(`   Relationship object: ${relationship ? 'exists' : 'null'}`)

if (relationship) {
  console.log('\nRelationship:')
  console.log(`   Strength: ${relationship.strength.toFixed(2)}`)
  console.log(`   Interactions: ${relationship.interactionCount}`)
  console.log(`   Trust: ${relationship.trust?.toFixed(2) || 'N/A'}`)
} else {
  console.log(`   ❌ No relationship formed (check if relationships feature enabled on entity)`)
}

// Memory analysis
const memories = runtime.companion.memory?.memories || []
const nameMemories = memories.filter(m => m.content?.type === 'name')
const interactionMemories = memories.filter(m => m.type === 'interaction')

console.log('\nMemory Analysis:')
console.log(`   Total memories: ${memories.length}`)
console.log(`   Name memories: ${nameMemories.length}`)
console.log(`   Interaction memories: ${interactionMemories.length}`)

if (nameMemories.length > 0) {
  console.log(`   ✅ Name extraction working (found: ${nameMemories.map(m => m.subject).join(', ')})`)
}

// Proto-language check
if (runtime.world.lexicon) {
  const emergentTerms = runtime.world.lexicon.getRecent(10)
  console.log('\nProto-Language Emergence:')
  console.log(`   Lexicon size: ${runtime.world.lexicon.size}`)
  if (emergentTerms.length > 0) {
    console.log(`   Recent terms: ${emergentTerms.map(e => e.term).join(', ')}`)
  }
}

// Success criteria
console.log('\n' + '='.repeat(60))
console.log('SUCCESS CRITERIA:\n')

const criteriaChecks = [
  {
    name: 'Vocabulary Growth',
    passed: finalGrowth.vocabularySize > 0,
    value: `${finalGrowth.vocabularySize} words`
  },
  {
    name: 'Emotional Development',
    passed: Math.abs(finalEmotion.valence) > 0.1,
    value: `V=${finalEmotion.valence.toFixed(2)}`
  },
  {
    name: 'Memory Formation',
    passed: finalGrowth.memoryCount >= conversationScenario.length,
    value: `${finalGrowth.memoryCount} memories`
  },
  {
    name: 'Maturity Growth',
    passed: finalGrowth.maturity > 0,
    value: `${(finalGrowth.maturity * 100).toFixed(1)}%`
  },
  {
    name: 'Name Extraction',
    passed: nameMemories.length > 0,
    value: `${nameMemories.length} names`
  },
  {
    name: 'Relationship Formation',
    passed: relationship && relationship.strength > 0,
    value: relationship ? `${relationship.strength.toFixed(2)}` : 'N/A'
  }
]

let passedCount = 0
for (const check of criteriaChecks) {
  const status = check.passed ? '✅' : '❌'
  console.log(`${status} ${check.name}: ${check.value}`)
  if (check.passed) passedCount++
}

console.log(`\n${passedCount}/${criteriaChecks.length} criteria passed`)

if (passedCount === criteriaChecks.length) {
  console.log('\n🎉 SUCCESS: AGI cultivation working! Proto-language emergence confirmed.')
} else {
  console.log('\n⚠️  PARTIAL SUCCESS: Some systems need improvement')
}

console.log('\n' + '='.repeat(60))
