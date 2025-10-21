# API Reference — Quick Start + Lookup

**Fast reference for MDS v5.0 API. For deep dives, see role-based guides.**

---

## Installation

```bash
npm install @v1b3x0r/mds-core
```

**CDN (Browser):**
```html
<script type="module">
  import { World } from 'https://esm.sh/@v1b3x0r/mds-core'
</script>
```

---

## Quick Start (30 Seconds)

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

// 3. Enable memory
entity.enableMemory = true

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

### `World`

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
    rendering?: 'dom' | 'canvas' | 'webgl' | 'headless'
  }
  environment?: string | EnvironmentConfig
  weather?: string | WeatherConfig
  worldBounds?: {
    minX: number, maxX: number,
    minY: number, maxY: number
  }
  boundaryBehavior?: 'none' | 'clamp' | 'bounce'
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `spawn(material, x, y)` | Create entity at position |
| `spawnField(field, x, y)` | Create field at position |
| `destroy(entity)` | Remove entity from world |
| `start()` | Begin simulation loop |
| `stop()` | Halt simulation loop |
| `tick(dt)` | Manual tick (if not using start/stop) |
| `snapshot()` | Serialize world state |
| `restore(data, materialMap, fieldMap)` | Load world state |
| `getWorldStats()` | Get aggregate statistics |
| `getPatterns()` | Detect emergent patterns |
| `getCollectiveEmotion()` | Average population emotion |
| `enableLLM(config)` | Enable LLM integration |

---

### `Entity`

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `m` | MdsMaterial | Material definition |
| `x`, `y` | number | Position |
| `vx`, `vy` | number | Velocity |
| `age` | number | Time alive (seconds) |
| `energy` | number | Energy level (0-1) |
| `opacity` | number | Visual opacity (0-1) |
| `destroyed` | boolean | Marked for removal |
| `enableMemory` | boolean | Enable memory system |

**Methods:**

| Method | Description |
|--------|-------------|
| `remember(memory)` | Store a memory |
| `setEmotion(pad)` | Set emotional state |
| `getEmotion()` | Get current emotion |
| `speak(category?, lang?)` | **v5.1** Get dialogue phrase from declarative config |
| `updateTriggerContext(context)` | **v5.1** Update trigger context (for emotion transitions) |
| `checkEmotionTriggers()` | **v5.1** Evaluate and apply emotion triggers |
| `enableLearning()` | Enable Q-learning |
| `enableSkills()` | Enable skill system |
| `enableRelationships()` | Enable relationship tracking |
| `sendMessage(type, content, target)` | Send message to entity |
| `hasUnreadMessages()` | Check for new messages |
| `readNextMessage()` | Get oldest unread message |

---

### `Memory` (accessed via `entity.memory`)

**Methods:**

| Method | Description |
|--------|-------------|
| `remember(memory)` | Add new memory |
| `recall(filter?)` | Retrieve memories (most salient first) |
| `getAllMemories()` | Get all memories |
| `forget(memoryId)` | Remove specific memory |
| `clear()` | Clear all memories |

**Memory Object:**
```typescript
interface Memory {
  id: string
  timestamp: number
  type: string
  subject: string
  content: string | object
  salience: number    // 0-1 (importance)
}
```

---

### `Learning` (accessed via `entity.learning`)

**Methods:**

| Method | Description |
|--------|-------------|
| `addExperience(exp)` | Record learning experience |
| `getActionValue(action)` | Get Q-value for action |
| `getStats()` | Learning statistics |

**Experience Object:**
```typescript
interface Experience {
  action: string
  context?: string
  reward: number      // -1 to +1
  timestamp: number
}
```

---

### `Skills` (accessed via `entity.skills`)

**Methods:**

| Method | Description |
|--------|-------------|
| `learnSkill(name)` | Add new skill |
| `practice(name, success)` | Practice skill (0-1 success) |
| `getSkillStats(name)` | Get skill proficiency |
| `getAllSkills()` | List all skills |

---

### `Relationships` (accessed via entity methods)

**Methods:**

| Method | Description |
|--------|-------------|
| `addRelationship(targetId, type, strength)` | Create bond |
| `updateRelationship(targetId, strength)` | Change strength |
| `getRelationship(targetId)` | Get specific bond |
| `getRelationshipsByType(type)` | Filter by type |
| `getAllRelationships()` | Get all bonds |
| `removeRelationship(targetId)` | Delete bond |

**Relationship Object:**
```typescript
interface Relationship {
  targetId: string
  type: string        // 'friend', 'rival', 'neutral', custom
  strength: number    // -1 to +1
  createdAt: number
  updatedAt: number
}
```

---

## Material Definition Format

### Minimal Material

```json
{
  "material": "unique.id",
  "essence": "What this thing is"
}
```

### Full Material (v5.1 with Dialogue + Emotion Triggers)

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

## Field Definition Format

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

## Emotion (PAD Model)

```typescript
interface Emotion {
  valence: number      // -1 (sad) to +1 (happy)
  arousal: number      // -1 (calm) to +1 (excited)
  dominance: number    // -1 (submissive) to +1 (dominant)
}
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

## Lifecycle Hooks

```typescript
entity.onSpawn = (world, entity) => {
  console.log('Entity spawned!')
}

entity.onUpdate = (dt, entity) => {
  if (entity.age > 10) {
    console.log('Entity is 10 seconds old')
  }
}

entity.onDestroy = (entity) => {
  console.log('Entity destroyed')
}
```

---

## Serialization

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

## LLM Integration

### Enable

```typescript
world.enableLLM({
  provider: 'anthropic',      // or 'openai', 'openrouter'
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022'
})
```

### Set Creator Context

```typescript
world.setCreatorContext({
  name: 'Alice',
  style: 'poetic',
  worldTheme: 'forest spirits'
})
```

### Generate Dialogue

```typescript
entity.sendMessage('greeting', 'auto-generate', otherEntity)
// Uses LLM to generate contextual dialogue based on:
// - entity.m.essence
// - entity.getEmotion()
// - entity.memory.recall()
```

---

## Statistics & Patterns

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

### Pattern Detection

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

### Collective Emotion

```typescript
const mood = world.getCollectiveEmotion()
// → {
//   valence: 0.42,   // Population is slightly happy
//   arousal: 0.18,   // Population is calm
//   dominance: 0.53  // Population feels moderately in control
// }
```

---

## Bundle Sizes

| Package | Size (Minified) | Gzipped |
|---------|-----------------|---------|
| Core only | 18 KB | 5.5 KB |
| + Ontology | 45 KB | 12 KB |
| + Physics | 58 KB | 15 KB |
| + Communication | 88 KB | 24 KB |
| + Cognitive | 104 KB | 28 KB |
| Full (all features) | 133 KB | 31 KB |

**Tree-shakable:** Import only what you need.

```typescript
// Minimal (18 KB)
import { World } from '@v1b3x0r/mds-core'
const world = new World()

// With ontology (45 KB)
const world = new World({ features: { ontology: true } })

// Full features (133 KB)
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

## TypeScript Types

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

### Recipe 1: NPC With Memory

```javascript
const npc = world.spawn({ essence: 'Quest giver' }, 300, 300)
npc.enableMemory = true

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

### Recipe 2: Learning Enemy

```javascript
const enemy = world.spawn({ essence: 'Smart boss' }, 500, 500)
enemy.enableLearning()

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

### Recipe 3: Relationship Network

```javascript
const alice = world.spawn({ essence: 'Alice' }, 200, 200)
const bob = world.spawn({ essence: 'Bob' }, 400, 200)

alice.enableRelationships()
bob.enableRelationships()

alice.addRelationship(bob.id, 'friend', 0.7)
bob.addRelationship(alice.id, 'friend', 0.8)

const friends = alice.getRelationshipsByType('friend')
console.log(friends)
```

---

### Recipe 4: Emotional UI

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

### Recipe 5: Headless Simulation

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

### Issue: Entities not moving

**Solution:** Make sure physics is enabled or manually set velocity.

```javascript
// Enable physics
const world = new World({ features: { physics: true } })

// Or manually set velocity
entity.vx = 2
entity.vy = -2
```

---

### Issue: Memory not persisting

**Solution:** Ensure `enableMemory = true` is set.

```javascript
entity.enableMemory = true  // ← Required!
entity.remember({ ... })
```

---

### Issue: Learning not working

**Solution:** Call `enableLearning()` before adding experiences.

```javascript
entity.enableLearning()  // ← Required!
entity.learning.addExperience({ ... })
```

---

### Issue: Relationships not saved

**Solution:** Call `enableRelationships()` before adding bonds.

```javascript
entity.enableRelationships()  // ← Required!
entity.addRelationship(otherId, 'friend', 0.8)
```

---

## Next Steps

- **Game Dev:** [Gaming Examples](./examples/gaming.md)
- **Smart Home:** [IoT Examples](./examples/smarthome.md)
- **Education:** [Teaching Examples](./examples/education.md)
- **Art:** [Creative Examples](./examples/art.md)
- **Storytelling:** [Narrative Examples](./examples/storytelling.md)
- **Research:** [Academic Examples](./examples/research.md)
- **Philosophy:** [WTF Is This](./wtf-is-this-really.md)

---

**Back to:** [Overview](./OVERVIEW.md)
