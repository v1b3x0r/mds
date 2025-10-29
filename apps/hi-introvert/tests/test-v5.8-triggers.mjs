#!/usr/bin/env node

/**
 * Test v5.8.0 Generic Triggers
 * Tests World.broadcastContext() and generic trigger patterns
 */

import { World } from '@v1b3x0r/mds-core'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 MDS v5.8.0 — Generic Triggers Test')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Create world with all features (headless mode for Node.js)
const world = new World({
  renderer: 'headless',
  features: {
    memory: true,
    learning: true,
    relationships: true,
    communication: true,
    semanticClustering: false // use local methods
  }
})

// Create entity with generic triggers
const companion = world.spawn({
  essence: 'Digital companion',
  emotion: {
    valence: 0,
    arousal: 0,
    dominance: 0,
    transitions: [
      { trigger: 'cpu.usage>0.8', to: 'stress' },
      { trigger: 'user.silence>60s', to: 'lonely' },
      { trigger: 'battery.level<0.15', to: 'panic' },
      { trigger: 'user.praise', to: 'happy' }
    ]
  },
  emotionalStates: {
    stress: { valence: -0.6, arousal: 0.8, dominance: -0.3 },
    lonely: { valence: -0.5, arousal: -0.4, dominance: -0.2 },
    panic: { valence: -0.8, arousal: 0.9, dominance: -0.5 },
    happy: { valence: 0.7, arousal: 0.5, dominance: 0.3 }
  }
}, 100, 100)

companion.enable('memory', 'learning', 'relationships')

console.log('✓ Entity created with 4 triggers\n')

// Test 1: CPU stress trigger
console.log('Test 1: cpu.usage>0.8')
world.broadcastContext({
  'cpu.usage': 0.85,
  'user.message': 'Testing',
  'user.silence': 10
})

console.log(`  Emotion: v=${companion.emotion.valence.toFixed(2)}, a=${companion.emotion.arousal.toFixed(2)}`)
console.log(`  Expected: stress (v=-0.6, a=0.8)`)
const test1 = companion.emotion.valence < -0.5 && companion.emotion.arousal > 0.7
console.log(`  Result: ${test1 ? '✓ PASS' : '✗ FAIL'}\n`)

// Test 2: User silence trigger
console.log('Test 2: user.silence>60s')
world.broadcastContext({
  'cpu.usage': 0.3,
  'user.silence': 65
})

console.log(`  Emotion: v=${companion.emotion.valence.toFixed(2)}, a=${companion.emotion.arousal.toFixed(2)}`)
console.log(`  Expected: lonely (v=-0.5, a=-0.4)`)
const test2 = companion.emotion.valence < -0.4 && companion.emotion.arousal < 0
console.log(`  Result: ${test2 ? '✓ PASS' : '✗ FAIL'}\n`)

// Test 3: Battery low trigger
console.log('Test 3: battery.level<0.15')
world.broadcastContext({
  'battery.level': 0.10,
  'battery.charging': 0
})

console.log(`  Emotion: v=${companion.emotion.valence.toFixed(2)}, a=${companion.emotion.arousal.toFixed(2)}`)
console.log(`  Expected: panic (v=-0.8, a=0.9)`)
const test3 = companion.emotion.valence < -0.7 && companion.emotion.arousal > 0.8
console.log(`  Result: ${test3 ? '✓ PASS' : '✗ FAIL'}\n`)

// Test 4: User praise (keyword-based trigger)
console.log('Test 4: user.praise (keyword-based)')
world.broadcastContext({
  'user.message': 'You are amazing!',
  'battery.level': 0.5
})

console.log(`  Emotion: v=${companion.emotion.valence.toFixed(2)}, a=${companion.emotion.arousal.toFixed(2)}`)
console.log(`  Expected: happy (v=0.7, a=0.5)`)
const test4 = companion.emotion.valence > 0.6 && companion.emotion.arousal > 0.4
console.log(`  Result: ${test4 ? '✓ PASS' : '✗ FAIL'}\n`)

// Summary
const allPass = test1 && test2 && test3 && test4
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`Results: ${[test1, test2, test3, test4].filter(Boolean).length}/4 passed`)
console.log(allPass ? '✅ All tests passed!' : '❌ Some tests failed')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

process.exit(allPass ? 0 : 1)
