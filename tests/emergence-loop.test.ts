import { test, expect } from 'bun:test'
import { World } from '../src/6-world/index.ts'

const MATERIAL_ID = 'entity.test-speaker'

function createWorldDefinition() {
  return {
    options: {
      features: {
        linguistics: true
      }
    },
    world: {
      emergence: {
        windowSeconds: 30,
        noveltyHalfLife: 15,
        chunking: {
          analyzeEvery: 1,
          minUsage: 2,
          minSpeakers: 1,
          warmUpTicks: 0,
          warmUpMinUsage: 1
        },
        blending: {
          chance: 0
        },
        learning: {
          rate: 0.5
        }
      }
    },
    materials: {
      [MATERIAL_ID]: {
        material: MATERIAL_ID,
        intent: 'observe',
        manifestation: {
          emoji: '🧪'
        }
      }
    },
    entities: [
      { id: 'speaker', material: MATERIAL_ID }
    ]
  }
}

test('emergence loop crystallizes repeated phrases and updates state', async () => {
  const definition = createWorldDefinition()
  const world = await World.bootstrap(definition, {
    worldOptions: {
      features: {
        linguistics: true
      }
    }
  })

  const entity = world.getBootstrapEntity('speaker')
  expect(entity).toBeDefined()

  world.recordSpeech(entity!, 'hola 🌞')
  world.recordSpeech(entity!, 'hola 🌞')

  world.tick(1)

  const logs = world.logger.tail()
  expect(logs.some(entry => entry.type === 'emergence.chunk')).toBe(true)

  const emergence = world.getEmergenceState()
  expect(emergence.chunkCount).toBeGreaterThanOrEqual(1)
  expect(emergence.lexiconSize).toBeGreaterThanOrEqual(1)
  expect(emergence.novelty).toBeGreaterThanOrEqual(0)
  expect(emergence.novelty).toBeLessThanOrEqual(1)

  const context = world.getContextSnapshot()
  expect(context['emergence.novelty']).toBeDefined()
  expect(context['emergence.lexicon']).toBeGreaterThanOrEqual(1)

  world.destroy()
})
