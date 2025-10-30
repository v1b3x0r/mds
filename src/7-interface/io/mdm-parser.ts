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
  MdsRelationshipsConfig,
  MdsMemoryConfig,
  MdsStateConfig,
  MdsBehaviorTrigger,
  MdsBehaviorAction,
  MdsLocaleOverlay,
  MdsUtterancePolicy,
  LangText
} from '@mds/schema/mdspec'
import { MULTILINGUAL_TRIGGERS } from '@mds/7-interface/io/trigger-keywords'
import {
  detectEmotionFromText,
  detectAllEmotions,
  blendMultipleEmotions
} from '@mds/1-ontology/emotion/detector'
import { LANGUAGE_FALLBACK_PRIORITY } from '@mds/0-foundation/language'

function resolveLangValue(value: LangText | undefined, preference: string[]): string {
  if (!value) return ''
  if (typeof value === 'string') return value

  const order: string[] = [...preference]
  for (const code of LANGUAGE_FALLBACK_PRIORITY) {
    if (!order.includes(code)) {
      order.push(code)
    }
  }

  for (const code of order) {
    const text = value[code]
    if (typeof text === 'string' && text.trim().length > 0) {
      return text
    }
  }

  for (const text of Object.values(value)) {
    if (typeof text === 'string' && text.trim().length > 0) {
      return text
    }
  }

  return ''
}

function deriveLanguagePreference(material: MdsMaterial): string[] {
  const preference: string[] = []
  const push = (code?: string) => {
    if (code && !preference.includes(code)) {
      preference.push(code)
    }
  }

  push(material.languageProfile?.native)
  push(material.nativeLanguage)

  if (material.languageProfile?.weights) {
    const sorted = Object.entries(material.languageProfile.weights)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    for (const [code] of sorted) {
      push(code)
    }
  }

  return preference
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Parsed dialogue phrases by category and language
 * v5.7: Added flexible categories map for custom dialogue types
 */
export interface ParsedDialogue {
  // Legacy fields (backward compatible)
  intro: ParsedDialogueVariant[]
  self_monologue: ParsedDialogueVariant[]
  events: Map<string, ParsedDialogueVariant[]>

  // v5.7: Flexible category system
  categories: Map<string, ParsedDialogueVariant[]>
  // Access any category: categories.get('intro'), categories.get('greeting'), etc.
}

export interface ParsedDialogueVariant {
  when?: (context: TriggerContext) => boolean
  lang: Record<string, string[]>
  raw?: MdsDialoguePhrase
}

/**
 * Emotion trigger function
 */
export interface EmotionTrigger {
  condition: (context: TriggerContext) => boolean
  from?: string
  to: string
  intensity: number
  expression?: string
  /**
   * Optional stochastic gate [0..1]. If provided, trigger fires with this probability.
   * Defaults to 1 (deterministic) for backward compatibility.
   */
  chance?: number
}

export interface EmotionStateDefinition {
  valence?: number
  arousal?: number
  dominance?: number
}

/**
 * Trigger evaluation context
 */
export interface TriggerContext {
  // Game-centric triggers (legacy)
  playerGazeDuration?: number  // seconds
  playerDistance?: number       // pixels
  lightLevel?: number           // 0..1
  playerAction?: string         // action name

  // Chat-centric triggers (v5.7.1)
  userMessage?: string          // Last user message
  userSilenceDuration?: number  // Seconds since last message

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
  memoryBindings: ParsedMemoryBinding[]
  memoryFlags: ParsedMemoryFlag[]
  stateMachine?: ParsedStateConfig
  emotionStates?: Map<string, EmotionStateDefinition>
  baselineEmotion?: import('@mds/1-ontology/emotion').EmotionalState  // v5.8: Auto-detected from essence/dialogue
  behaviorTriggers: ParsedBehaviorTrigger[]
  utterancePolicy?: ParsedUtterancePolicy
}

export interface ParsedBehaviorTrigger {
  id?: string
  on: string
  where?: string
  actions: ParsedBehaviorAction[]
}

export type ParsedBehaviorAction =
  | { kind: 'say'; mode?: string; text?: string; lang?: string }
  | { kind: 'mod.emotion'; v?: string; a?: string; d?: string }
  | { kind: 'relation.update'; target?: string; metric?: string; formula: string }
  | { kind: 'memory.write'; target?: string; memoryKind?: string; salience?: string; value?: string }
  | { kind: 'memory.recall'; target?: string; memoryKind?: string; window?: string }
  | { kind: 'context.set'; entries: Record<string, string> }
  | { kind: 'emit'; event: string; payload?: Record<string, string> }
  | { kind: 'log'; text: string }

export interface ParsedMemoryBinding {
  trigger: string
  target: string
  value: string
  type: string
  salience: number
}

export interface ParsedMemoryFlag {
  id: string
  trigger: string
  retention: number
}

export interface ParsedStateConfig {
  initial: string
  states: Map<string, ParsedStateDefinition>
  transitions: Map<string, ParsedStateTransition[]>
}

export interface ParsedStateDefinition {
  emoji?: string
}

export interface ParsedStateTransition {
  from?: string
  to: string
  condition?: string
}

export interface ReplacementRule {
  pattern: RegExp
  replace: string
}

export interface ParsedLocaleOverlayProtoConfig {
  syllables: string[]
  minWords: number
  maxWords: number
  join: string
  emoji: string[]
}

export interface ParsedLocaleOverlay {
  replacements: ReplacementRule[]
  particles: string[]
  emoji: string[]
  interjections: string[]
  proto?: ParsedLocaleOverlayProtoConfig
}

export interface ParsedUtterancePolicy {
  modes: string[]
  defaultMode: string
  overlay?: ParsedLocaleOverlay
  overlayRef?: string
}

/**
 * MDM Parser - converts declarative config to runtime objects
 */
export class MdmParser {
  /**
   * Parse retention string to milliseconds
   * @example "120s" → 120000, "infinite" → Infinity
   */
  parseBehaviorTriggers(triggers?: MdsBehaviorTrigger[]): ParsedBehaviorTrigger[] {
    if (!Array.isArray(triggers)) return []

    const result: ParsedBehaviorTrigger[] = []
    for (const trigger of triggers) {
      if (!trigger || !trigger.on) continue
      const actions: ParsedBehaviorAction[] = []
      if (Array.isArray(trigger.actions)) {
        for (const raw of trigger.actions) {
          const parsed = this.parseBehaviorAction(raw)
          if (parsed) actions.push(parsed)
        }
      }
      if (actions.length === 0) continue
      result.push({
        id: trigger.id,
        on: trigger.on,
        where: trigger.where,
        actions
      })
    }
    return result
  }

  private parseBehaviorAction(action: MdsBehaviorAction): ParsedBehaviorAction | undefined {
    if (!action) return undefined
    if ('say' in action) {
      const cfg = action.say || {}
      return { kind: 'say', mode: cfg.mode, text: cfg.text, lang: cfg.lang }
    }
    if ('mod.emotion' in action) {
      const cfg = action['mod.emotion'] || {}
      if (!cfg.v && !cfg.a && !cfg.d) return undefined
      return { kind: 'mod.emotion', v: cfg.v, a: cfg.a, d: cfg.d }
    }
    if ('relation.update' in action) {
      const cfg = action['relation.update']
      if (!cfg?.formula) {
        console.warn('[MDM] relation.update action missing formula')
        return undefined
      }
      return { kind: 'relation.update', target: cfg.target, metric: cfg.metric, formula: cfg.formula }
    }
    if ('memory.write' in action) {
      const cfg = action['memory.write'] || {}
      return { kind: 'memory.write', target: cfg.target, memoryKind: cfg.kind, salience: cfg.salience, value: cfg.value }
    }
    if ('memory.recall' in action) {
      const cfg = action['memory.recall'] || {}
      return { kind: 'memory.recall', target: cfg.target, memoryKind: cfg.kind, window: cfg.window }
    }
    if ('context.set' in action) {
      const entries = action['context.set']
      if (!entries) return undefined
      return { kind: 'context.set', entries }
    }
    if ('emit' in action) {
      const cfg = action.emit
      if (!cfg?.event) {
        console.warn('[MDM] emit action missing event name')
        return undefined
      }
      return { kind: 'emit', event: cfg.event, payload: cfg.payload }
    }
    if ('log' in action) {
      const cfg = action.log
      if (!cfg?.text) return undefined
      return { kind: 'log', text: cfg.text }
    }
    console.warn('[MDM] Unknown behavior action', action)
    return undefined
  }

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
   * v5.7.1: Added multilingual chat triggers (user.*)
   * @example "player.gaze>5s" → (ctx) => ctx.playerGazeDuration > 5
   * @example "distance<2" → (ctx) => ctx.playerDistance < 2
   * @example "user.praise" → (ctx) => message contains praise keywords (20 languages)
   */
  parseTriggerCondition(trigger: string): (context: TriggerContext) => boolean {
    // === GAME-CENTRIC TRIGGERS (Legacy) ===

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

    // === CHAT-CENTRIC TRIGGERS (v5.7.1 - Multilingual 90% coverage) ===

    // user.praise - positive sentiment (20 languages)
    if (trigger === 'user.praise') {
      return (ctx) => {
        const msg = ctx.userMessage?.toLowerCase() || ''
        return MULTILINGUAL_TRIGGERS.praise.some(word =>
          msg.includes(word.toLowerCase())
        )
      }
    }

    // user.criticism - negative sentiment (20 languages)
    if (trigger === 'user.criticism') {
      return (ctx) => {
        const msg = ctx.userMessage?.toLowerCase() || ''
        return MULTILINGUAL_TRIGGERS.criticism.some(word =>
          msg.includes(word.toLowerCase())
        )
      }
    }

    // user.question - interrogative detection (20 languages)
    if (trigger === 'user.question') {
      return (ctx) => {
        const msg = ctx.userMessage || ''
        return MULTILINGUAL_TRIGGERS.question_markers.some(marker =>
          msg.includes(marker)
        )
      }
    }

    // user.greeting - greeting detection (20 languages)
    if (trigger === 'user.greeting') {
      return (ctx) => {
        const msg = ctx.userMessage?.toLowerCase() || ''
        return MULTILINGUAL_TRIGGERS.greetings.some(word =>
          msg.includes(word.toLowerCase())
        )
      }
    }

    // user.enthusiasm - high arousal detection (20 languages)
    if (trigger === 'user.enthusiasm') {
      return (ctx) => {
        const msg = ctx.userMessage || ''
        const hasMarker = MULTILINGUAL_TRIGGERS.enthusiasm_markers.some(marker =>
          msg.includes(marker)
        )
        const hasPositive = MULTILINGUAL_TRIGGERS.praise.some(word =>
          msg.toLowerCase().includes(word.toLowerCase())
        )
        return hasMarker && hasPositive
      }
    }

    // user.deep_topic - philosophical/existential keywords (20 languages)
    if (trigger === 'user.deep_topic') {
      return (ctx) => {
        const msg = ctx.userMessage?.toLowerCase() || ''
        return MULTILINGUAL_TRIGGERS.deep_topics.some(word =>
          msg.includes(word.toLowerCase())
        )
      }
    }

    // user.attack - hostile language detection (20 languages)
    if (trigger === 'user.attack') {
      return (ctx) => {
        const msg = ctx.userMessage?.toLowerCase() || ''
        return MULTILINGUAL_TRIGGERS.hostile.some(word =>
          msg.includes(word.toLowerCase())
        )
      }
    }

    // === GENERIC DOT-NOTATION TRIGGERS (v5.8.0) ===
    // Supports: key>value, key<value, key>=value, key<=value
    // Examples: cpu.usage>0.8, memory.usage<0.2, battery.level<=0.15
    // Time units: 60s, 1000ms
    // Negative values: temperature>-10, temperature<-10

    const genericMatch = trigger.match(/^([\w.]+)([><]=?)(-?\d+\.?\d*)(s|ms)?$/)
    if (genericMatch) {
      const [, key, operator, valueStr, unit] = genericMatch
      let threshold = parseFloat(valueStr)

      // Convert time units to seconds
      if (unit === 'ms') threshold = threshold / 1000  // milliseconds to seconds
      // 's' is default (no conversion needed)

      return (ctx) => {
        const actual = ctx[key]
        if (actual === undefined) return false

        switch (operator) {
          case '>': return actual > threshold
          case '<': return actual < threshold
          case '>=': return actual >= threshold
          case '<=': return actual <= threshold
          default: return false
        }
      }
    }

    const truthyMatch = trigger.match(/^[\w.]+$/)
    if (truthyMatch) {
      return (ctx) => {
        if (ctx['event.type'] === trigger) {
          return true
        }
        return Boolean(ctx[trigger])
      }
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
      from: t.from,
      to: t.to,
      intensity: t.intensity ?? 0.5,
      expression: t.expression
    }))
  }

  parseEmotionStates(config: MdsEmotionConfig): Map<string, EmotionStateDefinition> | undefined {
    if (!config.states) return undefined
    const entries = Object.entries(config.states)
    if (entries.length === 0) return undefined

    const map = new Map<string, EmotionStateDefinition>()
    for (const [name, def] of entries) {
      if (!def) continue
      map.set(name, {
        valence: typeof def.valence === 'number' ? def.valence : undefined,
        arousal: typeof def.arousal === 'number' ? def.arousal : undefined,
        dominance: typeof def.dominance === 'number' ? def.dominance : undefined
      })
    }
    return map
  }

  parseMemoryBindings(config: MdsMemoryConfig): ParsedMemoryBinding[] {
    if (!config.bindings) return []

    return config.bindings.map(binding => ({
      trigger: binding.trigger,
      target: binding.target,
      value: binding.value,
      type: binding.type ?? 'fact',
      salience: binding.salience ?? 0.7
    }))
  }

  parseMemoryFlags(config: MdsMemoryConfig): ParsedMemoryFlag[] {
    if (!config.flags) return []

    return config.flags.map(flag => ({
      id: flag.id,
      trigger: flag.trigger,
      retention: flag.retention ? this.parseRetention(flag.retention) : Infinity
    }))
  }

  parseStateMachine(config: MdsStateConfig): ParsedStateConfig {
    const states = new Map<string, ParsedStateDefinition>()
    if (config.states) {
      for (const [name, def] of Object.entries(config.states)) {
        states.set(name, {
          emoji: def?.emoji
        })
      }
    }

    const transitions = new Map<string, ParsedStateTransition[]>()
    if (config.transitions) {
      for (const transition of config.transitions) {
        if (!transitions.has(transition.trigger)) {
          transitions.set(transition.trigger, [])
        }
        transitions.get(transition.trigger)!.push({
          from: transition.from,
          to: transition.to,
          condition: transition.condition
        })
      }
    }

    return {
      initial: config.initial,
      states,
      transitions
    }
  }

  /**
   * Parse dialogue phrases
   * v5.7: Now parses all categories flexibly + maintains backward compatibility
   */
  parseDialogue(config: MdsDialogueConfig): ParsedDialogue {
    const result: ParsedDialogue = {
      intro: [],
      self_monologue: [],
      events: new Map(),
      categories: new Map()
    }

    for (const [categoryName, value] of Object.entries(config)) {
      if (categoryName === 'event') {
        for (const [eventName, phrases] of Object.entries(value)) {
          const variants = this.createDialogueVariants(phrases as MdsDialoguePhrase[])
          result.events.set(eventName, variants)
          result.categories.set(eventName, variants)
        }
      } else if (Array.isArray(value)) {
        const variants = this.createDialogueVariants(value as MdsDialoguePhrase[])
        result.categories.set(categoryName, variants)

        if (categoryName === 'intro') result.intro = variants
        if (categoryName === 'self_monologue') result.self_monologue = variants
      } else if (typeof value === 'object' && value !== null) {
        for (const [subCategory, phrases] of Object.entries(value)) {
          if (!Array.isArray(phrases)) continue
          const variants = this.createDialogueVariants(phrases as MdsDialoguePhrase[])
          result.categories.set(subCategory, variants)
        }
      }
    }

    return result
  }

  private createDialogueVariants(phrases: MdsDialoguePhrase[]): ParsedDialogueVariant[] {
    return phrases.map(phrase => {
      const langMap: Record<string, string[]> = {}

      for (const [lang, text] of Object.entries(phrase.lang)) {
        if (!langMap[lang]) {
          langMap[lang] = []
        }
        langMap[lang].push(text)
      }

      return {
        when: phrase.when
          ? ((ctx: TriggerContext) => evaluateConditionExpression(phrase.when!, ctx))
          : undefined,
        lang: langMap,
        raw: phrase
      }
    })
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

  parseLocaleOverlay(spec: MdsLocaleOverlay): ParsedLocaleOverlay {
    const replacements: ReplacementRule[] = []
    if (spec.replacements) {
      for (const [from, to] of Object.entries(spec.replacements)) {
        if (!from || typeof from !== 'string') continue
        const pattern = new RegExp(escapeRegExp(from), 'gi')
        const replace = typeof to === 'string' ? to : ''
        replacements.push({ pattern, replace })
      }
    }

    const particles = Array.isArray(spec.particles)
      ? spec.particles.map(value => String(value)).filter(text => text.trim().length > 0)
      : []
    const emoji = Array.isArray(spec.emoji)
      ? spec.emoji.map(value => String(value)).filter(text => text.trim().length > 0)
      : []
    const interjections = Array.isArray(spec.interjections)
      ? spec.interjections.map(value => String(value)).filter(text => text.trim().length > 0)
      : []

    let proto: ParsedLocaleOverlayProtoConfig | undefined
    if (spec.proto) {
      const protoSpec = spec.proto
      const syllables = Array.isArray(protoSpec.syllables)
        ? protoSpec.syllables.map(value => String(value)).filter(text => text.trim().length > 0)
        : []
      const minWords = Math.max(1, Math.floor(protoSpec.minWords ?? 1))
      const maxWords = Math.max(minWords, Math.floor(protoSpec.maxWords ?? Math.max(minWords, 3)))
      const join = typeof protoSpec.join === 'string' ? protoSpec.join : ' '
      const protoEmoji = Array.isArray(protoSpec.emoji)
        ? protoSpec.emoji.map(value => String(value)).filter(text => text.trim().length > 0)
        : []
      proto = {
        syllables,
        minWords,
        maxWords,
        join,
        emoji: protoEmoji
      }
    }

    return {
      replacements,
      particles,
      emoji,
      interjections,
      proto
    }
  }

  parseUtterancePolicy(policy?: MdsUtterancePolicy): ParsedUtterancePolicy | undefined {
    if (!policy) return undefined

    const modes = Array.isArray(policy.modes) && policy.modes.length > 0
      ? policy.modes
          .map(value => typeof value === 'string' ? value : String(value))
          .filter(mode => mode.trim().length > 0)
      : ['auto']
    const defaultModeCandidate = typeof policy.defaultMode === 'string' ? policy.defaultMode : undefined
    const defaultMode = defaultModeCandidate && modes.includes(defaultModeCandidate)
      ? defaultModeCandidate
      : modes[0]

    let overlay: ParsedLocaleOverlay | undefined
    let overlayRef: string | undefined
    if (policy.locale?.overlay) {
      if (typeof policy.locale.overlay === 'string') {
        overlayRef = policy.locale.overlay
      } else {
        overlay = this.parseLocaleOverlay(policy.locale.overlay)
      }
    }

    return {
      modes,
      defaultMode,
      overlay,
      overlayRef
    }
  }
}

/**
 * Main parse function - converts MdsMaterial → ParsedMaterialConfig
 */
export function parseMaterial(material: MdsMaterial): ParsedMaterialConfig {
  const parser = new MdmParser()
  const languagePreference = deriveLanguagePreference(material)

  // v5.8: Auto-detect emotion from essence/dialogue (Thai/English keywords)
  let baselineEmotion: import('@mds/1-ontology/emotion').EmotionalState | undefined

  const essenceText = resolveLangValue(material.essence, languagePreference)
  if (essenceText) {
    const detectedEmotion = detectEmotionFromText(essenceText)
    if (detectedEmotion) {
      baselineEmotion = detectedEmotion
    }

    if (material.dialogue?.intro) {
      const introTexts = material.dialogue.intro.map((phrase: any) => {
        if (typeof phrase === 'string') return phrase
        return resolveLangValue(phrase?.lang as LangText | undefined, languagePreference)
      }).join(' ')

      if (introTexts.length > 0) {
        const dialogueEmotion = detectEmotionFromText(introTexts)

        if (dialogueEmotion && baselineEmotion) {
          const emotions = detectAllEmotions(`${essenceText} ${introTexts}`)
          baselineEmotion = blendMultipleEmotions(emotions) || baselineEmotion
        } else if (dialogueEmotion) {
          baselineEmotion = dialogueEmotion
        }
      }
    }
  }

  return {
    dialogue: material.dialogue ? parser.parseDialogue(material.dialogue) : undefined,
    emotionTriggers: material.emotion ? parser.parseEmotionTransitions(material.emotion) : [],
    emotionStates: material.emotion ? parser.parseEmotionStates(material.emotion) : undefined,
    skillNames: material.skills ? parser.parseSkills(material.skills) : [],
    relationshipTargets: material.relationships ? parser.parseRelationships(material.relationships) : [],
    memoryBindings: material.memory ? parser.parseMemoryBindings(material.memory) : [],
    memoryFlags: material.memory ? parser.parseMemoryFlags(material.memory) : [],
    stateMachine: material.state ? parser.parseStateMachine(material.state) : undefined,
    baselineEmotion,
    utterancePolicy: material.utterance?.policy ? parser.parseUtterancePolicy(material.utterance.policy) : undefined,
    behaviorTriggers: material.behavior?.triggers ? parser.parseBehaviorTriggers(material.behavior.triggers) : []
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
  languageWeights?: Record<string, number>,
  context: TriggerContext = {},
  languagePreference: string[] = []
): string | undefined {
  const fallbackOrder: string[] = []

  const push = (code?: string) => {
    if (code && !fallbackOrder.includes(code)) {
      fallbackOrder.push(code)
    }
  }

  push(lang)
  for (const pref of languagePreference) push(pref)
  push(detectLanguage())
  for (const code of LANGUAGE_FALLBACK_PRIORITY) push(code)

  const variants = dialogue.categories.get(category)
    || (category === 'intro' ? dialogue.intro
      : category === 'self_monologue' ? dialogue.self_monologue
        : dialogue.events.get(category))

  if (!variants || variants.length === 0) return undefined

  const eligible = variants.filter(variant => {
    if (!variant.when) return true
    try {
      return variant.when(context)
    } catch (err) {
      console.warn('Error evaluating dialogue condition', err)
      return false
    }
  })

  const pool = eligible.length > 0 ? eligible : variants

  const selectLangPhrases = (langCode: string): string[] | undefined => {
    for (const variant of pool) {
      const phrases = variant.lang[langCode]
      if (phrases && phrases.length > 0) {
        return phrases
      }
    }
    return undefined
  }

  let phrases: string[] | undefined

  if (languageWeights) {
    const availableLangs = new Map<string, string[]>()
    for (const variant of pool) {
      for (const [language, texts] of Object.entries(variant.lang)) {
        if (texts.length > 0) {
          availableLangs.set(language, texts)
        }
      }
    }
    const selectedLang = selectLanguageByWeight(languageWeights, availableLangs)
    if (selectedLang) {
      push(selectedLang)
    }
  }

  for (const code of fallbackOrder) {
    phrases = selectLangPhrases(code)
    if (phrases) break
  }

  if (!phrases) {
    for (const variant of pool) {
      const entry = Object.values(variant.lang).find(texts => texts.length > 0)
      if (entry) {
        phrases = entry
        break
      }
    }
  }

  if (!phrases || phrases.length === 0) return undefined

  return phrases[Math.floor(Math.random() * phrases.length)]
}

/**
 * v5.7: Select language by weight (for entity language autonomy)
 */
function selectLanguageByWeight(
  weights: Record<string, number>,
  availableLangs: Map<string, string[]>
): string | undefined {
  const candidates = Object.entries(weights).filter(([lang, weight]) =>
    availableLangs.has(lang) && typeof weight === 'number' && weight > 0
  )
  if (candidates.length === 0) {
    return undefined
  }

  const total = candidates.reduce((sum, [, weight]) => sum + weight, 0)
  if (total <= 0) {
    return undefined
  }

  const rand = Math.random() * total
  let cumulative = 0

  for (const [lang, weight] of candidates) {
    cumulative += weight
    if (rand <= cumulative) {
      return lang
    }
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
  const flattened = flattenContext(context)
  return text.replace(/\{\{?\s*([\w.]+)\s*\}\}?/g, (match, key) => {
    const value = flattened[key]
    return value !== undefined ? String(value) : match
  })
}

function flattenContext(
  context: Record<string, any>,
  prefix = '',
  target: Record<string, any> = {}
): Record<string, any> {
  for (const [key, value] of Object.entries(context)) {
    const compositeKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenContext(value, compositeKey, target)
    } else {
      target[compositeKey] = value
    }
  }
  return target
}

export function evaluateConditionExpression(
  condition: string,
  context: Record<string, any>
): boolean {
  const orParts = condition.split(/\|\|/)
  for (const orPartRaw of orParts) {
    const andParts = orPartRaw.split(/&&/)
    let andResult = true
    for (const andPartRaw of andParts) {
      const part = andPartRaw.trim()
      if (!part) continue
      const result = evaluateSimpleCondition(part, context)
      andResult = andResult && result
      if (!andResult) break
    }
    if (andResult) {
      return true
    }
  }
  return false
}

function evaluateSimpleCondition(expr: string, context: Record<string, any>): boolean {
  let expression = expr.trim()
  let negated = false
  if (expression.startsWith('!')) {
    negated = true
    expression = expression.slice(1).trim()
  }

  const comparison = expression.match(/^([\w.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/)
  let result: boolean

  if (comparison) {
    const leftValue = getPathValue(context, comparison[1])
    const rightValue = resolveTokenValue(comparison[3].trim(), context)

    switch (comparison[2]) {
      case '==':
        result = leftValue === rightValue
        break
      case '!=':
        result = leftValue !== rightValue
        break
      case '>':
      case '>=':
      case '<':
      case '<=': {
        const leftNum = Number(leftValue)
        const rightNum = Number(rightValue)
        if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) {
          result = false
        } else {
          switch (comparison[2]) {
            case '>':
              result = leftNum > rightNum
              break
            case '>=':
              result = leftNum >= rightNum
              break
            case '<':
              result = leftNum < rightNum
              break
            case '<=':
              result = leftNum <= rightNum
              break
            default:
              result = false
          }
        }
        break
      }
      default:
        result = false
    }
  } else {
    const value = resolveTokenValue(expression, context)
    result = Boolean(value)
  }

  return negated ? !result : result
}

function resolveTokenValue(token: string, context: Record<string, any>): any {
  const trimmed = token.trim()

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return trimmed.slice(1, -1)
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (trimmed === 'undefined') return undefined

  const pathValue = getPathValue(context, trimmed)
  if (pathValue !== undefined) {
    return pathValue
  }

  return trimmed
}

function getPathValue(source: Record<string, any>, path: string): any {
  const parts = path.split('.')
  let current: any = source
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}
