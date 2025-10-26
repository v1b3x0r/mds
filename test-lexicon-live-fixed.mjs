#!/usr/bin/env bun
import { World } from '@v1b3x0r/mds-core'

console.log('🔍 Live Lexicon Test\n')

const world = new World({
  renderer: 'headless',
  features: { linguistics: true },
  linguistics: {
    analyzeEvery: 1,  // Analyze EVERY tick
    minUsage: 1,      // Accept single usage
    maxTranscript: 100
  }
})

console.log('✓ World created\n')

// Spawn companion
const companion = world.spawn({ essence: 'Test companion' }, 100, 100)
console.log('✓ Companion spawned\n')

// Record multiple utterances
console.log('Recording speech...')
const phrases = [
  'สวัสดีครับ',
  'สวัสดี',
  'วันนี้อากาศดีนะ',
  'อากาศดีจริงๆ',
  'สวัสดีตอนเช้า'
]

for (const phrase of phrases) {
  world.recordSpeech(companion, phrase)
  console.log(`  - "${phrase}"`)
}

console.log(`\nRecorded ${phrases.length} phrases\n`)

// Tick world multiple times to trigger crystallization
console.log('Ticking world to trigger crystallization...')
for (let i = 0; i < 10; i++) {
  world.tick(1)
  
  // Check lexicon after each tick
  const stats = world.getLexiconStats()
  if (stats && stats.totalTerms > 0) {
    console.log(`  Tick ${i+1}: ${stats.totalTerms} terms found!`)
    
    const popular = world.getPopularTerms(1)
    for (const term of popular) {
      console.log(`    - "${term.term}" (usage: ${term.usageCount})`)
    }
    break
  } else {
    console.log(`  Tick ${i+1}: No terms yet...`)
  }
}

console.log('\nFinal lexicon state:')
const finalStats = world.getLexiconStats()
if (finalStats) {
  console.log(`  Total terms: ${finalStats.totalTerms}`)
  console.log(`  Total usage: ${finalStats.totalUsage}`)
  
  const popularTerms = world.getPopularTerms(1)
  console.log(`\nPopular terms:`)
  for (const term of popularTerms) {
    console.log(`  ${term.term} (usage: ${term.usageCount}, weight: ${term.weight.toFixed(2)})`)
  }
} else {
  console.log('  ❌ Lexicon is undefined or empty')
}
