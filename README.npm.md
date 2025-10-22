# @v1b3x0r/mds-core

[![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

> **Entities with memory, emotion, and dialogue. 182 KB. Zero dependencies.**

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

## Choose Your Bundle

MDS offers 3 sizes depending on what you need:

### 🎯 Full Bundle (182 KB)
**When:** You need everything (LLM, semantic similarity, advanced features)

```javascript
import { World, LanguageGenerator, CollectiveIntelligence } from '@v1b3x0r/mds-core'
```

**Includes:**
- Memory, Emotion, Dialogue
- LLM integration (OpenAI/Anthropic/OpenRouter)
- Semantic similarity & clustering
- Advanced reasoning & learning

---

### ⚡ Lite Bundle (107 KB)
**When:** Simple NPCs, mobile games, prototypes

```javascript
import { World, Entity } from '@v1b3x0r/mds-core/lite'
```

**Includes:**
- Memory, Emotion, Dialogue
- Basic physics & rendering
- 41% smaller than full

**Missing:**
- LLM features
- Semantic similarity
- Cognitive/learning systems

---

### 🔍 Validator (17 KB)
**When:** You're building .mdm files and need validation

```javascript
import { validateMaterial } from '@v1b3x0r/mds-core/validator'

const result = validateMaterial(yourJSON)
if (!result.valid) {
  console.error('Errors:', result.errors)
}
```

---

**Start with Lite** to learn basics, **upgrade to Full** when you need LLM or advanced features.

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

## Advanced Features (v5.2+)

*(Available in Full bundle only)*

### Semantic Similarity
Find entities that are conceptually similar:

```javascript
import { MockSimilarityProvider, EntitySimilarityAdapter } from '@v1b3x0r/mds-core'

const provider = new MockSimilarityProvider()
const adapter = new EntitySimilarityAdapter(provider)

const similar = await adapter.findSimilar(entity, world.entities)
// Returns entities with similar essence
```

---

### Memory Crystallization
Turn repeated memories into long-term patterns:

```javascript
import { MemoryCrystallizer } from '@v1b3x0r/mds-core'

const crystallizer = new MemoryCrystallizer()
const crystals = crystallizer.crystallize(entity.memory.memories, Date.now())

// Example: 10 "met:Alice" memories → 1 crystal "Alice is a friend"
console.log('Patterns:', crystals.map(c => c.key))
```

---

### Emotion Affects Physics
Happy entities move faster, sad entities slower:

```javascript
import { SymbolicPhysicalCoupler, COUPLING_PRESETS } from '@v1b3x0r/mds-core'

const coupler = new SymbolicPhysicalCoupler(COUPLING_PRESETS.standard)

entity.emotion.valence = 0.8  // Happy
const physics = coupler.emotionToPhysics(entity.emotion)
console.log('Speed:', physics.speed)  // 1.24x faster when happy
```

---

### Smart Goal Selection
Entities reason about what to do next based on context:

```javascript
import { IntentReasoner } from '@v1b3x0r/mds-core'

const reasoner = new IntentReasoner()
const intent = { goal: 'explore', motivation: 0.5 }

const reasoned = reasoner.reason(intent, {
  emotion: entity.emotion,
  memories: entity.memory.memories
})

console.log('Confidence:', reasoned.confidence)  // 0.5 → 0.73 (boosted by happy emotion)
console.log('Reasoning:', reasoned.reasoning)    // ["Happy mood supports exploration"]
```

---

### Relationships Fade Over Time
Bonds weaken if entities don't interact:

```javascript
import { RelationshipDecayManager, DECAY_PRESETS } from '@v1b3x0r/mds-core'

const decay = new RelationshipDecayManager(DECAY_PRESETS.standard)
decay.tick(entity.relationships, Date.now())

// Relationships decay naturally without interaction
// trust: 0.9 → 0.7 (after 10 days of no contact)
```

---

**Why these matter:** Make NPCs feel **alive** instead of scripted. They remember patterns, reason about goals, and relationships evolve naturally.

---

### LLM Integration

Generate dynamic dialogue with AI:

```javascript
import { LanguageGenerator } from '@v1b3x0r/mds-core'

const llm = new LanguageGenerator({
  provider: 'openrouter',  // 'openrouter' | 'anthropic' | 'openai' | 'mock'
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'anthropic/claude-3.5-sonnet'
})

// Generate contextual dialogue
const response = await llm.generate({
  speaker: npcEntity,
  listener: playerEntity,
  context: 'Player just helped NPC escape from danger',
  tone: 'grateful',
  emotion: npcEntity.emotion
})

console.log(response.text)
// → "Thank you, friend. I won't forget this kindness."

// Dialogue adapts to emotion state automatically
npcEntity.emotion.valence = -0.6  // Make NPC sad
const sadResponse = await llm.generate({
  speaker: npcEntity,
  context: 'Player greets NPC',
  tone: 'neutral'
})

console.log(sadResponse.text)
// → "Oh... it's you. I'm not really in the mood to talk."
```

**Available Providers:**
- `openrouter` — Access 200+ models (Claude, GPT-4, Llama, etc.)
- `anthropic` — Direct Claude API
- `openai` — GPT-4/GPT-3.5
- `mock` — Local simulation (no API needed)

---

## Bundle Size

📦 **182 KB** minified (42 KB gzipped) — Full bundle
📦 **107 KB** minified (25 KB gzipped) — Lite bundle
📦 **17 KB** minified (3 KB gzipped) — Validator
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

## Recent Updates

### v5.2.2 (Oct 2025)
- ⚡ **LLM & WorldMind load instantly** — No async delays for real-time systems
- 📦 Bundle: 182 KB (optimized for immediate feature access)

### v5.2.1 (Oct 2025)
- 🔧 **Bundle optimization** — Lazy loading, code splitting, validator extraction
- 📦 Bundle: 168 KB → 182 KB (v5.2.2 reverted lazy loading)
- 📁 New lite bundle (107 KB) for minimal use cases

### v5.2.0 (Oct 2025)
- 🧠 **Semantic similarity** — Find entities by conceptual closeness
- 💎 **Memory crystallization** — Turn repeated memories into patterns
- ⚡ **Emotion-physics coupling** — Mood affects movement
- 🎯 **Intent reasoning** — Context-aware decision making
- 💔 **Relationship decay** — Bonds weaken naturally over time
- ✅ 192 tests (100% pass rate)

See [full changelog](https://github.com/v1b3x0r/mds/blob/main/docs/meta/CHANGELOG.md) for complete history.

---

## License

MIT © v1b3x0r

Built in Chiang Mai 🇹🇭

---

**Questions?** → [GitHub Issues](https://github.com/v1b3x0r/mds/issues)
**More examples?** → [Cookbook](https://github.com/v1b3x0r/mds/blob/main/docs/guides/COOKBOOK.md)
