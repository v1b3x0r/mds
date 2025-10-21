# MDS Cookbook — Quick Recipes

**Copy, paste, customize. Each recipe ≤ 15 lines.**

Think of this as a menu from that weird cafe where they serve code and philosophy in equal measure. 🍜

⸻

## 📚 Table of Contents

### v4 Basics (Works in Engine or World)
1. [Spawn a simple entity](#1-spawn-a-simple-entity)
2. [Make a bouncing ball](#2-make-a-bouncing-ball)
3. [Create a shy entity that runs away](#3-create-a-shy-entity-that-runs-away)
4. [Spawn entities with random movement](#4-spawn-entities-with-random-movement)
5. [Deterministic replay (same every time)](#5-deterministic-replay)
6. [Save & load simulation state](#6-save--load-simulation-state)

### v5 Ontology (Memory & Emotion)
7. [Add memory to an entity](#7-add-memory-to-an-entity)
8. [Set emotion and watch it decay](#8-set-emotion-and-watch-it-decay)
9. [Track relationships between entities](#9-track-relationships)

### v5 Communication
10. [Send messages between entities](#10-send-messages-between-entities)
11. [Create a simple dialogue tree](#11-create-a-dialogue-tree)
12. [Broadcast to nearby entities](#12-broadcast-to-nearby-entities)

### v5 Cognitive
13. [Enable learning from experience](#13-enable-learning)
14. [Teach skills and practice](#14-teach-skills-and-practice)
15. [Detect learning patterns](#15-detect-learning-patterns)

### v5 World Mind
16. [Get world statistics](#16-get-world-statistics)
17. [Detect emergent patterns](#17-detect-emergent-patterns)
18. [Check collective emotion](#18-check-collective-emotion)

⸻

## v4 Basics

### 1. Spawn a simple entity

```typescript
import { Engine, loadMaterial } from '@v1b3x0r/mds-core'

const engine = new Engine()
const material = await loadMaterial('./paper.shy.mdm')

engine.spawn(material, 200, 200)
engine.start()
```

⸻

### 2. Make a bouncing ball

**Material file:** `ball.bouncy.mdm`
```json
{
  "material": "ball.bouncy",
  "essence": "A bouncy ball",
  "manifestation": { "emoji": "⚽" },
  "physics": {
    "mass": 0.5,
    "friction": 0.02,
    "bounce": 0.9
  }
}
```

**Code:**
```typescript
const engine = new Engine({
  worldBounds: { minX: 0, maxX: 800, minY: 0, maxY: 600 },
  boundaryBehavior: 'bounce'
})

const ball = await loadMaterial('./ball.bouncy.mdm')
const entity = engine.spawn(ball, 400, 100)

// Give it initial velocity
entity.vx = 5
entity.vy = 0

engine.start()
```

⸻

### 3. Create a shy entity that runs away

**Material file:** `ghost.shy.mdm`
```json
{
  "material": "ghost.shy",
  "essence": "A shy ghost that flees",
  "manifestation": { "emoji": "👻" },
  "behavior": {
    "onHover": {
      "type": "velocity",
      "value": { "vx": 3, "vy": -3 }
    }
  }
}
```

⸻

### 4. Spawn entities with random movement

```typescript
const engine = new Engine()

for (let i = 0; i < 10; i++) {
  const entity = engine.spawn(material,
    Math.random() * 800,
    Math.random() * 600
  )

  // Random initial velocity
  entity.vx = (Math.random() - 0.5) * 4
  entity.vy = (Math.random() - 0.5) * 4
}

engine.start()
```

⸻

### 5. Deterministic replay

```typescript
// Same seed = identical simulation every time
const engine = new Engine({ seed: 12345 })

const e1 = engine.spawn(material, 100, 100)
const e2 = engine.spawn(material, 200, 200)

// Entropy values will be identical across runs
console.log(e1.entropy) // Always same value
console.log(e2.entropy) // Always same value

engine.start()
```

⸻

### 6. Save & load simulation state

```typescript
import { World } from '@v1b3x0r/mds-core'

const world = new World()

// ... spawn entities, run simulation ...

// Save
const snapshot = world.snapshot()
localStorage.setItem('world', JSON.stringify(snapshot))

// Load (later)
const data = JSON.parse(localStorage.getItem('world'))
const materialMap = new Map([
  ['paper.shy', shyMaterial],
  ['paper.curious', curiousMaterial]
])
const fieldMap = new Map([
  ['field.trust.core', trustField]
])

world.restore(data, materialMap, fieldMap)
```

⸻

## v5 Ontology

### 7. Add memory to an entity

```typescript
import { World } from '@v1b3x0r/mds-core'

const world = new World({ features: { ontology: true } })
const entity = world.spawn(material, 100, 100)

// Add a memory
entity.remember({
  timestamp: Date.now(),
  type: 'observation',
  subject: 'player',
  content: 'First meeting',
  salience: 0.9  // High importance
})

// Recall memories
const memories = entity.memory.recall({ subject: 'player' })
console.log(`Entity has ${memories.length} memories about player`)

// Memories decay over time following Ebbinghaus curve
```

⸻

### 8. Set emotion and watch it decay

```typescript
const world = new World({ features: { ontology: true } })
const entity = world.spawn(material, 100, 100)

// Set emotion (PAD model: Pleasure-Arousal-Dominance)
entity.setEmotion({
  valence: 0.8,   // Happy (positive)
  arousal: 0.6,   // Excited
  dominance: 0.7  // In control
})

// Check emotion
console.log(entity.emotion)

// Emotion decays over time (returns to neutral)
setInterval(() => {
  console.log(`Valence: ${entity.emotion.valence.toFixed(2)}`)
}, 1000)
```

⸻

### 9. Track relationships

```typescript
const world = new World({ features: { ontology: true } })

const alice = world.spawn({ essence: 'Alice' }, 100, 100)
const bob = world.spawn({ essence: 'Bob' }, 200, 200)

alice.enableRelationships()
bob.enableRelationships()

// Create relationship
alice.addRelationship(bob.id, 'friend', 0.7)

// Update bond over time
alice.updateRelationship(bob.id, {
  bond: '+0.1',  // Increase by 0.1
  lastInteraction: Date.now()
})

// Check relationship
const rel = alice.getRelationship(bob.id)
console.log(`Bond strength: ${rel.bond}`)
```

⸻

## v5 Communication

### 10. Send messages between entities

```typescript
const world = new World({ features: { communication: true } })

const sender = world.spawn({ essence: 'Sender' }, 100, 100)
const receiver = world.spawn({ essence: 'Receiver' }, 200, 200)

// Send direct message
sender.sendMessage('greeting', 'Hello there!', receiver)

// Receiver reads messages
if (receiver.hasUnreadMessages()) {
  const msg = receiver.readNextMessage()
  console.log(`${msg.sender.m.essence} says: ${msg.content}`)
}
```

⸻

### 11. Create a dialogue tree

```typescript
import { DialogueBuilder } from '@v1b3x0r/mds-core'

const dialogue = new DialogueBuilder('quest_start')
  .addNode({
    id: 'greeting',
    text: 'Hello, traveler! Need a quest?',
    choices: [
      { text: 'Yes, please', next: 'accept_quest' },
      { text: 'Not now', next: 'farewell' }
    ]
  })
  .addNode({
    id: 'accept_quest',
    text: 'Go defeat the dragon!',
    choices: [
      { text: 'On my way!', next: 'end' }
    ]
  })
  .build()

// Use with DialogueManager
const world = new World({ features: { communication: true } })
world.dialogueManager?.startDialogue(entity, dialogue)
```

⸻

### 12. Broadcast to nearby entities

```typescript
const world = new World({ features: { communication: true } })

const speaker = world.spawn({ essence: 'Town crier' }, 400, 300)

// Broadcast (delivered to entities within 200px)
speaker.sendMessage('broadcast', 'Hear ye, hear ye!')

// Message delivered to all nearby entities
world.tick(0.016)
```

⸻

## v5 Cognitive

### 13. Enable learning

```typescript
const world = new World({ features: { cognitive: true } })
const entity = world.spawn({ essence: 'Apprentice' }, 100, 100)

entity.enableLearning()

// Add experience
entity.learning.addExperience({
  action: 'craft_sword',
  context: 'training',
  reward: 0.8,
  success: true,
  timestamp: Date.now()
})

// Check learned value
const value = entity.learning.getActionValue('craft_sword')
console.log(`Action value: ${value}`) // Higher = more rewarding
```

⸻

### 14. Teach skills and practice

```typescript
const world = new World({ features: { cognitive: true } })
const entity = world.spawn({ essence: 'Student' }, 100, 100)

entity.enableSkills()

// Learn a skill
entity.skills.learnSkill('blacksmithing')

// Practice improves proficiency
entity.skills.practice('blacksmithing', 0.9) // 90% success rate

// Check proficiency
const skill = entity.skills.getSkill('blacksmithing')
console.log(`Proficiency: ${skill.proficiency}`) // 0..1 (novice → master)
```

⸻

### 15. Detect learning patterns

```typescript
const entity = world.spawn({ essence: 'Learner' }, 100, 100)
entity.enableLearning()

// Add multiple experiences
entity.learning.addExperience({ action: 'explore', context: 'forest', reward: 1.0, timestamp: Date.now() })
entity.learning.addExperience({ action: 'rest', context: 'forest', reward: 0.5, timestamp: Date.now() + 1000 })
entity.learning.addExperience({ action: 'explore', context: 'forest', reward: 1.0, timestamp: Date.now() + 2000 })

// Get detected patterns (sequences)
const patterns = entity.learning.getPatterns()
patterns.forEach(p => {
  console.log(`Pattern: ${p.sequence.map(s => s.action).join(' → ')}`)
  console.log(`Frequency: ${p.frequency}`)
})
```

⸻

## v5 World Mind

### 16. Get world statistics

```typescript
const world = new World({
  features: {
    ontology: true,
    physics: true,
    cognitive: true
  }
})

// ... spawn entities, run simulation ...

const stats = world.getWorldStats()

console.log('Entities:', stats.entityCount)
console.log('Avg age:', stats.avgAge)
console.log('Avg energy:', stats.avgEnergy)
console.log('Total memories:', stats.totalMemories)
console.log('Total experiences:', stats.totalExperiences)
console.log('Avg emotional valence:', stats.avgEmotionalValence)
```

⸻

### 17. Detect emergent patterns

```typescript
const world = new World()

// ... spawn multiple entities ...

world.start()

setInterval(() => {
  const patterns = world.getPatterns()

  patterns.forEach(p => {
    if (p.pattern === 'clustering') {
      console.log('Entities formed a cluster!')
      console.log(`Strength: ${p.strength}`)
      console.log(`Entities: ${p.entities.join(', ')}`)
    }

    if (p.pattern === 'synchronization') {
      console.log('Entities moving in sync!')
    }

    if (p.pattern === 'stillness') {
      console.log('World is calm')
    }
  })
}, 5000)
```

⸻

### 18. Check collective emotion

```typescript
const world = new World({ features: { ontology: true } })

// ... spawn entities with emotions ...

const mood = world.getCollectiveEmotion()

if (mood) {
  if (mood.valence > 0.5) {
    console.log('World is happy!')
  } else if (mood.valence < -0.5) {
    console.log('World is sad')
  }

  if (mood.arousal > 0.7) {
    console.log('World is energetic')
  }
}
```

⸻

## 💡 Pro Tips

1. **Start simple** → Add features gradually
2. **Use feature flags** → Enable only what you need
3. **Deterministic mode** → Use seeds for reproducible experiments
4. **Save often** → Use snapshots for checkpoints
5. **Monitor patterns** → Watch for emergent behavior
6. **Combine systems** → Memory + emotion + learning = rich NPCs

⸻

## 🎯 Common Combos

### Smart NPC (remembers + learns)
```typescript
const world = new World({
  features: { ontology: true, cognitive: true }
})

const npc = world.spawn({ essence: 'Village elder' }, 400, 300)
npc.enableLearning()
npc.enableRelationships()

// NPC remembers player interactions
npc.remember({ type: 'interaction', subject: 'player', content: 'quest_accepted', salience: 0.9, timestamp: Date.now() })

// NPC learns from quest outcomes
npc.learning.addExperience({ action: 'give_quest', reward: 1.0, timestamp: Date.now() })

// NPC tracks relationship
npc.addRelationship('player_id', 'ally', 0.8)
```

### Emotional character (mood affects behavior)
```typescript
const world = new World({ features: { ontology: true, physics: true } })

const character = world.spawn({ essence: 'Nervous person' }, 200, 200)
character.setEmotion({ valence: -0.3, arousal: 0.9, dominance: 0.3 })

// Fear increases chaos (entity moves erratically)
// Joy reduces entropy (entity becomes more organized)
// Check emotion-physics coupling in action!
```

### Social simulation (village)
```typescript
const world = new World({
  features: { ontology: true, communication: true }
})

// Spawn villagers
const villagers = []
for (let i = 0; i < 10; i++) {
  const v = world.spawn({ essence: `Villager ${i}` },
    Math.random() * 800,
    Math.random() * 600
  )
  v.enableRelationships()
  villagers.push(v)
}

// They naturally form relationships through proximity
// Watch for clustering patterns
setInterval(() => {
  const patterns = world.getPatterns()
  console.log('Social patterns:', patterns.map(p => p.pattern))
}, 5000)
```

⸻

**That's it!**

Mix and match these recipes to create your own simulations. 🧪

⸻

_Written in Chiang Mai. Powered by coffee and curiosity._ ☕✨
