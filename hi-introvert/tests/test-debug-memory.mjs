#!/usr/bin/env node
import { WorldSession } from '../src/session/WorldSession.js'

const session = new WorldSession()
const entities = Array.from(session.entities.values())

console.log('🔍 Memory System Debug\n')

entities.forEach(info => {
  console.log(`${info.name}:`)
  console.log(`  entity.memory exists: ${!!info.entity.memory}`)
  console.log(`  entity.memory?.memories exists: ${!!info.entity.memory?.memories}`)
  console.log(`  typeof entity.remember: ${typeof info.entity.remember}`)
  
  // Try to create a memory
  try {
    info.entity.remember({
      type: 'test',
      content: 'Testing memory system',
      timestamp: Date.now(),
      importance: 0.5
    })
    console.log(`  ✅ remember() succeeded`)
    console.log(`  memories count: ${info.entity.memory?.memories?.length || 0}`)
  } catch (error) {
    console.log(`  ❌ remember() failed: ${error.message}`)
  }
  console.log()
})

process.exit(0)
