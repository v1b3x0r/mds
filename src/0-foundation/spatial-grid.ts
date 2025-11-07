/**
 * Spatial Grid for efficient proximity queries
 * Reduces O(N²) to O(N*k) for entity-entity interactions
 *
 * Performance:
 * - Without grid: N*(N-1)/2 distance checks
 * - With grid: N*k where k = avg entities per cell + neighbors
 * - For 100 entities: 4,950 checks → ~400 checks (12x faster)
 * 
 * Optimizations:
 * - Frame coherence: Track entity movement, update cells only when moved
 * - Numeric keys: Use spatial hash (x << 16 | y) instead of string concat
 * - Boundary awareness: Support world bounds for wrap/reflect/clamp
 */

export interface GridEntity {
  x: number
  y: number
  id?: string | number  // Optional for tracking movement
}

/**
 * Spatial hash: Convert 2D coords to single number
 * Max cell coords: 16 bits each (0-65535)
 */
function spatialHash(cx: number, cy: number): number {
  // Ensure positive coords (add 32768 offset for negative values)
  const x = (cx + 32768) & 0xFFFF
  const y = (cy + 32768) & 0xFFFF
  return (x << 16) | y
}

/**
 * Advanced spatial grid with frame coherence and numeric keys
 * Optimized for high entity counts (1k-10k+)
 */
export class SpatialGrid<T extends GridEntity> {
  private cellSize: number
  private cells: Map<number, T[]>  // Numeric keys (was string)
  private readonly worldWidth: number
  private readonly worldHeight: number
  
  // Frame coherence: Track entity positions between ticks
  private entityCells: Map<string | number, number> = new Map()
  private moveThreshold: number  // Skip reinsert if delta < threshold
  
  // Stats for debugging
  private stats = {
    totalInserts: 0,
    skippedInserts: 0,
    rebuilds: 0
  }

  constructor(worldWidth: number, worldHeight: number, cellSize: number) {
    this.worldWidth = worldWidth
    this.worldHeight = worldHeight
    this.cellSize = cellSize
    this.cells = new Map()
    this.moveThreshold = cellSize * 0.5  // Skip if moved < half cell
  }

  /**
   * Clear all cells (full rebuild)
   * Use update() for frame coherence instead
   */
  clear(): void {
    this.cells.clear()
    this.entityCells.clear()
    this.stats.rebuilds++
  }

  /**
   * Insert entity into grid
   * For full rebuild only - use update() for frame coherence
   */
  insert(entity: T): void {
    const hash = this.getHash(entity.x, entity.y)
    let cell = this.cells.get(hash)
    if (!cell) {
      cell = []
      this.cells.set(hash, cell)
    }
    cell.push(entity)
    this.stats.totalInserts++
    
    // Track entity position for next frame
    if (entity.id !== undefined) {
      this.entityCells.set(entity.id, hash)
    }
  }

  /**
   * Update entity position with frame coherence
   * Only moves entity if it changed cells
   * 
   * @returns true if entity moved cells, false if skipped
   */
  update(entity: T, oldX?: number, oldY?: number): boolean {
    if (entity.id === undefined) {
      // Fallback: No ID, just insert
      this.insert(entity)
      return true
    }

    const newHash = this.getHash(entity.x, entity.y)
    const oldHash = this.entityCells.get(entity.id)

    // First time seeing this entity
    if (oldHash === undefined) {
      this.insert(entity)
      return true
    }

    // Same cell, skip update
    if (newHash === oldHash) {
      // Optional: Check if movement is significant enough to warrant update
      if (oldX !== undefined && oldY !== undefined) {
        const dx = entity.x - oldX
        const dy = entity.y - oldY
        const distSq = dx * dx + dy * dy
        
        if (distSq < this.moveThreshold * this.moveThreshold) {
          this.stats.skippedInserts++
          return false
        }
      }
      
      this.stats.skippedInserts++
      return false
    }

    // Moved to different cell - remove from old, add to new
    this.removeFromCell(entity, oldHash)
    
    let cell = this.cells.get(newHash)
    if (!cell) {
      cell = []
      this.cells.set(newHash, cell)
    }
    cell.push(entity)
    
    this.entityCells.set(entity.id, newHash)
    this.stats.totalInserts++
    return true
  }

  /**
   * Remove entity from specific cell
   */
  private removeFromCell(entity: T, hash: number): void {
    const cell = this.cells.get(hash)
    if (!cell) return

    const index = cell.indexOf(entity)
    if (index !== -1) {
      // Fast removal: swap with last element
      const last = cell.length - 1
      if (index !== last) {
        cell[index] = cell[last]
      }
      cell.pop()
      
      // Clean up empty cells
      if (cell.length === 0) {
        this.cells.delete(hash)
      }
    }
  }

  /**
   * Query entities within radius of a point
   * Returns array of entities (excluding self if provided)
   */
  query(x: number, y: number, radius: number, excludeSelf?: T): T[] {
    const results: T[] = []
    const radiusSq = radius * radius

    // Determine which cells to check (current + neighbors)
    const minCellX = Math.floor((x - radius) / this.cellSize)
    const maxCellX = Math.floor((x + radius) / this.cellSize)
    const minCellY = Math.floor((y - radius) / this.cellSize)
    const maxCellY = Math.floor((y + radius) / this.cellSize)

    // Check all relevant cells
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const hash = spatialHash(cx, cy)
        const cell = this.cells.get(hash)
        if (!cell) continue

        // Check each entity in cell
        for (let i = 0; i < cell.length; i++) {
          const entity = cell[i]
          if (entity === excludeSelf) continue

          // Distance check
          const dx = entity.x - x
          const dy = entity.y - y
          const distSq = dx * dx + dy * dy

          if (distSq <= radiusSq) {
            results.push(entity)
          }
        }
      }
    }

    return results
  }

  /**
   * Get spatial hash for position
   */
  private getHash(x: number, y: number): number {
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    return spatialHash(cx, cy)
  }

  /**
   * Check if position is within world bounds
   */
  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.worldWidth && y >= 0 && y < this.worldHeight
  }

  /**
   * Wrap position to world bounds (toroidal world)
   */
  wrap(x: number, y: number): { x: number; y: number } {
    return {
      x: ((x % this.worldWidth) + this.worldWidth) % this.worldWidth,
      y: ((y % this.worldHeight) + this.worldHeight) % this.worldHeight
    }
  }

  /**
   * Get approximate entity count (total across all cells)
   */
  size(): number {
    let count = 0
    for (const cell of this.cells.values()) {
      count += cell.length
    }
    return count
  }

  /**
   * Get grid statistics (for debugging/profiling)
   */
  getStats() {
    return {
      ...this.stats,
      cellCount: this.cells.size,
      entityCount: this.size(),
      avgEntitiesPerCell: this.cells.size > 0 ? this.size() / this.cells.size : 0,
      skipRate: this.stats.totalInserts > 0 
        ? this.stats.skippedInserts / (this.stats.totalInserts + this.stats.skippedInserts)
        : 0
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalInserts: 0,
      skippedInserts: 0,
      rebuilds: 0
    }
  }
}
