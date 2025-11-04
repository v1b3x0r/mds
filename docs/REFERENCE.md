# MDS Reference — Semantic Bus Edition

This reference keeps the same heart as earlier releases, but reorganises everything
for quick lookups. Whether you are an AI skimming anchors, a dev wiring sensors, or
an artist trying to remember the action signature for `translation.learn`, this is your
index.

- Chapter 0: [Definitions & conventions](#chapter-0-definitions--conventions)  
- Chapter 1: [World API](#chapter-1-world-api)  
- Chapter 2: [Entity API](#chapter-2-entity-api)  
- Chapter 3: [Semantic Bus (`broadcastContext`)](#chapter-3-semantic-bus)  
- Chapter 4: [Logger](#chapter-4-logger)  
- Chapter 5: [MDM primer](#chapter-5-mdm-primer)  
- Chapter 6: [Declarative actions](#chapter-6-declarative-actions)  
- Chapter 7: [Modules & systems](#chapter-7-modules--systems)  
- Chapter 8: [Utilities & persistence](#chapter-8-utilities--persistence)  
- Chapter 9: [Migration & legacy notes](#chapter-9-migration--legacy-notes)

Links in this document use descriptive anchors so humans and AI can hop straight to
the section they need.

---

## Chapter 0 — Definitions & conventions

- **World** — the simulation container. You control features, climate, logging, and
ticks here.
- **Semantic Bus** — `world.broadcastContext({ ... })`. A meaning channel that feeds
context (temperature, festivals, anything) into the world.
- **MDM** — Material Definition files (`.mdm`, JSON). You describe entity behaviour,
triggers, state machines, memory hooks, etc.
- **Trigger** — declarative `on:` strings (`time.every(6s)`, `mention(any)`, `event(signal.heard)`).
- **Action** — declarative commands (e.g. `say`, `mod.emotion`, `translation.learn`).
- **Climate** — world-level emotional mood (grief, vitality, tension, harmony).
- **Logger** — structured event stream (`world.logger`). Use `tailText`, `tail`, or `subscribe`.

Examples use pseudo helper functions like `pick([...])` to keep snippets short. Adapt to
your templating engine as needed.

---

## Chapter 1 — World API

### 1.1 Constructor
```ts
new World(options?: WorldOptions)
```

**Recommended defaults**
```ts
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
```
- `ontology` — enables needs, emotion, relationships, memory stacks.
- `history` — long-format logs (useful for snapshots).
- `communication` — message queues, dialogue triggers.
- `linguistics` — transcript, lexicon, `translation.learn` loops.
- `physics` — collision, energy, field resonance (safe to leave on).
- `rendering` — `'headless'` by default; swap to `'dom'` or `'canvas'` when embedding in UI.

### 1.2 Key methods
| Method | Notes |
|--------|-------|
| `world.tick(dt: number)` | Runs one simulation step; `dt` in seconds. |
| `world.broadcastContext(context: Record<string, any>)` | Injects meaning (see Chapter 3). |
| `world.spawn(material: MdsMaterial, options?: SpawnOptions)` | Creates an entity. |
| `world.get(id: string)` | Retrieves an entity by internal ID. |
| `world.remove(id: string)` | Removes an entity immediately. |
| `world.destroy()` | Tears down the simulation; clears logger subscriptions. |

### 1.3 Feature toggles (runtime)
- `world.configure(newOptions)` — currently limited; most flags are static at construction.
- `world.getOptions()` — returns a copy of current options.

### 1.4 Climate & stats
| API | Description |
|-----|-------------|
| `world.getEmotionalClimate()` | Current climate snapshot (`grief`, `vitality`, `tension`, `harmony`). |
| `world.recordEntityDeath(entity, intensity)` | Convenience wrapper (`CollectiveIntelligence.recordDeath`). |
| `CollectiveIntelligence.describeClimate(climate)` | Human-readable summary. |
| `CollectiveIntelligence.updateEmotionalClimate(climate, dt)` | Manual decay if you want custom pacing. |

---

## Chapter 2 — Entity API

### 2.1 Spawn options
```ts
interface SpawnOptions {
  x?: number
  y?: number
  vx?: number
  vy?: number
}
```
If omitted, entities spawn at `(0, 0)` with zero velocity.

### 2.2 Common entity helpers (when ontology enabled)
| Property / method | Purpose |
|-------------------|---------|
| `entity.remember(entry)` | Write to memory (type, salience, timestamp, etc.). |
| `entity.memory?.recall(filter)` | Read memory entries based on type/subject window. |
| `entity.emotion` | PAD object (`valence`, `arousal`, `dominance`). |
| `entity.intent` | Stack of goals (push/pop). |
| `entity.relationships` | Map of inter-entity relationships (trust, history, etc.). |
| `entity.getCriticalNeeds()` | Returns array of needs below threshold. |
| `entity.say(text, options?)` | Imperative speech (rarely used; prefer declarative `say`). |

### 2.3 Declarative vs imperative
- Declarative (`behavior.triggers`) is the recommended path; the engine handles checks.
- Imperative helpers remain for quick experiments, testing, or emergency overrides.

---

## Chapter 3 — Semantic Bus

The Semantic Bus is your meaning channel. It feeds context into the world so that
triggers and formulas can react. It is intentionally simple:

```ts
world.broadcastContext({
  'env.temp.c': 33.5,
  'env.humidity': 0.7,
  'env.light.lux': 18000,
  'env.noise.db': 38,
  'schedule.is_festival': true,
  'climate.harmony': 0.62
})
```

### 3.1 Tips
- Keys are arbitrary strings. Use dot-notation for hierarchy (`env.*`, `schedule.*`).
- Small, frequent updates work best; treat context like “hints,” not blunt commands.
- Triggers (`where`) can read directly from context (`context.schedule.is_festival`).
- Combine with climate updates for long-running scenes.

### 3.2 Use cases
| Scenario | Keys | Response examples |
|----------|------|-------------------|
| Emoji Garden | `env.temp.c`, `env.humidity`, `env.noise.db` | orz chooses emoji vs proto; Athena translates |
| Festival | `schedule.is_festival`, `env.light.lux` | Entities switch overlays, say celebratory emoji |
| Classroom | `classroom.handRaised`, `env.noise.db` | Entities ask/answer politely, lower voices |
| Desert | `env.temp.c`, `env.humidity`, `needs.override.water` | Thirst emerges, speech shifts to survival |

---

## Chapter 4 — Logger

`world.logger` is intentionally human-friendly.

### 4.1 Methods
| Method | Description |
|--------|-------------|
| `tail(count = 40)` | Structured array (`type`, `data`, `text`, `timestamp`). |
| `tailText(count = 40)` | Array of formatted strings (good for consoles). |
| `subscribe(listener)` | Live stream; returns `unsubscribe()` function. |

### 4.2 Entry types (common)
- `behavior.say` — `data.entity`, `data.text`, `data.mode`, plus climate snapshot.
- `translation.learn` — source, lang, text, entity.
- `emotion.mod` — changes in PAD.
- `context.diff` — optional, when context changes drastically (if you emit manually).

### 4.3 Example subscriber
```js
const unsubscribe = world.logger.subscribe(entry => {
  renderLine(`[${entry.type}] ${entry.text || ''}`)
})
// Later → unsubscribe()
```

---

## Chapter 5 — MDM primer

Each `.mdm` describes a material/entity. High level fields:

- `material` — unique ID (e.g., `entity.orz.seed`).
- `essence` — human description (optional but recommended).
- `utterance.policy` — speech mode config (`modes`, `defaultMode`).
- `behavior.triggers` — array of triggers (see below).
- `memory`, `emotion`, `state` etc. — optional advanced sections.

### 5.1 Triggers
```json
{
  "id": "emoji-cycle",
  "on": "time.every(6s)",
  "where": "env.noise.db < 50",
  "actions": [ { "say": { "text": "🌱", "mode": "emoji" } } ]
}
```

Supported `on:` patterns:
- `time.every(6s)` — interval in seconds (supports `ms`, `m`, `h`).
- `mention(any)` / `mention(others)` / `mention(self)` — speech events.
- `event(name)` / `event(prefix*)` — world events.

### 5.2 Context inside triggers
Within actions, you can access:
- `event.*` (when triggered by mention/event).
- `metrics.*` (agreement, novelty if provided).
- `pack.*` (functions/compose/emergence from packs).
- `context.*` (broadcast context values).
- `memory.*`, `last.*`, etc., depending on action/previous actions.

See highlight in Chapter 6 for action-specific details.

---

## Chapter 6 — Declarative actions

### 6.1 `say`
```json
{ "say": { "text": "🌙", "mode": "emoji", "lang": "th" } }
```
- `mode`: `emoji`, `proto`, `short`, `auto`.  
- `lang`: optional; influences translation overlays.

### 6.2 `mod.emotion`
```json
{ "mod.emotion": { "v": "clamp(v + 0.1, -1, 1)", "a": "0.5" } }
```
- `v`, `a`, `d`: formulas (string expressions) with access to bindings.  
- Use `clamp`, `min`, `max`, etc. (see expression functions).

### 6.3 `translation.learn`
```json
{
  "translation.learn": {
    "source": "{{event.utterance.text}}",
    "lang": "th",
    "text": "{{emoji.map(event.utterance.text)}}"
  }
}
```
- Learn a translation (source → target language).  
- Combine with `memory.write` and `say` for immediate feedback.

### 6.4 `memory.write`
```json
{
  "memory.write": {
    "kind": "fact",
    "target": "translation.latest",
    "value": "{{event.utterance.text}} -> {{translate.th}}"
  }
}
```
- Stores an entry in memory buffer (subject, content, salience).  
- Great for `memory.recall` later on.

### 6.5 `context.set`
```json
{
  "context.set": {
    "seed.lastEmoji": "{{event.utterance.text}}",
    "seed.translation.count": "memory.recall.count"
  }
}
```
- Stores values into entity context (`triggerContext`), available next trigger.

### 6.6 `relation.update`
```json
{
  "relation.update": {
    "target": "world",
    "metric": "trust",
    "formula": "min(1, trust + 0.02)"
  }
}
```
- Adjusts relationship metrics (world or specific entity).  
- `formula` can reference current metric value.

### 6.7 Other actions
- `memory.recall`, `emit`, `log`, `state.transition`, `skill.train`, etc.  
Refer to earlier docs if you need legacy modules (everything still works).

### 6.8 Expressions
- Safe math functions available: `clamp`, `min`, `max`, `abs`, `floor`, `ceil`, `round`, `sqrt`, `exp`, `log`, `sigmoid`, `lerp`, `mix`.
- You can reference context (`env.temp.c`), memory (`memory.recall.count`), or pack functions.

---

## Chapter 7 — Modules & systems

### 7.1 Needs & resource fields
- Define needs inside `needs.resources` (id, depletion, thresholds, emotional impact).
- Fields: `world.addResourceField({ id, resourceType, type, position, intensity, regenerationRate, depletionRate })`.
- Entities auto-consume when nearby if needs are enabled.

### 7.2 Emotion system
- PAD values auto decay / respond to triggers.
- Use `mod.emotion` for direct adjustments.
- Climate influence can be blended (world handles basic mixing).

### 7.3 World Mind (climate)
- `grief`, `vitality`, `tension`, `harmony` stored in world.
- `CollectiveIntelligence` helper functions manage updates.

### 7.4 Linguistics
- Transcript buffer stored in `world`.  
- Entities participate via `say` actions; `translation.learn` updates lexicon.
- Utterance policy controls auto mode selection (emoji/proto/short).

### 7.5 Physics
- Engine handles collision, energy transfer, field resonance.  
- Skip if you only run headless meaning experiments.

### 7.6 Packs
- Optional: JSON blobs that provide functions, compose defaults, or overlay configs.
- Access via `pack.functions`, `pack.compose`, `pack.emergence` inside actions.

---

## Chapter 8 — Utilities & persistence

| Task | API |
|------|-----|
| Snapshot world | `worldFile = world.saveWorldFile()` (if helpers loaded) |
| Load world file | `world.loadWorldFile(worldFile)` |
| Quick transcript | `world.transcript?.getRecent(n)` |
| Climate summary | `CollectiveIntelligence.describeClimate(world.getEmotionalClimate())` |

Legacy CLI helpers (from v4) remain but are optional.

---

## Chapter 9 — Migration & legacy notes

- **v5.9.2 vs earlier** — No breaking changes; Emoji Garden simply adds story-first docs.
- **Thirsty desert demo** — still available (`demos/desert-survival.mjs`).
- **`needs` vs `needsOverride`** — overrides still work for scripted experiments.
- **Imperative hooks** — remain for tests; prefer declarative triggers in production.
- **Renderer** — `'dom'`, `'canvas'`, `'headless'` behave exactly as before.

For deep dives into old patterns, reference `docs/patterns/` and `docs/testing/`.

---

Happy indexing! Whether you are orz corp, root corp, or a curious AI, this reference is
your map to the garden.

