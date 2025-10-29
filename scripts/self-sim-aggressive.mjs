// MDS Core self-simulation — Aggressive mode (1000 ticks)
// analyzeEvery=1, minUsage=2, repeated lexicon inputs, consolidation scheduling, proximity, trigger-rich

import {
  World,
  InMemoryWorldEventSink,
  attachWorldEventSink
} from '../dist/mds-core.esm.js'

function mat(id, essence, keywords=[]) {
  return {
    $schema: 'https://mds.v1b3.dev/schema/v5',
    material: id,
    essence,
    manifestation: { emoji: '🟡' },
    ontology: {
      memorySize: 200,
      emotionBaseline: { valence: 0, arousal: 0.5, dominance: 0.5 }
    },
    // Emotion transitions driven by context
    emotion: {
      states: {
        neutral:   { valence: 0.0,  arousal: 0.5, dominance: 0.5 },
        lonely:    { valence: -0.3, arousal: 0.3, dominance: 0.4 },
        anxious:   { valence: -0.4, arousal: 0.8, dominance: 0.4 },
        excited:   { valence: 0.5,  arousal: 0.8, dominance: 0.6 }
      },
      base_state: 'neutral',
      transitions: [
        { trigger: 'user.silence>5', to: 'lonely', intensity: 0.2 },
        { trigger: 'system.load>0.6', to: 'anxious', intensity: 0.3 },
        { trigger: 'context.shift', to: 'excited', intensity: 0.25 }
      ]
    },
    dialogue: {
      intro: [ { lang: { en: 'hello', th: 'สวัสดี' } } ],
      self_monologue: [ { lang: { en: 'thinking...', th: 'คิด...' } } ]
    },
    // hint keywords for potential semantic clustering (not strictly used by lexicon)
    notes: keywords
  }
}

function mean(a){return a.length? a.reduce((x,y)=>x+y,0)/a.length:0}
function stdev(a){const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))}

// World with aggressive linguistics
const world = new World({
  seed: 1337,
  features: { ontology: true, rendering: 'headless', linguistics: true },
  linguistics: { enabled: true, analyzeEvery: 1, minUsage: 2, maxTranscript: 2000 }
})

const sink = new InMemoryWorldEventSink()
const detach = attachWorldEventSink(world, sink)

// Tight proximity grid (4x4)
const N = 16
const spacing = 24
for (let i=0;i<N;i++){
  const row = Math.floor(i/4), col = i%4
  const e = world.spawn(
    mat(`aggr.entity.${i}`, i%2? 'quiet breeze of memory':'curious spark of thought', ['hello','memory','wow','cool']),
    { x: 100 + col*spacing, y: 100 + row*spacing }
  )
  e.enable('consolidation')
}

// Preload lexicon with repeated phrases (per-entity) to ensure crystallization
const seeds = ['hello there','wow','cool','สวัสดี','คิดถึง']
for (const e of world.entities){
  for (const phrase of seeds){
    for (let k=0;k<10;k++){
      world.recordSpeech(e, phrase)
    }
  }
}

const TICKS = 1000
const dt = 0.016
let silence = 0

for (let t=1; t<=TICKS; t++){
  // Oscillate system.load and drive context
  const sysLoad = (Math.sin(t/12)+1)/2
  world.broadcastContext({ 'system.load': sysLoad })

  // Simulate user silence progression
  silence += dt
  world.broadcastContext({ 'user.silence': silence })

  // Periodic context shift
  if (t % 50 === 0) {
    world.broadcastContext({ 'context.shift': 1 })
  } else {
    world.broadcastContext({ 'context.shift': 0 })
  }

  // Proximity interaction hint: nudge positions slightly towards center to cause interactions
  const cx = 100 + (3*spacing)/2, cy = 100 + (3*spacing)/2
  for (const e of world.entities){
    const dx = cx - e.x, dy = cy - e.y
    e.vx += dx * 0.0005
    e.vy += dy * 0.0005
  }

  // Every 9 ticks add an observation memory to exercise consolidation
  if (t % 9 === 0){
    const e = world.entities[Math.floor(Math.random()*world.entities.length)]
    e.remember({ timestamp: world.worldTime, type:'observation', subject:'self', content:{ t }, salience: 0.7 })
  }

  // Every 100 ticks: schedule consolidation across all entities
  if (t % 100 === 0){
    for (const e of world.entities){
      if (e.consolidation && e.memory){
        e.consolidation.consolidate(e.memory.recall())
      }
    }
  }

  // Apply forgetting continuously (use worldTime scaling rather than wall-time)
  for (const e of world.entities){
    if (e.consolidation){
      e.consolidation.applyForgetting(dt)
    }
  }

  world.tick(dt)
}

// Compute analytics using simulation time (worldTime)
const memCounts = world.entities.map(e => e.memory? e.memory.count():0)
const consCounts = world.entities.map(e => e.consolidation? e.consolidation.getAllMemories().length:0)
const valences = world.entities.map(e => e.emotion?.valence ?? 0)
const arousals = world.entities.map(e => e.emotion?.arousal ?? 0)
const doms = world.entities.map(e => e.emotion?.dominance ?? 0)
const emotionSpread = {
  valence:{ mean: mean(valences), stdev: stdev(valences) },
  arousal:{ mean: mean(arousals), stdev: stdev(arousals) },
  dominance:{ mean: mean(doms), stdev: stdev(doms) }
}

const lex = world.getLexiconStats?.() || { totalTerms:0, totalUsage:0, categories:{} }
const terms = world.getPopularTerms?.(1000) || []

const report = {
  structureStability: {
    ticks: TICKS,
    noCrash: true,
    contextEmits: sink.context.length,
    utterances: sink.utterances.length
  },
  semanticIntegrity: {
    lexicon: { totalTerms: lex.totalTerms, totalUsage: lex.totalUsage, sample: terms.slice(0,5) },
    memory: { avg: mean(memCounts), max: Math.max(...memCounts), consolidatedAvg: mean(consCounts) }
  },
  emergentCoherence: {
    emotionSpread,
    collective: world.getCollectiveEmotion?.() || null,
    patterns: sink.analytics.at(-1)?.patterns?.length ?? 0,
    worldTime: world.worldTime
  }
}

console.log('\n=== MDS Self-Simulation (Aggressive, 1000 ticks) ===')
console.log(JSON.stringify(report, null, 2))

detach()
world.destroy()
