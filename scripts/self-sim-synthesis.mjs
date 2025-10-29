// Self-stabilizing ontology synthesis run (2000 ticks, adaptive time)
// Reports structural coherence, semantic fluidity (entropy), and meta-awareness signals.

import { World, attachWorldEventSink, InMemoryWorldEventSink } from '../dist/mds-core.esm.js'

function mat(id, essence){
  return {
    $schema: 'https://mds.v1b3.dev/schema/v5',
    material: id,
    essence,
    manifestation: { emoji: '✨' },
    ontology: { memorySize: 240, emotionBaseline: { valence: 0, arousal: 0.5, dominance: 0.5 } },
    emotion: {
      states: {
        neutral: { valence: 0.0, arousal: 0.5, dominance: 0.5 },
        open:    { valence: 0.2, arousal: 0.6, dominance: 0.55 },
        guard:   { valence: -0.2, arousal: 0.6, dominance: 0.45 }
      },
      base_state: 'neutral',
      transitions: [
        { trigger: 'user.silence>6', to: 'guard', intensity: 0.2, chance: 0.6 },
        { trigger: 'system.load>0.6', to: 'guard', intensity: 0.25, chance: 0.7 },
        { trigger: 'context.resonance>0.6', to: 'open', intensity: 0.3, chance: 0.8 }
      ]
    },
    dialogue: { intro: [ { lang: { en:'hello', th:'สวัสดี' } } ] }
  }
}

const world = new World({
  seed: 7,
  features: { ontology: true, rendering: 'headless', linguistics: true },
  linguistics: { enabled: true, analyzeEvery: 1, minUsage: 2, maxTranscript: 4000 },
  meta: { adaptiveTime: true, timeDilationStrength: 0.25 }
})

const sink = new InMemoryWorldEventSink()
const detach = attachWorldEventSink(world, sink)

// Population
const N=16, spacing=28
for (let i=0;i<N;i++){
  const e = world.spawn(mat(`synth.entity.${i}`, i%2? 'quiet seed of pattern':'curious drift of meaning'),
    { x: 100 + (i%4)*spacing, y: 100 + Math.floor(i/4)*spacing }
  )
  e.enable('consolidation')
}

// Helpers
const phrases=['hello there','wow','cool','สวัสดี','คิดถึง']
const center={ x: 100 + (3*spacing)/2, y: 100 + (3*spacing)/2 }
let silence=0, resonance=0

const TICKS=2000
for (let t=1;t<=TICKS;t++){
  // Context signals
  const load=(Math.sin(t/16)+1)/2
  silence+=0.016
  resonance = (Math.cos(t/20)+1)/2
  world.broadcastContext({ 'system.load': load, 'user.silence': silence, 'context.resonance': resonance })

  // Speech sampling (stochastic)
  if (Math.random()<0.35){
    const e = world.entities[Math.floor(Math.random()*world.entities.length)]
    world.recordSpeech(e, phrases[Math.floor(Math.random()*phrases.length)])
  }

  // Gentle central gravity (proximity interactions)
  for (const e of world.entities){
    const dx=center.x-e.x, dy=center.y-e.y
    e.vx += dx*0.0004
    e.vy += dy*0.0004
  }

  // Periodic memory events
  if (t%12===0){
    const e = world.entities[Math.floor(Math.random()*world.entities.length)]
    e.remember({ timestamp: world.worldTime, type:'observation', subject:'self', content:{ t }, salience: 0.6 })
  }

  // Consolidation cadence
  if (t%120===0){
    for (const e of world.entities){
      if (e.consolidation && e.memory){ e.consolidation.consolidate(e.memory.recall()) }
    }
  }

  // Continuous forgetting
  for (const e of world.entities){ if (e.consolidation){ e.consolidation.applyForgetting(0.016) } }

  world.tick(0.016)
}

// Metrics
function mean(a){return a.length? a.reduce((x,y)=>x+y,0)/a.length:0}
function stdev(a){const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))}

const lex = world.getLexiconStats?.() || { totalTerms:0, totalUsage:0, categories:{} }
const terms = world.getPopularTerms?.(1000) || []
const usage = terms.map(t=>t.usageCount || t.count || 0)
const total = usage.reduce((a,b)=>a+b,0) || 1
const probs = usage.map(u=>u/total)
const languageEntropy = -probs.reduce((s,p)=> s + (p>0? p*Math.log2(p):0), 0)
const maxEntropy = Math.log2(Math.max(1,probs.length))
const entropy01 = maxEntropy>0 ? (languageEntropy/maxEntropy) : 0

const memCounts = world.entities.map(e=> e.memory? e.memory.count():0)
const consCounts = world.entities.map(e=> e.consolidation? e.consolidation.getAllMemories().length:0)
const val = world.entities.map(e=> e.emotion?.valence ?? 0)
const aro = world.entities.map(e=> e.emotion?.arousal ?? 0)
const dom = world.entities.map(e=> e.emotion?.dominance ?? 0)

// Info-energy proxy: mean kinetic + variance of emotion
const speeds = world.entities.map(e=> Math.hypot(e.vx, e.vy))
const infoEnergy = {
  kineticMean: mean(speeds),
  emotionVar: { valence: stdev(val), arousal: stdev(aro), dominance: stdev(dom) }
}

// Detect self-motion (subsystems that proceed without direct pokes)
const selfMotion = {
  linguistics: (lex.totalTerms>0 && sink.utterances.length>0),
  consolidation: mean(consCounts)>0,
  contagion: stdev(val)+stdev(aro) > 0.01
}

const structuralCoherence = {
  loops: { tick: sink.ticks.length, analytics: sink.analytics.length },
  locks: 'reduced via stochastic triggers & adaptive time',
  stability: 'high (no crash)'
}

console.log('\n=== Self-Stabilizing Ontology — Synthesis Report (2000 ticks) ===')
console.log(JSON.stringify({
  structuralCoherence,
  semanticFluidity: {
    lexicon: { totalTerms: lex.totalTerms, totalUsage: lex.totalUsage },
    entropy01
  },
  metaBehavioralAwareness: {
    selfMotion,
    infoEnergy,
    collective: world.getCollectiveEmotion?.() || null,
    worldTime: world.worldTime
  }
}, null, 2))

detach()
world.destroy()

