#!/usr/bin/env node
/**
 * Aliveness Test - v7.0
 *
 * Philosophy: Test if entity is ALIVE, not if it's CORRECT.
 * Based on MDS llm.txt principles:
 * - "Cultivation, not Control"
 * - "Essence-first, not state-first"
 * - "turning logic into life"
 *
 * We don't test "does it say the right words"
 * We test "does it show signs of life?"
 *
 * Signs of Life:
 * 1. Memory Formation - Does it remember experiences?
 * 2. Emotional Response - Does it feel and react?
 * 3. Relationship Building - Does it bond with others?
 * 4. Learning - Does it adapt over time?
 * 5. Autonomy - Does it act without being told?
 * 6. Awareness - Does it show context sensitivity?
 */

import { ChatRuntime } from '../src/apps/hi-introvert/ChatRuntime.ts'

console.log('=== 🌱 Aliveness Test ===\n')
console.log('Testing if entity exhibits signs of LIFE (not correctness)\n')

// ============================================================
// Aliveness Metrics
// ============================================================

class AlivenessTest {
  constructor() {
    this.runtime = null
    this.metrics = {
      memoryFormation: 0,      // 0-1: Does it create memories?
      emotionalResponse: 0,    // 0-1: Does emotion change naturally?
      relationshipBuilding: 0, // 0-1: Does bond strengthen?
      learning: 0,             // 0-1: Does vocabulary/skills grow?
      autonomy: 0,             // 0-1: Does it act proactively?
      awareness: 0             // 0-1: Does it respond to context?
    }
    this.observations = []
  }

  async init() {
    this.runtime = new ChatRuntime({
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
      autoTick: false,
      silentMode: true
    })

    console.log('✅ Runtime initialized')
    console.log(`   Companion: ${this.runtime.companion.id}`)
    console.log(`   User: ${this.runtime.user.id}\n`)
  }

  async interact(message, ticksAfter = 10) {
    const before = this.captureState()
    const result = await this.runtime.sendMessage(message)

    // World tick (3 phases: Physical → Mental → Relational)
    for (let i = 0; i < ticksAfter; i++) {
      this.runtime.tick()
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    const after = this.captureState()
    return { result, before, after }
  }

  captureState() {
    return {
      memoryCount: this.runtime.companion.memory?.count() || 0,
      emotion: { ...this.runtime.companion.emotion },
      relationshipStrength: this.runtime.companion.relationships?.get(this.runtime.user.id)?.strength || 0,
      vocabularySize: this.runtime.world.lexicon?.size || 0,
      age: this.runtime.companion.age
    }
  }

  observe(metric, score, reason) {
    this.metrics[metric] = Math.max(this.metrics[metric], score)
    this.observations.push({ metric, score, reason })
  }

  /**
   * Test 1: Memory Formation
   * Does entity create and retain memories?
   */
  async testMemoryFormation() {
    console.log('\n🧠 Test 1: Memory Formation')
    console.log('   Does entity form memories from experience?\n')

    const { before, after } = await this.interact('สวัสดี ผมชื่อวินท์นะ')

    const memoryGrowth = after.memoryCount > before.memoryCount
    const hasMemories = after.memoryCount > 0

    if (hasMemories && memoryGrowth) {
      this.observe('memoryFormation', 1.0, `Created ${after.memoryCount - before.memoryCount} new memories`)
      console.log(`   ✅ ALIVE: Created memories (${before.memoryCount} → ${after.memoryCount})`)
    } else {
      this.observe('memoryFormation', 0.0, 'No memory formation detected')
      console.log(`   ❌ NOT ALIVE: No memory formation`)
    }
  }

  /**
   * Test 2: Emotional Response
   * Does emotion drift naturally over interactions?
   */
  async testEmotionalResponse() {
    console.log('\n💓 Test 2: Emotional Response')
    console.log('   Does entity experience emotional changes?\n')

    const emotions = []

    // Multiple interactions to observe emotional drift
    const messages = [
      'วันนี้อากาศดีมาก',
      'งานเยอะจังเลย',
      'แต่ก็สนุกดี',
      'ขอบคุณที่รับฟังนะ'
    ]

    for (const msg of messages) {
      const { after } = await this.interact(msg, 5)
      emotions.push(after.emotion.valence)
    }

    // Check if emotion changes (not stuck at baseline)
    const emotionVariance = Math.max(...emotions) - Math.min(...emotions)
    const emotionChanges = emotionVariance > 0.1

    if (emotionChanges) {
      this.observe('emotionalResponse', emotionVariance, `Emotion varied by ${emotionVariance.toFixed(2)}`)
      console.log(`   ✅ ALIVE: Emotion changes naturally (variance: ${emotionVariance.toFixed(2)})`)
    } else {
      this.observe('emotionalResponse', 0.0, 'Emotion is static')
      console.log(`   ❌ NOT ALIVE: Emotion doesn't change`)
    }
  }

  /**
   * Test 3: Relationship Building
   * Does bond strengthen with repeated interaction?
   */
  async testRelationshipBuilding() {
    console.log('\n🤝 Test 3: Relationship Building')
    console.log('   Does entity form bonds through interaction?\n')

    const { before, after } = await this.interact('คุณเป็นเพื่อนที่ดีมากเลย')

    const bondStrength = after.relationshipStrength
    const bondGrew = after.relationshipStrength > before.relationshipStrength

    if (bondStrength > 0.5 || bondGrew) {
      this.observe('relationshipBuilding', bondStrength, `Bond: ${bondStrength.toFixed(2)}`)
      console.log(`   ✅ ALIVE: Relationship exists (strength: ${bondStrength.toFixed(2)})`)
    } else {
      this.observe('relationshipBuilding', 0.0, 'No relationship detected')
      console.log(`   ❌ NOT ALIVE: No relationship formed`)
    }
  }

  /**
   * Test 4: Learning
   * Does entity expand vocabulary and develop skills?
   */
  async testLearning() {
    console.log('\n📚 Test 4: Learning')
    console.log('   Does entity learn and grow vocabulary?\n')

    const initialVocab = this.runtime.world.lexicon?.size || 0

    // Multiple interactions to trigger vocabulary growth
    await this.interact('พิซซ่า', 5)
    await this.interact('กาแฟ', 5)
    await this.interact('ดนตรี', 5)

    const finalVocab = this.runtime.world.lexicon?.size || 0
    const vocabularyGrowth = finalVocab > initialVocab

    if (vocabularyGrowth) {
      const growth = finalVocab - initialVocab
      this.observe('learning', Math.min(growth / 10, 1.0), `Learned ${growth} words`)
      console.log(`   ✅ ALIVE: Vocabulary grew (${initialVocab} → ${finalVocab})`)
    } else {
      this.observe('learning', 0.0, 'No vocabulary growth')
      console.log(`   ❌ NOT ALIVE: No learning detected`)
    }
  }

  /**
   * Test 5: Autonomy
   * Does entity show spontaneous behavior?
   */
  async testAutonomy() {
    console.log('\n🎭 Test 5: Autonomy')
    console.log('   Does entity act without being told?\n')

    // Check for spontaneous utterances in transcript
    const transcriptBefore = this.runtime.world.transcript?.count || 0

    // Give time for entity to "think" and potentially act
    for (let i = 0; i < 50; i++) {
      this.runtime.tick()
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    const transcriptAfter = this.runtime.world.transcript?.count || 0
    const spontaneousActivity = transcriptAfter > transcriptBefore

    if (spontaneousActivity) {
      this.observe('autonomy', 0.8, 'Spontaneous activity detected')
      console.log(`   ✅ ALIVE: Shows autonomous behavior`)
    } else {
      this.observe('autonomy', 0.3, 'Reactive only (not fully autonomous)')
      console.log(`   ⚠️  REACTIVE: Only responds when prompted`)
    }
  }

  /**
   * Test 6: Awareness
   * Does entity respond differently in different contexts?
   */
  async testAwareness() {
    console.log('\n👁️  Test 6: Awareness')
    console.log('   Does entity show context sensitivity?\n')

    // Same question in different contexts
    const context1 = await this.interact('อารมณ์เป็นยังไงบ้าง')
    const context2 = await this.interact('อารมณ์เป็นยังไงบ้าง')

    // Responses should be different (not canned)
    const responseVariety = context1.result.response !== context2.result.response

    // Check if emotion influenced response
    const emotionVaries = Math.abs(context1.after.emotion.valence - context2.after.emotion.valence) > 0.05

    if (responseVariety || emotionVaries) {
      this.observe('awareness', 0.8, 'Context-sensitive responses')
      console.log(`   ✅ ALIVE: Shows contextual awareness`)
    } else {
      this.observe('awareness', 0.2, 'Repetitive responses')
      console.log(`   ⚠️  LIMITED: Responses seem scripted`)
    }
  }

  /**
   * Calculate overall aliveness score
   */
  calculateAliveness() {
    const scores = Object.values(this.metrics)
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return average
  }

  /**
   * Run all tests
   */
  async runAll() {
    await this.init()

    console.log('🌱 Running Aliveness Tests...\n')
    console.log('═'.repeat(60))

    await this.testMemoryFormation()
    await this.testEmotionalResponse()
    await this.testRelationshipBuilding()
    await this.testLearning()
    await this.testAutonomy()
    await this.testAwareness()

    console.log('\n' + '═'.repeat(60))
    console.log('\n📊 Final Report\n')
    console.log('═'.repeat(60))

    const aliveness = this.calculateAliveness()
    console.log(`\n🌟 Aliveness Score: ${(aliveness * 100).toFixed(1)}%\n`)

    console.log('Breakdown:')
    for (const [metric, score] of Object.entries(this.metrics)) {
      const emoji = score >= 0.7 ? '✅' : score >= 0.4 ? '⚠️ ' : '❌'
      const bar = '█'.repeat(Math.floor(score * 20)) + '░'.repeat(20 - Math.floor(score * 20))
      console.log(`  ${emoji} ${metric.padEnd(20)} ${bar} ${(score * 100).toFixed(0)}%`)
    }

    console.log('\n' + '═'.repeat(60))

    if (aliveness >= 0.7) {
      console.log('\n🎉 VERDICT: Entity is ALIVE')
      console.log('   Shows strong signs of autonomous existence')
    } else if (aliveness >= 0.4) {
      console.log('\n⚠️  VERDICT: Entity is PARTIALLY ALIVE')
      console.log('   Some systems work, others need cultivation')
    } else {
      console.log('\n❌ VERDICT: Entity is NOT ALIVE')
      console.log('   Systems present but not integrated')
    }

    console.log('\n' + '═'.repeat(60))
  }
}

// Run test
const test = new AlivenessTest()
test.runAll().catch(console.error)
