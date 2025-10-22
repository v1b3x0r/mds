/**
 * MDS v5.2 - Similarity System
 * Pluggable similarity calculation for semantic understanding
 */

export type {
  SimilarityProvider,
  SimilarityProviderConfig,
  Embedding
} from './provider'

export {
  BaseSimilarityProvider,
  MockSimilarityProvider,
  OpenAISimilarityProvider,
  AnthropicSimilarityProvider,
  CohereSimilarityProvider,
  createSimilarityProvider
} from './provider'

export {
  EntitySimilarityAdapter,
  findSimilarEntities,
  createSimilarityMatrix,
  clusterBySimilarity
} from './adapter'
