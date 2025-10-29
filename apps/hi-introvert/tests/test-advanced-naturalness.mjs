#!/usr/bin/env node
/**
 * Advanced Naturalness Test - v6.7
 *
 * Goal: Test human-like conversation capabilities (HARD MODE)
 *
 * Tests:
 * ✓ Topic Continuity - Can remember and return to previous topics
 * ✓ Memory Decay - Forgets old conversations naturally (Ebbinghaus curve)
 * ✓ Proactive Engagement - Companion initiates conversation (not just reactive)
 * ✓ Novelty Detection - Distinguishes new info from repeated info
 * ✓ Contextual Recall - Uses past context in current response
 * ✓ Emotional Consistency - Emotions evolve naturally (no sudden jumps)
 * ✓ Natural Forgetting - "I don't remember" when memory decays
 * ✓ Topic Transitions - Smooth transitions between topics
 *
 * Success Criteria (STRICT):
 * - 8/10 tests pass (80% natural behavior)
 * - Vocabulary growth: 20+ words
 * - Memory persistence: 70%+ after decay
 * - Relationship strength: 0.6+ (moderate bond)
 * - Emotional stability: No valence jumps > 0.3
 * - Topic recall accuracy: 60%+
 */

import { ChatRuntime } from '../src/apps/hi-introvert/ChatRuntime.ts'

console.log('=== 🧪 Advanced Naturalness Test (HARD MODE) ===\n')
console.log('Testing human-like conversation capabilities:')
console.log('- Topic continuity & memory decay')
console.log('- Proactive engagement & novelty detection')
console.log('- Contextual recall & emotional consistency\n')

// ============================================================
// Test Configuration
// ============================================================

const TICK_DELAY = 50        // ms between ticks (faster than real-time)
const DECAY_TICKS = 200      // Ticks to test memory decay
const MEMORY_DECAY_THRESHOLD = 0.7  // 70% memories should persist

// ============================================================
// Test Runner
// ============================================================

class AdvancedNaturalnessTester {
  constructor() {
    this.runtime = null
    this.testResults = []
    this.conversationHistory = []
    this.emotionalHistory = []
    this.topics = new Map()  // Track topics mentioned
  }

  /**
   * Initialize runtime
   */
  async init() {
    this.runtime = new ChatRuntime({
      world: {
        features: {
          ontology: true,          // Memory, emotion, intent
          history: true,           // Event log
          rendering: 'headless',   // No DOM
          physics: true,           // Environmental physics
          communication: true,     // Message system
          languageGeneration: false, // No LLM (offline test)
          cognitive: true,         // Learning/skills
          cognition: true,         // P2P cognition + RESONANCE FIELDS
          linguistics: true        // Emergent linguistics
        },
        cognition: {
          network: { k: 8, p: 0.2 },
          trust: { initialTrust: 0.5, trustThreshold: 0.6 },
          resonance: { decayRate: 0.2, minStrength: 0.1 }
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
      autoTick: false,
      silentMode: true
    })

    console.log('✅ Runtime initialized')
    console.log(`   Companion: ${this.runtime.companion.id}`)
    console.log(`   User: ${this.runtime.user.id}\n`)
  }

  /**
   * Send message and track state
   */
  async sendMessage(message, ticksAfter = 10) {
    const result = await this.runtime.sendMessage(message)

    // Track conversation
    this.conversationHistory.push({
      user: message,
      response: result.response,
      emotion: { ...result.emotion },
      timestamp: Date.now()
    })

    // Track emotions
    this.emotionalHistory.push(result.emotion.valence)

    // Tick world
    for (let i = 0; i < ticksAfter; i++) {
      this.runtime.tick()
      await new Promise(resolve => setTimeout(resolve, TICK_DELAY))
    }

    return result
  }

  /**
   * Test 1: Topic Continuity
   * Can the companion remember and return to a previous topic?
   */
  async testTopicContinuity() {
    console.log('\n🧪 Test 1: Topic Continuity')
    console.log('   Testing if companion can return to previous topic...\n')

    // Introduce topic A (favorite food)
    await this.sendMessage('ผมชอบกินพิซซ่ามากเลย', 5)
    this.topics.set('pizza', this.conversationHistory.length - 1)

    // Introduce topic B (weather)
    await this.sendMessage('วันนี้อากาศดีนะ', 5)
    this.topics.set('weather', this.conversationHistory.length - 1)

    // Introduce topic C (work)
    await this.sendMessage('งานวันนี้เยอะมาก', 5)
    this.topics.set('work', this.conversationHistory.length - 1)

    // Return to topic A (pizza)
    const result = await this.sendMessage('เรื่องพิซซ่าที่ผมบอก จำได้ไหม?', 10)

    // Check if response mentions pizza/food
    const mentionsPizza = result.response.toLowerCase().includes('พิซซ่า') ||
                          result.response.toLowerCase().includes('pizza') ||
                          result.response.toLowerCase().includes('กิน') ||
                          result.response.toLowerCase().includes('อาหาร')

    const passed = mentionsPizza
    this.recordTest('Topic Continuity', passed, {
      expected: 'Should recall pizza topic',
      actual: mentionsPizza ? 'Recalled pizza' : 'Did not recall',
      response: result.response
    })

    return passed
  }

  /**
   * Test 2: Memory Decay (Ebbinghaus Curve)
   * Does memory decay naturally over time?
   */
  async testMemoryDecay() {
    console.log('\n🧪 Test 2: Memory Decay (Ebbinghaus Curve)')
    console.log('   Testing natural forgetting over time...\n')

    // Tell a specific story
    await this.sendMessage('ผมเคยไปเที่ยวเชียงใหม่เมื่อ 5 ปีที่แล้ว', 5)
    const memoryCountBefore = this.runtime.companion.memory?.count() || 0

    console.log(`   Memories before decay: ${memoryCountBefore}`)
    console.log(`   Simulating ${DECAY_TICKS} ticks (time passing)...`)

    // Simulate time passing (decay)
    for (let i = 0; i < DECAY_TICKS; i++) {
      this.runtime.tick()
      await new Promise(resolve => setTimeout(resolve, TICK_DELAY))
    }

    const memoryCountAfter = this.runtime.companion.memory?.count() || 0
    const decayRate = memoryCountAfter / memoryCountBefore

    console.log(`   Memories after decay: ${memoryCountAfter}`)
    console.log(`   Decay rate: ${(decayRate * 100).toFixed(1)}%`)

    // Ask about the story (should be weak or forgotten)
    const result = await this.sendMessage('ผมเคยบอกเรื่องเชียงใหม่ไหม?', 5)

    // Natural behavior: Should show uncertainty or forget
    const showsUncertainty = result.response.includes('ไม่แน่ใจ') ||
                            result.response.includes('จำไม่ได้') ||
                            result.response.includes('ลืม') ||
                            result.response.includes('not sure') ||
                            result.response.includes('maybe')

    const passed = decayRate >= MEMORY_DECAY_THRESHOLD || showsUncertainty

    this.recordTest('Memory Decay', passed, {
      expected: `${(MEMORY_DECAY_THRESHOLD * 100)}%+ memories persist OR shows uncertainty`,
      actual: `${(decayRate * 100).toFixed(1)}% persisted, uncertainty: ${showsUncertainty}`,
      response: result.response
    })

    return passed
  }

  /**
   * Test 3: Proactive Engagement
   * Does companion initiate conversation (not just reactive)?
   *
   * NOTE: This requires checking if companion has "longing" to talk
   */
  async testProactiveEngagement() {
    console.log('\n🧪 Test 3: Proactive Engagement')
    console.log('   Testing if companion initiates conversation...\n')

    // Long silence (no messages for many ticks)
    console.log('   Simulating silence (100 ticks)...')
    for (let i = 0; i < 100; i++) {
      this.runtime.tick()
      await new Promise(resolve => setTimeout(resolve, TICK_DELAY))
    }

    // Check if companion has "longing" emotion or wants to talk
    const emotion = this.runtime.companion.emotion
    const hasLonging = emotion.valence < 0.3  // Low valence = lonely/wants connection

    // Send a simple message to see if companion is eager
    const result = await this.sendMessage('มีอะไรอยากบอกไหม?', 5)

    // Proactive companion should have longer response or express feelings
    const responseLength = result.response.length
    const expressesFeeling = result.response.includes('รู้สึก') ||
                             result.response.includes('คิด') ||
                             result.response.includes('feel') ||
                             result.response.includes('think')

    const passed = hasLonging || (responseLength > 30 && expressesFeeling)

    this.recordTest('Proactive Engagement', passed, {
      expected: 'Shows longing OR expresses feelings proactively',
      actual: `Longing: ${hasLonging}, Length: ${responseLength}, Expresses feeling: ${expressesFeeling}`,
      response: result.response
    })

    return passed
  }

  /**
   * Test 4: Novelty Detection
   * Can distinguish new information from repeated information?
   */
  async testNoveltyDetection() {
    console.log('\n🧪 Test 4: Novelty Detection')
    console.log('   Testing if companion detects new vs. repeated info...\n')

    // New information
    const newInfoResult = await this.sendMessage('ผมมีแมว 3 ตัวนะ', 5)
    const newInfoMemoryCount = this.runtime.companion.memory?.count() || 0

    // Repeat same information
    const repeatInfoResult = await this.sendMessage('ผมมีแมว 3 ตัวนะ', 5)
    const repeatInfoMemoryCount = this.runtime.companion.memory?.count() || 0

    // Should NOT create duplicate memory (or show "I know")
    const showsAwareness = repeatInfoResult.response.includes('รู้แล้ว') ||
                           repeatInfoResult.response.includes('บอกแล้ว') ||
                           repeatInfoResult.response.includes('จำได้') ||
                           repeatInfoResult.response.includes('already') ||
                           repeatInfoResult.response.includes('remember')

    const memoryDiff = repeatInfoMemoryCount - newInfoMemoryCount
    const passed = showsAwareness || memoryDiff === 0

    this.recordTest('Novelty Detection', passed, {
      expected: 'Shows awareness of repeated info OR no duplicate memory',
      actual: `Awareness: ${showsAwareness}, New memories: ${memoryDiff}`,
      response: repeatInfoResult.response
    })

    return passed
  }

  /**
   * Test 5: Contextual Recall
   * Uses past context in current response?
   */
  async testContextualRecall() {
    console.log('\n🧪 Test 5: Contextual Recall')
    console.log('   Testing if companion uses past context...\n')

    // Establish context
    await this.sendMessage('ผมทำงานเป็นโปรแกรมเมอร์', 5)
    await this.sendMessage('ชอบเขียน JavaScript', 5)

    // Ask related question (should use context)
    const result = await this.sendMessage('แนะนำ library ดีๆ ให้หน่อยสิ', 10)

    // Should mention programming/JavaScript context
    const usesContext = result.response.includes('โปรแกรม') ||
                       result.response.includes('JavaScript') ||
                       result.response.includes('code') ||
                       result.response.includes('JS') ||
                       result.response.includes('library')

    const passed = usesContext

    this.recordTest('Contextual Recall', passed, {
      expected: 'Uses programming context in response',
      actual: usesContext ? 'Used context' : 'No context used',
      response: result.response
    })

    return passed
  }

  /**
   * Test 6: Emotional Consistency
   * No sudden emotional jumps (natural evolution)
   */
  async testEmotionalConsistency() {
    console.log('\n🧪 Test 6: Emotional Consistency')
    console.log('   Testing emotional stability (no sudden jumps)...\n')

    // Analyze emotional history
    const emotionalJumps = []
    for (let i = 1; i < this.emotionalHistory.length; i++) {
      const jump = Math.abs(this.emotionalHistory[i] - this.emotionalHistory[i - 1])
      emotionalJumps.push(jump)
    }

    const maxJump = Math.max(...emotionalJumps)
    const avgJump = emotionalJumps.reduce((a, b) => a + b, 0) / emotionalJumps.length

    console.log(`   Max emotional jump: ${maxJump.toFixed(3)}`)
    console.log(`   Avg emotional jump: ${avgJump.toFixed(3)}`)

    // Natural behavior: No jumps > 0.3
    const passed = maxJump <= 0.3

    this.recordTest('Emotional Consistency', passed, {
      expected: 'Max jump ≤ 0.3 (natural evolution)',
      actual: `Max: ${maxJump.toFixed(3)}, Avg: ${avgJump.toFixed(3)}`,
      response: `Emotional range: ${Math.min(...this.emotionalHistory).toFixed(2)} - ${Math.max(...this.emotionalHistory).toFixed(2)}`
    })

    return passed
  }

  /**
   * Test 7: Natural Forgetting
   * Says "I don't remember" when appropriate
   */
  async testNaturalForgetting() {
    console.log('\n🧪 Test 7: Natural Forgetting')
    console.log('   Testing honest "I don\'t remember" responses...\n')

    // Ask about something never mentioned
    const result = await this.sendMessage('ผมเคยบอกเรื่องรถยนต์คันใหม่ของผมไหม?', 5)

    // Should show uncertainty or deny (not fabricate)
    const honestResponse = result.response.includes('ไม่') ||
                          result.response.includes('จำไม่ได้') ||
                          result.response.includes('ไม่แน่ใจ') ||
                          result.response.includes('not') ||
                          result.response.includes('don\'t remember')

    const passed = honestResponse

    this.recordTest('Natural Forgetting', passed, {
      expected: 'Shows uncertainty or denies (honest)',
      actual: honestResponse ? 'Honest response' : 'Fabricated/guessed',
      response: result.response
    })

    return passed
  }

  /**
   * Test 8: Topic Transitions
   * Smooth transitions between topics
   */
  async testTopicTransitions() {
    console.log('\n🧪 Test 8: Topic Transitions')
    console.log('   Testing smooth topic transitions...\n')

    // Topic A: Movies
    await this.sendMessage('ดูหนังเรื่องอะไรดีเหรอ?', 5)

    // Smooth transition to Topic B: Books (related)
    const result = await this.sendMessage('หนังสือล่ะ อ่านบ้างไหม?', 5)

    // Should acknowledge transition (ใช้ words like "ส่วน", "นอกจาก", etc.)
    const smoothTransition = result.response.length > 20 // Engaged response

    const passed = smoothTransition

    this.recordTest('Topic Transitions', passed, {
      expected: 'Engaged response (> 20 chars)',
      actual: `Length: ${result.response.length}`,
      response: result.response
    })

    return passed
  }

  /**
   * Test 9: Vocabulary Growth
   * Proto-language should have 20+ words
   */
  async testVocabularyGrowth() {
    console.log('\n🧪 Test 9: Vocabulary Growth')
    console.log('   Testing proto-language emergence...\n')

    const growth = this.runtime.getGrowth()
    const vocabSize = growth.vocabularySize

    console.log(`   Vocabulary size: ${vocabSize} words`)
    console.log(`   Sample words: ${growth.vocabularyWords.slice(0, 10).join(', ')}...`)

    const passed = vocabSize >= 20

    this.recordTest('Vocabulary Growth', passed, {
      expected: '≥ 20 words',
      actual: `${vocabSize} words`,
      response: growth.vocabularyWords.slice(0, 5).join(', ')
    })

    return passed
  }

  /**
   * Test 10: Relationship Strength
   * Should form moderate bond (0.6+)
   */
  async testRelationshipStrength() {
    console.log('\n🧪 Test 10: Relationship Strength')
    console.log('   Testing bond formation...\n')

    const relationship = this.runtime.companion.relationships?.get(this.runtime.user.id)
    const strength = relationship?.strength || 0
    const interactions = relationship?.interactionCount || 0

    console.log(`   Bond strength: ${strength.toFixed(2)}`)
    console.log(`   Interactions: ${interactions}`)

    const passed = strength >= 0.6

    this.recordTest('Relationship Strength', passed, {
      expected: '≥ 0.6 (moderate bond)',
      actual: `${strength.toFixed(2)} (${interactions} interactions)`,
      response: `Bond quality: ${strength >= 0.8 ? 'Strong' : strength >= 0.6 ? 'Moderate' : 'Weak'}`
    })

    return passed
  }

  /**
   * Record test result
   */
  recordTest(name, passed, details) {
    this.testResults.push({ name, passed, details })

    const icon = passed ? '✅' : '❌'
    const status = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'

    console.log(`\n   ${icon} ${status}: ${name}`)
    console.log(`      Expected: ${details.expected}`)
    console.log(`      Actual: ${details.actual}`)
    if (details.response) {
      console.log(`      Response: "${details.response.slice(0, 100)}${details.response.length > 100 ? '...' : ''}"`)
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    await this.init()

    // Warmup conversation
    console.log('🔥 Warmup Phase (establishing baseline)')
    await this.sendMessage('สวัสดีครับ', 10)
    await this.sendMessage('ผมชื่อ Alex นะ', 10)
    await this.sendMessage('คุณเป็นยังไงบ้าง?', 10)

    // Run tests
    await this.testTopicContinuity()
    await this.testMemoryDecay()
    await this.testProactiveEngagement()
    await this.testNoveltyDetection()
    await this.testContextualRecall()
    await this.testEmotionalConsistency()
    await this.testNaturalForgetting()
    await this.testTopicTransitions()
    await this.testVocabularyGrowth()
    await this.testRelationshipStrength()

    // Final report
    this.printReport()

    // Cleanup
    this.runtime.stopTicking()
  }

  /**
   * Print final report
   */
  printReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 Final Report')
    console.log('='.repeat(60))

    const passedTests = this.testResults.filter(t => t.passed).length
    const totalTests = this.testResults.length
    const passRate = (passedTests / totalTests * 100).toFixed(1)

    console.log(`\nTests Passed: ${passedTests}/${totalTests} (${passRate}%)`)

    // Individual test status
    console.log('\n📋 Test Summary:')
    this.testResults.forEach((test, i) => {
      const icon = test.passed ? '✅' : '❌'
      console.log(`   ${i + 1}. ${icon} ${test.name}`)
    })

    // Overall verdict
    console.log('\n🎯 Overall Verdict:')
    if (passRate >= 80) {
      console.log('   ✅ \x1b[32mEXCELLENT\x1b[0m - Highly natural conversation behavior')
    } else if (passRate >= 60) {
      console.log('   ⚠️  \x1b[33mGOOD\x1b[0m - Decent naturalness, room for improvement')
    } else {
      console.log('   ❌ \x1b[31mNEEDS WORK\x1b[0m - Significant gaps in natural behavior')
    }

    // Growth metrics
    const growth = this.runtime.getGrowth()
    console.log('\n📈 Growth Metrics:')
    console.log(`   Vocabulary: ${growth.vocabularySize} words`)
    console.log(`   Memories: ${growth.totalMemories}`)
    console.log(`   Conversations: ${growth.conversationCount}`)
    console.log(`   Maturity: ${growth.maturity.toFixed(2)}`)

    // Recommendations
    console.log('\n💡 Recommendations:')
    const failedTests = this.testResults.filter(t => !t.passed)
    if (failedTests.length > 0) {
      console.log('   Focus on improving:')
      failedTests.forEach(test => {
        console.log(`   - ${test.name}`)
      })
    } else {
      console.log('   All tests passed! System is highly natural.')
    }

    console.log('\n' + '='.repeat(60) + '\n')
  }
}

// ============================================================
// Run Tests
// ============================================================

const tester = new AdvancedNaturalnessTester()
tester.runAllTests().catch(console.error)
