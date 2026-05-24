import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const read = path => readFileSync(join(root, path), 'utf8')
const pkg = JSON.parse(read('package.json'))
const mainEntry = read('src/index.ts')
const liteEntry = read('src/index-lite.ts')
const validatorEntry = read('src/validator-entry.ts')

function assertExport(entry, name) {
  const directExport = new RegExp(String.raw`export\s+(?:\{[^}]*\b${name}\b[^}]*\}|(?:class|function|const|let|var|type|interface)\s+${name}\b)`, 's')
  assert.match(entry, directExport, `Expected public export ${name}`)
}

function assertTypeExport(entry, name) {
  const typeExport = new RegExp(String.raw`export\s+type\s+\{[^}]*\b${name}\b[^}]*\}`, 's')
  assert.match(entry, typeExport, `Expected public type export ${name}`)
}

assert.equal(pkg.name, '@v1b3x0r/mds-core')
assert.equal(pkg.type, 'module')
assert.equal(pkg.exports['.'].import, './dist/mds-core.esm.js')
assert.equal(pkg.exports['./lite'].import, './dist/mds-core-lite.esm.js')
assert.equal(pkg.exports['./validator'].import, './dist/mds-validator.esm.js')

for (const name of [
  'Engine',
  'Entity',
  'World',
  'WorldLogger',
  'formatLogEntry',
  'TranscriptBuffer',
  'WorldLexicon',
  'LinguisticCrystallizer',
  'ProtoLanguageGenerator',
  'SpatialGrid',
  'MessageBuilder',
  'DialogueManager',
  'SemanticSimilarity',
  'CollectiveIntelligence',
  'loadMaterial',
  'loadMaterials'
]) {
  assertExport(mainEntry, name)
}

for (const name of [
  'WorldOptions',
  'SpawnOptions',
  'WorldEvent',
  'WorldContextEvent',
  'WorldAnalyticsEvent',
  'ProtoSentenceConfig'
]) {
  assertTypeExport(mainEntry, name)
}

for (const name of ['Engine', 'Entity', 'World', 'DOMRenderer', 'HeadlessRenderer', 'loadMaterial', 'loadMaterials']) {
  assertExport(liteEntry, name)
}

assertExport(validatorEntry, 'validateMaterial')
assertTypeExport(validatorEntry, 'ValidationResult')

console.log('✓ API stability entrypoints are intact')
