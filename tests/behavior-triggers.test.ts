import { test, expect } from 'bun:test'
import { World } from '../src/6-world/index.ts'

const baseWorldOptions = {
  worldOptions: {
    features: {
      ontology: true,
      history: true,
      communication: true
    }
  }
}

test('event(...) trigger updates world context via declarative action', async () => {
  const definition = {
    materials: {
      'entity.event-listener': {
        material: 'entity.event-listener',
        intent: 'observe',
        behavior: {
          triggers: [
            {
              on: 'event(signal.alert)',
              actions: [
                {
                  'context.set': {
                    'test.flag': 'event.event.data.level'
                  }
                }
              ]
            }
          ]
        }
      }
    },
    entities: [
      { id: 'listener', material: 'entity.event-listener' }
    ]
  }

  const world = await World.bootstrap(definition, baseWorldOptions)
  const contextEvents: Array<{ diff: Record<string, unknown> }> = []
  world.on('context', event => {
    contextEvents.push(event)
  })

  world.broadcastEvent('signal.alert', { level: 0.42 })

  expect(contextEvents.length).toBeGreaterThan(0)
  const last = contextEvents.at(-1)!
  expect(last.diff['test.flag']).toBeCloseTo(0.42, 5)

  world.destroy()
})

test('memory.recall action exposes recall metadata to subsequent expressions', async () => {
  const definition = {
    materials: {
      'entity.memory-agent': {
        material: 'entity.memory-agent',
        intent: 'observe',
        behavior: {
          triggers: [
            {
              on: 'event(memory.seed)',
              actions: [
                {
                  'memory.write': {
                    target: 'seed',
                    kind: 'fact',
                    value: 'seeded'
                  }
                },
                {
                  'memory.recall': {
                    target: 'seed',
                    kind: 'fact',
                    window: '10s'
                  }
                },
                {
                  'context.set': {
                    'memory.count': 'memory.recall.count',
                    'memory.latest': 'memory.recall.latest.content.value'
                  }
                }
              ]
            }
          ]
        }
      }
    },
    entities: [
      { id: 'mem-agent', material: 'entity.memory-agent' }
    ]
  }

  const world = await World.bootstrap(definition, baseWorldOptions)
  const contextEvents: Array<{ diff: Record<string, unknown> }> = []
  world.on('context', event => {
    contextEvents.push(event)
  })

  world.broadcastEvent('memory.seed', { note: 'alpha' })

  expect(contextEvents.length).toBeGreaterThan(0)
  const last = contextEvents.at(-1)!
  expect(last.diff['memory.count']).toBe(1)
  expect(last.diff['memory.latest']).toBe('seeded')

  const entity = world.getBootstrapEntity('mem-agent')
  expect(entity?.memory?.recall({ subject: 'seed' }).length).toBe(1)

  world.destroy()
})
