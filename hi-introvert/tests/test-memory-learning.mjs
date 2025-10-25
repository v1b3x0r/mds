#!/usr/bin/env node
// Test Suite: Memory & Learning Systems
import { WorldSession } from '../src/session/WorldSession.js'

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 MDS Test Suite: Memory & Learning')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const session = new WorldSession()
const entities = Array.from(session.entities.values())

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 1: Initial State
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('📊 Phase 1: Initial State Check')
console.log('─────────────────────────────────────────────────\n')

const initialState = {}

entities.forEach(info => {
  const memoryCount = info.entity.memory?.count() || 0
  const hasLearning = !!info.entity.learning
  const qTableSize = info.entity.learning?.qTable?.size || 0

  console.log(`${info.name}:`)
  console.log(`  Memory: ${info.entity.memory ? '✅' : '❌'} (${memoryCount} entries)`)
  console.log(`  Learning: ${hasLearning ? '✅' : '❌'} (${qTableSize} Q-table entries)`)
  console.log(`  Relationships: ${Object.keys(info.entity.relationships || {}).length}`)

  initialState[info.name] = {
    memoryCount,
    qTableSize,
    relationshipCount: Object.keys(info.entity.relationships || {}).length
  }
  console.log()
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: Run Conversation (30 seconds)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('▶️  Phase 2: Running 30-second conversation...\n')

const conversationLog = []
let emotionChangeCount = 0
const emotionHistory = {}

// Track initial emotions
entities.forEach(info => {
  emotionHistory[info.name] = [{
    time: 0,
    valence: info.entity.emotion.valence,
    arousal: info.entity.emotion.arousal
  }]
})

session.onAutonomousMessage = (name, text, emotion, target) => {
  conversationLog.push({
    time: Date.now(),
    speaker: name,
    target: target || 'everyone',
    text,
    emotion: { ...emotion }
  })

  // Track emotion changes
  const history = emotionHistory[name]
  const last = history[history.length - 1]
  if (Math.abs(last.valence - emotion.valence) > 0.05 ||
      Math.abs(last.arousal - emotion.arousal) > 0.05) {
    emotionChangeCount++
    history.push({
      time: conversationLog.length,
      valence: emotion.valence,
      arousal: emotion.arousal
    })
  }
}

session.startAutonomousConversation()

await new Promise(resolve => setTimeout(resolve, 30000))

session.stopAutonomousConversation()

console.log(`✅ Conversation complete: ${conversationLog.length} messages\n`)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 3: Memory Analysis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 Phase 3: Memory System Analysis')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

entities.forEach(info => {
  const memories = info.entity.memory?.getAll() || []
  const newMemories = memories.length - initialState[info.name].memoryCount

  console.log(`${info.name} (${memories.length} total, +${newMemories} new):`)

  // Group by type
  const byType = {}
  memories.forEach(m => {
    byType[m.type] = (byType[m.type] || 0) + 1
  })

  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })

  // Show recent memories (last 5)
  if (memories.length > 0) {
    console.log(`\n  Recent memories:`)
    const recent = memories.slice(-5)
    recent.forEach(m => {
      const content = typeof m.content === 'string'
        ? m.content.slice(0, 50)
        : JSON.stringify(m.content).slice(0, 50)
      const salience = m.salience?.toFixed(2) || 'N/A'
      console.log(`    [${m.type}] salience=${salience}: "${content}..."`)
    })
  }

  console.log()
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 4: Learning Analysis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 Phase 4: Learning System Analysis')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

entities.forEach(info => {
  const qTable = info.entity.learning?.qTable
  const qTableSize = qTable?.size || 0
  const newEntries = qTableSize - initialState[info.name].qTableSize

  console.log(`${info.name}:`)
  console.log(`  Q-table size: ${qTableSize} (+${newEntries} new)`)

  if (qTable && qTableSize > 0) {
    // Get top 5 learned behaviors (highest Q-values)
    const entries = Array.from(qTable.entries())
    const flattened = []

    entries.forEach(([state, actions]) => {
      if (actions && typeof actions === 'object') {
        Object.entries(actions).forEach(([action, qValue]) => {
          flattened.push({ state, action, qValue })
        })
      }
    })

    flattened.sort((a, b) => b.qValue - a.qValue)
    const top5 = flattened.slice(0, 5)

    if (top5.length > 0) {
      console.log(`\n  Top learned behaviors:`)
      top5.forEach(({ state, action, qValue }) => {
        console.log(`    [${state}] → "${action}": Q=${qValue.toFixed(3)}`)
      })
    }
  }

  console.log()
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 5: Emotion Dynamics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 Phase 5: Emotion Dynamics')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

entities.forEach(info => {
  const history = emotionHistory[info.name]
  const initial = history[0]
  const final = history[history.length - 1]

  const valenceChange = final.valence - initial.valence
  const arousalChange = final.arousal - initial.arousal

  console.log(`${info.name}:`)
  console.log(`  Initial: valence=${initial.valence.toFixed(2)}, arousal=${initial.arousal.toFixed(2)}`)
  console.log(`  Final:   valence=${final.valence.toFixed(2)}, arousal=${final.arousal.toFixed(2)}`)
  console.log(`  Changes: Δvalence=${valenceChange >= 0 ? '+' : ''}${valenceChange.toFixed(2)}, Δarousal=${arousalChange >= 0 ? '+' : ''}${arousalChange.toFixed(2)}`)
  console.log(`  Transitions: ${history.length - 1}`)
  console.log()
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 6: Relationship Evolution
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 Phase 6: Relationship Evolution')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

entities.forEach(info => {
  const rels = Object.entries(info.entity.relationships || {})

  if (rels.length > 0) {
    console.log(`${info.name}:`)
    rels.forEach(([targetId, rel]) => {
      const target = entities.find(e => e.entity.id === targetId)
      const name = target?.name || 'unknown'
      console.log(`  → ${name}: strength=${rel.strength.toFixed(2)}, valence=${rel.valence.toFixed(2)}`)
    })
    console.log()
  }
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 7: Test Results
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ Test Criteria')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Criteria
const totalNewMemories = entities.reduce((sum, info) => {
  const current = info.entity.memory?.count() || 0
  const initial = initialState[info.name].memoryCount
  return sum + (current - initial)
}, 0)

const totalQTableGrowth = entities.reduce((sum, info) => {
  const current = info.entity.learning?.qTable?.size || 0
  const initial = initialState[info.name].qTableSize
  return sum + (current - initial)
}, 0)

const relationshipChanges = entities.reduce((sum, info) => {
  const rels = Object.values(info.entity.relationships || {})
  return sum + rels.filter(r => r.strength > 0.5).length
}, 0)

// Results
const memoryTest = totalNewMemories > 0
const learningTest = totalQTableGrowth > 0
const emotionTest = emotionChangeCount > 0
const relationshipTest = relationshipChanges > 0
const conversationTest = conversationLog.length > 10

console.log(`💬 Conversation volume: ${conversationLog.length} messages`)
console.log(`   ${conversationTest ? '✅' : '❌'} Expected: > 10\n`)

console.log(`🧠 Memory formation: ${totalNewMemories} new memories`)
console.log(`   ${memoryTest ? '✅' : '❌'} Expected: > 0\n`)

console.log(`🎓 Learning progress: ${totalQTableGrowth} new Q-table entries`)
console.log(`   ${learningTest ? '✅' : '❌'} Expected: > 0\n`)

console.log(`💭 Emotion dynamics: ${emotionChangeCount} emotion changes`)
console.log(`   ${emotionTest ? '✅' : '❌'} Expected: > 0\n`)

console.log(`💞 Relationship strength: ${relationshipChanges} strong bonds (>0.5)`)
console.log(`   ${relationshipTest ? '✅' : '❌'} Expected: > 0\n`)

const allPassed = memoryTest && learningTest && emotionTest && relationshipTest && conversationTest

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
if (allPassed) {
  console.log('✅ All systems operational!')
} else {
  console.log('⚠️  Some systems need attention')
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

process.exit(allPassed ? 0 : 1)
