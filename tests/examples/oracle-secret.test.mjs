import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { World } from '@v1b3x0r/mds-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const material = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.oracle_trials.mdm'),
    'utf-8'
  )
)

const flags = material.memory?.flags ?? []
const expected = ['event.ring_bell', 'event.read_tome', 'event.defeat_golem']

for (const trigger of expected) {
  assert.ok(
    flags.some(flag => flag.trigger === trigger),
    `memory flag for ${trigger} should exist`
  )
}

const revealIntent = material.dialogue?.intents?.reveal_secret ?? []
assert.ok(revealIntent.length >= 2, 'oracle should have reveal_secret variants')

const gated = revealIntent.find(variant =>
  (variant.when ?? '').includes('task_ring_bell')
)

assert.ok(gated, 'oracle secret should require all flags')

const world = new World({
  features: {
    ontology: true,
    history: true
  }
})

const oracle = world.spawn(material)

let response = oracle.speak('reveal_secret', 'en') || ''
assert.ok(
  response.includes('remain incomplete'),
  'Oracle should withhold secret initially'
)

world.broadcastEvent('event.ring_bell')
world.broadcastEvent('event.read_tome')
response = oracle.speak('reveal_secret', 'en') || ''
assert.ok(
  response.includes('remain incomplete'),
  'Oracle still waits for final rite'
)

world.broadcastEvent('event.defeat_golem')

const flagSnapshot = oracle.getMemoryFlagsSnapshot()
assert.equal(
  flagSnapshot.filter(flag => flag.active).length,
  3,
  'All ritual flags should be active'
)

response = oracle.speak('reveal_secret', 'en') || ''
assert.ok(
  response.toLowerCase().includes('secret is yours'),
  'Oracle should reveal secret once all rites complete'
)

console.log('✅ Oracle tracks multi-stage ritual before revealing secret')
