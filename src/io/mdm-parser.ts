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
 */
export interface ParsedDialogue {
  intro: Map<string, string[]>          // lang → phrases
  self_monologue: Map<string, string[]> // lang → phrases
  events: Map<string, Map<string, string[]>>  // eventName → lang → phrases
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
   */
  parseDialogue(config: MdsDialogueConfig): ParsedDialogue {
    const result: ParsedDialogue = {
      intro: new Map(),
      self_monologue: new Map(),
      events: new Map()
    }

    // Parse intro
    if (config.intro) {
      this.addPhrasesToMap(result.intro, config.intro)
    }

    // Parse self_monologue
    if (config.self_monologue) {
      this.addPhrasesToMap(result.self_monologue, config.self_monologue)
    }

    // Parse events
    if (config.event) {
      for (const [eventName, phrases] of Object.entries(config.event)) {
        const eventMap = new Map<string, string[]>()
        this.addPhrasesToMap(eventMap, phrases)
        result.events.set(eventName, eventMap)
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
 */
export function getDialoguePhrase(
  dialogue: ParsedDialogue,
  category: 'intro' | 'self_monologue' | string,
  lang?: string
): string | undefined {
  const targetLang = lang || detectLanguage()

  let map: Map<string, string[]> | undefined

  if (category === 'intro') {
    map = dialogue.intro
  } else if (category === 'self_monologue') {
    map = dialogue.self_monologue
  } else {
    // Event category
    map = dialogue.events.get(category)
  }

  if (!map) return undefined

  // Try target language first
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
