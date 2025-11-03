import {
  World,
  WorldLogger,
  CollectiveIntelligence,
  loadMaterials,
  formatLogEntry
} from '@mds'

import type { Entity } from '@mds/0-foundation/entity'

const logElement = document.getElementById('world-log') as HTMLPreElement
const logCountEl = document.getElementById('log-count') as HTMLElement
const lastUpdateEl = document.getElementById('last-update') as HTMLElement
const clockEl = document.getElementById('world-clock') as HTMLElement
const climateGrid = document.getElementById('climate-grid') as HTMLElement
const climateSummaryEl = document.getElementById('climate-summary') as HTMLElement
const entityListEl = document.getElementById('entity-list') as HTMLElement

const logger = new WorldLogger(400)
const world = new World({
  logger,
  features: {
    ontology: true,
    history: true,
    communication: true,
    linguistics: true,
    rendering: 'headless'
  },
  linguistics: {
    enabled: true,
    analyzeEvery: 20
  }
})

const logBuffer: string[] = []

const MAX_VISIBLE_LOGS = 140

function pushLog(entry: string) {
  logBuffer.push(entry)
  if (logBuffer.length > 600) {
    logBuffer.splice(0, logBuffer.length - 600)
  }
  logElement.textContent = logBuffer.slice(-MAX_VISIBLE_LOGS).join('\n')
  logElement.scrollTop = logElement.scrollHeight
  logCountEl.textContent = `${logBuffer.length} entries`
  lastUpdateEl.textContent = `Updated ${new Date().toLocaleTimeString()}`
}

logger.subscribe(entry => {
  pushLog(formatLogEntry(entry))
})

const [athenaMaterial, curiousMaterial] = await loadMaterials([
  '/materials/examples/entity.athena.lexicon.mdm',
  '/materials/entities/paper.curious.mdm'
])

const radioMaterial = {
  material: 'entity.radio.seed',
  intent: 'broadcast',
  essence: {
    en: 'Shortwave emitter whispering fragments of distant signals.'
  },
  manifestation: {
    emoji: '📻'
  },
  utterance: {
    policy: {
      modes: ['short'],
      defaultMode: 'short'
    }
  }
}

const athena = world.spawn(athenaMaterial, { x: 0, y: 0 })
const curious = world.spawn(curiousMaterial, { x: 24, y: 12 })
const radio = world.spawn(radioMaterial as any, { x: -24, y: -18 })

const radioPhrases = [
  'Signal inbound',
  'Echo pattern 7B',
  'Decrypt twilight',
  'All channels quiet',
  'Broadcast context pending'
]
let radioIndex = 0

setInterval(() => {
  const phrase = radioPhrases[radioIndex % radioPhrases.length]
  radioIndex++
  world.recordSpeech(radio, phrase, athena)
}, 4200)

const climateFrames = [
  { 'climate.vitality': 0.62, 'climate.harmony': 0.58, 'climate.tension': 0.18, 'climate.grief': 0.12 },
  { 'climate.vitality': 0.44, 'climate.harmony': 0.32, 'climate.tension': 0.42, 'climate.grief': 0.26 },
  { 'climate.vitality': 0.28, 'climate.harmony': 0.21, 'climate.tension': 0.62, 'climate.grief': 0.34 },
  { 'climate.vitality': 0.51, 'climate.harmony': 0.47, 'climate.tension': 0.24, 'climate.grief': 0.18 }
]
let climateIndex = 0

setInterval(() => {
  const frame = climateFrames[climateIndex % climateFrames.length]
  climateIndex++
  applyClimateFrame(frame)
  world.broadcastContext({
    ...frame,
    'climate.mood': CollectiveIntelligence.describeClimate({
      grief: frame['climate.grief'] ?? 0,
      vitality: frame['climate.vitality'] ?? 0.5,
      tension: frame['climate.tension'] ?? 0,
      harmony: frame['climate.harmony'] ?? 0.5
    })
  })
}, 6000)

function applyClimateFrame(frame: Record<string, number>): void {
  const climate = (world as any).emotionalClimate as
    | undefined
    | {
        grief: number
        vitality: number
        tension: number
        harmony: number
      }

  if (!climate) return

  const clamp = (value: number) => Math.min(1, Math.max(0, value))

  if ('climate.grief' in frame) {
    climate.grief = clamp(frame['climate.grief'] ?? climate.grief)
  }
  if ('climate.vitality' in frame) {
    climate.vitality = clamp(frame['climate.vitality'] ?? climate.vitality)
  }
  if ('climate.tension' in frame) {
    climate.tension = clamp(frame['climate.tension'] ?? climate.tension)
  }
  if ('climate.harmony' in frame) {
    climate.harmony = clamp(frame['climate.harmony'] ?? climate.harmony)
  }
}

function describeEntity(entity: Entity): string {
  const emoji = entity.m.manifestation?.emoji ?? '🌱'
  const emotion = entity.emotion
  const valence = emotion ? emotion.valence.toFixed(2) : '0.00'
  const arousal = emotion ? emotion.arousal.toFixed(2) : '0.50'
  const criticalNeeds = entity.getCriticalNeeds()
  const context = entity.getTriggerContextSnapshot?.() ?? {}
  const lastTranslation = context['translation.last.text'] as string | undefined
  const lastMode = context['utterance.mode'] as string | undefined

  const tags: string[] = []
  if (criticalNeeds.length > 0) {
    tags.push(`needs: ${criticalNeeds.join(', ')}`)
  }
  if (lastMode) {
    tags.push(`mode: ${lastMode}`)
  }
  if (lastTranslation && entity === athena) {
    tags.push(`last translation: ${lastTranslation}`)
  }

  return `
    <article class="entity-card">
      <header>
        <span>${emoji}</span>
        <code>${entity.id}</code>
      </header>
      <div class="body">
        <div>intent: ${entity.m.intent ?? 'observe'}</div>
        <div>emotion: v:${valence} a:${arousal}</div>
      </div>
      ${tags.length > 0 ? `<div class="tags">${tags.map(renderTag).join('')}</div>` : ''}
    </article>
  `
}

function renderTag(tag: string): string {
  return `<span class="tag">${tag}</span>`
}

function renderClimate() {
  const climate = world.getEmotionalClimate()
  climateSummaryEl.textContent = CollectiveIntelligence.describeClimate(climate)
  const entries = [
    { label: 'Vitality', value: climate.vitality },
    { label: 'Harmony', value: climate.harmony },
    { label: 'Tension', value: climate.tension },
    { label: 'Grief', value: climate.grief }
  ]

  climateGrid.innerHTML = entries
    .map(
      ({ label, value }) => `
        <div class="climate-card">
          <div class="label">${label}</div>
          <div class="value">${value.toFixed(2)}</div>
        </div>
      `
    )
    .join('')
}

function renderEntities() {
  entityListEl.innerHTML = world.entities.map(describeEntity).join('')
}

function updateClock() {
  clockEl.textContent = `T+${world.worldTime.toFixed(1)}s`
}

function tickLoop() {
  world.tick(0.5)
  updateClock()
  renderClimate()
  renderEntities()
  requestAnimationFrame(tickLoop)
}

renderClimate()
renderEntities()
tickLoop()
