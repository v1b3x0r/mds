// MDS Core self-simulation (1000 ticks)
// Goal: probe stability of ontology + info-physics + linguistics + world-mind

import {
  World,
  attachWorldEventSink,
  InMemoryWorldEventSink,
  MemoryConsolidation
} from '../dist/mds-core.esm.js'

function createMaterial(id, essence) {
  return {
    $schema: 'https://mds.v1b3.dev/schema/v5',
    material: id,
    essence,
    manifestation: { emoji: '🟡' },
    ontology: {
      memorySize: 120,
      emotionBaseline: { valence: 0, arousal: 0.5, dominance: 0.5 }
    },
    dialogue: {
      intro: [ { lang: { en: 'hello', th: 'สวัสดี' } } ],
      self_monologue: [ { lang: { en: 'thinking...', th: 'คิด...' } } ]
    }
  }
}

function mean(arr) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0 }
function stdev(arr) { const m = mean(arr); const v = mean(arr.map(x => (x-m)**2)); return Math.sqrt(v) }

// 1) World setup
const world = new World({
  seed: 42,
  features: {
    ontology: true,
    rendering: 'headless',
    linguistics: true
  },
  linguistics: { enabled: true, analyzeEvery: 10, maxTranscript: 200 }
})

// Event sink to collect signals
const sink = new InMemoryWorldEventSink()
const detach = attachWorldEventSink(world, sink)

// 2) Spawn small population for interactions
const N = 16
for (let i = 0; i < N; i++) {
  const m = createMaterial(`sim.entity.${i}`, i % 2 === 0 ? 'curious spark' : 'quiet breeze')
  const e = world.spawn(m, { x: 50 + (i%4)*60, y: 50 + Math.floor(i/4)*50 })
  e.enable('consolidation')
}

// Helper: random entity
function pickEntity() { return world.entities[Math.floor(Math.random()*world.entities.length)] }

// 3) Drive the world for 1000 ticks
const TICKS = 1000
const dt = 0.016

// Inject speech and minimal context to exercise linguistics + triggers
const phrases = ['hello there', 'how are you', 'nice day', 'สวัสดี', 'คิดถึง', 'wow', 'cool']

for (let t = 1; t <= TICKS; t++) {
  // Every 7 ticks: record speech from random entity
  if (t % 7 === 0) {
    const speaker = pickEntity()
    const text = phrases[Math.floor(Math.random()*phrases.length)]
    world.recordSpeech(speaker, text)
  }

  // Weak context oscillation to poke triggers
  if (t % 13 === 0) {
    world.broadcastContext({ 'system.load': (Math.sin(t/20)+1)/2 })
  }

  // Periodic memory insertion for consolidation dynamics
  if (t % 23 === 0) {
    const e = pickEntity()
    e.remember({ timestamp: world.worldTime, type: 'observation', subject: 'self', content: { t }, salience: 0.6 })
  }

  world.tick(dt)
}

// 4) Metrics collection
const memCounts = world.entities.map(e => e.memory ? e.memory.count() : 0)
const avgMem = mean(memCounts)
const maxMem = Math.max(...memCounts)

const consolidations = world.entities.map(e => e.consolidation ? e.consolidation.getAllMemories().length : 0)
const avgConsol = mean(consolidations)

const lexStats = world.getLexiconStats?.() || { totalTerms: 0, totalUsage: 0, categories: {} }

const valences = world.entities.map(e => e.emotion?.valence ?? 0)
const arousals = world.entities.map(e => e.emotion?.arousal ?? 0)
const doms = world.entities.map(e => e.emotion?.dominance ?? 0)

const emotionSpread = {
  valence: { mean: mean(valences), stdev: stdev(valences) },
  arousal: { mean: mean(arousals), stdev: stdev(arousals) },
  dominance: { mean: mean(doms), stdev: stdev(doms) }
}

const analyticsEmits = sink.analytics.length
const contextEmits = sink.context.length
const utterCount = sink.utterances.length

// 5) Stability heuristics
const structureStability = {
  ticks: sink.ticks.length,
  noCrash: true,
  analyticsEmits,
  contextEmits
}

const semanticIntegrity = {
  lexicon: { totalTerms: lexStats.totalTerms, totalUsage: lexStats.totalUsage },
  utterances: utterCount,
  memory: { avgMem, maxMem, avgConsolidated: avgConsol }
}

const emergentCoherence = {
  emotionSpread,
  collective: world.getCollectiveEmotion?.() || null,
  patterns: sink.analytics.at(-1)?.patterns?.length ?? 0
}

const result = {
  structureStability,
  semanticIntegrity,
  emergentCoherence
}

console.log('\n=== MDS Self-Simulation (1000 ticks) Report ===')
console.log(JSON.stringify(result, null, 2))

// Cleanup
detach()
world.destroy()

