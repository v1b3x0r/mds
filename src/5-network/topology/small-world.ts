/**
 * MDS v5.5 - Network Topology
 * Small-World Network builder (Watts-Strogatz model)
 *
 * Design principles:
 * - Local clustering (entities connect to neighbors)
 * - Long-range shortcuts (random rewiring)
 * - Scalable (efficient for 100+ entities)
 * - Periodic reshuffling prevents stagnation
 */

import type { Entity } from '@mds/0-foundation/entity'

/**
 * Network topology configuration
 */
export interface NetworkConfig {
  k?: number           // Each entity connects to k nearest neighbors (default: 8)
  p?: number           // Rewiring probability (0..1, default: 0.2)
  bidirectional?: boolean  // Create bidirectional links (default: true)
}

/**
 * Network statistics
 */
export interface NetworkStats {
  nodeCount: number
  edgeCount: number
  averageDegree: number
  clusteringCoefficient: number
}

/**
 * Cognitive Network - Small-World topology builder
 *
 * @example
 * const network = new CognitiveNetwork({ k: 8, p: 0.2 })
 *
 * // Build initial network
 * network.build(entities)
 *
 * // Periodic rewiring (prevent stagnation)
 * setInterval(() => network.rewire(), 30000)  // Every 30 seconds
 *
 * // Get statistics
 * const stats = network.getStats()
 * console.log(`Average degree: ${stats.averageDegree}`)
 */
export class CognitiveNetwork {
  private config: Required<NetworkConfig>
  private entities: Entity[] = []

  constructor(config: NetworkConfig = {}) {
    this.config = {
      k: config.k ?? 8,
      p: config.p ?? 0.2,
      bidirectional: config.bidirectional ?? true
    }

    // Validate config
    if (this.config.k < 2) {
      throw new Error('k must be at least 2')
    }
    if (this.config.p < 0 || this.config.p > 1) {
      throw new Error('p must be between 0 and 1')
    }
  }

  /**
   * Build small-world network from entity list
   *
   * @param entities - Entities to connect
   * @param clearExisting - Clear existing links before building (default: true)
   */
  build(entities: Entity[], clearExisting: boolean = true) {
    if (entities.length < this.config.k + 1) {
      throw new Error(`Need at least ${this.config.k + 1} entities for k=${this.config.k}`)
    }

    this.entities = entities

    // Clear existing links if requested
    if (clearExisting) {
      for (const entity of entities) {
        if (entity.cognitiveLinks) {
          entity.cognitiveLinks.clear()
        }
      }
    }

    // Step 1: Create ring lattice (connect to k nearest neighbors)
    this.createRingLattice()

    // Step 2: Rewire edges with probability p
    this.rewireEdges()
  }

  /**
   * Create ring lattice (each node connects to k/2 neighbors on each side)
   */
  private createRingLattice() {
    const n = this.entities.length
    const halfK = Math.floor(this.config.k / 2)

    for (let i = 0; i < n; i++) {
      const entity = this.entities[i]

      for (let j = 1; j <= halfK; j++) {
        // Connect to right neighbors
        const rightIdx = (i + j) % n
        const rightEntity = this.entities[rightIdx]

        entity.connectTo(rightEntity, {
          strength: 0.5,
          bidirectional: this.config.bidirectional
        })
      }
    }
  }

  /**
   * Rewire edges with probability p
   */
  private rewireEdges() {
    const n = this.entities.length

    for (let i = 0; i < n; i++) {
      const entity = this.entities[i]

      if (!entity.cognitiveLinks) continue

      // Get current connections (copy to avoid mutation during iteration)
      const connections = Array.from(entity.cognitiveLinks.keys())

      for (const targetId of connections) {
        // Rewire with probability p
        if (Math.random() < this.config.p) {
          // Disconnect old link
          entity.disconnectFrom(targetId)

          // Connect to random entity (not self, not already connected)
          let attempts = 0
          while (attempts < 10) {
            const randomIdx = Math.floor(Math.random() * n)
            const randomEntity = this.entities[randomIdx]

            if (
              randomEntity.id !== entity.id &&
              !entity.isConnectedTo(randomEntity.id)
            ) {
              entity.connectTo(randomEntity, {
                strength: 0.5,
                bidirectional: this.config.bidirectional
              })
              break
            }

            attempts++
          }
        }
      }
    }
  }

  /**
   * Rewire network (periodic maintenance)
   * Randomly rewires a percentage of edges to prevent stagnation
   *
   * @param percentage - Percentage of edges to rewire (0..1, default: 0.1)
   */
  rewire(percentage: number = 0.1) {
    if (this.entities.length === 0) return

    const n = this.entities.length
    const edgesToRewire = Math.floor(this.getTotalEdges() * percentage)

    for (let i = 0; i < edgesToRewire; i++) {
      // Pick random entity
      const entityIdx = Math.floor(Math.random() * n)
      const entity = this.entities[entityIdx]

      if (!entity.cognitiveLinks || entity.cognitiveLinks.size === 0) continue

      // Pick random connection to rewire
      const connections = Array.from(entity.cognitiveLinks.keys())
      const oldTargetId = connections[Math.floor(Math.random() * connections.length)]

      // Disconnect
      entity.disconnectFrom(oldTargetId)

      // Connect to new random entity
      let attempts = 0
      while (attempts < 10) {
        const randomIdx = Math.floor(Math.random() * n)
        const randomEntity = this.entities[randomIdx]

        if (
          randomEntity.id !== entity.id &&
          !entity.isConnectedTo(randomEntity.id)
        ) {
          entity.connectTo(randomEntity, {
            strength: 0.5,
            bidirectional: this.config.bidirectional
          })
          break
        }

        attempts++
      }
    }
  }

  /**
   * Get network statistics
   */
  getStats(): NetworkStats {
    const nodeCount = this.entities.length
    const edgeCount = this.getTotalEdges()
    const averageDegree = nodeCount > 0 ? edgeCount / nodeCount : 0
    const clusteringCoefficient = this.calculateClusteringCoefficient()

    return {
      nodeCount,
      edgeCount,
      averageDegree,
      clusteringCoefficient
    }
  }

  /**
   * Get total edge count (sum of all connections)
   */
  private getTotalEdges(): number {
    let total = 0

    for (const entity of this.entities) {
      if (entity.cognitiveLinks) {
        total += entity.cognitiveLinks.size
      }
    }

    // If bidirectional, each edge is counted twice
    return this.config.bidirectional ? total / 2 : total
  }

  /**
   * Calculate clustering coefficient (measure of local clustering)
   * C = (# of closed triplets) / (# of possible triplets)
   */
  private calculateClusteringCoefficient(): number {
    if (this.entities.length < 3) return 0

    let totalCoefficient = 0
    let nodeCount = 0

    for (const entity of this.entities) {
      if (!entity.cognitiveLinks || entity.cognitiveLinks.size < 2) continue

      const neighbors = Array.from(entity.cognitiveLinks.keys())
      const k = neighbors.length

      // Count connections between neighbors
      let connections = 0
      for (let i = 0; i < neighbors.length; i++) {
        const neighborA = this.entities.find(e => e.id === neighbors[i])
        if (!neighborA) continue

        for (let j = i + 1; j < neighbors.length; j++) {
          if (neighborA.isConnectedTo(neighbors[j])) {
            connections++
          }
        }
      }

      // Clustering coefficient for this node
      const possibleConnections = (k * (k - 1)) / 2
      const localCoefficient = possibleConnections > 0 ? connections / possibleConnections : 0

      totalCoefficient += localCoefficient
      nodeCount++
    }

    return nodeCount > 0 ? totalCoefficient / nodeCount : 0
  }

  /**
   * Get entity count
   */
  size(): number {
    return this.entities.length
  }

  /**
   * Clear all connections
   */
  clear() {
    for (const entity of this.entities) {
      if (entity.cognitiveLinks) {
        entity.cognitiveLinks.clear()
      }
    }
    this.entities = []
  }
}

/**
 * Create cognitive network with default config
 */
export function createCognitiveNetwork(config?: NetworkConfig): CognitiveNetwork {
  return new CognitiveNetwork(config)
}
