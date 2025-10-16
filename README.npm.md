# @v1b3x0r/mds-core

[![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![bundle size](https://img.shields.io/badge/min-18.42KB-blue)](https://bundlephobia.com/package/@v1b3x0r/mds-core)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

**MDS (Material Definition System)** is a lightweight TypeScript engine for creating autonomous, interactive entities through declarative JSON definitions. Think of it as a physics engine, but for information and behavior.

## Features

- **18.42 KB minified** (5.48 KB gzipped) - Zero runtime dependencies
- **Declarative**: Define materials in JSON, not imperative code
- **Info-physics**: Entities interact based on similarity and proximity
- **Lifecycle hooks**: `onSpawn`, `onUpdate`, `onDestroy` callbacks
- **Serialization**: Save/load full simulation state
- **Deterministic mode**: Reproducible simulations with seeded random
- **TypeScript**: Full type definitions included
- **ESM**: Modern ES modules for tree-shaking

## Installation

```bash
npm install @v1b3x0r/mds-core
```

## Quick Start

```typescript
import { Engine, loadMaterial } from "@v1b3x0r/mds-core"

// Create engine
const engine = new Engine()

// Load material definition
const material = await loadMaterial("./paper.shy.mdspec.json")

// Spawn entity
const entity = engine.spawn(material, 100, 100)

// Start simulation
engine.start()
```

## Basic Material Definition

Create a `paper.curious.mdspec.json` file:

```json
{
  "material": "paper.curious",
  "essence": "A paper that leans toward you when hovered",
  "manifestation": {
    "emoji": "🐥"
  },
  "behavior": {
    "onHover": {
      "type": "transform",
      "value": "scale(1.15) translateY(-5px)",
      "duration": "0.3s"
    }
  },
  "physics": {
    "mass": 1.0,
    "friction": 0.95
  }
}
```

## Core Concepts

### Info-Physics Engine

Entities attract or repel each other based on a **similarity metric** (currently entropy-based, designed for semantic embeddings in the future):

```typescript
// Similarity = 1 - |entropyA - entropyB|
// Similar entities attract, different entities repel
```

### Lifecycle Hooks

```typescript
const entity = engine.spawn(material, x, y)

entity.onSpawn = (engine, entity) => {
  console.log("Entity spawned!")
}

entity.onUpdate = (dt, entity) => {
  if (entity.age > 10) {
    console.log("Entity is 10 seconds old")
  }
}

entity.onDestroy = (entity) => {
  console.log("Entity destroyed")
}
```

### Serialization

```typescript
// Save state
const snapshot = engine.snapshot()
localStorage.setItem("world", JSON.stringify(snapshot))

// Load state
const data = JSON.parse(localStorage.getItem("world"))
engine.restore(data, materialMap, fieldMap)
```

### Deterministic Mode

```typescript
// Same seed = same behavior
const engine = new Engine({ seed: 12345 })

const e1 = engine.spawn(material) // entropy: 0.42...
const e2 = engine.spawn(material) // entropy: 0.73...

// New engine with same seed = identical results
const engine2 = new Engine({ seed: 12345 })
const e3 = engine2.spawn(material) // entropy: 0.42... (same!)
```

### World Bounds

```typescript
const engine = new Engine({
  worldBounds: {
    minX: 0, maxX: 800,
    minY: 0, maxY: 600
  },
  boundaryBehavior: "bounce", // "none" | "clamp" | "bounce"
  boundaryBounceDamping: 0.85
})
```

## API Reference

### Engine

```typescript
class Engine {
  constructor(options?: EngineOptions)

  spawn(material: MdsMaterial, x?: number, y?: number): Entity
  spawnField(field: MdsField, x: number, y: number): Field

  start(): void
  stop(): void

  snapshot(): EngineSnapshot
  restore(snapshot: EngineSnapshot, materialMap: Map, fieldMap: Map): void
}
```

### Entity

```typescript
class Entity {
  m: MdsMaterial        // Material definition
  x: number             // Position X
  y: number             // Position Y
  vx: number            // Velocity X
  vy: number            // Velocity Y
  age: number           // Age in seconds
  entropy: number       // Similarity metric (0..1)
  opacity: number       // Current opacity (0..1)

  onSpawn?: (engine: Engine, entity: Entity) => void
  onUpdate?: (dt: number, entity: Entity) => void
  onDestroy?: (entity: Entity) => void

  destroy(): void
}
```

### Material Schema (MDSpec v4.1)

See full schema in [docs/guides/MDSPEC_GUIDE.md](https://github.com/v1b3x0r/mds/blob/main/docs/guides/MDSPEC_GUIDE.md)

```typescript
interface MdsMaterial {
  material: string               // Unique ID
  essence?: string               // Semantic description
  intent?: string                // Short purpose

  manifestation?: {
    emoji?: string               // Visual representation
    visual?: string              // Style hint
    aging?: {
      start_opacity?: number     // Initial opacity
      decay_rate?: number        // Fade per second
    }
  }

  behavior?: {
    onHover?: MdsBehaviorRule
    onIdle?: MdsBehaviorRule
    onProximity?: MdsBehaviorRule
    // ... more events
  }

  physics?: {
    mass?: number                // Inertia
    friction?: number            // Drag (0..1)
    bounce?: number              // Elasticity (0..1)
  }
}
```

## Examples

### 1. Simple Clustering

```typescript
import { Engine } from "@v1b3x0r/mds-core"

const engine = new Engine()

// Spawn 5 entities with random positions
for (let i = 0; i < 5; i++) {
  const material = {
    material: `entity-${i}`,
    essence: "A curious particle",
    manifestation: { emoji: "✨" },
    physics: { mass: 1, friction: 0.95 }
  }

  engine.spawn(material, Math.random() * 800, Math.random() * 600)
}

engine.start()
// Entities will cluster based on similarity
```

### 2. Lifecycle Tracking

```typescript
const entity = engine.spawn(material, 100, 100)

entity.onSpawn = (engine, entity) => {
  console.log(`${entity.m.material} spawned at (${entity.x}, ${entity.y})`)
}

entity.onUpdate = (dt, entity) => {
  if (entity.age > 5 && entity.opacity < 0.5) {
    console.log("Entity is fading away...")
  }
}

entity.onDestroy = (entity) => {
  console.log(`${entity.m.material} lived for ${entity.age.toFixed(2)}s`)
}
```

### 3. Save/Load System

```typescript
// Save button
saveButton.onclick = () => {
  const snapshot = engine.snapshot()
  localStorage.setItem("simulation", JSON.stringify(snapshot))
}

// Load button
loadButton.onclick = () => {
  const data = JSON.parse(localStorage.getItem("simulation"))

  // Prepare material/field maps
  const materialMap = new Map([
    ["paper.shy", shyMaterial],
    ["paper.curious", curiousMaterial]
  ])

  const fieldMap = new Map([
    ["field.trust.core", trustField]
  ])

  engine.restore(data, materialMap, fieldMap)
  engine.start()
}
```

## Documentation

- **Quick Start**: [MDSpec Guide](https://github.com/v1b3x0r/mds/blob/main/docs/guides/MDSPEC_GUIDE.md) - Learn the schema in 3 minutes
- **Recipes**: [Cookbook](https://github.com/v1b3x0r/mds/blob/main/docs/guides/COOKBOOK.md) - 12 copy-paste examples
- **Deep Dive**: [Architecture](https://github.com/v1b3x0r/mds/blob/main/docs/technical/ARCHITECTURE.md) - How the engine works
- **Migration**: [v3 → v4 Upgrade Guide](https://github.com/v1b3x0r/mds/blob/main/docs/technical/V4-UPGRADE.md)
- **Changelog**: [Version History](https://github.com/v1b3x0r/mds/blob/main/docs/meta/CHANGELOG.md)

## Live Demos

- [01-basics/emoji-field.html](https://v1b3x0r.github.io/mds/examples/01-basics/emoji-field.html) - Lifecycle + save/load
- [02-advanced/cluster.html](https://v1b3x0r.github.io/mds/examples/02-advanced/cluster.html) - Timeline scrubber
- [03-showcase/lovefield.html](https://v1b3x0r.github.io/mds/examples/03-showcase/lovefield.html) - Relationship simulation

## Browser Support

- ES2020+
- Modern browsers (Chrome 80+, Firefox 74+, Safari 13.1+, Edge 80+)
- Node.js 18+

## TypeScript

Full type definitions included:

```typescript
import type {
  Engine,
  Entity,
  Field,
  MdsMaterial,
  MdsField,
  EngineOptions,
  EngineSnapshot
} from "@v1b3x0r/mds-core"
```

## Performance

- **O(n²) pairwise forces**: Works well for 5-50 entities (research/demo scale)
- **60 FPS** on modern hardware
- **18.42 KB minified** - smaller than most images
- **Zero dependencies** - no bloat

For larger simulations (>50 entities), consider spatial partitioning (quadtree) - see [Architecture docs](https://github.com/v1b3x0r/mds/blob/main/docs/technical/ARCHITECTURE.md).

## Use Cases

- **Interactive art installations** - Living, breathing visuals
- **Game prototypes** - Emergent NPC behavior without AI
- **Research simulations** - Study emergent systems
- **Educational demos** - Visualize complex systems
- **Ambient UIs** - Interfaces that feel alive

## Philosophy

MDS is built on three principles:

1. **Essence-first**: A material with just an `essence` field is valid and meaningful
2. **Emergence over control**: Complex behaviors arise from simple rules
3. **Information is physical**: Similarity and proximity create forces

Read more: [README on GitHub](https://github.com/v1b3x0r/mds#readme)

## Contributing

See [CONTRIBUTING.md](https://github.com/v1b3x0r/mds/blob/main/docs/meta/CONTRIBUTING.md)

## License

MIT © v1b3x0r

Built in Chiang Mai 🌄 | Powered by coffee and curiosity ☕✨

---

**Questions?** Open an issue: https://github.com/v1b3x0r/mds/issues
**More examples?** Check the [Cookbook](https://github.com/v1b3x0r/mds/blob/main/docs/guides/COOKBOOK.md)
