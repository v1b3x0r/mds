# API Reference — MDS v5.3.0

**Complete API reference for Material Design System (MDS). Organized by difficulty with progressive disclosure.**

---

## 📖 How to Use This Reference

**Difficulty Indicators:**
- 🟢 **Basic** - Essential features for getting started
- 🟡 **Intermediate** - Common patterns and advanced usage
- 🔴 **Advanced** - Complex systems and optimization

**Navigation:**
- [Installation](#installation) 🟢
- [Quick Start](#quick-start-30-seconds) 🟢
- [Core Classes](#core-classes) 🟢🟡
- [Ontology Systems](#ontology-systems-hello-features) 🟡
- [LLM Configuration](#llm-configuration-v53) 🟡
- [Feature Activation](#feature-activation-v53-unified-api) 🟢
- [Material Format](#material-definition-format) 🟢🟡
- [Advanced Features](#phase-2-features-v52--advanced-ontology) 🔴
- [Troubleshooting](#troubleshooting) 🟢
- [Migration Guide](#migration-guide) 🟡
- [Glossary](#glossary) 📚

---

## Installation 🟢

```bash
npm install @v1b3x0r/mds-core
```

**CDN (Browser):**
```html
<script type="module">
  import { World } from 'https://esm.sh/@v1b3x0r/mds-core'
</script>
```

**TypeScript:** Fully typed with `.d.ts` declarations included.

---

## Quick Start (30 Seconds) 🟢

```javascript
import { World } from '@v1b3x0r/mds-core'

// 1. Create world
const world = new World({
  features: { ontology: true }
})

// 2. Spawn entity
const entity = world.spawn({
  essence: 'A curious cat'
}, 200, 200)

// 3. Enable memory (v5.3 unified API)
entity.enable('memory')

// 4. Make it remember
entity.remember({
  type: 'observation',
  subject: 'player',
  content: 'Saw a red dot',
  salience: 0.8
})

// 5. Start simulation
world.start()
```

---

## Core Classes

### `World` 🟢

**Constructor:**
```typescript
new World(options?: WorldOptions)
```

**Options:**
```typescript
interface WorldOptions {
  seed?: number                    // Deterministic random seed
  features?: {
    ontology?: boolean             // Memory, emotion, relationships
    physics?: boolean              // Collision, temperature, weather
    communication?: boolean        // Messages, dialogue
    cognitive?: boolean            // Learning, skills
    languageGeneration?: boolean   // LLM-powered dialogue
    rendering?: 'dom' | 'canvas' | 'webgl' | 'headless'
  }
  environment?: string | EnvironmentConfig
  weather?: string | WeatherConfig
  worldBounds?: {
    minX: number, maxX: number,
    minY: number, maxY: number
  }
  boundaryBehavior?: 'none' | 'clamp' | 'bounce'

  // LLM configuration (v5.3) - See LLM Configuration section
  llm?: {
    provider?: 'openrouter' | 'anthropic' | 'openai'  // Default: 'openrouter'
    apiKey?: string                                     // Falls back to env
    languageModel?: string                              // Default: 'anthropic/claude-3.5-sonnet'
    embeddingModel?: string                             // Optional (local fallback)
  }
}
```

**Methods:**

| Method | Description | Difficulty |
|--------|-------------|------------|
| `spawn(material, x, y)` | Create entity at position | 🟢 |
| `spawnField(field, x, y)` | Create field at position | 🟡 |
| `destroy(entity)` | Remove entity from world | 🟢 |
| `start()` | Begin simulation loop | 🟢 |
| `stop()` | Halt simulation loop | 🟢 |
| `tick(dt)` | Manual tick (if not using start/stop) | 🟡 |
| `snapshot()` | Serialize world state | 🟡 |
| `restore(data, materialMap, fieldMap)` | Load world state | 🟡 |
| `getWorldStats()` | Get aggregate statistics | 🟡 |
| `getPatterns()` | Detect emergent patterns | 🔴 |
| `getCollectiveEmotion()` | Average population emotion | 🟡 |
| `enableLLM(config)` | **Deprecated** - Use `llm` in WorldOptions | 🟡 |

---

### `Entity` 🟢

**Properties:**

| Property | Type | Description | Difficulty |
|----------|------|-------------|------------|
| `id` | string | Unique identifier | 🟢 |
| `m` | MdsMaterial | Material definition | 🟢 |
| `x`, `y` | number | Position | 🟢 |
| `vx`, `vy` | number | Velocity | 🟢 |
| `age` | number | Time alive (seconds) | 🟢 |
| `energy` | number | Energy level (0-1) | 🟡 |
| `opacity` | number | Visual opacity (0-1) | 🟢 |
| `destroyed` | boolean | Marked for removal | 🟢 |
| `memory` | MemoryBuffer | Memory system (if enabled) | 🟡 |
| `learning` | LearningSystem | Learning system (if enabled) | 🟡 |
| `relationships` | Map | Relationship tracking (if enabled) | 🟡 |
| `skills` | SkillSystem | Skill system (if enabled) | 🟡 |
| `emotion` | EmotionalState | Emotional state (PAD model) | 🟡 |

**Methods:**

| Method | Description | Difficulty |
|--------|-------------|------------|
| `enable(...features)` | **v5.3** Enable features ('memory', 'learning', 'relationships', 'skills') | 🟢 |
| `disable(...features)` | **v5.3** Disable features | 🟢 |
| `isEnabled(feature)` | **v5.3** Check if feature is enabled | 🟢 |
| `enableAll()` | **v5.3** Enable all features (sugar method) | 🟢 |
| `disableAll()` | **v5.3** Disable all features (sugar method) | 🟢 |
| `remember(memory)` | Store a memory | 🟡 |
| `setEmotion(pad)` | Set emotional state | 🟡 |
| `getEmotion()` | Get current emotion | 🟡 |
| `speak(category?, lang?)` | **v5.1** Get dialogue phrase from declarative config | 🟡 |
| `updateTriggerContext(context)` | **v5.1** Update trigger context (for emotion transitions) | 🔴 |
| `checkEmotionTriggers()` | **v5.1** Evaluate and apply emotion triggers | 🔴 |
| `sendMessage(type, content, target)` | Send message to entity | 🟡 |
| `hasUnreadMessages()` | Check for new messages | 🟡 |
| `readNextMessage()` | Get oldest unread message | 🟡 |
| `addRelationship(targetId, type, strength)` | Create bond | 🟡 |
| `updateRelationship(targetId, strength)` | Change strength | 🟡 |
| `getRelationship(targetId)` | Get specific bond | 🟡 |
| `getRelationshipsByType(type)` | Filter by type | 🟡 |
| `getAllRelationships()` | Get all bonds | 🟡 |
| `removeRelationship(targetId)` | Delete bond | 🟡 |

**Lifecycle Hooks (v5.3):** 🟡

| Hook | Signature | Description |
|------|-----------|-------------|
| `onSpawn` | `(world, entity) => void` | Called immediately after entity is spawned |
| `onUpdate` | `(dt, entity) => void` | Called every frame during world tick |
| `onDestroy` | `(entity) => void` | Called before entity is removed from world |

**Example:**
```javascript
const entity = world.spawn(material, 100, 100)

entity.onSpawn = (world, entity) => {
  console.log('Entity spawned:', entity.m.material)
  entity.enable('memory', 'learning')  // Auto-enable features
}

entity.onUpdate = (dt, entity) => {
  if (entity.age > 10) {
    console.log('Entity is 10 seconds old')
  }
}

entity.onDestroy = (entity) => {
  console.log('Entity destroyed after', entity.age, 'seconds')
  // Cleanup logic here
}
```

---

## Ontology Systems: "Hello, Feature" 🟡

### Memory 🟡

**Enable:**
```javascript
entity.enable('memory')  // v5.3 unified API
```

**Store a memory:**
```javascript
entity.remember({
  type: 'observation',
  subject: 'player',
  content: 'Saw a red dot',
  salience: 0.8  // 0-1 importance
})
```

**Retrieve memories:**
```javascript
// Get most salient memories
const memories = entity.memory.recall({ subject: 'player' })

// Get all memories
const all = entity.memory.getAllMemories()
```

**Memory Object:**
```typescript
interface Memory {
  id: string
  timestamp: number
  type: string           // 'observation', 'interaction', 'emotion', 'action'
  subject: string
  content: string | object
  salience: number       // 0-1 (importance, decays over time via Ebbinghaus curve)
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `remember(memory)` | Add new memory |
| `recall(filter?)` | Retrieve memories (most salient first) |
| `getAllMemories()` | Get all memories |
| `forget(memoryId)` | Remove specific memory |
| `clear()` | Clear all memories |

---

### Learning 🟡

**Enable:**
```javascript
entity.enable('learning')
```

**Record experience:**
```javascript
entity.learning.addExperience({
  action: 'dodge_left',
  context: 'combat',
  reward: 1.0,          // -1 to +1
  timestamp: Date.now()
})
```

**Get learned values:**
```javascript
const actionValue = entity.learning.getActionValue('dodge_left')
const stats = entity.learning.getStats()
```

**Experience Object:**
```typescript
interface Experience {
  action: string
  context?: string
  reward: number         // -1 to +1
  timestamp: number
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `addExperience(exp)` | Record learning experience |
| `getActionValue(action)` | Get Q-value for action |
| `getStats()` | Learning statistics |

---

### Relationships 🟡

**Enable:**
```javascript
entity.enable('relationships')
```

**Create bond:**
```javascript
alice.addRelationship(bob.id, 'friend', 0.7)
bob.addRelationship(alice.id, 'friend', 0.8)
```

**Query relationships:**
```javascript
const friends = alice.getRelationshipsByType('friend')
const bond = alice.getRelationship(bob.id)
```

**Relationship Object:**
```typescript
interface Relationship {
  targetId: string
  type: string           // 'friend', 'rival', 'neutral', custom
  strength: number       // -1 to +1
  createdAt: number
  updatedAt: number
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `addRelationship(targetId, type, strength)` | Create bond |
| `updateRelationship(targetId, strength)` | Change strength |
| `getRelationship(targetId)` | Get specific bond |
| `getRelationshipsByType(type)` | Filter by type |
| `getAllRelationships()` | Get all bonds |
| `removeRelationship(targetId)` | Delete bond |

---

### Skills 🟡

**Enable:**
```javascript
entity.enable('skills')
```

**Learn and practice:**
```javascript
entity.skills.learnSkill('cooking')
entity.skills.practice('cooking', 0.8)  // 0-1 success rate
```

**Query skills:**
```javascript
const stats = entity.skills.getSkillStats('cooking')
// → { level: 'novice', proficiency: 0.45, attempts: 12, ... }
```

**Methods:**

| Method | Description |
|--------|-------------|
| `learnSkill(name)` | Add new skill |
| `practice(name, success)` | Practice skill (0-1 success) |
| `getSkillStats(name)` | Get skill proficiency |
| `getAllSkills()` | List all skills |

---

### Emotion (PAD Model) 🟡

**Set emotion:**
```javascript
entity.setEmotion({
  valence: 0.8,        // -1 (sad) to +1 (happy)
  arousal: 0.3,        // -1 (calm) to +1 (excited)
  dominance: 0.5       // -1 (submissive) to +1 (dominant)
})
```

**Get emotion:**
```javascript
const emotion = entity.getEmotion()
// → { valence: 0.8, arousal: 0.3, dominance: 0.5 }
```

**Common Emotions:**

| Emotion | Valence | Arousal | Dominance |
|---------|---------|---------|-----------|
| Happy | 0.8 | 0.3 | 0.5 |
| Excited | 0.7 | 0.9 | 0.6 |
| Calm | 0.3 | -0.7 | 0.5 |
| Sad | -0.7 | -0.3 | 0.3 |
| Angry | -0.5 | 0.8 | 0.8 |
| Afraid | -0.6 | 0.7 | 0.1 |
| Bored | 0.0 | -0.8 | 0.4 |

---

## LLM Configuration (v5.3) 🟡

### Quick Start

```javascript
const world = new World({
  features: { communication: true, languageGeneration: true },
  llm: {
    apiKey: process.env.OPENROUTER_KEY
    // Defaults: provider='openrouter', languageModel='anthropic/claude-3.5-sonnet'
  }
})
```

### Configuration Examples

#### Minimal (Default OpenRouter + Claude)

```javascript
llm: {
  apiKey: process.env.OPENROUTER_KEY
}
// → provider: 'openrouter', languageModel: 'anthropic/claude-3.5-sonnet'
```

#### Custom Model (Cheaper Alternative)

```javascript
llm: {
  apiKey: process.env.OPENROUTER_KEY,
  languageModel: 'meta-llama/llama-3.1-70b-instruct'
}
```

#### With Embeddings (Semantic Similarity)

```javascript
llm: {
  apiKey: process.env.OPENROUTER_KEY,
  languageModel: 'anthropic/claude-3.5-sonnet',
  embeddingModel: 'openai/text-embedding-3-small'
}
```

#### Direct Provider (Anthropic)

```javascript
llm: {
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_KEY,
  languageModel: 'claude-3-5-sonnet-20241022'
}
```

#### Direct Provider (OpenAI)

```javascript
llm: {
  provider: 'openai',
  apiKey: process.env.OPENAI_KEY,
  languageModel: 'gpt-4-turbo',
  embeddingModel: 'text-embedding-3-small'
}
```

### Fallback Behavior

1. **No apiKey:** Falls back to `process.env.OPENROUTER_KEY`, then mock provider
2. **No embeddingModel:** Uses local similarity (Jaccard/Levenshtein)
3. **No languageModel:** Defaults to `anthropic/claude-3.5-sonnet`

**Console messages:**
- ✅ `LLM: Using OPENROUTER_KEY from environment`
- ⚠️ `LLM: languageGeneration enabled but no apiKey provided. Falling back to mock provider.`
- ℹ️ `LLM: Using local similarity methods (Jaccard/Levenshtein) for semantic clustering`
- ℹ️ `LLM: Using openrouter embeddings (text-embedding-3-small) for semantic similarity`

---

## Feature Activation (v5.3 Unified API) 🟢

### Enable Multiple Features

```javascript
// Enable multiple features in one call
const entity = world.spawn(material, 100, 100)
entity.enable('memory', 'learning', 'relationships')

// Chainable
const bob = world.spawn(material, 300, 300)
  .enable('memory', 'learning')

// Check if enabled
if (entity.isEnabled('memory')) {
  console.log('Memory is active')
}

// Disable features
entity.disable('learning')

// Enable all features at once
entity.enableAll()

// Disable all features
entity.disableAll()
```

### Available Features

- `'memory'` - Enable memory system (MemoryBuffer with Ebbinghaus decay)
- `'learning'` - Enable Q-learning system
- `'relationships'` - Enable relationship tracking
- `'skills'` - Enable skill proficiency system

### Examples

#### Smart Home Device 🟡

```javascript
const thermostat = world.spawn({
  essence: 'Thermostat that learns preferences'
}, 100, 100).enable('memory', 'learning')

thermostat.remember({
  type: 'preference',
  subject: 'temperature',
  content: { value: 22 },
  salience: 0.9
})

// Later: query preferences
const prefs = thermostat.memory.recall({ subject: 'temperature' })
```

#### Game NPC 🟡

```javascript
const npc = world.spawn(material, 300, 300)
  .enable('memory', 'learning', 'relationships')

npc.onSpawn = (world, entity) => {
  console.log('NPC ready with full ontology features')
}

// NPC remembers player actions
npc.remember({
  type: 'interaction',
  subject: 'player',
  content: 'Helped me find quest item',
  salience: 0.85
})

// NPC forms relationship with player
npc.addRelationship(player.id, 'friend', 0.6)
```

---

## Material Definition Format

### Minimal Material 🟢

```json
{
  "material": "unique.id",
  "essence": "What this thing is"
}
```

### Full Material (v5.1 with Dialogue + Emotion Triggers) 🟡

```json
{
  "$schema": "https://mds.v1b3.dev/schema/v5",
  "material": "example.full",
  "intent": "observe",
  "essence": "A complete example material",

  "manifestation": {
    "emoji": "🌟",
    "visual": "glowing star",
    "aging": {
      "start_opacity": 1.0,
      "decay_rate": 0.01
    }
  },

  "dialogue": {
    "intro": [{
      "lang": { "en": "Hello, I'm a star!", "th": "สวัสดี ฉันเป็นดาว!" }
    }],
    "self_monologue": [{
      "lang": { "en": "Shining all alone..." }
    }]
  },

  "emotion": {
    "base_state": "neutral",
    "transitions": [{
      "trigger": "player.gaze>5s",
      "to": "happy",
      "intensity": 0.7,
      "expression": "particle.sparkle"
    }]
  },

  "behavior": {
    "onHover": {
      "type": "velocity",
      "value": { "vx": 2, "vy": -2 }
    },
    "onProximity": {
      "type": "emotion",
      "value": { "valence": 0.5, "arousal": 0.3, "dominance": 0.6 }
    }
  },

  "physics": {
    "mass": 0.5,
    "friction": 0.02,
    "bounce": 0.9
  },

  "ai_binding": {
    "model_hint": "claude-3-5-sonnet",
    "simulate": false
  },

  "notes": [
    "Design note: This star talks and reacts to being watched"
  ]
}
```

**Usage:**
```javascript
const entity = world.spawn(material, 100, 100)

// Dialogue (auto-detects language)
console.log(entity.speak('intro'))  // "Hello, I'm a star!" or "สวัสดี ฉันเป็นดาว!"

// Emotion triggers (automatic)
entity.updateTriggerContext({ playerGazeDuration: 6 })
entity.checkEmotionTriggers()  // Entity becomes happy (player stared >5s)
```

---

## Field Definition Format 🟡

```json
{
  "material": "field.trust",
  "type": "field",
  "origin": "self",
  "radius": 120,
  "duration": 45000,

  "visual": {
    "aura": "soft golden glow",
    "motion": "gentle pulse"
  },

  "effect_on_others": {
    "opacity_boost": 0.1
  }
}
```

---

## Serialization 🟡

### Save

```typescript
const snapshot = world.snapshot()
localStorage.setItem('save', JSON.stringify(snapshot))
```

### Load

```typescript
const data = JSON.parse(localStorage.getItem('save'))

const materialMap = new Map([
  ['npc.villager', villagerMaterial],
  ['npc.guard', guardMaterial]
])

const fieldMap = new Map([
  ['field.trust', trustField]
])

world.restore(data, materialMap, fieldMap)
```

---

## Statistics & Patterns 🟡

### World Stats

```typescript
const stats = world.getWorldStats()
// → {
//   entityCount: 15,
//   avgAge: 23.4,
//   avgEnergy: 0.72,
//   totalMemories: 143,
//   totalRelationships: 28,
//   avgEmotionalValence: 0.35
// }
```

### Pattern Detection 🔴

```typescript
const patterns = world.getPatterns()
// → [
//   {
//     pattern: 'clustering',
//     strength: 0.8,
//     entities: [...],
//     centroid: { x: 400, y: 300 }
//   },
//   {
//     pattern: 'dispersion',
//     strength: 0.3,
//     entities: [...]
//   }
// ]
```

### Collective Emotion 🟡

```typescript
const mood = world.getCollectiveEmotion()
// → {
//   valence: 0.42,   // Population is slightly happy
//   arousal: 0.18,   // Population is calm
//   dominance: 0.53  // Population feels moderately in control
// }
```

---

## Bundle Sizes 🟡

| Package | Size (Minified) | Gzipped | Notes |
|---------|-----------------|---------|-------|
| Full (v5.3) | 186.74 KB | 43.17 KB | All features included |
| Full (v5.2.3) | 198.79 KB | 45.08 KB | Pre-LLM optimization |
| Core (v5.0) | 132.53 KB | 30.98 KB | Base + Phase 1-8 |
| Legacy (v4.2) | 18.42 KB | 5.48 KB | Engine only, no ontology |

**Performance Note:** v5.3 is **6.1% smaller** than v5.2.3 due to LLM config unification and tree-shaking improvements.

**Tree-shakable:** Import only what you need.

```typescript
// Minimal
import { World } from '@v1b3x0r/mds-core'
const world = new World()

// With ontology
const world = new World({ features: { ontology: true } })

// Full features
const world = new World({
  features: {
    ontology: true,
    physics: true,
    communication: true,
    cognitive: true
  }
})
```

---

## TypeScript Types 🟢

### Material

```typescript
import type { MdsMaterial } from '@v1b3x0r/mds-core'

const material: MdsMaterial = {
  material: 'my.material',
  essence: 'A typed material'
}
```

### Field

```typescript
import type { MdsField } from '@v1b3x0r/mds-core'

const field: MdsField = {
  material: 'my.field',
  type: 'field',
  origin: 'self',
  radius: 100,
  duration: 30000
}
```

### Entity

```typescript
import type { Entity } from '@v1b3x0r/mds-core'

function handleEntity(entity: Entity) {
  entity.remember({ ... })
}
```

---

## Recipes

### Recipe 1: NPC With Memory 🟢

```javascript
const npc = world.spawn({ essence: 'Quest giver' }, 300, 300)
npc.enable('memory')  // v5.3 unified API

npc.remember({
  type: 'quest',
  subject: 'player',
  content: 'Gave sword quest',
  salience: 0.9
})

const memories = npc.memory.recall({ subject: 'player' })
console.log(memories)
```

---

### Recipe 2: Learning Enemy 🟡

```javascript
const enemy = world.spawn({ essence: 'Smart boss' }, 500, 500)
enemy.enable('learning')  // v5.3 unified API

enemy.learning.addExperience({
  action: 'dodge_left',
  context: 'combat',
  reward: 1.0,
  timestamp: Date.now()
})

const bestAction = enemy.learning.getActionValue('dodge_left')
console.log(bestAction)  // Higher value = better learned
```

---

### Recipe 3: Relationship Network 🟡

```javascript
const alice = world.spawn({ essence: 'Alice' }, 200, 200)
const bob = world.spawn({ essence: 'Bob' }, 400, 200)

alice.enable('relationships')
bob.enable('relationships')

alice.addRelationship(bob.id, 'friend', 0.7)
bob.addRelationship(alice.id, 'friend', 0.8)

const friends = alice.getRelationshipsByType('friend')
console.log(friends)
```

---

### Recipe 4: Emotional UI 🟡

```javascript
const button = world.spawn({ essence: 'Stressed button' }, 250, 100)

let clickCount = 0
button.el.addEventListener('click', () => {
  clickCount++

  if (clickCount > 5) {
    button.setEmotion({
      valence: -0.6,   // Unhappy
      arousal: 0.9,    // Very stressed
      dominance: 0.2   // Low control
    })

    button.el.style.background = 'red'
    button.el.style.animation = 'shake 0.3s'
  }
})
```

---

### Recipe 5: Headless Simulation 🔴

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  seed: 12345,
  features: {
    ontology: true,
    rendering: 'headless'
  }
})

for (let i = 0; i < 100; i++) {
  world.spawn({ essence: 'Agent' }, randomX(), randomY())
}

for (let tick = 0; tick < 10000; tick++) {
  world.tick(0.016)
}

const stats = world.getWorldStats()
console.log(stats)
```

---

## Troubleshooting

### Issue: Entities not moving 🟢

**Solution:** Make sure physics is enabled or manually set velocity.

```javascript
// Enable physics
const world = new World({ features: { physics: true } })

// Or manually set velocity
entity.vx = 2
entity.vy = -2
```

---

### Issue: Memory not persisting 🟢

**Solution:** Ensure memory feature is enabled using v5.3 unified API.

```javascript
entity.enable('memory')  // ← Required!
entity.remember({ ... })
```

---

### Issue: Learning not working 🟡

**Solution:** Enable learning feature before adding experiences.

```javascript
entity.enable('learning')  // ← Required!
entity.learning.addExperience({ ... })
```

---

### Issue: Relationships not saved 🟡

**Solution:** Enable relationships feature before adding bonds.

```javascript
entity.enable('relationships')  // ← Required!
entity.addRelationship(otherId, 'friend', 0.8)
```

---

### Issue: LLM not generating text 🟡

**Solution:** Check API key configuration and console warnings.

```javascript
const world = new World({
  features: { communication: true, languageGeneration: true },
  llm: {
    apiKey: process.env.OPENROUTER_KEY  // ← Required for real LLM
  }
})

// Check console for:
// ⚠️ "LLM: languageGeneration enabled but no apiKey provided"
```

---

## Phase 2 Features (v5.2) — Advanced Ontology 🔴

### `SimilarityProvider`

**Semantic similarity calculation with pluggable providers.**

**Built-in Providers:**
```typescript
import {
  MockSimilarityProvider,
  OpenAISimilarityProvider,
  CohereSimilarityProvider
} from '@v1b3x0r/mds-core'

// Mock provider (no API key needed)
const mock = new MockSimilarityProvider()

// OpenAI provider (requires API key)
const openai = new OpenAISimilarityProvider({
  apiKey: 'sk-...',
  model: 'text-embedding-3-small'  // or 'text-embedding-3-large'
})

// Cohere provider (requires API key)
const cohere = new CohereSimilarityProvider({
  apiKey: 'co-...',
  model: 'embed-english-v3.0'
})
```

**Entity Clustering:**
```typescript
import { EntitySimilarityAdapter } from '@v1b3x0r/mds-core'

const adapter = new EntitySimilarityAdapter(provider)

// Find similar entities
const similar = await adapter.findSimilar(
  targetEntity,
  candidateEntities,
  0.7  // threshold
)

// Find top N most similar
const topN = await adapter.findTopN(targetEntity, candidates, 5)

// Cluster entities by similarity
const clusters = await adapter.cluster(entities, 0.8)
```

---

### `MemoryCrystallizer`

**Long-term memory consolidation through pattern recognition.**

```typescript
import { MemoryCrystallizer } from '@v1b3x0r/mds-core'

const crystallizer = new MemoryCrystallizer({
  maxCrystals: 20,              // Max crystals to store
  minOccurrences: 3,            // Min memories to form crystal
  minStrength: 1.5              // Min total salience
})

// Crystallize memories
const newCrystals = crystallizer.crystallize(
  entity.memory.getAllMemories(),
  Date.now()
)

// Get crystals by type
const socialCrystals = crystallizer.getCrystalsByType('interaction')

// Check if has crystals
if (crystallizer.hasCrystals()) {
  const all = crystallizer.getAllCrystals()
}
```

**Crystal Structure:**
```typescript
interface CrystalMemory {
  id: string
  pattern: string              // 'occasional_interaction', 'repeated_emotion', 'frequent_observation'
  subject: string              // What/who the crystal is about
  type: MemoryType            // 'interaction', 'emotion', 'observation', 'action'
  strength: number            // 0..1 consolidation strength
  firstSeen: number
  lastReinforced: number
  count: number               // Number of source memories
  essence: string             // Human-readable summary
}
```

---

### `SymbolicPhysicalCoupler`

**Emotion → Physics mapping using PAD model.**

```typescript
import {
  SymbolicPhysicalCoupler,
  COUPLING_PRESETS
} from '@v1b3x0r/mds-core'

// Create coupler with preset
const coupler = new SymbolicPhysicalCoupler(COUPLING_PRESETS.standard)

// Get physics modulation from emotion
const emotion = { valence: -0.8, arousal: 0.6, dominance: 0.3 }
const physics = coupler.emotionToPhysics(emotion)
// → { speed: 1.3, mass: 1.24, forceMultiplier: 1.12, friction: 0.74 }

// Modulate velocity
const { vx, vy } = coupler.modulateVelocity(
  entity.vx,
  entity.vy,
  entity.emotion,
  entity.memory.getAllMemories()
)

// Modulate force
const force = coupler.modulateForce(
  baseForce,
  entity.emotion,
  entity.memory
)
```

**Coupling Presets:**
```typescript
COUPLING_PRESETS.subtle    // Minimal effect (arousalToSpeed: 0.2)
COUPLING_PRESETS.standard  // Balanced (arousalToSpeed: 0.5)
COUPLING_PRESETS.extreme   // Maximum effect (arousalToSpeed: 1.0)
COUPLING_PRESETS.disabled  // No coupling (all multipliers = 0)
```

---

### `IntentReasoner`

**Context-aware intent confidence scoring.**

```typescript
import { IntentReasoner, reasonAbout } from '@v1b3x0r/mds-core'

const reasoner = new IntentReasoner({
  confidenceThreshold: 0.3,      // Min confidence to pursue
  emotionInfluence: 0.6,         // How much emotion affects intent
  memoryInfluence: 0.5,          // How much memories affect intent
  relationshipInfluence: 0.7     // How much relationships affect intent
})

// Reason about intent
const reasoned = reasoner.reason(intent, {
  emotion: entity.emotion,
  memories: entity.memory.getAllMemories(),
  crystals: crystallizer.getAllCrystals(),
  relationships: entity.relationships
})
// → { ...intent, confidence: 0.82, reasoning: ['...'], relevance: 0.75 }

// Suggest intents from context
const suggestions = reasoner.suggest({ emotion, memories, relationships })

// Re-evaluate existing intent
const updated = reasoner.reevaluate(reasonedIntent, context)

// Check if should abandon
if (reasoner.shouldAbandon(reasonedIntent, context)) {
  entity.intents.remove(reasonedIntent.goal)
}

// Quick helpers
const reasoned = reasonAbout(intent, context)
const best = chooseBestIntent(intents, context)
```

---

### `RelationshipDecayManager`

**Time-based relationship deterioration.**

```typescript
import {
  RelationshipDecayManager,
  DECAY_PRESETS
} from '@v1b3x0r/mds-core'

// Create decay manager with preset
const decayManager = new RelationshipDecayManager(DECAY_PRESETS.standard)

// Decay single relationship
const decayed = decayManager.decay(relationship, Date.now())
// → { trust: 0.78, familiarity: 0.65, ... } or null if pruned

// Batch decay (efficient)
entity.relationships = decayManager.decayBatch(
  entity.relationships,
  Date.now()
)

// Reinforce relationship (reset grace period)
const reinforced = decayManager.reinforce(relationship, Date.now())

// Estimate time until pruning
const seconds = decayManager.estimateTimeUntilPruning(relationship)

// Get statistics
const stats = decayManager.getStats()
// → { totalDecayed: 15, totalPruned: 3, avgDecayAmount: 0.02, lastDecayTime: ... }
```

**Decay Curves:**
- `linear`: Constant decay rate (default)
- `exponential`: Accelerating decay (quadratic)
- `logarithmic`: Decelerating decay (long-lasting bonds)
- `stepped`: Sudden drops at intervals

**Decay Presets:**
```typescript
DECAY_PRESETS.casual    // Fast decay (baseRate: 0.002, gracePeriod: 30s)
DECAY_PRESETS.standard  // Balanced (baseRate: 0.001, gracePeriod: 60s)
DECAY_PRESETS.deep      // Slow decay (curve: logarithmic, gracePeriod: 120s)
DECAY_PRESETS.fragile   // Rapid decay (curve: exponential, minThreshold: 0.15)
DECAY_PRESETS.immortal  // No decay (baseRate: 0)
```

---

## Migration Guide 🟡

### v5.0-5.2 → v5.3 LLM Configuration

**Old (Deprecated):**
```javascript
const world = new World({
  languageProvider: 'openrouter',
  languageApiKey: 'sk-...',
  languageModel: 'claude-3.5',
  semanticProvider: 'openai',
  semanticApiKey: 'sk-...'
})
```

**New (v5.3):**
```javascript
const world = new World({
  llm: {
    provider: 'openrouter',
    apiKey: 'sk-...',
    languageModel: 'anthropic/claude-3.5-sonnet',
    embeddingModel: 'openai/text-embedding-3-small'
  }
})
```

**Migration Table:**

| Old (Deprecated) | New (v5.3) | Notes |
|------------------|------------|-------|
| `languageProvider: 'openrouter'` | `llm.provider: 'openrouter'` | Default if omitted |
| `languageApiKey: '...'` | `llm.apiKey: '...'` | Auto-fallback to `process.env.OPENROUTER_KEY` |
| `languageModel: 'claude-3.5'` | `llm.languageModel: 'claude-3.5'` | Default: `anthropic/claude-3.5-sonnet` |
| `semanticProvider: 'openai'` | `llm.embeddingModel: 'text-embedding-3-small'` | Optional (local fallback if omitted) |
| `semanticApiKey: '...'` | *(removed)* | Use same `llm.apiKey` |

**Auto-migration:** Old config is automatically converted. No code changes required unless you want to adopt new syntax.

---

### v5.0-5.2 → v5.3 Feature Activation

**Old (Still Works):**
```javascript
entity.enableMemory = true       // ❌ Property doesn't exist
entity.enableLearning()          // ❌ Method doesn't exist
entity.enableRelationships()     // ❌ Method doesn't exist
```

**New (v5.3 Unified API):**
```javascript
entity.enable('memory', 'learning', 'relationships')  // ✅ Correct
entity.disable('learning')
entity.isEnabled('memory')  // → true
```

---

## Glossary 📚

**Material** - JSON definition describing an entity's essence, behavior, physics, and visual properties. Not "config" but ontological description of what something *is*.

**Entity** - Living instance of a Material spawned into the World. Has position, velocity, age, and optional ontology features (memory, emotion, relationships, learning, skills).

**Ontology** - Optional systems that give entities inner life: Memory (with Ebbinghaus decay), Emotion (PAD model), Relationships, Learning (Q-learning), Skills.

**PAD Model** - Three-dimensional emotion representation: **P**leasure (valence), **A**rousal, **D**ominance. Used throughout MDS for emotional state.

**Feature** - Optional capability that can be enabled on entities: `'memory'`, `'learning'`, `'relationships'`, `'skills'`. Activated via `entity.enable(...)`.

**Phase** - Development milestone in MDS v5 roadmap. Phase 1 = Ontology Foundation, Phase 2 = Advanced Ontology (Similarity, Crystallization, Coupling, Reasoning, Decay).

**LLM** - Large Language Model integration for dynamic dialogue generation and semantic similarity. Configured via `WorldOptions.llm`.

**Crystallization** - Long-term memory consolidation that forms "crystals" (durable memories) from repeated patterns. Prevents memory saturation.

**Coupling** - Symbolic-Physical Coupling maps emotion and memory to physics properties (speed, mass, friction). Makes internal state affect external behavior.

**Decay** - Time-based relationship deterioration. Unused relationships weaken and eventually prune automatically.

**Salience** - Memory importance value (0-1) that decays over time following Ebbinghaus forgetting curve. Determines recall priority.

**Essence** - Core semantic description of what a Material *is*. Primary identifier for info-physics. Can be in any language.

**Field** - Emergent relationship zone spawned between entities. Has radius, duration, and effects on nearby entities.

**Info-Physics** - Core MDS simulation paradigm where entities interact based on semantic similarity, not hardcoded rules. "Physics of meaning."

---

## System Checklist Coverage 🎯

**Want to know if MDS implements a specific ontology feature?**

See [**SYSTEM-MAPPING.md**](./SYSTEM-MAPPING.md) for complete checklist → API mapping.

**Quick Summary:**

| Category | Coverage | Status |
|----------|----------|--------|
| Memory System | 5/5 | ✅ **100%** |
| Emotion System | 4/4 | ✅ **100%** |
| World Mind | 3/3 | ✅ **100%** |
| Physics/Manifestation | 3/3 | ✅ **100%** |
| Core Engine | 4.5/5 | 90% |
| Cognition | 3.5/4 | 88% (v5.4: 100%) |
| Dialogue/Language | 3.5/4 | 88% (v5.4: 100%) |
| Entity API | 7.5/9 | 83% (v5.4: 94%) |
| Relationships | 2.5/3 | 83% |
| Serialization | 2.5/3 | 83% |
| Future ("ลืม") | 2.5/4 | 63% |
| **TOTAL** | **41.5/47** | **88.3%** → **94.7% in v5.4** |

**Legend:**
- ✅ Fully implemented
- ⚠️ Implemented (different naming/location)
- 🔄 Planned for v5.4.0
- ❌ Future work

**Example: "Does MDS have reflection?"**
→ Check [SYSTEM-MAPPING.md](./SYSTEM-MAPPING.md) → "ENTITY" section → `entity.reflect()` → 🔄 v5.4.0

---

## Next Steps

- **System Mapping:** See [**System Checklist Coverage**](./SYSTEM-MAPPING.md) (NEW in v5.4)
- **Game Dev:** See [Gaming Examples](./examples/gaming.md)
- **Smart Home:** See [IoT Examples](./examples/smarthome.md)
- **Education:** See [Teaching Examples](./examples/education.md)
- **Philosophy:** Read [WTF Is This Really](./wtf-is-this-really.md)
- **Contributing:** Read [Contributing Guide](./meta/CONTRIBUTING.md)

---

**Back to:** [Overview](./OVERVIEW.md) | [Changelog](./meta/CHANGELOG.md)
