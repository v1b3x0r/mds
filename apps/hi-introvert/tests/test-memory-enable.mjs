#!/usr/bin/env bun
import { WorldSession } from '../dist/index.js'

console.log('🔍 Memory Enable Test\n')

const session = new WorldSession()
session.setSilentMode(true)

const companion = session.companionEntity.entity

console.log('Checking companion entity:')
console.log(`  memory object exists: ${companion.memory !== undefined}`)
console.log(`  memory enabled: ${companion.isEnabled('memory')}`)
console.log(`  learning enabled: ${companion.isEnabled('learning')}`)

if (companion.memory) {
  console.log(`  memory.memories array exists: ${companion.memory.memories !== undefined}`)
  console.log(`  memory.memories length: ${companion.memory.memories?.length || 0}`)
  
  // Try adding a memory manually
  companion.remember({
    type: 'test',
    subject: 'debug',
    content: { test: 'manual memory' },
    timestamp: Date.now(),
    salience: 0.5
  })
  
  console.log(`  After manual remember: ${companion.memory.memories?.length || 0}`)
  
  if (companion.memory.memories && companion.memory.memories.length > 0) {
    console.log(`  ✅ Memory system works!`)
    console.log(`  Sample: ${JSON.stringify(companion.memory.memories[0]).substring(0, 80)}...`)
  } else {
    console.log(`  ❌ Memory system broken - manual remember failed`)
  }
} else {
  console.log(`  ❌ Memory object not initialized!`)
}
