/**
 * MDS v5 Phase 6 - Communication System Test Suite
 * Tests message system, dialogue trees, language generation, and semantic similarity
 */

import {
  MessageBuilder, MessageQueue, MessageDelivery, createMessage,
  DialogueManager, DialogueBuilder, createNode, createChoice,
  LanguageGenerator, createMockGenerator,
  SemanticSimilarity, createMockSemantic,
  jaccardSimilarity, levenshteinSimilarity,
  Entity,
  getDialoguePhrase
} from '../dist/mds-core.esm.js'

console.log('🧪 MDS v5 Phase 6 - Communication System Tests\n')

let passed = 0, failed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ ${testName}`)
    passed++
  } else {
    console.log(`❌ ${testName}`)
    failed++
  }
}

// Mock entities
function createMockEntity(id) {
  return {
    id,
    x: Math.random() * 800,
    y: Math.random() * 600,
    m: { material: `entity.${id}`, essence: `Entity ${id}` }
  }
}

// ===== MESSAGE SYSTEM =====
console.log('📨 Message System Tests')
console.log('─'.repeat(60))

const sender = createMockEntity('sender')
const receiver = createMockEntity('receiver')

// Message Builder
const msg = new MessageBuilder(sender)
  .type('dialogue')
  .content('Hello!')
  .to(receiver)
  .priority('normal')
  .build()

assert(msg.type === 'dialogue' && msg.content === 'Hello!', 'MessageBuilder: Create message')

// MessageQueue
const queue = new MessageQueue(5)
queue.enqueue(msg)
assert(queue.size() === 1 && queue.unreadCount() === 1, 'MessageQueue: Enqueue message')

const next = queue.peek()
assert(next && next.content === 'Hello!', 'MessageQueue: Peek message')

const read = queue.dequeue()
assert(read && read.read === true, 'MessageQueue: Dequeue marks as read')
assert(queue.unreadCount() === 0, 'MessageQueue: Unread count updates')

// Priority
const urgent = createMessage(sender, 'signal', 'Urgent!', receiver, 'urgent')
const low = createMessage(sender, 'thought', 'Later...', receiver, 'low')
queue.enqueue(low)
queue.enqueue(urgent)
assert(queue.peek().priority === 'urgent', 'MessageQueue: Priority ordering')

// Message Delivery
const entities = [sender, receiver, createMockEntity('e3')]
const directMsg = createMessage(sender, 'dialogue', 'Hi there', receiver)
MessageDelivery.deliver(directMsg, entities)
assert(receiver.inbox && receiver.inbox.size() > 0, 'MessageDelivery: Direct delivery')

console.log('')

// ===== DIALOGUE SYSTEM =====
console.log('💬 Dialogue System Tests')
console.log('─'.repeat(60))

const dialogueManager = new DialogueManager()

// Build dialogue tree
const tree = new DialogueBuilder('greeting', 'Simple Greeting')
  .start('start')
  .node(createNode('start', 'Hello! How are you?', [
    createChoice('c1', 'Good!', 'good'),
    createChoice('c2', 'Not great', 'bad')
  ]))
  .node(createNode('good', 'That\'s wonderful!'))
  .node(createNode('bad', 'I hope things get better'))
  .build()

dialogueManager.registerTree(tree)
assert(dialogueManager.getAllTrees().length === 1, 'DialogueManager: Register tree')

// Start dialogue
const speaker = createMockEntity('speaker')
const listener = createMockEntity('listener')
const dialogue = dialogueManager.startDialogue('greeting', speaker, listener)
assert(dialogue !== null && dialogue.currentNodeId === 'start', 'DialogueManager: Start dialogue')

const text = dialogueManager.getCurrentText(dialogue)
assert(text === 'Hello! How are you?', 'DialogueManager: Get current text')

const choices = dialogueManager.getAvailableChoices(dialogue)
assert(choices.length === 2, 'DialogueManager: Get choices')

// Make choice
const success = dialogueManager.choose(dialogue, 'c1')
assert(success && dialogue.currentNodeId === 'good', 'DialogueManager: Choose option')

console.log('')

// ===== LANGUAGE GENERATION =====
console.log('🤖 Language Generation Tests')
console.log('─'.repeat(60))

const langGen = createMockGenerator()
const entity = createMockEntity('test')
entity.m.essence = 'A curious wanderer'

const response = await langGen.generate({ speaker: entity })
assert(response.text.length > 0, 'LanguageGenerator: Generate text')
assert(response.metadata?.model === 'mock', 'LanguageGenerator: Mock provider')

// Cache
const cached = await langGen.generate({ speaker: entity })
assert(cached.metadata?.cached === true, 'LanguageGenerator: Response caching')

console.log('')

// ===== SEMANTIC SIMILARITY =====
console.log('🧠 Semantic Similarity Tests')
console.log('─'.repeat(60))

const semantic = createMockSemantic()

const entityA = createMockEntity('a')
entityA.m.essence = 'fire'
const entityB = createMockEntity('b')
entityB.m.essence = 'flame'
const entityC = createMockEntity('c')
entityC.m.essence = 'water'

const simAB = await semantic.similarity(entityA, entityB)
const simAC = await semantic.similarity(entityA, entityC)
// Mock embeddings are character-based, so fire/flame similarity might vary
assert(simAB >= 0 && simAB <= 1, 'SemanticSimilarity: Similarity in valid range [0,1]')

// Jaccard similarity
const jaccardSim = jaccardSimilarity('hello', 'hallo')
assert(jaccardSim > 0.5, 'Jaccard similarity: Character overlap')

// Levenshtein similarity
const levenSim = levenshteinSimilarity('kitten', 'sitting')
assert(levenSim > 0 && levenSim < 1, 'Levenshtein similarity: Edit distance')

console.log('')

// ===== LANGUAGE FALLBACK =====
console.log('🌐 Language Fallback Tests')
console.log('─'.repeat(60))

const parsedVariants = [
  { lang: { ja: ['こんにちは'], es: ['hola'] } },
  { lang: { ja: ['やあ'], es: ['buenas'] } }
]

const parsedDialogue = {
  intro: parsedVariants,
  self_monologue: [],
  events: new Map(),
  categories: new Map([['intro', parsedVariants]])
}

const phraseFromParser = getDialoguePhrase(parsedDialogue, 'intro', 'th')
assert(['こんにちは', 'やあ'].includes(phraseFromParser), 'getDialoguePhrase should prefer Japanese before defaulting to English')

const fallbackMaterial = {
  material: 'test.dialogue.fallback',
  manifestation: { emoji: '💬' },
  dialogue: {
    intro: [
      { lang: { ja: 'こんにちは', es: 'hola' } },
      { lang: { ja: 'やあ', es: 'buenas' } }
    ]
  }
}

const fallbackEntity = new Entity(fallbackMaterial, 0, 0, () => 0.5, { skipDOM: true })
const spoken = fallbackEntity.speakFromDialogue('intro', 'th')
assert(['こんにちは', 'やあ'].includes(spoken), 'Entity.speakFromDialogue should honour shared fallback priority')

console.log('')

// ===== SUMMARY =====
console.log('═'.repeat(60))
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📊 Total:  ${passed + failed}`)
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
console.log('═'.repeat(60))

if (failed === 0) {
  console.log('\n🎉 All tests passed! Phase 6 communication system is working.')
  process.exit(0)
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review.`)
  process.exit(1)
}
