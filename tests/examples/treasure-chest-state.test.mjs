import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const material = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.treasure_chest.mdm'),
    'utf-8'
  )
)

assert.equal(material.state?.initial, 'locked')

const unlockTransition = material.state?.transitions?.find(
  t => t.from === 'locked' && t.to === 'unlocked'
)

assert.ok(unlockTransition, 'should have locked→unlocked transition')
assert.equal(unlockTransition.trigger, 'player.use_key')
assert.equal(
  unlockTransition.condition,
  "event.payload.key_id == properties.required_key"
)

assert.equal(material.properties?.required_key, 'ancient_gate_key')

console.log('✅ Treasure chest state machine requires matching key')
