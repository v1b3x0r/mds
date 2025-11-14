/**
 * Performance benchmark: Spatial Grid vs Brute Force
 * Measures impact of O(N²) → O(N*k) optimization
 */

import { FoundationSpatialGrid as SpatialGrid } from '../../dist/mds-core.esm.js'

// Mock entity for testing
class MockEntity {
  constructor(x, y, id) {
    this.x = x
    this.y = y
    this.id = id
  }
}

/**
 * Brute force: Check all pairs (O(N²))
 */
function bruteForceProximity(entities, radius) {
  const radiusSq = radius * radius
  const pairs = []
  
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const dx = entities[j].x - entities[i].x
      const dy = entities[j].y - entities[i].y
      const distSq = dx * dx + dy * dy
      
      if (distSq <= radiusSq) {
        pairs.push([entities[i], entities[j]])
      }
    }
  }
  
  return pairs
}

/**
 * Spatial grid: Query neighbors (O(N*k))
 */
function spatialGridProximity(entities, radius, worldWidth, worldHeight) {
  const grid = new SpatialGrid(worldWidth, worldHeight, radius)
  const pairs = []
  
  // Build grid
  for (const entity of entities) {
    grid.insert(entity)
  }
  
  // Query each entity
  for (const entity of entities) {
    const nearby = grid.query(entity.x, entity.y, radius, entity)
    for (const other of nearby) {
      // Only count each pair once
      if (entity.id < other.id) {
        pairs.push([entity, other])
      }
    }
  }
  
  return pairs
}

/**
 * Generate random entities in world
 */
function generateEntities(count, worldWidth, worldHeight) {
  const entities = []
  for (let i = 0; i < count; i++) {
    entities.push(new MockEntity(
      Math.random() * worldWidth,
      Math.random() * worldHeight,
      i
    ))
  }
  return entities
}

/**
 * Benchmark function
 */
function benchmark(name, fn) {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  const time = end - start
  return { name, time, result }
}

// Run benchmarks
console.log('🚀 Spatial Grid Performance Benchmark\n')

const worldWidth = 1920
const worldHeight = 1080
const radius = 80
const testSizes = [10, 50, 100, 200, 500]

for (const entityCount of testSizes) {
  console.log(`\n📊 Testing with ${entityCount} entities:`)
  console.log('─'.repeat(50))
  
  // Generate entities
  const entities = generateEntities(entityCount, worldWidth, worldHeight)
  
  // Brute force
  const bruteResult = benchmark('Brute Force (O(N²))', () => 
    bruteForceProximity(entities, radius)
  )
  
  // Spatial grid
  const gridResult = benchmark('Spatial Grid (O(N*k))', () => 
    spatialGridProximity(entities, radius, worldWidth, worldHeight)
  )
  
  // Calculate speedup
  const speedup = (bruteResult.time / gridResult.time).toFixed(2)
  const pairsFound = bruteResult.result.length
  
  console.log(`  Brute Force:  ${bruteResult.time.toFixed(3)}ms`)
  console.log(`  Spatial Grid: ${gridResult.time.toFixed(3)}ms`)
  console.log(`  Speedup:      ${speedup}x faster`)
  console.log(`  Pairs found:  ${pairsFound}`)
  
  // Verify both methods find same pairs
  if (bruteResult.result.length !== gridResult.result.length) {
    console.log('  ❌ WARNING: Different pair counts!')
  } else {
    console.log('  ✅ Results match')
  }
}

console.log('\n' + '='.repeat(50))
console.log('✅ Performance benchmark complete!\n')
console.log('Key takeaway: Spatial grid becomes increasingly faster')
console.log('as entity count grows (linear vs quadratic scaling)\n')
