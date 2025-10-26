import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { BlessedAppMock } from './helpers/BlessedAppMock.js'

/**
 * Test Suite 5: Edge Case Journey
 *
 * Scenario: ผู้ใช้ทำเรื่องแปลกๆ ที่อาจทำให้พัง
 * - Empty input
 * - Extremely long messages
 * - Rapid-fire spam
 * - Emoji and special characters
 * - Invalid commands
 * - Terminal resize
 */
describe('Edge Case Journey', () => {
  let app: BlessedAppMock

  beforeEach(async () => {
    app = new BlessedAppMock()
    await app.start()
  })

  afterEach(() => {
    app.destroy()
  })

  test('should handle empty input gracefully', async () => {
    const messagesBefore = app.getMessageCount()

    await app.typeMessage('')
    await app.typeMessage('   ')
    await app.typeMessage('\n')

    // Should not create messages for empty input
    const messagesAfter = app.getMessageCount()
    expect(messagesAfter).toBe(messagesBefore)
  })

  test('should handle extremely long message (1000+ chars)', async () => {
    const longMessage = 'a'.repeat(1000)

    await app.typeMessage(longMessage)
    await app.waitForResponse()

    const response = app.getLastMessage()
    expect(response).toBeTruthy()
    expect(app.screen.destroyed).toBe(false)
  })

  test('should handle rapid-fire messages (spam)', async () => {
    // Send 10 messages in rapid succession
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(app.typeMessage(`spam ${i}`))
    }

    await Promise.all(promises)

    // All messages should be processed
    expect(app.session.conversationCount).toBe(10)
  })

  test('should handle emoji and special characters', async () => {
    await app.typeMessage('🌱 😊 💬 ✨')
    await app.waitForResponse()

    await app.typeMessage('$%^&*()_+=-[]{}|;:\'",.<>?/')
    await app.waitForResponse()

    const response = app.getLastMessage()
    expect(response).toBeTruthy()
  })

  test('should handle mixed scripts (Thai + English + Chinese + Emoji)', async () => {
    await app.typeMessage('สวัสดี hello 你好 🌸')
    await app.waitForResponse()

    const response = app.getLastMessage()
    expect(response).toBeTruthy()
  })

  test('should handle invalid commands gracefully', async () => {
    await app.command('/invalid')
    await app.command('/nonexistent')
    await app.command('/!@#$%')

    // Should show error messages, not crash
    expect(app.screen.destroyed).toBe(false)
    const errorMsg = app.getLastSystemMessage()
    expect(errorMsg).toMatch(/unknown|invalid/i)
  })

  test('should handle loading nonexistent file', async () => {
    await app.command('/load nonexistent-file.json')

    const errorMsg = app.getLastSystemMessage()
    expect(errorMsg).toMatch(/failed|error|not found/i)
  })

  test('should handle terminal resize', async () => {
    // Simulate terminal resize
    app.screen.emit('resize')

    expect(app.screen.width).toBeGreaterThan(0)
    expect(app.screen.height).toBeGreaterThan(0)
    expect(app.screen.destroyed).toBe(false)
  })

  test('should handle null/undefined gracefully', async () => {
    // This shouldn't happen in normal use, but test defensive programming
    try {
      await app.typeMessage(null as any)
      await app.typeMessage(undefined as any)
    } catch (e) {
      // Expected - should throw or handle gracefully
    }

    expect(app.screen.destroyed).toBe(false)
  })

  test('should handle message with only whitespace', async () => {
    await app.typeMessage('     ')
    await app.typeMessage('\t\t\t')

    // Should not crash
    expect(app.screen.destroyed).toBe(false)
  })

  test('should handle consecutive special commands', async () => {
    await app.command('/help')
    await app.command('/status')
    await app.command('/growth')
    await app.command('/clear')
    await app.command('/help')

    // Should handle all commands without issues
    expect(app.screen.destroyed).toBe(false)
  })

  test('should handle very rapid scrolling', async () => {
    // Fill chat with messages
    for (let i = 0; i < 50; i++) {
      await app.typeMessage(`msg ${i}`)
    }

    // Rapid scroll
    for (let i = 0; i < 20; i++) {
      app.sendKey('up')
    }
    for (let i = 0; i < 20; i++) {
      app.sendKey('down')
    }

    expect(app.screen.destroyed).toBe(false)
  })
})
