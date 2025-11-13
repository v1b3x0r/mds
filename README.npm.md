# @v1b3x0r/mds-core — orz bows to meaning

[![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

**Emoji Garden in a box.** orz (the seed) + Athena (the lexicon) + the Semantic Bus (`broadcastContext`) = JSON that speaks “earth, water, wind, and fire.”

---

## Install

```bash
npm install @v1b3x0r/mds-core
```

---

## Quick start (Node ≥ 18, pure ESM)

```js
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: {
    ontology: true,
    history: true,
    communication: true,
    linguistics: true,
    physics: true,
    rendering: 'headless'
  }
})

// Semantic Bus — inject meaning
world.broadcastContext({
  'env.temp.c': 32.8,
  'env.humidity': 0.68,
  'env.light.lux': 15000
})

console.log(world.logger.tailText(10).join('\n'))
```

Two entities, zero glue:
- **orz (the seed)** speaks emoji/proto first, then short Thai words emerge.
- **Athena (the lexicon)** hears → `translation.learn` → `memory.write` → replies in Thai.
- Everything is declared in `.mdm`; no imperative wiring.

---

## Semantic Bus (60-second tour)

`broadcastContext({ key: value })` is the meaning channel.  
Example keys: `env.temp.c`, `env.humidity`, `env.light.lux`, `env.noise.db`.  
Triggers + `where` + formulas translate meaning into emotion, relation updates, and speech.

---

## API pointers

- `new World(options)` — create a world (Node ≥ 18, ESM only)
- `world.broadcastContext({ ... })` — hint the world
- `world.logger.tailText(n)` / `subscribe(listener)` — watch the stream
- `world.spawn(material, { x, y })` — drop entities described in `.mdm`

---

## Performance

**v5.10.0**: Spatial grid optimization makes large worlds playable:
- 100 entities: **6.9x faster** (1.37ms → 0.20ms)
- 500 entities: **31x faster** (~11ms → ~0.35ms)
- Frame coherence & numeric keys reduce GC pressure 20-30%

Worlds with 100-10k entities now run smoothly at 60 FPS.

---

## Compatibility

- Node ≥ 18, pure ESM (no `require`)
- Browser-ready bundle (`dist/mds-core.esm.js`) — no Node globals required

---

## More

- Documentation: [docs/REFERENCE.md](https://github.com/v1b3x0r/mds/blob/main/docs/REFERENCE.md)
- Changelog: [docs/CHANGELOG.md](https://github.com/v1b3x0r/mds/blob/main/docs/CHANGELOG.md)
