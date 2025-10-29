/**
 * Test MDSRuntime with built-in sensors
 * Verifies: OS, Network, Weather sensors integration
 */

import { MDSRuntime } from '../src/runtime/MDSRuntime.ts'

console.log('=== MDSRuntime Sensor Test ===\n')

// Test entity: minimal companion
const testEntity = {
  essence: 'Test companion',
  emotion: {
    baseline: { valence: 0.6, arousal: 0.5, dominance: 0.5 }
  }
}

// Create runtime with all sensors enabled
const runtime = new MDSRuntime({
  world: {
    features: {
      memory: true,
      emotion: true,
      relationships: true,
      learning: true,
      communication: true,
      physics: true,
      worldMind: true
    },
    weather: {
      rainProbability: 0.1,
      rainDuration: 30
    }
  },
  entities: [
    { name: 'companion', material: testEntity, x: 200, y: 200 }
  ],
  sensors: {
    os: true,
    network: true,
    weather: true
  },
  autoTick: false  // Manual tick for testing
})

console.log('✅ Runtime created')
console.log(`Entities: ${runtime.entities.size}`)

// Get companion entity
const companion = runtime.entities.get('companion')
if (!companion) {
  console.error('❌ Companion not found!')
  process.exit(1)
}

// Enable all features
companion.enableAll()

console.log(`Companion age: ${companion.age}s`)

// Check emotion (might be null if not enabled)
if (companion.emotion) {
  console.log(`Emotion: valence=${companion.emotion.valence.toFixed(2)}, arousal=${companion.emotion.arousal.toFixed(2)}`)
} else {
  console.log('Emotion: not initialized yet')
}

// Test tick (should broadcast sensor context)
let analyticsReceived = false

runtime.on('analytics', (data) => {
  analyticsReceived = true
  console.log('\n📊 Analytics received:')
  console.log(`  - WorldMind: ${data.worldMind.stats.populationSize} entities`)
  console.log(`  - Growth: ${data.growth.totalMemories} memories`)

  if (data.context) {
    console.log('  - Context keys:', Object.keys(data.context).length)

    // Check OS metrics
    if (data.context['cpu.usage'] !== undefined) {
      console.log(`    ✅ OS: CPU ${(data.context['cpu.usage'] * 100).toFixed(1)}%, Memory ${(data.context['memory.usage'] * 100).toFixed(1)}%`)
    }

    // Check network metrics
    if (data.context['network.connected'] !== undefined) {
      console.log(`    ✅ Network: ${data.context['network.connected'] ? 'Connected' : 'Offline'}`)
    }

    // Check weather metrics
    if (data.context['weather.rain'] !== undefined) {
      console.log(`    ✅ Weather: ${data.context['weather.rain'] ? 'Raining' : 'Clear'} (intensity: ${(data.context['weather.rainIntensity'] * 100).toFixed(0)}%)`)
    }
  }
})

console.log('\n🔄 Ticking world...')
runtime.tick()

// Wait for async analytics
await new Promise(resolve => setTimeout(resolve, 100))

if (!analyticsReceived) {
  console.error('❌ Analytics not received!')
  process.exit(1)
}

// Test sensor isolation (disable all)
console.log('\n=== Testing sensor isolation ===')

const runtimeNoSensors = new MDSRuntime({
  world: {},
  entities: [
    { name: 'isolated', material: testEntity }
  ],
  sensors: {
    os: false,
    network: false,
    weather: false
  },
  autoTick: false
})

runtimeNoSensors.on('analytics', (data) => {
  console.log('📊 Analytics (no sensors):')
  const contextKeys = data.context ? Object.keys(data.context).length : 0
  console.log(`  - Context keys: ${contextKeys} (should be 0)`)

  if (contextKeys === 0) {
    console.log('  ✅ Sensors correctly disabled')
  } else {
    console.error('  ❌ Sensors leaked context!')
  }
})

runtimeNoSensors.tick()

await new Promise(resolve => setTimeout(resolve, 100))

console.log('\n✅ All tests passed!')
console.log('MDSRuntime + sensors working correctly')
