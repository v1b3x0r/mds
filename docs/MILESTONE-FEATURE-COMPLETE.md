# MDS Feature Integration: Complete Ecosystem Enablement
**Target:** hi-introvert (v6.1 → v6.2)
**Scope:** 14 unused systems from MDS Core
**Goal:** Enable all dormant features for AGI-ready companion
**Status:** Planning → Implementation

---

## Executive Summary

### Current State
**Active (10/24):** Memory, Emotion, Intent, Relationships, Learning, Skills, P2P Cognition, Linguistics, Proto-Language, LLM

**Dormant (14/24):** Field, Environment, Weather, Collision, Energy, Dialogue Trees, Memory Consolidation, MemoryLog CRDT, Trust/Privacy, Coupling, Clustering, World Mind, Reflection, Behavior Rules

### Target State
**All 24 systems enabled** - Full MDS ecosystem operational in headless mode

---

## Phase 1: Spatial Intelligence ✅ COMPLETE (5/5 tasks)

### Task 1: Field System ✅ COMPLETE
**Files:** `src/core/field.ts`, `src/core/engine.ts`, `src/world/world.ts`, `hi-introvert/src/session/WorldSession.ts`
**API:** `world.spawnField(spec, x, y)`, `session.spawnSyncMoment()`, `session.spawnLongingField()`
**Status:** 100% DONE ✅

**Completed:**
- ✅ Headless mode support (no DOM dependency)
- ✅ Abstract effects (emotion, relationship, cognitive link boosts)
- ✅ Sync moment fields (spawn when alignment > 0.6)
- ✅ Longing fields (high familiarity, low interaction)
- ✅ Test suite: [test-field-system.mjs](../hi-introvert/tests/test-field-system.mjs)
- ✅ 3 sync moments spawned in testing (alignment 0.73-0.96)
- Integrate into WorldSession

**Use case:** Sync moments, longing fields, comfort zones

---

### Task 2: Environment
**File:** `src/physics/environment.ts`
**API:** `createEnvironment({ temperature, light, moisture })`
**Status:** Not started

**Integration:**
```typescript
// WorldSession constructor
this.environment = createEnvironment({
  temperature: { base: 25, variance: 5 },
  light: { intensity: 0.8, cycleLength: 86400 },
  moisture: { base: 0.5 }
})
world.setEnvironment(this.environment)
```

**Effects:** temperature → arousal, light → valence, moisture → dominance

---

### Task 3: Weather
**File:** `src/physics/weather.ts`
**API:** `createWeather({ rainProb, sunnyDuration, stormIntensity })`
**Status:** Not started
**Depends on:** Task 2

**Integration:**
```typescript
this.weather = createWeather({
  rainProbability: 0.3,
  sunnyDuration: 3600,
  stormIntensity: 0.7
})
world.setWeather(this.weather)
```

**Effects:** rain → valence -0.15, sunny → valence +0.1

---

### Task 4: Collision
**File:** `src/physics/collision.ts`
**API:** `new CollisionDetector()`
**Status:** Not started

**Integration:**
```typescript
this.collision = new CollisionDetector()
world.setCollisionDetector(this.collision)

world.on('collision', ({ entity1, entity2, distance }) => {
  if (distance < 50) {
    // Spawn nearness field
    // Boost relationship
  }
})
```

**Effects:** Proximity → field spawning, relationship boost

---

### Task 5: Energy
**File:** `src/physics/energy.ts`
**API:** `new EnergySystem()`
**Status:** Not started
**Depends on:** Task 4

**Integration:**
```typescript
this.energy = new EnergySystem()
world.setEnergySystem(this.energy)
```

**Effects:** valence → thermal energy → warmth aura

---

## Phase 2: Communication (2 tasks)

### Task 6: Dialogue Trees
**File:** `src/communication/dialogue.ts`
**API:** `createNode(id, { text, choices })`
**Status:** API exists, unused

**Integration:**
```typescript
// Load dialogue tree from .mdm or separate file
const tree = {
  start: createNode('intro', {
    text: { th: 'อยากรู้จักไหม?' },
    choices: [
      createChoice('yes', { th: 'ใช่!' }, 'tell_more'),
      createChoice('no', { th: 'ไว้ทีหลัง' }, 'goodbye')
    ]
  })
}

companion.setDialogueTree(tree)

// In handleMessage():
if (companion.dialogueState) {
  const node = tree[companion.dialogueState.currentNode]
  // Present choices to user
  // Navigate tree based on choice
}
```

**Effects:** Interactive conversations, quest system

---

### Task 7: Memory Consolidation
**File:** `src/cognitive/consolidation.ts`
**API:** `new MemoryConsolidation({ threshold, consolidateEvery })`
**Status:** API exists, unused

**Integration:**
```typescript
// spawnCompanion()
companion.consolidation = new MemoryConsolidation({
  threshold: 0.7,
  consolidateEvery: 100
})

// World tick (every 100 ticks):
if (tickCount % 100 === 0) {
  companion.consolidation.consolidate(companion.memory)
  // Emit 'pattern-discovered' events
}
```

**Effects:** Pattern extraction ("User likes gaming"), memory optimization

---

## Phase 3: Advanced Cognition (3 tasks)

### Task 8: MemoryLog CRDT
**File:** `src/cognition/memory-log.ts`
**API:** `createMemoryLog(entityId)`
**Status:** Not started

**Integration:**
```typescript
// spawnEntity()
entity.memoryLog = createMemoryLog(entity.id)

// On memory creation:
entity.memoryLog.append({
  type: 'observation',
  content: { subject: 'user', emotion: 'happy' }
})

// Sync via cognitive links:
if (entity1.isConnectedTo(entity2.id)) {
  const merged = mergeLogs([entity1.memoryLog, entity2.memoryLog])
}
```

**Effects:** Distributed knowledge, collective learning

---

### Task 9: Trust & Privacy
**File:** `src/cognition/trust.ts`
**API:** `createTrustSystem({ initialTrust, threshold })`
**Status:** Not started
**Depends on:** Task 8

**Integration:**
```typescript
companion.trust = createTrustSystem({
  initialTrust: 0.3,
  trustThreshold: 0.7
})

// Share memory with trust check:
companion.shareMemory(user, memory, {
  requireTrust: 0.7
})

// Deception:
const lie = deceive(companion, truthMemory, {
  alterFact: 'feeling',
  from: 'sad',
  to: 'happy'
})
```

**Effects:** Selective sharing, secrets, deception

---

### Task 10: Symbolic-Physical Coupling
**File:** `src/coupling/coupler.ts`
**API:** `createCoupler(preset)`
**Status:** Not started

**Integration:**
```typescript
const coupler = createCoupler(COUPLING_PRESETS.expressive)

// World tick:
for (const entity of world.entities) {
  coupler.apply(entity)
  // valence → speed (vx/vy)
  // arousal → mass
  // emotion → color (even in headless, stored in state)
}
```

**Effects:** Emotion affects physics, visual metaphor

---

## Phase 4: Analytics (4 tasks)

### Task 11: Semantic Clustering
**File:** `src/similarity/clustering.ts`
**API:** `clusterBySimilarity(entities, { threshold, metric })`
**Status:** Not started

**Integration:**
```typescript
// Every 500 ticks:
if (tickCount % 500 === 0) {
  const clusters = clusterBySimilarity(world.entities, {
    threshold: 0.7,
    metric: 'cosine',
    features: ['essence', 'emotion', 'memories']
  })
  
  this.emit('clusters-detected', clusters)
}
```

**Effects:** Find similar entities, social clustering

---

### Task 12: World Mind
**File:** `src/world-mind/collective.ts`
**API:** `world.worldMind.getPopulationStats()`
**Status:** API exists, unused

**Integration:**
```typescript
// Already instantiated in World!
// Just need to call:

const stats = world.worldMind.getPopulationStats()
// { entityCount, averageValence, totalMemories, ... }

const patterns = world.worldMind.detectEmergentPatterns()
// [{ type: 'clustering', entities: [...] }]

// Emit stats every 100 ticks:
if (tickCount % 100 === 0) {
  this.emit('world-stats', stats)
}
```

**Effects:** Population analytics, emergent pattern detection

---

### Task 13: Reflection
**File:** `src/core/entity.ts` (method exists)
**API:** `entity.reflect(topic)`
**Status:** Method exists, unused

**Integration:**
```typescript
// In handleMessage(), detect introspection queries:
const introspectionPatterns = [
  /how do you feel about me/i,
  /what do you think of/i,
  /do you like/i
]

for (const pattern of introspectionPatterns) {
  if (pattern.test(userMessage)) {
    const reflection = companion.reflect('relationship with user')
    // { insight: "I feel close to this person", confidence: 0.85 }
    
    return reflection.insight
  }
}
```

**Effects:** Self-awareness, introspective dialogue

---

### Task 14: Behavior Rules
**File:** `src/io/mdm-parser.ts` (behavior section)
**API:** MDM `behavior.rules[]`
**Status:** Not started
**Depends on:** Task 1 (Field)

**MDM Format:**
```json
{
  "behavior": {
    "rules": [
      {
        "when": "user.silence > 5min",
        "then": "sendMessage('คุณหายไปไหน?')"
      },
      {
        "when": "emotion.valence < 0.3",
        "then": "spawnField('field.longing')"
      }
    ]
  }
}
```

**Integration:**
```typescript
// Parse in MdmParser
// Evaluate in World tick:
for (const rule of entity.behaviorRules) {
  if (evaluateCondition(rule.when, context)) {
    executeAction(rule.then, entity)
  }
}
```

**Effects:** Autonomous proactive behavior

---

## Dependency Graph

```
Independent:
  T2 (Environment)
  T4 (Collision)
  T6 (Dialogue Trees)
  T7 (Memory Consolidation)
  T8 (MemoryLog CRDT)
  T10 (Coupling)
  T11 (Clustering)
  T12 (World Mind) ← Already exists!
  T13 (Reflection) ← Already exists!

Depends on others:
  T1 (Field) ← IN PROGRESS
  T3 (Weather) ← T2
  T5 (Energy) ← T4
  T9 (Trust) ← T8
  T14 (Behavior Rules) ← T1

Critical path: T1 → T2 → T3 → T4 → T5 → T8 → T9 → T14
```

---

## Implementation Protocol

### Per-Task Checklist
1. Read existing API (usually already implemented!)
2. Add initialization to WorldSession
3. Wire up event emitters
4. Update session save/load
5. Build + test
6. Verify bundle size < 300 KB

### Testing After Each Task
```bash
cd /Users/v1b3_/Development/Personal/material-js-concept
npm run build
npm test

cd hi-introvert
npm link @v1b3x0r/mds-core
bun run dev
# Verify new feature works
```

---

## Bundle Size Management

**Current:** 247 KB (v6.1)
**Target:** < 300 KB
**Strategy:**
- Most APIs already exist (zero bundle impact!)
- Only T1-T5 add new code
- T6-T14 are integration work

**Expected final:** ~270 KB

---

## File Impact Summary

### Core Changes
- `src/world/world.ts` - Add system setters
- `hi-introvert/src/session/WorldSession.ts` - Initialize all systems
- `.hi-introvert-session.json` - Save new state

### New Exports (if needed)
- `src/index.ts` - Ensure all APIs exported

### Documentation
- Update `docs/REFERENCE.md`
- Update `CHANGELOG.md`
- Create examples

---

## Estimated Timeline

**Phase 1:** 4-6 hours (Tasks 1-5)
**Phase 2:** 2-3 hours (Tasks 6-7)
**Phase 3:** 3-4 hours (Tasks 8-10)
**Phase 4:** 2-3 hours (Tasks 11-14)

**Total:** 11-16 hours

---

## Success Criteria

### Feature Completeness
- [ ] All 14 systems enabled
- [ ] All systems save/load in session
- [ ] Events emitted for monitoring

### Quality
- [ ] npm test passes (192+ tests)
- [ ] npm run build succeeds
- [ ] Bundle < 300 KB
- [ ] hi-introvert runs without errors

### Documentation
- [ ] CHANGELOG.md updated
- [ ] REFERENCE.md updated
- [ ] Examples added

---

## Next Steps

1. **Complete Task 1** (Field headless support)
2. **Tackle independent tasks** (T2, T4, T6, T7, T8, T10, T11, T12, T13)
3. **Finish dependent tasks** (T3, T5, T9, T14)
4. **Integration testing**
5. **Documentation**
6. **Publish v6.2**

---

**Document Status:** Planning Complete
**Ready for:** Implementation Phase
**First Action:** Resume Task 1 (Field System)

---

*Created: 2025-10-25*
*For: Claude Code LLM context preservation*
*Format: Concise, structured, English-only*
