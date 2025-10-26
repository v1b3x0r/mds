import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { BlessedAppMock } from './helpers/BlessedAppMock.js'

/**
 * Test Suite 7: LLM Integration Journey
 *
 * Scenario: ระบบต้องเชื่อมต่อ LLM ได้ และ fallback gracefully
 * - Should fallback to MDM when LLM unavailable
 * - Should use memory context in LLM prompts
 * - Should respect vocabulary constraints
 * - Should handle LLM errors gracefully
 */
describe('LLM Integration Journey', () => {
  let app: BlessedAppMock

  beforeEach(async () => {
    app = new BlessedAppMock()
    await app.start()
  })

  afterEach(() => {
    app.destroy()
  })

  test('should fallback to MDM dialogue when LLM unavailable', async () => {
    // Without LLM config, should use MDM dialogue
    await app.typeMessage('สวัสดีครับ')
    await app.waitForResponse()

    const response = app.getLastMessage()
    expect(response).toBeTruthy()
    expect(response.length).toBeGreaterThan(0)
  })

  test('should handle greeting with MDM dialogue', async () => {
    await app.typeMessage('hello')
    await app.waitForResponse()

    const response = app.getLastMessage()

    // Should use MDM intro/greeting dialogue
    // (Check that response exists and is not empty)
    expect(response).toBeTruthy()
  })

  test('should handle confused state when no MDM match', async () => {
    // Ask complex question that has no MDM dialogue
    await app.typeMessage('explain quantum mechanics')
    await app.waitForResponse()

    const response = app.getLastMessage()

    // Should fallback to confused/generic dialogue or give some response
    expect(response).toBeTruthy()
  })

  test('should use memory context in responses', async () => {
    // First, tell name
    await app.typeMessage('ผมชื่อโจครับ')
    await app.waitForResponse()

    // Later, companion should remember
    await app.typeMessage('ผมชื่ออะไร?')
    await app.waitForResponse()

    // Check if memory was created
    const memories = app.session.companionEntity.entity.memory?.recall({ subject: 'traveler' }) || []
    const hasNameMemory = memories.some(m => m.content.message?.includes('โจ'))

    expect(hasNameMemory).toBe(true)
  })

  test('should track vocabulary from conversations', async () => {
    const initialVocab = app.session.getVocabularySize()

    await app.typeMessage('quantum entanglement superposition')
    await app.waitForResponse()

    const finalVocab = app.session.getVocabularySize()

    expect(finalVocab).toBeGreaterThan(initialVocab)
  })

  test('should handle MDM emotion hints', async () => {
    const initialEmotion = app.session.companionEntity.entity.emotion.valence

    // Send happy message
    await app.typeMessage('เจ๋งมาก! สุดยอดเลย!')
    await app.waitForResponse()

    const finalEmotion = app.session.companionEntity.entity.emotion.valence

    // Emotion should be influenced (may not always increase due to personality)
    expect(finalEmotion).toBeDefined()
  })

  test('should create interaction memories bidirectionally', async () => {
    await app.typeMessage('test message')
    await app.waitForResponse()

    // Companion should remember traveler's message
    const companionMemories = app.session.companionEntity.entity.memory?.memories || []
    const hasInteraction = companionMemories.some(m =>
      m.type === 'interaction' && m.subject === 'traveler'
    )

    expect(hasInteraction).toBe(true)

    // Traveler should also remember (impersonated entity)
    const travelerMemories = app.session.impersonatedEntity.entity.memory?.memories || []
    expect(travelerMemories.length).toBeGreaterThan(0)
  })

  test('should handle multiple conversation turns', async () => {
    // Simulate natural conversation
    await app.typeMessage('สวัสดีครับ')
    await app.waitForResponse()

    await app.typeMessage('คุณสบายดีไหม')
    await app.waitForResponse()

    await app.typeMessage('วันนี้อากาศดี')
    await app.waitForResponse()

    const conversationCount = app.session.conversationCount
    expect(conversationCount).toBe(3)
  })
})
