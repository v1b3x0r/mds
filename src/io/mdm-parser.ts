/**
 * MDS v5.1 - MDM Parser
 * Parse declarative .mdm configuration into runtime objects
 *
 * Converts heroblind.mdm style configs → Entity initialization
 */

import type {
  MdsMaterial,
  MdsEmotionConfig,
  MdsDialogueConfig,
  MdsDialoguePhrase,
  MdsSkillsConfig,
  MdsRelationshipsConfig
} from '../schema/mdspec'

/**
 * Parsed dialogue phrases by category and language
 * v5.7: Added flexible categories map for custom dialogue types
 */
export interface ParsedDialogue {
  // Legacy fields (backward compatible)
  intro: Map<string, string[]>          // lang → phrases
  self_monologue: Map<string, string[]> // lang → phrases
  events: Map<string, Map<string, string[]>>  // eventName → lang → phrases

  // v5.7: Flexible category system
  categories: Map<string, Map<string, string[]>>  // categoryName → lang → phrases
  // Access any category: categories.get('intro'), categories.get('greeting'), etc.
}

/**
 * Emotion trigger function
 */
export interface EmotionTrigger {
  condition: (context: TriggerContext) => boolean
  to: string
  intensity: number
  expression?: string
}

/**
 * Trigger evaluation context
 */
export interface TriggerContext {
  playerGazeDuration?: number  // seconds
  playerDistance?: number       // pixels
  lightLevel?: number           // 0..1
  playerAction?: string         // action name
  [key: string]: any            // extensible
}

/**
 * Parsed material configuration
 */
export interface ParsedMaterialConfig {
  dialogue?: ParsedDialogue
  emotionTriggers: EmotionTrigger[]
  skillNames: string[]
  relationshipTargets: string[]
}

/**
 * MDM Parser - converts declarative config to runtime objects
 */
export class MdmParser {
  /**
   * Parse retention string to milliseconds
   * @example "120s" → 120000, "infinite" → Infinity
   */
  parseRetention(retention: string): number {
    if (retention === 'infinite') return Infinity

    const match = retention.match(/^(\d+)(s|m|h)$/)
    if (!match) {
      console.warn(`Invalid retention format: "${retention}", defaulting to 60s`)
      return 60000
    }

    const value = parseInt(match[1])
    const unit = match[2]

    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      default: return value * 1000
    }
  }

  /**
   * Parse trigger condition string into function
   * @example "player.gaze>5s" → (ctx) => ctx.playerGazeDuration > 5
   * @example "distance<2" → (ctx) => ctx.playerDistance < 2
   */
  parseTriggerCondition(trigger: string): (context: TriggerContext) => boolean {
    // Simple pattern matching for common triggers
    // player.gaze>5s
    const gazeMatch = trigger.match(/player\.gaze>(\d+)s/)
    if (gazeMatch) {
      const seconds = parseInt(gazeMatch[1])
      return (ctx) => (ctx.playerGazeDuration || 0) > seconds
    }

    // distance<N
    const distMatch = trigger.match(/distance<(\d+)/)
    if (distMatch) {
      const dist = parseInt(distMatch[1])
      return (ctx) => (ctx.playerDistance || Infinity) < dist
    }

    // player.retreat>Nm
    const retreatMatch = trigger.match(/player\.retreat>(\d+)m/)
    if (retreatMatch) {
      const meters = parseInt(retreatMatch[1])
      return (ctx) => (ctx.playerDistance || 0) > meters
    }

    // light_level<N
    const lightMatch = trigger.match(/light_level<(\d+)/)
    if (lightMatch) {
      const level = parseInt(lightMatch[1])
      return (ctx) => (ctx.lightLevel || 1) < level
    }

    // player.attack
    if (trigger === 'player.attack') {
      return (ctx) => ctx.playerAction === 'attack'
    }

    // chant.recognition
    if (trigger === 'chant.recognition') {
      return (ctx) => ctx.playerAction === 'chant'
    }

    // Fallback: always false
    console.warn(`Unknown trigger pattern: "${trigger}", defaulting to false`)
    return () => false
  }

  /**
   * Parse emotion transitions
   */
  parseEmotionTransitions(config: MdsEmotionConfig): EmotionTrigger[] {
    if (!config.transitions) return []

    return config.transitions.map(t => ({
      condition: this.parseTriggerCondition(t.trigger),
      to: t.to,
      intensity: t.intensity ?? 0.5,
      expression: t.expression
    }))
  }

  /**
   * Parse dialogue phrases
   * v5.7: Now parses all categories flexibly + maintains backward compatibility
   */
  parseDialogue(config: MdsDialogueConfig): ParsedDialogue {
    const result: ParsedDialogue = {
      intro: new Map(),
      self_monologue: new Map(),
      events: new Map(),
      categories: new Map()  // v5.7: New flexible system
    }

    // Parse all top-level categories
    for (const [categoryName, value] of Object.entries(config)) {
      if (categoryName === 'event') {
        // Special case: Parse events (nested structure)
        for (const [eventName, phrases] of Object.entries(value)) {
          const eventMap = new Map<string, string[]>()
          this.addPhrasesToMap(eventMap, phrases as MdsDialoguePhrase[])
          result.events.set(eventName, eventMap)
          result.categories.set(eventName, eventMap)  // Also add to categories
        }
      } else {
        // Parse as regular category
        const categoryMap = new Map<string, string[]>()
        this.addPhrasesToMap(categoryMap, value as MdsDialoguePhrase[])
        result.categories.set(categoryName, categoryMap)

        // Backward compatibility: populate legacy fields
        if (categoryName === 'intro') result.intro = categoryMap
        if (categoryName === 'self_monologue') result.self_monologue = categoryMap
      }
    }

    return result
  }

  /**
   * Helper: add phrases to lang map
   */
  private addPhrasesToMap(map: Map<string, string[]>, phrases: MdsDialoguePhrase[]): void {
    for (const phrase of phrases) {
      for (const [lang, text] of Object.entries(phrase.lang)) {
        if (!map.has(lang)) {
          map.set(lang, [])
        }
        map.get(lang)!.push(text)
      }
    }
  }

  /**
   * Parse skills configuration
   */
  parseSkills(config: MdsSkillsConfig): string[] {
    if (!config.learnable) return []
    return config.learnable.map(skill => skill.name)
  }

  /**
   * Parse relationships configuration
   */
  parseRelationships(config: MdsRelationshipsConfig): string[] {
    return Object.keys(config)
  }
}

/**
 * Main parse function - converts MdsMaterial → ParsedMaterialConfig
 */
export function parseMaterial(material: MdsMaterial): ParsedMaterialConfig {
  const parser = new MdmParser()

  return {
    dialogue: material.dialogue ? parser.parseDialogue(material.dialogue) : undefined,
    emotionTriggers: material.emotion ? parser.parseEmotionTransitions(material.emotion) : [],
    skillNames: material.skills ? parser.parseSkills(material.skills) : [],
    relationshipTargets: material.relationships ? parser.parseRelationships(material.relationships) : []
  }
}

/**
 * Auto-detect language from browser or default
 */
export function detectLanguage(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.split('-')[0]
    return lang
  }
  return 'en'
}

/**
 * Get phrase from parsed dialogue
 * v5.7: Now uses flexible categories system
 */
export function getDialoguePhrase(
  dialogue: ParsedDialogue,
  category: 'intro' | 'self_monologue' | string,
  lang?: string,
  languageWeights?: Record<string, number>  // v5.7: Optional language weighting
): string | undefined {
  const targetLang = lang || detectLanguage()

  // v5.7: Try flexible categories first
  let map: Map<string, string[]> | undefined = dialogue.categories.get(category)

  // Fallback to legacy fields for backward compatibility
  if (!map) {
    if (category === 'intro') map = dialogue.intro
    else if (category === 'self_monologue') map = dialogue.self_monologue
    else map = dialogue.events.get(category)
  }

  if (!map) return undefined

  // v5.7: Use language weights if provided (entity autonomy)
  if (languageWeights) {
    const selectedLang = selectLanguageByWeight(languageWeights, map)
    if (selectedLang) {
      const phrases = map.get(selectedLang)
      if (phrases && phrases.length > 0) {
        return phrases[Math.floor(Math.random() * phrases.length)]
      }
    }
  }

  // Original fallback logic (no weights)
  let phrases = map.get(targetLang)

  // Fallback to English
  if (!phrases || phrases.length === 0) {
    phrases = map.get('en')
  }

  // Fallback to any available language
  if (!phrases || phrases.length === 0) {
    const firstLang = Array.from(map.keys())[0]
    if (firstLang) {
      phrases = map.get(firstLang)
    }
  }

  if (!phrases || phrases.length === 0) return undefined

  // Random selection
  return phrases[Math.floor(Math.random() * phrases.length)]
}

/**
 * v5.7: Select language by weight (for entity language autonomy)
 */
function selectLanguageByWeight(
  weights: Record<string, number>,
  availableLangs: Map<string, string[]>
): string | undefined {
  const rand = Math.random()
  let cumulative = 0

  for (const [lang, weight] of Object.entries(weights)) {
    if (!availableLangs.has(lang)) continue
    cumulative += weight
    if (rand < cumulative) return lang
  }

  return undefined
}

/**
 * v5.7: Replace placeholders in dialogue text
 * Supports: {name}, {essence}, {valence}, {arousal}, etc.
 */
export function replacePlaceholders(
  text: string,
  context: Record<string, any>
): string {
  return text.replace(/{(\w+)}/g, (match, key) => {
    const value = context[key]
    return value !== undefined ? String(value) : match
  })
}
