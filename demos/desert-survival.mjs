/**
 * MDS Phase 1 Final Demo
 * "3 entities แย่งน้ำใน desert"
 * 3 entities competing for limited water in a harsh desert environment
 *
 * Features demonstrated:
 * - Resource needs (water depletion)
 * - Spatial resource fields (limited water well)
 * - Entities speak about their needs (emergent language)
 * - Emotional climate (death creates grief)
 * - Climate influence (survivors affected by loss)
 * - Needs → emotion → behavior loop
 */

import { World, CollectiveIntelligence } from '../dist/mds-core.esm.js'

console.log('\n🏜️  MDS Phase 1 Demo: Desert Survival\n')
console.log('━'.repeat(60))
console.log('Scenario: 3 travelers in a harsh desert, one small water well')
console.log('━'.repeat(60))
console.log('')

// Create desert world with linguistics
const world = new World({
  features: {
    ontology: true,
    linguistics: true,
    rendering: 'headless'
  },
  linguistics: {
    enabled: true,
    analyzeEvery: 10,
    minUsage: 2
  }
})

// Add small water well (limited resource)
world.addResourceField({
  id: 'desert_well',
  resourceType: 'water',
  type: 'point',
  position: { x: 250, y: 250 },  // Center of world
  intensity: 1.0,
  depletionRate: 0.02,        // Depletes quickly
  regenerationRate: 0.005,     // Regenerates slowly
  maxIntensity: 1.0
})

console.log('🌵 Desert initialized')
console.log(`💧 Water well at (250, 250)`)
console.log(`   - Depletion rate: 0.02/s (fast)`)
console.log(`   - Regeneration: 0.005/s (slow)`)
console.log('')

// Spawn 3 travelers at different locations
const travelers = [
  {
    name: 'Alex',
    position: { x: 100, y: 100 },
    essence: 'Determined traveler'
  },
  {
    name: 'Bea',
    position: { x: 400, y: 100 },
    essence: 'Cautious explorer'
  },
  {
    name: 'Charlie',
    position: { x: 250, y: 400 },
    essence: 'Weary wanderer'
  }
]

const entities = []

for (const traveler of travelers) {
  const entity = world.spawn({
    $schema: 'v5',
    essence: traveler.essence,
    nativeLanguage: 'en',
    needs: {
      resources: [
        {
          id: 'water',
          initial: 0.8,             // Start with some water
          depletionRate: 0.015,      // Depletes at 1.5% per second
          criticalThreshold: 0.3,
          emotionalImpact: {
            valence: -0.6,          // Strong negative emotion
            arousal: 0.4,           // Increased stress
            dominance: -0.3         // Feeling helpless
          }
        }
      ]
    }
  }, traveler.position)

  entity.customName = traveler.name  // Add name for logging
  entities.push(entity)

  console.log(`👤 ${traveler.name} spawned at (${traveler.position.x}, ${traveler.position.y})`)
  console.log(`   Water: ${(entity.getNeed('water').current * 100).toFixed(0)}%`)
}

console.log('')
console.log('⏱️  Starting simulation...')
console.log('━'.repeat(60))
console.log('')

// Simulation parameters
const TICK_DURATION = 1  // 1 second per tick
const MAX_TICKS = 200    // Run for 200 seconds
const REPORT_INTERVAL = 20  // Report every 20 seconds

let tickCount = 0
let deaths = 0

// Simulation loop
for (let tick = 0; tick < MAX_TICKS; tick++) {
  tickCount++

  // Move entities toward water if they're thirsty
  for (const entity of entities) {
    if (!entity.getNeed) continue  // Skip if entity is dead/removed

    const waterNeed = entity.getNeed('water')
    if (!waterNeed) continue

    // If critical, try to reach water
    if (waterNeed.current < 0.5) {
      const well = world.getResourceField('desert_well')
      const dx = well.position.x - entity.x
      const dy = well.position.y - entity.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 5) {
        // Move toward water (slowly, 10 px/sec)
        const speed = 10
        entity.x += (dx / dist) * speed * TICK_DURATION
        entity.y += (dy / dist) * speed * TICK_DURATION
      } else {
        // At water! Try to drink
        const consumed = world.consumeResource('water', entity.x, entity.y, 0.3)
        if (consumed > 0) {
          entity.satisfyNeed('water', consumed)
        }
      }
    }
  }

  // Tick world
  world.tick(TICK_DURATION)

  // Check for deaths (water depleted)
  for (let i = entities.length - 1; i >= 0; i--) {
    const entity = entities[i]
    const waterNeed = entity.getNeed?.('water')

    if (waterNeed && waterNeed.current <= 0) {
      // Entity dies of thirst
      deaths++
      console.log(`💀 ${entity.customName} died of thirst at t=${tickCount}s`)
      console.log(`   Emotional impact: World grief increased`)

      // Record death (high intensity - death by thirst is tragic)
      world.recordEntityDeath(entity, 0.9)

      // Remove from tracking
      entities.splice(i, 1)
    }
  }

  // Periodic report
  if (tickCount % REPORT_INTERVAL === 0) {
    console.log(`\n📊 Status Report (t=${tickCount}s)`)
    console.log('─'.repeat(60))

    // Water well status
    const well = world.getResourceField('desert_well')
    console.log(`💧 Water well: ${(well.intensity * 100).toFixed(0)}% full`)

    // Survivors
    console.log(`\n👥 Survivors: ${entities.length}/${travelers.length}`)

    for (const entity of entities) {
      const water = entity.getNeed('water')
      const emotion = entity.emotion
      const critical = entity.isCritical('water')

      console.log(`   ${entity.customName}:`)
      console.log(`     Water: ${(water.current * 100).toFixed(0)}% ${critical ? '🔴 CRITICAL' : ''}`)
      console.log(`     Emotion: V=${emotion.valence.toFixed(2)}, A=${emotion.arousal.toFixed(2)}`)
      console.log(`     Position: (${Math.round(entity.x)}, ${Math.round(entity.y)})`)
    }

    // Emotional climate
    const climate = world.getEmotionalClimate()
    const climateDesc = CollectiveIntelligence.describeClimate(climate)

    console.log(`\n🌍 Emotional Climate: ${climateDesc}`)
    console.log(`   Grief: ${(climate.grief * 100).toFixed(0)}%`)
    console.log(`   Vitality: ${(climate.vitality * 100).toFixed(0)}%`)
    console.log(`   Tension: ${(climate.tension * 100).toFixed(0)}%`)
    console.log(`   Harmony: ${(climate.harmony * 100).toFixed(0)}%`)

    // Recent utterances
    const recentUtterances = world.transcript.getRecent(3)
    if (recentUtterances.length > 0) {
      console.log(`\n💬 Recent utterances:`)
      for (const utterance of recentUtterances.reverse()) {
        console.log(`   "${utterance.text}"`)
      }
    }

    // Emergent lexicon
    const lexicon = world.lexicon.getAll()
    if (lexicon.length > 0) {
      console.log(`\n📚 Emergent vocabulary: ${lexicon.length} terms`)
      const topTerms = lexicon.slice(0, 5).map(e => e.term).join(', ')
      console.log(`   Sample: ${topTerms}`)
    }
  }

  // Stop if everyone dies
  if (entities.length === 0) {
    console.log(`\n💀 All travelers perished at t=${tickCount}s`)
    break
  }
}

// Final summary
console.log('\n')
console.log('━'.repeat(60))
console.log('📋 FINAL SUMMARY')
console.log('━'.repeat(60))
console.log('')

console.log(`⏱️  Simulation duration: ${tickCount} seconds`)
console.log(`💀 Deaths: ${deaths}/${travelers.length}`)
console.log(`✅ Survivors: ${entities.length}/${travelers.length}`)

if (entities.length > 0) {
  console.log(`\n🎉 Survivors:`)
  for (const entity of entities) {
    const water = entity.getNeed('water')
    console.log(`   - ${entity.customName} (Water: ${(water.current * 100).toFixed(0)}%)`)
  }
}

// Final climate
const finalClimate = world.getEmotionalClimate()
const finalDesc = CollectiveIntelligence.describeClimate(finalClimate)
console.log(`\n🌍 Final Emotional Climate: ${finalDesc}`)
console.log(`   Grief: ${(finalClimate.grief * 100).toFixed(0)}%`)
console.log(`   Vitality: ${(finalClimate.vitality * 100).toFixed(0)}%`)

// Emergent language
const finalLexicon = world.lexicon.getAll()
console.log(`\n📚 Emergent vocabulary: ${finalLexicon.length} crystallized terms`)
if (finalLexicon.length > 0) {
  console.log(`   Terms: ${finalLexicon.map(e => `"${e.term}"`).join(', ')}`)
}

// Events recorded
const events = finalClimate.recentEvents
console.log(`\n📝 Climate events recorded: ${events.length}`)
const deathEvents = events.filter(e => e.type === 'death').length
const sufferingEvents = events.filter(e => e.type === 'suffering').length
console.log(`   - Deaths: ${deathEvents}`)
console.log(`   - Suffering: ${sufferingEvents}`)

console.log('\n━'.repeat(60))
console.log('✅ Demo complete!')
console.log('\nKey Features Demonstrated:')
console.log('  ✓ Resource needs (water depletion)')
console.log('  ✓ Spatial resource competition (limited well)')
console.log('  ✓ Emergent language (needs → speech)')
console.log('  ✓ Death → emotional climate')
console.log('  ✓ Climate influence on survivors')
console.log('  ✓ Needs → emotion → behavior loop')
console.log('')
console.log('Phase 1: Material Pressure System - COMPLETE! 🎉')
console.log('━'.repeat(60))

world.destroy()
