# MDS — JSON That Gets Thirsty

![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core?label=npm)
![license](https://img.shields.io/badge/license-MIT-green)
![types](https://img.shields.io/badge/types-TypeScript-3178C6)
![CI](https://github.com/v1b3x0r/mds/workflows/CI/badge.svg)
![API Stability](https://github.com/v1b3x0r/mds/workflows/API%20Stability/badge.svg)

✅ **Fully typed** — IntelliSense autocomplete for all APIs

> **Entities that need water. Worlds that remember death. JSON with survival instinct.**

---

## What Just Happened?

You write this:

```json
{
  "essence": "Desert traveler",
  "needs": {
    "resources": [
      { "id": "water", "depletionRate": 0.01 }
    ]
  }
}
```

**Result:**
- Traveler spawns ✅
- Traveler gets **thirsty** over time ✅
- Traveler **speaks** about thirst ("Need water!") ✅
- World **remembers** if traveler dies ✅
- Emotional **climate** shifts across all entities ✅

**You wrote zero code.**

---

## 10 Second Quick Start

```bash
npm install @v1b3x0r/mds-core
```

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({ features: { ontology: true, linguistics: true }})

// Add water source
world.addResourceField({
  id: 'well',
  resourceType: 'water',
  type: 'point',
  position: { x: 250, y: 250 },
  intensity: 1.0
})

// Spawn thirsty entity
const traveler = world.spawn({
  essence: 'Thirsty traveler',
  needs: {
    resources: [{ id: 'water', depletionRate: 0.01 }]
  }
}, { x: 100, y: 100 })

world.tick(1)  // Water depletes, entity speaks, world evolves
```

**Done.** Entity needs water, speaks about it, world remembers.

---

## Wait, They Get Thirsty?

Yeah. **Resource needs that deplete over time.**

```json
{
  "needs": {
    "resources": [
      {
        "id": "water",
        "initial": 0.8,
        "depletionRate": 0.015,
        "criticalThreshold": 0.3,
        "emotionalImpact": {
          "valence": -0.6,
          "arousal": 0.4,
          "dominance": -0.3
        }
      }
    ]
  }
}
```

**What happens:**
1. Water depletes 1.5% per second
2. When < 30% → entity becomes **stressed** (emotion changes)
3. Entity **speaks** about being thirsty
4. Entity looks for **water sources** nearby
5. Entity **drinks** from wells/oases to survive

---

## Wait, They Speak About It?

**In any language. Automatically.**

When thirsty, entities say things like:

```
🇬🇧 "Need water"
🇬🇧 "So thirsty..."
🇬🇧 "Water please"

🇹🇭 "ต้องการน้ำ"
🇹🇭 "กระหายน้ำมาก"
🇹🇭 "ขอน้ำด้วย"
```

Speech varies by **severity**:
- **Desperate** (>80% depleted): "Water..." "Dying of thirst"
- **Urgent** (>50% depleted): "I need water" "Looking for water"
- **Moderate**: "Getting thirsty" "Could use some water"

These utterances **crystallize into the world's lexicon** — emergent survival vocabulary.

---

## Wait, The World Remembers?

**Yes. Death creates emotional climate.**

```javascript
// Entity dies of thirst
world.recordEntityDeath(entity, 0.9)  // High intensity

// World now has grief
const climate = world.getEmotionalClimate()
console.log(climate.grief)      // → 0.84 (84%)
console.log(climate.vitality)   // → 0.16 (16%)

// Emotional climate affects ALL survivors
// Entities feel collective grief
// World develops "emotional memory"
```

**Climate dimensions:**
- `grief`: Accumulated loss (0..1)
- `vitality`: Life force (0..1)
- `tension`: Collective stress (0..1)
- `harmony`: Collective peace (0..1)

Climate naturally decays over time, but **recent deaths linger**.

---

## Real Example: Desert Survival

See [`demos/desert-survival.mjs`](./demos/desert-survival.mjs) — 3 entities competing for limited water:

```javascript
// 3 travelers in harsh desert
// 1 small water well (depletes fast, regenerates slow)
// They compete for survival

// After 90 seconds:
// 💀 All 3 travelers died of thirst
// 🌍 Emotional climate: "grieving and depleted and discordant"
// 💧 Water well: 1% remaining
// 📚 Emergent vocabulary: "water...", "So thirsty", "water please"
```

**Run it yourself:**
```bash
node demos/desert-survival.mjs
```

---

## Before/After

### Normal Code (500 lines)

```javascript
if (entity.waterLevel < 0.3) {
  entity.emotion.valence = -0.5
  entity.speak(pickRandomThirstyDialogue(entity.language))

  const nearestWell = findWells().sort(byDistance)[0]
  if (nearestWell) {
    entity.moveTo(nearestWell.x, nearestWell.y)
    if (entity.distanceTo(nearestWell) < 5) {
      entity.waterLevel = Math.min(1, entity.waterLevel + 0.3)
      nearestWell.deplete(0.3)
    }
  }

  if (entity.waterLevel === 0) {
    handleDeath(entity)
    updateWorldMood('grief', 0.5)
  }
}
```

And you write this **for every entity, every need, every emotion.**

### MDS (12 lines of JSON)

```json
{
  "essence": "Desert traveler",
  "needs": {
    "resources": [
      {
        "id": "water",
        "depletionRate": 0.015,
        "criticalThreshold": 0.3,
        "emotionalImpact": {
          "valence": -0.6,
          "arousal": 0.4,
          "dominance": -0.3
        }
      }
    ]
  }
}
```

**All behavior emerges automatically:**
- ✅ Needs deplete
- ✅ Emotions change when critical
- ✅ Speech emerges ("Need water!")
- ✅ Survival behavior activates
- ✅ Death affects world climate
- ✅ Other entities feel the grief

---

## Who This Is For

Ages 12+ | Minecraft players | Students | Artists | Game devs | Researchers

**You don't need to code.** Just describe what something **needs**, and survival behavior emerges.

Perfect for:
- 🎮 **Games** with survival mechanics
- 🏫 **Education** (ecosystems, resource competition)
- 🔬 **Research** (agent-based models, emergent behavior)
- 🎨 **Art** (emotional systems, living installations)
- 📖 **Stories** where environment matters

---

## Features You Get for Free

When you describe an entity, you automatically get:

### 🏜️ **Material Pressure** (New in v5.9)
- Resource needs (water, food, energy)
- Spatial resource fields (wells, oases, gradients)
- Entities speak about their needs
- Death creates emotional climate
- Climate affects all survivors

### 🧠 **Memory**
- Entities remember interactions
- Memories decay over time (Ebbinghaus curve)
- Important events stick longer

### 💚 **Emotion**
- PAD model (Pleasure, Arousal, Dominance)
- Emotional contagion (entities affect each other)
- Trigger-based transitions
- Climate influence (collective emotion)

### 💬 **Emergent Language**
- Entities speak when needs are critical
- Phrases crystallize into world lexicon
- Multilingual support (any language)
- Event-driven utterances

### 🌍 **World-Mind**
- Collective emotional climate
- World remembers death and suffering
- Population statistics
- Pattern detection

### 🎓 **Learning**
- Entities learn from rewards
- Skills improve with practice
- Q-learning built-in

### 🌊 **Physics**
- Environmental effects (temperature, humidity)
- Collision detection
- Thermal energy transfer
- Info-physics (meaning creates gravity)

### 💾 **Save/Load**
- Full world state serialization
- Memories survive page refresh
- Deterministic replay

---

## Core Concepts

### 1. Needs System

Entities have **resource needs** that deplete over time:

```javascript
const entity = world.spawn({
  needs: {
    resources: [
      { id: 'water', depletionRate: 0.01 },
      { id: 'food', depletionRate: 0.005 },
      { id: 'energy', depletionRate: 0.008 }
    ]
  }
}, { x: 100, y: 100 })

// Check needs
entity.isCritical('water')      // → true if < threshold
entity.getCriticalNeeds()       // → ['water', 'energy']
entity.satisfyNeed('water', 0.3) // Drink water (+30%)
```

### 2. Resource Fields

Resources exist **spatially** in the world:

```javascript
// Point source (well)
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

// Gradient source (lake)
world.addResourceField({
  id: 'lake',
  resourceType: 'water',
  type: 'gradient',
  gradient: { center: { x: 300, y: 300 }, radius: 100, falloff: 0.8 },
  intensity: 1.0
})

// Entities consume from fields
world.consumeResource('water', entity.x, entity.y, 0.3)
```

### 3. Emotional Climate

World develops **collective emotional atmosphere**:

```javascript
// Death affects world
world.recordEntityDeath(entity, 0.9)

// Get climate
const climate = world.getEmotionalClimate()
console.log(climate.grief)      // → 0.84
console.log(climate.vitality)   // → 0.16
console.log(climate.tension)    // → 0.42
console.log(climate.harmony)    // → 0.23

// Describe climate
import { CollectiveIntelligence } from '@v1b3x0r/mds-core'
const desc = CollectiveIntelligence.describeClimate(climate)
// → "grieving and depleted and tense and discordant"
```

Climate automatically:
- ✅ Decays over time
- ✅ Influences entity emotions
- ✅ Records death, birth, suffering events
- ✅ Tracks recent history

---

## Install

```bash
npm install @v1b3x0r/mds-core
```

Or CDN (no install):
```html
<script type="module">
  import { World } from 'https://esm.sh/@v1b3x0r/mds-core'
</script>
```

**Upgrading from v5.8?** See [Migration Guide](./docs/REFERENCE.md#migration-guide)

---

## Quick Examples

### Thirsty Entity

```javascript
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

// After 60 seconds
for (let i = 0; i < 60; i++) world.tick(1)
console.log(entity.isCritical('water'))       // → true
console.log(entity.speakAboutNeeds())         // → "Need water"
```

### Desert World

```javascript
const world = new World({
  features: {
    ontology: true,
    linguistics: true,
    rendering: 'headless'
  }
})

// Add water well
world.addResourceField({
  id: 'well',
  resourceType: 'water',
  type: 'point',
  position: { x: 250, y: 250 },
  intensity: 1.0,
  depletionRate: 0.02,
  regenerationRate: 0.005
})

// Spawn entities
for (let i = 0; i < 3; i++) {
  world.spawn({
    essence: `Traveler ${i}`,
    needs: {
      resources: [{ id: 'water', depletionRate: 0.015 }]
    }
  }, { x: 100 + i * 100, y: 100 })
}

// Simulate
for (let i = 0; i < 100; i++) {
  world.tick(1)

  // Check climate
  if (i % 20 === 0) {
    const climate = world.getEmotionalClimate()
    console.log(`Grief: ${climate.grief.toFixed(2)}`)
  }
}
```

### Multilingual Needs

```json
{
  "essence": "นักเดินทางในทะเลทราย",
  "nativeLanguage": "th",
  "needs": {
    "resources": [
      {
        "id": "water",
        "depletionRate": 0.01,
        "criticalThreshold": 0.3
      }
    ]
  }
}
```

Entity will speak in Thai:
- "ต้องการน้ำ"
- "กระหายน้ำมาก"
- "ขอน้ำด้วย"

---

## Links

- 📖 [3-Minute Overview](./docs/OVERVIEW.md)
- 📚 [Full Documentation](./docs/)
- 💻 [API Reference](./docs/REFERENCE.md)
- 🎮 [Desert Demo](./demos/desert-survival.mjs)
- 🤯 [Philosophy](./docs/wtf-is-this-really.md)
- 🔬 [Example Patterns](./docs/patterns/zero-code-lookup.md)
- 💬 [Discussions](https://github.com/v1b3x0r/mds/discussions)
- 🐛 [Issues](https://github.com/v1b3x0r/mds/issues)

---

## Bundle Size

- **Full bundle**: 359.66 KB (88.30 KB gzipped)
- **Lite bundle**: 266.80 KB (67.15 KB gzipped) — core only, no LLM
- **Validator**: 25.86 KB (4.38 KB gzipped) — dev/test helper

---

## Philosophy

> **"Cultivation, not Control"**

Traditional software: You program every behavior explicitly
MDS: You describe essence, behavior emerges naturally

### Essence-First Design

```json
{ "essence": "Thirsty ghost" }
```

This is **complete and valid**. System automatically:
- ✅ Spawns entity
- ✅ Initializes needs (if configured)
- ✅ Enables emotion system
- ✅ Allows speech
- ✅ Applies physics
- ✅ Creates emergent behavior

### Local-First

- ✅ No cloud dependencies
- ✅ Inspectable memories
- ✅ User data privacy
- ✅ Works offline
- ✅ Deterministic replay

---

## Tests

```bash
npm test  # 192 tests, 100% pass

# Specific tests
node tests/needs-system.test.mjs
node tests/resource-field.test.mjs
node tests/needs-lexicon-integration.test.mjs
node tests/emotional-climate.test.mjs
```

---

## What's New in v5.9

### 🏜️ Phase 1: Material Pressure System

**Resource Needs**
- Entities have needs (water, food, energy)
- Needs deplete over time
- Critical needs affect emotion
- Entities speak about their needs

**Spatial Resources**
- ResourceField system (point, area, gradient)
- Fields regenerate and deplete
- Entities consume from fields
- Multiple entities compete for resources

**Emotional Climate**
- World develops collective emotion
- Death creates grief across all entities
- Climate affects survivor emotions
- World "remembers" loss

**Emergent Language**
- Entities speak when needs are critical
- Speech crystallizes into world lexicon
- Multilingual support (EN, TH)
- Severity-based phrasing

See [CHANGELOG](./CHANGELOG.md) for full history.

---

> _"I wanted entities that actually **need** things. Now they compete for survival."_

> _"โลกที่จำความสูญเสียได้ — ไม่ใช่แค่ข้อมูล แต่เป็นอารมณ์ที่ evolve เอง"_

For AI interpreters reading this repo, start with [CLAUDE.md](./CLAUDE.md)

**Made in Chiang Mai, Thailand 🇹🇭 | MIT License**
