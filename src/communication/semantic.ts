/**
 * MDS v5 Phase 6 - Semantic Similarity System
 * Embedding-based similarity for replacing entropy-based similarity
 *
 * Design principles:
 * - Use LLM embeddings for semantic understanding
 * - Calculate cosine similarity between entity essences
 * - Cache embeddings to avoid repeated API calls
 * - Fallback to character-based similarity when embeddings unavailable
 */

import type { Entity } from '../core/entity'

/**
 * Embedding vector (typically 768 or 1536 dimensions)
 */
export type Embedding = number[]

/**
 * Semantic similarity config
 */
export interface SemanticConfig {
  provider?: 'openrouter' | 'openai' | 'mock'
  apiKey?: string
  model?: string
  cacheEnabled?: boolean
}

/**
 * Semantic similarity system
 */
export class SemanticSimilarity {
  private config: Required<SemanticConfig>
  private embeddingCache: Map<string, Embedding> = new Map()

  constructor(config: SemanticConfig = {}) {
    this.config = {
      provider: config.provider ?? 'mock',
      apiKey: config.apiKey ?? '',
      model: config.model ?? 'text-embedding-3-small',
      cacheEnabled: config.cacheEnabled ?? true
    }
  }

  /**
   * Calculate similarity between two entities
   * Returns 0..1 (1 = identical, 0 = completely different)
   */
  async similarity(entityA: Entity, entityB: Entity): Promise<number> {
    const essenceA = this.getEssence(entityA)
    const essenceB = this.getEssence(entityB)

    // Get embeddings
    const embeddingA = await this.getEmbedding(essenceA)
    const embeddingB = await this.getEmbedding(essenceB)

    // Calculate cosine similarity
    return this.cosineSimilarity(embeddingA, embeddingB)
  }

  /**
   * Get embedding for text
   */
  async getEmbedding(text: string): Promise<Embedding> {
    // Check cache
    if (this.config.cacheEnabled && this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!
    }

    let embedding: Embedding

    try {
      if (this.config.provider === 'mock') {
        embedding = this.generateMockEmbedding(text)
      } else if (this.config.provider === 'openai') {
        embedding = await this.getOpenAIEmbedding(text)
      } else if (this.config.provider === 'openrouter') {
        embedding = await this.getOpenRouterEmbedding(text)
      } else {
        throw new Error(`Unsupported provider: ${this.config.provider}`)
      }
    } catch (error) {
      console.warn('Embedding generation failed, using mock:', error)
      embedding = this.generateMockEmbedding(text)
    }

    // Cache embedding
    if (this.config.cacheEnabled) {
      this.embeddingCache.set(text, embedding)
    }

    return embedding
  }

  /**
   * Get OpenAI embedding
   */
  private async getOpenAIEmbedding(text: string): Promise<Embedding> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: this.config.model
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'OpenAI Embedding API error')
    }

    return data.data[0].embedding
  }

  /**
   * Get OpenRouter embedding
   */
  private async getOpenRouterEmbedding(text: string): Promise<Embedding> {
    // OpenRouter supports some embedding models via chat completion
    // For now, use mock as OpenRouter doesn't have dedicated embedding endpoint
    console.warn('OpenRouter embeddings not yet supported, using mock')
    return this.generateMockEmbedding(text)
  }

  /**
   * Generate mock embedding (character-based hash)
   */
  private generateMockEmbedding(text: string): Embedding {
    const dimensions = 128  // Small mock embedding
    const embedding: number[] = new Array(dimensions).fill(0)

    // Simple character-based hash
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i)
      const idx = charCode % dimensions
      embedding[idx] += 1 / (text.length + 1)
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    if (magnitude > 0) {
      for (let i = 0; i < dimensions; i++) {
        embedding[i] /= magnitude
      }
    }

    return embedding
  }

  /**
   * Calculate cosine similarity between two embeddings
   * Returns 0..1 (1 = identical vectors, 0 = orthogonal)
   */
  private cosineSimilarity(a: Embedding, b: Embedding): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions')
    }

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      magnitudeA += a[i] * a[i]
      magnitudeB += b[i] * b[i]
    }

    magnitudeA = Math.sqrt(magnitudeA)
    magnitudeB = Math.sqrt(magnitudeB)

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0
    }

    // Cosine similarity is -1..1, normalize to 0..1
    const similarity = dotProduct / (magnitudeA * magnitudeB)
    return (similarity + 1) / 2
  }

  /**
   * Get entity essence as string
   */
  private getEssence(entity: Entity): string {
    if (typeof entity.m.essence === 'string') {
      return entity.m.essence
    }

    // Try different language keys
    const essence = entity.m.essence as Record<string, string> | undefined
    if (essence) {
      return essence.en || essence.th || essence.ja || Object.values(essence)[0] || entity.m.material
    }

    return entity.m.material
  }

  /**
   * Calculate similarity matrix for entities
   */
  async similarityMatrix(entities: Entity[]): Promise<number[][]> {
    const n = entities.length
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1  // Self-similarity = 1

      for (let j = i + 1; j < n; j++) {
        const sim = await this.similarity(entities[i], entities[j])
        matrix[i][j] = sim
        matrix[j][i] = sim  // Symmetric
      }
    }

    return matrix
  }

  /**
   * Find most similar entity to target
   */
  async findMostSimilar(target: Entity, candidates: Entity[]): Promise<Entity | null> {
    if (candidates.length === 0) return null

    let maxSim = -1
    let mostSimilar: Entity | null = null

    for (const candidate of candidates) {
      if (candidate.id === target.id) continue

      const sim = await this.similarity(target, candidate)
      if (sim > maxSim) {
        maxSim = sim
        mostSimilar = candidate
      }
    }

    return mostSimilar
  }

  /**
   * Find top N most similar entities
   */
  async findTopSimilar(target: Entity, candidates: Entity[], n: number = 5): Promise<Array<{ entity: Entity, similarity: number }>> {
    const similarities: Array<{ entity: Entity, similarity: number }> = []

    for (const candidate of candidates) {
      if (candidate.id === target.id) continue

      const sim = await this.similarity(target, candidate)
      similarities.push({ entity: candidate, similarity: sim })
    }

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity)

    return similarities.slice(0, n)
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear()
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.embeddingCache.size
  }
}

/**
 * Helper: Create semantic similarity with OpenAI
 */
export function createOpenAISemantic(apiKey: string, model?: string): SemanticSimilarity {
  return new SemanticSimilarity({
    provider: 'openai',
    apiKey,
    model: model || 'text-embedding-3-small'
  })
}

/**
 * Helper: Create mock semantic similarity (for testing)
 */
export function createMockSemantic(): SemanticSimilarity {
  return new SemanticSimilarity({ provider: 'mock' })
}

/**
 * Helper: Calculate Jaccard similarity (character-based, no API)
 * Returns 0..1 (1 = identical, 0 = no overlap)
 */
export function jaccardSimilarity(textA: string, textB: string): number {
  const setA = new Set(textA.toLowerCase().split(''))
  const setB = new Set(textB.toLowerCase().split(''))

  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])

  if (union.size === 0) return 0

  return intersection.size / union.size
}

/**
 * Helper: Calculate Levenshtein distance (edit distance)
 */
export function levenshteinDistance(textA: string, textB: string): number {
  const m = textA.length
  const n = textB.length

  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (textA[i - 1] === textB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + 1   // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Helper: Normalize Levenshtein distance to similarity (0..1)
 */
export function levenshteinSimilarity(textA: string, textB: string): number {
  const distance = levenshteinDistance(textA, textB)
  const maxLength = Math.max(textA.length, textB.length)

  if (maxLength === 0) return 1

  return 1 - (distance / maxLength)
}
