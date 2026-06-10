import { test, expect, describe } from 'bun:test'
import { World } from '../src/6-world/index.ts'

/**
 * F1 — Declarative skill trigger dispatch.
 *
 * `skills.learnable` in MDM declares { name, trigger, growth }.
 * Spawning must instantiate the skills, and a broadcast event matching
 * `trigger` must advance proficiency by (1 - proficiency) * growth.
 * (Previously the names were parsed then dropped — skills could only decay.)
 */

const companionMaterial = {
  material: 'entity.companion-test',
  essence: 'Shy companion who grows through conversation',
  skills: {
    learnable: [
      { name: 'empathy', trigger: 'user.emotion_detected', growth: 0.05 },
      { name: 'vocabulary_mastery', trigger: 'new_word_learned', growth: 0.02 }
    ]
  }
}

function spawnCompanion() {
  const world = new World({ features: { ontology: true, history: true } })
  const entity = world.spawn(companionMaterial, { x: 100, y: 100 })
  return { world, entity }
}

describe('declared skills are instantiated at spawn', () => {
  test('skills.learnable auto-enables the skill system and registers each skill', () => {
    const { entity } = spawnCompanion()
    expect(entity.skills).toBeDefined()
    expect(entity.skills!.getSkill('empathy')).not.toBeNull()
    expect(entity.skills!.getSkill('vocabulary_mastery')).not.toBeNull()
  })

  test('declared skills start at zero proficiency', () => {
    const { entity } = spawnCompanion()
    expect(entity.skills!.getSkill('empathy')!.proficiency).toBe(0)
  })
})

describe('broadcast events practice declared skills', () => {
  test('matching event advances the matching skill by (1-p)*growth', () => {
    const { world, entity } = spawnCompanion()
    world.broadcastEvent('user.emotion_detected', { valence: 0.8 })
    expect(entity.skills!.getSkill('empathy')!.proficiency).toBeCloseTo(0.05, 5)
    // non-matching skill untouched
    expect(entity.skills!.getSkill('vocabulary_mastery')!.proficiency).toBe(0)
  })

  test('repeated triggers follow the diminishing-returns curve', () => {
    const { world, entity } = spawnCompanion()
    world.broadcastEvent('user.emotion_detected')
    world.broadcastEvent('user.emotion_detected')
    // 0.05 + (1 - 0.05) * 0.05 = 0.0975
    expect(entity.skills!.getSkill('empathy')!.proficiency).toBeCloseTo(0.0975, 5)
  })

  test('unrelated events leave skills untouched', () => {
    const { world, entity } = spawnCompanion()
    world.broadcastEvent('sunrise', { intensity: 1 })
    expect(entity.skills!.getSkill('empathy')!.proficiency).toBe(0)
    expect(entity.skills!.getSkill('vocabulary_mastery')!.proficiency).toBe(0)
  })

  test('experience and lastPracticed update on trigger', () => {
    const { world, entity } = spawnCompanion()
    const before = entity.skills!.getSkill('empathy')!.experience
    world.broadcastEvent('user.emotion_detected')
    expect(entity.skills!.getSkill('empathy')!.experience).toBe(before + 1)
  })
})

describe('condition-style triggers practice on rising edge (heroblind.mdm form)', () => {
  const ghostMaterial = {
    material: 'entity.ghost-test',
    essence: 'Blind ghost who phases in darkness',
    skills: {
      learnable: [
        { name: 'phase_shift', trigger: 'light_level<2', growth: 0.03 }
      ]
    }
  }

  function spawnGhost() {
    const world = new World({ features: { ontology: true, history: true } })
    const entity = world.spawn(ghostMaterial, { x: 100, y: 100 })
    return { world, entity }
  }

  test('condition false → no practice', () => {
    const { world, entity } = spawnGhost()
    world.broadcastContext({ light_level: 5 })
    expect(entity.skills!.getSkill('phase_shift')!.proficiency).toBe(0)
  })

  test('condition turning true practices ONCE (edge, not level)', () => {
    const { world, entity } = spawnGhost()
    world.broadcastContext({ light_level: 5 })
    world.broadcastContext({ light_level: 1 })
    expect(entity.skills!.getSkill('phase_shift')!.proficiency).toBeCloseTo(0.03, 5)

    // condition STAYS true — repeated context broadcasts must not re-practice
    world.broadcastContext({ light_level: 1 })
    world.broadcastContext({ light_level: 0 })
    expect(entity.skills!.getSkill('phase_shift')!.proficiency).toBeCloseTo(0.03, 5)
  })

  test('condition re-arming (true → false → true) practices again', () => {
    const { world, entity } = spawnGhost()
    world.broadcastContext({ light_level: 1 })   // edge 1
    world.broadcastContext({ light_level: 5 })   // re-arm
    world.broadcastContext({ light_level: 1 })   // edge 2
    // 0.03 + (1 - 0.03) * 0.03 = 0.0591
    expect(entity.skills!.getSkill('phase_shift')!.proficiency).toBeCloseTo(0.0591, 5)
  })

  test('unrelated context keys never practice condition skills', () => {
    const { world, entity } = spawnGhost()
    world.broadcastContext({ temperature: 300 })
    expect(entity.skills!.getSkill('phase_shift')!.proficiency).toBe(0)
  })
})
