import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const material = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.lonely_ghost.mdm'),
    'utf-8'
  )
)

assert.equal(material.emotion?.base_state, 'unhappy')

const lonelyTimer = material.behavior?.timers?.find(t => t.id === 'lonely_decay')
assert.ok(lonelyTimer, 'lonely_decay timer should be defined')
assert.equal(lonelyTimer.interval, '30s')
assert.equal(lonelyTimer.emit, 'ghost.lonely_tick')

const resetRule = material.behavior?.onEvent?.['player.interact']
assert.ok(resetRule?.resetTimers?.includes('lonely_decay'), 'player.interact should reset lonely timer')

const toYearning = material.emotion?.transitions?.find(t => t.trigger === 'ghost.lonely_tick')
assert.ok(toYearning)
assert.equal(toYearning.to, 'yearning')

console.log('✅ Lonely ghost timer-driven emotion decay configured')
