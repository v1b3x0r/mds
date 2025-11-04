import { test, expect } from 'bun:test'
import { World } from '../src/6-world/index.ts'

const baseWorldOptions = {
  worldOptions: {
    features: {
      ontology: true,
      history: true,
      communication: true,
      linguistics: true
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

test('locale overlay transforms utterances according to modes', async () => {
  const definition = {
    localeOverlays: {
      'overlay.test': {
        replacements: {
          'Intrusion': 'ผู้บุกรุก'
        },
        emoji: ['🌺'],
        proto: {
          syllables: ['la'],
          minWords: 2,
          maxWords: 2,
          join: ' ',
          emoji: ['🌱']
        }
      }
    },
    materials: {
      'entity.overlay': {
        material: 'entity.overlay',
        intent: 'observe',
        utterance: {
          policy: {
            modes: ['short', 'emoji', 'proto'],
            defaultMode: 'short',
            locale: { overlay: 'overlay.test' }
          }
        },
        behavior: {
          triggers: [
            {
              on: 'event(voice.learn)',
              actions: [
                {
                  'translation.learn': {
                    source: '{{event.event.data.source}}',
                    lang: '{{event.event.data.lang}}',
                    text: '{{event.event.data.text}}'
                  }
                },
                {
                  'memory.write': {
                    target: 'translation.{{event.event.data.lang}}',
                    kind: 'fact',
                    value: '{{event.event.data.text}}'
                  }
                }
              ]
            },
            {
              on: 'event(voice.test)',
              actions: [
                { 'say': { text: '{{translate.th}}', mode: 'short', lang: 'th' } },
                { 'say': { text: '{{translate.th}}', mode: 'emoji', lang: 'th' } },
                { 'say': { text: '', mode: 'proto' } }
              ]
            }
          ]
        }
      }
    },
    entities: [
      { id: 'overlay', material: 'entity.overlay' }
    ]
  }

  const world = await World.bootstrap(definition, {
    worldOptions: {
      features: {
        ontology: true,
        history: true,
        communication: true,
        linguistics: true
      }
    }
  })

  world.broadcastEvent('voice.learn', { source: 'Intrusion alert', lang: 'th', text: 'เตือนผู้บุกรุก' })
  world.broadcastEvent('voice.test', { level: 1, text: 'Intrusion alert' })

  const sayLogs = world.logger
    .tail()
    .filter(entry => entry.type === 'behavior.say')

  expect(sayLogs).toHaveLength(3)

  const shortText = String(sayLogs[0].data?.text)
  expect(shortText).toContain('เตือนผู้บุกรุก')

  const emojiText = String(sayLogs[1].data?.text).trim()
  expect(emojiText.includes('🌺')).toBe(true)

  const protoText = String(sayLogs[2].data?.text).trim()
  expect(protoText.includes('Intrusion')).toBe(false)
  expect(protoText.toLowerCase()).toContain('la')

  const overlayEntity = world.getBootstrapEntity('overlay') as any
  expect(overlayEntity.translate('Intrusion alert', 'th')).toBe('เตือนผู้บุกรุก')

  world.destroy()
})

test('auto speech mode adapts to climate and needs', async () => {
  const definition = {
    materials: {
      'entity.auto': {
        material: 'entity.auto',
        intent: 'observe',
        needs: {
          resources: [
            { id: 'water', depletionRate: 0, criticalThreshold: 0.2 }
          ]
        },
        utterance: {
          policy: {
            modes: ['short', 'emoji', 'proto'],
            defaultMode: 'auto',
            locale: { overlay: { replacements: {}, proto: { syllables: ['la'], minWords: 2, maxWords: 2, join: ' ', emoji: [] } } }
          }
        },
        behavior: {
          triggers: [
            {
              on: 'event(help.request)',
              actions: [
                { 'say': { text: 'SOS', mode: undefined } }
              ]
            }
          ]
        }
      }
    },
    entities: [
      { id: 'auto', material: 'entity.auto' }
    ]
  }

  const world = await World.bootstrap(definition, {
    worldOptions: {
      features: {
        ontology: true,
        history: true,
        communication: true,
        linguistics: true
      }
    }
  })

  const entity = world.getBootstrapEntity('auto') as any
  entity.needs = new Map([
    ['water', { id: 'water', current: 0.05, depletionRate: 0, criticalThreshold: 0.2, lastUpdated: world.worldTime }]
  ])

  ;(world as any).protoGenerator = {
    generate: () => 'proto-auto 🌱'
  }

  const policy = entity.getUtterancePolicy()
  expect(policy?.modes).toContain('proto')

  world.broadcastContext({
    'climate.grief': 0.7,
    'climate.tension': 0.8,
    'climate.vitality': 0.3,
    'climate.harmony': 0.4,
    'climate.mood': 'grieving and tense'
  })

  expect(entity.getCriticalNeeds()).toContain('water')

  world.broadcastEvent('help.request', { text: 'SOS' })

  const sayLogs = world.logger
    .tail()
    .filter(entry => entry.type === 'behavior.say' && entry.data?.entity === entity.id)

  expect(sayLogs.length).toBeGreaterThan(0)
  const latest = sayLogs.at(-1)!
  expect(latest.data?.text).toBe('proto-auto 🌱')
  expect(latest.data?.mode).toBe('proto')

  world.destroy()
})

test('Athena mention trigger learns translations into memory', async () => {
  const definition = {
    materials: {
      'entity.athena': {
        material: 'entity.athena',
        intent: 'teach_language',
        essence: {
          en: 'Semantic archivist that catches foreign speech and replies with Thai gloss.'
        },
        utterance: {
          policy: {
            modes: ['short', 'proto'],
            defaultMode: 'auto'
          }
        },
        memory: {
          bindings: [
            {
              trigger: 'translation.learn',
              target: 'translation.latest.text',
              value: '{{event.payload.text}}',
              type: 'fact',
              salience: 0.9
            },
            {
              trigger: 'translation.learn',
              target: 'translation.latest.lang',
              value: '{{event.payload.lang}}',
              type: 'fact',
              salience: 0.6
            }
          ]
        },
        behavior: {
          triggers: [
            {
              id: 'athena-intake',
              on: 'mention(others)',
              actions: [
                {
                  'translation.learn': {
                    source: '{{event.utterance.text}}',
                    lang: 'th',
                    text: '🌱 {{event.utterance.text}} (แปล)'
                  }
                },
                {
                  'memory.write': {
                    target: 'translation.latest',
                    kind: 'fact',
                    salience: 'min(1, 0.75 + metrics.novelty * 0.1)',
                    value: '{{event.utterance.text}} -> {{translate.th}}'
                  }
                },
                {
                  'say': {
                    text: '{{translate.th}}',
                    mode: 'short',
                    lang: 'th'
                  }
                }
              ]
            }
          ]
        }
      },
      'entity.signal': {
        material: 'entity.signal',
        intent: 'broadcast',
        utterance: {
          policy: {
            modes: ['short'],
            defaultMode: 'short'
          }
        }
      }
    },
    entities: [
      { id: 'athena', material: 'entity.athena' },
      { id: 'env', material: 'entity.signal' }
    ]
  }

  const world = await World.bootstrap(definition, baseWorldOptions)
  const athena = world.getBootstrapEntity('athena') as any
  const source = world.getBootstrapEntity('env') as any

  world.recordSpeech(source, 'Signal inbound', athena)

  const translation = athena.translate('Signal inbound', 'th')
  expect(translation).toBe('🌱 Signal inbound (แปล)')

  const latestMemory = athena.memory?.recall({ subject: 'translation.latest' }) ?? []
  expect(latestMemory.length).toBeGreaterThan(0)
  expect(String(latestMemory.at(-1)?.content?.value)).toContain('Signal inbound -> 🌱 Signal inbound (แปล)')

  const textMemory = athena.memory?.recall({ subject: 'translation.latest.text' }) ?? []
  expect(textMemory.length).toBeGreaterThan(0)
  expect(String(textMemory.at(-1)?.content?.value)).toBe('🌱 Signal inbound (แปล)')

  const sayLogs = world.logger
    .tail()
    .filter(entry => entry.type === 'behavior.say' && entry.data?.entity === athena.id)
  expect(sayLogs.length).toBeGreaterThan(0)
  const sayLatest = sayLogs.at(-1)!
  expect(sayLatest.data?.text).toBe('🌱 Signal inbound (แปล)')
  expect(sayLatest.data?.mode).toBe('short')

  const learnLogs = world.logger
    .tail()
    .filter(entry => entry.type === 'translation.learn' && entry.data?.entity === athena.id)
  expect(learnLogs.length).toBeGreaterThan(0)
  expect(learnLogs.at(-1)?.data?.lang).toBe('th')
  expect(learnLogs.at(-1)?.data?.text).toBe('🌱 Signal inbound (แปล)')

  world.destroy()
})
