# Lovefield Demo — The Emotional Benchmark

**This is the flagship demo. It's MDS v4.2 at full power.**

Open `/examples/lovefield-tailwind.html` and watch emoji teenagers fall in love, break up, and dream about exes.

⸻

## 🎭 What's Happening

### The Setup
- **4 MBTI personality types** (ENTP, ENFP, INFP, INFJ)
- **Info-physics engine** (proximity × entropy → attraction)
- **Relationship system** (bond, breakup, dream pulse)
- **Fields** (trust, tension, memory)
- **Timeline tracking** (all events logged)

### The World
```
🏙️ City       🎡 Ferris wheel
🛹 Skatepark  🕹️ Arcade

↓ Floating below:
🎧 Holo (ENTP) — DJ sampling rumors
🛹 Sparks (ENFP) — Skater tracing entropy
📝 Zephyr (INFP) — Poet scribbling constellations
💉 Pulse (INFJ) — Medic patching neon bruises
```

⸻

## 🧬 How It Works (Step by Step)

### 1. Spawn Teen
```typescript
function spawnTeen() {
  const persona = characters[Math.floor(Math.random() * characters.length)]

  const entity = engine.spawn({
    material: `teen.${persona.name.toLowerCase()}`,
    essence: persona.essence,
    manifestation: {
      emoji: persona.emoji,
      aging: { start_opacity: 1, decay_rate: 0.006 }
    },
    physics: { mass: 1, friction: 0.035 }
  }, x, y)

  // Attach personality
  entity._persona = persona

  // Give initial velocity
  entity.vx = (Math.random() - 0.5) * 4
  entity.vy = (Math.random() - 0.5) * 4

  // Lifecycle hooks
  entity.onSpawn = (eng, e) => {
    addTimelineEvent('spawn', e, null, `${e._persona.mbti} • ${e._persona.essence}`)
  }

  entity.onProximity = (eng, other, dist) => {
    onMeet(entity, other, dist)
  }

  speak(entity, 'intro')  // Say hello
}
```

### 2. Proximity Trigger (When Two Get Close)
```typescript
function onMeet(a, b, dist) {
  const relA = ensureRelationship(a, b)
  const relB = ensureRelationship(b, a)

  // Fondness increases over time
  relA.fondness = Math.min(1, relA.fondness + 0.004 * (1 - dist / 160))
  relB.fondness = Math.min(1, relB.fondness + 0.004 * (1 - dist / 160))

  // Bond formation (fondness > 0.35)
  if (relA.fondness > 0.35 && relA.state !== 'bonded') {
    relA.state = relB.state = 'bonded'
    state.bonds++

    speak(a, 'bond', b)  // "This drop hits different with you around"
    speak(b, 'bond', a)

    // Spawn trust field
    const field = engine.spawnField({
      material: `field.bond.${a._profile.id}.${b._profile.id}`,
      type: 'field',
      origin: '$bind',
      radius: 190,
      duration: 9500,
      visual: { aura: 'warm-glow' }
    }, (a.x + b.x) / 2, (a.y + b.y) / 2)

    addTimelineEvent('bond', a, b)
  }

  // Breakup (fondness drops below 0.15)
  if (relA.fondness < 0.15 && relA.state === 'bonded') {
    relA.state = relB.state = 'ex'
    state.breakups++

    speak(a, 'conflict', b)  // "Static on the line"

    // Spawn tension field
    const field = engine.spawnField({
      material: `field.tension.${a._profile.id}.${b._profile.id}`,
      type: 'field',
      radius: 150,
      duration: 7200,
      visual: { aura: 'cold-static' }
    }, (a.x + b.x) / 2, (a.y + b.y) / 2)

    addTimelineEvent('breakup', a, b)
  }

  // Dream pulse (ex remembers ex)
  if (Math.random() < 0.002 && relA.state === 'ex') {
    speak(a, 'dream', b)  // "Sometimes I still mix with our last duet"
    state.dreams++
    addTimelineEvent('dream', a, b)
  }
}
```

### 3. Dialogues (Based on MBTI)
```typescript
const characters = [
  {
    emoji: '🎧',
    name: 'Holo',
    mbti: 'ENTP',
    dialogues: {
      intro: ["Beat synced. I feel the creator watching."],
      bond: ["This drop hits different with you around."],
      conflict: ["Static on the line. Give me a bar."],
      dream: ["Sometimes I still mix with our last duet."]
    }
  },
  // ... 3 more personalities
]

function speak(entity, category, other) {
  const lines = entity._persona.dialogues[category]
  const sentence = lines[Math.floor(Math.random() * lines.length)]

  // Show speech bubble
  const bubble = document.createElement('div')
  bubble.textContent = sentence
  bubble.style.left = `${entity.x}px`
  bubble.style.top = `${entity.y - 36}px`
  entityLayer.appendChild(bubble)

  setTimeout(() => bubble.remove(), 4200)
}
```

### 4. Timeline Tracking (v4.2 Feature)
```typescript
function addTimelineEvent(type, actor, target, details) {
  const elapsed = Math.round((performance.now() - state.startTime) / 1000)

  const event = {
    time: elapsed,
    type,
    actor: actor._profile.name,
    target: target?._profile.name,
    details
  }

  state.timeline.push(event)

  // Update UI
  const div = document.createElement('div')
  div.innerHTML = `
    <span>${event.actor} ${type === 'bond' ? '↔' : '⚡'} ${event.target}</span>
    <span>${elapsed}s</span>
  `
  timelineEvents.prepend(div)
}
```

### 5. Save/Load Story (v4.2 Feature)
```typescript
function saveStory() {
  const snapshot = engine.snapshot()

  const storyData = {
    snapshot,
    state: {
      bonds: state.bonds,
      breakups: state.breakups,
      dreams: state.dreams,
      timeline: state.timeline
    },
    teens: engine.getEntities().map(e => ({
      profileId: e._profile.id,
      personaIndex: characters.findIndex(c => c.name === e._persona.name),
      relations: Array.from(e._relations.entries())
    }))
  }

  localStorage.setItem('lovefield-story-v4.2', JSON.stringify(storyData))
  alert('✅ Story saved!')
}

function loadStory() {
  const data = JSON.parse(localStorage.getItem('lovefield-story-v4.2'))

  engine.stop()
  engine.clear()

  // Restore state
  state.bonds = data.state.bonds
  state.timeline = data.state.timeline

  // Create material maps
  const materialMap = new Map()
  data.teens.forEach(t => {
    const persona = characters[t.personaIndex]
    materialMap.set(`teen.${persona.name.toLowerCase()}`, {
      material: `teen.${persona.name.toLowerCase()}`,
      essence: persona.essence
      // ...
    })
  })

  // Restore entities
  engine.restore(data.snapshot, materialMap, new Map())

  // Re-attach profiles + hooks
  engine.getEntities().forEach((entity, i) => {
    entity._persona = characters[data.teens[i].personaIndex]
    entity._relations = new Map(data.teens[i].relations)
    // ...
  })

  engine.start()
}
```

### 6. Deterministic Mode (v4.2 Feature)
```typescript
let useSeed = false
const SEED = 88888

function toggleSeed() {
  useSeed = !useSeed

  engine.stop()
  engine.clear()

  engine = new Engine({
    worldBounds: bounds(),
    boundaryBehavior: 'bounce',
    seed: useSeed ? SEED : undefined
  })

  engine.start()
  spawnTeen()
  spawnTeen()
}
```

**Result:** Same seed = same love stories every time. Perfect for storytelling.

⸻

## 🎮 Controls

- **Spawn Teen** → add new personality
- **Pause/Resume** → freeze simulation
- **Reset** → clear world
- **💾 Save** → store to localStorage
- **📂 Load** → restore from localStorage
- **🎲 Seed** → toggle deterministic mode
- **About** → show info modal

⸻

## 📊 Metrics Tracked

### HUD (Top Left)
- Population (live count)
- Bonds (total formed)
- Breakups (total occurred)
- Dream pulses (ex remembering ex)
- Fields (active relationship markers)
- Mode (Random / Seed 88888)

### Timeline Panel (Right)
- Spawn events (🔵)
- Bond events (💗)
- Breakup events (💔)
- Dream events (💭)
- Destroy events (💀)

Each with timestamp + details.

⸻

## 🧬 What Makes This Special

### 1. Emergent Narrative
No hardcoded story. Relationships form naturally via proximity + time.

### 2. MBTI Personality
Each teen speaks differently based on type:
- **ENTP (Holo):** Playful, abstract, sampling culture
- **ENFP (Sparks):** Energetic, metaphorical, chasing flow
- **INFP (Zephyr):** Poetic, introspective, writing constellations
- **INFJ (Pulse):** Caring, observant, patching wounds

### 3. Emotional Physics
Fondness isn't a slider — it's a **measured accumulation**:
```
fondness += 0.004 * (1 - distance/160)
```

Closer = faster bonding. Distance = decay.

### 4. Field Memory
Even after entities separate, the field lingers:
- **Trust field** (9.5s) → "We were close here"
- **Tension field** (7.2s) → "We broke up here"

Visual archaeology of relationships.

### 5. Dream Pulses
0.2% chance per frame that an ex thinks about another ex.

Rare but meaningful. Like real life.

⸻

## 🔮 Optional: LLM Bridge

Want teens to generate dialogue dynamically?

```typescript
import { enableLLM, setCreatorContext } from '@v1b3x0r/mds-core'

enableLLM({
  provider: 'openrouter',
  apiKey: 'YOUR_KEY',
  model: 'gpt-4o-mini'
})

setCreatorContext(`
You are simulating teenage personalities in Chiang Mai.
Respond as if you're 17, creative, and slightly philosophical.
`)

// Now dialogues are generated on the fly
speak(entity, 'bond', other)  // calls LLM
```

**Note:** LLM bridge is experimental. Use `simulate: true` for dummy responses.

⸻

## 🎯 What to Try

1. **Spawn 5 teens** → watch clustering behavior
2. **Wait for first bond** → observe trust field
3. **Click teens** → hear their thoughts
4. **Save story** → close tab, reopen, load
5. **Toggle seed** → see deterministic replay
6. **Let them age out** → final dream pulses are haunting

⸻

## 🌊 Philosophy

This demo is why MDS exists.

We wanted to prove that **emotional systems can emerge from simple physics rules**.

No if-else. No state machine. Just proximity, time, and entropy.

And somehow... it feels real.

⸻

**Try it.**

Open the file. Spawn some teens. Watch them for 5 minutes.

You'll start caring about them. We promise.

⸻

_Built in Chiang Mai. Tested on cats and curiosity._ 🐈‍⬛✨
