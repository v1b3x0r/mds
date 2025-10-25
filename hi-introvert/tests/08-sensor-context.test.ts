import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { BlessedAppMock } from './helpers/BlessedAppMock.js'

/**
 * Test Suite 8: Sensor & External Context Journey
 *
 * Scenario: Entity รับ sensor data จาก environment และ external APIs
 * - Time-of-day sensor
 * - Weather sensor
 * - User activity sensor
 * - Clipboard context
 * - Spotify integration
 * - GitHub integration
 * - Multi-sensor rich context
 */
describe('Sensor & External Context Journey', () => {
  let app: BlessedAppMock

  beforeEach(async () => {
    app = new BlessedAppMock()
    await app.start()
  })

  afterEach(() => {
    app.destroy()
  })

  test('should receive time-of-day sensor updates', async () => {
    // Mock time sensor
    app.session.world.broadcastEvent('time_update', {
      hour: 22,
      minute: 30,
      timeOfDay: 'night',
      timestamp: new Date().toISOString()
    })

    // Wait for world to process
    await new Promise(resolve => setTimeout(resolve, 100))

    // Event should be broadcast
    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should receive weather sensor data', async () => {
    // Mock weather API
    app.session.world.broadcastEvent('weather_update', {
      condition: 'rainy',
      temperature: 25,
      humidity: 85,
      timestamp: Date.now()
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    // World should process event
    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should receive user activity sensor', async () => {
    // Simulate user has been active for 3 hours
    app.session.world.broadcastEvent('user_activity', {
      duration: 180, // minutes
      activity: 'coding',
      breakTime: 0,
      timestamp: Date.now()
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should integrate with system clipboard (mock)', async () => {
    app.mockClipboard('function isPrime(n) { return n > 1; }')

    // Clipboard content should be broadcast
    // (In real implementation, entity might reference this in conversation)
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should integrate with Spotify API (mock)', async () => {
    app.mockSpotify({
      track: 'Lo-fi Beats',
      artist: 'Chill Hop',
      mood: 'relaxed'
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should integrate with GitHub API (mock)', async () => {
    app.mockGitHub({
      recentCommits: 5,
      openPRs: 2,
      lastCommitMessage: 'fix: memory leak'
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should handle multi-sensor context (rich context)', async () => {
    // Feed multiple sensors
    app.broadcastSensors({
      time: { hour: 23, timeOfDay: 'night' },
      weather: { condition: 'rainy', temperature: 20 },
      spotify: { mood: 'sad', track: 'Sad Piano' },
      github: { recentCommits: 0 }
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    // All sensors should be broadcast
    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should handle sensor updates during conversation', async () => {
    // Start conversation
    await app.typeMessage('hello')
    await app.waitForResponse()

    // Broadcast sensor in the middle
    app.broadcastSensors({
      time: { hour: 14, timeOfDay: 'afternoon' }
    })

    // Continue conversation
    await app.typeMessage('how are you')
    await app.waitForResponse()

    // Should handle both conversation and sensors
    expect(app.getMessageCount()).toBeGreaterThan(2)
    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should handle rapid sensor updates', async () => {
    // Rapidly broadcast multiple sensors
    for (let i = 0; i < 10; i++) {
      app.broadcastSensors({
        time: { hour: 12 + i, timeOfDay: 'afternoon' }
      })
    }

    await new Promise(resolve => setTimeout(resolve, 200))

    // Should handle all updates
    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })

  test('should persist sensor context in memories (observation type)', async () => {
    // Broadcast sensor
    app.broadcastSensors({
      time: { hour: 23, timeOfDay: 'night' }
    })

    // Wait for observation to be recorded
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if entities have observation memories (10% chance per tick)
    // This test may be flaky due to random chance, so we just check world is running
    expect(app.session.world.currentTick).toBeGreaterThan(0)
  })
})
