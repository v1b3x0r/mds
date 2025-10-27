/**
 * MDS v5 Phase 5 - Collision System
 * Spatial partitioning (Grid) + AABB collision detection
 *
 * Design principles:
 * - O(n) average case (vs O(n²) naive)
 * - Grid-based spatial hashing
 * - Simple AABB collision
 * - Elastic collision response
 */

import type { Entity } from '../0-foundation/entity'

/**
 * Axis-Aligned Bounding Box
 */
export interface AABB {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Collision pair
 */
export interface CollisionPair {
  a: Entity
  b: Entity
  penetration: number  // Overlap distance
}

/**
 * Spatial Grid for efficient collision detection
 * Divides space into cells, only checks entities in same/adjacent cells
 */
export class SpatialGrid {
  private cellSize: number
  private grid: Map<string, Entity[]>

  constructor(cellSize: number = 100, _bounds?: { width: number, height: number }) {
    this.cellSize = cellSize
    this.grid = new Map()
  }

  /**
   * Clear grid
   */
  clear(): void {
    this.grid.clear()
  }

  /**
   * Insert entity into grid
   */
  insert(entity: Entity): void {
    const aabb = this.getAABB(entity)
    const cells = this.getCellsForAABB(aabb)

    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, [])
      }
      this.grid.get(cellKey)!.push(entity)
    }
  }

  /**
   * Query entities near position
   */
  queryRadius(x: number, y: number, radius: number): Entity[] {
    const aabb: AABB = {
      minX: x - radius,
      maxX: x + radius,
      minY: y - radius,
      maxY: y + radius
    }

    const cells = this.getCellsForAABB(aabb)
    const entities = new Set<Entity>()

    for (const cellKey of cells) {
      const cellEntities = this.grid.get(cellKey)
      if (cellEntities) {
        for (const entity of cellEntities) {
          entities.add(entity)
        }
      }
    }

    return Array.from(entities)
  }

  /**
   * Get AABB for entity
   */
  private getAABB(entity: Entity): AABB {
    // TODO: Add radius to MdsManifest schema
    const radius = 16  // Default entity radius
    return {
      minX: entity.x - radius,
      maxX: entity.x + radius,
      minY: entity.y - radius,
      maxY: entity.y + radius
    }
  }

  /**
   * Get cell keys that overlap AABB
   */
  private getCellsForAABB(aabb: AABB): string[] {
    const cells: string[] = []

    const minCellX = Math.floor(aabb.minX / this.cellSize)
    const maxCellX = Math.floor(aabb.maxX / this.cellSize)
    const minCellY = Math.floor(aabb.minY / this.cellSize)
    const maxCellY = Math.floor(aabb.maxY / this.cellSize)

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        cells.push(`${cx},${cy}`)
      }
    }

    return cells
  }
}

/**
 * Collision detector
 */
export class CollisionDetector {
  private grid: SpatialGrid
  private entityRadius = new Map<string, number>()

  constructor(cellSize: number = 100, bounds: { width: number, height: number }) {
    this.grid = new SpatialGrid(cellSize, bounds)
  }

  /**
   * Update grid with current entities
   */
  update(entities: Entity[]): void {
    this.grid.clear()
    this.entityRadius.clear()

    for (const entity of entities) {
      this.grid.insert(entity)
      // TODO: Add radius to MdsManifest schema
      const radius = 16  // Default entity radius
      this.entityRadius.set(entity.id, radius)
    }
  }

  /**
   * Detect all collisions
   */
  detectCollisions(entities: Entity[]): CollisionPair[] {
    const pairs: CollisionPair[] = []
    const checked = new Set<string>()

    for (const entity of entities) {
      const radius = this.entityRadius.get(entity.id) ?? 16
      const nearby = this.grid.queryRadius(entity.x, entity.y, radius * 3)

      for (const other of nearby) {
        if (entity.id === other.id) continue

        // Avoid duplicate pairs
        const pairKey = entity.id < other.id
          ? `${entity.id}:${other.id}`
          : `${other.id}:${entity.id}`

        if (checked.has(pairKey)) continue
        checked.add(pairKey)

        // Check collision
        const collision = this.checkCollision(entity, other)
        if (collision) {
          pairs.push(collision)
        }
      }
    }

    return pairs
  }

  /**
   * Check collision between two entities
   */
  private checkCollision(a: Entity, b: Entity): CollisionPair | null {
    const radiusA = this.entityRadius.get(a.id) ?? 16
    const radiusB = this.entityRadius.get(b.id) ?? 16

    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const minDist = radiusA + radiusB

    if (dist < minDist && dist > 0) {
      return {
        a,
        b,
        penetration: minDist - dist
      }
    }

    return null
  }

  /**
   * Resolve collision (elastic collision response)
   */
  static resolve(pair: CollisionPair): void {
    const { a, b, penetration } = pair

    // Calculate collision normal
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1

    const nx = dx / dist
    const ny = dy / dist

    // Separate entities
    const separation = penetration / 2
    a.x -= nx * separation
    a.y -= ny * separation
    b.x += nx * separation
    b.y += ny * separation

    // Elastic collision response (conserve momentum)
    const massA = a.m.physics?.mass ?? 1
    const massB = b.m.physics?.mass ?? 1

    // Relative velocity
    const dvx = b.vx - a.vx
    const dvy = b.vy - a.vy

    // Relative velocity in collision normal direction
    const dvn = dvx * nx + dvy * ny

    // Don't resolve if velocities are separating
    if (dvn > 0) return

    // Coefficient of restitution (bounciness)
    const restitution = Math.min(
      a.m.physics?.bounce ?? 0.5,
      b.m.physics?.bounce ?? 0.5
    )

    // Impulse scalar
    const impulse = -(1 + restitution) * dvn / (1 / massA + 1 / massB)

    // Apply impulse
    a.vx -= (impulse * nx) / massA
    a.vy -= (impulse * ny) / massA
    b.vx += (impulse * nx) / massB
    b.vy += (impulse * ny) / massB
  }
}

/**
 * Simple collision check (no spatial partitioning)
 * For small entity counts (<50)
 */
export function checkCollisionSimple(
  a: Entity,
  b: Entity,
  radiusA: number = 16,
  radiusB: number = 16
): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const minDist = radiusA + radiusB

  return dist < minDist
}

/**
 * Get entity radius (helper)
 * TODO: Add radius to MdsManifest schema
 */
export function getEntityRadius(_entity: Entity): number {
  return 16  // Default entity radius
}
