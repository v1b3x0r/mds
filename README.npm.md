# @v1b3x0r/mds-core

[![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

> **Entities with memory, emotion, and dialogue. 140 KB. Zero dependencies.**

**MDS (Material Definition System)** — Write JSON that talks, remembers, and feels. No if-statements needed.

---

## Quick Start

```bash
npm install @v1b3x0r/mds-core
```

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({ features: { ontology: true } })

const ghost = world.spawn({
  essence: 'Lonely ghost',
  dialogue: {
    intro: [{ lang: { en: 'Why am I alone?' } }]
  }
})

// Ghost speaks!
console.log(ghost.speak('intro'))  // → "Why am I alone?"

world.start()
```

**That's it.** Ghost exists, speaks, gets lonelier, fades away.

---

## Tutorial: Zero to Mindfuck in 10 Minutes

### 1. It Speaks (2 min)

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({ features: { ontology: true } })

const entity = world.spawn({
  essence: 'Curious shadow',
  dialogue: {
    intro: [{
      lang: {
        en: 'You see me, but do you remember me?',
        th: 'เธอเห็นฉัน... แต่เธอจำฉันได้ไหม?'
      }
    }]
  }
}, 200, 200)

// Speak (auto-detects browser language)
console.log(entity.speak('intro'))
// → "You see me, but do you remember me?" (or Thai if browser is th-TH)

// Force language
console.log(entity.speak('intro', 'th'))
// → "เธอเห็นฉัน... แต่เธอจำฉันได้ไหม?"

world.start()
```

**Mindfuck:** Multilingual dialogue with **zero translation libraries**. JSON only.

---

### 2. It Remembers & Reacts (5 min)

```javascript
const world = new World({ features: { ontology: true } })

const npc = world.spawn({
  essence: 'NPC who hates violence',
  emotion: {
    transitions: [
      {
        trigger: 'player.attack',
        to: 'anger',
        intensity: 0.9
      }
    ]
  },
  dialogue: {
    intro: [{ lang: { en: 'Hello, traveler.' } }],
    onPlayerAttack: [{ lang: { en: 'So you choose violence?' } }]
  }
}, 400, 300)

// Before attack
console.log(npc.speak('intro'))
// → "Hello, traveler."

// Simulate player attack
npc.updateTriggerContext({ playerAction: 'attack' })
npc.checkEmotionTriggers()

// After attack
console.log('Emotion:', npc.emotion.valence)  // → -0.54 (angry!)
console.log(npc.speak('onPlayerAttack'))      // → "So you choose violence?"

// NPC remembers forever (memory is automatic)
const memories = npc.memory.recall({ type: 'interaction' })
console.log('NPC remembers', memories.length, 'interactions')

world.start()
```

**Mindfuck:**
- Emotion changed automatically (trigger-based)
- Dialogue context-aware
- Memory persists forever

**All from JSON config.**

---

### 3. Multiple Entities Talk to Each Other (8 min)

```javascript
const world = new World({ features: { ontology: true, communication: true } })

// Spawn 2 entities with different emotions
const alice = world.spawn({
  essence: 'Happy person',
  dialogue: {
    self_monologue: [{
      lang: { en: 'What a beautiful day!' }
    }]
  }
}, 100, 200)

const bob = world.spawn({
  essence: 'Sad person',
  dialogue: {
    self_monologue: [{
      lang: { en: 'Why does everything hurt...' }
    }]
  }
}, 150, 200)  // Nearby (50px away)

// Set emotions
alice.emotion.valence = 0.8   // Happy
bob.emotion.valence = -0.7    // Sad

// Watch them affect each other
setInterval(() => {
  console.log('Alice:', alice.speak('self_monologue'), '| valence:', alice.emotion.valence.toFixed(2))
  console.log('Bob:', bob.speak('self_monologue'), '| valence:', bob.emotion.valence.toFixed(2))
}, 3000)

world.start()

// After 30s:
// Alice: "What a beautiful day!" | valence: 0.60 (getting sadder)
// Bob: "Why does everything hurt..." | valence: -0.45 (getting happier)
```

**Mindfuck:** **Emotional contagion** happens automatically. Bob's sadness "infects" Alice. Alice's happiness helps Bob.

**No "if Alice near Bob then..." code needed.**

---

## Load from .mdm Files

```javascript
import { World, loadMaterial } from '@v1b3x0r/mds-core'

// Load heroblind.mdm (example entity)
const heroblind = await fetch('/materials/entities/heroblind.mdm')
  .then(res => res.json())

const world = new World({ features: { ontology: true, communication: true } })
const entity = world.spawn(heroblind, 400, 300)

// Speak intro (multilingual)
console.log(entity.speak('intro'))
// → "You see me, but do you *remember* me?" (or TH/JA/ES depending on browser)

// Simulate player gazing for 6 seconds
entity.updateTriggerContext({ playerGazeDuration: 6 })
entity.checkEmotionTriggers()

// Emotion changed automatically!
console.log('Emotion:', entity.emotion.valence)  // → -0.12 (uneasy)

world.start()
```

See [heroblind.mdm](https://github.com/v1b3x0r/mds/blob/main/materials/entities/heroblind.mdm) for full example (277 lines of JSON, zero code).

---

## Core API

### World

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: {
    ontology: true,        // Enable memory/emotion/intent
    communication: true,   // Enable dialogue/messages
    cognitive: true,       // Enable learning/skills
    rendering: 'dom'       // 'dom' | 'canvas' | 'headless'
  },
  seed: 12345              // Deterministic random
})

// Spawn entity
const entity = world.spawn(material, { x: 200, y: 200 })

// Start simulation
world.start()

// Save/load
const snapshot = world.saveWorldFile()
localStorage.setItem('world', snapshot)

// Restore
const loaded = World.loadWorldFile(localStorage.getItem('world'))
loaded.start()
```

### Entity

```javascript
// Dialogue
entity.speak('intro')              // Auto-detect language
entity.speak('onPlayerClose', 'th') // Force Thai

// Emotion
entity.updateTriggerContext({ playerAction: 'attack' })
entity.checkEmotionTriggers()
console.log(entity.emotion.valence)  // -1..1 (negative = bad mood)

// Memory
entity.remember({
  type: 'interaction',
  subject: 'player',
  timestamp: world.worldTime,
  salience: 1.0
})

const memories = entity.memory.recall({ type: 'interaction' })
console.log('Remembered', memories.length, 'interactions')
```

---

## React Integration

```jsx
import { useEffect, useRef } from 'react'
import { World } from '@v1b3x0r/mds-core'

function MDSWorld() {
  const containerRef = useRef(null)
  const worldRef = useRef(null)

  useEffect(() => {
    const world = new World({ features: { ontology: true } })
    worldRef.current = world

    const ghost = world.spawn({
      essence: 'React ghost',
      dialogue: {
        intro: [{ lang: { en: 'Hello from React!' } }]
      }
    }, 100, 100)

    console.log(ghost.speak('intro'))  // → "Hello from React!"

    if (containerRef.current && ghost.el) {
      containerRef.current.appendChild(ghost.el)
    }

    world.start()

    return () => {
      world.stop()
      world.destroy()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />
}
```

---

## TypeScript

Full type definitions included:

```typescript
import type {
  World,
  Entity,
  MdsMaterial,
  MdsDialogueConfig,
  MdsEmotionConfig
} from '@v1b3x0r/mds-core'

const material: MdsMaterial = {
  essence: 'Typed entity',
  dialogue: {
    intro: [{ lang: { en: 'TypeScript knows me!' } }]
  },
  emotion: {
    transitions: [
      { trigger: 'player.attack', to: 'anger', intensity: 0.9 }
    ]
  }
}
```

---

## Features

### 🧠 Memory System
- Ebbinghaus forgetting curve (memories decay naturally)
- High-salience events remembered longer
- Recall by type, subject, time range

### 💚 Emotion System
- PAD model: Valence (happy/sad), Arousal (calm/excited), Dominance (control)
- **Trigger-based transitions** (declarative in JSON)
- Emotional contagion (proximity-based)

### 💬 Dialogue System
- **Multilingual support** (EN, TH, JA, ES, ZH, AR, or any language)
- Auto-detects browser language
- Event-driven phrases (intro, onPlayerClose, self_monologue, etc.)

### 🎓 Learning System
- Q-learning reinforcement
- Skill progression
- Pattern detection

### 💾 Save/Load
- WorldFile format (save entire simulation state)
- Memories + emotions + relationships persist
- Deterministic replay with seeded random

### 🌍 Info-Physics
- Entities move based on **semantic similarity**
- Emotion-based attraction/repulsion
- Environmental effects (temperature, weather)

---

## Bundle Size

📦 **140 KB** minified (33 KB gzipped)
⚡ **60 FPS** for ~50 entities
🌲 **Tree-shakeable** ESM

---

## Examples

- [heroblind.mdm](https://github.com/v1b3x0r/mds/blob/main/materials/entities/heroblind.mdm) — Full entity with multilingual dialogue + emotion triggers
- [Gaming Guide](https://github.com/v1b3x0r/mds/blob/main/docs/examples/gaming.md) — NPCs that hold grudges
- [Education Guide](https://github.com/v1b3x0r/mds/blob/main/docs/examples/education.md) — Classroom simulations
- [Advanced Integration](https://github.com/v1b3x0r/mds/blob/main/docs/examples/advanced.md) — React/Svelte/Node

---

## Documentation

- [GitHub README](https://github.com/v1b3x0r/mds#readme) — User-friendly overview
- [API Reference](https://github.com/v1b3x0r/mds/blob/main/docs/REFERENCE.md) — Full API docs
- [MDSpec Guide](https://github.com/v1b3x0r/mds/blob/main/docs/guides/MDSPEC_GUIDE.md) — JSON schema reference
- [Philosophy](https://github.com/v1b3x0r/mds/blob/main/docs/wtf-is-this-really.md) — Why this exists

---

## Browser Support

- ES2020+
- Modern browsers (Chrome 80+, Firefox 74+, Safari 13.1+, Edge 80+)
- Node.js 18+

---

## License

MIT © v1b3x0r

Built in Chiang Mai 🇹🇭

---

**Questions?** → [GitHub Issues](https://github.com/v1b3x0r/mds/issues)
**More examples?** → [Cookbook](https://github.com/v1b3x0r/mds/blob/main/docs/guides/COOKBOOK.md)
