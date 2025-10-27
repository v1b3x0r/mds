/**
 * MDS v5.2 Phase 2.1 - SimilarityProvider Interface
 * Pluggable similarity calculation for semantic understanding
 *
 * Design principles:
 * - Interface-driven architecture (swap providers easily)
 * - Support multiple backends (OpenAI, Anthropic, Cohere, local models)
 * - Consistent API across providers
 * - Cache support for performance
 *
 * Usage:
 * ```typescript
 * const provider = new OpenAISimilarityProvider({ apiKey: '...' })
 * const similarity = await provider.similarity('cat', 'dog')  // 0.8
 * ```
 */

/**
 * Core interface for similarity providers
 */
export interface SimilarityProvider {
  /**
   * Calculate similarity between two texts
   * @returns Similarity score 0..1 (1 = identical, 0 = completely different)
   */
  similarity(textA: string, textB: string): Promise<number>

  /**
   * Get embedding vector for text (optional)
   * @returns Embedding vector or null if provider doesn't support embeddings
   */
  getEmbedding?(text: string): Promise<number[] | null>

  /**
   * Calculate similarity matrix for multiple texts
   * @returns NxN matrix where matrix[i][j] = similarity(texts[i], texts[j])
   */
  similarityMatrix?(texts: string[]): Promise<number[][]>

  /**
   * Clear internal cache (if provider uses caching)
   */
  clearCache?(): void

  /**
   * Provider name (for debugging)
   */
  readonly name: string
}

/**
 * Configuration for similarity providers
 */
export interface SimilarityProviderConfig {
  apiKey?: string
  model?: string
  cacheEnabled?: boolean
  maxCacheSize?: number
  timeout?: number
}

/**
 * Embedding vector type
 */
export type Embedding = number[]

/**
 * Base class for similarity providers with common functionality
 */
export abstract class BaseSimilarityProvider implements SimilarityProvider {
  protected config: Required<SimilarityProviderConfig>
  protected cache: Map<string, Embedding> = new Map()

  abstract readonly name: string

  constructor(config: SimilarityProviderConfig = {}) {
    this.config = {
      apiKey: config.apiKey ?? '',
      model: config.model ?? '',
      cacheEnabled: config.cacheEnabled ?? true,
      maxCacheSize: config.maxCacheSize ?? 1000,
      timeout: config.timeout ?? 10000
    }
  }

  /**
   * Calculate similarity between two texts
   */
  async similarity(textA: string, textB: string): Promise<number> {
    const embeddingA = await this.getEmbedding(textA)
    const embeddingB = await this.getEmbedding(textB)

    if (!embeddingA || !embeddingB) {
      throw new Error('Failed to get embeddings')
    }

    return this.cosineSimilarity(embeddingA, embeddingB)
  }

  /**
   * Get embedding for text (must be implemented by subclasses)
   */
  abstract getEmbedding(text: string): Promise<Embedding | null>

  /**
   * Calculate similarity matrix for multiple texts
   */
  async similarityMatrix(texts: string[]): Promise<number[][]> {
    const n = texts.length
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1  // Self-similarity = 1

      for (let j = i + 1; j < n; j++) {
        const sim = await this.similarity(texts[i], texts[j])
        matrix[i][j] = sim
        matrix[j][i] = sim  // Symmetric
      }
    }

    return matrix
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  protected cosineSimilarity(a: Embedding, b: Embedding): number {
    if (a.length !== b.length) {
      throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`)
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
   * Get embedding from cache or generate new
   */
  protected async getCachedEmbedding(text: string, generator: () => Promise<Embedding>): Promise<Embedding> {
    const cacheKey = this.getCacheKey(text)

    // Check cache
    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Generate embedding
    const embedding = await generator()

    // Store in cache (with size limit)
    if (this.config.cacheEnabled) {
      if (this.cache.size >= this.config.maxCacheSize) {
        // Remove oldest entry (first key)
        const firstKey = this.cache.keys().next().value
        if (firstKey !== undefined) {
          this.cache.delete(firstKey)
        }
      }
      this.cache.set(cacheKey, embedding)
    }

    return embedding
  }

  /**
   * Generate cache key for text
   */
  protected getCacheKey(text: string): string {
    return `${this.name}:${this.config.model}:${text}`
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize
    }
  }
}

/**
 * Mock similarity provider (for testing, no API calls)
 * Uses character-based hashing for fast local similarity
 */
export class MockSimilarityProvider extends BaseSimilarityProvider {
  readonly name = 'mock'

  constructor(config: SimilarityProviderConfig = {}) {
    super({ ...config, model: 'mock-128d' })
  }

  async getEmbedding(text: string): Promise<Embedding> {
    return this.getCachedEmbedding(text, () =>
      Promise.resolve(this.generateMockEmbedding(text))
    )
  }

  /**
   * Generate mock embedding using character-based hash
   */
  private generateMockEmbedding(text: string): Embedding {
    const dimensions = 128
    const embedding: number[] = new Array(dimensions).fill(0)

    // Character frequency hash
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
}

/**
 * OpenAI similarity provider (uses text-embedding-3-small/large)
 */
export class OpenAISimilarityProvider extends BaseSimilarityProvider {
  readonly name = 'openai'

  constructor(config: SimilarityProviderConfig = {}) {
    super({
      ...config,
      model: config.model || 'text-embedding-3-small'
    })

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key required')
    }
  }

  async getEmbedding(text: string): Promise<Embedding> {
    return this.getCachedEmbedding(text, async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: text,
            model: this.config.model
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || `OpenAI API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data[0].embedding
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`OpenAI API timeout after ${this.config.timeout}ms`)
        }
        throw error
      }
    })
  }
}

/**
 * Anthropic similarity provider (uses voyage embeddings via Anthropic)
 * Note: Anthropic doesn't have native embeddings, this is a placeholder
 */
export class AnthropicSimilarityProvider extends BaseSimilarityProvider {
  readonly name = 'anthropic'

  constructor(config: SimilarityProviderConfig = {}) {
    super(config)
    throw new Error('Anthropic similarity provider not yet implemented (no native embedding API)')
  }

  async getEmbedding(_text: string): Promise<Embedding> {
    throw new Error('Not implemented')
  }
}

/**
 * Cohere similarity provider (uses embed-v3)
 */
export class CohereSimilarityProvider extends BaseSimilarityProvider {
  readonly name = 'cohere'

  constructor(config: SimilarityProviderConfig = {}) {
    super({
      ...config,
      model: config.model || 'embed-english-v3.0'
    })

    if (!this.config.apiKey) {
      throw new Error('Cohere API key required')
    }
  }

  async getEmbedding(text: string): Promise<Embedding> {
    return this.getCachedEmbedding(text, async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      try {
        const response = await fetch('https://api.cohere.ai/v1/embed', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            texts: [text],
            model: this.config.model,
            input_type: 'search_document'
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || `Cohere API error: ${response.status}`)
        }

        const data = await response.json()
        return data.embeddings[0]
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Cohere API timeout after ${this.config.timeout}ms`)
        }
        throw error
      }
    })
  }
}

/**
 * Helper: Create similarity provider from config
 */
export function createSimilarityProvider(
  provider: 'mock' | 'openai' | 'anthropic' | 'cohere',
  config: SimilarityProviderConfig = {}
): SimilarityProvider {
  switch (provider) {
    case 'mock':
      return new MockSimilarityProvider(config)
    case 'openai':
      return new OpenAISimilarityProvider(config)
    case 'anthropic':
      return new AnthropicSimilarityProvider(config)
    case 'cohere':
      return new CohereSimilarityProvider(config)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
