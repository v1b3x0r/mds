#!/usr/bin/env bun
/**
 * Test Thai emotion detection from essence text
 */

import { World, detectEmotionFromText, findClosestThaiEmotion } from '@v1b3x0r/mds-core'

console.log('🇹🇭 Thai Emotion Detection Test\n')

// Test 1: Detect from Thai essence
console.log('Test 1: Thai essence "เด็กขี้อาย"\n')
const thaiEssence = 'เด็กขี้อาย'
const detected1 = detectEmotionFromText(thaiEssence)
console.log(`  Input: "${thaiEssence}"`)
console.log(`  Detected: ${JSON.stringify(detected1, null, 2)}`)
console.log(`  Thai label: ${findClosestThaiEmotion(detected1)}`)

// Test 2: Detect from English essence
console.log('\nTest 2: English essence "A shy kid"\n')
const englishEssence = 'A shy kid'
const detected2 = detectEmotionFromText(englishEssence)
console.log(`  Input: "${englishEssence}"`)
console.log(`  Detected: ${JSON.stringify(detected2, null, 2)}`)
console.log(`  Thai label: ${findClosestThaiEmotion(detected2)}`)

// Test 3: Spawn entity with Thai essence (auto-detect)
console.log('\nTest 3: Spawn entity with auto-detected emotion\n')
const world = new World({ renderer: 'headless' })
const entity = world.spawn({
  essence: 'ผีเหงา ๆ ที่อ้างว้าง'
}, 100, 100)

const essence = typeof entity.m.essence === 'string' ? entity.m.essence : entity.m.essence?.th || 'N/A'
console.log(`  Essence: "${essence}"`)
console.log(`  Emotion state: ${JSON.stringify(entity.emotion, null, 2)}`)
console.log(`  Thai label: ${findClosestThaiEmotion(entity.emotion)}`)

// Test 4: Multiple emotions (blending)
console.log('\nTest 4: Complex emotion "เด็กขี้อาย เหงา และเหนื่อยใจ"\n')
const complexEssence = 'เด็กขี้อาย เหงา และเหนื่อยใจ'
const detected4 = detectEmotionFromText(complexEssence)
console.log(`  Input: "${complexEssence}"`)
console.log(`  Detected: ${JSON.stringify(detected4, null, 2)}`)
console.log(`  Thai label: ${findClosestThaiEmotion(detected4)}`)

console.log('\n✅ Thai emotion system working!')
