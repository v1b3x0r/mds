# @v1b3x0r/mds-core

[![npm version](https://img.shields.io/npm/v/%40v1b3x0r%2Fmds-core)](https://www.npmjs.com/package/@v1b3x0r/mds-core)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178C6)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)

MDS is a deterministic semantic substrate for small living worlds: entities, memory, emotion, physics, dialogue, proto-language, and context in one TypeScript runtime.

Use it when you want to feed meaning into a simulated world and let authored `.mdm` materials decide how entities respond.

**New here?** Read the [Field Guide — Anatomy of a Living World](https://github.com/v1b3x0r/mds/blob/main/docs/FIELD-GUIDE.md): what each of the 8 layers believes, which sciences they borrow from, and how one rainstorm becomes language.

---

## Install

```bash
npm install @v1b3x0r/mds-core
```

---

## Quick start

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

world.broadcastContext({
  'env.temp.c': 32.8,
  'env.humidity': 0.68,
  'env.light.lux': 15000
})

console.log(world.logger.tailText(10).join('\\n'))
```

---

## Mental model

```text
context in -> MDM triggers -> world state -> speech/logs/effects out
```

MDS is not a chatbot and not an automation shortcut. It is the world-state layer that HomeLog, DreamFlow, games, companions, or UI surfaces can feed and observe.

---

## API pointers

- `new World(options)` — create a world. Node >= 18, pure ESM.
- `world.broadcastContext({ ... })` — feed semantic context.
- `world.spawn(material, { x, y })` — add an entity from `.mdm` material.
- `world.logger.tailText(n)` / `subscribe(listener)` — inspect the world stream.
- `silent: false` — opt into direct startup diagnostics; default construction is quiet.

---

## Highlights

- Entities: memory, emotion, needs, relations, and dialogue.
- Semantic Bus: HomeLog-like facts or game events via `broadcastContext()`.
- Materials: `.mdm` declarations for triggers, speech, memory, and effects.
- Dialogue: authored categories and weighted variants; missing categories fail closed.
- Proto-language: generated utterances sample from the full active vocabulary pool.
- Physics and resource fields: collision, energy transfer, field resonance, needs pressure.
- Performance: v5.10.0 spatial grid optimization for larger worlds.

---

## More

- Documentation: [docs/REFERENCE.md](https://github.com/v1b3x0r/mds/blob/main/docs/REFERENCE.md)
- Cookbook: [docs/COOKBOOK.md](https://github.com/v1b3x0r/mds/blob/main/docs/COOKBOOK.md)
- Changelog: [docs/CHANGELOG.md](https://github.com/v1b3x0r/mds/blob/main/docs/CHANGELOG.md)
