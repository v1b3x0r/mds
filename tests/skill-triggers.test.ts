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

describe('mixed declarations of the SAME skill (codex round-2 regression)', () => {
  // One skill, two rows: an event trigger AND a condition trigger.
  const adaptiveMaterial = {
    material: 'entity.adaptive-test',
    essence: 'Creature that adapts through chat and darkness',
    skills: {
      learnable: [
        { name: 'adapt', trigger: 'player.chat', growth: 0.2 },
        { name: 'adapt', trigger: 'darkness>0.5', growth: 0.1 }
      ]
    }
  }

  function spawnAdaptive() {
    const world = new World({ features: { ontology: true, history: true } })
    const entity = world.spawn(adaptiveMaterial, { x: 100, y: 100 })
    return { world, entity }
  }

  test('one event practices the event row exactly ONCE (no condition-path double dip)', () => {
    const { world, entity } = spawnAdaptive()
    world.broadcastEvent('player.chat')
    // exact-match row only: 0 + (1-0)*0.2 = 0.2 — NOT 0.36
    expect(entity.skills!.getSkill('adapt')!.proficiency).toBeCloseTo(0.2, 5)
  })

  test('the condition row still works independently', () => {
    const { world, entity } = spawnAdaptive()
    world.broadcastContext({ darkness: 0.7 })
    expect(entity.skills!.getSkill('adapt')!.proficiency).toBeCloseTo(0.1, 5)
  })

  test('bare context-flag trigger practices on context edge (codex round-3)', () => {
    // trigger with no comparison operator, driven by broadcastContext truthiness
    const world = new World({ features: { ontology: true, history: true } })
    const entity = world.spawn({
      material: 'entity.charger-sense-test',
      essence: 'Creature that senses charging',
      skills: {
        learnable: [
          { name: 'charging_sense', trigger: 'battery.charging', growth: 0.05 }
        ]
      }
    }, { x: 0, y: 0 })

    world.broadcastContext({ 'battery.charging': 1 })
    expect(entity.skills!.getSkill('charging_sense')!.proficiency).toBeCloseTo(0.05, 5)

    // stays truthy → no re-practice (edge, not level)
    world.broadcastContext({ 'battery.charging': 1 })
    expect(entity.skills!.getSkill('charging_sense')!.proficiency).toBeCloseTo(0.05, 5)

    // off → on re-arms: 0.05 + 0.95*0.05 = 0.0975
    world.broadcastContext({ 'battery.charging': 0 })
    world.broadcastContext({ 'battery.charging': 1 })
    expect(entity.skills!.getSkill('charging_sense')!.proficiency).toBeCloseTo(0.0975, 5)
  })

  test('bare trigger still works as a plain event name, exactly once, no context leak', () => {
    const world = new World({ features: { ontology: true, history: true } })
    const entity = world.spawn({
      material: 'entity.chat-sense-test',
      essence: 'Creature that practices on chat events',
      skills: {
        learnable: [
          { name: 'mimic_voice', trigger: 'player.chat', growth: 0.05 }
        ]
      }
    }, { x: 0, y: 0 })

    world.broadcastEvent('player.chat')
    expect(entity.skills!.getSkill('mimic_voice')!.proficiency).toBeCloseTo(0.05, 5)

    // the transient event flag must NOT leak into the context edge path
    world.broadcastContext({ unrelated: true })
    expect(entity.skills!.getSkill('mimic_voice')!.proficiency).toBeCloseTo(0.05, 5)
  })

  test('two different skills sharing one condition both practice on the edge', () => {
    const world = new World({ features: { ontology: true, history: true } })
    const entity = world.spawn({
      material: 'entity.shared-condition-test',
      essence: 'Twin-skill creature',
      skills: {
        learnable: [
          { name: 'night_vision', trigger: 'darkness>0.5', growth: 0.04 },
          { name: 'stealth', trigger: 'darkness>0.5', growth: 0.06 }
        ]
      }
    }, { x: 0, y: 0 })

    world.broadcastContext({ darkness: 0.9 })
    expect(entity.skills!.getSkill('night_vision')!.proficiency).toBeCloseTo(0.04, 5)
    expect(entity.skills!.getSkill('stealth')!.proficiency).toBeCloseTo(0.06, 5)
  })
})
