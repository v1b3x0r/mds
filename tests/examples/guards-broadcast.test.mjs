import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const guardA = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.guard_A.mdm'),
    'utf-8'
  )
)

const guardB = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.guard_B.mdm'),
    'utf-8'
  )
)

const guardATransition = guardA.emotion?.transitions?.find(t => t.trigger === 'player.trespass')
assert.ok(guardATransition, 'guard_A should react to player.trespass')
const broadcast = guardA.behavior?.onEmotion?.hostile?.broadcast
assert.ok(broadcast, 'guard_A should broadcast alert when hostile')
assert.equal(broadcast.event, 'guard.alert')

const guardBTransition = guardB.emotion?.transitions?.find(t => t.trigger === 'guard.alert')
assert.ok(guardBTransition, 'guard_B should listen for guard.alert')
assert.equal(guardBTransition.to, 'alert')

console.log('✅ Guard pair coordinates via broadcast alert')
