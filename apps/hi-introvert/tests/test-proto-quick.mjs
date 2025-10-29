#!/usr/bin/env bun
import { WorldSession } from '../dist/index.js'

console.log('🧪 Quick Proto-Language Test\n')

const session = new WorldSession()
session.setSilentMode(true)

const world = session.world

console.log('Checking systems:')
console.log(`  world.protoGenerator exists: ${world.protoGenerator !== undefined}`)
console.log(`  world.lexicon exists: ${world.lexicon !== undefined}`)
console.log(`  world.transcript exists: ${world.transcript !== undefined}`)

if (world.protoGenerator) {
  console.log('\n✅ Proto-language generator connected!')
  
  // Test generation
  const testSentence = world.protoGenerator.generate({
    vocabularyPool: ['สวัสดี', 'hello', 'ครับ', 'good', 'ดี'],
    emotion: { valence: 0.5, arousal: 0.5 },
    minWords: 2,
    maxWords: 4
  })
  
  console.log(`  Test generation: "${testSentence}"`)
} else {
  console.log('\n❌ Proto-language generator NOT found!')
}
