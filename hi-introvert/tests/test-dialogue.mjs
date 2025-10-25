#!/usr/bin/env bun
import { WorldSession } from '../src/session/WorldSession.ts'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('hi-introvert — Dialogue Test')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const session = new WorldSession()

console.log('✓ Session loaded')
console.log('✓ Entities:', Array.from(session.entities.keys()).join(', '))
console.log('')

// DEBUG: Test speak() directly
const testEntity = session.entities.get('japan').entity
console.log('DEBUG: Testing entity.speak() directly...')
console.log('  entity.dialoguePhrases keys:', Object.keys(testEntity.dialoguePhrases))
console.log('  speak("intro"):', testEntity.speak('intro'))
console.log('  speak("greeting"):', testEntity.speak('greeting'))
console.log('  dialoguePhrases.greeting:', testEntity.dialoguePhrases.greeting)
console.log('')

// Test 1: Greeting
console.log('TEST 1: User says "hi"')
console.log('─────────────────────────────────────────────────────')
const responses1 = session.handleUserMessage('hi')
responses1.forEach(({ name, response, emotion }) => {
  console.log(`${name.padEnd(10)} → "${response}"`)
  console.log(`${''.padEnd(10)} emotion: v=${emotion.valence.toFixed(2)} a=${emotion.arousal.toFixed(2)}`)
})
console.log('')

// Test 2: Question
console.log('TEST 2: User says "How are you?"')
console.log('─────────────────────────────────────────────────────')
const responses2 = session.handleUserMessage('How are you?')
responses2.forEach(({ name, response, emotion }) => {
  console.log(`${name.padEnd(10)} → "${response}"`)
  console.log(`${''.padEnd(10)} emotion: v=${emotion.valence.toFixed(2)} a=${emotion.arousal.toFixed(2)}`)
})
console.log('')

// Test 3: Statement
console.log('TEST 3: User says "I like quiet places"')
console.log('─────────────────────────────────────────────────────')
const responses3 = session.handleUserMessage('I like quiet places')
responses3.forEach(({ name, response, emotion }) => {
  console.log(`${name.padEnd(10)} → "${response}"`)
  console.log(`${''.padEnd(10)} emotion: v=${emotion.valence.toFixed(2)} a=${emotion.arousal.toFixed(2)}`)
})
console.log('')

// Test 4: Check monologues
console.log('TEST 4: Checking for monologues...')
console.log('─────────────────────────────────────────────────────')
const monologues = session.checkMonologues()
if (monologues.length > 0) {
  monologues.forEach(({ name, text }) => {
    console.log(`${name.padEnd(10)} thinks: ${text}`)
  })
} else {
  console.log('(no monologues this time)')
}
console.log('')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✓ All tests complete')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

session.destroy()
