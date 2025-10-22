/**
 * MDS v5.2 - MDM Validator Tests
 * Test runtime validation of .mdm files
 */

import assert from 'node:assert'
import { validateMaterial } from '../dist/mds-core.esm.js'

console.log('\n🔍 MDS v5.2 - MDM Validator Tests\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`✗ ${name}`)
    console.error(`  ${err.message}`)
    failed++
  }
}

// Test 1: Valid minimal material
test('Valid minimal material (essence only)', () => {
  const material = {
    material: 'test.minimal',
    essence: 'A simple test entity'
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
  assert(result.errors.length === 0, 'Should have no errors')
})

// Test 2: Missing required field
test('Missing required field: material', () => {
  const material = {
    essence: 'Test entity without ID'
  }

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(result.errors.length > 0, 'Should have errors')
  assert(
    result.errors.some(e => e.field === 'material'),
    'Should have error on material field'
  )
})

// Test 3: Invalid material name format
test('Invalid material name format', () => {
  const material = {
    material: 'Invalid Name With Spaces',
    essence: 'Test'
  }

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(
    result.errors.some(e => e.field === 'material'),
    'Should have error on material field'
  )
})

// Test 4: Valid scoped name
test('Valid scoped name', () => {
  const material = {
    material: '@mds/entity.heroblind',
    essence: 'A scoped entity'
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 5: Schema version validation
test('Schema version requirement (strict mode)', () => {
  const material = {
    material: 'test.entity',
    essence: 'Test'
  }

  const result = validateMaterial(material, { requireSchema: true })
  assert(result.valid === false, 'Should be invalid without schema')
  assert(
    result.errors.some(e => e.field === '$schema'),
    'Should have error on $schema field'
  )
})

// Test 6: Valid schema version
test('Valid schema version', () => {
  const material = {
    $schema: 'https://mds.v1b3.com/schema/v5.0.0',
    material: 'test.entity',
    essence: 'Test'
  }

  const result = validateMaterial(material, { requireSchema: true })
  assert(result.valid === true, 'Should be valid')
})

// Test 7: Minimum version check
test('Minimum version check', () => {
  const material = {
    $schema: 'https://mds.v1b3.com/schema/v4.0.0',
    material: 'test.entity',
    essence: 'Test'
  }

  const result = validateMaterial(material, { minVersion: '5.0' })
  assert(result.valid === false, 'Should be invalid (version too old)')
  assert(
    result.errors.some(e => e.field === '$schema'),
    'Should have error on $schema field'
  )
})

// Test 8: Valid physics properties
test('Valid physics properties', () => {
  const material = {
    material: 'test.physics',
    essence: 'Test',
    physics: {
      mass: 1.0,
      friction: 0.5,
      bounce: 0.3
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 9: Invalid physics types
test('Invalid physics types', () => {
  const material = {
    material: 'test.physics',
    essence: 'Test',
    physics: {
      mass: 'heavy', // Should be number
      friction: 0.5
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(
    result.errors.some(e => e.field === 'physics.mass'),
    'Should have error on physics.mass'
  )
})

// Test 10: Physics range warnings (strict mode)
test('Physics range warnings (strict mode)', () => {
  const material = {
    material: 'test.physics',
    essence: 'Test',
    physics: {
      friction: 1.5, // Out of range [0, 1]
      bounce: -0.2   // Out of range [0, 1]
    }
  }

  const result = validateMaterial(material, { strict: true })
  assert(result.valid === false, 'Should be invalid in strict mode')
  assert(result.warnings.length > 0, 'Should have warnings')
})

// Test 11: Valid manifestation
test('Valid manifestation', () => {
  const material = {
    material: 'test.visual',
    essence: 'Test',
    manifestation: {
      emoji: '🧪',
      visual: 'particle.glow',
      aging: {
        start_opacity: 1.0,
        decay_rate: 0.01
      }
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 12: Valid multilingual essence
test('Valid multilingual essence', () => {
  const material = {
    material: 'test.multilingual',
    essence: {
      en: 'A test entity',
      th: 'เอนทิตี้ทดสอบ',
      ja: 'テストエンティティ'
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 13: Invalid multilingual essence
test('Invalid multilingual essence', () => {
  const material = {
    material: 'test.multilingual',
    essence: {
      en: 'A test entity',
      th: 123 // Should be string
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(
    result.errors.some(e => e.field === 'essence.th'),
    'Should have error on essence.th'
  )
})

// Test 14: Valid emotion config (v5.1)
test('Valid emotion config (v5.1)', () => {
  const material = {
    material: 'test.emotion',
    essence: 'Test',
    emotion: {
      base_state: 'neutral',
      transitions: [
        {
          trigger: 'player.gaze>5s',
          to: 'uneasy',
          intensity: 0.3
        }
      ]
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 15: Invalid emotion transitions
test('Invalid emotion transitions', () => {
  const material = {
    material: 'test.emotion',
    essence: 'Test',
    emotion: {
      transitions: [
        {
          // Missing trigger and to fields
          intensity: 0.3
        }
      ]
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(
    result.errors.some(e => e.field.includes('transitions[0]')),
    'Should have error on transitions[0]'
  )
})

// Test 16: Valid dialogue config (v5.1)
test('Valid dialogue config (v5.1)', () => {
  const material = {
    material: 'test.dialogue',
    essence: 'Test',
    dialogue: {
      intro: [
        {
          lang: {
            en: 'Hello...',
            th: 'สวัสดี...'
          },
          emotion: 'curious'
        }
      ],
      self_monologue: [
        {
          lang: {
            en: 'I wonder...'
          },
          frequency: 'rare'
        }
      ]
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 17: Invalid dialogue phrase
test('Invalid dialogue phrase (missing lang)', () => {
  const material = {
    material: 'test.dialogue',
    essence: 'Test',
    dialogue: {
      intro: [
        {
          // Missing lang field
          emotion: 'curious'
        }
      ]
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(
    result.errors.some(e => e.field === 'dialogue.intro[0].lang'),
    'Should have error on dialogue.intro[0].lang'
  )
})

// Test 18: Valid skills config (v5.1)
test('Valid skills config (v5.1)', () => {
  const material = {
    material: 'test.skills',
    essence: 'Test',
    skills: {
      learnable: [
        {
          name: 'mimic_voice',
          trigger: 'player.chat',
          growth: 0.05,
          description: 'Learn to mimic player voice'
        }
      ]
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 19: Invalid skill (missing required fields)
test('Invalid skill (missing required fields)', () => {
  const material = {
    material: 'test.skills',
    essence: 'Test',
    skills: {
      learnable: [
        {
          name: 'incomplete_skill'
          // Missing trigger and growth
        }
      ]
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(
    result.errors.some(e => e.field.includes('skills.learnable[0]')),
    'Should have errors on skills.learnable[0]'
  )
})

// Test 20: Valid behavior rules
test('Valid behavior rules', () => {
  const material = {
    material: 'test.behavior',
    essence: 'Test',
    behavior: {
      onHover: {
        condition: 'repeats>=3',
        effect: 'slide.away',
        emoji: '🫣'
      },
      onProximity: {
        threshold: 80,
        spawn: 'field.trust.core'
      }
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 21: Unknown behavior hook (warning)
test('Unknown behavior hook (warning)', () => {
  const material = {
    material: 'test.behavior',
    essence: 'Test',
    behavior: {
      onCustomEvent: { // Unknown hook
        effect: 'glow'
      }
    }
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid (warnings only)')
  assert(result.warnings.length > 0, 'Should have warnings')
  assert(
    result.warnings.some(w => w.field === 'behavior.onCustomEvent'),
    'Should have warning on unknown hook'
  )
})

// Test 22: Invalid type (not an object)
test('Invalid type (not an object)', () => {
  const material = 'not-an-object'

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(
    result.errors.some(e => e.field === '$root'),
    'Should have error on $root'
  )
})

// Test 23: Valid notes array
test('Valid notes array', () => {
  const material = {
    material: 'test.notes',
    essence: 'Test',
    notes: [
      'First design note',
      'Second design note'
    ]
  }

  const result = validateMaterial(material)
  assert(result.valid === true, 'Should be valid')
})

// Test 24: Invalid notes (not array)
test('Invalid notes (not array)', () => {
  const material = {
    material: 'test.notes',
    essence: 'Test',
    notes: 'Should be an array'
  }

  const result = validateMaterial(material)
  assert(result.valid === false, 'Should be invalid')
  assert(
    result.errors.some(e => e.field === 'notes'),
    'Should have error on notes field'
  )
})

// Test 25: Complex heroblind-style material
test('Complex heroblind-style material', () => {
  const material = {
    $schema: 'https://mds.v1b3.com/schema/v5.1.0',
    material: '@mds/entity.heroblind',
    intent: 'resonate',
    essence: {
      en: 'A memory trapped between lightning strikes',
      th: 'ความทรงจำที่ติดกับดักระหว่างฟ้าผ่า'
    },
    manifestation: {
      emoji: '👁️‍🗨️',
      visual: 'particle.flicker'
    },
    physics: {
      mass: 1.0,
      friction: 0.3
    },
    memory: {
      short_term: {
        retention: '120s',
        scope: ['player_name', 'recent_action']
      },
      long_term: {
        retention: 'infinite',
        events: ['first_summon', 'first_interaction']
      }
    },
    emotion: {
      base_state: 'neutral',
      transitions: [
        {
          trigger: 'player.gaze>5s',
          to: 'uneasy',
          intensity: 0.3,
          expression: 'particle.flicker'
        }
      ]
    },
    dialogue: {
      intro: [
        {
          lang: {
            en: 'The air trembles...',
            th: 'อากาศสั่นไหว...'
          },
          emotion: 'reflective'
        }
      ]
    },
    skills: {
      learnable: [
        {
          name: 'mimic_voice',
          trigger: 'player.chat',
          growth: 0.05
        }
      ]
    },
    cognition: {
      learning_rate: 0.8,
      concepts: ['courage', 'fear', 'memory']
    },
    relationships: {
      player: {
        trust: 0.1,
        fear: 0.4,
        curiosity: 0.7,
        bond: 'ancient-memory'
      }
    },
    notes: [
      'Design note 1',
      'Design note 2'
    ]
  }

  const result = validateMaterial(material, { requireSchema: true, minVersion: '5.0' })
  assert(result.valid === true, 'Complex material should be valid')
  assert(result.errors.length === 0, 'Should have no errors')
})

// Summary
console.log('\n==================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('==================================================\n')

if (failed > 0) {
  console.error('❌ MDM validator tests failed!')
  process.exit(1)
} else {
  console.log('✅ All MDM validator tests passed!\n')
  console.log('v5.2 MDM Validator Status:')
  console.log('  ✓ Required field validation')
  console.log('  ✓ Material name format validation')
  console.log('  ✓ Schema version validation')
  console.log('  ✓ Physics properties validation')
  console.log('  ✓ Manifestation validation')
  console.log('  ✓ Multilingual text validation')
  console.log('  ✓ v5.1 emotion config validation')
  console.log('  ✓ v5.1 dialogue config validation')
  console.log('  ✓ v5.1 skills config validation')
  console.log('  ✓ Behavior rules validation')
  console.log('  ✓ Complex material validation')
  console.log('  ✓ Strict mode and warnings')
}
