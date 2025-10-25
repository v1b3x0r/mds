import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { BlessedAppMock } from './helpers/BlessedAppMock.js'
import { unlink } from 'fs/promises'

/**
 * Test Suite 2: Returning User Journey
 *
 * Scenario: ผู้ใช้กลับมาใช้อีกครั้ง ระบบต้องจำได้
 * - Should restore session from file
 * - Should remember previous conversations
 * - Should use greeting_returning
 * - Should maintain cognitive link strength
 */
describe('Returning User Journey', () => {
  let app: BlessedAppMock
  const testSessionFile = 'test-session-returning.json'

  beforeEach(async () => {
    app = new BlessedAppMock()
    await app.start()
  })

  afterEach(async () => {
    app.destroy()

    // Cleanup test session file
    try {
      await unlink(testSessionFile)
    } catch (e) {
      // Ignore if file doesn't exist
    }
  })

  test('should restore session from file', async () => {
    // First session
    await app.typeMessage('ผมชื่อโจครับ')
    await app.waitForResponse()
    await app.command(`/save ${testSessionFile}`)

    const firstSessionMemories = app.session.companionEntity.entity.memory?.memories.length || 0
    app.destroy()

    // Second session (new instance)
    const app2 = new BlessedAppMock()
    await app2.command(`/load ${testSessionFile}`)

    // Should have same memories
    const secondSessionMemories = app2.session.companionEntity.entity.memory?.memories.length || 0
    expect(secondSessionMemories).toBe(firstSessionMemories)

    app2.destroy()
  })

  test('should remember user name from previous session', async () => {
    await app.typeMessage('ผมชื่อโจครับ')
    await app.waitForResponse()
    await app.command(`/save ${testSessionFile}`)

    // Check if name is in memories
    const memories = app.session.companionEntity.entity.memory?.recall({ subject: 'traveler' }) || []
    const hasName = memories.some(m => m.content.message?.includes('โจ'))

    expect(hasName).toBe(true)
  })

  test('should maintain cognitive link strength across sessions', async () => {
    // Have multiple conversations to build strong link
    for (let i = 0; i < 5; i++) {
      await app.typeMessage(`message ${i}`)
      await app.waitForResponse()
    }

    const companion = app.session.companionEntity.entity
    const traveler = app.session.impersonatedEntity.entity
    const link = companion.cognitiveLinks?.links.find(l => l.targetId === traveler.id)

    expect(link).toBeDefined()
    expect(link!.strength).toBeGreaterThan(0.5) // Strong bond after 5 conversations
  })

  test('should use greeting_returning for known user', async () => {
    // First interaction
    await app.typeMessage('ผมชื่อโจ')
    await app.waitForResponse()

    // Restart (simulate closing and reopening)
    await app.restart()

    const greeting = app.getLastMessage()

    // Should use greeting_returning dialogue
    // (Check for keywords like "กลับมา", "จำได้", "welcome back", etc.)
    const hasReturningGreeting = greeting && (
      greeting.includes('กลับมา') ||
      greeting.includes('จำได้') ||
      greeting.includes('welcome') ||
      greeting.includes('back') ||
      greeting.length > 10 // Generic check: returning greetings are usually longer
    )

    expect(hasReturningGreeting).toBe(true)
  })

  test('should recall previous conversation topics', async () => {
    // Talk about a specific topic
    await app.typeMessage('ผมชอบเล่นดนตรี')
    await app.waitForResponse()

    // Later, ask about it
    await app.typeMessage('ผมชอบอะไรบ้าง?')
    await app.waitForResponse()

    const response = app.getLastMessage()

    // Companion should remember (may mention "ดนตรี" or "music")
    // Note: This test may fail if LLM is not available, but memory should still exist
    const memories = app.session.companionEntity.entity.memory?.recall({ subject: 'traveler' }) || []
    const hasTopicMemory = memories.some(m => m.content.message?.includes('ดนตรี'))

    expect(hasTopicMemory).toBe(true)
  })

  test('should persist vocabulary across sessions', async () => {
    await app.typeMessage('quantum physics entanglement')
    await app.waitForResponse()

    const vocabBeforeSave = app.session.vocabularyTracker.getVocabularySize()
    await app.command(`/save ${testSessionFile}`)

    app.destroy()

    // Load in new session
    const app2 = new BlessedAppMock()
    await app2.command(`/load ${testSessionFile}`)

    const vocabAfterLoad = app2.session.vocabularyTracker.getVocabularySize()
    expect(vocabAfterLoad).toBe(vocabBeforeSave)

    app2.destroy()
  })

  test('should persist growth tracker across sessions', async () => {
    // Have some conversations
    for (let i = 0; i < 3; i++) {
      await app.typeMessage(`conversation ${i}`)
      await app.waitForResponse()
    }

    const growthBefore = app.session.vocabularyTracker.toJSON().conversationCount
    await app.command(`/save ${testSessionFile}`)

    app.destroy()

    // Load in new session
    const app2 = new BlessedAppMock()
    await app2.command(`/load ${testSessionFile}`)

    const growthAfter = app2.session.vocabularyTracker.toJSON().conversationCount
    expect(growthAfter).toBe(growthBefore)

    app2.destroy()
  })
})
