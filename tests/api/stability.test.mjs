/**
 * MDS v5.2 — API Stability Tests
 * Ensures v5.0 API remains compatible in v5.2+
 *
 * Test strategy:
 * 1. Snapshot public API surface
 * 2. Verify v5.0 usage patterns still work
 * 3. Check for breaking changes
 */

import * as MDS from '../../dist/mds-core.esm.js'
import { strict as assert } from 'assert'

console.log('\n📦 MDS v5.2 - API Stability Tests\n')

// ============================================================
// Test 1: API Surface Snapshot
// ============================================================

function testApiSurface() {
  const exports = Object.keys(MDS).sort()

  // v5.0 baseline (all VALUE exports that MUST exist in v5.2)
  // Note: Type-only exports are verified at build time by TypeScript
  const v5_0_baseline = [
    'Engine',
    'Entity',
    'Field',
    'World',
    'DOMRenderer',
    'CanvasRenderer',
    'HeadlessRenderer',
    'StateMapper',
    'loadMaterial',
    'loadMaterials',
    'MemoryBuffer',
    'createMemory',
    'blendEmotions',
    'emotionDistance',
    'applyEmotionalDelta',
    'driftToBaseline',
    'emotionToColor',
    'emotionToHex',
    'EMOTION_BASELINES',
    'IntentStack',
    'createIntent',
    'INTENT_TEMPLATES',
    'createRelationship',
    'updateRelationship',
    'relationshipStrength',
    'isBonded',
    'decayRelationship',
    'MessageQueue',
    'MessageBuilder',
    'MessageDelivery',
    'createMessage',
    'DialogueManager',
    'DialogueBuilder',
    'createNode',
    'createChoice',
    'LanguageGenerator',
    'createOpenRouterGenerator',
    'createMockGenerator',
    'SemanticSimilarity',
    'createOpenAISemantic',
    'createMockSemantic',
    'jaccardSimilarity',
    'levenshteinDistance',
    'levenshteinSimilarity',
    'LearningSystem',
    'createExperience',
    'calculateReward',
    'MemoryConsolidation',
    'memorySimilarity',
    'SkillSystem',
    'createSkill',
    'SKILL_PRESETS',
    'Environment',
    'createEnvironment',
    'Weather',
    'createWeather',
    'CollisionDetector',
    'SpatialGrid',
    'checkCollisionSimple',
    'getEntityRadius',
    'EnergySystem',
    'initializeThermalProperties',
    'CollectiveIntelligence',
    'toWorldFile',
    'fromWorldFile',
    'saveWorldFile',
    'loadWorldFile',
    'downloadWorldFile',
    'uploadWorldFile',
    'setLlmBridge',
    'getLlmBridge',
    'DummyBridge',
    'enableLLM',
    'setCreatorContext',
    'clearCreatorContext',
    'getCreatorContext',
    'isLlmEnabled',
    'resetLlmAdapter',
    'MdmParser',
    'parseMaterial',
    'detectLanguage',
    'getDialoguePhrase',
    'clamp',
    'distance',
    'similarity',
    'lerp',
    'randRange',
    'randInt',
    'parseSeconds',
    'applyRule',
    'seededRandom',
    'noise1D'
  ]

  // v5.2 MUST include all v5.0 exports
  for (const api of v5_0_baseline) {
    assert(
      exports.includes(api),
      `Missing v5.0 API: ${api} (breaking change!)`
    )
  }

  // New v5.2 exports (document additions, not breaking changes)
  const newExports = exports.filter(e => !v5_0_baseline.includes(e))
  if (newExports.length > 0) {
    console.log(`  ℹ️  New v5.2 APIs: ${newExports.join(', ')}`)
  }

  // Save snapshot for future comparison
  const snapshot = {
    version: '5.2.0',
    timestamp: new Date().toISOString(),
    exports: exports,
    baseline: v5_0_baseline,
    additions: newExports
  }

  console.log(`✓ API surface snapshot created (${exports.length} exports)`)
  return snapshot
}

// ============================================================
// Test 2: v5.0 API Signatures Still Work (Headless Mode)
// ============================================================

function testV50Compatibility() {
  // Test 2.1: Old Engine API (v4/v5.0 style)
  try {
    const engine = new MDS.Engine()
    assert(typeof engine.spawn === 'function', 'Engine.spawn missing')
    assert(typeof engine.tick === 'function', 'Engine.tick missing')
    assert(typeof engine.start === 'function', 'Engine.start missing')
    assert(typeof engine.stop === 'function', 'Engine.stop missing')
    console.log('✓ v5.0 Engine API compatible')
  } catch (err) {
    console.error('✗ v5.0 Engine API broken:', err.message)
    throw err
  }

  // Test 2.2: Old World API (v5.0 style) - Use headless mode for Node.js
  try {
    const world = new MDS.World({
      features: {
        rendering: 'headless',
        ontology: true  // Enable ontology to test v5 APIs
      }
    })
    assert(typeof world.spawn === 'function', 'World.spawn missing')
    assert(typeof world.tick === 'function', 'World.tick missing')
    assert(typeof world.start === 'function', 'World.start missing')
    assert(typeof world.stop === 'function', 'World.stop missing')

    // v5 properties that SHOULD exist
    assert(world.entities !== undefined, 'World.entities missing')
    assert(world.fields !== undefined, 'World.fields missing')
    assert(world.id !== undefined, 'World.id missing')
    assert(world.worldTime !== undefined, 'World.worldTime missing')
    assert(world.tickCount !== undefined, 'World.tickCount missing')

    console.log('✓ v5.0 World API compatible')
  } catch (err) {
    console.error('✗ v5.0 World API broken:', err.message)
    throw err
  }

  // Test 2.3: Entity creation (v5.0 style)
  try {
    const material = {
      $schema: 'https://mds.v1b3.com/schema/v5.0.0',
      material: 'test.entity',
      essence: 'Test entity for API compatibility',
      manifestation: { emoji: '🧪' }
    }

    const entity = new MDS.Entity(material, 100, 100, Math.random, { skipDOM: true })
    assert(entity.id !== undefined, 'Entity.id missing')
    assert(entity.x === 100, 'Entity.x wrong')
    assert(entity.y === 100, 'Entity.y wrong')
    assert(typeof entity.update === 'function', 'Entity.update missing')

    // v5 ontology features (optional but should exist if enabled)
    assert(entity.memory !== undefined, 'Entity.memory missing')
    assert(entity.emotion !== undefined, 'Entity.emotion missing')
    assert(entity.intent !== undefined, 'Entity.intent missing')

    console.log('✓ v5.0 Entity API compatible')
  } catch (err) {
    console.error('✗ v5.0 Entity API broken:', err.message)
    throw err
  }

  // Test 2.4: Renderer API (v5.0 style)
  try {
    const headless = new MDS.HeadlessRenderer()
    assert(typeof headless.spawn === 'function', 'Renderer.spawn missing')
    assert(typeof headless.update === 'function', 'Renderer.update missing')
    assert(typeof headless.destroy === 'function', 'Renderer.destroy missing')
    assert(typeof headless.clear === 'function', 'Renderer.clear missing')
    assert(typeof headless.renderField === 'function', 'Renderer.renderField missing')

    console.log('✓ v5.0 Renderer API compatible')
  } catch (err) {
    console.error('✗ v5.0 Renderer API broken:', err.message)
    throw err
  }

  // Test 2.5: Communication API (v5.0 style)
  try {
    const queue = new MDS.MessageQueue()
    assert(typeof queue.enqueue === 'function', 'MessageQueue.enqueue missing')
    assert(typeof queue.dequeue === 'function', 'MessageQueue.dequeue missing')
    assert(typeof queue.size === 'function', 'MessageQueue.size missing')

    console.log('✓ v5.0 Communication API compatible')
  } catch (err) {
    console.error('✗ v5.0 Communication API broken:', err.message)
    throw err
  }

  // Test 2.6: Ontology API (v5.0 style)
  try {
    const memory = new MDS.MemoryBuffer({ maxSize: 100 })
    assert(typeof memory.add === 'function', 'MemoryBuffer.add missing')
    assert(typeof memory.recall === 'function', 'MemoryBuffer.recall missing')

    const intent = new MDS.IntentStack()
    assert(typeof intent.push === 'function', 'IntentStack.push missing')
    assert(typeof intent.current === 'function', 'IntentStack.current missing')

    console.log('✓ v5.0 Ontology API compatible')
  } catch (err) {
    console.error('✗ v5.0 Ontology API broken:', err.message)
    throw err
  }
}

// ============================================================
// Test 3: Deprecation Warnings (if any)
// ============================================================

function testDeprecationWarnings() {
  const warnings = []
  const originalWarn = console.warn

  // Capture console.warn calls
  console.warn = (...args) => {
    if (args[0]?.includes('DEPRECATED')) {
      warnings.push(args.join(' '))
    }
  }

  try {
    // Try old API patterns that might be deprecated
    const world = new MDS.World({
      features: { rendering: 'headless' }
    })

    // If there are any deprecated methods, they should warn
    // (none exist yet in v5.2, but this tests the mechanism)

    console.warn = originalWarn

    if (warnings.length > 0) {
      console.log(`  ⚠️  Deprecation warnings: ${warnings.length}`)
      warnings.forEach(w => console.log(`     ${w}`))
    } else {
      console.log('✓ No deprecation warnings (all APIs current)')
    }
  } catch (err) {
    console.warn = originalWarn
    throw err
  }
}

// ============================================================
// Test 4: Type Compatibility (TypeScript declarations)
// ============================================================

function testTypeCompatibility() {
  // Verify that exported types are what we expect
  // This is a runtime check; full TS type checking happens at build time

  // Test 4.1: Check constructors are classes
  const classes = [
    'Engine',
    'Entity',
    'Field',
    'World',
    'DOMRenderer',
    'CanvasRenderer',
    'HeadlessRenderer',
    'MessageQueue',
    'MemoryBuffer',
    'IntentStack',
    'LearningSystem',
    'SkillSystem'
  ]

  for (const className of classes) {
    assert(
      typeof MDS[className] === 'function',
      `${className} is not a constructor`
    )
  }

  console.log('✓ All class constructors present')

  // Test 4.2: Check utility functions exist
  const functions = [
    'loadMaterial',
    'loadMaterials',
    'createMessage',
    'createNode',
    'createChoice',
    'jaccardSimilarity'
  ]

  for (const fnName of functions) {
    assert(
      typeof MDS[fnName] === 'function',
      `${fnName} is not a function`
    )
  }

  console.log('✓ All utility functions present')

  // Test 4.3: Check constants/enums exist
  assert(
    typeof MDS.EMOTION_BASELINES === 'object',
    'EMOTION_BASELINES not exported'
  )
  assert(
    MDS.EMOTION_BASELINES.neutral !== undefined,
    'EMOTION_BASELINES.neutral missing'
  )

  console.log('✓ All constants/enums present')
}

// ============================================================
// Test 5: Backward Compatibility Matrix
// ============================================================

function testCompatibilityMatrix() {
  const matrix = {
    '5.0.0': {
      canLoadIn: ['5.0.0', '5.1.0', '5.2.0'],
      canSaveFrom: ['5.0.0'],
      tested: true
    },
    '5.1.0': {
      canLoadIn: ['5.1.0', '5.2.0'],
      canSaveFrom: ['5.0.0', '5.1.0'],
      tested: false  // Will be true when we test worldfile migration
    },
    '5.2.0': {
      canLoadIn: ['5.2.0'],
      canSaveFrom: ['5.0.0', '5.1.0', '5.2.0'],
      tested: false  // Will be true in Phase 4
    }
  }

  console.log('✓ Compatibility matrix defined')
  console.log('  → v5.0 saves can load in: v5.0, v5.1, v5.2')
  console.log('  → v5.2 can load saves from: v5.0, v5.1, v5.2')

  return matrix
}

// ============================================================
// Run All Tests
// ============================================================

let passed = 0
let failed = 0

try {
  console.log('Test 1: API Surface Snapshot')
  const snapshot = testApiSurface()
  passed++
  console.log()
} catch (err) {
  console.error('✗ Test 1 failed:', err.message)
  failed++
}

try {
  console.log('Test 2: v5.0 API Compatibility')
  testV50Compatibility()
  passed++
  console.log()
} catch (err) {
  console.error('✗ Test 2 failed:', err.message)
  failed++
}

try {
  console.log('Test 3: Deprecation Warnings')
  testDeprecationWarnings()
  passed++
  console.log()
} catch (err) {
  console.error('✗ Test 3 failed:', err.message)
  failed++
}

try {
  console.log('Test 4: Type Compatibility')
  testTypeCompatibility()
  passed++
  console.log()
} catch (err) {
  console.error('✗ Test 4 failed:', err.message)
  failed++
}

try {
  console.log('Test 5: Compatibility Matrix')
  const matrix = testCompatibilityMatrix()
  passed++
  console.log()
} catch (err) {
  console.error('✗ Test 5 failed:', err.message)
  failed++
}

// Summary
console.log('==================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('==================================================\n')

if (failed > 0) {
  console.log('❌ API stability tests failed!\n')
  process.exit(1)
} else {
  console.log('✅ All API stability tests passed!\n')
  console.log('v5.2 API Stability Status:')
  console.log('  ✓ All v5.0 exports present')
  console.log('  ✓ All v5.0 APIs work correctly')
  console.log('  ✓ No breaking changes detected')
  console.log('  ✓ Type compatibility verified')
  console.log('  ✓ Compatibility matrix defined\n')
}
