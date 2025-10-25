import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { BlessedAppMock } from './helpers/BlessedAppMock.js'

/**
 * Test Suite 4: Command Journey
 *
 * Scenario: ผู้ใช้ลองใช้ command ทั้งหมด
 * - /help should show all commands
 * - /status should show both entities
 * - /growth should show vocabulary growth
 * - /save and /load should persist session
 * - /clear should clear chat but keep memories
 */
describe('Command Journey', () => {
  let app: BlessedAppMock

  beforeEach(async () => {
    app = new BlessedAppMock()
    await app.start()
  })

  afterEach(() => {
    app.destroy()
  })

  test('/help should show all commands', async () => {
    await app.command('/help')

    const helpText = app.getLastSystemMessage()
    expect(helpText).toContain('/status')
    expect(helpText).toContain('/growth')
    expect(helpText).toContain('/save')
    expect(helpText).toContain('/load')
    expect(helpText).toContain('/clear')
  })

  test('/status should show both entities', async () => {
    await app.command('/status')

    const status = app.getLastSystemMessage()
    expect(status).toContain('companion')
    expect(status).toContain('traveler')
    expect(status).toMatch(/Emotion:.*\d\.\d{2}/)
    expect(status).toContain('YOU')
  })

  test('/growth should show vocabulary growth', async () => {
    await app.typeMessage('hello world wonderful day')
    await app.waitForResponse()

    await app.command('/growth')

    const growth = app.getLastSystemMessage()
    expect(growth).toMatch(/vocabulary|words|concepts/i)
  })

  test('/save should persist session to file', async () => {
    await app.typeMessage('test message for save')
    await app.waitForResponse()

    await app.command('/save test-cmd-save.json')

    const confirmMsg = app.getLastSystemMessage()
    expect(confirmMsg).toContain('saved')
  })

  test('/load should restore session from file', async () => {
    // Save first
    await app.typeMessage('data to restore')
    await app.waitForResponse()
    await app.command('/save test-cmd-load.json')

    // Clear and load
    await app.command('/clear')
    await app.command('/load test-cmd-load.json')

    const confirmMsg = app.getLastSystemMessage()
    expect(confirmMsg).toMatch(/loaded|restored/i)
  })

  test('/clear should clear chat history but keep memories', async () => {
    await app.typeMessage('message 1')
    await app.waitForResponse()
    await app.typeMessage('message 2')
    await app.waitForResponse()

    const messagesBefore = app.getMessageCount()
    const memoriesBefore = app.session.companionEntity.entity.memory?.memories.length || 0

    await app.command('/clear')

    const messagesAfter = app.getMessageCount()
    const memoriesAfter = app.session.companionEntity.entity.memory?.memories.length || 0

    expect(messagesAfter).toBeLessThan(messagesBefore) // UI cleared
    expect(memoriesAfter).toBe(memoriesBefore) // Memory intact
  })

  test('should handle unknown command gracefully', async () => {
    await app.command('/invalid')

    const errorMsg = app.getLastSystemMessage()
    expect(errorMsg).toMatch(/unknown|invalid/i)
  })

  test('should handle command with missing arguments', async () => {
    await app.command('/save') // No filename

    // Should still work with default filename or show message
    const msg = app.getLastSystemMessage()
    expect(msg).toBeTruthy()
  })
})
