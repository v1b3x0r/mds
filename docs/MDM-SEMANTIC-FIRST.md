# MDM Semantic-First Charter

> *“Worlds are declared, never commanded.”*

This document codifies the semantic-first contract for every MDM-powered world. It exists to keep Codex, contributors, and tooling aligned on the principle that **meaning is the only source of behaviour**.

## Core Doctrine

1. **MDM is the universe.**  
   Every `.mdm` file is a declarative meaning graph. Changing behaviour always means editing meaning, never code.

2. **Engine is a mirror.**  
   Runtime components only parse, resolve, and propagate state according to the graph. No decisions, defaults, or heuristics may live outside MDM packs.

3. **No imperatives.**  
   `if`, `for`, callbacks, and any control constructs are forbidden in runtime. Cause→effect is expressed via declared relations, thresholds, and formulas inside MDM.

4. **No defaults.**  
   Existence requires explicit meaning. If a value is missing the world must fail to start. Packs (e.g. `@pack/core-defaults`) may provide declarations, but the engine contributes nothing implicitly.

5. **Language is late.**  
   Speech emerges from semantic pressure. Locale packs only add phonetic or orthographic overlays; they cannot add new logic.

6. **Observation is sacred.**  
   Inspecting state (`console.log`, debugger, UI panels) never mutates the world. Observation mirrors meaning; it does not steer it.

7. **Emergence before release.**  
   A world is valid only if it passes the No-Default invariant and the 2000-tick emergence test. Simulation precedes creation.

## Structural Layers

| Layer | Defined in MDM | Interpreter role |
| --- | --- | --- |
| `world` | clocks, channels, ambient sensors, broadcast policy | load values, emit ticks, surface sensor changes |
| `ontology` | concepts, relations, event schemas | materialise graph nodes/edges, expose to evaluators |
| `emergence` | chunking, novelty, learning rates | execute formulas per tick, update semantic weights |
| `emotion` | PAD baselines, modulators, inertia, clamps | evaluate declared formulas and clamp results |
| `entities` | seed essence, channels, utterance policy, memory, relationships | instantiate per definitions, route events |
| `behavior.triggers` | selectors + action lists | match events, evaluate formulas, enqueue actions |
| `compose` | pre-lexical modes, constraints | pick output template as declared |
| `locale.overlay` | phonetic/orthographic mapping | post-process rendered tokens |

Everything in the “Defined in MDM” column must come from the loaded material or packs. The interpreter column describes pure reflections of those declarations.

## Formula DSL

- Expressions use safe math (e.g. `min`, `max`, `clamp`, `abs`, `sigmoid`, `exp`, `log`) exposed by packs.  
- Context variables come from meaning state (`valence`, `arousal`, `diversity`, `mentions`, `sensor.humidity`, etc.).  
- Formulas are strings evaluated in a sandbox; they never call into host code.

### Trigger Schema

```yaml
behavior:
  triggers:
    - on: "turn"
      where: "channel == '#radio' && spontaneity > 0.1"
      actions:
        - say: { mode: "auto" }
        - relation.update: { formula: "trust += 0.02 * agreement - 0.01 * conflict" }
        - memory.recall: { kind: "episodic", window: "300s", strategy: "recent" }
```

Only the strings shown above may appear. All other behaviour must be encoded by composing more declarations.

## Forbidden Constructs

- Control flow in runtime (`if`, `switch`, loops, callbacks).  
- Hidden defaults (any value not declared by MDM/packs).  
- Locale packs that contain logic (they may only overlay sound/orthography).  
- Hard-coded relationship or memory formulas.  
- UI, CLI, or testing shortcuts that mutate runtime state directly.

## Validation Gates

1. **No-Default invariant** – removing `@pack/core-defaults` must make the world fail to load.  
2. **2000-tick emergence** – the world must produce new semantic structure (chunks, links, memories) within 2000 ticks using only declared rules.  
3. **Meaning-fidelity tests** – altering any formula in MDM must change behaviour without touching runtime code.

## Implementation Checklist

- [ ] Loader merges pack graphs deterministically (later includes override earlier ones).  
- [ ] Interpreter keeps no hidden state; every register is addressable via the meaning graph.  
- [ ] Composer supports pre-lexical modes out of the box and only applies locale overlays.  
- [ ] Memory and relationship updates are driven exclusively by declared formulas.  
- [ ] Observation APIs are read-only.  
- [ ] Test suite covers invariants listed above.

## FAQ

**Why not provide sensible defaults?**  
Because defaults are hidden meaning. Requiring explicit declaration keeps the ontology honest and makes every world child-accessible.

**Can we expose helper packs?**  
Yes. Packs are curated bundles of declarations (functions, formulas, ontology nodes). They may never contain imperative code.

**How do we add new behaviour?**  
Extend the ontology or add a pack with new formulas. If the engine needs code changes, that code must only widen what can be expressed declaratively; it must not add behaviour on its own.

---

*If a ten-year-old can write ten lines of MDM and breathe life into a world, we have stayed true to the semantic-first promise.*
