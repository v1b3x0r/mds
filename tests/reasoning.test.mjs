/**
 * MDS v5.2 - Intent Reasoning Tests
 * Test intelligent goal selection based on context
 */

import assert from 'node:assert'
import {
  IntentReasoner,
  createReasoner,
  reasonAbout,
  chooseBestIntent
} from '../dist/mds-core.esm.js'

console.log('\n🧠 MDS v5.2 - Intent Reasoning Tests\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`✗ ${name}`)
    console.error(`  ${err.message}`)
    failed++
  }
}

// Test 1: IntentReasoner instantiation
test('IntentReasoner instantiation', () => {
  const reasoner = new IntentReasoner()
  assert(reasoner !== undefined, 'Should create reasoner')

  const config = reasoner.getConfig()
  assert(config.confidenceThreshold === 0.3, 'Should have default threshold')
})

// Test 2: Create reasoner with custom config
test('Create reasoner with custom config', () => {
  const reasoner = createReasoner({
    confidenceThreshold: 0.5,
    emotionInfluence: 0.8
  })

  const config = reasoner.getConfig()
  assert(config.confidenceThreshold === 0.5, 'Should use custom threshold')
  assert(config.emotionInfluence === 0.8, 'Should use custom emotion influence')
})

// Test 3: Reason about intent without context
test('Reason about intent without context (baseline)', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'wander',
    motivation: 0.6,
    priority: 1
  }

  const reasoned = reasoner.reason(intent, {})

  assert(reasoned.confidence !== undefined, 'Should have confidence')
  assert(reasoned.reasoning !== undefined, 'Should have reasoning array')
  assert(reasoned.relevance !== undefined, 'Should have relevance')
  assert(Math.abs(reasoned.confidence - 0.6) < 0.1, 'Confidence should be close to motivation without context')
})

// Test 4: Emotion influence - bonding with positive valence
test('Emotion influence - bonding with positive valence', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'bond',
    target: 'other',
    motivation: 0.5,
    priority: 2
  }

  const emotion = {
    valence: 0.8,
    arousal: 0.3,
    dominance: 0.5
  }

  const reasoned = reasoner.reason(intent, { emotion })

  assert(reasoned.confidence > 0.5, 'Positive emotion should boost bonding confidence')
  assert(reasoned.reasoning.length > 0, 'Should have reasoning for emotion influence')
})

// Test 5: Emotion influence - bonding with negative valence
test('Emotion influence - bonding with negative valence', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'bond',
    target: 'other',
    motivation: 0.8,
    priority: 2
  }

  const emotion = {
    valence: -0.8,
    arousal: 0.3,
    dominance: 0.5
  }

  const reasoned = reasoner.reason(intent, { emotion })

  assert(reasoned.confidence < 0.8, 'Negative emotion should reduce bonding confidence')
})

// Test 6: Emotion influence - rest with low arousal
test('Emotion influence - rest with low arousal', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'rest',
    motivation: 0.5,
    priority: 1
  }

  const emotion = {
    valence: 0,
    arousal: -0.8,
    dominance: 0
  }

  const reasoned = reasoner.reason(intent, { emotion })

  assert(reasoned.confidence > 0.7, 'Low arousal should strongly support resting')
})

// Test 7: Emotion influence - explore with high arousal
test('Emotion influence - explore with high arousal', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'explore',
    motivation: 0.5,
    priority: 2
  }

  const emotion = {
    valence: 0.5,
    arousal: 0.8,
    dominance: 0.3
  }

  const reasoned = reasoner.reason(intent, { emotion })

  assert(reasoned.confidence > 0.7, 'High arousal + positive valence should boost exploration')
})

// Test 8: Memory influence - approach with positive memories
test('Memory influence - approach with positive memories', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'approach',
    target: 'friend',
    motivation: 0.5,
    priority: 2
  }

  const memories = [
    {
      timestamp: 100,
      type: 'interaction',
      subject: 'friend',
      content: {},
      salience: 0.8
    },
    {
      timestamp: 200,
      type: 'interaction',
      subject: 'friend',
      content: {},
      salience: 0.7
    }
  ]

  const reasoned = reasoner.reason(intent, { memories })

  assert(reasoned.confidence > 0.5, 'Positive memories should boost approach confidence')
  assert(reasoned.reasoning.some(r => r.includes('memories')), 'Should mention memories in reasoning')
})

// Test 9: Crystal influence - bonding with crystallized relationship
test('Crystal influence - bonding with crystallized relationship', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'bond',
    target: 'bestfriend',
    motivation: 0.6,
    priority: 3
  }

  const crystals = [
    {
      id: 'crystal1',
      pattern: 'repeated_interaction',
      subject: 'bestfriend',
      type: 'interaction',
      strength: 0.9,
      firstSeen: 0,
      lastReinforced: 1000,
      count: 15,
      essence: 'Strong friendship'
    }
  ]

  const reasoned = reasoner.reason(intent, { crystals })

  // With crystal strength 0.9: support = 0.7 + 0.9*0.3 = 0.97
  // Blended with base motivation 0.6 at 50%: confidence = 0.6*0.5 + 0.97*0.5 = 0.785
  assert(reasoned.confidence > 0.75, 'Strong crystallized bond should strongly support bonding')
  assert(reasoned.reasoning.some(r => r.includes('crystallized')), 'Should mention crystal in reasoning')
})

// Test 10: Relationship influence - bonding with high bond
test('Relationship influence - bonding with high bond', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'bond',
    target: 'partner',
    motivation: 0.5,
    priority: 3
  }

  const relationships = [
    {
      entityId: 'partner',
      bond: {
        trust: 0.9,
        familiarity: 0.8,
        lastInteraction: 1000,
        interactionCount: 20
      }
    }
  ]

  const reasoned = reasoner.reason(intent, { relationships })

  assert(reasoned.confidence > 0.8, 'High bond should strongly support bonding intent')
  assert(reasoned.reasoning.some(r => r.includes('bond')), 'Should mention bond strength')
})

// Test 11: Relationship influence - avoidance with low trust
test('Relationship influence - avoidance with low trust', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'avoid',
    target: 'enemy',
    motivation: 0.5,
    priority: 2
  }

  const relationships = [
    {
      entityId: 'enemy',
      bond: {
        trust: 0.1,
        familiarity: 0.5,
        lastInteraction: 1000,
        interactionCount: 5
      }
    }
  ]

  const reasoned = reasoner.reason(intent, { relationships })

  assert(reasoned.confidence > 0.8, 'Low trust should strongly support avoidance')
  assert(reasoned.reasoning.some(r => r.includes('trust')), 'Should mention trust')
})

// Test 12: Combined influence (emotion + memory + relationship)
test('Combined influence (emotion + memory + relationship)', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'approach',
    target: 'friend',
    motivation: 0.6,
    priority: 2
  }

  const emotion = {
    valence: 0.7,
    arousal: 0.4,
    dominance: 0.5
  }

  const memories = [
    {
      timestamp: 100,
      type: 'interaction',
      subject: 'friend',
      content: {},
      salience: 0.8
    }
  ]

  const relationships = [
    {
      entityId: 'friend',
      bond: {
        trust: 0.7,
        familiarity: 0.6,
        lastInteraction: 1000,
        interactionCount: 10
      }
    }
  ]

  const reasoned = reasoner.reason(intent, { emotion, memories, relationships })

  assert(reasoned.confidence > 0.7, 'All positive factors should strongly boost confidence')
  assert(reasoned.reasoning.length >= 2, 'Should have multiple reasoning factors')
})

// Test 13: Suggest intents from context (social)
test('Suggest intents from context (social)', () => {
  const reasoner = new IntentReasoner()

  const relationships = [
    {
      entityId: 'friend',
      bond: {
        trust: 0.8,
        familiarity: 0.7,
        lastInteraction: 1000,
        interactionCount: 15
      }
    }
  ]

  const suggestions = reasoner.suggest({ relationships })

  assert(suggestions.length > 0, 'Should suggest intents')
  assert(suggestions[0].goal === 'approach', 'Should suggest approaching strong bond')
  assert(suggestions[0].target === 'friend', 'Should target the friend')
})

// Test 14: Suggest intents from context (emotional)
test('Suggest intents from context (emotional)', () => {
  const reasoner = new IntentReasoner()

  const emotion = {
    valence: 0.6,
    arousal: 0.8,
    dominance: 0.5
  }

  const suggestions = reasoner.suggest({ emotion })

  assert(suggestions.length > 0, 'Should suggest intents')
  assert(suggestions.some(s => s.goal === 'explore'), 'High arousal + positive should suggest explore')
})

// Test 15: Suggest intents from crystals
test('Suggest intents from crystals', () => {
  const reasoner = new IntentReasoner()

  const crystals = [
    {
      id: 'crystal1',
      pattern: 'repeated_interaction',
      subject: 'companion',
      type: 'interaction',
      strength: 0.85,
      firstSeen: 0,
      lastReinforced: 1000,
      count: 20,
      essence: 'Long-term companion'
    }
  ]

  const suggestions = reasoner.suggest({ crystals })

  assert(suggestions.length > 0, 'Should suggest intents')
  assert(suggestions.some(s => s.goal === 'bond' && s.target === 'companion'), 'Should suggest bonding with crystallized companion')
})

// Test 16: Suggest fallback (no context)
test('Suggest fallback (no context)', () => {
  const reasoner = new IntentReasoner()

  const suggestions = reasoner.suggest({})

  assert(suggestions.length > 0, 'Should suggest fallback intent')
  assert(suggestions[0].goal === 'wander', 'Fallback should be wander')
})

// Test 17: Re-evaluate intent (confidence change)
test('Re-evaluate intent (confidence change)', () => {
  const reasoner = new IntentReasoner({ reevaluationInterval: 0 })

  const intent = {
    goal: 'bond',
    target: 'friend',
    motivation: 0.5,
    priority: 2,
    confidence: 0.5,
    reasoning: [],
    relevance: 0.5,
    lastEvaluated: 0
  }

  // New context with positive relationship
  const relationships = [
    {
      entityId: 'friend',
      bond: {
        trust: 0.9,
        familiarity: 0.8,
        lastInteraction: 1000,
        interactionCount: 25
      }
    }
  ]

  const reevaluated = reasoner.reevaluate(intent, { relationships, currentTime: 10000 })

  assert(reevaluated.confidence > intent.confidence, 'Re-evaluation with better context should increase confidence')
})

// Test 18: Should abandon (low confidence)
test('Should abandon (low confidence)', () => {
  const reasoner = new IntentReasoner({
    confidenceThreshold: 0.5,
    reevaluationInterval: 0
  })

  const intent = {
    goal: 'bond',
    target: 'stranger',
    motivation: 0.6,
    priority: 2,
    confidence: 0.6,
    reasoning: [],
    relevance: 0.5,
    lastEvaluated: 0
  }

  // Context with low trust (should kill bonding intent)
  const relationships = [
    {
      entityId: 'stranger',
      bond: {
        trust: 0.1,
        familiarity: 0.3,
        lastInteraction: 1000,
        interactionCount: 2
      }
    }
  ]

  const shouldAbandon = reasoner.shouldAbandon(intent, { relationships, currentTime: 10000 })

  assert(shouldAbandon === true, 'Should abandon intent with low confidence after re-evaluation')
})

// Test 19: Should NOT abandon (still confident)
test('Should NOT abandon (still confident)', () => {
  const reasoner = new IntentReasoner({
    confidenceThreshold: 0.5,
    reevaluationInterval: 0
  })

  const intent = {
    goal: 'approach',
    target: 'friend',
    motivation: 0.7,
    priority: 2,
    confidence: 0.7,
    reasoning: [],
    relevance: 0.6,
    lastEvaluated: 0
  }

  const relationships = [
    {
      entityId: 'friend',
      bond: {
        trust: 0.8,
        familiarity: 0.7,
        lastInteraction: 1000,
        interactionCount: 15
      }
    }
  ]

  const shouldAbandon = reasoner.shouldAbandon(intent, { relationships, currentTime: 10000 })

  assert(shouldAbandon === false, 'Should NOT abandon confident intent')
})

// Test 20: Relevance calculation (targeted intent with relationship)
test('Relevance calculation (targeted intent with relationship)', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'approach',
    target: 'known',
    motivation: 0.5,
    priority: 2
  }

  const relationships = [
    {
      entityId: 'known',
      bond: {
        trust: 0.6,
        familiarity: 0.5,
        lastInteraction: 1000,
        interactionCount: 8
      }
    }
  ]

  const reasoned = reasoner.reason(intent, { relationships })

  assert(reasoned.relevance > 0.6, 'Intent with relationship should have high relevance')
})

// Test 21: Relevance calculation (no context)
test('Relevance calculation (no context)', () => {
  const reasoner = new IntentReasoner()

  const intent = {
    goal: 'wander',
    motivation: 0.5,
    priority: 1
  }

  const reasoned = reasoner.reason(intent, {})

  assert(reasoned.relevance >= 0.4 && reasoned.relevance <= 0.6, 'Intent without context should have baseline relevance')
})

// Test 22: reasonAbout helper
test('reasonAbout helper', () => {
  const intent = {
    goal: 'explore',
    motivation: 0.6,
    priority: 2
  }

  const emotion = {
    valence: 0.5,
    arousal: 0.7,
    dominance: 0.4
  }

  const reasoned = reasonAbout(intent, { emotion })

  assert(reasoned.confidence !== undefined, 'Should return reasoned intent')
  assert(reasoned.reasoning.length > 0, 'Should have reasoning')
})

// Test 23: chooseBestIntent helper (multiple options)
test('chooseBestIntent helper (multiple options)', () => {
  const intents = [
    { goal: 'wander', motivation: 0.3, priority: 1 },
    { goal: 'rest', motivation: 0.5, priority: 1 },
    { goal: 'explore', motivation: 0.7, priority: 2 }
  ]

  const emotion = {
    valence: 0.6,
    arousal: 0.8,
    dominance: 0.5
  }

  const best = chooseBestIntent(intents, { emotion })

  assert(best !== null, 'Should return best intent')
  assert(best.goal === 'explore', 'Should choose explore (high arousal + positive)')
})

// Test 24: chooseBestIntent helper (empty array)
test('chooseBestIntent helper (empty array)', () => {
  const best = chooseBestIntent([], {})

  assert(best === null, 'Should return null for empty array')
})

// Test 25: Update config
test('Update config', () => {
  const reasoner = new IntentReasoner()

  reasoner.updateConfig({ confidenceThreshold: 0.7 })

  const config = reasoner.getConfig()
  assert(config.confidenceThreshold === 0.7, 'Config should be updated')
})

// Summary
console.log('\n==================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('==================================================\n')

if (failed > 0) {
  console.error('❌ Intent Reasoning tests failed!')
  process.exit(1)
} else {
  console.log('✅ All intent reasoning tests passed!\n')
  console.log('v5.2 Phase 2.4 Status:')
  console.log('  ✓ Intent confidence scoring')
  console.log('  ✓ Context-aware reasoning (emotion + memory + relationship)')
  console.log('  ✓ Intent suggestion engine')
  console.log('  ✓ Re-evaluation and abandonment logic')
  console.log('  ✓ Relevance calculation')
  console.log('  ✓ Helper functions (reasonAbout, chooseBestIntent)')
}
