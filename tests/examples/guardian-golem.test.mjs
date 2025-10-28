import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { World } from '@v1b3x0r/mds-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const materialPath = path.join(repoRoot, 'materials/examples/entity.guardian_golem.mdm')
const material = JSON.parse(fs.readFileSync(materialPath, 'utf-8'))

assert.equal(material.material, 'entity.guardian_golem')
assert.ok(material.essence?.en?.includes('silent stone sentinel'))

const world = new World({
  features: {
    ontology: true
  }
})

const entity = world.spawn(material, { x: 0, y: 0 })

assert.equal(entity.m.material, 'entity.guardian_golem')
assert.equal(entity.m.intent, 'guard_ancient_gate')

console.log('✅ guardian-golem material spawns correctly')
