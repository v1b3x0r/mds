import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { BlessedAppMock } from './helpers/BlessedAppMock.js'

/**
 * Test Suite 3: Long Conversation Journey
 *
 * Scenario: ผู้ใช้คุยยาวๆ message เยอะมาก
 * - Should handle 100+ messages without crashing
 * - Should auto-scroll to bottom
 * - Should allow manual scrolling
 * - Should decay old memories correctly
 */
describe('Long Conversation Journey', () => {
  let app: BlessedAppMock

  beforeEach(async () => {
    app = new BlessedAppMock()
    await app.start()
  })

  afterEach(() => {
    app.destroy()
  })

  test('should handle 100+ messages without crashing', async () => {
    for (let i = 0; i < 100; i++) {
      await app.typeMessage(`message number ${i}`)
      await app.waitForResponse()
    }

    expect(app.session.vocabularyTracker.toJSON().conversationCount).toBe(100)
    expect(app.session.companionEntity.entity).toBeTruthy()
    expect(app.screen.destroyed).toBe(false)
  })

  test('should auto-scroll to bottom when new message arrives', async () => {
    // Fill screen with messages
    for (let i = 0; i < 50; i++) {
      await app.typeMessage(`msg ${i}`)
      await app.waitForResponse()
    }

    // Check if scrolled to bottom
    expect(app.chatBox.getScrollPerc()).toBe(100)
  })

  test('should allow manual scroll up to view history', async () => {
    // Fill screen
    for (let i = 0; i < 50; i++) {
      await app.typeMessage(`msg ${i}`)
      await app.waitForResponse()
    }

    // Scroll up with arrow key
    app.sendKey('up')
    app.sendKey('up')
    app.sendKey('up')

    expect(app.chatBox.getScrollPerc()).toBeLessThan(100)
  })

  test('should decay old memories correctly', async () => {
    await app.typeMessage('important message')
    await app.waitForResponse()

    // Simulate time passing (30 days)
    const companion = app.session.companionEntity.entity
    const oldMemory = companion.memory!.memories[companion.memory!.memories.length - 1]
    oldMemory.timestamp = Date.now() - (30 * 24 * 60 * 60 * 1000)

    // Recall should apply decay
    const recalled = companion.memory!.recall({ type: 'interaction' })
    const decayed = recalled.find(m => m.timestamp === oldMemory.timestamp)

    // Decayed memory should have lower strength than original salience
    expect(decayed!.strength).toBeLessThan(oldMemory.salience)
  })

  test('should handle rapid-fire messages (stress test)', async () => {
    // Send 20 messages quickly
    const promises = []
    for (let i = 0; i < 20; i++) {
      promises.push(app.typeMessage(`rapid ${i}`))
    }

    await Promise.all(promises)

    // All messages should be processed
    expect(app.session.vocabularyTracker.toJSON().conversationCount).toBeGreaterThanOrEqual(20)
  })

  test('should maintain performance with large memory count', async () => {
    // Create many memories
    for (let i = 0; i < 50; i++) {
      await app.typeMessage(`memory ${i}`)
      await app.waitForResponse()
    }

    const memories = app.session.companionEntity.entity.memory?.memories || []
    expect(memories.length).toBeGreaterThan(50)

    // Should still respond quickly
    const startTime = Date.now()
    await app.typeMessage('test')
    await app.waitForResponse()
    const endTime = Date.now()

    expect(endTime - startTime).toBeLessThan(1000) // Should respond within 1s (mock)
  })
})
