import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const material = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.greeter_memory.mdm'),
    'utf-8'
  )
)

const bindings = material.memory?.bindings ?? []
const nameBinding = bindings.find(binding => binding.trigger === 'player.introduce')
assert.ok(nameBinding, 'should bind player.introduce event')
assert.equal(nameBinding.target, 'player_name')
assert.equal(nameBinding.value, '{{event.payload.name}}')

const intents = material.dialogue?.intents ?? {}
const welcomeVariants = intents.welcome_back || intents.welcome || []

assert.ok(welcomeVariants.length > 0, 'should define welcome_back dialogue')
const usesMemory = welcomeVariants.some(variant =>
  variant.lang?.en?.includes('{{memory.player_name}}')
)
assert.ok(usesMemory, 'greeting should reference memory.player_name placeholder')

console.log('✅ Memory binding and greeting placeholder defined')
