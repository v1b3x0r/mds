import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { World, toWorldFile, fromWorldFile } from '@v1b3x0r/mds-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')

const ghostMaterial = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'materials/examples/entity.lonely_ghost.mdm'),
    'utf-8'
  )
)

const worldOptions = {
  features: {
    ontology: true,
    history: true
  }
}

const world = new World(worldOptions)
const ghost = world.spawn(ghostMaterial)

// Simulate loneliness pulse then save world
world.broadcastEvent('ghost.lonely_tick')
world.tick(1)

const originalEmotion = { ...ghost.emotion }
const worldFile = toWorldFile(world, { note: 'serialization test' })

const rehydratedWorld = fromWorldFile(worldFile, worldOptions)
const rehydratedGhost = rehydratedWorld.entities[0]

assert.ok(rehydratedGhost, 'rehydrated world should contain ghost entity')
assert.ok(rehydratedGhost.emotion, 'rehydrated entity should keep emotion state')
assert.equal(
  rehydratedGhost.emotion.valence.toFixed(2),
  originalEmotion.valence.toFixed(2),
  'valence should persist through serialization'
)
assert.equal(
  rehydratedWorld.worldTime,
  world.worldTime,
  'world time should resume exactly'
)

console.log('✅ World serialization retains emotion state and world time')
