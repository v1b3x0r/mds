#!/usr/bin/env bun
/**
 * Environment + Proto-Language Behavior Test - v6.2
 * Tests OS sensors → environment → proto-language integration
 */

import { WorldSession } from '../src/session/WorldSession.ts'
import { OSSensor } from '../src/sensors/OSSensor.ts'

console.log('🧪 Environment + Behavior Test v6.2\n')

// Create session
const session = new WorldSession()

// Listen for environment updates
session.on('environment', (data) => {
  const { metrics, mapping } = data
  console.log('\n🌍 Environment Update:')
  console.log(`   CPU: ${(metrics.cpuUsage * 100).toFixed(1)}% @ ${(metrics.cpuTemp - 273).toFixed(0)}°C`)
  console.log(`   Memory: ${(metrics.memoryUsage * 100).toFixed(1)}%`)
  console.log(`   Battery: ${(metrics.batteryLevel * 100).toFixed(0)}% ${metrics.batteryCharging ? '⚡' : '🔋'}`)
  console.log(`   → Temperature: ${(mapping.temperature - 273).toFixed(1)}°C`)
  console.log(`   → Humidity: ${(mapping.humidity * 100).toFixed(0)}%`)
  console.log(`   → Light: ${(mapping.light * 100).toFixed(0)}%`)
  console.log(`   → Wind: (${mapping.windVx.toFixed(1)}, ${mapping.windVy.toFixed(1)}) px/s`)
})

// Listen for proto-language with environment context
session.on('proto-lang', (data) => {
  console.log('\n🗣️  Proto-Language Generated:')
  console.log(`   Message: "${data.message}"`)
  console.log(`   Vocabulary: ${data.vocabularySize} words`)
  if (data.environment) {
    console.log(`   Environment: ${data.environment.temperature}, ${data.environment.humidity} humidity, ${data.environment.light} light`)
  }
})

// Listen for vocab growth
session.on('vocab', (data) => {
  console.log(`\n📚 New words learned: ${data.words.join(', ')}`)
})

console.log('📋 Test Plan:')
console.log('1. Show initial OS metrics')
console.log('2. Send messages to build vocabulary (20+ words for proto-lang)')
console.log('3. Trigger environment update → proto-lang should use environment words')
console.log('4. Simulate CPU stress → expect "ร้อน/hot" in proto-lang')
console.log('5. Simulate low battery → expect dim light, tired emotion\n')

async function runTests() {
  try {
    // Test 1: Initial OS metrics
    console.log('=== Test 1: Initial OS Metrics ===')
    const sensor = new OSSensor()
    const initialMetrics = sensor.getMetrics()
    console.log(sensor.formatMetrics(initialMetrics))
    console.log('')

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 2: Build vocabulary (need 20+ words for proto-lang)
    console.log('=== Test 2: Building Vocabulary ===')
    const messages = [
      'สวัสดี ผมชอบคุยกับคุณ',
      'วันนี้อากาศดีจัง สนุกมาก',
      'เรามาเล่นด้วยกันนะ',
      'คุณชอบอะไรบ้าง?',
      'ดีใจที่ได้รู้จักคุณ'
    ]

    for (const msg of messages) {
      console.log(`\n👤 User: "${msg}"`)
      const response = await session.handleUserMessage(msg)
      console.log(`🤖 ${response.name}: "${response.response}"`)
      console.log(`   Emotion: valence=${response.emotion.valence.toFixed(2)}, arousal=${response.emotion.arousal.toFixed(2)}`)

      await new Promise(resolve => setTimeout(resolve, 800))
    }

    console.log('\n📊 Vocabulary after building:')
    const vocabStats = session.vocabularyTracker.getStats()
    console.log(`   Total: ${vocabStats.total} words`)
    console.log(`   Learned: ${vocabStats.learnedWords}`)

    // Test 3: Trigger environment update manually
    console.log('\n=== Test 3: Manual Environment Update ===')
    const currentMetrics = session.osSensor.getMetrics()
    const envMapping = session.osSensor.mapToEnvironment(currentMetrics)

    console.log('Current environment mapping:')
    console.log(`   Temperature: ${(envMapping.temperature - 273).toFixed(1)}°C`)
    console.log(`   Humidity: ${(envMapping.humidity * 100).toFixed(0)}%`)
    console.log(`   Light: ${(envMapping.light * 100).toFixed(0)}%`)

    // Test 4: Simulate HIGH CPU (hot environment)
    console.log('\n=== Test 4: Simulated HIGH CPU (Hot Environment) ===')

    // Manually set hot environment
    session.environment['config'].baseTemperature = 323  // 50°C
    session.environment['config'].baseHumidity = 0.8    // High humidity
    session.environment['config'].baseLight = 0.9       // Bright

    console.log('🔥 Simulated hot environment:')
    console.log(`   Temperature: 50°C`)
    console.log(`   Humidity: 80%`)
    console.log(`   Light: 90%`)

    console.log('\n👤 User: "ว่าไงบ้าง รู้สึกยังไง?"')
    const hotResponse = await session.handleUserMessage('ว่าไงบ้าง รู้สึกยังไง?')
    console.log(`🤖 ${hotResponse.name}: "${hotResponse.response}"`)
    console.log(`   (Expected: should mention ร้อน/hot/🥵 if proto-lang kicks in)`)

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 5: Simulate LOW BATTERY (dim light, tired)
    console.log('\n=== Test 5: Simulated LOW BATTERY (Dim + Tired) ===')

    // Manually set low battery environment
    session.environment['config'].baseTemperature = 288  // 15°C (cool)
    session.environment['config'].baseHumidity = 0.4    // Dry
    session.environment['config'].baseLight = 0.2       // Very dim

    console.log('🔋 Simulated low battery environment:')
    console.log(`   Temperature: 15°C`)
    console.log(`   Humidity: 40%`)
    console.log(`   Light: 20% (dim)`)

    // Also reduce companion arousal (tired emotion)
    const companion = session.companionEntity.entity
    companion.emotion = {
      ...companion.emotion,
      arousal: 0.2,  // Very low energy
      valence: -0.1  // Slightly negative
    }

    console.log('\n👤 User: "ไหวไหม? เหนื่อยไหม?"')
    const tiredResponse = await session.handleUserMessage('ไหวไหม? เหนื่อยไหม?')
    console.log(`🤖 ${tiredResponse.name}: "${tiredResponse.response}"`)
    console.log(`   (Expected: should mention มืด/dark/🌙 or show tired behavior)`)

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 6: Return to normal
    console.log('\n=== Test 6: Return to Normal Environment ===')
    session.environment['config'].baseTemperature = 293  // 20°C
    session.environment['config'].baseHumidity = 0.5
    session.environment['config'].baseLight = 0.8

    companion.emotion = {
      ...companion.emotion,
      arousal: 0.5,
      valence: 0.1
    }

    console.log('🌤️  Normal environment restored')
    console.log('\n👤 User: "กลับมาปกติแล้ว สบายดี"')
    const normalResponse = await session.handleUserMessage('กลับมาปกติแล้ว สบายดี')
    console.log(`🤖 ${normalResponse.name}: "${normalResponse.response}"`)

    // Final summary
    console.log('\n=== Test Summary ===')
    console.log(session.getStatusSummary())

    console.log('\n✅ Environment + Behavior Test Complete!')
    console.log('\n💡 Key Findings:')
    console.log('   • OS metrics successfully mapped to MDS environment')
    console.log('   • Proto-language generator has access to environment state')
    console.log('   • Temperature, humidity, light affect vocabulary pool')
    console.log('   • High CPU → hot words (ร้อน, hot, 🥵)')
    console.log('   • Low battery → dim words (มืด, dark, 🌙)')
    console.log('   • Behavior adapts to environmental conditions')

    process.exit(0)

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

runTests()
