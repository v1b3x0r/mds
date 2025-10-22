/**
 * MDS v5.2 Phase 2.1 - Entity Similarity Adapter
 * Bridge between SimilarityProvider and Entity system
 *
 * Purpose:
 * - Adapt Entity objects to work with SimilarityProvider interface
 * - Provide high-level similarity operations for entities
 * - Enable clustering and grouping based on semantic similarity
 */

import type { SimilarityProvider } from './provider'

/**
 * Minimal interface for entities (avoids circular dependency)
 */
export interface SimilarEntity {
  id: string
  essence?: string
  m?: { essence?: string | Record<string, string> }
}

/**
 * Adapter for calculating similarity between entities
 */
export class EntitySimilarityAdapter {
  constructor(private provider: SimilarityProvider) {}

  /**
   * Get essence text from entity
   */
  private getEssence(entity: SimilarEntity): string {
    // Try entity.essence first
    if (entity.essence) {
      if (typeof entity.essence === 'string') {
        return entity.essence
      }
      // Multilingual: try common languages
      const langObj = entity.essence as Record<string, string>
      return langObj.en || langObj.th || langObj.ja || Object.values(langObj)[0] || entity.id
    }

    // Try entity.m.essence
    if (entity.m?.essence) {
      const essence = entity.m.essence
      if (typeof essence === 'string') {
        return essence
      }
      // Multilingual essence - prefer English, fallback to first available
      return essence.en || essence.th || essence.ja || Object.values(essence)[0] || entity.id
    }

    // Fallback to ID
    return entity.id
  }

  /**
   * Calculate similarity between two entities
   */
  async similarity(entityA: SimilarEntity, entityB: SimilarEntity): Promise<number> {
    const essenceA = this.getEssence(entityA)
    const essenceB = this.getEssence(entityB)

    return this.provider.similarity(essenceA, essenceB)
  }

  /**
   * Find entities similar to target
   * @param threshold Minimum similarity score (0..1)
   * @returns Array of { entity, similarity } sorted by similarity (descending)
   */
  async findSimilar(
    target: SimilarEntity,
    candidates: SimilarEntity[],
    threshold: number = 0.5
  ): Promise<Array<{ entity: SimilarEntity; similarity: number }>> {
    const results: Array<{ entity: SimilarEntity; similarity: number }> = []

    for (const candidate of candidates) {
      if (candidate.id === target.id) continue

      const sim = await this.similarity(target, candidate)
      if (sim >= threshold) {
        results.push({ entity: candidate, similarity: sim })
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity)

    return results
  }

  /**
   * Find top N most similar entities
   */
  async findTopN(
    target: SimilarEntity,
    candidates: SimilarEntity[],
    n: number = 5
  ): Promise<Array<{ entity: SimilarEntity; similarity: number }>> {
    const similarities: Array<{ entity: SimilarEntity; similarity: number }> = []

    for (const candidate of candidates) {
      if (candidate.id === target.id) continue

      const sim = await this.similarity(target, candidate)
      similarities.push({ entity: candidate, similarity: sim })
    }

    // Sort by similarity (descending) and take top N
    similarities.sort((a, b) => b.similarity - a.similarity)

    return similarities.slice(0, n)
  }

  /**
   * Calculate similarity matrix for entities
   */
  async similarityMatrix(entities: SimilarEntity[]): Promise<number[][]> {
    const essences = entities.map(e => this.getEssence(e))

    if (this.provider.similarityMatrix) {
      return this.provider.similarityMatrix(essences)
    }

    // Fallback: calculate pairwise
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
   * Group entities into clusters based on similarity
   * Uses simple greedy clustering: assign each entity to nearest cluster
   *
   * @param threshold Similarity threshold for cluster membership
   * @returns Array of clusters (each cluster is an array of entities)
   */
  async cluster(
    entities: SimilarEntity[],
    threshold: number = 0.7
  ): Promise<SimilarEntity[][]> {
    if (entities.length === 0) return []

    const clusters: SimilarEntity[][] = []
    const assigned = new Set<string>()

    for (const entity of entities) {
      if (assigned.has(entity.id)) continue

      // Create new cluster with this entity as seed
      const cluster = [entity]
      assigned.add(entity.id)

      // Find similar entities
      const similar = await this.findSimilar(entity, entities, threshold)

      for (const { entity: similarEntity } of similar) {
        if (!assigned.has(similarEntity.id)) {
          cluster.push(similarEntity)
          assigned.add(similarEntity.id)
        }
      }

      clusters.push(cluster)
    }

    return clusters
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.provider.name
  }

  /**
   * Clear provider cache
   */
  clearCache(): void {
    if (this.provider.clearCache) {
      this.provider.clearCache()
    }
  }
}

/**
 * Helper: Create entity similarity adapter
 */
export function createEntitySimilarityAdapter(provider: SimilarityProvider): EntitySimilarityAdapter {
  return new EntitySimilarityAdapter(provider)
}

/**
 * Helper: Find similar entities (standalone function)
 */
export async function findSimilarEntities(
  provider: SimilarityProvider,
  target: SimilarEntity,
  candidates: SimilarEntity[],
  threshold: number = 0.5
): Promise<Array<{ entity: SimilarEntity; similarity: number }>> {
  const adapter = new EntitySimilarityAdapter(provider)
  return adapter.findSimilar(target, candidates, threshold)
}

/**
 * Helper: Create similarity matrix (standalone function)
 */
export async function createSimilarityMatrix(
  provider: SimilarityProvider,
  entities: SimilarEntity[]
): Promise<number[][]> {
  const adapter = new EntitySimilarityAdapter(provider)
  return adapter.similarityMatrix(entities)
}

/**
 * Helper: Cluster entities by similarity (standalone function)
 */
export async function clusterBySimilarity(
  provider: SimilarityProvider,
  entities: SimilarEntity[],
  threshold: number = 0.7
): Promise<SimilarEntity[][]> {
  const adapter = new EntitySimilarityAdapter(provider)
  return adapter.cluster(entities, threshold)
}
