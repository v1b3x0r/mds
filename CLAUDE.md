# Material Definition System — AI Context (Essence-First)

**For AI assistants only — not human documentation**

---

## 1. ONTOLOGY — What This Actually Is

### Core Identity

**MDS (Material Definition System)** is an **info-physics engine** where JSON entities have:
- **Needs** (water, food, energy — deplete over time, drive behavior)
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

## 3. CURRENT STATE — v5.9.2 (Production Ready)

### Bundle Size

- **Full bundle:** 443.72 KB (106.53 KB gzipped) — includes Layer 7/8 upgrades + Material Pressure System
- **Lite bundle:** 350.08 KB (85.25 KB gzipped)
- **Validator:** 25.86 KB (4.38 KB gzipped)

### Core Systems

1. **Ontology** — Memory (Ebbinghaus decay), Emotion (PAD), Relationships, Intent
2. **World Container** — Three-phase tick (Physical → Mental → Relational)
3. **Renderer** — Adapters for DOM/Canvas/WebGL/Headless
4. **Persistence** — Save/load full world state (WorldFile)
5. **Physics** — Collision, thermal energy, weather, emotion-physics coupling
6. **Communication** — Message queue, dialogue trees, LLM generation
7. **Cognition** — Learning (Q-learning), pattern detection, skill proficiency
8. **World Mind** — Collective intelligence, population statistics, emergent patterns

### Phase 1: Material Pressure System (v5.9)

- **Resource Needs** — Entities have needs (water, food, energy) that deplete over time
- **Resource Fields** — Spatial resource distribution (point/area/gradient sources)
- **Emotional Climate** — World remembers death, tracks collective grief/vitality/tension/harmony
- **Emergent Language** — Entities speak about needs, utterances crystallize into lexicon

### Advanced Ontology Systems (Phase 2)

- **Similarity Provider** — Semantic clustering via embeddings (OpenAI/Cohere/Mock)
- **Memory Crystallization** — Long-term memory consolidation (pattern recognition tiers)
- **Symbolic-Physical Coupling** — Emotion → Physics mapping (PAD affects speed/mass/force)
- **Intent Reasoning** — Context-aware goal scoring (emotion + memory + relationships)
- **Relationship Decay** — Time-based forgetting (linear/exponential/logarithmic curves)

### Test Coverage

- **192 tests** (100% pass)
- Coverage: Memory, Emotion, Learning, Physics, Communication, World Mind, Layer 7–8 behavior triggers + logger

---

## 4. QUICK START — For AI Assistants

### Minimal Entity (5 lines)

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World()
const entity = world.spawn({ essence: 'Ghost' }, { x: 100, y: 100 })
// Entity exists, has emotion, can age, can form relationships
```

### Entity with Needs (Phase 1)

```javascript
const world = new World({ features: { ontology: true, linguistics: true }})

const traveler = world.spawn({
  essence: 'Thirsty traveler',
  needs: {
    resources: [{ id: 'water', depletionRate: 0.01, criticalThreshold: 0.3 }]
  }
}, { x: 100, y: 100 })

// Add water source
world.addResourceField({
  id: 'well',
  resourceType: 'water',
  type: 'point',
  position: { x: 250, y: 250 },
  intensity: 1.0
})

// Simulate
world.tick(1)

// Check needs
if (traveler.isCritical('water')) {
  const utterance = traveler.speakAboutNeeds()  // "I need water"
  const consumed = world.consumeResource('water', traveler.x, traveler.y, 0.3)
  traveler.satisfyNeed('water', consumed)
}
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
}, { x: 200, y: 200 })

// Unified API (replaces old enableMemory, enableLearning, etc.)
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
world.spawn(material, { x, y })

// ❌ WRONG (old signature, deprecated)
world.spawn(material, x, y)
```

### Phase 1: Needs API (v5.9)

```javascript
// Check needs
entity.getNeed('water')           // Get need object
entity.isCritical('water')        // Check if < threshold
entity.getCriticalNeeds()         // Get all critical need IDs
entity.speakAboutNeeds()          // Generate utterance ("I need water")
entity.satisfyNeed('water', 0.3)  // Drink water (+30%)

// Resource fields
world.addResourceField({
  id: 'well',
  resourceType: 'water',
  type: 'point',
  position: { x: 200, y: 200 },
  intensity: 1.0
})

world.consumeResource('water', x, y, 0.3)  // Consume from field
world.findNearestResourceField(x, y, 'water')  // Find nearest

// Emotional climate
world.recordEntityDeath(entity, 0.9)  // Record death
const climate = world.getEmotionalClimate()  // Get climate
// climate.grief, climate.vitality, climate.tension, climate.harmony
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

1. Check bundle size impact (aim to keep growth minimal)
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

**Expected output (v5.9):**
- Build: 359.66 KB (full), 266.80 KB (lite), 17.25 KB (validator)
- Tests: 192 pass, 0 fail
- Types: No errors

### Documentation Philosophy

**"Immortal Docs"** — Version-agnostic content that doesn't need updating on version bumps.

- ✅ Use: "MDS allows...", "Current unified API...", "Recent versions..."
- ❌ Avoid: "v5.3 introduces...", "In version 5.2...", "As of v5.1..."

**Exception:** CHANGELOG.md and VERSION SUMMARY (below) can have version numbers.

---

## 7. VERSION SUMMARY — Current Only

**Current Version:** v5.9.2 (2025-11-04)

**Key Changes (Phase 1: Material Pressure System):**
- **Resource Needs** — Entities have needs (water, food, energy) that deplete over time
- **Resource Fields** — Spatial resource distribution (point/area/gradient sources)
- **Emotional Climate** — World remembers death, tracks collective grief/vitality/tension/harmony
- **Emergent Language** — Entities speak about needs, utterances crystallize into lexicon
- **Desert Demo** — 3 entities competing for limited water (all die, climate shifts)
- **27 new tests** for Phase 1 features (192 total, 100% pass)

**Philosophy:** "Emotional Climate ที่ Evolve เอง" — World remembers suffering and death, collective emotion emerges from individual experiences.

**Full history:** See [CHANGELOG.md](docs/CHANGELOG.md)

**Migration from v5.8:** Automatic. Zero breaking changes. All new APIs are additive.

---

**Last Updated:** 2025-10-30 | **Project Status:** Production Ready | **Bundle:** ~360 KB
