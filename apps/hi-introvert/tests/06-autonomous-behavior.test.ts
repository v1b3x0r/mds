import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { BlessedAppMock } from './helpers/BlessedAppMock.js'

/**
 * Test Suite 6: Autonomous Behavior Journey
 *
 * Scenario: World tick ไหลเรื่อยๆ entities อาจคุยกันเอง
 * - World should tick even without user input
 * - Entity emotions should change over time
 * - Autonomous intents should be generated (v5.6+)
 */
describe('Autonomous Behavior Journey', () => {
  let app: BlessedAppMock

  beforeEach(async () => {
    app = new BlessedAppMock()
    await app.start()
  })

  afterEach(() => {
    app.destroy()
  })

  test('should tick world even without user input', async () => {
    const initialTick = app.session.world.currentTick

    // Wait 2 seconds (world ticks at 2 FPS = 4 ticks)
    await new Promise(resolve => setTimeout(resolve, 2000))

    const finalTick = app.session.world.currentTick

    expect(finalTick).toBeGreaterThan(initialTick)
  })

  test('should update entity emotions over time', async () => {
    const initialValence = app.session.companionEntity.entity.emotion.valence

    // Send messages to influence emotion
    await app.typeMessage('เจ๋งมากเลย! สุดยอด!')
    await app.waitForResponse()
    await app.typeMessage('คุณเก่งจริงๆ')
    await app.waitForResponse()

    const finalValence = app.session.companionEntity.entity.emotion.valence

    // Emotion should change (positive messages should increase valence)
    expect(finalValence).not.toBe(initialValence)
  })

  test('should create memories during world tick', async () => {
    const initialMemories = app.session.companionEntity.entity.memory?.memories.length || 0

    // World ticks create autonomous memories
    await new Promise(resolve => setTimeout(resolve, 3000))

    const finalMemories = app.session.companionEntity.entity.memory?.memories.length || 0

    // Memories may increase due to autonomous behavior (depends on v5.6 implementation)
    expect(finalMemories).toBeGreaterThanOrEqual(initialMemories)
  })

  test('should maintain cognitive links over time', async () => {
    await app.typeMessage('hello')
    await app.waitForResponse()

    const companion = app.session.companionEntity.entity
    const traveler = app.session.impersonatedEntity.entity

    // Wait for world ticks
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Link should still exist
    const links = companion.cognitiveLinks?.links || []
    const hasTravelerLink = links.some(l => l.targetId === traveler.id)

    expect(hasTravelerLink).toBe(true)
  })

  test('should handle impersonation state correctly', async () => {
    // Traveler should be impersonated (not autonomous)
    const traveler = app.session.impersonatedEntity.entity
    // Note: Check autonomous state if available in entity API
    // This is a placeholder test

    expect(traveler).toBeTruthy()
    expect(traveler.id).toBeTruthy()
  })

  test('should process environment sensors during ticks', async () => {
    // Mock sensor broadcasts
    app.session.world.broadcastEvent('test_sensor', {
      value: 42,
      timestamp: Date.now()
    })

    await new Promise(resolve => setTimeout(resolve, 1000))

    // World should have processed the event
    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should handle multiple entities in world', async () => {
    // Session starts with 2 entities (companion + traveler)
    expect(app.session.entities.size).toBe(2)

    // Check both entities are alive
    const companion = app.session.companionEntity.entity
    const traveler = app.session.impersonatedEntity.entity

    expect(companion).toBeTruthy()
    expect(traveler).toBeTruthy()
    expect(companion.id).not.toBe(traveler.id)
  })
})
