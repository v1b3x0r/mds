# System Mapping: Ontology Checklist → MDS API

**Purpose:** Maps ontology checklist requirements to actual MDS v5.3+ implementation.

**Legend:**
- ✅ **Fully implemented** — Feature exists with exact or equivalent API
- ⚠️ **Implemented (different naming)** — Feature exists but uses different method/property name
- 🔄 **Planned for v5.4.0** — Currently being added
- ❌ **Future work** — Not yet implemented, planned for later versions

---

## 🌍 CORE ENGINE

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| `world.create()` → supports seeded deterministic mode | ✅ | `new World({ seed: 12345 })` | Constructor supports seed parameter |
| `world.update()` → periodic tick / delta-time loop | ✅ | `world.tick(deltaTime)` | Three-phase tick (Physical → Mental → Relational) |
| `world.entities[]` → dynamic registry | ✅ | `world.entities` (getter) | Returns array of all entities |
| `world.events[]` → broadcast + listen + relay | 🔄 | `world.events` (v5.4) | Was `world.eventLog`, adding broadcast/listen in v5.4 |
| `world.mind.sync()` → collective field | ⚠️ | `world.collectiveIntelligence.tick()` | Phase 8 World Mind system |

**Coverage:** 4.5/5 (90%)

---

## 🧬 ENTITY

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| `entity.spawn(material)` → instantiates from MDM | ✅ | `world.spawn(material, x, y)` | World-level spawn method |
| `entity.update(delta)` → per-frame cognition + decay | ✅ | `entity.tick(deltaTime)` | Called automatically by world.tick() |
| `entity.enable('memory', 'emotion', ...)` | ✅ | `entity.enable('memory', 'learning', 'relationships', 'skills')` | v5.3 unified API |
| `entity.remember(), recall(), forget()` | ✅ | `entity.remember(event)`, `entity.recall(query)`, `entity.forget(id)` | Phase 1 Memory system |
| `entity.crystallize()` | ✅ | `entity.crystallizeMemories()` | Phase 2.2 Memory Crystallization |
| `entity.consolidate()` | ✅ | `entity.consolidateMemory()` | Phase 7 Learning integration |
| `entity.reflect()` | 🔄 | `entity.reflect(stimulus?)` (v5.4) | Adding in v5.4 for reasoning loop |
| `entity.dialogue()` | ⚠️ | `entity.speak(category, lang?)` | Returns dialogue phrase from material spec |
| `entity.bind(world) / unbind()` lifecycle | ⚠️ | `world.spawn()` / `world.destroy(entity)` | Different naming, same concept |

**Coverage:** 7.5/9 (83%)

---

## 🧠 MEMORY SYSTEM

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| short_term: retention + decay | ✅ | `MemoryBuffer` with Ebbinghaus decay | Phase 1 |
| long_term: persistent events | ✅ | `Memory[]` with importance weighting | Phase 1 |
| emotional_trace: trust/fear/curiosity weighting | ✅ | `Memory.emotion` field | Memories tagged with emotional state |
| `crystallize()`: merge memory fragments → static pattern | ✅ | `entity.crystallizeMemories()` | Phase 2.2 (occasional/repeated/frequent tiers) |
| `consolidate()`: transform crystals → conceptual network | ✅ | `entity.consolidateMemory()` | Phase 7 Learning |

**Coverage:** 5/5 (100%) ✅

---

## 💓 EMOTION SYSTEM

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| base_state: neutral/curious/etc. | ✅ | `EmotionalState` (PAD model) | Pleasure-Arousal-Dominance |
| transitions[]: event-driven emotion map | ✅ | `material.emotion.transitions` | Defined in material spec |
| expression: manifest effect (visual/behavioral) | ✅ | Phase 2.3 Symbolic-Physical Coupling | Emotion → physics mapping |
| emotional_influence on cognition loop | ✅ | Emotion affects learning rate + intent confidence | Phase 7 + Phase 2.4 |

**Coverage:** 4/4 (100%) ✅

---

## 🎓 COGNITION

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| reasoning_pattern: stimulus → reflection → action | 🔄 | `entity.reflect(stimulus)` (v5.4) | Adding explicit reflection step |
| learning_rate scaling | ✅ | `LearningSystem` Q-learning with decay | Phase 7 |
| skills: learnable triggers + growth | ✅ | `SkillSystem` proficiency tracking | Phase 7 |
| concept formation from consolidation | ✅ | `consolidateMemory()` pattern detection | Phase 7 |

**Coverage:** 3.5/4 (88%)

---

## 💬 DIALOGUE / LANGUAGE

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| proto-lang: local text rules (no LLM) | ✅ | Dialogue trees with `lang` objects | Multi-language support |
| LLM bridge (optional): external model_hint | ✅ | `LanguageGenerator` (OpenRouter/Anthropic/OpenAI) | Phase 6 |
| emotion-tagged dialogue (tone-aware) | 🔄 | Emotion tone modulation (v5.4) | Adding PAD → tone mapping |
| event-dialogue triggers (onBind/onDesync/onConflict) | ✅ | `material.dialogue` with event contexts | Material spec support |

**Coverage:** 3.5/4 (88%)

---

## 🤝 RELATIONSHIPS

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| dynamic trust/fear/curiosity graph | ✅ | `Relationship` tracking (valence, strength, history) | Phase 1 |
| resonance_field updates per interaction | ⚠️ | `Relationship.strength` + interaction history | "Resonance" = relationship strength |
| conflict loop behavior (avoid/seek pattern) | ✅ | Relationship valence affects entity behavior | Negative valence → avoidance |

**Coverage:** 2.5/3 (83%)

---

## 🌐 WORLD MIND (COLLECTIVE)

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| collective_role: observer/broadcaster | ✅ | `CollectiveIntelligence` | Phase 8 |
| network_field propagation (interval sync) | ✅ | Stats aggregation every tick | Population-level tracking |
| pattern_detection: thresholded behavioral-field | ✅ | `PatternDetection` (dominant emotions/behaviors) | Phase 8 |

**Coverage:** 3/3 (100%) ✅

---

## ⚛️ PHYSICS / MANIFESTATION

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| physics: mass/friction/bounce | ✅ | `material.physics` (mass, friction, bounce) | Phase 5 Environmental Physics |
| manifestation: emoji/visual/aging/decay | ✅ | `material.manifestation` (emoji, visual, aging) | Built-in aging system |
| behavior: onHover/onBind/onDesync reactive rules | ✅ | `material.behavior` (onHover, onProximity, onBind, etc.) | Event-driven behavior rules |

**Coverage:** 3/3 (100%) ✅

---

## 💾 SERIALIZATION

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| snapshot / restore world + entities | ✅ | `world.snapshot()` / `world.restore(data)` | Phase 4 WorldFile |
| persist memory/emotion state | ✅ | Full ontology state serialization | Includes all entity features |
| export .world.mdm / import same state | ⚠️ | JSON snapshot (not standardized `.world.mdm`) | Format exists, needs standardization |

**Coverage:** 2.5/3 (83%)

---

## 🌙 FUTURE (phase "ลืม")

| Checklist | Status | MDS API | Notes |
|-----------|--------|---------|-------|
| decay curve tuning (memory half-life) | ✅ | Ebbinghaus decay curve | Phase 1 |
| `forget()` → removes unreinforced links | ✅ | Phase 2.5 Relationship Decay | Time-based forgetting |
| re-learn loop → pattern re-activation from forgotten traces | ⚠️ | Learning exists, not re-learn from forgotten | Future work |
| `dream()` → unsupervised consolidation while idle | ❌ | Not yet implemented | Future: Idle consolidation mode |

**Coverage:** 2.5/4 (63%)

---

## 📊 OVERALL COVERAGE

| Category | Score | Percentage |
|----------|-------|------------|
| **CORE ENGINE** | 4.5/5 | 90% |
| **ENTITY** | 7.5/9 | 83% |
| **MEMORY SYSTEM** | 5/5 | **100%** ✅ |
| **EMOTION SYSTEM** | 4/4 | **100%** ✅ |
| **COGNITION** | 3.5/4 | 88% |
| **DIALOGUE / LANGUAGE** | 3.5/4 | 88% |
| **RELATIONSHIPS** | 2.5/3 | 83% |
| **WORLD MIND** | 3/3 | **100%** ✅ |
| **PHYSICS / MANIFESTATION** | 3/3 | **100%** ✅ |
| **SERIALIZATION** | 2.5/3 | 83% |
| **FUTURE ("ลืม")** | 2.5/4 | 63% |
| **TOTAL** | **41.5/47** | **88.3%** |

**After v5.4.0:** Expected **44.5/47** (**94.7%**)

---

## 🔄 v5.4.0 Additions

The following gaps are being filled in v5.4.0:

### 1. World Event System
```javascript
// Access event log (clearer naming)
world.events  // Alias for world.eventLog

// Broadcast event to all entities
world.broadcastEvent('sunrise', { intensity: 0.8 })

// Listen for specific events
const sunEvents = world.listenForEvents(e => e.type.includes('sun'))
```

### 2. Entity Reflection
```javascript
// Trigger reasoning pattern: Stimulus → Reflection → Action
const reflection = entity.reflect('I see a stranger')
console.log(reflection.thought)
// → "I remember strangers can be dangerous... I see a stranger"
```

### 3. Emotion-Aware Dialogue
```javascript
// Dialogue generation now considers entity emotion
entity.emotion.pleasure = -0.8  // Very unhappy
const response = await entity.generateDialogue('greeting')
// → Tone will be cold, distant (PAD model → LLM prompt modulation)
```

---

## 🎯 Usage Tips

### For Users:
1. **Check this doc first** before assuming a feature is missing
2. **Look for "different naming"** (⚠️) — feature exists, just different API
3. **v5.4 features** (🔄) — available in current release

### For Developers:
1. **Maintain this mapping** when adding new features
2. **Update coverage %** after each release
3. **Mark deprecated APIs** with timeline for removal

---

## 📚 Related Documentation

- [REFERENCE.md](REFERENCE.md) — Complete API reference
- [CHANGELOG.md](meta/CHANGELOG.md) — Version history
- [CLAUDE.md](../CLAUDE.md) — AI context (ontology explanation)

---

**Last Updated:** 2025-10-24 (v5.4.0)
**Maintainer:** @v1b3x0r
