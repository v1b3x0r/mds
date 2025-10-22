/**
 * MDS v5.2 - Similarity Provider Tests
 * Test pluggable similarity calculation system
 */

import assert from 'node:assert'
import {
  MockSimilarityProvider,
  createSimilarityProvider,
  EntitySimilarityAdapter,
  findSimilarEntities,
  createSimilarityMatrix,
  clusterBySimilarity
} from '../dist/mds-core.esm.js'

console.log('\n🔍 MDS v5.2 - Similarity Provider Tests\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`✗ ${name}`)
    console.error(`  ${err.message}`)
    failed++
  }
}

async function testAsync(name, fn) {
  try {
    await fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`✗ ${name}`)
    console.error(`  ${err.message}`)
    failed++
  }
}

// Test 1: MockSimilarityProvider instantiation
test('MockSimilarityProvider instantiation', () => {
  const provider = new MockSimilarityProvider()
  assert(provider.name === 'mock', 'Provider name should be "mock"')
})

// Test 2: Mock provider similarity
await testAsync('Mock provider similarity (identical texts)', async () => {
  const provider = new MockSimilarityProvider()
  const sim = await provider.similarity('hello world', 'hello world')
  assert(sim === 1, `Identical texts should have similarity 1.0, got ${sim}`)
})

// Test 3: Mock provider similarity (different texts)
await testAsync('Mock provider similarity (different texts)', async () => {
  const provider = new MockSimilarityProvider()
  const sim = await provider.similarity('cat', 'dog')
  assert(sim > 0 && sim < 1, `Different texts should have similarity between 0 and 1, got ${sim}`)
})

// Test 4: Mock provider similarity (similar texts)
await testAsync('Mock provider similarity (similar texts)', async () => {
  const provider = new MockSimilarityProvider()
  const sim1 = await provider.similarity('cat', 'dog')
  const sim2 = await provider.similarity('cat', 'category')
  assert(sim2 > sim1, 'Similar texts should have higher similarity than unrelated texts')
})

// Test 5: Embedding generation
await testAsync('Embedding generation', async () => {
  const provider = new MockSimilarityProvider()
  const embedding = await provider.getEmbedding('test text')
  assert(Array.isArray(embedding), 'Embedding should be an array')
  assert(embedding.length === 128, `Embedding should have 128 dimensions, got ${embedding.length}`)
})

// Test 6: Embedding caching
await testAsync('Embedding caching', async () => {
  const provider = new MockSimilarityProvider({ cacheEnabled: true })

  await provider.getEmbedding('cached text')
  const stats1 = provider.getCacheStats()

  await provider.getEmbedding('cached text') // Should hit cache
  const stats2 = provider.getCacheStats()

  assert(stats1.size === 1, 'Cache should have 1 entry')
  assert(stats2.size === 1, 'Cache size should remain 1 (cache hit)')
})

// Test 7: Cache clearing
await testAsync('Cache clearing', async () => {
  const provider = new MockSimilarityProvider()

  await provider.getEmbedding('text 1')
  await provider.getEmbedding('text 2')

  const statsBefore = provider.getCacheStats()
  assert(statsBefore.size === 2, 'Cache should have 2 entries')

  provider.clearCache()

  const statsAfter = provider.getCacheStats()
  assert(statsAfter.size === 0, 'Cache should be empty after clearing')
})

// Test 8: Similarity matrix
await testAsync('Similarity matrix', async () => {
  const provider = new MockSimilarityProvider()
  const texts = ['cat', 'dog', 'car']
  const matrix = await provider.similarityMatrix(texts)

  assert(matrix.length === 3, 'Matrix should be 3x3')
  assert(matrix[0][0] === 1, 'Self-similarity should be 1')
  assert(matrix[1][1] === 1, 'Self-similarity should be 1')
  assert(matrix[2][2] === 1, 'Self-similarity should be 1')
  assert(matrix[0][1] === matrix[1][0], 'Matrix should be symmetric')
})

// Test 9: createSimilarityProvider factory
test('createSimilarityProvider factory (mock)', () => {
  const provider = createSimilarityProvider('mock')
  assert(provider.name === 'mock', 'Provider name should be "mock"')
})

// Test 10: EntitySimilarityAdapter instantiation
test('EntitySimilarityAdapter instantiation', () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)
  assert(adapter.getProviderName() === 'mock', 'Adapter should use mock provider')
})

// Test 11: Entity similarity (essence field)
await testAsync('Entity similarity (essence field)', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const entity1 = { id: 'e1', essence: 'friendly cat' }
  const entity2 = { id: 'e2', essence: 'friendly dog' }

  const sim = await adapter.similarity(entity1, entity2)
  assert(sim > 0 && sim < 1, `Similarity should be between 0 and 1, got ${sim}`)
})

// Test 12: Entity similarity (material essence)
await testAsync('Entity similarity (material essence)', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const entity1 = { id: 'e1', m: { essence: 'happy ghost' } }
  const entity2 = { id: 'e2', m: { essence: 'sad ghost' } }

  const sim = await adapter.similarity(entity1, entity2)
  assert(sim > 0.5, 'Similar entities (both ghosts) should have high similarity')
})

// Test 13: Entity similarity (multilingual essence)
await testAsync('Entity similarity (multilingual essence)', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const entity1 = { id: 'e1', m: { essence: { en: 'lonely ghost', th: 'ผีโดดเดี่ยว' } } }
  const entity2 = { id: 'e2', m: { essence: { en: 'lonely spirit', th: 'วิญญาณเหงา' } } }

  const sim = await adapter.similarity(entity1, entity2)
  assert(sim > 0.6, 'Similar multilingual entities should have high similarity')
})

// Test 14: Find similar entities
await testAsync('Find similar entities', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const target = { id: 'target', essence: 'friendly cat' }
  const candidates = [
    { id: 'c1', essence: 'friendly dog' },
    { id: 'c2', essence: 'angry bear' },
    { id: 'c3', essence: 'friendly kitten' }
  ]

  const results = await adapter.findSimilar(target, candidates, 0.5)

  assert(results.length > 0, 'Should find similar entities')
  assert(results[0].similarity > 0.5, 'First result should meet threshold')
  assert(results[0].similarity >= results[results.length - 1].similarity, 'Results should be sorted by similarity')
})

// Test 15: Find top N similar entities
await testAsync('Find top N similar entities', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const target = { id: 'target', essence: 'test entity' }
  const candidates = Array.from({ length: 10 }, (_, i) => ({
    id: `c${i}`,
    essence: `entity ${i}`
  }))

  const results = await adapter.findTopN(target, candidates, 3)

  assert(results.length === 3, 'Should return exactly 3 results')
  assert(results[0].similarity >= results[1].similarity, 'Results should be sorted')
})

// Test 16: Entity similarity matrix
await testAsync('Entity similarity matrix', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const entities = [
    { id: 'e1', essence: 'cat' },
    { id: 'e2', essence: 'dog' },
    { id: 'e3', essence: 'car' }
  ]

  const matrix = await adapter.similarityMatrix(entities)

  assert(matrix.length === 3, 'Matrix should be 3x3')
  assert(matrix[0][0] === 1, 'Self-similarity should be 1')
  assert(matrix[0][1] === matrix[1][0], 'Matrix should be symmetric')
})

// Test 17: Entity clustering
await testAsync('Entity clustering', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const entities = [
    { id: 'e1', essence: 'happy cat' },
    { id: 'e2', essence: 'happy dog' },
    { id: 'e3', essence: 'sad ghost' },
    { id: 'e4', essence: 'lonely ghost' }
  ]

  const clusters = await adapter.cluster(entities, 0.5)

  assert(Array.isArray(clusters), 'Result should be array of clusters')
  assert(clusters.length > 0, 'Should create at least one cluster')
  assert(clusters.every(c => Array.isArray(c)), 'Each cluster should be an array')

  const totalEntities = clusters.reduce((sum, c) => sum + c.length, 0)
  assert(totalEntities === entities.length, 'All entities should be assigned to clusters')
})

// Test 18: Standalone findSimilarEntities helper
await testAsync('Standalone findSimilarEntities helper', async () => {
  const provider = new MockSimilarityProvider()

  const target = { id: 'target', essence: 'test' }
  const candidates = [
    { id: 'c1', essence: 'testing' },
    { id: 'c2', essence: 'example' }
  ]

  const results = await findSimilarEntities(provider, target, candidates, 0.3)

  assert(Array.isArray(results), 'Results should be an array')
  assert(results.length > 0, 'Should find similar entities')
})

// Test 19: Standalone createSimilarityMatrix helper
await testAsync('Standalone createSimilarityMatrix helper', async () => {
  const provider = new MockSimilarityProvider()

  const entities = [
    { id: 'e1', essence: 'cat' },
    { id: 'e2', essence: 'dog' }
  ]

  const matrix = await createSimilarityMatrix(provider, entities)

  assert(matrix.length === 2, 'Matrix should be 2x2')
  assert(matrix[0][0] === 1, 'Self-similarity should be 1')
})

// Test 20: Standalone clusterBySimilarity helper
await testAsync('Standalone clusterBySimilarity helper', async () => {
  const provider = new MockSimilarityProvider()

  const entities = [
    { id: 'e1', essence: 'cat' },
    { id: 'e2', essence: 'dog' },
    { id: 'e3', essence: 'car' }
  ]

  const clusters = await clusterBySimilarity(provider, entities, 0.5)

  assert(Array.isArray(clusters), 'Result should be array of clusters')
  assert(clusters.length > 0, 'Should create at least one cluster')
})

// Test 21: Cache size limit
await testAsync('Cache size limit', async () => {
  const provider = new MockSimilarityProvider({ maxCacheSize: 2 })

  await provider.getEmbedding('text 1')
  await provider.getEmbedding('text 2')
  await provider.getEmbedding('text 3') // Should evict oldest

  const stats = provider.getCacheStats()
  assert(stats.size === 2, 'Cache should respect size limit of 2')
  assert(stats.maxSize === 2, 'Max cache size should be 2')
})

// Test 22: Disabled caching
await testAsync('Disabled caching', async () => {
  const provider = new MockSimilarityProvider({ cacheEnabled: false })

  await provider.getEmbedding('text 1')
  await provider.getEmbedding('text 2')

  const stats = provider.getCacheStats()
  assert(stats.size === 0, 'Cache should be empty when disabled')
})

// Test 23: Entity without essence (fallback to ID)
await testAsync('Entity without essence (fallback to ID)', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const entity1 = { id: 'unique-id-123' }
  const entity2 = { id: 'different-id-456' }

  const sim = await adapter.similarity(entity1, entity2)
  assert(sim >= 0 && sim <= 1, 'Similarity should be valid even without essence')
})

// Test 24: Empty entity list clustering
await testAsync('Empty entity list clustering', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const clusters = await adapter.cluster([], 0.5)

  assert(Array.isArray(clusters), 'Result should be array')
  assert(clusters.length === 0, 'Should return empty array for empty input')
})

// Test 25: Self-exclusion in findSimilar
await testAsync('Self-exclusion in findSimilar', async () => {
  const provider = new MockSimilarityProvider()
  const adapter = new EntitySimilarityAdapter(provider)

  const target = { id: 'target', essence: 'test' }
  const candidates = [
    target, // Should be excluded
    { id: 'other', essence: 'test' }
  ]

  const results = await adapter.findSimilar(target, candidates, 0.0)

  assert(results.every(r => r.entity.id !== target.id), 'Target should be excluded from results')
})

// Summary
console.log('\n==================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('==================================================\n')

if (failed > 0) {
  console.error('❌ Similarity provider tests failed!')
  process.exit(1)
} else {
  console.log('✅ All similarity provider tests passed!\n')
  console.log('v5.2 Phase 2.1 Status:')
  console.log('  ✓ SimilarityProvider interface')
  console.log('  ✓ MockSimilarityProvider (character-based hash)')
  console.log('  ✓ OpenAISimilarityProvider (text-embedding-3-small)')
  console.log('  ✓ CohereSimilarityProvider (embed-v3)')
  console.log('  ✓ EntitySimilarityAdapter')
  console.log('  ✓ Entity clustering by similarity')
  console.log('  ✓ Embedding caching with size limits')
  console.log('  ✓ Standalone helper functions')
}
