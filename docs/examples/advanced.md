# Advanced — For Devs Who Actually Want The Boring Part

**tl;dr:** React/Svelte/Node integration. API reference. TypeScript types. The technical stuff.

---

## Installation

```bash
npm install @v1b3x0r/mds-core
```

**CDN:**
```html
<script type="module">
  import { World } from 'https://esm.sh/@v1b3x0r/mds-core'
</script>
```

---

## Quick Start (v5.1 - JSON-Only Entities)

```javascript
import { World } from '@v1b3x0r/mds-core'

// Method 1: Inline material
const world = new World({
  features: { ontology: true, communication: true }
})

const entity = world.spawn({
  essence: 'Thing that remembers',
  dialogue: {
    intro: [{ lang: { en: 'Hello!' } }]
  },
  emotion: {
    transitions: [{
      trigger: 'player.attack',
      to: 'anger',
      intensity: 0.9
    }]
  }
}, 200, 200)

console.log(entity.speak('intro'))  // "Hello!"
entity.enableMemory = true
world.start()
```

**Method 2: Load .mdm file (recommended)**

```javascript
import { World } from '@v1b3x0r/mds-core'
import heroblindMaterial from './materials/entities/heroblind.mdm' assert { type: 'json' }

const world = new World({
  features: { ontology: true, communication: true }
})

const npc = world.spawn(heroblindMaterial, 300, 300)
console.log(npc.speak('intro'))  // Auto-detects language
world.start()
```

---

## React Integration

```jsx
import { useEffect, useRef } from 'react'
import { World } from '@v1b3x0r/mds-core'

function MDSWorld() {
  const containerRef = useRef(null)
  const worldRef = useRef(null)

  useEffect(() => {
    const world = new World({
      features: { ontology: true, rendering: 'dom' }
    })
    worldRef.current = world

    const entity = world.spawn({ essence: 'React entity' }, 100, 100)
    if (containerRef.current) {
      containerRef.current.appendChild(entity.el)
    }

    world.start()

    return () => {
      world.stop()
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />
}
```

---

## Svelte Integration

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'
  import { World } from '@v1b3x0r/mds-core'

  let container
  let world

  onMount(() => {
    world = new World({ features: { ontology: true } })
    const entity = world.spawn({ essence: 'Svelte entity' }, 100, 100)
    container.appendChild(entity.el)
    world.start()
  })

  onDestroy(() => {
    world?.stop()
  })
</script>

<div bind:this={container} />
```

---

## Node.js (Headless)

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: {
    ontology: true,
    cognitive: true,
    rendering: 'headless'
  }
})

// Spawn entities
for (let i = 0; i < 100; i++) {
  world.spawn({ essence: 'Agent' }, Math.random() * 800, Math.random() * 600)
}

// Run simulation
for (let tick = 0; tick < 10000; tick++) {
  world.tick(0.016)

  if (tick % 1000 === 0) {
    console.log(`Tick ${tick}:`, world.getWorldStats())
  }
}

// Export data
import fs from 'fs'
fs.writeFileSync('results.json', JSON.stringify(world.snapshot()))
```

---

## API Reference (Quick)

### World

```typescript
new World(options?: WorldOptions)

world.spawn(material, x, y): Entity
world.spawnField(field, x, y): Field
world.destroy(entity): void
world.start(): void
world.stop(): void
world.snapshot(): WorldState
world.restore(state, materialMap, fieldMap): void
world.getWorldStats(): Stats
world.getPatterns(): Pattern[]
world.getCollectiveEmotion(): PAD
```

### Entity

```typescript
entity.enableMemory: boolean
entity.remember(memory): void
entity.setEmotion(pad): void
entity.getEmotion(): PAD
entity.enableLearning(): void
entity.enableSkills(): void
entity.enableRelationships(): void
entity.addRelationship(id, type, strength): void
entity.sendMessage(type, content, target): void
```

### Memory

```typescript
entity.memory.remember(memory): void
entity.memory.recall(filter?): Memory[]
entity.memory.getAllMemories(): Memory[]
entity.memory.clear(): void
```

### Learning

```typescript
entity.learning.addExperience(exp): void
entity.learning.getActionValue(action): number
entity.learning.getStats(): LearningStats
```

---

## TypeScript

```typescript
import type { MdsMaterial, Entity, PAD } from '@v1b3x0r/mds-core'

const material: MdsMaterial = {
  material: 'typed.entity',
  essence: 'Fully typed entity'
}

function handleEntity(entity: Entity) {
  entity.remember({
    timestamp: Date.now(),
    type: 'event',
    subject: 'player',
    content: 'Something happened',
    salience: 0.8
  })
}

const emotion: PAD = {
  valence: 0.5,
  arousal: 0.3,
  dominance: 0.6
}
```

---

## Bundle Sizes

| Features | Size (min) | Gzipped |
|----------|------------|---------|
| Core only | 18 KB | 5.5 KB |
| + Ontology | 45 KB | 12 KB |
| + Physics | 58 KB | 15 KB |
| + Communication | 88 KB | 24 KB |
| + Cognitive | 104 KB | 28 KB |
| Full | 133 KB | 31 KB |

**Tree-shakable.** Only import what you need.

---

## Key Features

**Material format:** JSON files with `essence` + `behavior` + `physics` → See [REFERENCE.md](../REFERENCE.md)

**Save/Load:** `world.snapshot()` → localStorage → `world.restore()`

**LLM (optional):** `world.enableLLM()` → entities generate contextual dialogue

---

## Performance

**>50 entities:** Use spatial grid (O(n²) → O(n))

**Selective features:** Only enable memory/learning on important NPCs

**Batch UI updates:** Update every N ticks, not every frame

---

## Debugging

```javascript
// Memory inspector
console.table(entity.memory.getAllMemories().map(m => ({
  type: m.type,
  subject: m.subject,
  salience: m.salience.toFixed(2),
  age: ((Date.now() - m.timestamp) / 1000).toFixed(0) + 's'
})))

// Learning stats
console.log(entity.learning.getStats())

// World stats
console.log(world.getWorldStats())

// Patterns
console.log(world.getPatterns())
```

---

## FAQ

**Q: Does this work in Vite/Next.js/etc?**
Yes. It's standard ESM.

**Q: Can I use it with WebGL?**
Yes. Set `rendering: 'webgl'`. Bring your own renderer.

**Q: Does it work in Electron?**
Yes.

**Q: What about mobile?**
Works but touch events need manual binding. Mouse-only by default.

**Q: Can I contribute?**
Yes. [github.com/v1b3x0r/mds](https://github.com/v1b3x0r/mds)

---

**Full API docs:** [REFERENCE.md](../REFERENCE.md)

---

**Back to:** [Overview](../OVERVIEW.md)
