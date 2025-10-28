# Zero-Code Pattern Lookup

> Quick reference for common MDS entity patterns referenced in context7 Q&A  
> Files live under `materials/examples/` with matching validation scripts in `tests/examples/`.

| Scenario | Material | Key Blocks | Test |
| --- | --- | --- | --- |
| Simple spawnable guardian | `entity.guardian_golem.mdm` | `essence`, minimal `behavior` | `guardian-golem.test.mjs` |
| Emotion reactions (insult/apology) | `entity.boundary_sentinel.mdm` | `emotion.transitions` | `emotion-transitions.test.mjs` |
| Remembering player names | `entity.greeter_memory.mdm` | `memory.bindings`, dialogue placeholders | `memory-greeting.test.mjs` |
| Multilingual shopkeeper | `entity.shopkeeper_dual_lang.mdm` | `languageProfile`, dual-language `dialogue` | `dialogue-language.test.mjs` |
| Emotion-aware weather reply | `entity.weather_bard.mdm` | `dialogue.intents` with emotion guards | `emotion-aware-dialogue.test.mjs` |
| Timer-driven loneliness | `entity.lonely_ghost.mdm` | `behavior.timers`, emotion decay triggers | `lonely-ghost-decay.test.mjs` |
| Conditional treasure chest | `entity.treasure_chest.mdm` | `state.transitions` with payload condition | `treasure-chest-state.test.mjs` |
| Multi-step oracle ritual | `entity.oracle_trials.mdm` | `memory.flags`, gated dialogue | `oracle-secret.test.mjs` |
| Linked guard alert | `entity.guard_A.mdm`, `entity.guard_B.mdm` | Broadcast + emotion listening | `guards-broadcast.test.mjs` |
| Serialization & rehydration | `entity.lonely_ghost.mdm` + `toWorldFile` | Persist emotions, timers, world time | `world-serialization.test.mjs` |

## Usage Tips

- **Loading materials**  
  ```ts
  import { World } from '@v1b3x0r/mds-core'
  import fs from 'node:fs'

  const material = JSON.parse(fs.readFileSync('materials/examples/entity.guardian_golem.mdm', 'utf-8'))
  const world = new World({ features: { ontology: true, history: true } })
  const entity = world.spawn(material, { x: 0, y: 0 })
  ```

- **Running example tests**  
  ```bash
  node tests/examples/guardian-golem.test.mjs
  ```

- **Serialization primer**  
  ```ts
  import { toWorldFile, fromWorldFile } from '@v1b3x0r/mds-core'
  const file = toWorldFile(world)
  const restored = fromWorldFile(file, { features: { ontology: true, history: true } })
  ```

Keep this file synced whenever a new pattern gets added so LLM tooling has a single source of truth.
