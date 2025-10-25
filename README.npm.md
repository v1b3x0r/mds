# @v1b3x0r/mds-core

[![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

> **Entities that think together, feel together, evolve together. 221 KB. Zero dependencies.**

NPCs form networks, share memories, and spread emotions like viruses. No if-statements, no central control.

```bash
npm install @v1b3x0r/mds-core
```

---

## Game Dev: NPC That Remembers Everything

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({ features: { ontology: true } })

const npc = world.spawn({
  essence: 'Blacksmith who holds grudges',
  emotion: {
    transitions: [
      { trigger: 'player.attack', to: 'anger', intensity: 0.9 }
    ]
  },
  dialogue: {
    intro: [{ lang: { en: 'What do you want?' } }],
    onPlayerAttack: [{ lang: { en: 'You dare?!' } }]
  }
}, 200, 200)

// Before attack
console.log(npc.speak('intro'))  // → "What do you want?"

// Player attacks
npc.updateTriggerContext({ playerAction: 'attack' })
npc.checkEmotionTriggers()

// After attack
console.log('Mood:', npc.emotion.valence)  // → -0.54 (angry!)
console.log(npc.speak('onPlayerAttack'))   // → "You dare?!"

// Next session (saved/loaded)
const memories = npc.memory.recall({ type: 'interaction' })
console.log('NPC remembers', memories.length, 'interactions')
// NPC still remembers. Forever.

world.start()
```

**What you get:**
- Memory system (Ebbinghaus decay, high-salience retention)
- Emotion system (PAD model: Pleasure-Arousal-Dominance)
- Trigger-based state transitions (declarative in JSON)
- Automatic persistence (memories survive save/load)
- 60 FPS for ~50 NPCs

**Bundle:** 134 KB lite (no LLM), 221 KB full (with P2P cognition)

---

## Educator: Simulate Emotional Contagion

```javascript
import { World, resonate } from '@v1b3x0r/mds-core'

const world = new World({ features: { ontology: true } })

// Classroom simulation: 1 happy student, 2 neutral
const alice = world.spawn({ $schema: 'mdspec/v5.0', essence: 'Happy student' }, 100, 100)
const bob = world.spawn({ $schema: 'mdspec/v5.0', essence: 'Neutral student' }, 150, 100)
const charlie = world.spawn({ $schema: 'mdspec/v5.0', essence: 'Neutral student' }, 200, 100)

alice.emotion.valence = 0.8   // Happy
bob.emotion.valence = 0.0     // Neutral
charlie.emotion.valence = 0.0 // Neutral

// Form social network (students sitting near each other)
alice.connectTo(bob, { strength: 0.9 })
bob.connectTo(charlie, { strength: 0.8 })

// Simulate classroom session (happiness spreads over time)
setInterval(() => {
  resonate(bob.emotion, alice.emotion, 0.1)      // Bob catches Alice's mood
  resonate(charlie.emotion, bob.emotion, 0.1)    // Charlie catches Bob's mood

  console.log('Alice:', alice.emotion.valence.toFixed(2))    // 0.80 (stays happy)
  console.log('Bob:', bob.emotion.valence.toFixed(2))        // 0.45 (gets happier)
  console.log('Charlie:', charlie.emotion.valence.toFixed(2)) // 0.23 (also affected)
}, 1000)

world.start()

// After 30 seconds:
// Alice: 0.80 (source of happiness)
// Bob: 0.45 (infected by Alice)
// Charlie: 0.23 (secondary infection)
```

**Teaching concepts:**
- Emotional contagion (psychology)
- Network effects (sociology)
- Signal propagation with decay (physics)
- No formulas needed — just observe

**Works offline.** No API keys. Students can fork and experiment.

---

## Researcher: CRDT for Distributed Agents

```javascript
import { MemoryLog } from '@v1b3x0r/mds-core'

// Agent A observes sunrise
const agentA = new MemoryLog('agent-a')
agentA.append({
  timestamp: 0,
  type: 'observation',
  subject: 'world',
  content: { event: 'sunrise', beauty: 0.9 },
  salience: 0.8
})

// Agent B observes Agent A
const agentB = new MemoryLog('agent-b')
agentB.append({
  timestamp: 1,
  type: 'interaction',
  subject: 'agent-a',
  content: { greeting: 'Hello!' },
  salience: 0.7
})

// CRDT merge (zero conflicts, deterministic)
const result = agentA.merge(agentB)

console.log('Agent A memories:', agentA.size())  // → 2
console.log('Conflicts:', result.conflicts)      // → 0 (always!)
console.log('Added:', result.added)              // → 1

// Merge 100 times → same result (idempotent)
for (let i = 0; i < 100; i++) {
  agentA.merge(agentB)
}
console.log('Agent A memories:', agentA.size())  // → 2 (still!)

// Causal ordering preserved (vector clocks)
const memories = agentA.getMemories()
console.log(memories.map(m => m.content))
// → [{ event: 'sunrise', beauty: 0.9 }, { greeting: 'Hello!' }]
```

**Why CRDT matters:**
- Eventual consistency without coordination
- Conflict-free by design (not resolution)
- Vector clocks for causality tracking
- Perfect for multi-agent systems, P2P networks, offline-first apps

**Use cases:** Distributed AI, swarm robotics, collaborative simulations, blockchain off-chain data

---

## Indie Hacker: Prototype Social Network in 5 Minutes

```javascript
import { World, CognitiveNetwork } from '@v1b3x0r/mds-core'

const world = new World({ features: { ontology: true } })

// Spawn 50 users
const users = []
for (let i = 0; i < 50; i++) {
  const user = world.spawn({
    $schema: 'mdspec/v5.0',
    essence: `User ${i}`
  }, Math.random() * 800, Math.random() * 600)
  users.push(user)
}

// Build Small-World network (Watts-Strogatz)
const network = new CognitiveNetwork({ k: 6, p: 0.15 })
network.build(users)

// Each user connects to 6 neighbors + occasional long-range shortcuts
users.forEach(user => {
  console.log(`${user.m.essence}: ${user.getCognitiveLinksCount()} connections`)
})

// Get network stats
const stats = network.getStats()
console.log('Network size:', stats.nodeCount)
console.log('Total edges:', stats.edgeCount)
console.log('Avg degree:', stats.averageDegree)
console.log('Clustering:', stats.clusteringCoefficient)

// Periodic rewiring (simulate friend dynamics)
setInterval(() => {
  network.rewire(0.1)  // Rewire 10% of edges
  console.log('Network reshuffled!')
}, 30000)

world.start()
```

**Why Small-World?**
- Local clustering (friend groups stick together)
- Global reachability (6 degrees of separation)
- Same algorithm that models Facebook, Twitter, neural networks

**MVP features you get for free:**
- Friend networks with realistic topology
- Information propagation (via `ResonanceField`)
- Privacy controls (via `TrustSystem`)
- Offline-first (save/load entire network state)

**Build a chat app, game leaderboard, or collaborative tool in hours, not weeks.**

---

## AI Enthusiast: Trust & Privacy for AGI

```javascript
import { TrustSystem } from '@v1b3x0r/mds-core'

const trust = new TrustSystem({
  initialTrust: 0.5,
  trustThreshold: 0.6
})

// Entity decides what to share (privacy policies)
trust.setSharePolicy('memory', 'trust')    // Only share memories with trusted entities
trust.setSharePolicy('emotion', 'public')  // Share emotions freely
trust.setSharePolicy('intent', 'contextual') // Share goals only if important
trust.setSharePolicy('location', 'never')   // Never share location

// Interaction loop
trust.updateTrust('alice', +0.1)  // Positive interaction
trust.updateTrust('eve', -0.2)    // Negative interaction (deception detected)

// Check if should share data
console.log(trust.shouldShare('memory', 'alice'))  // → true (trust >= 0.6)
console.log(trust.shouldShare('memory', 'eve'))    // → false (trust < 0.6)
console.log(trust.shouldShare('emotion', 'eve'))   // → true (public policy)
console.log(trust.shouldShare('location', 'alice')) // → false (never policy)

// Get reputation stats
const stats = trust.getStats()
console.log('Trusted entities:', stats.trustedCount)
console.log('Untrusted entities:', stats.untrustedCount)
console.log('Average trust:', stats.averageTrust)

// Trust decays naturally over time (no interaction = forgot)
trust.decayTrust(10)  // 10 seconds passed
```

**Byzantine tolerance (future):**
- `deceive()` function (entities can lie about state)
- Privacy-preserving protocols (zero-knowledge proofs)
- Reputation systems (sybil attack resistance)

**For AGI research:** Entities need selective sharing to be realistic. Not all thoughts should be shared. Trust enables emergent cooperation without hardcoded rules.

---

## Core API

```javascript
// World
const world = new World({
  features: {
    ontology: true,      // Memory/Emotion/Intent
    communication: true, // Dialogue/Messages
    cognitive: true,     // Learning/Skills
    cognition: true      // P2P systems (NEW v5.5)
  },
  cognition: {
    network: { k: 8, p: 0.2 },         // Small-World config
    trust: { initialTrust: 0.5 },      // Trust config
    resonance: { decayRate: 0.2 }      // Signal decay
  }
})

// Entity
const entity = world.spawn(material, x, y)
entity.enable('memory', 'learning', 'relationships')  // Unified API
entity.speak('intro')                                 // Multilingual
entity.remember({ type: 'interaction', ... })         // Memory
entity.connectTo(other, { strength: 0.8 })           // Cognitive link
entity.reinforceLink(other.id, 0.1)                  // Strengthen bond
entity.decayCognitiveLinks(dt, 0.01)                 // Natural forgetting

// P2P Cognition (v5.5)
import { CognitiveNetwork, ResonanceField, TrustSystem, MemoryLog, resonate } from '@v1b3x0r/mds-core'

const network = new CognitiveNetwork({ k: 8, p: 0.2 })
network.build(entities)
network.rewire(0.1)

const field = new ResonanceField({ decayRate: 0.2, minStrength: 0.1 })
field.propagate(signal, source, entities)

const trust = new TrustSystem()
trust.setSharePolicy('memory', 'trust')
trust.shouldShare('memory', targetId)

const log = new MemoryLog(entityId)
log.append(memory)
log.merge(otherLog)

resonate(self.emotion, other.emotion, 0.5)  // Emotional contagion

// Save/Load
const snapshot = world.saveWorldFile()
const restored = World.loadWorldFile(snapshot)
```

---

## TypeScript Support

```typescript
import type {
  World,
  Entity,
  MdsMaterial,
  CognitiveNetwork,
  MemoryLog,
  TrustSystem,
  EmotionalState
} from '@v1b3x0r/mds-core'

const material: MdsMaterial = {
  essence: 'Typed entity',
  dialogue: {
    intro: [{ lang: { en: 'TypeScript knows me!' } }]
  }
}
```

Full type definitions included. IntelliSense works out of the box.

---

## React Integration

```jsx
import { useEffect, useRef } from 'react'
import { World } from '@v1b3x0r/mds-core'

function MDSWorld() {
  const worldRef = useRef(null)

  useEffect(() => {
    const world = new World({ features: { ontology: true } })
    worldRef.current = world

    const npc = world.spawn({
      essence: 'React NPC',
      dialogue: { intro: [{ lang: { en: 'Hello from React!' } }] }
    }, 100, 100)

    console.log(npc.speak('intro'))
    world.start()

    return () => {
      world.stop()
      world.destroy()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />
}
```

Works with React, Vue, Svelte, Solid. Also Node.js (headless mode).

---

## Bundle Sizes

**Full (221 KB)** — Everything (P2P cognition, LLM, semantic similarity)
**Lite (134 KB)** — Core only (memory, emotion, dialogue, physics)
**Validator (17 KB)** — Schema validation for .mdm files

All tree-shakeable ESM. Gzipped: 51 KB (full), 31 KB (lite), 3 KB (validator).

---

## Features

**Memory** — Ebbinghaus decay, high-salience retention, recall filters
**Emotion** — PAD model, trigger-based transitions, emotional contagion
**P2P Cognition (v5.5)** — Cognitive links, resonance fields, small-world networks, trust/privacy, CRDT memory
**Dialogue** — Multilingual (any language), auto-detect browser locale
**Learning** — Q-learning, skill progression, pattern detection
**Physics** — Semantic attraction/repulsion, emotion-affects-speed
**Save/Load** — WorldFile format, deterministic replay

---

## LLM Integration (Optional)

```javascript
import { World, LanguageGenerator } from '@v1b3x0r/mds-core'

const world = new World({
  features: { communication: true, languageGeneration: true },
  llm: {
    provider: 'openrouter',  // or 'anthropic' | 'openai' | 'mock'
    apiKey: process.env.OPENROUTER_KEY,
    languageModel: 'anthropic/claude-3.5-sonnet'
  }
})

const llm = new LanguageGenerator({
  provider: world.llm?.provider,
  apiKey: world.llm?.apiKey,
  model: world.llm?.languageModel
})

const response = await llm.generate({
  speaker: npc,
  listener: player,
  context: 'Player helped NPC escape danger',
  tone: 'grateful',
  emotion: npc.emotion
})

console.log(response.text)
// → "Thank you, friend. I won't forget this kindness."
```

**Providers:** OpenRouter (200+ models), Anthropic (Claude), OpenAI (GPT), Mock (local)

---

## Examples

**Game dev:** [heroblind.mdm](https://github.com/v1b3x0r/mds/blob/main/materials/entities/heroblind.mdm) — 277 lines of JSON, zero code, fully functional NPC
**Education:** [Classroom simulation](https://github.com/v1b3x0r/mds/blob/main/docs/examples/education.md) — Emotional contagion demo
**Research:** [Advanced integration](https://github.com/v1b3x0r/mds/blob/main/docs/examples/advanced.md) — React/Svelte/Node.js patterns

---

## Documentation

[GitHub README](https://github.com/v1b3x0r/mds#readme) — Overview
[API Reference](https://github.com/v1b3x0r/mds/blob/main/docs/REFERENCE.md) — Full docs
[MDSpec Guide](https://github.com/v1b3x0r/mds/blob/main/docs/guides/MDSPEC_GUIDE.md) — JSON schema
[Philosophy](https://github.com/v1b3x0r/mds/blob/main/docs/wtf-is-this-really.md) — Why this exists

---

## Recent Updates

**v5.5.0** — P2P Cognition Foundation
- Cognitive links (`entity.connectTo()`, `entity.reinforceLink()`)
- Resonance fields (signal propagation with decay)
- CRDT memory logs (conflict-free distributed memory)
- Emotional resonance (`resonate()` function)
- Small-World networks (Watts-Strogatz model)
- Trust & privacy systems (selective sharing)
- 88 new tests (100% pass)

**v5.4.0** — World events, entity reflection, emotion-aware dialogue
**v5.3.0** — Unified API, simplified LLM config

[Full changelog](https://github.com/v1b3x0r/mds/blob/main/docs/meta/CHANGELOG.md)

---

## Philosophy

**"Cultivation, not Control"** — You describe essence, behavior emerges.

**Traditional NPC:**
```javascript
if (player.near(npc) && npc.remembers(player) && player.attackedBefore) {
  npc.mood = "angry"
  npc.say("You again?!")
}
// 500 lines of if-statements
```

**MDS:**
```json
{
  "essence": "NPC who remembers violence",
  "emotion": {
    "transitions": [{ "trigger": "player.attack", "to": "anger" }]
  }
}
// 12 lines. NPC remembers. Forever. Automatically.
```

**Result:** NPCs that feel alive. Not scripted. Not predictable. Emergent.

---

**NEW in v5.5:** NPCs evolve together. Form networks. Share experiences. Spread emotions. Build trust. Deceive each other.

No central control. Just local interactions → global coherence.

Like real social systems. Like real minds.

---

## Browser Support

ES2020+, Chrome 80+, Firefox 74+, Safari 13.1+, Edge 80+, Node.js 18+

---

## License

MIT © v1b3x0r

Built in Chiang Mai 🇹🇭

---

**Questions?** → [GitHub Issues](https://github.com/v1b3x0r/mds/issues)
**More examples?** → [Cookbook](https://github.com/v1b3x0r/mds/blob/main/docs/guides/COOKBOOK.md)
