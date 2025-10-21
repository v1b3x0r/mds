/**
 * MDS v5 Phase 6 - Communication Module
 * Entity-to-entity communication, dialogue, and language generation
 */

// Message system
export {
  MessageBuilder,
  MessageQueue,
  MessageDelivery,
  createMessage
} from './message'

export type {
  Message,
  MessageType,
  MessagePriority
} from './message'

// Dialogue system
export {
  DialogueManager,
  DialogueBuilder,
  createNode,
  createChoice
} from './dialogue'

export type {
  DialogueNode,
  DialogueChoice,
  DialogueTree,
  DialogueState
} from './dialogue'

// Language generation
export {
  LanguageGenerator,
  createOpenRouterGenerator,
  createMockGenerator
} from './language'

export type {
  LanguageConfig,
  LanguageRequest,
  LanguageResponse
} from './language'

// Semantic similarity
export {
  SemanticSimilarity,
  createOpenAISemantic,
  createMockSemantic,
  jaccardSimilarity,
  levenshteinDistance,
  levenshteinSimilarity
} from './semantic'

export type {
  Embedding,
  SemanticConfig
} from './semantic'
