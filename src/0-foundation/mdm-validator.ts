/**
 * MDS v5.2 - Runtime MDM Validator
 * Validates .mdm files against MDSpec schema at runtime
 *
 * Design:
 * - Comprehensive schema validation for v5.0+ materials
 * - Clear error messages with field paths
 * - Optional strict mode for development
 * - Backward compatibility checks
 */

import type { MdsMaterial } from '../schema/mdspec'
import { validateName } from './validator'

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Validation options
 */
export interface ValidationOptions {
  strict?: boolean              // Fail on warnings
  requireSchema?: boolean       // Require $schema field
  minVersion?: string           // Minimum schema version (e.g., "5.0")
}

/**
 * Validate MDM material definition
 */
export function validateMaterial(
  data: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Type guard
  if (!data || typeof data !== 'object') {
    errors.push({
      field: '$root',
      message: 'Material must be an object',
      severity: 'error'
    })
    return { valid: false, errors, warnings }
  }

  const material = data as Partial<MdsMaterial>

  // 1. Required field: material ID
  if (!material.material) {
    errors.push({
      field: 'material',
      message: 'Missing required field "material"',
      severity: 'error'
    })
  } else if (typeof material.material !== 'string') {
    errors.push({
      field: 'material',
      message: 'Field "material" must be a string',
      severity: 'error'
    })
  } else {
    // Validate name format
    try {
      validateName(material.material)
    } catch (err) {
      errors.push({
        field: 'material',
        message: (err as Error).message,
        severity: 'error'
      })
    }
  }

  // 2. Schema version
  if (options.requireSchema && !material.$schema) {
    errors.push({
      field: '$schema',
      message: 'Missing $schema field (required in strict mode)',
      severity: 'error'
    })
  }

  if (material.$schema && typeof material.$schema !== 'string') {
    errors.push({
      field: '$schema',
      message: 'Field "$schema" must be a string',
      severity: 'error'
    })
  }

  // Check minimum version
  if (options.minVersion && material.$schema) {
    const version = extractVersion(material.$schema)
    if (version && compareVersions(version, options.minVersion) < 0) {
      errors.push({
        field: '$schema',
        message: `Schema version ${version} is below minimum ${options.minVersion}`,
        severity: 'error'
      })
    }
  }

  // 3. Optional fields validation
  if (material.intent !== undefined && typeof material.intent !== 'string') {
    errors.push({
      field: 'intent',
      message: 'Field "intent" must be a string',
      severity: 'error'
    })
  }

  if (material.essence !== undefined) {
    validateLangText(material.essence, 'essence', errors)
  }

  // 4. Behavior rules
  if (material.behavior) {
    validateBehavior(material.behavior, errors, warnings)
  }

  // 5. Physics
  if (material.physics) {
    validatePhysics(material.physics, errors, warnings)
  }

  // 6. Manifestation
  if (material.manifestation) {
    validateManifestation(material.manifestation, errors, warnings)
  }

  // 7. v5.1 Declarative configs
  if (material.memory) {
    validateMemoryConfig(material.memory, errors, warnings)
  }

  if (material.state) {
    validateStateConfig(material.state, errors, warnings)
  }

  if (material.emotion) {
    validateEmotionConfig(material.emotion, errors, warnings)
  }

  if (material.dialogue) {
    validateDialogueConfig(material.dialogue, errors, warnings)
  }

  if (material.skills) {
    validateSkillsConfig(material.skills, errors, warnings)
  }

  if (material.cognition) {
    validateCognitionConfig(material.cognition, errors, warnings)
  }

  if (material.relationships) {
    validateRelationships(material.relationships, errors, warnings)
  }

  if (material.world_mind) {
    validateWorldMind(material.world_mind, errors, warnings)
  }

  // 8. Notes
  if (material.notes !== undefined) {
    if (!Array.isArray(material.notes)) {
      errors.push({
        field: 'notes',
        message: 'Field "notes" must be an array',
        severity: 'error'
      })
    } else if (!material.notes.every(n => typeof n === 'string')) {
      errors.push({
        field: 'notes',
        message: 'All notes must be strings',
        severity: 'error'
      })
    }
  }

  // Final verdict
  const valid = errors.length === 0 && (!options.strict || warnings.length === 0)
  return { valid, errors, warnings }
}

/**
 * Validate LangText type
 */
function validateLangText(
  value: unknown,
  field: string,
  errors: ValidationError[]
): void {
  if (typeof value === 'string') return // Simple string is valid

  if (typeof value !== 'object' || value === null) {
    errors.push({
      field,
      message: `Field "${field}" must be a string or object with language keys`,
      severity: 'error'
    })
    return
  }

  // Check all values are strings
  const obj = value as Record<string, unknown>
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val !== 'string') {
      errors.push({
        field: `${field}.${key}`,
        message: `Language text for "${key}" must be a string`,
        severity: 'error'
      })
    }
  }
}

/**
 * Validate behavior rules
 */
function validateBehavior(
  behavior: unknown,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (typeof behavior !== 'object' || behavior === null) {
    errors.push({
      field: 'behavior',
      message: 'Field "behavior" must be an object',
      severity: 'error'
    })
    return
  }

  const validHooks = [
    'onHover', 'onIdle', 'onRepeatHover',
    'onProximity', 'onBind', 'onDesync',
    'timers', 'onEmotion', 'onEvent'
  ]

  const b = behavior as Record<string, unknown>
  for (const [hook, rule] of Object.entries(b)) {
    if (!validHooks.includes(hook)) {
      warnings.push({
        field: `behavior.${hook}`,
        message: `Unknown behavior hook "${hook}"`,
        severity: 'warning'
      })
      continue
    }

    if (hook === 'timers') {
      if (!Array.isArray(rule)) {
        errors.push({
          field: 'behavior.timers',
          message: 'Field "timers" must be an array',
          severity: 'error'
        })
        continue
      }

      for (const [index, timer] of (rule as any[]).entries()) {
        if (typeof timer !== 'object' || timer === null) {
          errors.push({
            field: `behavior.timers[${index}]`,
            message: 'Timer entry must be an object',
            severity: 'error'
          })
          continue
        }

        const t = timer as Record<string, unknown>
        if (typeof t.id !== 'string' || t.id.length === 0) {
          errors.push({
            field: `behavior.timers[${index}].id`,
            message: 'Timer "id" must be a non-empty string',
            severity: 'error'
          })
        }
        if (typeof t.interval !== 'string') {
          errors.push({
            field: `behavior.timers[${index}].interval`,
            message: 'Timer "interval" must be a duration string',
            severity: 'error'
          })
        }
        if (typeof t.emit !== 'string' || t.emit.length === 0) {
          errors.push({
            field: `behavior.timers[${index}].emit`,
            message: 'Timer "emit" must be a non-empty string',
            severity: 'error'
          })
        }
      }

      continue
    }

    if (hook === 'onEmotion') {
      if (typeof rule !== 'object' || rule === null) {
        errors.push({
          field: 'behavior.onEmotion',
          message: 'Field "onEmotion" must be an object',
          severity: 'error'
        })
        continue
      }

      for (const [state, value] of Object.entries(rule as Record<string, unknown>)) {
        if (typeof value !== 'object' || value === null) {
          errors.push({
            field: `behavior.onEmotion.${state}`,
            message: 'Emotion rule must be an object',
            severity: 'error'
          })
          continue
        }

        const v = value as Record<string, unknown>
        if (v.broadcast !== undefined) {
          if (typeof v.broadcast !== 'object' || v.broadcast === null) {
            errors.push({
              field: `behavior.onEmotion.${state}.broadcast`,
              message: 'Broadcast must be an object',
              severity: 'error'
            })
          } else {
            const bcast = v.broadcast as Record<string, unknown>
            if (bcast.event !== undefined && typeof bcast.event !== 'string') {
              errors.push({
                field: `behavior.onEmotion.${state}.broadcast.event`,
                message: 'Broadcast event must be a string',
                severity: 'error'
              })
            }
          }
        }
      }

      continue
    }

    if (hook === 'onEvent') {
      if (typeof rule !== 'object' || rule === null) {
        errors.push({
          field: 'behavior.onEvent',
          message: 'Field "onEvent" must be an object',
          severity: 'error'
        })
        continue
      }

      for (const [eventName, value] of Object.entries(rule as Record<string, unknown>)) {
        if (typeof value !== 'object' || value === null) {
          errors.push({
            field: `behavior.onEvent.${eventName}`,
            message: 'Event rule must be an object',
            severity: 'error'
          })
          continue
        }

        const v = value as Record<string, unknown>
        if (v.resetTimers !== undefined && !Array.isArray(v.resetTimers)) {
          errors.push({
            field: `behavior.onEvent.${eventName}.resetTimers`,
            message: 'resetTimers must be an array of timer IDs',
            severity: 'error'
          })
        }
      }

      continue
    }

    if (typeof rule !== 'object' || rule === null) {
      errors.push({
        field: `behavior.${hook}`,
        message: 'Behavior rule must be an object',
        severity: 'error'
      })
      continue
    }

    // Validate rule fields
    const r = rule as Record<string, unknown>
    if (r.condition !== undefined && typeof r.condition !== 'string') {
      errors.push({
        field: `behavior.${hook}.condition`,
        message: 'Field "condition" must be a string',
        severity: 'error'
      })
    }
    if (r.threshold !== undefined && typeof r.threshold !== 'number') {
      errors.push({
        field: `behavior.${hook}.threshold`,
        message: 'Field "threshold" must be a number',
        severity: 'error'
      })
    }
    if (r.effect !== undefined && typeof r.effect !== 'string') {
      errors.push({
        field: `behavior.${hook}.effect`,
        message: 'Field "effect" must be a string',
        severity: 'error'
      })
    }
  }
}

/**
 * Validate physics properties
 */
function validatePhysics(
  physics: unknown,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (typeof physics !== 'object' || physics === null) {
    errors.push({
      field: 'physics',
      message: 'Field "physics" must be an object',
      severity: 'error'
    })
    return
  }

  const p = physics as Record<string, unknown>

  if (p.mass !== undefined) {
    if (typeof p.mass !== 'number') {
      errors.push({
        field: 'physics.mass',
        message: 'Field "mass" must be a number',
        severity: 'error'
      })
    } else if (p.mass <= 0) {
      warnings.push({
        field: 'physics.mass',
        message: 'Mass should be positive',
        severity: 'warning'
      })
    }
  }

  if (p.friction !== undefined) {
    if (typeof p.friction !== 'number') {
      errors.push({
        field: 'physics.friction',
        message: 'Field "friction" must be a number',
        severity: 'error'
      })
    } else if (p.friction < 0 || p.friction > 1) {
      warnings.push({
        field: 'physics.friction',
        message: 'Friction should be in range [0, 1]',
        severity: 'warning'
      })
    }
  }

  if (p.bounce !== undefined) {
    if (typeof p.bounce !== 'number') {
      errors.push({
        field: 'physics.bounce',
        message: 'Field "bounce" must be a number',
        severity: 'error'
      })
    } else if (p.bounce < 0 || p.bounce > 1) {
      warnings.push({
        field: 'physics.bounce',
        message: 'Bounce should be in range [0, 1]',
        severity: 'warning'
      })
    }
  }
}

/**
 * Validate manifestation
 */
function validateManifestation(
  manifestation: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof manifestation !== 'object' || manifestation === null) {
    errors.push({
      field: 'manifestation',
      message: 'Field "manifestation" must be an object',
      severity: 'error'
    })
    return
  }

  const m = manifestation as Record<string, unknown>

  if (m.emoji !== undefined && typeof m.emoji !== 'string') {
    errors.push({
      field: 'manifestation.emoji',
      message: 'Field "emoji" must be a string',
      severity: 'error'
    })
  }

  if (m.aging !== undefined) {
    if (typeof m.aging !== 'object' || m.aging === null) {
      errors.push({
        field: 'manifestation.aging',
        message: 'Field "aging" must be an object',
        severity: 'error'
      })
    } else {
      const a = m.aging as Record<string, unknown>
      if (a.start_opacity !== undefined && typeof a.start_opacity !== 'number') {
        errors.push({
          field: 'manifestation.aging.start_opacity',
          message: 'Field "start_opacity" must be a number',
          severity: 'error'
        })
      }
      if (a.decay_rate !== undefined && typeof a.decay_rate !== 'number') {
        errors.push({
          field: 'manifestation.aging.decay_rate',
          message: 'Field "decay_rate" must be a number',
          severity: 'error'
        })
      }
    }
  }
}

/**
 * Validate memory config
 */
function validateMemoryConfig(
  memory: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof memory !== 'object' || memory === null) {
    errors.push({
      field: 'memory',
      message: 'Field "memory" must be an object',
      severity: 'error'
    })
    return
  }

  const m = memory as Record<string, unknown>

  if (m.short_term !== undefined && typeof m.short_term !== 'object') {
    errors.push({
      field: 'memory.short_term',
      message: 'Field "short_term" must be an object',
      severity: 'error'
    })
  }

  if (m.long_term !== undefined && typeof m.long_term !== 'object') {
    errors.push({
      field: 'memory.long_term',
      message: 'Field "long_term" must be an object',
      severity: 'error'
    })
  }
}

function validateStateConfig(
  state: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof state !== 'object' || state === null) {
    errors.push({
      field: 'state',
      message: 'Field "state" must be an object',
      severity: 'error'
    })
    return
  }

  const s = state as Record<string, unknown>

  if (typeof s.initial !== 'string' || s.initial.length === 0) {
    errors.push({
      field: 'state.initial',
      message: 'Field "initial" must be a non-empty string',
      severity: 'error'
    })
  }

  if (s.states === undefined || typeof s.states !== 'object' || s.states === null) {
    errors.push({
      field: 'state.states',
      message: 'Field "states" must be an object',
      severity: 'error'
    })
  }

  if (s.transitions !== undefined) {
    if (!Array.isArray(s.transitions)) {
      errors.push({
        field: 'state.transitions',
        message: 'Field "transitions" must be an array',
        severity: 'error'
      })
    } else {
      s.transitions.forEach((transition, index) => {
        if (typeof transition !== 'object' || transition === null) {
          errors.push({
            field: `state.transitions[${index}]`,
            message: 'Transition must be an object',
            severity: 'error'
          })
          return
        }

        const t = transition as Record<string, unknown>
        if (t.from !== undefined && typeof t.from !== 'string') {
          errors.push({
            field: `state.transitions[${index}].from`,
            message: 'Field "from" must be a string',
            severity: 'error'
          })
        }
        if (!t.to || typeof t.to !== 'string') {
          errors.push({
            field: `state.transitions[${index}].to`,
            message: 'Missing or invalid "to" field',
            severity: 'error'
          })
        }
        if (!t.trigger || typeof t.trigger !== 'string') {
          errors.push({
            field: `state.transitions[${index}].trigger`,
            message: 'Missing or invalid "trigger" field',
            severity: 'error'
          })
        }
        if (t.condition !== undefined && typeof t.condition !== 'string') {
          errors.push({
            field: `state.transitions[${index}].condition`,
            message: 'Field "condition" must be a string',
            severity: 'error'
          })
        }
      })
    }
  }
}

/**
 * Validate emotion config
 */
function validateEmotionConfig(
  emotion: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof emotion !== 'object' || emotion === null) {
    errors.push({
      field: 'emotion',
      message: 'Field "emotion" must be an object',
      severity: 'error'
    })
    return
  }

  const e = emotion as Record<string, unknown>

  if (e.base_state !== undefined && typeof e.base_state !== 'string') {
    errors.push({
      field: 'emotion.base_state',
      message: 'Field "base_state" must be a string',
      severity: 'error'
    })
  }

  if (e.transitions !== undefined) {
    if (!Array.isArray(e.transitions)) {
      errors.push({
        field: 'emotion.transitions',
        message: 'Field "transitions" must be an array',
        severity: 'error'
      })
    } else {
      e.transitions.forEach((t, i) => {
        if (typeof t !== 'object' || t === null) {
          errors.push({
            field: `emotion.transitions[${i}]`,
            message: 'Transition must be an object',
            severity: 'error'
          })
          return
        }

        const transition = t as Record<string, unknown>
        if (transition.from !== undefined && typeof transition.from !== 'string') {
          errors.push({
            field: `emotion.transitions[${i}].from`,
            message: 'Field "from" must be a string',
            severity: 'error'
          })
        }
        if (!transition.trigger || typeof transition.trigger !== 'string') {
          errors.push({
            field: `emotion.transitions[${i}].trigger`,
            message: 'Missing or invalid "trigger" field',
            severity: 'error'
          })
        }
        if (!transition.to || typeof transition.to !== 'string') {
          errors.push({
            field: `emotion.transitions[${i}].to`,
            message: 'Missing or invalid "to" field',
            severity: 'error'
          })
        }
      })
    }
  }

  if (e.states !== undefined) {
    if (typeof e.states !== 'object' || e.states === null || Array.isArray(e.states)) {
      errors.push({
        field: 'emotion.states',
        message: 'Field "states" must be an object map',
        severity: 'error'
      })
    } else {
      Object.entries(e.states as Record<string, unknown>).forEach(([stateName, definition]) => {
        if (typeof definition !== 'object' || definition === null || Array.isArray(definition)) {
          errors.push({
            field: `emotion.states.${stateName}`,
            message: 'Emotion state definition must be an object',
            severity: 'error'
          })
          return
        }

        const def = definition as Record<string, unknown>
        for (const key of ['valence', 'arousal', 'dominance']) {
          if (def[key] !== undefined && typeof def[key] !== 'number') {
            errors.push({
              field: `emotion.states.${stateName}.${key}`,
              message: `Field "${key}" must be a number`,
              severity: 'error'
            })
          }
        }
      })
    }
  }
}

/**
 * Validate dialogue config
 */
function validateDialogueConfig(
  dialogue: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof dialogue !== 'object' || dialogue === null) {
    errors.push({
      field: 'dialogue',
      message: 'Field "dialogue" must be an object',
      severity: 'error'
    })
    return
  }

  const d = dialogue as Record<string, unknown>

  // Validate intro/self_monologue arrays
  for (const key of ['intro', 'self_monologue']) {
    if (d[key] !== undefined) {
      if (!Array.isArray(d[key])) {
        errors.push({
          field: `dialogue.${key}`,
          message: `Field "${key}" must be an array`,
          severity: 'error'
        })
      } else {
        (d[key] as unknown[]).forEach((phrase, i) => {
          if (typeof phrase !== 'object' || phrase === null) {
            errors.push({
              field: `dialogue.${key}[${i}]`,
              message: 'Phrase must be an object',
              severity: 'error'
            })
            return
          }

          const p = phrase as Record<string, unknown>
          if (!p.lang || typeof p.lang !== 'object') {
            errors.push({
              field: `dialogue.${key}[${i}].lang`,
              message: 'Missing or invalid "lang" field',
              severity: 'error'
            })
          }
        })
      }
    }
  }

  // Validate event object
  if (d.event !== undefined) {
    if (typeof d.event !== 'object' || d.event === null) {
      errors.push({
        field: 'dialogue.event',
        message: 'Field "event" must be an object',
        severity: 'error'
      })
    }
  }
}

/**
 * Validate skills config
 */
function validateSkillsConfig(
  skills: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof skills !== 'object' || skills === null) {
    errors.push({
      field: 'skills',
      message: 'Field "skills" must be an object',
      severity: 'error'
    })
    return
  }

  const s = skills as Record<string, unknown>

  if (s.learnable !== undefined) {
    if (!Array.isArray(s.learnable)) {
      errors.push({
        field: 'skills.learnable',
        message: 'Field "learnable" must be an array',
        severity: 'error'
      })
    } else {
      s.learnable.forEach((skill, i) => {
        if (typeof skill !== 'object' || skill === null) {
          errors.push({
            field: `skills.learnable[${i}]`,
            message: 'Skill must be an object',
            severity: 'error'
          })
          return
        }

        const sk = skill as Record<string, unknown>
        if (!sk.name || typeof sk.name !== 'string') {
          errors.push({
            field: `skills.learnable[${i}].name`,
            message: 'Missing or invalid "name" field',
            severity: 'error'
          })
        }
        if (!sk.trigger || typeof sk.trigger !== 'string') {
          errors.push({
            field: `skills.learnable[${i}].trigger`,
            message: 'Missing or invalid "trigger" field',
            severity: 'error'
          })
        }
        if (sk.growth === undefined || typeof sk.growth !== 'number') {
          errors.push({
            field: `skills.learnable[${i}].growth`,
            message: 'Missing or invalid "growth" field',
            severity: 'error'
          })
        }
      })
    }
  }
}

/**
 * Validate cognition config
 */
function validateCognitionConfig(
  cognition: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof cognition !== 'object' || cognition === null) {
    errors.push({
      field: 'cognition',
      message: 'Field "cognition" must be an object',
      severity: 'error'
    })
    return
  }

  const c = cognition as Record<string, unknown>

  if (c.learning_rate !== undefined && typeof c.learning_rate !== 'number') {
    errors.push({
      field: 'cognition.learning_rate',
      message: 'Field "learning_rate" must be a number',
      severity: 'error'
    })
  }

  if (c.concepts !== undefined && !Array.isArray(c.concepts)) {
    errors.push({
      field: 'cognition.concepts',
      message: 'Field "concepts" must be an array',
      severity: 'error'
    })
  }
}

/**
 * Validate relationships
 */
function validateRelationships(
  relationships: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof relationships !== 'object' || relationships === null) {
    errors.push({
      field: 'relationships',
      message: 'Field "relationships" must be an object',
      severity: 'error'
    })
    return
  }

  const r = relationships as Record<string, unknown>

  for (const [entityId, rel] of Object.entries(r)) {
    if (typeof rel !== 'object' || rel === null) {
      errors.push({
        field: `relationships.${entityId}`,
        message: 'Relationship entry must be an object',
        severity: 'error'
      })
    }
  }
}

/**
 * Validate world mind config
 */
function validateWorldMind(
  worldMind: unknown,
  errors: ValidationError[],
  _warnings: ValidationError[]
): void {
  if (typeof worldMind !== 'object' || worldMind === null) {
    errors.push({
      field: 'world_mind',
      message: 'Field "world_mind" must be an object',
      severity: 'error'
    })
    return
  }

  const w = worldMind as Record<string, unknown>

  if (w.collective_role !== undefined && typeof w.collective_role !== 'string') {
    errors.push({
      field: 'world_mind.collective_role',
      message: 'Field "collective_role" must be a string',
      severity: 'error'
    })
  }

  if (w.pattern_detection !== undefined) {
    if (typeof w.pattern_detection !== 'object' || w.pattern_detection === null) {
      errors.push({
        field: 'world_mind.pattern_detection',
        message: 'Field "pattern_detection" must be an object',
        severity: 'error'
      })
    }
  }
}

/**
 * Extract version from schema URL
 * e.g., "https://mds.v1b3.com/schema/v5.0.0" → "5.0.0"
 */
function extractVersion(schema: string): string | null {
  const match = schema.match(/v(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

/**
 * Compare versions (semver-lite)
 * Returns: -1 (a < b), 0 (a === b), 1 (a > b)
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number)
  const bParts = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const aNum = aParts[i] || 0
    const bNum = bParts[i] || 0
    if (aNum < bNum) return -1
    if (aNum > bNum) return 1
  }

  return 0
}
