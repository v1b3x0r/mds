# Semantic-First Core Upgrade Plan

> Target: make `babel.infp` run from a single `<script type="module">` in the browser. No CLI, no Node globals, no imperative hooks. A 10-line HTML file should be able to birth the entire simulation.

---

## Layer 1 · Bootstrap & Pure ESM Runtime

### Problems
- `World` still expects `WorldOptions` backed by CLI loaders.
- CDN ESM build pulls in Node’s `EventEmitter`, `Buffer`, `fs`.

### Actions
1. Introduce `World.bootstrap(source, opts?)` that accepts:
   - inline JSON object
   - URL/string pointing to `.mdm` (fetch in browser)
2. Allow `new World(id, mdmObject)` (id optional; derive from material).
3. Replace EventEmitter usage with `EmitterLite` (5-line class) and drop Buffer/fs paths from the build.
4. Ship ESM bundle that depends only on std DOM APIs.

✅ Result: a browser can instantiate a world with `import { World } ...; await World.bootstrap(mdm)`.

---

## Layer 2 · Pack Resolver & Declarative Merge

### Problems
- `include` works only via CLI; browser runtime has no resolver.
- Packs bundle imperative glue.

### Actions
1. Publish pack manifests as JSON on CDN (`@packs/<name>.json`).
2. Create `PackResolver.resolve(include[])` that fetches/loads pack JSON, merges:
   - functions (safe math)
   - ontology/relations
   - compose defaults
   - emergence defaults
3. Cache results in-memory keyed by hash(include list).
4. Integrate resolver into `World.bootstrap` before entity spawn.

✅ Result: MDM truly becomes the single declarative source of behaviour.

---

## Layer 3 · Formula Engine & Safe Evaluator

### Problems
- `relation.update`, `mod.emotion`, `memory.write` still rely on callbacks.

### Actions
1. Embed a sandboxed expression evaluator (no `eval`, no Function constructor).
2. Expose context variables (`valence`, `arousal`, `trust`, `agreement`, `novelty`, `sensor.*`, `time.*`).
3. Convert all action handlers to “evaluate → apply” pipeline.
4. Validate formulas at load time; fail world start if invalid.

✅ Result: engine = interpreter of meaning. No imperative logic hidden in runtime.

---

## Layer 4 · Declarative Trigger Scheduler

### Problems
- `time.every()` & `mention()` achieved via manual event wiring.
- `where` clause ignored unless code plugs it in.

### Actions
1. Define trigger registry that parses patterns (`time.every(1d)`, `mention(any)`, `topic~X`).
2. Reuse evaluator for `where` expressions.
3. Provide context object (`speaker`, `listener`, `utterance`, `language`, `emotion`, `relationships`).
4. Ensure scheduler works in pure tick-driven loops (no setInterval requirement).

✅ Result: all behaviour comes from MDM trigger declarations. World loops remain deterministic.

---

## Layer 5 · Emergence Loop (Lexicon & Semantic Growth)

### Problems
- `world.emergence` config is parsed but not honoured.
- Linguistic modules use baked-in thresholds.

### Actions
1. Feed `chunking`, `novelty`, `learning` values into `LinguisticCrystallizer` & `ProtoLanguageGenerator`.
2. Update `World.tick(dt)` to advance novelty/learning metrics every tick.
3. Emit logs: `emergence:new_chunk`, `emergence:blend`, `emergence:lexicon_update`.

✅ Result: languages evolve over time per declared parameters.

---

## Layer 6 · Locale Overlay & Proto Composer

### Problems
- Locale overlays applied only when using CLI loader.
- Inline materials ignore phonotactics/orthography rules.

### Actions
1. Attach overlay loader to entity creation regardless of source.
2. Ship pre-built overlay JSON for the 16 languages used in `babel.infp`.
3. Composer picks modes (`emoji`, `proto`, `short`, `auto`) from `utterance.policy`.

✅ Result: each entity speaks with its native phonetic skin + emoji baseline without extra code.

---

## Layer 7 · Athena Semantic Hooks

### Problems
- `where: "utterance.lang != 'th'"` not evaluated.
- `{{translate.th}}` template has no data source.

### Actions
1. Extend evaluator to support template strings with context (`last.utterance`, `translate.*`).
2. Give Athena a declarative lexicon store in memory; updates happen via triggers.
3. When translation missing, output proto hint + add to lexicon for future use.
4. `relation.update` becomes a formula that injects trust subtly on each correction.

✅ Result: Athena teaches Thai through meaning pressure, not commands.

---

## Layer 8 · World Logger & Introspection

### Problems
- `world.log` array is inconsistent and not browser-friendly.

### Actions
1. Introduce `WorldLogger` with structured events (tick, utterance, emergence, relation updates).
2. Provide `world.logger.tail(n)` / `stream()` for UI consumption.
3. Format default log lines human-readable (e.g. `[Day 30] entity_3 🌞 hola ☀️`).

✅ Result: `<pre>` in the demo simply prints `world.logger.tail(40).join("\n")`.

---

## Implementation Order
1. Layer 1 (Bootstrap + pure ESM) — unblock browser usage.
2. Layer 2 (Pack resolver) — allow declarative includes.
3. Layer 3 + 4 (Formula + Scheduler) — power all behaviours.
4. Layer 5 (Emergence) — deliver language growth.
5. Layer 6 (Locale overlay) — voice/emoji mix.
6. Layer 7 (Athena hooks) — semantic correction.
7. Layer 8 (Logger) — view evolution.

---

## Testing & Validation
- Bun tests:
  - Pack resolution + merge correctness.
  - Formula evaluator edge cases (safe operations, variables).
  - Trigger scheduling for `time.every`, `mention`, `where`.
  - Emergence producing new chunks after N ticks.
  - Locale overlay ensuring mixed speech tokens.
  - Athena translation injection over time.
- Browser smoke test: load CDN ESM in jsdom, run 90 ticks, assert logs reach milestones (emoji → hybrid → mixed-language).

---

## Migration Notes
- Provide compatibility shims for legacy callbacks (warn + auto-convert to formulas).
- Update README + validator docs once layers 1–4 ship (minimum viable semantic-first runtime).
- After layer 8, deprecate `world.log` array and CLI-only pack path.

---

## Progress Log
- 2025-10-30 · Behavior scheduler now compiles `time.every`, `mention`, and `event(...)` patterns, runs declarative actions (Emotion/Relation/Memory) through the expression engine, and injects pack math functions + recall context for downstream formulas.
- 2025-10-30 · Added Bun integration tests covering `event(...)` triggers and `memory.recall` pipelines to lock in Layer 3+4 semantics.
- 2025-10-30 · Updated sample materials (guardian golem, paper.curious) to use declarative triggers (`event`, `mention`, `memory.recall`, `context.set`) as live fixtures before entering Layer 5.
- 2025-10-30 · Layer 5 emergence loop wired: `world.emergence` config now tunes crystallizer/lexicon, world logs `emergence.chunk|blend`, and novelty/diversity metrics stream through context + tests (`tests/emergence-loop.test.ts`).

---

When all eight layers land, the engine becomes a pure semantic interpreter. One MDM file births the babel.infp world; the browser merely watches the language bloom.***
