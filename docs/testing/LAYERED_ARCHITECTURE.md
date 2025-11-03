# Layered Test Architecture

**Version:** v6.0
**Author:** MDS Core Team
**Last Updated:** 2025-11-03

---

## Philosophy: "Minimal Core by Design"

Traditional software tests mix algorithm logic with system integration, making failures ambiguous:
- Is the algorithm broken?
- Is the integration broken?
- Is it a timing issue?
- Is it floating-point precision?

**MDS Solution:** Split tests into 2 layers that validate different concerns.

---

## The Problem: Non-Determinism in Integration Tests

### Symptoms

Test failures in CI that don't reproduce locally, especially in:
- Crystallization frequency thresholds
- Multilingual pattern detection
- Emotion-aware lexicon formation

### Root Causes

1. **Floating-point precision** — Different CPU architectures handle `0.1 + 0.2` differently
2. **Unseeded Math.random()** — Crystallization uses randomness for tie-breaking
3. **Climate state variations** — Emotional climate affects crystallization timing
4. **Timing differences** — Local vs CI environments have different execution speeds

### Why This Matters

MDS is an **ontology system** — memory, emotion, relationships, and climate are fundamental. You can't test linguistics properly without them. But you also can't debug a frequency threshold bug if emotion is interfering.

---

## Solution: Two-Layer Architecture

### Layer 1: Pure Algorithm Tests (ontology=false)

**Purpose:** Test ONLY the core algorithm logic in isolation

**Characteristics:**
- `ontology: false` — Disables memory, emotion, climate, relationships
- **Fast** — No emotional calculations, no climate updates
- **Deterministic** — Same input = same output, always
- **Unit-level** — Tests one thing at a time

**Example:**
```javascript
// Test 6A: Pure Crystallization Algorithm
const world = new World({
  features: { linguistics: true, ontology: false }
})

world.recordSpeech(entity, 'wow')
world.recordSpeech(entity, 'wow')
world.tick(1)

const popular = world.getPopularTerms(2)
assert(popular.length === 2, 'Filters by frequency threshold')
```

**What It Tests:**
- Frequency counting is correct
- `minUsage` threshold works
- UTF-8 handling is correct
- Lexicon storage is correct

**What It Doesn't Test:**
- Emotion influence on crystallization
- Climate affecting lexicon formation
- Memory-based term weighting
- Relationship context in speech

---

### Layer 2: Full Integration Tests (ontology=true)

**Purpose:** Test the complete MDS system as it's meant to be used

**Characteristics:**
- `ontology: true` — Full memory, emotion, climate, relationships
- **Realistic** — Tests real-world usage patterns
- **Complex** — Multiple systems interacting
- **Integration-level** — Validates emergent behavior

**Example:**
```javascript
// Test 6B: Emotion-Aware Crystallization
const world = new World({
  features: { linguistics: true, ontology: true }
})

entity.emotion = { pleasure: 0.9, arousal: 0.8 }

world.recordSpeech(entity, 'amazing')
world.recordSpeech(entity, 'amazing')
world.tick(1)

const popular = world.getPopularTerms(2)
const entry = popular.find(e => e.term === 'amazing')

assert(entry.emotionContext.valence > 0.5, 'Captures positive emotion')
```

**What It Tests:**
- Emotion context is captured in lexicon
- Climate influences crystallization
- Memory affects term weighting
- Full system coherence

**What It Doesn't Test:**
- Pure frequency algorithm (that's Layer 1's job)

---

## Current Implementation

### Test 6: World Stats API

**Before (Single Test):**
```javascript
// Test 6: World Stats API
const world = new World({ features: { linguistics: true }})
// Mixed algorithm + integration concerns
```

**After (Layered Tests):**
```javascript
// Test 6A: Pure Crystallization Algorithm (Layer 1)
const world = new World({
  features: { linguistics: true, ontology: false }
})
// Tests ONLY frequency threshold logic

// Test 6B: Emotion-Aware Crystallization (Layer 2)
const world = new World({
  features: { linguistics: true, ontology: true }
})
// Tests emotion context capture in full system
```

### Test 8: Multilingual Support

**Before (Single Test):**
```javascript
// Test 8: Multilingual Speech
const world = new World({ features: { linguistics: true }})
// Mixed UTF-8 handling + climate concerns
```

**After (Layered Tests):**
```javascript
// Test 8A: Multilingual Crystallization (Layer 1)
const world = new World({
  features: { linguistics: true, ontology: false }
})
// Tests ONLY UTF-8 pattern detection

// Test 8B: Multilingual with Climate (Layer 2)
const world = new World({
  features: { linguistics: true, ontology: true }
})
// Tests climate influence on multilingual terms
```

---

## Benefits

### For Developers

1. **Clear failure attribution** — If Test 6A fails, it's the algorithm. If Test 6B fails, it's integration.
2. **Faster debugging** — Layer 1 tests run in milliseconds, no waiting for climate to stabilize
3. **Confidence in refactoring** — Change emotion system? Layer 1 still passes.

### For CI/CD

1. **Reduced flakiness** — Layer 1 tests are deterministic
2. **Better diagnostics** — Know exactly which layer broke
3. **Parallel testing** — Layer 1 and Layer 2 can run in parallel

### For Users

1. **Trust** — Both algorithm AND integration are validated
2. **Documentation** — Tests show how to use MDS both ways
3. **Flexibility** — Can disable ontology for performance if needed

---

## Guidelines for Writing Layered Tests

### When to Add a Layer 1 Test

Add when testing:
- Pure frequency/counting logic
- UTF-8/encoding handling
- Threshold comparisons
- Data structure correctness

### When to Add a Layer 2 Test

Add when testing:
- Emotion influence
- Climate effects
- Memory-based weighting
- Relationship context
- Emergent behavior

### Naming Convention

```
Test XA: [Feature] (Layer 1: Algorithm-only)
Test XB: [Feature] (Layer 2: Integration)
```

### Comments Template

```javascript
// ============================================
// Test XA: [Feature] (Layer 1: Algorithm-only)
// ============================================
// Purpose: Test [specific algorithm] in isolation
// Expected: Fast, deterministic, tests ONLY [core logic]
```

---

## Test Results

**Current Status:** All 192 tests passing ✅

**Layer 1 Tests:**
- Test 6A: Crystallization frequency threshold
- Test 8A: Multilingual UTF-8 pattern detection

**Layer 2 Tests:**
- Test 6B: Emotion-aware crystallization
- Test 8B: Multilingual with emotional climate
- Test 10: Integration with entity emotion

---

## Future Work

### Potential Layer 1 Tests

- Transcript buffer circular FIFO logic
- Lexicon decay calculations
- Category detection patterns

### Potential Layer 2 Tests

- Multi-entity speech interactions
- Climate grief affecting lexicon tone
- Memory-based term prioritization

---

## FAQ

### Why not just disable ontology everywhere?

Because **MDS IS an ontology system**. Testing linguistics without ontology is like testing a car without wheels — it validates the engine works, but not that the car drives.

### Will this slow down tests?

No — Layer 1 tests are **faster** (no emotion/climate calculations). Layer 2 tests are the same speed as before, but now failures are clearer.

### Should I always write both layers?

Not always. If testing pure UI rendering or file I/O, one layer is fine. Only split when algorithm logic can be isolated from ontology concerns.

### What if Layer 1 passes but Layer 2 fails?

**Good news:** The algorithm is correct. The integration has a bug. Start debugging in the ontology systems (emotion, climate, memory).

### What if both layers fail?

**Start with Layer 1.** Fix the core algorithm first, then move to integration.

---

## Summary

**Layer 1:** Fast, deterministic, algorithm-only — validates core logic
**Layer 2:** Realistic, full-system — validates MDS as designed

**Together:** Complete test coverage with clear failure attribution

**Philosophy:** "Minimal core by design" — solve it properly once, never revisit.

---

**See Also:**
- [Test Suite Documentation](../guides/TESTING.md)
- [MDS Ontology Overview](../../src/2-ontology/llm.txt)
- [World Container Architecture](../../src/6-world/llm.txt)
