/**
 * MDS v6.0 - Linguistics System Tests
 * Tests for TranscriptBuffer, WorldLexicon, LinguisticCrystallizer
 */

import { TranscriptBuffer, WorldLexicon, LinguisticCrystallizer } from '../dist/mds-core.esm.js'

console.log('\n🗣️  MDS v6.0 - Linguistics System Tests\n')

let passed = 0
let failed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ ${testName}`)
    passed++
  } else {
    console.log(`✗ ${testName}`)
    failed++
  }
}

// ============================================
// Test 1: TranscriptBuffer - Basic Operations
// ============================================

const transcript = new TranscriptBuffer(5)  // Small buffer for testing

transcript.add({
  id: '1',
  speaker: 'yuki',
  text: 'hello world',
  timestamp: Date.now(),
  emotion: { valence: 0.5, arousal: 0.5 }
})

transcript.add({
  id: '2',
  speaker: 'ghost',
  text: 'hi there',
  timestamp: Date.now(),
  emotion: { valence: 0.3, arousal: 0.6 }
})

const all = transcript.getRecent(10)
assert(all.length === 2, 'TranscriptBuffer: stores utterances')
assert(all[0].speaker === 'yuki', 'TranscriptBuffer: correct speaker')
assert(all[0].text === 'hello world', 'TranscriptBuffer: correct text')

// ============================================
// Test 2: TranscriptBuffer - Circular Buffer
// ============================================

// Add 6 utterances to buffer with maxSize=5
for (let i = 3; i <= 8; i++) {
  transcript.add({
    id: String(i),
    speaker: 'entity' + i,
    text: 'message ' + i,
    timestamp: Date.now(),
    emotion: { valence: 0, arousal: 0.5 }
  })
}

const recent = transcript.getRecent(10)
assert(recent.length === 5, 'TranscriptBuffer: circular buffer limits size')
assert(recent[0].text === 'message 4', 'TranscriptBuffer: oldest is message 4 (FIFO)')
assert(recent[4].text === 'message 8', 'TranscriptBuffer: newest is message 8')

// ============================================
// Test 3: TranscriptBuffer - Query Methods
// ============================================

const transcript2 = new TranscriptBuffer(100)

transcript2.add({
  id: 'a1',
  speaker: 'alice',
  text: 'hey bob',
  listener: 'bob',
  timestamp: Date.now(),
  emotion: { valence: 0.5, arousal: 0.5 }
})

transcript2.add({
  id: 'b1',
  speaker: 'bob',
  text: 'hey alice',
  listener: 'alice',
  timestamp: Date.now() + 100,
  emotion: { valence: 0.5, arousal: 0.5 }
})

transcript2.add({
  id: 'c1',
  speaker: 'charlie',
  text: 'anyone there?',
  timestamp: Date.now() + 200,
  emotion: { valence: 0.3, arousal: 0.7 }
})

const bySpeaker = transcript2.getBySpeaker('alice')
assert(bySpeaker.length === 1, 'TranscriptBuffer: getBySpeaker works')
assert(bySpeaker[0].text === 'hey bob', 'TranscriptBuffer: correct utterance')

const conversation = transcript2.getConversation('alice', 'bob')
assert(conversation.length === 2, 'TranscriptBuffer: getConversation works')
assert(conversation[0].speaker === 'alice', 'TranscriptBuffer: conversation order correct')

const since = transcript2.getSince(Date.now() + 150)
assert(since.length === 1, 'TranscriptBuffer: getSince works')
assert(since[0].speaker === 'charlie', 'TranscriptBuffer: correct utterance by timestamp')

// ============================================
// Test 4: WorldLexicon - Add and Update
// ============================================

const lexicon = new WorldLexicon()

lexicon.add({
  term: 'hello',
  meaning: 'greeting',
  origin: 'yuki',
  category: 'greeting',
  usageCount: 1,
  lastUsed: Date.now(),
  firstSeen: Date.now(),
  relatedTerms: [],
  weight: 0.5,
  decayRate: 0.01
})

const entry = lexicon.get('hello')
assert(entry !== undefined, 'WorldLexicon: stores terms')
assert(entry.term === 'hello', 'WorldLexicon: correct term')
assert(entry.usageCount === 1, 'WorldLexicon: correct usage count')

// Add same term again (should increase usage)
lexicon.add({
  term: 'hello',
  meaning: 'greeting',
  origin: 'ghost',
  category: 'greeting',
  usageCount: 1,
  lastUsed: Date.now(),
  firstSeen: Date.now(),
  relatedTerms: [],
  weight: 0.5,
  decayRate: 0.01
})

const updated = lexicon.get('hello')
assert(updated.usageCount === 2, 'WorldLexicon: increments usage on duplicate')
assert(updated.weight > 0.5, 'WorldLexicon: increases weight on reuse')

// ============================================
// Test 5: WorldLexicon - Query Methods
// ============================================

lexicon.add({
  term: 'goodbye',
  meaning: 'farewell',
  origin: 'yuki',
  category: 'greeting',
  usageCount: 3,
  lastUsed: Date.now(),
  firstSeen: Date.now(),
  relatedTerms: [],
  weight: 0.7,
  decayRate: 0.01
})

lexicon.add({
  term: 'wow',
  meaning: 'expression',
  origin: 'ghost',
  category: 'expression',
  usageCount: 5,
  lastUsed: Date.now(),
  firstSeen: Date.now(),
  relatedTerms: [],
  weight: 0.8,
  decayRate: 0.01
})

const popular = lexicon.getPopular(3)
assert(popular.length === 2, 'WorldLexicon: getPopular filters by minUsage')
assert(popular[0].term === 'wow' || popular[0].term === 'goodbye', 'WorldLexicon: returns high-usage terms')

const byCategory = lexicon.getByCategory('greeting')
assert(byCategory.length === 2, 'WorldLexicon: getByCategory works')
assert(byCategory.some(e => e.term === 'hello'), 'WorldLexicon: includes hello')
assert(byCategory.some(e => e.term === 'goodbye'), 'WorldLexicon: includes goodbye')

const stats = lexicon.getStats()
assert(stats.totalTerms === 3, 'WorldLexicon: stats.totalTerms correct')
assert(stats.totalUsage === 10, 'WorldLexicon: stats.totalUsage correct (2+3+5)')
assert(stats.categories.greeting === 2, 'WorldLexicon: stats.categories correct')

// ============================================
// Test 6: WorldLexicon - Decay System
// ============================================

const lexicon2 = new WorldLexicon()

// Add term with old timestamp (simulate not used for 15 seconds)
const oldTimestamp = Date.now() - 15000  // 15 seconds ago
lexicon2.add({
  term: 'old',
  meaning: 'forgotten term',
  origin: 'ghost',
  category: 'statement',
  usageCount: 1,
  lastUsed: oldTimestamp,
  firstSeen: oldTimestamp,
  relatedTerms: [],
  weight: 0.5,
  decayRate: 0.01
})

// Add term with recent timestamp
lexicon2.add({
  term: 'new',
  meaning: 'active term',
  origin: 'yuki',
  category: 'statement',
  usageCount: 1,
  lastUsed: Date.now(),
  firstSeen: Date.now(),
  relatedTerms: [],
  weight: 0.5,
  decayRate: 0.01
})

const beforeDecay = lexicon2.get('old').weight
lexicon2.decay(1000)  // Apply decay (first time)
const afterDecay = lexicon2.get('old')?.weight

assert(afterDecay < beforeDecay, 'WorldLexicon: decay reduces weight for unused terms')

// Note: Decay multiplies weight by (1 - decayRate) = 0.99 per call
// After each decay: weight *= 0.99
// To reach 0.01 from 0.5: 0.5 * 0.99^n < 0.01 → n > 389
// So we need ~390 decay cycles
// But decay only happens when timeSinceUse > 10000, so it will happen every tick
for (let i = 0; i < 400; i++) {
  lexicon2.decay(1000)
}

// Check if forgotten (should be deleted after weight drops below 0.01)
const oldAfter400 = lexicon2.get('old')
assert(oldAfter400 === undefined, 'WorldLexicon: forgets terms below weight threshold (after 400 decay cycles)')

const remembered = lexicon2.get('new')
assert(remembered !== undefined, 'WorldLexicon: keeps recent terms')

// ============================================
// Test 7: LinguisticCrystallizer - Basic Analysis
// ============================================

const transcript3 = new TranscriptBuffer(100)
const lexicon3 = new WorldLexicon()

// Add repeated phrases
for (let i = 0; i < 5; i++) {
  transcript3.add({
    id: 'greet' + i,
    speaker: 'yuki',
    text: 'hello there',
    timestamp: Date.now() + i * 100,
    emotion: { valence: 0.5, arousal: 0.5 }
  })
}

const crystallizer = new LinguisticCrystallizer({
  enabled: true,
  analyzeEvery: 1,  // Analyze every tick for testing
  minUsage: 3,
  minLength: 2,
  maxLength: 100
})

// First tick: tickCount=1, 1%1=0 → will analyze
crystallizer.tick(transcript3, lexicon3)

let stats3 = lexicon3.getStats()
assert(stats3.totalTerms >= 1, 'LinguisticCrystallizer: analyzes when tickCount % analyzeEvery === 0')

const detected = lexicon3.get('hello there')
assert(detected !== undefined, 'LinguisticCrystallizer: crystallizes "hello there"')
// Note: Usage count will be 5 from first analysis
assert(detected.usageCount >= 5, 'LinguisticCrystallizer: correct minimum usage count')
assert(detected.category === 'greeting', 'LinguisticCrystallizer: detects greeting category')

// ============================================
// Test 8: LinguisticCrystallizer - Threshold
// ============================================

const transcript4 = new TranscriptBuffer(100)
const lexicon4 = new WorldLexicon()

// Add phrase only 2 times (below minUsage=3)
transcript4.add({
  id: 'r1',
  speaker: 'yuki',
  text: 'rare phrase',
  timestamp: Date.now(),
  emotion: { valence: 0, arousal: 0.5 }
})

transcript4.add({
  id: 'r2',
  speaker: 'ghost',
  text: 'rare phrase',
  timestamp: Date.now() + 100,
  emotion: { valence: 0, arousal: 0.5 }
})

const crystallizer2 = new LinguisticCrystallizer({
  enabled: true,
  analyzeEvery: 1,
  minUsage: 3,
  minLength: 2,
  maxLength: 100
})

crystallizer2.tick(transcript4, lexicon4)  // tick 1 (analyze)

const rare = lexicon4.get('rare phrase')
assert(rare === undefined, 'LinguisticCrystallizer: ignores phrases below minUsage threshold')

// ============================================
// Test 9: LinguisticCrystallizer - Category Detection
// ============================================

const transcript5 = new TranscriptBuffer(100)
const lexicon5 = new WorldLexicon()

// Add question
for (let i = 0; i < 3; i++) {
  transcript5.add({
    id: 'q' + i,
    speaker: 'yuki',
    text: 'what is this?',
    timestamp: Date.now() + i * 100,
    emotion: { valence: 0.2, arousal: 0.6 }
  })
}

// Add expression (high arousal)
for (let i = 0; i < 3; i++) {
  transcript5.add({
    id: 'e' + i,
    speaker: 'ghost',
    text: 'oh wow!',
    timestamp: Date.now() + i * 100,
    emotion: { valence: 0.7, arousal: 0.9 }
  })
}

const crystallizer3 = new LinguisticCrystallizer({
  enabled: true,
  analyzeEvery: 1,
  minUsage: 3,
  minLength: 2,
  maxLength: 100
})

crystallizer3.tick(transcript5, lexicon5)  // tick 1 (analyze)

const question = lexicon5.get('what is this?')
assert(question !== undefined, 'LinguisticCrystallizer: detects questions')
assert(question.category === 'question', 'LinguisticCrystallizer: correct category for question')

const expression = lexicon5.get('oh wow!')
assert(expression !== undefined, 'LinguisticCrystallizer: detects expressions')
assert(expression.category === 'expression', 'LinguisticCrystallizer: correct category for expression')

// ============================================
// Test 10: LinguisticCrystallizer - Multilingual
// ============================================

const transcript6 = new TranscriptBuffer(100)
const lexicon6 = new WorldLexicon()

// Add Thai phrases
for (let i = 0; i < 4; i++) {
  transcript6.add({
    id: 'th' + i,
    speaker: 'yuki',
    text: 'สวัสดี',
    timestamp: Date.now() + i * 100,
    emotion: { valence: 0.5, arousal: 0.5 }
  })
}

// Add Japanese phrases
for (let i = 0; i < 4; i++) {
  transcript6.add({
    id: 'ja' + i,
    speaker: 'ghost',
    text: 'こんにちは',
    timestamp: Date.now() + i * 100,
    emotion: { valence: 0.5, arousal: 0.5 }
  })
}

const crystallizer4 = new LinguisticCrystallizer({
  enabled: true,
  analyzeEvery: 1,
  minUsage: 3,
  minLength: 2,
  maxLength: 100
})

crystallizer4.tick(transcript6, lexicon6)  // tick 1 (analyze)

const thai = lexicon6.get('สวัสดี')
const japanese = lexicon6.get('こんにちは')

assert(thai !== undefined, 'LinguisticCrystallizer: supports Thai')
assert(japanese !== undefined, 'LinguisticCrystallizer: supports Japanese')
assert(thai.category === 'greeting', 'LinguisticCrystallizer: detects Thai greeting')
assert(japanese.category === 'greeting', 'LinguisticCrystallizer: detects Japanese greeting')

// ============================================
// Results
// ============================================

console.log('\n==================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('==================================================\n')

if (failed === 0) {
  console.log('✅ All Linguistics system tests passed!\n')
  console.log('v6.0 Linguistics Tests Complete:')
  console.log('  ✓ TranscriptBuffer (circular buffer, query methods)')
  console.log('  ✓ WorldLexicon (add, update, decay, statistics)')
  console.log('  ✓ LinguisticCrystallizer (pattern detection, categories)')
  console.log('  ✓ Frequency-based analysis (minUsage threshold)')
  console.log('  ✓ Category detection (greeting, question, expression)')
  console.log('  ✓ Multilingual support (Thai, Japanese)')
} else {
  console.log(`❌ ${failed} test(s) failed\n`)
  process.exit(1)
}
