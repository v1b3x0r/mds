/**
 * Spatial Grid for efficient proximity queries
 * Reduces O(N²) to O(N) for entity-entity interactions
 *
 * Performance:
 * - Without grid: N*(N-1)/2 distance checks
 * - With grid: N*k where k = avg entities per cell + neighbors
 * - For 100 entities: 4,950 checks → ~400 checks (12x faster)
 */

export interface GridEntity {
  x: number
  y: number
}

/**
 * Simple spatial grid for fast proximity queries
 * Divides world space into cells to avoid checking distant entities
 */
export class SpatialGrid<T extends GridEntity> {
  private cellSize: number
  private cells: Map<string, T[]>
  // private readonly worldWidth: number  // Reserved for bounds checking
  // private readonly worldHeight: number

  constructor(worldWidth: number, worldHeight: number, cellSize: number) {
    // this.worldWidth = worldWidth
    // this.worldHeight = worldHeight
    this.cellSize = cellSize
    this.cells = new Map()
    
    // Suppress unused parameter warnings (kept for API consistency)
    void worldWidth
    void worldHeight
  }

  /**
   * Clear all cells (call at start of each tick)
   */
  clear(): void {
    this.cells.clear()
  }

  /**
   * Insert entity into grid
   */
  insert(entity: T): void {
    const cellKey = this.getCellKey(entity.x, entity.y)
    let cell = this.cells.get(cellKey)
    if (!cell) {
      cell = []
      this.cells.set(cellKey, cell)
    }
    cell.push(entity)
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
        const cellKey = `${cx},${cy}`
        const cell = this.cells.get(cellKey)
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
   * Get cell key for position
   */
  private getCellKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    return `${cx},${cy}`
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
}
