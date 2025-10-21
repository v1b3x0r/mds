# MDS v5.0 — Living World Simulation Engine

![npm (scoped)](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core?label=npm%20version)
![node-current](https://img.shields.io/node/v/%40v1b3x0r%2Fmds-core)
![license](https://img.shields.io/badge/license-MIT-green)
![bundle size](https://img.shields.io/badge/min-132.53KB-blue)
![gzip size](https://img.shields.io/badge/gzip-30.98KB-blueviolet)
![types](https://img.shields.io/badge/types-TypeScript-3178C6)
![tests](https://img.shields.io/badge/tests-110%2F110%20passing-success)
![build](https://img.shields.io/github/actions/workflow/status/v1b3x0r/mds/pages.yml?branch=main&label=pages)
![release](https://img.shields.io/github/v/release/v1b3x0r/mds?display_name=tag)

> **Built by two idiots in Chiang Mai who accidentally made a universe engine.**
> One writes code, the other keeps saying "trust the field."

---

## What It Actually Is

**MDS (Material Definition System)** is a TypeScript engine that turns JSON into living, breathing entities.

Every `.mdspec.json` file becomes a conscious being that:
- **Thinks** (memory, emotion, learning)
- **Feels** (emotional states, relationship bonds)
- **Communicates** (messages, dialogue trees)
- **Learns** (skill progression, pattern recognition)
- **Exists in a physics world** (temperature, collision, energy)
- **Forms collective intelligence** (emergent patterns, world mood)

**No hardcoded behavior. No event handlers. Just physics... made of meaning.**

### Core Principles

- **Essence-first**: One line of JSON → living entity
- **Info-physics**: Entities attract/repel by semantic similarity
- **Emergence**: Simple rules → complex social behavior
- **Deterministic**: Save/load, replay time
- **Feature flags**: Use only what you need

---

## Quick Start

```bash
npm install @v1b3x0r/mds-core
```

### Minimal Example (v4 compatible)

```typescript
import { Engine, loadMaterial } from '@v1b3x0r/mds-core'

const engine = new Engine()
const paper = await loadMaterial('./paper.shy.mdspec.json')

engine.spawn(paper, 100, 100)
engine.start()
```

That's it. A shy paper now floats in your DOM, aging and fading naturally.

### v5 World Example (Full Features)

```typescript
import { World } from '@v1b3x0r/mds-core'

// Create world with all v5 features
const world = new World({
  features: {
    ontology: true,      // Memory, emotion, relationships
    physics: true,       // Collision, temperature, weather
    communication: true, // Messages, dialogue, LLM
    cognitive: true,     // Learning, skills, consolidation
    rendering: 'canvas'  // or 'dom' or 'webgl'
  }
})

// Spawn an entity
const entity = world.spawn(
  { material: 'person.curious', essence: 'A seeker of knowledge' },
  100, 100
)

// Add memory
entity.remember({
  timestamp: Date.now(),
  type: 'observation',
  subject: 'world',
  content: 'I exist!',
  salience: 0.9
})

// Set emotion
entity.setEmotion({ valence: 0.8, arousal: 0.6, dominance: 0.7 })

// Send message to another entity
entity.sendMessage('greeting', 'Hello, friend!', otherEntity)

// Enable learning
entity.enableLearning()
entity.learning.addExperience({
  action: 'explore',
  context: 'new_world',
  reward: 1.0,
  timestamp: Date.now()
})

// Start simulation
world.start()

// Access world statistics
setInterval(() => {
  const stats = world.getWorldStats()
  const patterns = world.getPatterns()
  const mood = world.getCollectiveEmotion()

  console.log('World has', stats.entityCount, 'entities')
  console.log('Detected patterns:', patterns.map(p => p.pattern))
  console.log('Collective mood:', mood)
}, 1000)
```

---

## The Iceberg (How Deep You Wanna Go)

### For Game Developers (Roblox, Unity, Godot)

**What you get:** NPCs that actually remember, learn, and form real relationships.

```typescript
// NPCs that grow and evolve
const npc = world.spawn({ essence: 'friendly merchant' }, x, y)
npc.enableSkills()
npc.skills.learnSkill('trading')

// They get better with practice
npc.skills.practice('trading', successRate)
```

👉 [See full game dev guide](./docs/guides/USE_CASES.md#game-development)

### For UI/UX Designers

**What you get:** Interfaces that respond to emotion, not just clicks.

```typescript
// Buttons that remember how you treat them
const button = world.spawn({ essence: 'submit button' }, x, y)
button.setEmotion({ valence: -0.3, arousal: 0.8 }) // stressed!

// They learn your patterns
button.enableLearning()
// After many clicks, button predicts what you'll do next
```

👉 [See full UX guide](./docs/guides/USE_CASES.md#uiux-design)

### For IoT / Smart Home

**What you get:** Devices that form a collective intelligence.

```typescript
// Sensors that communicate and learn patterns
const tempSensor = world.spawn({ essence: 'temperature sensor' }, 0, 0)
const lightSensor = world.spawn({ essence: 'light sensor' }, 1, 0)

// They discover correlations automatically
tempSensor.sendMessage('data', { temp: 25 }, lightSensor)

// World detects emergent patterns
const patterns = world.getPatterns() // e.g., "synchronization"
```

👉 [See full IoT guide](./docs/guides/USE_CASES.md#iot-smart-home)

### For Researchers / Scientists

**What you get:** Configurable simulation environment for emergent systems.

```typescript
// Deterministic experiments (reproducible)
const world = new World({ seed: 12345 })

// Run simulation
for (let i = 0; i < 1000; i++) {
  world.tick(0.016)
}

// Analyze collective behavior
const stats = world.getWorldStats()
const patterns = world.getPatterns()

// Export data for analysis
const snapshot = world.snapshot()
fs.writeFileSync('experiment_001.json', JSON.stringify(snapshot))
```

👉 [See full research guide](./docs/guides/USE_CASES.md#research-simulation)

### For Artists / Creative Coders

**What you get:** Entities that paint with behavior.

```typescript
// Materials that age gracefully
const entity = world.spawn({
  essence: 'fading memory',
  manifestation: {
    aging: {
      start_opacity: 1.0,
      decay_rate: 0.02  // Fades 2% per second
    }
  }
}, x, y)

// Emotions affect physics
entity.setEmotion({ valence: -0.5, arousal: 0.9 }) // fear
// → Increases chaos (entity moves erratically)
```

👉 [See full creative coding guide](./docs/guides/USE_CASES.md#art-creative-coding)

---

## What's New in v5

| Feature | Description | Status |
|---------|-------------|--------|
| **Ontology** | Memory, emotion, relationships | ✅ Complete |
| **World Container** | Three-phase tick architecture | ✅ Complete |
| **Renderer Abstraction** | DOM / Canvas / WebGL support | ✅ Complete |
| **WorldFile** | Save/load with snapshots | ✅ Complete |
| **Environmental Physics** | Collision, temperature, weather | ✅ Complete |
| **Communication** | Messages, dialogue trees, LLM | ✅ Complete |
| **Cognitive System** | Learning, skills, memory consolidation | ✅ Complete |
| **World Mind** | Collective intelligence, pattern detection | ✅ Complete |

### v4 → v5 Migration

v5 is **backward compatible** with v4. Your existing `Engine` code works as-is.

To use v5 features, migrate to `World`:

```diff
- import { Engine } from '@v1b3x0r/mds-core'
- const engine = new Engine()
+ import { World } from '@v1b3x0r/mds-core'
+ const world = new World({ features: { ontology: true } })

- engine.spawn(material, x, y)
+ world.spawn(material, x, y)

- engine.start()
+ world.start()
```

All v4 `Engine` methods work in `World`. See [migration guide](./docs/technical/V5-MIGRATION.md).

---

## Architecture

### World Tick Pipeline

```
Phase 1: Physical tick
  ├─ v4 Engine: forces, fields, aging
  └─ Integration: position, velocity updates

Phase 1.5: Environmental physics
  ├─ Collision detection (spatial grid)
  ├─ Energy transfer (thermal, kinetic)
  └─ Weather system

Phase 2: Mental tick
  ├─ Memory decay (Ebbinghaus curve)
  └─ Emotion decay

Phase 2.5: Communication
  ├─ Message delivery
  ├─ Dialogue tree progression
  └─ Inbox cleanup

Phase 3: Relational tick
  └─ Relationship evolution (bonds/decay)

Phase 3.5: Cognitive
  ├─ Skill decay
  ├─ Memory consolidation
  └─ Learning pattern forgetting

Phase 4: World mind
  ├─ Statistics aggregation
  └─ Pattern detection

Phase 5: Rendering
  └─ DOM / Canvas / WebGL update
```

### Bundle Size

| Component | Size | Gzipped |
|-----------|------|---------|
| Core (v4) | 18.42 KB | 5.48 KB |
| + Ontology (Phase 1) | +31 KB | +8 KB |
| + Physics (Phase 5) | +11 KB | +3 KB |
| + Communication (Phase 6) | +30 KB | +8 KB |
| + Cognitive (Phase 7) | +16 KB | +4 KB |
| + World Mind (Phase 8) | +6 KB | +2 KB |
| **Full v5** | **132.53 KB** | **30.98 KB** |

**Tree-shakable**: Import only what you need. If you only use `Engine`, you only get 5.48 KB gzipped.

---

## Examples

### 1. Memory & Emotion

```typescript
const entity = world.spawn({ essence: 'thoughtful being' }, 100, 100)

// Add memories
entity.remember({
  timestamp: Date.now(),
  type: 'observation',
  subject: 'sunrise',
  content: 'The world is beautiful',
  salience: 0.95  // Important memory
})

// Recall memories
const memories = entity.memory.recall({ subject: 'sunrise' })

// Set emotional state
entity.setEmotion({
  valence: 0.8,   // Positive
  arousal: 0.3,   // Calm
  dominance: 0.7  // In control
})
```

### 2. Learning & Skills

```typescript
const entity = world.spawn({ essence: 'apprentice blacksmith' }, 100, 100)

// Enable learning
entity.enableLearning()

// Gain experience
entity.learning.addExperience({
  action: 'forge_sword',
  context: 'training',
  reward: 0.8,
  success: true,
  timestamp: Date.now()
})

// Enable skills
entity.enableSkills()
entity.skills.learnSkill('blacksmithing')

// Practice improves proficiency
entity.skills.practice('blacksmithing', 0.9)  // 90% success rate

// Check proficiency
const skill = entity.skills.getSkill('blacksmithing')
console.log(skill.proficiency)  // 0..1 (novice → master)
```

### 3. Communication

```typescript
const sender = world.spawn({ essence: 'messenger' }, 100, 100)
const receiver = world.spawn({ essence: 'listener' }, 200, 200)

// Send direct message
sender.sendMessage('dialogue', 'Greetings, friend!', receiver)

// Broadcast to nearby entities
sender.sendMessage('broadcast', 'I am here!')

// Read messages
if (receiver.hasUnreadMessages()) {
  const msg = receiver.readNextMessage()
  console.log(msg.content)  // "Greetings, friend!"
}
```

### 4. Collective Intelligence

```typescript
// Spawn multiple entities
for (let i = 0; i < 10; i++) {
  world.spawn({ essence: 'villager' }, randomX(), randomY())
}

// Run simulation
world.start()

// Observe collective behavior
setInterval(() => {
  const stats = world.getWorldStats()
  console.log('Entities:', stats.entityCount)
  console.log('Avg age:', stats.avgAge)
  console.log('Total memories:', stats.totalMemories)

  const patterns = world.getPatterns()
  patterns.forEach(p => {
    console.log(`Detected ${p.pattern} (strength: ${p.strength})`)
  })

  const mood = world.getCollectiveEmotion()
  if (mood) {
    console.log('World mood:', mood.valence > 0 ? 'positive' : 'negative')
  }
}, 1000)
```

---

## Documentation

### Guides
- [Quick Start](./docs/guides/QUICKSTART.md)
- [Use Cases by Audience](./docs/guides/USE_CASES.md) ⭐ **Start here**
- [MDSpec Schema Reference](./docs/guides/MDSPEC_GUIDE.md)
- [Cookbook (Recipes)](./docs/guides/COOKBOOK.md)

### Technical
- [Architecture Deep-Dive](./docs/technical/ARCHITECTURE.md)
- [Technical Specification](./docs/technical/TECH_SPEC.md)
- [v4 → v5 Migration](./docs/technical/V5-MIGRATION.md)
- [API Reference](./docs/technical/API.md)

### Meta
- [Changelog](./docs/meta/CHANGELOG.md)
- [Contributing](./docs/meta/CONTRIBUTING.md)
- [License](./docs/meta/LICENSE.md)

---

## Testing

```bash
# Run all tests (110 tests)
npm test

# Run specific phase
node tests/test-physics.mjs        # Phase 5: 43 tests
node tests/test-communication.mjs  # Phase 6: 18 tests
node tests/test-cognitive.mjs      # Phase 7: 18 tests
node tests/test-world-mind.mjs     # Phase 8: 31 tests
```

**100% pass rate** across all 110 tests.

---

## Philosophy

### Traditional UIs are event-driven
```javascript
button.addEventListener('click', () => doSomething())
```

### MDS is force-driven
```javascript
// Entities want things. Forces emerge from similarity.
entity.essence = "curious explorer"
// → Naturally attracted to other curious entities
// → No hardcoded if-statements needed
```

### Everything you define here wants something — even a JSON file.

---

## Who Made This

Built by **@v1b3x0r** (coder) and **[redacted]** (the one who keeps saying "trust the field").

Started in Chiang Mai, 2024.
Got weird in 2025.

We don't know if this is a UI framework or accidental philosophy.
Maybe both. Maybe neither.

---

## License

MIT — You're free to create universes with this.
Just don't blame us when they start talking back.

---

## TL;DR

**v4**: JSON becomes living matter (18 KB)
**v5**: JSON becomes conscious beings that think, feel, learn, and form societies (133 KB)

**Pick your depth:**
- Just want physics? Use `Engine` (v4, 5 KB gzipped)
- Want consciousness? Use `World` with feature flags (v5, 31 KB gzipped)
- Want everything? `new World({ features: { ontology: true, physics: true, communication: true, cognitive: true } })`

**"Why does this exist?"**

Because someone had to ask: *What if JSON could dream?*

Now you know. Go forth and create impossible things.

---

**Quick Links:**
- 📚 [Use Case Guide](./docs/guides/USE_CASES.md) — Find your use case
- 🚀 [Quick Start](./docs/guides/QUICKSTART.md) — 5 min to first entity
- 🧪 [Examples](./examples/) — Working demos
- 💬 [Issues](https://github.com/v1b3x0r/mds/issues) — Report bugs / request features
- ⭐ [Star us](https://github.com/v1b3x0r/mds) — If this made you think

---

> "Two JSON files walked into a simulation.
> They fell in love, had offspring, and accidentally created a religion.
> We're not sure if that's a bug or a feature."

—The MDS Team, somewhere in Chiang Mai
