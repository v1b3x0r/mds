#!/usr/bin/env node
// Test: Entity Interactions
import { WorldSession } from '../src/session/WorldSession.js'

const session = new WorldSession()
const entities = Array.from(session.entities.values())

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 Entity Interaction Test')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Check positions
console.log('📍 Entity Positions:')
entities.forEach(info => {
  console.log(`  ${info.name}: (${info.entity.x}, ${info.entity.y})`)
})

// Check distances
console.log('\n📏 Distances between entities:')
for (let i = 0; i < entities.length; i++) {
  for (let j = i + 1; j < entities.length; j++) {
    const a = entities[i]
    const b = entities[j]
    const dx = a.entity.x - b.entity.x
    const dy = a.entity.y - b.entity.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    console.log(`  ${a.name} ↔ ${b.name}: ${dist.toFixed(1)}px`)
  }
}

// Check relationships
console.log('\n💞 Relationships:')
entities.forEach(info => {
  if (info.entity.relationships) {
    const rels = Object.entries(info.entity.relationships)
    if (rels.length > 0) {
      console.log(`  ${info.name}:`)
      rels.forEach(([id, rel]) => {
        const target = entities.find(e => e.entity.id === id)
        console.log(`    → ${target?.name || id}: strength=${rel.strength.toFixed(2)}, valence=${rel.valence.toFixed(2)}`)
      })
    } else {
      console.log(`  ${info.name}: (no relationships yet)`)
    }
  } else {
    console.log(`  ${info.name}: (relationships disabled)`)
  }
})

// Check inbox/outbox
console.log('\n📬 Message Queues:')
entities.forEach(info => {
  const hasInbox = !!info.entity.inbox
  const hasOutbox = !!info.entity.outbox
  console.log(`  ${info.name}: inbox=${hasInbox}, outbox=${hasOutbox}`)
})

// Run simulation for 5 seconds and check for interactions
console.log('\n▶️  Running 5-second simulation...\n')

let messageCount = 0
session.onAutonomousMessage = (name, text, emotion, target) => {
  messageCount++
  console.log(`[${messageCount}] ${name} → ${target || 'everyone'}: "${text}"`)
}

session.startAutonomousConversation()

setTimeout(() => {
  session.stopAutonomousConversation()
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Results:')
  console.log(`  Messages: ${messageCount}`)
  console.log(`  Direct interactions: ${messageCount > 0 && entities.some(e => e.entity.inbox?.length > 0) ? 'YES' : 'NO'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  process.exit(0)
}, 5000)
