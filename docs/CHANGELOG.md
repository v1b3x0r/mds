#Changelog

A human-readable history of what changed and why it matters.

⸻

[5.12.0] — Skills Finally Tick (Declarative Skill Growth)  
📅 2026-06-10

⸻

🚀 Added

**Declarative skill triggers are now wired** (PR #16). `skills.learnable` in MDM has declared `{ name, trigger, growth }` since v5.1 — but the engine parsed the names and dropped them, so declared skills could only decay. Now:

- Spawning a material with `skills.learnable` auto-enables the skill system and registers every declared skill.
- `SkillSystem.practiceDeclared(name, growth)` — per-trigger gain = `(1 − proficiency) × growth`, honoring the spec's "progress per trigger" while keeping the diminishing-returns curve.
- Every trigger form the schema promises now works, each covered by tests:
  - **event names** — `player.chat`, `new_word_learned` (practiced on broadcastEvent)
  - **condition expressions** — `light_level<2` (edge-triggered: practices once on false→true, re-arms on false; evaluated on broadcastContext and events)
  - **bare context flags** — `battery.charging` (dual-mode: exact event match + context-truthiness edge)
  - **dotted flat keys** — `cpu.usage>0.8` (matches broadcastContext's flat dot-notation contract)
  - **duration suffixes** — `user.silence>60s`, `500ms` (same units as the generic-trigger grammar)

🛠 Fixes (shared condition evaluator — benefits emotion triggers / dialogue `when` / behavior `where` too)

- `getPathValue` now resolves flat dot-notation keys first, then falls back to nested path traversal.
- `resolveTokenValue` parses duration suffixes (`60s` → 60, `500ms` → 0.5).
- Condition edge-state is keyed by declaration row, not skill name — the same skill may declare an event row AND a condition row without double-practicing or poisoning its own edge state.

📚 Docs

- **`docs/FIELD-GUIDE.md` — Anatomy of a Living World** (PR #17): an ontology report of all 8 layers — what each believes, which sciences it borrows from, one rainstorm traced from weather to language. Includes "What the Code Believes", the CSS-library→living-ontology history, and an llm.txt drift appendix.
- `docs/social-card.svg` repo hero card, embedded in README.

⸻

💡 Why It Matters

Companions stop being static personalities: a being declared with
`{ "name": "empathy", "trigger": "user.emotion_detected", "growth": 0.05 }`
now actually grows. Field-verified in hi-introvert: 20 conversational turns moved empathy 0.40→0.64 while an undeclared control skill stayed put. The review loop (5 codex rounds) doubled as the first real audit of the shared condition evaluator.

⸻

[5.11.0] — Semantic Truth and Runtime Hygiene  
📅 2026-05-25

⸻

🛠 Fixes

- `World` constructor startup diagnostics are silent by default; set `silent: false` or `debug: true` to opt into direct console info logs.
- `ProtoLanguageGenerator` now samples from the full active vocabulary pool instead of biasing selection to the first ten entries.
- Emotion-biased proto-language ordering now preserves tail vocabulary instead of truncating the pool.
- README and npm README now frame MDS as a practical semantic substrate while keeping the orz/Athena soul as examples.
- Restored `test:api` with a checked-in API stability test and `check-api-stability.sh` wrapper.
- Restored the promised `EntitySimilarityAdapter` public API and similarity helper exports.
- Relaxed brittle linguistics assertions so valid additional crystallized phrases do not fail the suite.
- Removed `docs` directory from the npm `files` manifest to keep published bundles lean.
- `entity.speak(category)` now returns `undefined` for missing authored dialogue categories instead of inventing built-in fallback lines.
- `formatUtterance(..., { mode: "short" })` now also returns `undefined` for empty text instead of routing through built-in fallback dialogue.
- Dialogue selection now samples across eligible variants and respects `frequency` weights (`rare` < `medium` < `common`).

⸻

[5.10.0] — Spatial Grid Performance Optimization  
📅 2025-11-13

⸻

⚡ Performance

**Spatial Grid: O(N²) → O(N*k) entity interactions**
- Entity proximity queries now use cell-based spatial partitioning
- **6-31x speedup** for medium-large worlds:
  - 100 entities: 1.37ms → 0.20ms (6.9x faster)
  - 500 entities: ~11ms → ~0.35ms (31x faster)
- Makes worlds with 100-10k entities playable at 60 FPS

**Frame Coherence & Numeric Keys**
- Track entity movement between cells (skip unchanged: 20-50% faster)
- Spatial hash `(x << 16) | y` replaces string concat (20-30% less GC)
- Object cloning optimized: `structuredClone()` with manual fallback (3-5x faster)

**New APIs**
- `SpatialGrid<T>` — Generic spatial partitioning structure
  - `update(entity, oldX, oldY)` — Frame coherence updates
  - `inBounds(x, y)` — Boundary checking
  - `wrap(x, y)` — Toroidal world wrapping
  - `getStats()` — Performance monitoring (cell density, skip rate)
- All APIs backward compatible (grid rebuilds automatically in world tick)

🛠 Code Quality
- Extracted magic numbers to named constants:
  - `ENTITY_INTERACTION_RADIUS = 80`
  - `MIN_ENTITY_DISTANCE = 0.001`
  - `DEFAULT_WORLD_WIDTH/HEIGHT = 1920/1080`
- Performance benchmark added: `tests/performance/spatial-grid.test.mjs`

📦 Bundle Size
- **Full**: 450.4 KB (+6.7KB, +1.5%)  
- **Lite**: 356.1 KB (+3.3KB, +0.9%)  
- Justified by significant performance gains

⸻

[5.9.2] — Layer 7·8 Stabilisation & Browser Logger  
📅 2025-11-04

⸻

✨ Highlights

- **World Logger Stream** — `WorldLogger.subscribe()` + `formatLogEntry()` for real-time viewers, with mode/climate/needs payloads on `behavior.say` and translation events.  
- **Athena Lexicon Flow** — Declarative `translation.learn` + `memory.write` pipeline validated by new integration tests; sample material `entity.athena.lexicon.mdm` shows mention → translate → respond loop.  
- **Layer 8 Demo** — `/examples/cluster.html` renders headless world, emotional climate dashboard, and live terminal powered by the new logger stream.  
- **Browser-safe Context** — `OSContextProvider` now avoids Node globals during bundling and falls back gracefully on the web.  
- **Climate Hooks** — Demo world now syncs broadcast frames into `world.emotionalClimate`, keeping UI in lockstep with engine state.

🛠 Fixes

- Allow `context.set` actions to accept template strings (no more expression errors on `{{translate.th}}`).  
- Eliminate proto recursion by scoping Athena’s trigger (`where` checks speaker material).

📦 Bundle Size (post-optimisation)

- **Full**: 443.72 KB (106.53 KB gzipped)  
- **Lite**: 350.08 KB (85.25 KB gzipped)  
- **Validator**: 25.86 KB (4.38 KB gzipped)

⸻

[5.9.0] — Material Pressure System (Phase 1)

📅 2025-10-30

⸻

🎯 Added

**Resource Needs**
- `needs` property on Entity — resource requirements (water, food, energy)
- Needs deplete over time at configurable `depletionRate`
- Critical needs trigger emotional impact (PAD model)
- Complete needs API:
  - `entity.updateNeeds(dt, worldTime)` — automatic depletion
  - `entity.getNeed(id)` — get need state
  - `entity.satisfyNeed(id, amount)` — fulfill need
  - `entity.isCritical(id)` — check if need < threshold
  - `entity.getCriticalNeeds()` — get all critical needs
  - `entity.getNeedsSnapshot()` — get all need levels
  - `entity.speakAboutNeeds()` — generate need-based utterance

**Spatial Resource Fields**
- `ResourceField` system with 3 distribution types:
  - **Point** source: well at (x, y)
  - **Area** source: oasis rectangle
  - **Gradient** source: lake with distance falloff
- Fields regenerate and deplete naturally over time
- World methods:
  - `world.addResourceField(config)` — add field to world
  - `world.getResourceIntensity(type, x, y)` — get intensity at position
  - `world.consumeResource(type, x, y, amount)` — consume from field
  - `world.findNearestResourceField(x, y, type)` — find closest field

**Emotional Climate (World-Mind)**
- `EmotionalClimate` system tracks collective emotion:
  - `grief`: accumulated loss (0..1)
  - `vitality`: life force (0..1)
  - `tension`: collective stress (0..1)
  - `harmony`: collective peace (0..1)
- Climate influences all entities automatically
- World methods:
  - `world.recordEntityDeath(entity, intensity)` — record death
  - `world.getEmotionalClimate()` — get current state
- CollectiveIntelligence methods:
  - `recordDeath()`, `recordBirth()`, `recordSuffering()`
  - `updateEmotionalClimate(dt)` — natural decay
  - `getClimateInfluence()` — calculate PAD delta
  - `describeClimate()` — human-readable description

**Emergent Language (Needs → Lexicon)**
- Entities automatically speak when needs are critical
- Speech varies by severity:
  - **Desperate** (>80% depleted): "Water..." "Dying of thirst"
  - **Urgent** (>50% depleted): "I need water" "Looking for water"
  - **Moderate**: "Getting thirsty" "Could use some water"
- Multilingual support (English, Thai)
- Utterances crystallize into world lexicon over time
- Speech recorded in transcript buffer

**Desert Survival Demo**
- `demos/desert-survival.mjs` — 3 entities competing for water
- Scenario: harsh desert, 1 limited water well
- Features: resource competition, death, climate evolution
- Result: All 3 travelers die, world develops grief

✨ Improved

**World Tick Loop**
- Phase 1.6: Resource fields update (depletion/regeneration)
- Phase 1.6b: Entity needs update (automatic depletion)
- Phase 1.6c: Suffering recorded when needs critical
- Climate decay and entity influence integrated

**Schema**
- `MdsNeedsConfig` interface for declarative needs
- `MdsNeedConfig` for individual resource requirements
- Support for `emotionalImpact` on critical needs

⸻

📦 Bundle Size

- **Full**: 359.66 KB (+16.54 KB) — 88.30 KB gzipped
- **Lite**: 266.80 KB (+9.73 KB) — 67.15 KB gzipped
- **Validator**: 25.86 KB (unchanged) — 4.38 KB gzipped

⸻

🧪 Tests

**27 new tests (100% pass)**
- `needs-system.test.mjs` (6 tests) — needs depletion, satisfaction, critical state
- `resource-field.test.mjs` (8 tests) — point/area/gradient sources, consumption, regeneration
- `needs-lexicon-integration.test.mjs` (5 tests) — emergent speech, crystallization
- `emotional-climate.test.mjs` (8 tests) — death → grief, climate decay, entity influence

**Total: 192 tests (all passing)**

⸻

⚙️ Technical Details

**Needs System Flow**
```
1. Entity spawned with needs config
2. World.tick() → entity.updateNeeds(dt)
3. Water depletes 1.5% per second
4. When water < 30% → critical state
5. Critical → emotional impact (valence -0.6, arousal +0.4)
6. Critical → entity speaks ("Need water!")
7. Speech → transcript → lexicon crystallization
```

**Resource Field Consumption**
```
1. Entity position (x, y)
2. world.getResourceIntensity('water', x, y) → 0.8
3. world.consumeResource('water', x, y, 0.3) → 0.3 consumed
4. Field intensity depletes: 1.0 → 0.7
5. entity.satisfyNeed('water', 0.3) → water +30%
```

**Emotional Climate Flow**
```
1. Entity dies → world.recordEntityDeath(entity, 0.9)
2. Climate.grief increases: 0 → 0.45
3. Climate.vitality decreases: 0.5 → 0.23
4. World.tick() → updateEmotionalClimate()
5. Climate influence calculated: PAD delta
6. All entities.feel(climateDelta) → collective emotion
```

⸻

🎬 Philosophy

**"Emotional Climate ที่ Evolve เอง"** — The world now "remembers" death and suffering. When entities die, grief spreads across all survivors. When entities suffer from critical needs, tension builds. This creates an evolving emotional atmosphere that no single entity controls. It's collective emotion emerging from individual experiences.

**Cultivation Pattern**
- Describe needs → survival behavior emerges
- Multiple entities → competition emerges
- Death → collective grief emerges
- Suffering → emotional climate emerges

No if-statements. No central control. Just local rules → global patterns.

⸻

📝 Design Notes

**Why Needs + Climate?**
- Traditional games: hardcode "if HP < 20% then panic"
- MDS: describe resource depletion → emotion changes → speech emerges → world remembers
- Result: Living worlds that feel loss, not just track stats

**Why Spatial Resources?**
- Traditional: global resource pool
- MDS: resources exist at (x, y), deplete locally, regenerate slowly
- Result: Competition emerges, entities must move/strategize

**Why Emergent Speech?**
- Traditional: hardcoded dialogue tree
- MDS: internal state (thirst) → auto-generate utterance → lexicon forms
- Result: Vocabulary reflects world pressures (desert → "water...", "กระหายน้ำมาก")

⸻

🌍 Use Cases

- 🎮 **Games** with survival mechanics (hunger, thirst, exhaustion)
- 🏫 **Education** (ecosystems, resource competition, tragedy of the commons)
- 🔬 **Research** (agent-based models, emergent cooperation vs competition)
- 🎨 **Art** (emotional systems, collective grief installations)
- 📖 **Interactive stories** where environment drives narrative

⸻

🔗 Related Commits

- `8b601ed` — Task 1.1: Needs system
- `0211643` — Task 1.2: ResourceField
- `af6c49c` — Task 1.3: Needs → Lexicon
- `30793a7` — Task 1.4 & 1.5: Emotional climate
- `d40dea6` — Demo: Desert survival

⸻

[7.1.0] — World Observability Hooks

📅 2025-11-02 (Time Traveler Codex 😅)

⸻

🎯 Added

- `World#on/off/once` & friends → subscribe to `tick`, `context`, `analytics`, `event`, `utterance`
- Context diffing + snapshot (`getContextSnapshot`) to avoid manual tracking
- Browser & Process context providers (lean defaults for DOM/Node runtimes)
- Event sink helpers (`attachWorldEventSink`, `InMemoryWorldEventSink`) to plug logging or telemetry without bespoke wiring

✨ Improved

- `broadcastContext` only emits when values change; still merges full payload for backward compatibility
- World Mind analytics emit snapshot (stats + patterns + collective emotion) at sane intervals
- `registerContextProvider` now accepts async providers + cleanup, and `WorldOptions.contextProviders` auto-wires defaults without manual setup
- Dialogue fallback now honours `LANGUAGE_FALLBACK_PRIORITY` (`th → ja → es → ko → zh → en`) across parser + entity speech helpers

⸻

[6.6.0] — Human-like Memory (Emergent Name Recall)

📅 2025-10-27

⸻

🎯 Added

**Name Extraction (Automatic)**
- Extract names from conversation: "ผมชื่อ Wutty", "my name is Alex", "เพื่อนผมชื่อ Bob"
- Store as semantic memory: `{ subject: "Wutty", type: "name", owner: "traveler" }`
- Support 3 contexts: self (speaker), other (third party), addressee (companion)
- Generic pattern matching: works with any entity, not hardcoded to traveler

**Emergent Name Recall (No LLM Required)**
- Companion responds with actual names from memory when asked
- Salience-based confidence:
  - High (>0.8): "จำได้! คุณชื่อ Wutty" (confident)
  - Medium (>0.4): "เอ่อ... W อะไรสักอย่าง? 🤔" (fuzzy recall)
  - Low (<0.4): "จำได้แต่ไม่แน่ใจ... Wutty ใช่ไหม? 😅" (uncertain guess)
- Human-like behavior: memory fades over time, confidence decreases

**Integration Test Suite**
- `test-integration-scenario2-name-memory.mjs` — 2.5 min conversation flow
- Tests: name storage, recall, fuzzy memory, multiple names
- Pass rate: 61.9% (target: 60%) ✅

⸻

🐛 Fixed

**Salience Bug in Tests**
- Test was reading wrong memory (self response 0.4 instead of traveler message 1.0)
- Fixed: filter `subject === 'traveler'` before checking salience
- Impact: +4 test passes (salience tests now 6/6)

⸻

📝 Changed

**WorldSession.handleUserMessage()**
- Added name extraction logic (lines 876-919)
- Supports Thai + English patterns with owner detection
- Memory structure: names are searchable by `subject` field

**WorldSession.getEntityResponse()**
- Added emergent name recall logic (lines 1101-1138)
- Checks if question is about names + memory available
- Generates response dynamically from memory content (not hardcoded dialogue)

**Bundle Size**
- apps/hi-introvert: 106.92 KB (+0.13 KB) — minimal overhead for name extraction

⸻

⚙️ Technical Details

**Name Extraction Flow**
```
1. User: "ผมชื่อ Wutty นะครับ"
2. Regex match: /(?:ผม|ฉัน|กู)ชื่อ\s+(\w+)/gi
3. Extract: "Wutty", owner: 'traveler'
4. Store: { subject: "Wutty", type: "name", content: { owner: "traveler" }}
5. Searchable via ContextAnalyzer.findRelevantMemories()
```

**Emergent Recall Flow**
```
1. User: "คุณจำได้ไหมว่าผมชื่ออะไร?"
2. ContextAnalyzer: finds relevantMemories (subject: "Wutty")
3. Check salience → determine confidence level
4. Generate response: "จำได้! คุณชื่อ Wutty"
5. No hardcoded dialogue, no LLM — pure memory interpolation
```

**Cultivation Pattern**
- Names emerge naturally from conversation
- Memory decay creates realistic forgetting behavior
- Response confidence reflects memory strength
- No explicit programming of "remember name" behavior

⸻

🎬 Philosophy

**"Cultivation, not Control"** — The companion wasn't programmed to remember names. It was given memory, emotion, and relationships. Name recall emerged naturally from these primitives. When memory fades (salience < 0.5), the companion becomes uncertain. When memory is strong (salience > 0.8), it's confident. This is human-like behavior without hardcoding every scenario.

⸻

🧪 Test Results

**Integration Test (Scenario 2)**
- Duration: 2.5 minutes (8 messages)
- Tests: 21 total
- Passed: 13 (61.9%) ✅
- Target: 60%
- Critical features tested:
  - ✅ Memory storage (names extracted and stored)
  - ✅ Salience persistence (1.0 for user messages)
  - ✅ Memory recall (relevantMemories found)
  - ⚠️ Response interpolation (logic works, needs more testing)

⸻

[5.8.1] — Thai Emotion System (Cultural Emotional Richness)

📅 2025-10-27

⸻

🎯 Added

Thai Emotion Baselines (44 emotions)
	•	Comprehensive PAD coverage across all quadrants
	•	Positive + Low Arousal (4): สงบ, สบาย, ผ่อนคลาย, พอใจ
	•	Positive + High Arousal (5): ดีใจ, ตื่นเต้น, สนุก, ร่าเริง, สะใจ
	•	Positive + Medium (5): กตัญญู, ภูมิใจ, ซาบซึ้ง, สะเทือนใจ, ประทับใจ
	•	Neutral (3): เฉย, ปกติ, เพิกเฉย
	•	Negative + Low (7): เศร้า, เหงา, อ้างว้าง, เหนื่อยใจ, เหนื่อยกาย, ท้อแท้, หมดหวัง
	•	Negative + Medium (5): กังวล, เครียด, ผิดหวัง, เสียใจ, เสียดาย
	•	Negative + High (6): โกรธ, หงุดหงิด, รำคาญ, กลัว, ตกใจ, ตื่นกลัว
	•	Social/Complex (4): อาย, อิจฉา, ริษยา, อดทน
	•	Boredom (3): เบื่อ, เซ็ง, เฉาๆ

Emotion Detection API
	•	findClosestThaiEmotion(state) — Map PAD state to closest Thai emotion label
	•	detectEmotionFromText(text) — Keyword-based emotion detection (Thai + English)
	•	blendMultipleEmotions(labels) — Average multiple emotion states
	•	detectAllEmotions(text) — Find all emotions in text

Optional Vitality Dimension
	•	vitality field (0..1) tracks physical/mental energy
	•	Distinguishes เหนื่อยกาย (physical fatigue) from เหนื่อยใจ (mental exhaustion)

hi-introvert v1.2 Integration
	•	Context panel displays Thai emotion labels (44 granular emotions vs 8 basic)
	•	Fixed bug: world.tick displayed code snippet → use entities.length instead

⸻

📝 Changed

Bundle Size
	•	Full: 290.19 KB (+13 KB from v5.8.0) — Thai emotion baselines + detection functions
	•	Lite: 179.87 KB (+2 KB from v5.8.0) — Minimal overhead
	•	Validator: 17.25 KB (unchanged)

Emotion Display
	•	Calm (V=0.05, A=0.52, D=0.5) → "ปกติ" (was "neutral")
	•	Happy (V=0.7, A=0.7, D=0.6) → "ร่าเริง" (was "happy")
	•	Sad (V=-0.5, A=0.2, D=0.3) → "เศร้า" (was "sad")

⸻

⚙️ Technical Details

Emotion Detection Flow
	1.	User provides PAD state or text
	2.	detectEmotionFromText() finds keywords → returns PAD state
	3.	findClosestThaiEmotion() calculates Euclidean distance in 4D PAD+vitality space
	4.	Returns closest Thai emotion label (44 options)

Backwards Compatibility
	•	Existing PAD emotions still work unchanged
	•	Thai labels are display-only — core still uses PAD model
	•	All existing .mdm files compatible

⸻

🎬 Philosophy

"อารมณ์ไทย ละเอียดกว่าแปดแบบ" — Thai culture has nuanced emotions that PAD's 8 basic emotions can't capture. This system provides 44 culturally-specific labels while maintaining PAD compatibility. Users get richer emotional feedback without breaking existing systems.

⸻

[5.8.0] — World Auto-Context Injection (Generic Triggers)

📅 2025-10-26

⸻

🎯 Added

Context Provider System
	•	ContextProvider — Base interface for context data sources
	•	OSContextProvider — System metrics (CPU, memory, battery, uptime, load)
	•	ChatContextProvider — Conversation metrics (message, silence duration)

World Broadcast API
	•	world.broadcastContext(context) — Send context to all entities + check triggers
	•	Auto-injection pattern: app sends data → world distributes → entities react

Generic Trigger Parser (v5.8.0)
	•	Dot-notation keys: cpu.usage, memory.usage, battery.level, user.silence
	•	Operators: >, <, >=, <=
	•	Time units: 60s (seconds), 1000ms (milliseconds)
	•	Negative values: temperature>-10, temperature<-10
	•	Example MDM: { "trigger": "cpu.usage>0.8", "to": "stress" }

Tests
	•	test-generic-triggers.mjs — 28 pattern tests (100% pass)
	•	Total coverage: 137 tests (109 existing + 28 new)

⸻

📝 Changed

Bundle Size
	•	Full: 276.91 KB (+25 KB from v5.7.0) — Node.js modules (os, fs, child_process)
	•	Lite: 177.99 KB (+21 KB from v5.7.0) — Generic parser overhead
	•	Validator: 17.25 KB (unchanged)

MDM Parser
	•	Removed hardcoded user.silence>Ns pattern (now uses generic parser)
	•	Generic pattern takes precedence over keyword-based triggers
	•	Backward compatible: all existing triggers still work

Dependencies
	•	Added @types/node for Node.js type definitions
	•	Updated tsconfig.json with "types": ["node"]
	•	Updated vite.config.ts with external: ['os', 'child_process', 'fs']

⸻

⚙️ Technical Details

Context Injection Flow
	1.	App collects metrics (OS, chat, sensors)
	2.	App calls world.broadcastContext({ ... })
	3.	World loops all entities → updateTriggerContext()
	4.	World loops all entities → checkEmotionTriggers()
	5.	Entities react automatically based on MDM definitions

Generic Trigger Regex
	•	Pattern: /^([\w.]+)([><]=?)(-?\d+\.?\d*)(s|ms)?$/
	•	Examples: cpu.usage>0.8, memory.usage<0.2, user.silence>60s
	•	Supports dot-notation keys, numeric operators, time units

Context Provider Architecture
	•	BaseContextProvider — Shared normalize() method (0-1 range)
	•	OSContextProvider.getContext() — Returns current system state
	•	ChatContextProvider.getContext(message?) — Calculates silence duration
	•	Extensible: Create custom providers for any data source

⸻

🎬 Philosophy

"World ต้องฉลาดเอง แต่ไม่พังของเก่า" — World automatically injects context when app sends data. MDM writers use natural logic (cpu.usage>0.8) without knowing field names. App developers just call broadcastContext() and entities react. Zero breaking changes, maximum simplicity.

⸻

[5.7.0] — Emergent Linguistics System (Phase 10)

📅 2025-10-26

⸻

🎯 Added

Emergent Linguistics (Phase 10)
	•	WorldLexicon — Track emergent terms, usage frequency, and strength
	•	TranscriptBuffer — Store conversation history with speaker/emotion context
	•	ProtoLanguageGenerator — Generate vocabulary-based proto-language (>= 20 words)
	•	MemoryCrystallizer — Consolidate linguistic patterns from repeated interactions
	•	WorldFile Linguistics Serialization — Save/restore lexicon + transcript

World Linguistics API
	•	world.recordUtterance(speaker, text, emotion) — Log conversation
	•	world.addTerm(term, meaning, origin) — Add emergent vocabulary
	•	world.getPopularTerms(limit) — Get most-used terms
	•	world.getRecentUtterances(limit) — Get conversation history
	•	world.getLexiconStats() — Get lexicon statistics
	•	world.crystallizePatterns() — Consolidate linguistic patterns

Tests
	•	test-linguistics.mjs — 6 core linguistics tests (100% pass)
	•	test-world-linguistics.mjs — 8 world integration tests (100% pass)

⸻

📝 Changed

Bundle Size
	•	Full: 251.77 KB (+30.76 KB from v5.5.0) — Linguistics features
	•	Lite: 156.93 KB (+23.22 KB from v5.5.0) — Basic proto-language
	•	Validator: 17.25 KB (unchanged)

⸻

⚙️ Technical Details

Proto-Language Generation
	•	Activates when vocabulary >= 20 words
	•	Uses base vocabulary + crystallized patterns + environment terms
	•	Emotion-aware phrasing (valence affects word choice)
	•	Fallback to MDM dialogue if insufficient vocabulary

Memory Crystallization
	•	Four tiers: nascent (2+), emerging (5+), strong (10+), crystallized (20+)
	•	Pattern strength decays over time (logarithmic curve)
	•	Rehearsal increases strength (practice makes perfect)
	•	Integrated with WorldFile serialization

Lexicon Tracking
	•	Term metadata: usage count, first/last seen, strength, meaning
	•	Origin tracking: dialogue, learning, user_input, crystallized
	•	Strength calculation: usage × recency × rehearsal count
	•	Automatic term detection from all conversations

⸻

🎬 Philosophy

"Language emerges from interaction" — Entities develop vocabulary naturally through conversation. Proto-language generates when entities lack canned responses, forcing creativity from base words. Patterns crystallize through repetition, forming permanent linguistic structures. The system learns to speak by speaking.

⸻

[5.5.0] — P2P Cognition Foundation (Distributed Intelligence)

📅 2025-10-25

⸻

🎯 Added

P2P Cognition Systems (Phase 9)
	•	ResonanceField — Cognitive signal propagation through entity networks
	•	CognitiveLink — Entity-to-entity connections with strength parameter
	•	MemoryLog (CRDT) — Distributed memory with vector clocks (conflict-free)
	•	CognitiveNetwork — Small-World topology builder (Watts-Strogatz model)
	•	TrustSystem — Privacy policies + reputation management
	•	resonate() — Emotional resonance function (PAD model blending)

Entity Cognitive API
	•	entity.connectTo(target, { strength, bidirectional }) — Form cognitive links
	•	entity.disconnectFrom(targetId) — Remove connections
	•	entity.isConnectedTo(targetId) — Check link existence
	•	entity.getLinkStrength(targetId) — Get connection strength
	•	entity.reinforceLink(targetId) — Strengthen bonds on interaction
	•	entity.decayCognitiveLinks(dt) — Natural forgetting over time
	•	entity.getConnectedEntities() — List all connections
	•	entity.cognitiveLinks — Map of CognitiveLink objects

World Configuration
	•	features.cognition — Enable P2P cognition systems
	•	cognition.network — Small-world config (k, p)
	•	cognition.trust — Trust system config (initialTrust, trustThreshold)
	•	cognition.resonance — Signal propagation config (decayRate, minStrength)

Tests
	•	88 new tests for P2P systems (100% pass)
	•	emotional-resonance.test.mjs — 30 tests
	•	memory-crdt.test.mjs — 33 tests
	•	cognitive-network.test.mjs — 25 tests

⸻

📝 Changed

Ontology
	•	emotion.ts — Added resonate() function for emotional contagion
	•	Exported from src/index.ts for public API

Bundle Size
	•	Full: 221.01 KB (+27.18 KB from v5.4.0) — P2P cognition features
	•	Lite: 133.71 KB (unchanged) — No P2P in lite bundle
	•	Validator: 17.25 KB (unchanged)

⸻

⚙️ Technical Details

Small-World Network
	•	Each entity connects to k nearest neighbors (default: 8)
	•	Edges rewired with probability p (default: 0.2)
	•	Combines local clustering with long-range shortcuts
	•	Periodic rewiring prevents knowledge stagnation

CRDT Memory Log
	•	Event-sourced append-only log
	•	Vector clocks track causality
	•	Deterministic merge (zero conflicts)
	•	Eventual consistency across entities

Resonance Field
	•	Three signal types: memory, emotion, pattern
	•	Strength decays per hop (configurable decay rate)
	•	Breadth-first propagation through cognitive network
	•	Minimum strength threshold for delivery

Trust & Privacy
	•	Four share policies: never, trust, contextual, public
	•	Trust index based on interaction history (+/- deltas)
	•	Deception capability (placeholder for future Byzantine tolerance)
	•	Privacy settings per data type (memory, emotion, intent, location)

⸻

🎬 Philosophy

"Physics of understanding in distributed systems" — Global coherence emerges from local interactions. Entities form cognitive networks, share experiences through resonance fields, and evolve collective intelligence without central control. Trust and privacy enable realistic minds with selective sharing.

⸻

[5.4.0] — Complete Core API (Event System + Reflection + Emotional Dialogue)

📅 2025-10-24

⸻

🎯 Added

World Event System
	•	world.events — Alias for world.eventLog (clearer naming)
	•	world.broadcastEvent(type, data, relay?) — Broadcast events to world + entities
	•	world.listenForEvents(predicate) — Filter events by custom criteria
	•	relay parameter sends system messages to all entities via communication system
	•	Full integration with world history tracking

Entity Reflection API
	•	entity.reflect(stimulus?) — Trigger reasoning pattern (Stimulus → Reflection → Action)
	•	Returns ReflectionResult { thought, emotionShift, newIntent, timestamp }
	•	Uses Memory (recalls recent events), Emotion (influences reasoning), Learning (pattern matching), Intent (motivation check)
	•	Simple rule-based synthesis (can be replaced with LLM later)
	•	Example: entity.reflect('I see a stranger') → "I remember strangers can be dangerous... I see a stranger"

Emotion-Aware Dialogue Tone
	•	LanguageGenerator.modulateTone() — PAD model → LLM prompt modulation
	•	Pleasure axis → warmth (warm/friendly vs cold/distant)
	•	Arousal axis → energy (energetic/intense vs calm/subdued)
	•	Dominance axis → assertiveness (commanding/assertive vs hesitant/submissive)
	•	Automatic tone injection into LLM prompts based on entity.emotion state

Documentation
	•	NEW: docs/SYSTEM-MAPPING.md — Complete checklist → API mapping (88.3% → 94.7% coverage)
	•	REFERENCE.md updated with System Checklist Coverage table
	•	All 11 ontology categories documented with status indicators (✅/⚠️/🔄/❌)

⸻

📝 Changed

Core APIs Enhanced
	•	world.eventLog now accessible as world.events (clearer naming)
	•	Communication system integrated with event broadcast (relay mode)
	•	Entity reasoning loop now explicit via reflect() method

⸻

📦 Bundle Impact

	•	Full bundle: 186.74 KB → ~190 KB (+3.26 KB, +1.7%)
	•	Gzipped: 43.17 KB → ~44 KB (+0.83 KB)
	•	Lite bundle: 120.42 KB (unchanged - no cognitive/communication in lite)
	•	Validator: 17.25 KB (unchanged)

New code additions:
	•	world.events API wrapper: ~0.8 KB
	•	entity.reflect() method: ~1.5 KB
	•	emotion-aware dialogue tone: ~1 KB

⸻

💡 Why It Matters

**Complete Ontology Checklist:**
- Closes 3 critical gaps: world.events[], entity.reflect(), emotion-aware dialogue
- Coverage: 88.3% → 94.7% (44.5/47 checklist items)
- Only 3 future items remain (re-learn loop, dream mode, .world.mdm format)

**Event-Driven Architecture:**
```javascript
// Broadcast sensor events
world.broadcastEvent('motion_detected', { zone: 'living_room' }, true)

// All entities receive system message
entity.inbox.peek()  // → "[SYSTEM] motion_detected"
```

**Cognitive Reasoning:**
```javascript
// Claude entity reflects on world
const claude = world.spawn({ essence: 'AI assistant' }, 100, 100)
claude.enable('memory', 'learning')

const thought = claude.reflect('Motion detected in living room')
console.log(thought.thought)
// → "I remember living_room (motion)... Motion detected in living room [2 patterns learned]"
```

**Emotional Dialogue:**
```javascript
// Emotion affects LLM tone
entity.emotion.pleasure = -0.8
entity.emotion.arousal = 0.9
entity.emotion.dominance = -0.3

const response = await languageGenerator.generate({ speaker: entity })
// Tone modulation: "cold, intense, hesitant"
```

⸻

🔄 Migration from v5.3

Zero breaking changes. All new APIs are additive.

```javascript
// No code changes needed - old code still works
// But you can now use:

// Event system
world.events  // Instead of world.eventLog
world.broadcastEvent('sunrise', { intensity: 0.8 })

// Reflection
const reflection = entity.reflect('I see a stranger')

// Emotion-aware dialogue (automatic - just ensure entity.emotion is set)
entity.emotion.pleasure = 0.8  // Dialogue will be warm, friendly
```

⸻

[5.3.0] — Developer Experience & API Unification

📅 2025-10-24

⸻

🎯 Added

Unified Feature Activation API
	•	entity.enable(...features) — Enable multiple features in one call
	•	entity.disable(...features) — Disable features
	•	entity.isEnabled(feature) — Check if feature is enabled
	•	entity.enableAll() / disableAll() — Convenience methods
	•	Chainable API: world.spawn(material, x, y).enable('memory', 'learning')
	•	Available features: 'memory', 'learning', 'relationships', 'skills'

Simplified LLM Configuration
	•	Single llm object at world level (replaces 5 scattered properties)
	•	llm.provider: 'openrouter' | 'anthropic' | 'openai' (default: openrouter)
	•	llm.apiKey: Auto-fallback to process.env.OPENROUTER_KEY
	•	llm.languageModel: Model name (default: anthropic/claude-3.5-sonnet)
	•	llm.embeddingModel: Optional embeddings (local fallback if omitted)
	•	Automatic migration from old config (backward compatible)

⸻

📝 Changed

Documentation Improvements
	•	Complete REFERENCE.md overhaul (1,178 → 1,344 lines)
	•	Progressive disclosure with difficulty tags (🟢🟡🔴)
	•	Fixed 25+ incorrect API examples (old enableMemory/enableLearning → new unified API)
	•	Merged duplicate sections (Lifecycle Hooks, LLM Config)
	•	Added comprehensive Glossary (13 key terms)
	•	Added Migration Guide for v5.0-5.2 → v5.3 upgrades

Version-Agnostic Documentation
	•	Removed version numbers from all user-facing docs (OVERVIEW, examples/*)
	•	Updated all code examples to use v5.3 unified API
	•	"Immortal docs" strategy — won't need updates on version bumps

README Updates
	•	Accurate bundle sizes (186.74 KB full, 120.42 KB lite)
	•	10-second quick start example
	•	TypeScript support highlighted
	•	v5.3 unified API featured prominently
	•	Migration guide link for v5.2 users

⸻

📦 Bundle Impact

	•	Full bundle: 198.79 KB → 186.74 KB (-6.1% / -12.05 KB)
	•	Gzipped: 45.08 KB → 43.17 KB (-4.2%)
	•	Lite bundle: 120.42 KB (27.87 KB gzipped)
	•	Validator: 17.25 KB (3.19 KB gzipped)

⸻

💡 Why It Matters

**Consistent Developer Experience:**
- One way to enable features (no more enableMemory vs enableLearning() vs enable('relationships'))
- TypeScript autocomplete works perfectly
- Copy-paste examples actually work

**Simplified LLM Setup:**
```javascript
// Before (v5.2)
const world = new World({
  languageProvider: 'openrouter',
  languageApiKey: 'sk-...',
  languageModel: 'claude-3.5',
  semanticProvider: 'openai',
  semanticApiKey: 'sk-...'
})

// After (v5.3)
const world = new World({
  llm: {
    apiKey: process.env.OPENROUTER_KEY
  }
})
```

**Better Onboarding:**
- 10s quick start (vs 30s before)
- Progressive learning path (basic → intermediate → advanced)
- Clear migration path from v5.2

⸻

🔄 Migration from v5.2

**Automatic (Zero Breaking Changes):**
- Old LLM config automatically converts to new format
- Console warnings guide you to new patterns
- All old APIs still work (deprecated but functional)

**Recommended Updates:**
```javascript
// Old API (still works)
entity.enableMemory = true
entity.enableLearning()

// New API (recommended)
entity.enable('memory', 'learning')
```

See [Migration Guide](./REFERENCE.md#migration-guide) for complete details.

⸻

[5.2.3] — Documentation Update

📅 2025-10-23

⸻

📝 Updated

README.npm.md Accuracy
	•	Bundle sizes: 140 KB → 182 KB (accurate final size)
	•	Added "Choose Your Bundle" section (Full/Lite/Validator)
	•	Added "Advanced Features (v5.2+)" with code examples
	•	Added "LLM Integration" section with provider examples
	•	Added "Recent Updates" version history

⸻

💡 Why It Matters

npm package page now shows accurate bundle sizes and usage examples for v5.2.2.
Helps developers choose the right bundle for their needs.

No code changes — documentation only.

⸻

[5.2.2] — AGI-Ready (No Lazy Loading)

📅 2025-10-23

⸻

🔄 Reverted

Lazy Loading Removed
	•	LanguageGenerator: back to static import (no async delay)
	•	CollectiveIntelligence: back to static import (no async delay)
	•	Main bundle: 168.15 KB → 182 KB (+13.85 KB, +8.2%)
	•	CI threshold: 180 KB → 185 KB

⸻

💡 Why It Matters

**For AGI projects that use LLM + WorldMind constantly:**
- No async delays (everything loads immediately)
- Simpler code (no dynamic imports)
- Better for real-time AGI systems

**Trade-off:**
- +13.85 KB bundle size
- Still 8.4% smaller than v5.2.0 (198.79 KB)
- Lite bundle (93.62 KB) still available for non-AGI use cases

⸻

[5.2.1] — Bundle Optimization

📅 2025-10-23

⸻

⚡ Optimized

Bundle Size Reduction
	•	Main bundle: 198.79 KB → 168.15 KB (-15.4% / -30.64 KB)
	•	Validator bundle: 17.25 KB (extracted, separate import)
	•	Lite bundle: 93.62 KB (new minimal entry point)
	•	Lazy chunks: language.js (8.55 KB), world-mind.js (5.18 KB)

Optimization Techniques
	•	Aggressive minification (drop console, mangle properties, 2 passes)
	•	Lazy loading: LanguageGenerator + CollectiveIntelligence
	•	Extracted MDM validator to separate bundle (@v1b3x0r/mds-core/validator)
	•	Removed unfinished Goal system (moved to Phase 3)
	•	Created lite entry point (@v1b3x0r/mds-core/lite)

CI Updates
	•	Bundle size threshold: 160 KB → 180 KB (more headroom for future features)
	•	Main bundle now at 168.15 KB (11.85 KB below limit)

⸻

📦 Bundle Usage

```typescript
// Full bundle (all features) - 168.15 KB
import { World, Entity } from '@v1b3x0r/mds-core'

// Lite bundle (core only) - 93.62 KB
import { World, Entity } from '@v1b3x0r/mds-core/lite'

// Validator (dev/test) - 17.25 KB
import { validateMaterial } from '@v1b3x0r/mds-core/validator'
```

⸻

💡 Why It Matters

15.4% smaller bundle while keeping all Phase 2 features.
Lazy loading ensures unused modules (LLM, WorldMind) don't bloat the initial bundle.
Lite bundle offers 53% size reduction for basic simulations.

Zero breaking changes — all optimizations are transparent.

⸻

[5.2.0] — Core Gaps Filled

📅 2025-10-23

⸻

🚀 Added

Phase 2.1 — Similarity Provider (+16.59 KB)
	•	Pluggable semantic similarity system (SimilarityProvider interface)
	•	Providers: MockSimilarityProvider, OpenAISimilarityProvider, CohereSimilarityProvider
	•	EntitySimilarityAdapter for similarity-based clustering
	•	LRU-style embedding cache with configurable limits
	•	25 tests (100% pass)

Phase 2.2 — Memory Crystallization (+7.76 KB)
	•	Long-term memory consolidation via MemoryCrystallizer
	•	Pattern recognition tiers: occasional (3–4), repeated (5–9), frequent (10+)
	•	Crystal reinforcement from repeated interactions
	•	Metadata aggregation (numeric averages, common values)
	•	20 tests (100% pass)

Phase 2.3 — Symbolic-Physical Coupling (+5.94 KB)
	•	Emotion → Physics mapping via SymbolicPhysicalCoupler
	•	PAD model: Arousal→Speed, Valence→Mass, Dominance→Force
	•	Memory strength → Attraction multiplier
	•	Intent → Movement direction bias
	•	Presets: subtle, standard, extreme, disabled
	•	25 tests (100% pass)

Phase 2.4 — Intent Reasoning (+10.46 KB)
	•	Context-aware intent scoring via IntentReasoner
	•	Multi-factor logic: emotion + memory + crystal + relationship
	•	Intent suggestion & re-evaluation engine
	•	Abandonment logic for stale goals
	•	25 tests (100% pass)

Phase 2.5 — Relationship Decay (+5.97 KB)
	•	Time-based deterioration via RelationshipDecayManager
	•	Decay curves: linear, exponential, logarithmic, stepped
	•	Grace period for fresh interactions
	•	Auto-pruning of weak relationships
	•	Presets: casual, standard, deep, fragile, immortal
	•	25 tests (100% pass)

⸻

⚙️ Changed
	•	Bundle size: 132.53 KB → 198.79 KB (+49.8%)
	•	Test count: 110 → 192 (+82 tests, all passing)
	•	Version bump → 5.2.0

⸻

💡 Why It Matters

v5.2 fills the missing neural gaps making entities truly intelligent:
	•	Semantic clustering (understands similarity)
	•	Long-term memory (patterns crystallize)
	•	Emotion-physics (mood alters motion)
	•	Intent reasoning (contextual decision-making)
	•	Realistic forgetting (relationships fade naturally)

Zero breaking changes.
All Phase 2 features are opt-in and tree-shakeable.

⸻

[5.1.0] — Anyone Can Play

📅 2025-10-22

⸻

🚀 Added
	•	Declarative dialogue system
	•	dialogue.intro, dialogue.self_monologue, dialogue.events.*
	•	Multilingual lang object
	•	Event-triggered dialogue (onPlayerClose, onPlayerAttack, etc.)
	•	Emotion triggers (declarative)
	•	emotion.triggers: trigger→delta mappings
	•	Example: { "trigger": "player.gaze>5s", "delta": { "valence": -0.3 } }
	•	Supports conditions: player.gaze>5s, player.attack, entity.death, etc.
	•	Multilingual essence support
	•	essence field now supports any language
	•	Example: { "essence": "ผีขี้อาย" }

⸻

⚙️ Changed
	•	Documentation overhaul → new progressive tutorial path (01-START.md → 11-*)
	•	Removed legacy /examples/ and /docs/technical/ folders
	•	Target audience shift: developers → curious minds (12+)

⸻

💡 Why It Matters

v5.1 opens MDS to everyone:
	•	No TypeScript required (pure JSON)
	•	Multilingual configs allowed
	•	Declarative triggers replace procedural code

⸻

[5.0.0] — Living World Simulation Engine

📅 2025-10-21

⸻

🚀 Added

Phase 1 — Ontology Foundation

Memory system, emotional state (PAD), relationships, and intent stack.

Phase 2 — World Container

Three-phase tick loop (Physical → Mental → Relational) with history logging.

Phase 3 — Renderer Abstraction

Supports DOM, Canvas, WebGL, and Headless renderers (RendererAdapter).

Phase 4 — WorldFile Persistence

Save/load full simulation states with deterministic snapshots.

Phase 5 — Environmental Physics

Collision, thermal energy, weather, and emotion-physics coupling.

Phase 6 — Communication

Message queue, dialogue trees, LLM generation (OpenRouter/Anthropic/OpenAI), and embeddings.

Phase 7 — Cognitive Evolution

Learning (Q-learning), pattern detection, and skill proficiency tracking.

Phase 8 — World Mind

CollectiveIntelligence: population statistics, collective emotion, pattern detection.

⸻

⚙️ Changed
	•	Bundle size: 18.42 KB → 132.53 KB
	•	Tests: 42 → 110
	•	Architecture: monolith → modular simulation framework

⸻

💡 Why It Matters

v5.0 is a complete rewrite:
	•	Entities have persistent identity and emotion
	•	Behavior emerges naturally
	•	The world is saveable, stateful, alive

Backward compatible with v4.

⸻

[4.2.1] — World-Class Organization

📅 2025-10-17

Organizational overhaul with full documentation, role-based learning, and GitHub Pages workflow.

⸻

[4.2.0] — Finally Walks Straight

📅 2025-10-17

Introduced lifecycle hooks, serialization, deterministic mode, and timeline tracking.

⸻

[4.1.0] — The Missing Pieces

📅 2025-10-16

LLM bridge, OpenRouter adapter, and semantic groundwork for info-physics.

⸻

[4.0.0] — Info-Physics Engine

📅 2025-10-16

Complete rewrite — from UI library to simulation engine.
JSON describes ontology, not styling.
Event-driven → Force-driven.

⸻

[3.0.0] — CSS Material System (Legacy)

📅 2024-12-15

UI-focused origin of MDS. Manifest-driven materials, optics, surfaces, themes.
Status: Archived.

⸻

[2.x] — Early Explorations

📅 2024-01
Prototypes and chaos. Not public.

⸻

🧭 Format Notes

[Major.Minor.Patch] → Semantic versioning
Date → YYYY-MM-DD
Subtitle → Release codename

Change Types:
Added, Changed, Deprecated, Removed, Fixed, Security

Purpose: Explain impact, not just what changed.

⸻

🌌 The Journey

From CSS materials (v3) → info-physics (v4) → living ontology (v5)
Each version answers the same question:
“What if JSON could be alive?”

⸻

Changelog maintained in Chiang Mai — updated with every release. ✨
