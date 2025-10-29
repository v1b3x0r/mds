#!/usr/bin/env node
// Test: User Interaction
import { WorldSession } from '../src/session/WorldSession.js'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 User Interaction Test')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const session = new WorldSession()

console.log('▶️  Test 1: Greeting\n')
const greetingResponses = session.handleUserMessage('Hello everyone!')
console.log(`\nUser: "Hello everyone!"`)
greetingResponses.forEach(r => {
  console.log(`  ${r.name} → you: "${r.response}"`)
})

console.log('\n▶️  Test 2: Statement\n')
const statementResponses = session.handleUserMessage("I'm Wutty")
console.log(`\nUser: "I'm Wutty"`)
statementResponses.forEach(r => {
  console.log(`  ${r.name} → you: "${r.response}"`)
})

console.log('\n▶️  Test 3: Question\n')
const questionResponses = session.handleUserMessage('How are you all?')
console.log(`\nUser: "How are you all?"`)
questionResponses.forEach(r => {
  console.log(`  ${r.name} → you: "${r.response}"`)
})

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 Results')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const totalResponses = greetingResponses.length + statementResponses.length + questionResponses.length
const validResponses = [...greetingResponses, ...statementResponses, ...questionResponses]
  .filter(r => r.response && r.response !== '...' && r.response.length > 3)

console.log(`Total responses: ${totalResponses}`)
console.log(`Valid responses: ${validResponses.length}`)
console.log(`"..." responses: ${totalResponses - validResponses.length}`)

if (validResponses.length > 0) {
  console.log('\n✅ User interaction working!')
} else {
  console.log('\n❌ All responses are "..." - need to fix dialogue system')
}

process.exit(0)
