#!/usr/bin/env node
/**
 * Integration Test: Scenario 1 - Cold Start Conversation
 *
 * Tests the complete flow from first greeting to memory recall.
 * Duration: 2 minutes (24 messages)
 *
 * This is NOT a unit test - it tests the ENTIRE system working together:
 * - WorldSession
 * - CategoryMapper
 * - DialogueEnhancer
 * - MemoryBuffer
 * - Consolidation
 * - UI display
 */

import { WorldSession } from '../dist/session/WorldSession.js'
import { EventEmitter } from 'events'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const YELLOW = '\x1b[33m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

class IntegrationTester {
  constructor(scenarioName) {
    this.scenarioName = scenarioName
    this.session = null
    this.messages = []  // { timestamp, user, response, category, memoryCount, salience }
    this.expectations = []
    this.passed = 0
    this.failed = 0
  }

  async setup() {
    console.log(`${CYAN}🧪 Integration Test: ${this.scenarioName}${RESET}\n`)

    // Create session (silent mode to avoid console spam)
    this.session = new WorldSession({ companionId: 'hi_introvert' })
    this.session.setSilentMode(true)

    // Capture events
    this.session.on('message', (data) => {
      // Could capture for detailed logging if needed
    })

    console.log(`${DIM}✓ Session initialized${RESET}`)
    console.log(`${DIM}✓ Companion: ${this.session.companionId}${RESET}`)
    console.log(`${DIM}✓ Silent mode enabled${RESET}\n`)
  }

  async sendMessage(userInput, timestamp, expectations = {}) {
    const companion = this.session.companionEntity.entity

    // Record state BEFORE message
    const memoryCountBefore = companion.memory?.count() || 0
    const emotionBefore = companion.emotion ? { ...companion.emotion } : null

    // Send message
    const result = await this.session.handleUserMessage(userInput)
    const response = result.response  // Extract response string from result object

    // Record state AFTER message
    const memoryCountAfter = companion.memory?.count() || 0
    const emotionAfter = companion.emotion ? { ...companion.emotion } : null
    const lastCategory = this.session.recentCategories[0] || 'unknown'

    // Find user message memory (most recent with subject: traveler)
    const userMemory = companion.memory?.memories
      .filter(m => m.subject === 'traveler')
      .sort((a, b) => b.timestamp - a.timestamp)[0]

    const messageRecord = {
      timestamp,
      user: userInput,
      response,
      category: lastCategory,
      memoryCountBefore,
      memoryCountAfter,
      userMemorySalience: userMemory?.salience || 0,
      emotionDelta: emotionAfter && emotionBefore
        ? (emotionAfter.valence - emotionBefore.valence).toFixed(3)
        : 0
    }

    this.messages.push(messageRecord)

    // Print message exchange
    console.log(`${CYAN}[${timestamp}] User:${RESET} ${userInput}`)
    console.log(`${GREEN}       Response:${RESET} ${response}`)
    console.log(`${DIM}       Category: ${lastCategory} | Mem: ${memoryCountAfter} | Salience: ${messageRecord.userMemorySalience.toFixed(2)}${RESET}`)

    // Verify expectations
    if (Object.keys(expectations).length > 0) {
      this.verify(messageRecord, expectations)
    }

    console.log('')  // Blank line

    // Small delay to simulate realistic conversation pacing
    await this.wait(100)

    return messageRecord
  }

  verify(messageRecord, expectations) {
    for (const [key, expected] of Object.entries(expectations)) {
      const testName = `${messageRecord.timestamp} - ${key}`

      switch (key) {
        case 'categoryNot':
          if (messageRecord.category !== expected) {
            this.pass(testName, `category != "${expected}"`)
          } else {
            this.fail(testName, `category != "${expected}"`, `got "${messageRecord.category}"`)
          }
          break

        case 'categoryOneOf':
          if (expected.includes(messageRecord.category)) {
            this.pass(testName, `category in [${expected.join(', ')}]`)
          } else {
            this.fail(testName, `category in [${expected.join(', ')}]`, `got "${messageRecord.category}"`)
          }
          break

        case 'memoryCount':
          const operator = expected.operator || '>='
          const value = expected.value
          const actual = messageRecord.memoryCountAfter
          const passes = this.evaluateCondition(actual, operator, value)

          if (passes) {
            this.pass(testName, `memoryCount ${operator} ${value}`)
          } else {
            this.fail(testName, `memoryCount ${operator} ${value}`, `got ${actual}`)
          }
          break

        case 'salienceMin':
          if (messageRecord.userMemorySalience >= expected) {
            this.pass(testName, `salience >= ${expected}`)
          } else {
            this.fail(testName, `salience >= ${expected}`, `got ${messageRecord.userMemorySalience.toFixed(2)}`)
          }
          break

        case 'responseNotEmpty':
          if (messageRecord.response && messageRecord.response.length > 0) {
            this.pass(testName, 'response not empty')
          } else {
            this.fail(testName, 'response not empty', 'got empty response')
          }
          break

        case 'uniqueResponse':
          // Check if response is different from recent responses
          const recentResponses = this.messages.slice(-expected.count).map(m => m.response)
          const isUnique = !recentResponses.slice(0, -1).includes(messageRecord.response)

          if (isUnique) {
            this.pass(testName, `unique response (not in last ${expected.count})`)
          } else {
            this.fail(testName, `unique response (not in last ${expected.count})`, 'duplicate found')
          }
          break

        case 'memoryRecall':
          // Check if companion's memory contains the expected subject
          const memories = this.session.companionEntity.entity.memory?.memories || []
          const recalled = memories.some(m =>
            m.subject.toLowerCase().includes(expected.subject.toLowerCase()) ||
            (m.content?.message && m.content.message.toLowerCase().includes(expected.subject.toLowerCase()))
          )

          if (recalled) {
            this.pass(testName, `recalled memory: "${expected.subject}"`)
          } else {
            this.fail(testName, `recalled memory: "${expected.subject}"`, 'not found in memory')
          }
          break
      }
    }
  }

  evaluateCondition(actual, operator, expected) {
    switch (operator) {
      case '>=': return actual >= expected
      case '>': return actual > expected
      case '<=': return actual <= expected
      case '<': return actual < expected
      case '==': return actual === expected
      case '!=': return actual !== expected
      default: return false
    }
  }

  pass(testName, description) {
    this.passed++
    this.expectations.push({ name: testName, status: 'pass', description })
    console.log(`  ${GREEN}✓${RESET} ${DIM}${description}${RESET}`)
  }

  fail(testName, expected, actual) {
    this.failed++
    this.expectations.push({ name: testName, status: 'fail', expected, actual })
    console.log(`  ${RED}✗${RESET} Expected: ${expected}, Got: ${actual}`)
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async teardown() {
    // Cleanup
    if (this.session) {
      // No explicit cleanup needed for now
    }
  }

  generateReport() {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`${CYAN}📊 Test Results${RESET}`)
    console.log('='.repeat(60))
    console.log(`Scenario: ${this.scenarioName}`)
    console.log(`Messages: ${this.messages.length}`)
    console.log(`Tests Run: ${this.passed + this.failed}`)
    console.log(`${GREEN}Passed: ${this.passed}${RESET}`)
    console.log(`${RED}Failed: ${this.failed}${RESET}`)
    console.log(`Pass Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`)
    console.log('='.repeat(60))

    // Summary metrics
    const finalMemoryCount = this.session.companionEntity.entity.memory?.count() || 0
    const consolidatedCount = this.session.companionEntity.entity.consolidation?.memories?.size || 0
    const emotionalMaturity = this.session.growthTracker.metrics.emotionalMaturity || 0

    console.log(`\n${CYAN}📈 Final Metrics${RESET}`)
    console.log(`Memory Count: ${finalMemoryCount}`)
    console.log(`Consolidated: ${consolidatedCount}`)
    console.log(`Emotional Maturity: ${(emotionalMaturity * 100).toFixed(1)}%`)
    console.log(`Vocabulary Size: ${this.session.world.lexicon.size}`)

    // Category distribution
    const categories = this.messages.map(m => m.category)
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    console.log(`\n${CYAN}📋 Category Distribution${RESET}`)
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`  ${cat.padEnd(15)}: ${'█'.repeat(count)} (${count})`)
      })

    return {
      passed: this.passed,
      failed: this.failed,
      passRate: (this.passed / (this.passed + this.failed)) * 100
    }
  }
}

// ============================================================================
// Scenario 1: Cold Start Conversation
// ============================================================================

async function runScenario1() {
  const tester = new IntegrationTester('Scenario 1: Cold Start Conversation')
  await tester.setup()

  try {
    // [0:00] Initial greeting
    await tester.sendMessage('สวัสดีครับ', '0:00', {
      categoryOneOf: ['intro', 'happy', 'curious'],
      memoryCount: { operator: '>=', value: 1 },
      salienceMin: 1.0,
      responseNotEmpty: true
    })

    // [0:05] Repeat greeting (test repetition avoidance)
    await tester.sendMessage('สวัสดีครับ', '0:05', {
      categoryNot: 'intro',  // Should use alternative category
      uniqueResponse: { count: 2 }  // Should be different from previous
    })

    // [0:15] Question without context
    await tester.sendMessage('คุณชื่ออะไร?', '0:15', {
      categoryOneOf: ['confused', 'thinking', 'curious']
    })

    // [0:30] Share information (establish topic)
    await tester.sendMessage('ผมชอบเขียนโค้ดครับ', '0:30', {
      categoryOneOf: ['curious', 'inspired', 'happy'],
      memoryCount: { operator: '>=', value: 4 },
      salienceMin: 1.0
    })

    // [0:45] Recall topic (test memory)
    await tester.sendMessage('พูดเรื่องเขียนโค้ดหน่อย', '0:45', {
      categoryOneOf: ['nostalgic', 'curious', 'thinking'],
      memoryRecall: { subject: 'โค้ด' }
    })

    // [1:00] Negative emotion
    await tester.sendMessage("I'm worried about this project", '1:00', {
      categoryOneOf: ['anxious', 'sad']
    })

    // [1:30] Relief
    await tester.sendMessage('Finally done!', '1:30', {
      categoryOneOf: ['relieved', 'happy', 'excited']
    })

    // [2:00] Long-term memory test
    await tester.sendMessage('จำเรื่องโค้ดได้ไหม?', '2:00', {
      categoryOneOf: ['nostalgic', 'thinking'],
      memoryRecall: { subject: 'โค้ด' }
    })

    const report = tester.generateReport()

    // Success criteria (integration tests are harder than unit tests)
    const SUCCESS_THRESHOLD = 0.70  // 70% pass rate for cold start

    if (report.passRate >= SUCCESS_THRESHOLD * 100) {
      console.log(`\n${GREEN}✅ Scenario 1 PASSED (${report.passRate.toFixed(1)}% >= ${SUCCESS_THRESHOLD * 100}%)${RESET}`)
      process.exit(0)
    } else {
      console.log(`\n${RED}❌ Scenario 1 FAILED (${report.passRate.toFixed(1)}% < ${SUCCESS_THRESHOLD * 100}%)${RESET}`)
      process.exit(1)
    }

  } catch (error) {
    console.error(`\n${RED}💥 Test crashed:${RESET}`, error)
    process.exit(1)
  } finally {
    await tester.teardown()
  }
}

// Run scenario
runScenario1()
