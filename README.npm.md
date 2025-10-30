# @v1b3x0r/mds-core

[![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

> **Entities that need water. Worlds that remember death. JSON with survival instinct. 360 KB. Zero dependencies.**

NPCs get thirsty, compete for resources, and speak about their needs. Death creates grief that spreads across all entities. No if-statements, no central control.

```bash
npm install @v1b3x0r/mds-core
```

---

## Desert Survival: 3 Entities Competing for Water

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: { ontology: true, linguistics: true, rendering: 'headless' }
})

// Add limited water source
world.addResourceField({
  id: 'well',
  resourceType: 'water',
  type: 'point',
  position: { x: 250, y: 250 },
  intensity: 1.0,
  depletionRate: 0.02,      // Depletes quickly
  regenerationRate: 0.005    // Regenerates slowly
})

// Spawn 3 thirsty travelers
for (let i = 0; i < 3; i++) {
  world.spawn({
    essence: `Traveler ${i}`,
    needs: {
      resources: [{
        id: 'water',
        depletionRate: 0.015,  // Gets thirsty over time
        criticalThreshold: 0.3,
        emotionalImpact: {
          valence: -0.6,  // Becomes sad
          arousal: 0.4,   // Becomes stressed
          dominance: -0.3 // Feels helpless
        }
      }]
    }
  }, { x: 100 + i * 100, y: 100 })
}

// Simulate 90 seconds
for (let i = 0; i < 90; i++) {
  world.tick(1)
}

// Result:
// 💀 All 3 travelers died of thirst
// 💧 Water well: 1% remaining
// 🌍 Emotional climate: "grieving and depleted and discordant"
// 💬 Entities spoke: "water...", "So thirsty...", "water please"
// 📚 World lexicon crystallized survival vocabulary
```

**Run full demo:** `node node_modules/@v1b3x0r/mds-core/demos/desert-survival.mjs`

---

## What You Get

### 🏜️ **Material Pressure** (v5.9)
- **Resource needs** (water, food, energy) that deplete over time
- **Spatial resources** (wells, oases, lakes) that regenerate/deplete
- **Emergent speech** (entities speak when thirsty: "Need water!")
- **Emotional climate** (death creates grief that affects all entities)
- **Lexicon formation** (phrases crystallize into shared vocabulary)

### 🧠 **Memory**
- Entities remember interactions (Ebbinghaus decay curve)
- Important events stick longer
- Full save/load support

### 💚 **Emotion**
- PAD model (Pleasure, Arousal, Dominance)
- Emotional contagion between entities
- Climate influence (collective grief affects individuals)

### 💬 **Emergent Language**
- Multilingual support (entities speak EN, TH, JA, etc.)
- Auto-generated phrases based on internal state
- Speech crystallizes into world lexicon

### 🌍 **World-Mind**
- Collective emotional climate (grief, vitality, tension, harmony)
- World "remembers" death and suffering
- Population statistics and pattern detection

### 🎓 **Learning & Skills**
- Q-learning (entities learn from rewards)
- Skill progression (practice makes perfect)
- Intent reasoning

### 🌊 **Physics**
- Environmental effects (temperature, humidity)
- Collision detection
- Info-physics (semantic attraction/repulsion)

---

## Quick Start: Thirsty Entity

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({ features: { ontology: true } })

const entity = world.spawn({
  essence: 'Thirsty traveler',
  needs: {
    resources: [
      { id: 'water', initial: 0.8, depletionRate: 0.01 }
    ]
  }
}, { x: 100, y: 100 })

// Tick world
world.tick(1)

// Check status
console.log(entity.getNeed('water').current)  // → 0.79
console.log(entity.isCritical('water'))       // → false

// After 60 seconds...
for (let i = 0; i < 60; i++) world.tick(1)

console.log(entity.isCritical('water'))       // → true
console.log(entity.speakAboutNeeds())         // → "Need water"
console.log(entity.emotion.valence)           // → -0.54 (sad!)
```

---

## Resource Fields API

```javascript
// Point source (water well)
world.addResourceField({
  id: 'well',
  resourceType: 'water',
  type: 'point',
  position: { x: 250, y: 250 },
  intensity: 1.0,
  regenerationRate: 0.005
})

// Area source (oasis)
world.addResourceField({
  id: 'oasis',
  resourceType: 'water',
  type: 'area',
  area: { x: 100, y: 100, width: 50, height: 50 },
  intensity: 0.8
})

// Gradient source (lake with falloff)
world.addResourceField({
  id: 'lake',
  resourceType: 'water',
  type: 'gradient',
  gradient: { center: { x: 300, y: 300 }, radius: 100, falloff: 0.8 },
  intensity: 1.0
})

// Entity consumes from field
const consumed = world.consumeResource('water', entity.x, entity.y, 0.3)
entity.satisfyNeed('water', consumed)
```

---

## Emotional Climate API

```javascript
// Death affects world climate
world.recordEntityDeath(entity, 0.9)  // High intensity

// Get climate state
const climate = world.getEmotionalClimate()
console.log(climate.grief)      // → 0.84 (84%)
console.log(climate.vitality)   // → 0.16 (16%)
console.log(climate.tension)    // → 0.42
console.log(climate.harmony)    // → 0.23

// Describe climate
import { CollectiveIntelligence } from '@v1b3x0r/mds-core'
const desc = CollectiveIntelligence.describeClimate(climate)
console.log(desc)  // → "grieving and depleted and tense"

// Climate automatically affects all entities
// Survivors feel collective grief
// World "remembers" loss
```

---

## Core API

```javascript
// World
const world = new World({
  features: {
    ontology: true,       // Memory/Emotion/Intent
    linguistics: true,    // Emergent language
    communication: true,  // Dialogue/Messages
    cognitive: true,      // Learning/Skills
    physics: true         // Environmental effects
  }
})

// Entity
const entity = world.spawn(material, { x, y })
entity.enable('memory', 'learning', 'relationships')

// Needs
entity.getNeed('water')                  // Get need state
entity.satisfyNeed('water', 0.3)         // Satisfy need
entity.isCritical('water')               // Check if critical
entity.getCriticalNeeds()                // Get all critical needs
entity.speakAboutNeeds()                 // Generate speech

// Memory
entity.remember({ type: 'interaction', subject: 'player', ... })
entity.memory.recall({ type: 'interaction' })

// Emotion
entity.feel({ valence: 0.5, arousal: 0.3, dominance: 0.5 })

// Dialogue
entity.speak('intro')  // Multilingual support

// Resources
world.addResourceField({ id, resourceType, type, ... })
world.consumeResource('water', x, y, amount)
world.findNearestResourceField(x, y, 'water')

// Climate
world.recordEntityDeath(entity, intensity)
world.getEmotionalClimate()

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
  Need,
  ResourceField,
  EmotionalClimate,
  EmotionalState
} from '@v1b3x0r/mds-core'

const material: MdsMaterial = {
  essence: 'Typed entity',
  needs: {
    resources: [
      { id: 'water', depletionRate: 0.01 }
    ]
  }
}

const entity: Entity = world.spawn(material, { x: 100, y: 100 })
const need: Need | undefined = entity.getNeed('water')
const climate: EmotionalClimate = world.getEmotionalClimate()
```

Full type definitions included. IntelliSense works out of the box.

---

## React Integration

```jsx
import { useEffect, useRef } from 'react'
import { World } from '@v1b3x0r/mds-core'

function DesertWorld() {
  const worldRef = useRef(null)

  useEffect(() => {
    const world = new World({
      features: { ontology: true, linguistics: true }
    })
    worldRef.current = world

    // Add water source
    world.addResourceField({
      id: 'well',
      resourceType: 'water',
      type: 'point',
      position: { x: 250, y: 250 },
      intensity: 1.0
    })

    // Spawn thirsty entity
    const entity = world.spawn({
      essence: 'Traveler',
      needs: { resources: [{ id: 'water', depletionRate: 0.01 }] }
    }, { x: 100, y: 100 })

    world.start()

    return () => {
      world.stop()
      world.destroy()
    }
  }, [])

  return <div style={{ width: '100%', height: '400px' }} />
}
```

Works with React, Vue, Svelte, Solid. Also Node.js (headless mode).

---

## Bundle Sizes

- **Full bundle**: 359.66 KB (88.30 KB gzipped)
- **Lite bundle**: 266.80 KB (67.15 KB gzipped) — core only, no LLM
- **Validator**: 25.86 KB (4.38 KB gzipped) — dev/test helper

All tree-shakeable ESM. Zero dependencies.

---

## Examples

**Desert Demo:** [`demos/desert-survival.mjs`](https://github.com/v1b3x0r/mds/blob/main/demos/desert-survival.mjs) — 3 entities competing for water
**heroblind.mdm:** [materials/entities/heroblind.mdm](https://github.com/v1b3x0r/mds/blob/main/materials/entities/heroblind.mdm) — 277 lines of JSON, fully functional NPC
**Tests:** 192 tests demonstrating all features

---

## Documentation

- [GitHub README](https://github.com/v1b3x0r/mds#readme) — Overview & philosophy
- [API Reference](https://github.com/v1b3x0r/mds/blob/main/docs/REFERENCE.md) — Full API docs
- [MDSpec Guide](https://github.com/v1b3x0r/mds/blob/main/docs/guides/MDSPEC_GUIDE.md) — JSON schema
- [Philosophy](https://github.com/v1b3x0r/mds/blob/main/docs/wtf-is-this-really.md) — Why this exists
- [Cookbook](https://github.com/v1b3x0r/mds/blob/main/docs/guides/COOKBOOK.md) — Recipes & patterns

---

## What's New in v5.9

### 🏜️ Phase 1: Material Pressure System

**Resource Needs**
- Entities have needs (water, food, energy) that deplete over time
- Critical needs affect emotion (PAD model)
- Entities speak about their needs automatically
- Complete needs API (`getNeed`, `satisfyNeed`, `isCritical`)

**Spatial Resources**
- ResourceField system with 3 types: point, area, gradient
- Fields regenerate and deplete naturally
- Entities consume from nearby fields
- Multiple entities compete for limited resources

**Emotional Climate**
- World develops collective emotional atmosphere
- Death creates grief that affects all survivors
- Climate dimensions: grief, vitality, tension, harmony
- Climate automatically decays and influences entities

**Emergent Language**
- Entities speak when needs are critical
- Speech varies by severity (desperate → urgent → moderate)
- Utterances crystallize into world lexicon
- Multilingual support (English, Thai)

**Demo**
- Desert survival: 3 entities, 1 water well, emergent behavior
- Run: `node demos/desert-survival.mjs`

**Tests**
- 27 new tests covering all Phase 1 features
- 192 total tests, 100% pass rate

See [full changelog](https://github.com/v1b3x0r/mds/blob/main/CHANGELOG.md)

---

## Philosophy

> **"Cultivation, not Control"**

Traditional software: You program every behavior explicitly.
MDS: You describe essence, behavior emerges naturally.

**Traditional NPC:**
```javascript
if (entity.waterLevel < 0.3) {
  entity.emotion.valence = -0.5
  entity.speak(pickRandomThirstyDialogue(entity.language))
  // ... 500 lines of if-statements
}
```

**MDS:**
```json
{
  "essence": "Desert traveler",
  "needs": {
    "resources": [{
      "id": "water",
      "depletionRate": 0.015,
      "criticalThreshold": 0.3
    }]
  }
}
```

**Result:** Entity automatically gets thirsty, becomes stressed, speaks about it, seeks water, and affects world climate if it dies. **12 lines of JSON. Zero code.**

---

## Use Cases

- 🎮 **Games** with survival mechanics (hunger, thirst, exhaustion)
- 🏫 **Education** (ecosystems, resource competition, emergent behavior)
- 🔬 **Research** (agent-based models, multi-agent systems)
- 🎨 **Art** (emotional systems, living installations)
- 📖 **Interactive stories** where environment affects characters
- 🤖 **AI** (embodied agents with needs and emotions)

---

## Browser Support

ES2020+, Chrome 80+, Firefox 74+, Safari 13.1+, Edge 80+, Node.js 18+

---

## License

MIT © v1b3x0r

Built in Chiang Mai, Thailand 🇹🇭

---

**Questions?** → [GitHub Issues](https://github.com/v1b3x0r/mds/issues)
**More examples?** → [Cookbook](https://github.com/v1b3x0r/mds/blob/main/docs/guides/COOKBOOK.md)
**Desert Demo:** `node node_modules/@v1b3x0r/mds-core/demos/desert-survival.mjs`
