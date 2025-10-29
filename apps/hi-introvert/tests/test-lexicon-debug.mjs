#!/usr/bin/env node

/**
 * Debug lexicon - why is it empty?
 */

import { World } from '@v1b3x0r/mds-core'

console.log('🔍 Lexicon Debug Test\n')

// Create world with linguistics
const world = new World({
  renderer: 'headless',
  features: {
    linguistics: true
  },
  linguistics: {
    analyzeEvery: 1,  // Analyze every tick
    minUsage: 1,      // Min 1 usage to crystallize
    maxTranscript: 100
  }
})

console.log('✓ World created with linguistics enabled')

// Spawn companion
const companion = world.spawn({
  essence: 'Test companion',
  material: 'test.companion'
}, 100, 100)

companion.enable('memory')

console.log('✓ Companion spawned\n')

// Record some speech
console.log('Recording speech...')
world.recordSpeech(companion, 'Hello world')
world.recordSpeech(companion, 'Hello again')
world.recordSpeech(companion, 'World is beautiful')
world.recordSpeech(companion, 'Hello my friend')

console.log('  Recorded 4 utterances\n')

// Check transcript
const transcript = world.getRecentUtterances(10)
console.log(`Transcript: ${transcript.length} utterances`)
transcript.forEach((utt, i) => {
  console.log(`  ${i+1}. "${utt.text}"`)
})

// Tick world to trigger crystallizer
console.log('\nTicking world...')
for (let i = 0; i < 5; i++) {
  world.tick(1)
}
console.log('  Ticked 5 times\n')

// Check lexicon
const stats = world.getLexiconStats()
console.log('Lexicon stats:', stats || 'undefined')

const popularTerms = world.getPopularTerms(1)
console.log(`Popular terms: ${popularTerms.length}`)
popularTerms.forEach((term, i) => {
  console.log(`  ${i+1}. "${term.term}" (usage: ${term.usageCount}, weight: ${term.weight.toFixed(2)})`)
})

if (popularTerms.length === 0) {
  console.log('\n❌ PROBLEM: Lexicon is empty!')
  console.log('   Possible causes:')
  console.log('   1. Crystallizer not running')
  console.log('   2. minUsage threshold too high')
  console.log('   3. Pattern detection failing')
} else {
  console.log('\n✅ Lexicon working!')
}

process.exit(0)
