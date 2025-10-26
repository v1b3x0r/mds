import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { BlessedAppMock } from './helpers/BlessedAppMock.js'

/**
 * Test Suite 1: First-Time User Journey
 *
 * Scenario: ผู้ใช้เปิดโปรแกรมครั้งแรก ยังไม่รู้อะไรเลย
 * - Should greet with intro dialogue
 * - Should handle Thai/English/mixed input
 * - Should learn new vocabulary
 * - Should form initial memories
 */
describe('First-Time User Journey', () => {
  let app: BlessedAppMock

  beforeEach(async () => {
    app = new BlessedAppMock()
    await app.start()
  })

  afterEach(() => {
    app.destroy()
  })

  test('should greet new user with intro dialogue', async () => {
    const greeting = app.getLastMessage()

    // Companion should use intro dialogue (Thai or English)
    expect(greeting).toBeTruthy()
    expect(greeting.length).toBeGreaterThan(0)

    // Should have spawn memory only (no previous interactions)
    const memories = app.session.companionEntity.entity.memory?.memories || []
    expect(memories.length).toBeGreaterThanOrEqual(1)
    expect(memories[0].type).toBe('spawn')
  })

  test('should handle Thai input correctly', async () => {
    await app.typeMessage('สวัสดีครับ')

    const response = app.getLastMessage()
    expect(response).toBeTruthy()
    expect(response.length).toBeGreaterThan(0)

    // Should learn Thai words
    const vocabSize = app.session.getVocabularySize()
    expect(vocabSize).toBeGreaterThan(0)
  })

  test('should handle English input correctly', async () => {
    await app.typeMessage('hello')

    const response = app.getLastMessage()
    expect(response).toBeTruthy()
    expect(response.length).toBeGreaterThan(0)
  })

  test('should handle mixed Thai-English input', async () => {
    await app.typeMessage('สวัสดี hello ครับ')

    const response = app.getLastMessage()
    expect(response).toBeTruthy()

    // Should learn both Thai and English words
    const hasThai = app.session.canUse('สวัสดี')
    const hasEnglish = app.session.canUse('hello')

    expect(hasThai || hasEnglish).toBe(true) // At least one should be learned
  })

  test('should learn new vocabulary from user messages', async () => {
    const initialVocab = app.session.getVocabularySize()

    await app.typeMessage('ผมชอบเล่นดนตรีและอ่านหนังสือ')
    await app.waitForResponse()

    const finalVocab = app.session.getVocabularySize()
    expect(finalVocab).toBeGreaterThan(initialVocab)
  })

  test('should create interaction memories', async () => {
    const initialMemories = app.session.companionEntity.entity.memory?.memories.length || 0

    await app.typeMessage('สวัสดีครับ')
    await app.waitForResponse()

    const finalMemories = app.session.companionEntity.entity.memory?.memories.length || 0
    expect(finalMemories).toBeGreaterThan(initialMemories)

    // Should have interaction memory
    const memories = app.session.companionEntity.entity.memory?.memories || []
    const hasInteraction = memories.some(m => m.type === 'interaction')
    expect(hasInteraction).toBe(true)
  })

  test('should form cognitive link between traveler and companion', async () => {
    await app.typeMessage('hello')
    await app.waitForResponse()

    const companion = app.session.companionEntity.entity
    const traveler = app.session.impersonatedEntity.entity

    // Check if cognitive link exists
    const links = companion.cognitiveLinks?.links || []
    const hasTravelerLink = links.some(l => l.targetId === traveler.id)

    expect(hasTravelerLink).toBe(true)
  })

  test('should update entity emotions based on user message', async () => {
    const initialEmotion = app.session.companionEntity.entity.emotion.valence

    // Send positive message
    await app.typeMessage('คุณเจ๋งมาก! สุดยอดเลย!')
    await app.waitForResponse()

    const finalEmotion = app.session.companionEntity.entity.emotion.valence

    // Emotion should change (may increase or decrease depending on entity personality)
    expect(finalEmotion).not.toBe(initialEmotion)
  })

  test('should handle very first conversation gracefully', async () => {
    // First message ever
    await app.typeMessage('hi')
    await app.waitForResponse()

    // Second message
    await app.typeMessage('how are you')
    await app.waitForResponse()

    // Should have at least 4 messages (greeting + 2 user + 2 entity)
    expect(app.getMessageCount()).toBeGreaterThanOrEqual(4)
  })

  test('should not crash on unicode characters', async () => {
    await app.typeMessage('สวัสดีครับ 🌱 😊 💬')

    const response = app.getLastMessage()
    expect(response).toBeTruthy()
    expect(app.session.companionEntity.entity).toBeTruthy()
  })
})
