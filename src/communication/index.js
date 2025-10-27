/**
 * MDS v5 Phase 6 - Communication Module
 * Entity-to-entity communication, dialogue, and language generation
 *
 * v5.2: Exports MessageParticipant types to break circular dependencies
 */
// Message system
export { MessageBuilder, MessageQueue, MessageDelivery, createMessage } from './message';
// Dialogue system
export { DialogueManager, DialogueBuilder, createNode, createChoice } from './dialogue';
// Language generation
export { LanguageGenerator, createOpenRouterGenerator, createMockGenerator } from './language';
// Semantic similarity
export { SemanticSimilarity, createOpenAISemantic, createMockSemantic, jaccardSimilarity, levenshteinDistance, levenshteinSimilarity } from './semantic';
