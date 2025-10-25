# Material Definition System — AI Context (Essence-First)

**For AI assistants only — not human documentation**

---

## 1. ONTOLOGY — What This Actually Is

### Core Identity

**MDS (Material Definition System)** is an **info-physics engine** where JSON entities have:
- Memory (remembers interactions, decays over time)
- Emotion (PAD model: Pleasure-Arousal-Dominance)
- Relationships (forms bonds, tracks history)
- Learning (Q-learning, skill proficiency)
- Physics (attract/repel based on semantic similarity)

### Mental Model

```
Normal software:      Data → Logic → Behavior
MDS:                  Essence → Physics → Emergence
```

**Example:**
```json
{ "essence": "Lonely ghost" }
```

This is **complete and valid**. The system will:
- Spawn entity ✓
- Give it emotional state ✓
- Make it age/decay ✓
- Allow relationships ✓
- Enable physics interactions ✓

### What It Is NOT

❌ **NOT** a UI framework (no CSS, no DOM manipulation)
❌ **NOT** a game engine (no graphics, collision, sprites)
❌ **NOT** a database (no persistence layer, no queries)
❌ **NOT** an AI chatbot (LLM integration is optional)

✅ **IS** an ontology simulator — JSON describes "what things are," behavior emerges

---

## 2. PHILOSOPHY — Why This Exists

### Core Principle

**"Cultivation, not Control"**

Traditional software: You program every behavior explicitly
MDS: You describe essence, interactions emerge naturally

### Example

**Traditional code (500 lines):**
```javascript
if (player.near(npc) && npc.remembers(player) && player.attackedBefore) {
  npc.mood = "angry"
  npc.say(getAngryDialogue(npc.language))
}
```

**MDS (12 lines JSON):**
```json
{
  "essence": "NPC who remembers violence",
  "emotion": {
    "transitions": [{ "trigger": "player.attack", "to": "anger" }]
  }
}
```

Result: **NPC remembers. Forever.** No manual state management.

### Design Philosophy

1. **Essence-first** — JSON describes identity, not implementation
2. **Multilingual by default** — All text fields accept any language
3. **Progressive complexity** — Works with minimal data, scales to advanced features
4. **Zero breaking changes** — Old APIs deprecated but functional, warnings guide migration
5. **Local-first** — No cloud dependencies, inspectable memories, user data privacy

---

## 3. CURRENT STATE — v5.3.0 (Production Ready)

### Bundle Size

- **Full bundle:** 186.74 KB (43.17 KB gzipped)
- **Lite bundle:** 120.42 KB (27.87 KB gzipped) — core only, no LLM
- **Validator:** 17.25 KB (3.19 KB gzipped) — dev/test helper

### Core Systems (8 Phases)

1. **Ontology** — Memory (Ebbinghaus decay), Emotion (PAD), Relationships, Intent
2. **World Container** — Three-phase tick (Physical → Mental → Relational)
3. **Renderer** — Adapters for DOM/Canvas/WebGL/Headless
4. **Persistence** — Save/load full world state (WorldFile)
5. **Physics** — Collision, thermal energy, weather, emotion-physics coupling
6. **Communication** — Message queue, dialogue trees, LLM generation
7. **Cognition** — Learning (Q-learning), pattern detection, skill proficiency
8. **World Mind** — Collective intelligence, population statistics, emergent patterns

### Advanced Ontology Systems (Phase 2)

- **Similarity Provider** — Semantic clustering via embeddings (OpenAI/Cohere/Mock)
- **Memory Crystallization** — Long-term memory consolidation (pattern recognition tiers)
- **Symbolic-Physical Coupling** — Emotion → Physics mapping (PAD affects speed/mass/force)
- **Intent Reasoning** — Context-aware goal scoring (emotion + memory + relationships)
- **Relationship Decay** — Time-based forgetting (linear/exponential/logarithmic curves)

### Test Coverage

- **192 tests** (100% pass)
- Coverage: Memory, Emotion, Learning, Physics, Communication, World Mind, all Phase 2 systems

---

## 4. QUICK START — For AI Assistants

### Minimal Entity (5 lines)

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World()
const entity = world.spawn({ essence: 'Ghost' }, 100, 100)
// Entity exists, has emotion, can age, can form relationships
```

### Full-Featured Entity (v5.3 Unified API)

```javascript
const world = new World({
  features: {
    memory: true,
    learning: true,
    relationships: true,
    communication: true
  },
  llm: {
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_KEY,
    languageModel: 'anthropic/claude-3.5-sonnet'
  }
})

const npc = world.spawn({
  essence: 'Village blacksmith who holds grudges',
  dialogue: {
    intro: [{ lang: { en: 'What do you want?', th: 'ต้องการอะไร?' }}]
  }
}, 200, 200)

// v5.3 Unified API (replaces old enableMemory, enableLearning, etc.)
npc.enable('memory', 'learning', 'relationships')

// NPC now:
// - Remembers all interactions (memory)
// - Learns from rewards/punishment (learning)
// - Forms relationships with other entities (relationships)
```

---

## 5. CRITICAL PATTERNS — What AI Must Know

### v5.3 Unified Feature Activation

```javascript
// ✅ CURRENT (v5.3) — Unified API
entity.enable('memory', 'learning', 'relationships', 'skills')
entity.disable('learning')
entity.isEnabled('memory')  // → true
entity.enableAll()   // Enable everything
entity.disableAll()  // Disable everything

// ❌ DEPRECATED (v5.2) — Still works, but console warns
entity.enableMemory = true
entity.enableLearning()
```

**Rule:** Always use `enable()` / `disable()` / `isEnabled()` in new code.

### v5.3 Simplified LLM Configuration

```javascript
// ✅ CURRENT (v5.3) — Grouped LLM config
const world = new World({
  llm: {
    provider: 'openrouter',     // 'openrouter' | 'anthropic' | 'openai'
    apiKey: 'sk-...',           // Auto-fallback to process.env.OPENROUTER_KEY
    languageModel: 'anthropic/claude-3.5-sonnet',
    embeddingModel: 'openai/text-embedding-3-small'  // Optional
  }
})

// ❌ DEPRECATED (v5.2) — Still works, auto-converts with warning
const world = new World({
  languageProvider: 'openrouter',
  languageApiKey: 'sk-...',
  languageModel: 'claude-3.5',
  semanticProvider: 'openai',
  semanticApiKey: 'sk-...'
})
```

**Rule:** Use single `llm` object for all LLM config.

### Essence-First Design

```json
{ "essence": "ผีขี้อาย" }
```

**This works.** Any language. Minimal data. System fills in defaults.

### World Spawn Signature

```javascript
// ✅ CORRECT
world.spawn(material, x, y)

// ❌ WRONG
world.spawn(material, { x, y })  // Common mistake in docs
```

---

## 6. WORKING WITH USER — Guidelines for AI

### User Philosophy

- **Thai speaker** — Prefers Thai responses, but code/reasoning in English
- **"อ่านง่ายเข้าใจมากกว่า"** — Readable/understandable > brevity
- **"Cultivation, not Control"** — Emergence > hardcoded rules
- **KISS principle** — Simple solutions > over-engineering

### Before Modifying Code

**Verification Checklist:**

1. Check bundle size impact (must stay ≤ 200 KB for full bundle)
2. Verify all tests pass (`npm test`)
3. Update docs if API changed (REFERENCE.md, README.md)
4. Update CHANGELOG.md if version bump needed
5. Build and verify (`npm run build`)

### After Modifying Code

**Always verify:**

```bash
npm run build           # Check bundle size
npm test               # All 192 tests must pass
npm run type-check     # TypeScript validation
```

**Expected output:**
- Build: 186.74 KB (full), 120.42 KB (lite), 17.25 KB (validator)
- Tests: 192 pass, 0 fail
- Types: No errors

### Documentation Philosophy

**"Immortal Docs"** — Version-agnostic content that doesn't need updating on version bumps.

- ✅ Use: "MDS allows...", "Current unified API...", "Recent versions..."
- ❌ Avoid: "v5.3 introduces...", "In version 5.2...", "As of v5.1..."

**Exception:** CHANGELOG.md and VERSION SUMMARY (below) can have version numbers.

---

## 7. VERSION SUMMARY — Current Only

**Current Version:** v5.5.0 (2025-10-25)

**Key Changes:**
- P2P Cognition systems (ResonanceField, CognitiveLink, MemoryLog CRDT)
- Small-World Network topology (Watts-Strogatz model, k=8, p=0.2)
- Trust & Privacy system (share policies, reputation, deception capability)
- Emotional resonance (`resonate()` function for emotional contagion)
- 88 new tests for distributed intelligence (100% pass)

**Full history:** See [CHANGELOG.md](docs/meta/CHANGELOG.md)

**Migration from v5.4:** Automatic. Zero breaking changes. All new APIs are additive.

---

**Last Updated:** 2025-10-25 | **Project Status:** Production Ready | **Bundle:** ~221 KB
