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
    path.join(repoRoot, 'materials/examples/entity.treasure_chest.mdm'),
    'utf-8'
  )
)

const world = new World({
  features: {
    ontology: true,
    history: true
  }
})

const chest = world.spawn(material)

assert.equal(chest.getState(), 'locked', 'initial state should be locked')

world.broadcastEvent('player.use_key', { key_id: 'wrong' })
assert.equal(chest.getState(), 'locked', 'wrong key must not unlock chest')

world.broadcastEvent('player.use_key', { key_id: 'ancient_gate_key' })
assert.equal(chest.getState(), 'unlocked', 'correct key should unlock chest')

console.log('✅ Treasure chest transitions respond to key payloads')
