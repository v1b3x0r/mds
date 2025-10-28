import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const material = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.boundary_sentinel.mdm'),
    'utf-8'
  )
)

assert.equal(material.emotion?.base_state, 'neutral')

const transitions = material.emotion?.transitions ?? []
const insult = transitions.find(t => t.trigger === 'player.insult')
const apology = transitions.find(t => t.trigger === 'player.apology')

assert.ok(insult, 'player.insult transition should exist')
assert.equal(insult.to, 'annoyed')

assert.ok(apology, 'player.apology transition should exist')
assert.equal(apology.from, 'annoyed')
assert.equal(apology.to, 'neutral')

console.log('✅ Emotion transitions for boundary sentinel defined')
