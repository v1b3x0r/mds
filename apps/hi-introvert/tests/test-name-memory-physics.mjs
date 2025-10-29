#!/usr/bin/env node
/**
 * Name Memory Test - Physics-Based
 *
 * Core requirement: Entity MUST remember names
 * This is not about "correctness" - it's about PHYSICS working.
 *
 * In info-physics:
 * - Names have highest salience field strength (1.0+)
 * - High salience → strong memory → easy recall
 * - This should work WITHOUT programming specific "remember name" logic
 *
 * If this fails, physics is broken.
 */

import { ChatRuntime } from '../src/apps/hi-introvert/ChatRuntime.ts'

console.log('=== 👤 Name Memory Physics Test ===\n')

// Create runtime
const runtime = new ChatRuntime({
  world: {
    features: {
      ontology: true,
      rendering: 'headless',
      communication: true,
      cognitive: true,
      cognition: true,
      linguistics: true
    },
    cognition: {
      network: { k: 8, p: 0.2 },
      trust: { initialTrust: 0.5, trustThreshold: 0.6 },
      resonance: { decayRate: 0.2, minStrength: 0.1 }
    }
  },
  companion: { name: 'hi_introvert' },
  sensors: { os: false, network: false, weather: false },
  autoTick: false,
  silentMode: false  // Want to see debug output
})

console.log('✅ Runtime initialized')
console.log(`   Companion: ${runtime.companion.id}\n`)

// Test 1: User introduces self
console.log('📝 User says: "สวัสดีครับ ผมชื่อเจสัน"\n')
const intro = await runtime.sendMessage('สวัสดีครับ ผมชื่อเจสัน')

console.log(`💬 Companion: "${intro.response}"\n`)

// Tick world (let physics happen)
for (let i = 0; i < 10; i++) {
  runtime.tick()
  await new Promise(resolve => setTimeout(resolve, 10))
}

// Check memory physics
console.log('🔬 Physics Check:')
const memories = runtime.companion.memory?.memories || []
console.log(`   Total memories: ${memories.length}`)

// Find name memory
const nameMemory = memories.find(m => {
  const content = JSON.stringify(m.content || {}).toLowerCase()
  return content.includes('เจสัน') || content.includes('jason')
})

if (nameMemory) {
  console.log(`   ✅ Name memory exists`)
  console.log(`   Salience: ${nameMemory.salience.toFixed(2)} (should be ≥ 0.9 for names)`)
  console.log(`   Keywords: ${nameMemory.keywords?.join(', ') || 'none'}`)

  if (nameMemory.salience >= 0.9) {
    console.log(`   ✅ PHYSICS WORKING: High salience field detected`)
  } else {
    console.log(`   ❌ PHYSICS BROKEN: Salience too low for name!`)
  }
} else {
  console.log(`   ❌ PHYSICS BROKEN: No name memory formed!`)
}

// Test 2: Can entity recall the name?
console.log(`\n📝 User asks: "ชื่อผมอะไร?"\n`)
const recall = await runtime.sendMessage('ชื่อผมอะไร?')

console.log(`💬 Companion: "${recall.response}"\n`)

// Check recall physics
const mentionsName = recall.response.includes('เจสัน') || recall.response.includes('Jason') || recall.response.toLowerCase().includes('jason')

console.log('🔬 Recall Physics:')
if (mentionsName) {
  console.log(`   ✅ PHYSICS WORKING: Name retrieved from memory field`)
} else {
  console.log(`   ❌ PHYSICS BROKEN: Failed to retrieve name despite memory`)
  console.log(`   (Memory exists: ${nameMemory ? 'YES' : 'NO'})`)
  console.log(`   (Salience: ${nameMemory ? nameMemory.salience.toFixed(2) : 'N/A'})`)
}

// Final verdict
console.log('\n' + '═'.repeat(60))
if (nameMemory && nameMemory.salience >= 0.9 && mentionsName) {
  console.log('\n🎉 PHYSICS WORKING: Salience field → Memory → Recall')
  console.log('   Entity is using info-physics correctly')
} else {
  console.log('\n❌ PHYSICS BROKEN: One or more stages failed:')
  if (!nameMemory) {
    console.log('   1. Memory formation FAILED (no field created)')
  } else if (nameMemory.salience < 0.9) {
    console.log(`   1. Salience field WEAK (${nameMemory.salience.toFixed(2)} < 0.9)`)
  } else {
    console.log('   1. Memory field OK ✓')
  }

  if (!mentionsName) {
    console.log('   2. Recall FAILED (field not accessed during retrieval)')
  } else {
    console.log('   2. Recall OK ✓')
  }
}
console.log('═'.repeat(60))
