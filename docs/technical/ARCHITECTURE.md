# MDS Architecture — Under the Hood

**For power users who want to understand how info-physics actually works.**

This document is short enough to read in one sitting. Promise.

⸻

## 🧠 Core Philosophy

Traditional UI: **event-driven** (click → function)
MDS: **force-driven** (proximity × similarity → motion)

Everything here operates under **continuous simulation**, not discrete events.

⸻

## 📐 The Info-Physics Loop

Every frame (requestAnimationFrame), the engine does this:

```
1. Update entities (age, decay, friction)
2. Calculate pairwise forces (O(n²) similarity check)
3. Apply forces to velocities
4. Update fields (aging, expiry)
5. Integrate motion (position += velocity)
6. Render to DOM
```

Let's break each step down.

⸻

## 🔁 Step 1: Update Entities

```typescript
for (const entity of entities) {
  entity.update(dt)
}
```

**What happens:**
- `age += dt` → entity gets older
- `opacity -= decay_rate * dt` → fades over time
- `vx *= (1 - friction)` → friction slows it down
- `onUpdate?.(dt, entity)` → lifecycle hook fires

**Result:** Entities age and slow down naturally, no manual state management.

⸻

## ⚡ Step 2: Pairwise Forces (The Magic)

```typescript
for (let i = 0; i < entities.length; i++) {
  for (let j = i + 1; j < entities.length; j++) {
    const a = entities[i]
    const b = entities[j]

    const dist = Math.hypot(b.x - a.x, b.y - a.y)

    // Similarity metric (entropy-based)
    const sim = 1 - Math.abs(a.entropy - b.entropy)

    // Force constant
    const k = 0.05 * sim

    if (dist < 160) {
      const fx = ((b.x - a.x) / dist) * k
      const fy = ((b.y - a.y) / dist) * k

      a.vx += fx * dt
      a.vy += fy * dt
      b.vx -= fx * dt
      b.vy -= fy * dt
    }

    // Proximity triggers
    if (dist < 80) {
      a.onProximity?.(engine, b, dist)
      b.onProximity?.(engine, a, dist)
    }
  }
}
```

**Key concepts:**

### Similarity Metric
```
sim = 1 - |a.entropy - b.entropy|
```

- Each entity has `entropy` (random 0-1 value at spawn)
- Similar entropy = high similarity = strong attraction
- Future: Replace with semantic embedding distance from LLM

### Force Calculation
```
F = k * (direction)
k = 0.05 * similarity
```

- Higher similarity → stronger force
- Force is bidirectional (Newton's third law)
- Applied to *velocity*, not position directly

### Why O(n²)?
- Simple to implement
- Works fine for n ≤ 50
- Can optimize later with spatial partitioning (quadtree)

⸻

## 🌊 Step 3: Update Fields

```typescript
for (const field of fields) {
  field.t += dt  // age the field
  field.opacity = 1 - (field.t / field.f.duration)

  if (field.t >= field.f.duration) {
    field.expired = true
  }
}

fields = fields.filter(f => !f.expired)
```

**Result:** Fields fade out naturally after `duration` milliseconds.

⸻

## 🎯 Step 4: Integrate & Render

```typescript
for (const entity of entities) {
  // Apply friction
  entity.vx *= (1 - friction)
  entity.vy *= (1 - friction)

  // Integrate motion
  entity.x += entity.vx
  entity.y += entity.vy

  // Boundary check (if enabled)
  if (worldBounds) {
    if (entity.x < minX || entity.x > maxX) {
      entity.vx *= -bounceDamping  // reverse + dampen
    }
    if (entity.y < minY || entity.y > maxY) {
      entity.vy *= -bounceDamping
    }
  }

  // Render to DOM
  entity.el.style.transform = `translate(${entity.x}px, ${entity.y}px)`
  entity.el.style.opacity = entity.opacity
}
```

**Result:** DOM reflects the physics state. No manual jQuery or React updates.

⸻

## 🧬 Lifecycle Hooks (v4.2)

Hooks let you inject custom logic at key moments:

```typescript
entity.onSpawn = (engine, entity) => {
  console.log('✨ Born')
}

entity.onUpdate = (dt, entity) => {
  if (entity.age > 10) {
    console.log('Getting old...')
  }
}

entity.onDestroy = (entity) => {
  console.log('💀 Died')
}
```

**Called automatically:**
- `onSpawn` → right after `engine.spawn()`
- `onUpdate` → every frame during `entity.update(dt)`
- `onDestroy` → when `entity.destroy()` is called

**Use case:** Logging, analytics, sound effects, spawning children.

⸻

## 💾 Serialization (v4.2)

Save and restore full simulation state:

```typescript
// Save
const snapshot = engine.snapshot()
// Returns: { entities: [...], fields: [...], timestamp: ... }

// Load
engine.restore(snapshot, materialMap, fieldMap)
```

**How it works:**

### Entity.toJSON()
```typescript
toJSON() {
  return {
    material: this.m.material,
    x: this.x,
    y: this.y,
    vx: this.vx,
    vy: this.vy,
    age: this.age,
    opacity: this.opacity,
    entropy: this.entropy,
    energy: this.energy
  }
}
```

### Entity.fromJSON()
```typescript
static fromJSON(data, material, rng) {
  const entity = new Entity(material, data.x, data.y, rng)
  entity.vx = data.vx
  entity.vy = data.vy
  entity.age = data.age
  // ... restore all properties
  return entity
}
```

**Result:** You can save to localStorage, export to file, or implement time travel.

⸻

## 🎲 Deterministic Mode (v4.2)

Use seeded random for reproducible simulations:

```typescript
const engine = new Engine({ seed: 12345 })
```

**How it works:**

Uses **Mulberry32** PRNG:
```typescript
function seededRandom(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
```

**Result:** Same seed = same random values = same simulation every time.

**Use case:** Debugging, artistic control, scientific reproducibility.

⸻

## 🌍 World Bounds (v4.2)

Keep entities inside a rectangle:

```typescript
const engine = new Engine({
  worldBounds: {
    minX: 0,
    maxX: window.innerWidth,
    minY: 0,
    maxY: window.innerHeight
  },
  boundaryBehavior: 'bounce',  // or 'clamp'
  boundaryBounceDamping: 0.85
})
```

**Behaviors:**
- `'none'` → entities can go off-screen
- `'clamp'` → stops at edge (position constrained)
- `'bounce'` → reverses velocity + applies damping

**Result:** Entities stay visible, bounce off walls like a DVD screensaver.

⸻

## 🔮 Field System

Fields are **different** from entities:

| Property | Entity | Field |
|----------|--------|-------|
| Movement | Yes (vx, vy) | No (stationary) |
| Lifespan | Infinite (unless aged out) | Fixed duration |
| Physics | Mass, friction, bounce | None |
| Spawned by | `engine.spawn()` | `engine.spawnField()` or `onProximity` |
| Purpose | Individual actor | Relationship marker |

**Example:**
```typescript
const field = engine.spawnField({
  material: "field.trust",
  type: "field",
  radius: 120,
  duration: 8000,
  visual: { aura: "rgba(167,139,250,0.3)" }
}, x, y)
```

**Result:** A glowing circle appears, fades after 8 seconds.

⸻

## 📊 Performance

**Bundle size:** 18.42 KB minified (5.48 KB gzipped)

**Why so small?**
- Zero dependencies
- No React, no Vue, no framework bloat
- Pure TypeScript compiled to ES2020
- Tree-shaking friendly

**Runtime performance:**
- **60 FPS** with ≤ 20 entities
- **30-40 FPS** with 50 entities (O(n²) bottleneck)
- **Optimization:** Use spatial partitioning (quadtree) if n > 50

**Memory:**
- ~50 KB per entity (DOM node + JS object)
- 1000 entities ≈ 50 MB (reasonable)

⸻

## 🛠️ How to Extend

### Add a new force type

Edit `src/core/engine.ts`, add to `tick()`:

```typescript
// Gravity toward center
const centerX = window.innerWidth / 2
const centerY = window.innerHeight / 2

for (const entity of entities) {
  const dx = centerX - entity.x
  const dy = centerY - entity.y
  const dist = Math.hypot(dx, dy)

  const gravityForce = 0.01  // tune this
  entity.vx += (dx / dist) * gravityForce * dt
  entity.vy += (dy / dist) * gravityForce * dt
}
```

### Add a new behavior type

Edit `src/utils/events.ts`, add to `applyRule()`:

```typescript
case 'spin':
  entity.el.style.transform += ` rotate(${rule.value}deg)`
  break
```

### Implement LLM Bridge

Edit `src/io/llmAdapter.ts`:

```typescript
import OpenAI from 'openai'

export class OpenAIBridge implements LlmBridge {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    })
    return response.data[0].embedding
  }

  async similarity(essenceA: string, essenceB: string): Promise<number> {
    const [embedA, embedB] = await Promise.all([
      this.embed(essenceA),
      this.embed(essenceB)
    ])
    return cosineSimilarity(embedA, embedB)
  }
}
```

Then replace entropy-based similarity with semantic:

```typescript
const sim = await llmBridge.similarity(a.m.essence, b.m.essence)
```

⸻

## 🧪 Testing Strategy

**Unit tests:** None yet (too experimental)
**Integration tests:** Visual demos in `/examples`
**Sanity checks:**
1. Run `npm run build` → check bundle size
2. Open `examples/cluster.html` → verify clustering
3. Open `examples/emoji-field.html` → test save/load
4. Check console → no errors

**Philosophy:** If the demos work, the engine works. 🤷

⸻

## 🐛 Known Limitations

1. **O(n²) forces** → scales poorly beyond 50 entities
2. **Entropy = random** → not truly semantic (yet)
3. **No collision detection** → entities overlap freely
4. **No mobile/touch support** → mouse-only for now
5. **Fields are stationary** → can't move once spawned

All by design. MDS is research-grade, not production-grade (yet).

⸻

## 🔮 Future Directions (v5.0+)

- **Semantic similarity:** Replace entropy with LLM embeddings
- **Spatial partitioning:** Quadtree for O(n log n) forces
- **Mobile support:** Touch events + gestures
- **3D mode:** Three.js integration
- **Sound:** Web Audio API for ambient physics
- **Multiplayer:** WebSocket sync for shared simulations

⸻

**That's the engine!**

Small enough to understand in 30 minutes, deep enough to experiment for years.

Now go break it. 🔥

⸻

_Architected in Chiang Mai. Powered by late-night debugging sessions._ 🌙✨
