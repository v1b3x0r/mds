# MDS Cookbook — Quick Hacks & Experiments

**Each recipe is ≤ 10 lines. Copy, paste, play.**

Think of this as a menu from that weird cafe where they serve code and philosophy in equal measure. 🍜

⸻

## 🧪 Table of Contents

1. [Make two emojis fall in love](#1-make-two-emojis-fall-in-love)
2. [Create a shy entity that runs away](#2-create-a-shy-entity-that-runs-away)
3. [Spawn a trust field when entities get close](#3-spawn-a-trust-field-when-entities-get-close)
4. [Make entities drift apart when ignored](#4-make-entities-drift-apart-when-ignored)
5. [Add initial random movement](#5-add-initial-random-movement)
6. [Deterministic replay (same every time)](#6-deterministic-replay-same-every-time)
7. [Save & load full simulation state](#7-save--load-full-simulation-state)
8. [Lifecycle hooks for spawn/destroy](#8-lifecycle-hooks-for-spawndestroy)
9. [Make an entity that ages gracefully](#9-make-an-entity-that-ages-gracefully)
10. [Create a bouncing ball](#10-create-a-bouncing-ball)
11. [Field memory (remember where they met)](#11-field-memory-remember-where-they-met)
12. [MBTI personalities with dialogues](#12-mbti-personalities-with-dialogues)

⸻

## 1. Make two emojis fall in love

**The concept:** Spawn two entities, watch them drift toward each other via info-physics.

```typescript
import { Engine } from '@v1b3x0r/mds-core'

const engine = new Engine()

const heart1 = engine.spawn({
  material: "heart.a",
  essence: "A lonely heart",
  manifestation: { emoji: "💙" }
}, 100, 200)

const heart2 = engine.spawn({
  material: "heart.b",
  essence: "Another lonely heart",
  manifestation: { emoji: "💚" }
}, 400, 200)

// Give them initial velocity
heart1.vx = 1
heart2.vx = -1

engine.start()
```

**What happens:** They drift toward each other because of proximity forces. When close enough, they might spawn a field (if you set `onProximity`).

⸻

## 2. Create a shy entity that runs away

**The concept:** On hover, entity gets velocity *away* from cursor.

```typescript
const shy = engine.spawn({
  material: "ghost.shy",
  essence: "A shy ghost",
  manifestation: { emoji: "👻" },
  behavior: {
    onHover: {
      type: "velocity",
      value: { vx: 3, vy: -3 }  // runs up-right
    }
  }
}, 250, 250)

engine.start()
```

**Tweak:** Change `vx`/`vy` based on cursor position (requires custom `onProximity` logic).

⸻

## 3. Spawn a trust field when entities get close

**The concept:** When two entities are within 80px, spawn a shared field.

```json
// field.trust.mdspec.json
{
  "material": "field.trust",
  "type": "field",
  "origin": "$bind",
  "radius": 120,
  "duration": 8000,
  "visual": {
    "aura": "radial-gradient(circle, rgba(167,139,250,0.3), transparent)"
  }
}
```

```typescript
const entity1 = engine.spawn(material1, 100, 100)
const entity2 = engine.spawn(material2, 200, 100)

entity1.onProximity = (eng, other, dist) => {
  if (dist < 80) {
    eng.spawnField(trustField, (entity1.x + other.x) / 2, (entity1.y + other.y) / 2)
  }
}

engine.start()
```

**Result:** A glowing field appears when they meet. Adjust `radius` and `duration` to taste.

⸻

## 4. Make entities drift apart when ignored

**The concept:** If no interaction for N seconds, increase `friction` to slow them down, or add repulsive force.

```typescript
entity.onIdle = () => {
  // Gradually increase friction when idle
  entity.m.physics = entity.m.physics || {}
  entity.m.physics.friction = Math.min(0.2, (entity.m.physics.friction || 0.05) + 0.01)
}
```

**Alternative:** Use negative velocity toward nearby entities if no `onProximity` triggered recently.

⸻

## 5. Add initial random movement

**The concept:** Spawn entities with random velocity so they don't sit still.

```typescript
const entity = engine.spawn(material, 200, 200)

// Give random velocity
entity.vx = (Math.random() - 0.5) * 4
entity.vy = (Math.random() - 0.5) * 4

engine.start()
```

**Why:** Without this, entities with low friction just sit there. Initial velocity makes the simulation lively.

⸻

## 6. Deterministic replay (same every time)

**The concept:** Use a seed so simulation runs identically every time.

```typescript
const engine = new Engine({ seed: 12345 })

const entity = engine.spawn(material, 100, 100)
entity.vx = 2  // Same initial conditions

engine.start()
```

**Result:** Every run produces the same movement. Perfect for debugging or artistic control.

⸻

## 7. Save & load full simulation state

**The concept:** Snapshot engine state, store it, restore later.

```typescript
// Save
const snapshot = engine.snapshot()
localStorage.setItem('my-sim', JSON.stringify(snapshot))

// Load
const data = JSON.parse(localStorage.getItem('my-sim'))
const materialMap = new Map([[material.material, material]])
const fieldMap = new Map()

engine.stop()
engine.clear()
engine.restore(data, materialMap, fieldMap)
engine.start()
```

**Use case:** Let users save their creations, export to file, or replay from specific timestamp.

⸻

## 8. Lifecycle hooks for spawn/destroy

**The concept:** Run custom logic when entity is born or dies.

```typescript
entity.onSpawn = (eng, e) => {
  console.log(`✨ ${e.m.material} spawned at (${e.x}, ${e.y})`)
}

entity.onDestroy = (e) => {
  console.log(`💀 ${e.m.material} destroyed after ${Math.round(e.age)}s`)
}

entity.onUpdate = (dt, e) => {
  if (e.age > 10) {
    console.log('Entity is getting old...')
  }
}
```

**Use case:** Logging, analytics, triggering other events, playing sounds.

⸻

## 9. Make an entity that ages gracefully

**The concept:** Entity fades slowly over time, then vanishes.

```json
{
  "material": "memory.fading",
  "essence": "A fading memory",
  "manifestation": {
    "emoji": "🌸",
    "aging": {
      "start_opacity": 1,
      "decay_rate": 0.003
    }
  }
}
```

**Result:** Lives ~5 minutes (1 / 0.003 ≈ 333 seconds).

**Tweak:** Higher `decay_rate` = shorter life.

⸻

## 10. Create a bouncing ball

**The concept:** Use world bounds with `bounce` behavior.

```typescript
const engine = new Engine({
  worldBounds: {
    minX: 0,
    maxX: window.innerWidth,
    minY: 0,
    maxY: window.innerHeight
  },
  boundaryBehavior: 'bounce',
  boundaryBounceDamping: 0.85
})

const ball = engine.spawn({
  material: "ball.bouncy",
  essence: "A bouncy ball",
  manifestation: { emoji: "⚽" },
  physics: {
    mass: 1,
    friction: 0.01,
    bounce: 0.9
  }
}, 200, 200)

ball.vx = 5
ball.vy = 3

engine.start()
```

**Result:** Ball bounces off screen edges. Adjust `boundaryBounceDamping` to control energy loss.

⸻

## 11. Field memory (remember where they met)

**The concept:** When entities meet, spawn a field that stays even after they leave.

```typescript
entity1.onProximity = (eng, other, dist) => {
  if (dist < 60) {
    const memoryField = eng.spawnField({
      material: "field.memory",
      type: "field",
      origin: "$bind",
      radius: 80,
      duration: 20000,  // 20 seconds
      visual: { aura: "rgba(255, 192, 203, 0.2)" }
    }, (entity1.x + other.x) / 2, (entity1.y + other.y) / 2)

    console.log(`💭 Memory created at (${memoryField.x}, ${memoryField.y})`)
  }
}
```

**Result:** Visual trail of where relationships happened.

⸻

## 12. MBTI personalities with dialogues

**The concept:** Assign personality traits + dialogue system.

```typescript
const personalities = {
  ENTP: {
    emoji: "🎧",
    dialogues: {
      intro: ["Beat synced. Feeling the vibe."],
      bond: ["This connection hits different."],
      conflict: ["Static on the line. Let's reset."]
    }
  },
  INFP: {
    emoji: "📝",
    dialogues: {
      intro: ["New stanza written."],
      bond: ["We drafted a canon line together."],
      conflict: ["Metaphors clash. Pause?"]
    }
  }
}

const teen = engine.spawn({
  material: "teen.holo",
  essence: "Neon DJ sampling rumors",
  manifestation: { emoji: "🎧" }
}, 150, 150)

teen._personality = personalities.ENTP

teen.onProximity = (eng, other, dist) => {
  if (dist < 70) {
    const dialogue = teen._personality.dialogues.bond
    console.log(`💬 ${dialogue[0]}`)
  }
}

engine.start()
```

**Result:** Entities "speak" based on personality when interacting.

⸻

## 🍜 Bonus: Kitchen Sink (Everything at once)

Want to see all features in one chaotic sim? Check `/examples/lovefield-tailwind.html`.

It has:
- ✅ MBTI dialogues
- ✅ Relationship timeline
- ✅ Save/Load story
- ✅ Deterministic mode toggle
- ✅ Lifecycle hooks
- ✅ Bond/breakup/dream fields
- ✅ HUD + metrics

Open it, spawn 5 teens, watch the chaos unfold. 🌀

⸻

## 🧭 Pro Tips

1. **Start with one entity** → test behavior in isolation
2. **Add a second** → see fields emerge
3. **Log everything** → use lifecycle hooks to debug
4. **Tweak friction first** → it controls how "floaty" things feel
5. **Save often** → use snapshot() during experiments

⸻

## 🔮 What to try next

- Combine recipes (e.g., aging + memory fields)
- Add sound effects to lifecycle hooks
- Create a "graveyard" for destroyed entities
- Build a dialogue tree with branching paths
- Make entities that reproduce (spawn children)
- Implement gravity toward cursor position

⸻

**That's it!**

These recipes should keep you busy for a week. Mix, remix, break things.

If you make something cool, tag us. We're curious what weird stuff you'll build. 👀

⸻

_Cooked in Chiang Mai. Best served with coffee._ ☕✨
