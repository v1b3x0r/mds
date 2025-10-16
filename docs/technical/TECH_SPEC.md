# MDS v4.2 — Info-Physics Engine (Stable)

> **This is not a component.**
> **This is not a UI.**
> **This is a living material in a field.**

JSON here is not config. It's a description of a stateful entity that behaves under **information-physics**: proximity, similarity, entropy, time.

---

## 🌌 What is MDS v4.2?

A tiny, framework-free TypeScript engine that treats materials as **living entities** with autonomous behavior. Materials age, fade, move, and spawn relationship fields—all without hardcoded rules or AI.

**Core principles:**
- **Essence-first design**: A material with only `essence` still works
- **Info-physics**: Entities attract/repel based on semantic similarity
- **Emergence**: Complex behaviors arise from simple rules
- **Production-ready**: Lifecycle hooks, serialization, deterministic mode
- **Tiny**: 18.42 KB minified (5.48 KB gzipped)

---

## 🚀 Quick Start

### Installation

```bash
npm install @v1b3x0r/mds-core
```

### Basic Usage

```typescript
import { Engine, loadMaterial } from '@v1b3x0r/mds-core'

// Initialize engine
const engine = new Engine()

// Load a material
const material = await loadMaterial('./paper.shy.mdspec.json')

// Spawn entity at position (x, y)
const entity = engine.spawn(material, 100, 100)

// Start simulation
engine.start()
```

### Minimal Material (Essence-Only)

```json
{
  "material": "emotion.trust",
  "essence": "การหายใจพร้อมกันของสองใจ"
}
```

This works. No visual properties required.

---

## 📊 Info-Physics Algorithm

### Attraction Force

```typescript
// Pairwise calculation for all entities
for (let i = 0; i < entities.length; i++) {
  for (let j = i + 1; j < entities.length; j++) {
    const a = entities[i], b = entities[j]

    // Distance
    const dist = Math.hypot(b.x - a.x, b.y - a.y)

    // Similarity (based on entropy difference)
    const sim = 1 - Math.abs(a.entropy - b.entropy)

    // Force = constant × similarity
    const k = 0.05 * sim

    // Apply if within proximity threshold (160px)
    if (dist < 160) {
      const fx = (dx / dist) * k
      const fy = (dy / dist) * k

      a.vx += fx * dt
      a.vy += fy * dt
      b.vx -= fx * dt  // Newton's third law
      b.vy -= fy * dt
    }
  }
}
```

**Result**: Similar entities (close entropy values) cluster together naturally.

---

## 🎨 Material Schema

### Complete Material Definition

```json
{
  "$schema": "https://mds.v1b3.dev/schema/v4",
  "material": "paper.shy",
  "intent": "observe",
  "essence": {
    "th": "เหมือนกระดาษโน้ตที่อยากให้เห็นแต่ไม่กล้าส่ง",
    "en": "A quiet note that hopes to be found."
  },
  "behavior": {
    "onHover": { "effect": "glow.soft" },
    "onRepeatHover": {
      "threshold": 3,
      "effect": "slide.away",
      "emoji": "🫣"
    },
    "onProximity": {
      "condition": "distance<80",
      "spawn": "field.trust.core"
    }
  },
  "physics": {
    "mass": 0.1,
    "friction": 0.02
  },
  "manifestation": {
    "emoji": "💌",
    "aging": {
      "start_opacity": 1,
      "decay_rate": 0.01
    }
  }
}
```

### Field Definition

```json
{
  "material": "field.trust.core",
  "type": "field",
  "radius": 120,
  "duration": 45000,
  "visual": { "aura": "gentle amber" },
  "effect_on_others": {
    "opacity": 0.9
  }
}
```

Fields are **emergent relationships** spawned by proximity interactions.

---

## 🎯 Demo Pages

### Demo A: Emoji Field Interaction

```bash
npm run dev
# Opens: http://localhost:3000/examples/emoji-field.html
```

**What to observe:**
- 💌 Shy paper - Hover 3 times → slides away with 🫣
- 🐥 Curious paper - Leans in when hovered
- ✨ When entities get close (< 80px) → trust field spawns
- ⏱️ Papers fade naturally over time

### Demo B: Self-Organizing Clusters

```bash
# Open: http://localhost:3000/examples/cluster.html
```

**What to observe:**
- 5 entities with random entropy values (0..1)
- Similar entropy → attract (cluster together)
- Different entropy → repel (stay apart)
- Clustering emerges within ~10 seconds

**No AI. No hardcoded rules. Pure info-physics.**

---

## 📚 API Reference

### Engine

```typescript
class Engine {
  spawn(material: MdsMaterial, x?: number, y?: number): Entity
  spawnField(field: MdsField, x: number, y: number): Field
  start(): void
  stop(): void
  getEntities(): Entity[]
  getFields(): Field[]
  clear(): void
}
```

### Entity

```typescript
class Entity {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  entropy: number
  energy: number
  opacity: number

  update(dt: number): void
  render(): void
  destroy(): void
}
```

### Loader

```typescript
async function loadMaterial(path: string): Promise<MdsMaterial>
async function loadMaterials(paths: string[]): Promise<MdsMaterial[]>
```

### LLM Bridge (Optional)

```typescript
interface LlmBridge {
  speak(materialId: string, context: Record<string, unknown>): Promise<string>
  similarity?(essenceA: string, essenceB: string): Promise<number>
}

// Stub implementation (no network calls)
import { DummyBridge, setLlmBridge } from '@v1b3x0r/mds-core'
```

---

## 🔬 Technical Details

### Bundle Size

- **Minified**: 9.15 KB
- **Gzipped**: 2.99 KB
- **Target**: ≤ 20 KB ✅

### Browser Support

- Modern browsers with ES2020 support
- Chrome 80+, Firefox 74+, Safari 13.1+, Edge 80+

### Dependencies

- **Runtime**: Zero
- **Dev**: TypeScript, Vite

---

## 🧠 Philosophy

### Why "Info-Physics"?

Traditional UI frameworks treat interactions as **events** (click, hover, drag). MDS v4 treats interactions as **forces** in an information field.

**Example:**
- Two materials with essence `"trust"` and `"connection"` have high semantic similarity
- When they get close (< 80px), attraction force increases
- A trust field spawns at their midpoint
- Field affects nearby entities (boosts opacity, amplifies behavior)

**This is not metaphor. It's simulation.**

### Essence-First Design

```json
{ "material": "emotion.trust", "essence": "การหายใจพร้อมกันของสองใจ" }
```

This is a **complete, valid material**. It will:
- Spawn as an entity
- Age naturally
- Respond to proximity (if `onProximity` behavior added later)
- Participate in info-physics

No visual properties required. Essence is enough.

### Emergence Over Control

MDS v4 prefers:
- **Simple rules → Complex behavior** (clustering emerges from similarity metric)
- **Declarative intent** (`"intent": "observe"`) over imperative commands
- **Autonomous lifecycle** (aging, decay, field expiration) over manual state management

---

## 🛠️ Advanced Usage

### Custom Similarity Metric

```typescript
import { Engine } from '@v1b3x0r/mds-core'

// Override default entropy-based similarity
class CustomEngine extends Engine {
  private tick(dt: number) {
    // Custom similarity: semantic embedding distance
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const sim = cosineSimilarity(
          embed(entities[i].m.essence),
          embed(entities[j].m.essence)
        )
        // Apply forces...
      }
    }
  }
}
```

### LLM Integration

```typescript
import { setLlmBridge } from '@v1b3x0r/mds-core'

setLlmBridge({
  async speak(materialId, context) {
    const response = await fetch('/api/llm', {
      method: 'POST',
      body: JSON.stringify({ materialId, context })
    })
    return response.text()
  },

  async similarity(essenceA, essenceB) {
    const embeddings = await getEmbeddings([essenceA, essenceB])
    return cosineSimilarity(embeddings[0], embeddings[1])
  }
})
```

---

## 📖 Documentation

- [MATERIAL_GUIDE.md](./MATERIAL_GUIDE.md) — Complete schema reference (v3 legacy)
- [CLAUDE.md](./CLAUDE.md) — AI context & architecture decisions
- [V4-UPGRADE.md](./prompt/V4-UPGRADE.md) — Implementation spec

---

## 🗂️ Project Structure

```
mds-core/
├── src/
│   ├── core/          # Engine, Entity, Field
│   ├── schema/        # Type definitions
│   ├── utils/         # Math, events, random
│   ├── io/            # Loader, LLM bridge
│   └── index.ts       # Public API
├── examples/
│   ├── emoji-field.html
│   ├── cluster.html
│   ├── paper.shy.mdspec.json
│   ├── paper.curious.mdspec.json
│   └── field.trust.core.mdspec.json
├── dist/
│   └── mds-core.esm.js
└── package.json
```

---

## 🤝 Contributing

This is a **research experiment**. Contributions welcome, but understand:

1. **Not production-ready** — This is a proof of concept
2. **Breaking changes likely** — v4 is unstable
3. **Philosophy over features** — We care about emergence, not polish

If you want to explore info-physics UIs with us, open an issue or PR.

---

## 📜 License

MIT © [v1b3x0r](https://github.com/v1b3x0r)

---

## 🌟 Credits

**Concept**: Material as living entity with autonomous behavior
**Algorithm**: Info-physics forces (proximity × similarity)
**Inspiration**: Conway's Game of Life, Boids, Agent-based modeling

**Built for the universe.** 🌌

---

## 📊 Comparison with v3.0

| Feature | v3.0 | v4.2 |
|---------|------|------|
| **Concept** | CSS material system | Info-physics engine |
| **JSON Role** | Visual config | Entity ontology |
| **Behavior** | Event-driven (hover, press) | Autonomous (aging, forces) |
| **Physics** | Optional tactile deform | Core attraction/repulsion |
| **Theme** | Light/dark switching | None (essence-driven) |
| **Bundle Size** | 25 KB | 18.42 KB |
| **Lifecycle** | None | Hooks (onSpawn/onUpdate/onDestroy) |
| **State** | Not serializable | Full snapshot/restore |
| **Mode** | Non-deterministic | Deterministic option |
| **Use Case** | UI design system | Interactive simulations |

**v3 and v4 are incompatible. Choose based on your goal:**
- Want CSS materials? → Use v3
- Want living entities? → Use v4.2

---

**TL;DR:**
- Materials are descriptions (ontology)
- Fields are emergent (spawned by relations)
- Works without LLM; LLM bridge is optional
- Production-ready: lifecycle hooks, serialization, deterministic mode
- Core is tiny (18.42 KB minified; 5.48 KB gzipped)

---

_This is not a config file. It's a description of a living material._ ✨
