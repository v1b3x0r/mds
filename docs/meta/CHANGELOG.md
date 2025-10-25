#Changelog

A human-readable history of what changed and why it matters.

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