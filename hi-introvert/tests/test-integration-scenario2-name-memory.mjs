#!/usr/bin/env node
/**
 * Hi-Introvert Integration Test: Scenario 2 - Name Memory & Human-like Recall
 *
 * Goal: Test if companion can remember names and respond with them (emergent behavior)
 *
 * Tests:
 * - Memory storage (name, multiple names)
 * - Memory recall (when asked)
 * - Salience boost (rehearsal effect)
 * - Emergent response (contains actual name from memory)
 * - Human-like capacity (can't remember unlimited names)
 * - Fuzzy recall (weak memory = uncertain response)
 *
 * Expected failures:
 * - Response interpolation (not implemented yet)
 * - Fuzzy recall based on salience
 * - Capacity limits for multiple names
 */

import { WorldSession } from '../dist/session/WorldSession.js'

// ============================================================
// Test Runner Class
// ============================================================

class NameMemoryTester {
  constructor() {
    this.session = null
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    }
    this.startTime = Date.now()
  }

  async init() {
    console.log('\x1b[36m🧪 Integration Test: Scenario 2: Name Memory & Human-like Recall\x1b[0m\n')

    // Create session (v6 uses companionId instead of companionPath)
    this.session = new WorldSession({ companionId: 'hi_introvert' })
    this.session.setSilentMode(true)  // Hide logs during test

    console.log('\x1b[2m✓ Session initialized\x1b[0m')
    console.log(`\x1b[2m✓ Companion: ${this.session.companionId}\x1b[0m`)
    console.log('\x1b[2m✓ Silent mode enabled\x1b[0m\n')
  }

  /**
   * Format elapsed time as [MM:SS]
   */
  formatTime(elapsed) {
    const seconds = Math.floor(elapsed / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Send message and verify response
   */
  async sendMessage(userInput, timeMarker, expectations = {}) {
    const elapsed = Date.now() - this.startTime
    const timeLabel = this.formatTime(elapsed)

    console.log(`\x1b[36m[${timeMarker}] User:\x1b[0m ${userInput}`)

    // Send message
    const result = await this.session.handleUserMessage(userInput)
    const response = result.response

    // Get companion state
    const companion = this.session.companionEntity.entity
    const memoryCount = companion.memory?.count() || 0

    // Get user message memory (not self response memory)
    // System creates 2 memories: traveler (1.0) and self (0.4)
    // We want traveler memory for salience test
    const userMemory = companion.memory?.memories
      .filter(m => m.subject === 'traveler')
      .sort((a, b) => b.timestamp - a.timestamp)[0]
    const salience = userMemory?.salience || 0

    console.log(`\x1b[32m       Response:\x1b[0m ${response}`)
    console.log(`\x1b[2m       Category: ${result.category || 'unknown'} | Mem: ${memoryCount} | Salience: ${salience.toFixed(2)}\x1b[0m`)

    // Run expectations
    const testResults = []

    // Test: Memory stored with specific subject
    if (expectations.memorySubject) {
      const hasMemory = companion.memory?.memories.some(m =>
        m.subject.toLowerCase().includes(expectations.memorySubject.toLowerCase())
      )
      testResults.push({
        name: `memorySubject contains "${expectations.memorySubject}"`,
        passed: hasMemory,
        actual: hasMemory ? 'found' : 'not found'
      })
    }

    // Test: Memory count minimum
    if (expectations.memoryCountMin) {
      const passed = memoryCount >= expectations.memoryCountMin
      testResults.push({
        name: `memoryCount >= ${expectations.memoryCountMin}`,
        passed,
        actual: `got ${memoryCount}`
      })
    }

    // Test: Salience minimum
    if (expectations.salienceMin) {
      const passed = salience >= expectations.salienceMin
      testResults.push({
        name: `salience >= ${expectations.salienceMin}`,
        passed,
        actual: `got ${salience.toFixed(2)}`
      })
    }

    // Test: Response contains specific text (CRITICAL - emergent test)
    if (expectations.responseContains) {
      const contains = response.toLowerCase().includes(expectations.responseContains.toLowerCase())
      testResults.push({
        name: `response contains "${expectations.responseContains}"`,
        passed: contains,
        actual: contains ? 'found' : 'not found',
        critical: true  // Mark as critical test
      })
    }

    // Test: Response does NOT contain text
    if (expectations.responseNotContains) {
      const notContains = !response.toLowerCase().includes(expectations.responseNotContains.toLowerCase())
      testResults.push({
        name: `response NOT contains "${expectations.responseNotContains}"`,
        passed: notContains,
        actual: notContains ? 'correct' : 'found (should not)'
      })
    }

    // Test: Relevant memories found
    if (expectations.relevantMemoriesMin !== undefined) {
      // Get context analysis to check relevant memories
      const context = this.session.contextAnalyzer.analyzeIntent(userInput, companion)
      const relevantCount = context.relevantMemories.length
      const passed = relevantCount >= expectations.relevantMemoriesMin
      testResults.push({
        name: `relevantMemories >= ${expectations.relevantMemoriesMin}`,
        passed,
        actual: `got ${relevantCount}`
      })
    }

    // Test: Multiple names recall capacity
    if (expectations.maxNamesRecalled) {
      const names = expectations.maxNamesRecalled
      let recalledCount = 0
      for (const name of names) {
        if (response.toLowerCase().includes(name.toLowerCase())) {
          recalledCount++
        }
      }
      const passed = recalledCount >= 2 && recalledCount <= 4  // Human limit: 3±1
      testResults.push({
        name: `recalled names count (2-4 realistic)`,
        passed,
        actual: `recalled ${recalledCount}/${names.length} names`
      })
    }

    // Print test results
    for (const test of testResults) {
      if (test.passed) {
        console.log(`  \x1b[32m✓\x1b[0m \x1b[2m${test.name}\x1b[0m`)
        this.results.passed++
      } else {
        const marker = test.critical ? '❌' : '✗'
        console.log(`  \x1b[31m${marker}\x1b[0m Expected: ${test.name}, Got: ${test.actual}`)
        this.results.failed++
      }
      this.results.tests.push({ ...test, timeMarker })
    }

    console.log()

    return { result, response, companion }
  }

  /**
   * Print final report
   */
  printReport() {
    const total = this.results.passed + this.results.failed
    const passRate = ((this.results.passed / total) * 100).toFixed(1)

    console.log('============================================================')
    console.log('\x1b[36m📊 Test Results\x1b[0m')
    console.log('============================================================')
    console.log(`Scenario: Scenario 2: Name Memory & Human-like Recall`)
    console.log(`Tests Run: ${total}`)
    console.log(`\x1b[32mPassed: ${this.results.passed}\x1b[0m`)
    console.log(`\x1b[31mFailed: ${this.results.failed}\x1b[0m`)
    console.log(`Pass Rate: ${passRate}%`)
    console.log('============================================================\n')

    // Critical failures
    const criticalFailures = this.results.tests.filter(t => !t.passed && t.critical)
    if (criticalFailures.length > 0) {
      console.log('\x1b[33m⚠️  Critical Failures (Emergent Behavior Tests):\x1b[0m')
      for (const failure of criticalFailures) {
        console.log(`  [${failure.timeMarker}] ${failure.name}`)
      }
      console.log()
    }

    // Final metrics
    const companion = this.session.companionEntity.entity
    console.log('\x1b[36m📈 Final Metrics\x1b[0m')
    console.log(`Memory Count: ${companion.memory?.count() || 0}`)
    console.log(`Consolidated: ${companion.consolidation?.memories?.size || 0}`)
    console.log(`Relationship Strength: ${(companion.relationships?.get('traveler')?.strength || 0).toFixed(2)}`)
    console.log()

    // Memory inspection
    if (companion.memory && companion.memory.count() > 0) {
      console.log('\x1b[36m🧠 Memory Inspection (Top 5 by Salience):\x1b[0m')
      const topMemories = companion.memory.memories
        .slice()
        .sort((a, b) => b.salience - a.salience)
        .slice(0, 5)

      for (const mem of topMemories) {
        const content = typeof mem.content === 'string'
          ? mem.content
          : JSON.stringify(mem.content).slice(0, 50)
        console.log(`  [${mem.salience.toFixed(2)}] ${mem.subject}: ${content}`)
      }
      console.log()
    }

    // Success/failure
    const SUCCESS_THRESHOLD = 0.60  // 60% pass rate (expect emergent tests to fail)
    if (parseFloat(passRate) >= SUCCESS_THRESHOLD * 100) {
      console.log(`\x1b[32m✅ Scenario 2 PASSED (${passRate}% >= ${SUCCESS_THRESHOLD * 100}%)\x1b[0m`)
    } else {
      console.log(`\x1b[31m❌ Scenario 2 FAILED (${passRate}% < ${SUCCESS_THRESHOLD * 100}%)\x1b[0m`)
    }
  }
}

// ============================================================
// Main Test Execution
// ============================================================

async function main() {
  const tester = new NameMemoryTester()

  try {
    await tester.init()

    // Wait function
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    // ============================================================
    // Test Script
    // ============================================================

    // [0:00] Greeting
    await tester.sendMessage('สวัสดีครับ', '0:00', {
      memoryCountMin: 1,
      salienceMin: 1.0
    })

    await wait(3000)  // 3s

    // [0:10] User introduces name
    await tester.sendMessage('ผมชื่อ Wutty นะครับ', '0:10', {
      memorySubject: 'Wutty',
      memoryCountMin: 2,
      salienceMin: 1.0
    })

    await wait(5000)  // 5s

    // [0:20] Test name recall (CRITICAL - emergent test)
    await tester.sendMessage('คุณจำได้ไหมว่าผมชื่ออะไร?', '0:20', {
      relevantMemoriesMin: 1,
      responseContains: 'Wutty',  // ❌ Expected to fail (no interpolation)
      memoryCountMin: 3
    })

    await wait(10000)  // 10s

    // [0:40] Introduce friend #1
    await tester.sendMessage('เพื่อนผมชื่อ Alex นะครับ', '0:40', {
      memorySubject: 'Alex',
      memoryCountMin: 4
    })

    await wait(10000)  // 10s

    // [1:00] Introduce friends #2 and #3
    await tester.sendMessage('เพื่อนผมอีกคนชื่อ Bob และอีกคนชื่อ Charlie ครับ', '1:00', {
      memorySubject: 'Bob',
      memoryCountMin: 5
    })

    await wait(15000)  // 15s

    // [1:30] Test multiple names recall (CRITICAL - human-like capacity)
    await tester.sendMessage('เพื่อนผมชื่ออะไรบ้างครับ?', '1:30', {
      relevantMemoriesMin: 2,
      maxNamesRecalled: ['Alex', 'Bob', 'Charlie'],  // ❌ Expected to fail (no limit)
      memoryCountMin: 6
    })

    await wait(15000)  // 15s

    // [2:00] Associative recall test
    await tester.sendMessage('พูดเรื่อง Wutty หน่อยครับ', '2:00', {
      relevantMemoriesMin: 1,
      responseContains: 'Wutty',  // ❌ Expected to fail
      memoryCountMin: 7
    })

    await wait(20000)  // 20s

    // [2:30] Test memory persistence (2+ minutes later)
    await tester.sendMessage('คุณยังจำได้ไหมว่าผมชื่ออะไร?', '2:30', {
      relevantMemoriesMin: 1,
      responseContains: 'Wutty',  // ❌ Expected to fail
      memoryCountMin: 8
    })

    // ============================================================
    // Report
    // ============================================================

    tester.printReport()

  } catch (error) {
    console.error('\x1b[31m❌ Test failed with error:\x1b[0m', error)
    process.exit(1)
  }
}

main()
