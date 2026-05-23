import { test, expect } from 'bun:test'
import { Entity } from '../src/0-foundation/entity.ts'
import { MdmParser, getDialoguePhrase } from '../src/7-interface/io/mdm-parser.ts'

const parser = new MdmParser()

function withRandom<T>(value: number, fn: () => T): T {
  const originalRandom = Math.random
  Math.random = () => value
  try {
    return fn()
  } finally {
    Math.random = originalRandom
  }
}

test('speak does not invent dialogue for missing MDM categories', () => {
  const entity = new Entity(
    {
      material: 'entity.dialogue_semantics',
      manifestation: { emoji: '💬' },
      nativeLanguage: 'th',
      dialogue: {
        intro: [
          { lang: { th: 'สวัสดี' } }
        ],
        self_monologue: [
          { lang: { th: 'ฉันกำลังคิด' } }
        ]
      }
    },
    0,
    0,
    () => 0.5,
    { skipDOM: true }
  )

  expect(entity.speak('curious', 'th')).toBeUndefined()
})

test('getDialoguePhrase samples across variants using frequency weights', () => {
  const parsed = parser.parseDialogue({
    self_monologue: [
      {
        lang: { th: 'rare-line' },
        frequency: 'rare'
      },
      {
        lang: { th: 'common-line' },
        frequency: 'common'
      }
    ]
  })

  const weightedPhrase = withRandom(0.99, () =>
    getDialoguePhrase(parsed, 'self_monologue', 'th')
  )

  expect(weightedPhrase).toBe('common-line')
})
