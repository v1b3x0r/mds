# MDS Core v6.0: Emergent Linguistics System

**Date:** 2025-10-25
**Theme:** World Crystallizes Language (Not AGI Learning)

---

## 🎯 Vision: Language Evolution Simulation

**Not:** AI that wants to learn everything (AGI)
**But:** World that hears, remembers, and crystallizes language naturally

### Conway's Game of Life Analogy
```
Cells = Entities speaking
Rules = Dialogue patterns
Emergence = New words crystallize from repeated use
```

### Real-World Analogy
```
Small village → People talk → Slang emerges → Becomes local dialect
Entity world → Entities talk → Terms emerge → Becomes world lexicon
```

---

## 🧬 Current State vs v6.0

### v5.9 (Current)
```typescript
// Entities can speak
entity.speak('greeting')  // → Random phrase from MDM

// World has no memory of what was said
world.tick()  // Entities talk, but world forgets

// No semantic layer
// No pattern detection
// No word crystallization
```

**Problem:** Conversations disappear into void. No accumulation of shared language.

### v6.0 (Proposed)
```typescript
// Entities speak → World listens
entity.speak('greeting')  // → "あ、hi..."

// World remembers conversation
world.transcript.add({ speaker: 'yuki', text: "あ、hi...", timestamp })

// World crystallizes patterns (every 50-100 ticks)
world.crystallizer.analyze()  // → Detects "あ、hi" used frequently

// World adds to lexicon
world.lexicon.add({
  term: "あ、hi",
  meaning: "Awkward greeting from shy person",
  origin: "yuki",
  usage: 15,
  firstSeen: timestamp
})

// Other entities learn word
somchai.hear("あ、hi")  // → Learns term if heard ≥ 3 times
```

**Result:** Language emerges naturally from interaction. No hardcoding needed.

---

## 🏗️ Architecture: 3-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Entity (Speaker)                                   │
│ - Speaks using MDM dialogue                                 │
│ - No knowledge of "what's a word"                           │
│ - Just talks naturally                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: World (Listener + Recorder)                        │
│ - Collects all utterances in transcript buffer             │
│ - No analysis yet, just logging                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Crystallizer (Pattern Detector)                    │
│ - Runs every N ticks                                        │
│ - Analyzes transcript for patterns                          │
│ - Extracts: new terms, repeated phrases, concept shifts    │
│ - Adds to world.lexicon                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Feedback Loop: Lexicon → Entities                           │
│ - Entities hear terms ≥ threshold → learn word             │
│ - Can use learned words in future speech                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### 1. Transcript Buffer (World Layer)

```typescript
// src/world/transcript.ts

export interface Utterance {
  id: string              // UUID
  speaker: string         // entity.id
  text: string            // "あ、hi..."
  listener?: string       // target entity (if direct message)
  timestamp: number       // Date.now()
  emotion: {
    valence: number
    arousal: number
  }
}

export class TranscriptBuffer {
  private utterances: Utterance[] = []
  private maxSize: number = 1000  // Keep last 1000 utterances

  add(utterance: Utterance): void {
    this.utterances.push(utterance)
    if (this.utterances.length > this.maxSize) {
      this.utterances.shift()  // Remove oldest
    }
  }

  getRecent(count: number): Utterance[] {
    return this.utterances.slice(-count)
  }

  getSince(timestamp: number): Utterance[] {
    return this.utterances.filter(u => u.timestamp > timestamp)
  }

  clear(): void {
    this.utterances = []
  }
}
```

---

### 2. Lexicon Registry (World Layer)

```typescript
// src/world/lexicon.ts

export interface LexiconEntry {
  term: string            // "あ、hi"
  meaning: string         // "Awkward greeting from shy person"
  origin: string          // entity.id who first used it
  category?: string       // "greeting" | "expression" | "concept"

  // Usage tracking
  usageCount: number      // How many times used
  lastUsed: number        // timestamp
  firstSeen: number       // timestamp

  // Semantic metadata
  relatedTerms: string[]  // ["hi", "hello", "こんにちは"]
  emotionContext?: {      // Typical emotion when used
    valence: number
    arousal: number
  }

  // Decay
  weight: number          // 0-1, decays if not used
  decayRate: number       // How fast it decays
}

export class WorldLexicon {
  private entries: Map<string, LexiconEntry> = new Map()

  add(entry: Omit<LexiconEntry, 'weight' | 'decayRate'>): void {
    const existing = this.entries.get(entry.term)

    if (existing) {
      // Term already exists → increase usage
      existing.usageCount++
      existing.lastUsed = Date.now()
      existing.weight = Math.min(1, existing.weight + 0.1)
    } else {
      // New term
      this.entries.set(entry.term, {
        ...entry,
        weight: 0.5,        // Start at medium weight
        decayRate: 0.01     // Decay 1% per tick if not used
      })
    }
  }

  get(term: string): LexiconEntry | undefined {
    return this.entries.get(term)
  }

  getAll(): LexiconEntry[] {
    return Array.from(this.entries.values())
  }

  getPopular(threshold: number = 5): LexiconEntry[] {
    return this.getAll().filter(e => e.usageCount >= threshold)
  }

  decay(deltaMs: number): void {
    for (const entry of this.entries.values()) {
      const timeSinceUse = Date.now() - entry.lastUsed
      if (timeSinceUse > 10000) {  // 10 seconds
        entry.weight *= (1 - entry.decayRate)
        if (entry.weight < 0.01) {
          this.entries.delete(entry.term)  // Forget term
        }
      }
    }
  }
}
```

---

### 3. Crystallizer (Analysis Layer)

```typescript
// src/world/crystallizer.ts

export interface CrystallizerConfig {
  enabled: boolean
  analyzeEvery: number      // Ticks between analysis (50-100)
  minUsage: number          // Minimum times term must appear (3)
  llm?: {
    provider: string
    apiKey: string
    model: string
  }
}

export class LinguisticCrystallizer {
  private config: CrystallizerConfig
  private lastAnalysis: number = 0
  private tickCount: number = 0

  constructor(config: CrystallizerConfig) {
    this.config = config
  }

  /**
   * Called every world tick
   */
  tick(transcript: TranscriptBuffer, lexicon: WorldLexicon): void {
    if (!this.config.enabled) return

    this.tickCount++

    // Run analysis every N ticks
    if (this.tickCount % this.config.analyzeEvery === 0) {
      this.analyze(transcript, lexicon)
    }

    // Decay unused terms
    lexicon.decay(1000)  // Assume 1 tick = 1 second
  }

  /**
   * Analyze transcript and extract patterns
   */
  private async analyze(
    transcript: TranscriptBuffer,
    lexicon: WorldLexicon
  ): Promise<void> {
    const recent = transcript.getSince(this.lastAnalysis)
    this.lastAnalysis = Date.now()

    if (recent.length === 0) return

    // 1. Local pattern detection (no LLM)
    const patterns = this.detectLocalPatterns(recent)

    // 2. LLM-based semantic extraction (optional)
    if (this.config.llm) {
      const semanticTerms = await this.extractSemanticTerms(recent)
      patterns.push(...semanticTerms)
    }

    // 3. Add to lexicon
    for (const pattern of patterns) {
      lexicon.add(pattern)
    }
  }

  /**
   * Detect patterns without LLM (frequency-based)
   */
  private detectLocalPatterns(utterances: Utterance[]): Omit<LexiconEntry, 'weight' | 'decayRate'>[] {
    const phrases: Map<string, { count: number, speakers: Set<string>, emotion: any }> = new Map()

    // Count phrase frequencies
    for (const utt of utterances) {
      const normalized = utt.text.trim().toLowerCase()

      if (!phrases.has(normalized)) {
        phrases.set(normalized, {
          count: 0,
          speakers: new Set(),
          emotion: { valence: 0, arousal: 0 }
        })
      }

      const entry = phrases.get(normalized)!
      entry.count++
      entry.speakers.add(utt.speaker)
      entry.emotion.valence += utt.emotion.valence
      entry.emotion.arousal += utt.emotion.arousal
    }

    // Extract patterns used ≥ threshold times
    const results: Omit<LexiconEntry, 'weight' | 'decayRate'>[] = []

    for (const [phrase, data] of phrases.entries()) {
      if (data.count >= this.config.minUsage) {
        results.push({
          term: phrase,
          meaning: `Phrase used ${data.count} times by ${data.speakers.size} entities`,
          origin: Array.from(data.speakers)[0],
          category: 'expression',
          usageCount: data.count,
          lastUsed: Date.now(),
          firstSeen: Date.now(),
          relatedTerms: [],
          emotionContext: {
            valence: data.emotion.valence / data.count,
            arousal: data.emotion.arousal / data.count
          }
        })
      }
    }

    return results
  }

  /**
   * Extract semantic terms using LLM
   */
  private async extractSemanticTerms(
    utterances: Utterance[]
  ): Promise<Omit<LexiconEntry, 'weight' | 'decayRate'>[]> {
    if (!this.config.llm) return []

    // Build prompt
    const transcript = utterances
      .map(u => `${u.speaker}: ${u.text}`)
      .join('\n')

    const prompt = `
Analyze this conversation transcript and identify:
1. New terms or phrases that emerged
2. Words used frequently
3. Concepts that became shared vocabulary

Transcript:
${transcript}

Return JSON array of terms:
[
  {
    "term": "あ、hi",
    "meaning": "Awkward greeting from shy person",
    "category": "greeting",
    "relatedTerms": ["hi", "hello"]
  }
]
    `.trim()

    try {
      // Call LLM API (OpenRouter, Anthropic, etc.)
      const response = await this.callLLM(prompt)
      const terms = JSON.parse(response)

      return terms.map((t: any) => ({
        term: t.term,
        meaning: t.meaning,
        origin: utterances[0]?.speaker || 'unknown',
        category: t.category || 'expression',
        usageCount: 1,
        lastUsed: Date.now(),
        firstSeen: Date.now(),
        relatedTerms: t.relatedTerms || [],
        emotionContext: undefined
      }))
    } catch (error) {
      console.error('LLM extraction failed:', error)
      return []
    }
  }

  private async callLLM(prompt: string): Promise<string> {
    // TODO: Implement LLM call (OpenRouter, Anthropic, etc.)
    // For now, return empty
    return '[]'
  }
}
```

---

## 🔌 Integration with World

```typescript
// src/world/world.ts

import { TranscriptBuffer } from './transcript'
import { WorldLexicon } from './lexicon'
import { LinguisticCrystallizer } from './crystallizer'

export class World {
  // ... existing fields

  // v6.0: Linguistics system
  transcript: TranscriptBuffer
  lexicon: WorldLexicon
  crystallizer?: LinguisticCrystallizer

  constructor(config: WorldConfig) {
    // ... existing initialization

    // Initialize linguistics system
    this.transcript = new TranscriptBuffer()
    this.lexicon = new WorldLexicon()

    if (config.linguistics?.enabled) {
      this.crystallizer = new LinguisticCrystallizer(config.linguistics)
    }
  }

  tick(deltaMs: number) {
    // ... existing world physics

    // v6.0: Run crystallizer
    if (this.crystallizer) {
      this.crystallizer.tick(this.transcript, this.lexicon)
    }
  }

  /**
   * v6.0: Record entity speech to transcript
   */
  recordSpeech(speaker: Entity, text: string, listener?: Entity): void {
    this.transcript.add({
      id: crypto.randomUUID(),
      speaker: speaker.id,
      text,
      listener: listener?.id,
      timestamp: Date.now(),
      emotion: {
        valence: speaker.emotion.valence,
        arousal: speaker.emotion.arousal
      }
    })
  }
}
```

---

## 🔊 Entity Learning (Feedback Loop)

```typescript
// src/core/entity.ts

export class Entity {
  // ... existing fields

  // v6.0: Learned vocabulary
  private learnedTerms: Map<string, number> = new Map()  // term → heard count

  /**
   * v6.0: Entity hears term from world
   */
  hear(term: string): void {
    const count = this.learnedTerms.get(term) || 0
    this.learnedTerms.set(term, count + 1)

    // If heard ≥ 3 times, consider "learned"
    if (count + 1 >= 3) {
      console.log(`${this.m.material} learned: "${term}"`)
    }
  }

  /**
   * v6.0: Check if entity knows term
   */
  knows(term: string): boolean {
    return (this.learnedTerms.get(term) || 0) >= 3
  }

  /**
   * v6.0: Speak with learned terms (future enhancement)
   */
  speakWithLexicon(category: string): string | undefined {
    const phrase = this.speak(category)
    if (!phrase) return undefined

    // TODO: Replace words with learned terms
    // For now, just return original phrase
    return phrase
  }
}
```

---

## 🎮 Usage Example

```typescript
// Application code (hi-introvert, etc.)

const world = new World({
  linguistics: {
    enabled: true,
    analyzeEvery: 50,    // Analyze every 50 ticks
    minUsage: 3,         // Term must appear 3 times
    llm: {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_KEY,
      model: 'anthropic/claude-3.5-sonnet'
    }
  }
})

// Entities talk
const yuki = world.spawn(yukiMaterial, 100, 100)
const somchai = world.spawn(somchaiMaterial, 200, 100)

// Record conversations
const yukiSays = yuki.speak('greeting')
world.recordSpeech(yuki, yukiSays)  // "あ、hi..."

const somchaiSays = somchai.speak('greeting')
world.recordSpeech(somchai, somchaiSays)  // "sup lol"

// After 50 ticks...
world.tick(1000)  // Crystallizer analyzes

// Check lexicon
const popular = world.lexicon.getPopular()
console.log(popular)
// [{ term: "sup lol", usageCount: 5, meaning: "...", ... }]

// Entity learns
somchai.hear("あ、hi")
somchai.hear("あ、hi")
somchai.hear("あ、hi")
console.log(somchai.knows("あ、hi"))  // true
```

---

## 📈 Visualization (Future)

**Concept Drift Graph:**
```
Time →
  ┌─────────────────────────────────────┐
  │ Term: "sup lol"                      │
  │                                      │
  │ Usage ▲                             │
  │       │     ●●●●                    │
  │       │   ●●    ●●                  │
  │       │ ●●        ●●                │
  │       └───────────────→              │
  │       0   10   20   30  (ticks)     │
  │                                      │
  │ Meaning: "casual greeting" →        │
  │          "ironic dismissal"         │
  └─────────────────────────────────────┘
```

**Lexicon Network:**
```
    "hi" ──┬── "hello"
           │
           ├── "あ、hi" (awkward)
           │
           └── "sup" ──── "sup lol"
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation (v6.0-alpha)
- [ ] Add `TranscriptBuffer` class
- [ ] Add `WorldLexicon` class
- [ ] Add `World.recordSpeech()` method
- [ ] Add `World.transcript` and `World.lexicon` fields
- [ ] Update `World.tick()` to support linguistics

### Phase 2: Pattern Detection (v6.0-beta)
- [ ] Add `LinguisticCrystallizer` class
- [ ] Implement local pattern detection (frequency-based)
- [ ] Add `WorldConfig.linguistics` option
- [ ] Test with hi-introvert (no LLM)

### Phase 3: LLM Integration (v6.0-rc)
- [ ] Add LLM-based semantic extraction
- [ ] Design prompt schema
- [ ] Test with OpenRouter/Anthropic
- [ ] Add error handling

### Phase 4: Entity Learning (v6.0)
- [ ] Add `Entity.hear()` method
- [ ] Add `Entity.knows()` method
- [ ] Add `Entity.learnedTerms` tracking
- [ ] Test feedback loop

### Phase 5: Advanced Features (v6.1+)
- [ ] Concept drift tracking
- [ ] Lexicon network visualization
- [ ] Export lexicon as JSON
- [ ] Replay mode with lexicon evolution

---

## 🎯 Success Criteria

**v6.0 is successful if:**
1. ✅ World can record all entity speech
2. ✅ Crystallizer detects repeated phrases (≥3 uses)
3. ✅ Lexicon stores terms with metadata
4. ✅ Terms decay if not used
5. ✅ Entities can learn terms by hearing them
6. ✅ System works **without LLM** (local pattern detection)
7. ✅ LLM enhancement is **optional** (plug-in style)

---

## 🚧 Non-Goals

**v6.0 will NOT:**
- ❌ Make entities "ask questions" (that's AGI curiosity)
- ❌ Make entities "want to learn" (that's AGI motivation)
- ❌ Generate new dialogue dynamically (that's v7.0+)
- ❌ Replace MDM dialogue system (lexicon is **additive**)

**Focus:** World hears → World remembers → World crystallizes → Entities learn

---

## 📚 References

**Inspiration:**
- Conway's Game of Life (emergent patterns)
- Language evolution in isolated communities
- Meme propagation dynamics
- Semantic drift in online communities

**Technical:**
- MDS Core v5.9 (current)
- Entity.speak() API
- World.tick() architecture
- LLM prompt engineering

---

**Last Updated:** 2025-10-25
**Status:** Blueprint ready for implementation
**Next Step:** Phase 1 (Foundation) - Add transcript + lexicon data structures
