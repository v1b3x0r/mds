// @ts-nocheck
// Legacy Blessed world session preserved for compatibility but excluded from current type checks.

/**
 * Hi-Introvert: World Session
 *
 * Manages world state and entity interactions:
 * - Loads .mdm files for entity definitions
 * - Tracks vocabulary, growth, and conversation context
 * - Supports save/load sessions
 * - Emits events for UI integration
 * - Cultivates companion growth through interaction
 */

import {
  World,
  Entity,
  EmotionalState,
  toWorldFile,
  fromWorldFile,
  Environment,
  Weather,
  EnergySystem,
  initializeThermalProperties,
  DialogueManager,
  MemoryConsolidation,
  SymbolicPhysicalCoupler,
  CollectiveIntelligence,
  MemoryLog,
  createMemoryLog,
  TrustSystem
} from '@v1b3x0r/mds-core'
import { validateMaterial } from '@v1b3x0r/mds-core/validator'
import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ContextAnalyzer} from './ContextAnalyzer.js'
import { MemoryPromptBuilder } from './MemoryPromptBuilder.js'
import { GrowthTracker } from './GrowthTracker.js'
// import { OSSensor } from '../sensors/OSSensor.js'  // Removed in v2.0
// import { ExtendedSensors } from '../sensors/ExtendedSensors.js'  // Removed in v2.0
import { CompanionLoader } from './CompanionLoader.js'
import { DialogueEnhancer } from './DialogueEnhancer.js'
import { CategoryMapper } from './CategoryMapper.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Load .mdm file from entities directory
 * Works both in development (src/) and production (dist/)
 */
function loadMDM(filename: string): any {
  // Try production path first (dist/../entities)
  let mdmPath = path.join(__dirname, '../entities', filename)

  // Fallback to development path (src/../../entities)
  if (!fs.existsSync(mdmPath)) {
    mdmPath = path.join(__dirname, '../../entities', filename)
  }

  const content = fs.readFileSync(mdmPath, 'utf-8')
  const material = JSON.parse(content)
  const result = validateMaterial(material, {
    requireSchema: false,
    minVersion: '5.0'
  })

  if (!result.valid) {
    const blocking = result.errors.filter(issue =>
      issue.severity === 'error' &&
      issue.field !== 'material'
    )

    if (blocking.length > 0) {
      const details = blocking
        .map(error => `${error.field}: ${error.message}`)
        .join('; ')
      throw new Error(`MDM validation failed for ${filename}: ${details}`)
    }

    console.warn(
      `warn: MDM validation issues for ${filename} (allowed legacy format): ${result.errors
        .map(error => `${error.field}: ${error.message}`)
        .join('; ')}`
    )
  }

  if (result.warnings.length > 0) {
    console.warn(
      `⚠️  MDM warnings for ${filename}: ${result.warnings
        .map(warning => `${warning.field}: ${warning.message}`)
        .join('; ')}`
    )
  }

  return material
}

// Companion loader (v1.2: Dynamic companion selection)
const companionLoader = new CompanionLoader()

// Load traveler (user entity - always the same)
const travelerMDM = loadMDM('traveler.mdm')

export interface EntityInfo {
  name: string
  entity: Entity
  previousValence: number
}

export interface MessageResponse {
  name: string
  response: string
  emotion: EmotionalState
  previousValence: number
  newWordsLearned?: string[]
}

export class WorldSession extends EventEmitter {
  world: World
  entities: Map<string, EntityInfo> = new Map()

  // Impersonation: user controls one entity
  impersonatedEntity!: EntityInfo  // traveler (controlled by user)
  companionEntity!: EntityInfo     // companion (autonomous AI)

  // Growth tracking (vocabulary, concepts)
  // v5.8.2: Removed VocabularyTracker - using world.lexicon as SSOT
  conversationCount: number = 0     // Track conversation count for growth metrics
  contextAnalyzer: ContextAnalyzer
  promptBuilder: MemoryPromptBuilder
  growthTracker: GrowthTracker
  autoSaveEnabled: boolean = false  // v6.3: Disabled - BlessedApp handles save with history
  silentMode: boolean = false  // v6.3: Disable console.log for TUI mode

  // v5.7.1: Chat trigger context tracking
  lastMessageTime: number = Date.now()

  // v6.2: Environment System
  environment: Environment                     // MDS environment (temperature, light, humidity)
  osSensor: OSSensor                          // OS metrics → environment mapping
  extendedSensors: ExtendedSensors            // v6.3: Extended OS sensors (network, storage, circadian, etc.)
  weather: Weather                            // Weather system (rain, wind, clouds)
  energySystem: EnergySystem                  // Thermal energy transfer

  // v6.2: Communication & Cognition
  dialogueManager: DialogueManager            // Branching conversations
  memoryConsolidation: MemoryConsolidation    // Memory merging & forgetting

  // v6.2: Advanced Systems (Tasks 8-14)
  coupler: SymbolicPhysicalCoupler            // Emotion → physics coupling
  worldMind: CollectiveIntelligence           // Population analytics
  memoryLogs: Map<string, MemoryLog>          // CRDT-based distributed memory (Task 8)
  trustSystems: Map<string, TrustSystem>      // Trust & Privacy per entity (Task 9)

  // v6.3: Interval tracking for proper cleanup
  private intervals: NodeJS.Timeout[] = []

  // v1.2: Companion metadata
  companionId: string  // e.g. "hi_introvert" or "orz-archivist"

  // v6.5: Dialogue Enhancement (micro-variations, emotional breathing)
  dialogueEnhancer: DialogueEnhancer
  categoryMapper: CategoryMapper  // v6.5 Phase 2: Context-aware category mapping
  recentCategories: string[] = [] // Track recent dialogue categories for variety

  constructor(options?: { companionId?: string }) {
    super()  // Call EventEmitter constructor

    // v1.2: Load companion from ID or use default
    const companion = companionLoader.getOrDefault(options?.companionId)
    this.companionId = companion.id

    // Log companion selection (silent mode respects this)
    if (!this.silentMode) {
      console.log(`📚 Companion: ${companion.id}`)
      console.log(`   "${companion.essence.substring(0, 60)}..."`)
    }
    // Initialize World with full features + LLM
    this.world = new World({
      features: {
        ontology: true,
        communication: true,
        cognition: true,         // v5.5: Enable P2P cognition for entity-to-entity
        history: true,
        linguistics: true,
        rendering: 'headless'
      },
      linguistics: {
        analyzeEvery: 5,   // Analyze every 5 ticks (was 30) - faster pattern detection
        minUsage: 1,       // Accept single usage (was 3) - capture all unique phrases
        maxTranscript: 500
      },
      llm: {
        provider: 'openrouter',
        apiKey: process.env.OPENROUTER_KEY,
        languageModel: 'anthropic/claude-3.5-sonnet'
      }
    })

    // Initialize growth systems
    // v5.8.3: Pass world to promptBuilder (needs access to world.lexicon)
    this.contextAnalyzer = new ContextAnalyzer()
    this.promptBuilder = new MemoryPromptBuilder(this.world)
    this.growthTracker = new GrowthTracker()

    // v6.2: Initialize environment system
    this.environment = new Environment({
      baseTemperature: 293,    // Start at 20°C
      baseHumidity: 0.5,       // Moderate
      baseLight: 0.8,          // Bright
      windVelocity: { vx: 0, vy: 0 },
      timeScale: 0             // Static (OS sensors drive changes)
    })
    this.osSensor = new OSSensor()

    // v6.3: Initialize extended sensors (network, storage, circadian, etc.)
    this.extendedSensors = new ExtendedSensors()

    // v6.2: Initialize weather system (variable preset)
    this.weather = new Weather({
      rainProbability: 0.15,
      rainDuration: 40,
      maxRainIntensity: 0.8,
      windVariation: 0.5
    })

    // v6.2: Initialize energy system
    this.energySystem = new EnergySystem({
      thermalTransferRate: 0.1,
      environmentCoupling: 0.05
    })

    // v6.2: Initialize dialogue + memory systems
    this.dialogueManager = new DialogueManager()
    this.memoryConsolidation = new MemoryConsolidation({
      similarityThreshold: 0.7,
      forgettingRate: 0.001,
      consolidationInterval: 45000  // 45 seconds (v6.5: faster to preserve memories before decay)
    })

    // v6.5: Initialize dialogue enhancer (micro-variations, emotional breathing)
    this.dialogueEnhancer = new DialogueEnhancer({
      emotionalBreathing: true,
      memoryContext: true,
      repetitionDamping: true
    })

    // v6.5 Phase 2: Initialize category mapper (context-aware dialogue selection)
    this.categoryMapper = new CategoryMapper()

    // v6.2: Initialize advanced systems (Tasks 8-14)
    this.coupler = new SymbolicPhysicalCoupler({
      arousalToSpeed: 0.5,
      valenceToMass: 0.3,
      dominanceToForce: 0.4,
      enabled: true
    })
    this.worldMind = new CollectiveIntelligence()
    this.memoryLogs = new Map()  // CRDT memory logs (Task 8)
    this.trustSystems = new Map()  // Trust & Privacy (Task 9)

    // Spawn both entities (both autonomous initially)
    this.spawnCompanion()
    this.spawnTraveler()

    // Auto-impersonate traveler (user controls traveler by default)
    this.impersonate('traveler')

    // v6.1: Setup P2P Cognition between companion and user (traveler)
    this.setupCognitiveLinks()

    // v6.1: Initialize companion skills (personality-driven proficiencies)
    this.initializeCompanionSkills()

    // Setup environment sensors (broadcast events via setInterval)
    this.setupEnvironmentSensors()

    // Setup intervals (auto-tick, autosave)
    this.setupIntervals()
  }

  /**
   * Set silent mode (disable console.log for TUI)
   */
  setSilentMode(silent: boolean) {
    this.silentMode = silent
  }

  /**
   * Debug logger (respects silent mode)
   */
  private debug(...args: any[]) {
    if (!this.silentMode) {
      console.log(...args)
    }
  }

  /**
   * Setup intervals (auto-tick, autosave)
   * v6.3: Stores interval IDs for cleanup during loadSession()
   */
  private setupIntervals() {
    // Auto-tick world (2 FPS)
    const tickInterval = setInterval(() => {
      this.world.tick(1 / 2)
    }, 500)
    this.intervals.push(tickInterval)

    // Autosave every 30 seconds
    const saveInterval = setInterval(() => {
      if (this.autoSaveEnabled) {
        this.saveSession()
      }
    }, 30000)
    this.intervals.push(saveInterval)
  }

  /**
   * Clear all intervals (called before loadSession)
   * v6.3: Prevents interval leak when loading session
   */
  private clearIntervals() {
    for (const interval of this.intervals) {
      clearInterval(interval)
    }
    this.intervals = []
  }

  /**
   * Impersonate: User controls an entity
   * Disables autonomous behavior for that entity
   */
  impersonate(entityName: string) {
    const entity = this.entities.get(entityName)
    if (!entity) {
      this.emit('error', { type: 'impersonate', message: `Entity "${entityName}" not found` })
      return
    }

    // Disable autonomous (user controls now)
    entity.entity.disableAutonomous()
    this.impersonatedEntity = entity

    this.emit('impersonate', { entityName })
  }

  /**
   * Unpossess: Release control back to AI
   */
  unpossess() {
    if (!this.impersonatedEntity) return

    const entityName = this.impersonatedEntity.name

    // Re-enable autonomous
    this.impersonatedEntity.entity.enableAutonomous()
    this.emit('unpossess', { entityName })

    this.impersonatedEntity = null as any  // Reset (but keep reference for type safety)
  }

  /**
   * Spawn companion entity (AI, autonomous)
   * v1.2: Uses companion selected in constructor
   */
  private spawnCompanion() {
    const companion = companionLoader.get(this.companionId)!
    this.companionEntity = this.spawnEntity('companion', companion.material)
  }

  /**
   * Spawn traveler entity (AI, autonomous, but will be impersonated by user)
   */
  private spawnTraveler() {
    this.impersonatedEntity = this.spawnEntity('traveler', travelerMDM)
  }

  /**
   * Generic entity spawn helper
   */
  private spawnEntity(name: string, material: any): EntityInfo {
    // Spawn entity at random position
    const x = 50 + Math.random() * 100
    const y = 50 + Math.random() * 100
    const entity = this.world.spawn(material, x, y)

    // Enable all features (autonomous by default)
    // v6.4: Added 'consolidation' - was missing wiring!
    entity.enable('memory', 'learning', 'relationships', 'skills', 'consolidation')
    entity.enableAutonomous()

    // v6.2: Initialize thermal properties
    initializeThermalProperties(
      entity,
      293,   // 20°C default temperature
      0.5,   // 50% humidity
      1.0,   // Normal density
      0.5    // Medium conductivity
    )

    // Remember own identity
    const essence = typeof material.essence === 'string'
      ? material.essence
      : material.essence?.th || material.essence?.en || 'An entity'

    entity.remember({
      type: 'spawn',
      subject: 'self',
      content: { name, essence },
      timestamp: Date.now(),
      salience: 1.0
    })

    // v6.2: Create CRDT memory log for this entity (Task 8)
    const memoryLog = createMemoryLog(entity.uuid)
    this.memoryLogs.set(entity.uuid, memoryLog)

    // v6.2: Create Trust & Privacy system for this entity (Task 9)
    const trustSystem = new TrustSystem({
      initialTrust: 0.5,
      trustThreshold: 0.6
    })
    // Default: share emotions publicly, memories need trust
    trustSystem.setSharePolicy('emotion', 'public')
    trustSystem.setSharePolicy('memory', 'trust')
    this.trustSystems.set(entity.uuid, trustSystem)

    const entityInfo: EntityInfo = {
      name,
      entity,
      previousValence: entity.emotion.valence
    }

    this.entities.set(name, entityInfo)
    return entityInfo
  }

  /**
   * Setup environment sensors using broadcastEvent pattern
   *
   * Instead of dedicated sensor API, we use:
   * setInterval → world.broadcastEvent → entity.inbox
   *
   * v6.3: All intervals are tracked in this.intervals array for cleanup
   */
  private setupEnvironmentSensors() {
    // Sensors broadcast to all entities in world
    // (not specific to one entity)

    // System context (broadcast once on startup)
    this.world.broadcastEvent('system_context', {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      context: 'terminal'
    })

    // Time-of-day sensor (broadcast every 30 seconds)
    const timeInterval = setInterval(() => {
      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()

      let timeOfDay = 'night'
      if (hour >= 5 && hour < 12) timeOfDay = 'morning'
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
      else if (hour >= 17 && hour < 21) timeOfDay = 'evening'

      this.world.broadcastEvent('time_update', {
        hour,
        minute,
        timeOfDay,
        timestamp: now.toISOString()
      })

      // Entities have 10% chance to notice time passing
      for (const entityInfo of this.entities.values()) {
        if (entityInfo.entity.memory && Math.random() < 0.1) {
          entityInfo.entity.remember({
            type: 'observation',
            subject: 'time',
            content: { timeOfDay, hour },
            timestamp: Date.now(),
            salience: 0.2
          })
        }
      }
    }, 30000)
    this.intervals.push(timeInterval)

    // Session duration (broadcast every 5 minutes)
    const startTime = Date.now()
    const durationInterval = setInterval(() => {
      const duration = Date.now() - startTime
      const minutes = Math.floor(duration / 60000)

      if (minutes > 0) {
        this.world.broadcastEvent('session_duration', {
          duration,
          minutes
        })

        // Entities notice long conversation
        for (const entityInfo of this.entities.values()) {
          if (entityInfo.entity.memory && minutes % 5 === 0) {
            entityInfo.entity.remember({
              type: 'observation',
              subject: 'conversation',
              content: { duration: `${minutes} minutes` },
              timestamp: Date.now(),
              salience: 0.3
            })
          }
        }
      }
    }, 300000)  // 5 minutes
    this.intervals.push(durationInterval)

    // v6.2: Longing field check (every 2 minutes)
    // Companion may miss traveler if high familiarity but no recent interaction
    const longingInterval = setInterval(() => {
      this.spawnLongingField(this.companionEntity, 'traveler')
    }, 120000)  // 2 minutes
    this.intervals.push(longingInterval)

    // v6.2: OS Environment sensor (update every 10 seconds)
    const osInterval = setInterval(() => {
      const metrics = this.osSensor.getMetrics()
      const envMapping = this.osSensor.mapToEnvironment(metrics)

      // Update MDS Environment dynamically
      this.environment['config'].baseTemperature = envMapping.temperature
      this.environment['config'].baseHumidity = envMapping.humidity
      this.environment['config'].baseLight = envMapping.light
      this.environment['config'].windVelocity = {
        vx: envMapping.windVx,
        vy: envMapping.windVy
      }

      // v5.8.0: Broadcast OS metrics to world (for trigger context)
      this.world.broadcastContext({
        'cpu.usage': metrics.cpuUsage,
        'memory.usage': metrics.memoryUsage,
        'battery.level': metrics.batteryLevel,
        'battery.charging': metrics.batteryCharging ? 1 : 0,
        'system.uptime': metrics.uptime,
        'system.load': metrics.loadAverage[0]
      })

      // Broadcast environment change event (legacy)
      this.world.broadcastEvent('environment_update', {
        temperature: envMapping.temperature,
        humidity: envMapping.humidity,
        light: envMapping.light,
        wind: { vx: envMapping.windVx, vy: envMapping.windVy }
      })

      // Emit for monitoring
      this.emit('environment', {
        metrics,
        mapping: envMapping
      })
    }, 10000)  // 10 seconds
    this.intervals.push(osInterval)

    // v6.2: Weather system update (every 2 seconds)
    const weatherInterval = setInterval(() => {
      // Update weather state
      this.weather.update(2)  // 2 seconds dt

      const weatherState = this.weather.getState()

      // Weather affects environment
      if (weatherState.rain) {
        // Rain increases humidity, reduces light (cloud cover)
        this.environment['config'].baseHumidity = Math.min(1, this.environment['config'].baseHumidity + weatherState.rainIntensity * 0.3)
        this.environment['config'].baseLight = Math.max(0.2, this.environment['config'].baseLight * (1 - weatherState.cloudCover))

        // Wind multiplier
        const windMult = weatherState.windStrength
        this.environment['config'].windVelocity = {
          vx: this.environment['config'].windVelocity.vx * windMult,
          vy: this.environment['config'].windVelocity.vy * windMult
        }

        // Broadcast rain event
        this.world.broadcastEvent('weather_rain', {
          intensity: weatherState.rainIntensity,
          cloudCover: weatherState.cloudCover,
          windStrength: weatherState.windStrength
        })

        // Emit for monitoring
        this.emit('weather', {
          type: 'rain',
          intensity: weatherState.rainIntensity,
          cloudCover: weatherState.cloudCover
        })

        // v6.3: Broadcast weather context → let MDM triggers handle emotion
        // (Removed direct emotion manipulation for ontology-first compliance)
        this.world.broadcastContext({
          'weather.rain': weatherState.rainIntensity,
          'weather.cloudCover': weatherState.cloudCover,
          'weather.windStrength': weatherState.windStrength
        })
      }
    }, 2000)  // 2 seconds
    this.intervals.push(weatherInterval)

    // v6.2: Memory Consolidation (every 1 minute)
    const memoryInterval = setInterval(() => {
      const companion = this.companionEntity.entity

      // Consolidate companion memories
      if (companion.memory?.memories && companion.memory.memories.length > 5) {
        const consolidated = this.memoryConsolidation.consolidate(companion.memory.memories)

        if (consolidated.length > 0) {
          // v6.4: Apply consolidated memories back to buffer (was missing!)
          // Replace weak memories with strong consolidated ones
          const weakMemories = companion.memory.memories
            .map((m, i) => ({ memory: m, index: i }))
            .filter(item => item.memory.salience < 0.3)
            .sort((a, b) => a.memory.salience - b.memory.salience)  // Weakest first

          const strongConsolidated = consolidated
            .filter(cm => cm.strength > 0.7)
            .slice(0, Math.min(10, weakMemories.length))  // Max 10 replacements per cycle

          // Replace weakest memories with strongest consolidated
          // v6.4: Add bounds check to prevent index out of bounds
          const maxReplacements = Math.min(strongConsolidated.length, weakMemories.length)
          for (let i = 0; i < maxReplacements; i++) {
            const cm = strongConsolidated[i]
            const targetIndex = weakMemories[i].index

            // Convert ConsolidatedMemory → Memory format
            companion.memory.memories[targetIndex] = {
              type: cm.type,
              subject: cm.subject,
              content: cm.content,
              salience: cm.salience,
              timestamp: cm.lastRehearsal
            }
          }

          this.emit('memory-consolidation', {
            entity: 'companion',
            count: consolidated.length,
            replacedCount: strongConsolidated.length,
            strongest: consolidated.slice(0, 3).map((m: any) => ({
              subject: m.subject,
              strength: m.strength.toFixed(2),
              rehearsals: m.rehearsalCount
            }))
          })
        }
      }

      // Apply forgetting curve
      this.memoryConsolidation.applyForgetting(60)  // 60 seconds

      // v6.2: Trust decay (Task 9)
      for (const trustSystem of this.trustSystems.values()) {
        trustSystem.decayTrust(60)  // 60 seconds decay
      }
    }, 60000)  // 1 minute
    this.intervals.push(memoryInterval)

    // v6.3: Extended OS sensors (every 30 seconds)
    const extendedSensorsInterval = setInterval(() => {
      const ext = this.extendedSensors.getAllMetrics()

      // Broadcast all extended sensor contexts to world
      this.world.broadcastContext({
        // Network state
        'network.connected': ext.network.connected ? 1 : 0,
        'network.interfaceCount': ext.network.interfaceCount,
        'network.hasIPv6': ext.network.hasIPv6 ? 1 : 0,
        'network.latency': ext.network.latency || 0,

        // Storage metrics
        'storage.totalGB': ext.storage.totalGB,
        'storage.freeGB': ext.storage.freeGB,
        'storage.usagePercent': ext.storage.usagePercent,

        // Circadian phase (map to numeric for triggers)
        'circadian.phase': ext.circadian,
        'circadian.isDawn': ext.circadian === 'dawn' ? 1 : 0,
        'circadian.isMorning': ext.circadian === 'morning' ? 1 : 0,
        'circadian.isNoon': ext.circadian === 'noon' ? 1 : 0,
        'circadian.isAfternoon': ext.circadian === 'afternoon' ? 1 : 0,
        'circadian.isDusk': ext.circadian === 'dusk' ? 1 : 0,
        'circadian.isEvening': ext.circadian === 'evening' ? 1 : 0,
        'circadian.isNight': ext.circadian === 'night' ? 1 : 0,

        // Brightness
        'screen.brightness': ext.brightness,

        // Process count (system busyness)
        'system.processCount': ext.processCount,

        // Git state (developer companion feature)
        'git.inRepo': ext.git.inRepo ? 1 : 0,
        'git.diffLines': ext.git.diffLines,
        'git.stagedLines': ext.git.stagedLines,
        'git.hasChanges': ext.git.hasChanges ? 1 : 0
      })

      // Emit for monitoring
      this.emit('extended-sensors', {
        network: ext.network,
        storage: ext.storage,
        circadian: ext.circadian,
        brightness: ext.brightness,
        processCount: ext.processCount,
        git: ext.git
      })
    }, 30000)  // 30 seconds
    this.intervals.push(extendedSensorsInterval)

    // v6.2: Energy + Collision system (every 1 second)
    const energyInterval = setInterval(() => {
      const allEntities = Array.from(this.entities.values()).map(info => info.entity)

      // 1. Check for collision (proximity-based, headless mode)
      const companion = this.companionEntity.entity
      const traveler = this.impersonatedEntity.entity

      const dx = traveler.x - companion.x
      const dy = traveler.y - companion.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      const collisionRadius = 50  // Entities "collide" when < 50px apart

      if (distance < collisionRadius) {
        // Collision detected!
        this.emit('collision', {
          entities: ['companion', 'traveler'],
          distance: distance.toFixed(1)
        })

        // Broadcast collision event
        this.world.broadcastEvent('entity_collision', {
          a: 'companion',
          b: 'traveler',
          distance
        })
      }

      // 2. Energy transfer (entity-to-entity thermal exchange)
      this.energySystem.updateEntityTransfer(allEntities, 1)  // 1 second dt

      // 3. Energy transfer (environment coupling)
      this.energySystem.updateEnvironmentTransfer(allEntities, this.environment, 1)

      // 4. Apply emotion → physics coupling (Task 10)
      for (const entity of allEntities) {
        const physProps = this.coupler.emotionToPhysics(entity.emotion)

        // Apply physics properties to entity movement
        if (physProps && physProps.speed !== undefined) {
          // Random drift based on emotion-modulated speed
          const baseSpeed = 2  // pixels per second
          const emotionalSpeed = baseSpeed * physProps.speed

          // Random walk with emotional influence
          const angle = Math.random() * Math.PI * 2
          const dx = Math.cos(angle) * emotionalSpeed
          const dy = Math.sin(angle) * emotionalSpeed

          // Update position (bounded to world size)
          entity.x = Math.max(0, Math.min(800, entity.x + dx))
          entity.y = Math.max(0, Math.min(600, entity.y + dy))

          // Store for monitoring
          entity['_physProps'] = physProps
        }
      }

      // 5. Emit thermal state for monitoring (every 5 updates = 5 seconds)
      if (Date.now() % 5000 < 1000) {
        this.emit('thermal', {
          companion: {
            temperature: (companion.temperature - 273).toFixed(1) + '°C',
            humidity: ((companion.humidity || 0) * 100).toFixed(0) + '%'
          },
          traveler: {
            temperature: (traveler.temperature - 273).toFixed(1) + '°C',
            humidity: ((traveler.humidity || 0) * 100).toFixed(0) + '%'
          }
        })
      }
    }, 1000)  // 1 second
    this.intervals.push(energyInterval)

    // v6.2: World Mind analytics (every 30 seconds) - Task 12
    const worldMindInterval = setInterval(() => {
      const allEntities = Array.from(this.entities.values()).map(info => info.entity)

      // Use static methods
      const stats = CollectiveIntelligence.calculateStats(allEntities)
      const patterns = CollectiveIntelligence.detectPatterns(allEntities)
      const collectiveEmotion = CollectiveIntelligence.calculateCollectiveEmotion(allEntities)

      this.emit('world-mind', {
        stats,
        patterns,
        collectiveEmotion
      })
    }, 30000)
    this.intervals.push(worldMindInterval)
  }


  /**
   * Get all entities (for UI)
   */
  getAllEntities(): EntityInfo[] {
    return Array.from(this.entities.values())
  }

  /**
   * Get entity info (backwards compat - returns companion entity)
   */
  getEntityInfo(): EntityInfo | null {
    return this.companionEntity || null
  }

  /**
   * Get entity greeting (on session start)
   * Companion greets the user (who controls traveler)
   */
  getGreeting(): string {
    const entity = this.companionEntity.entity

    // Check if companion remembers traveler (returning visitor)
    const travelerMemories = entity.memory?.recall({ subject: 'traveler' }) || []

    if (travelerMemories.length === 0) {
      // First meeting - use intro dialogue
      return entity.speak('intro') || 'Hi...'
    } else {
      // Returning visitor - use greeting_familiar
      const greeting = entity.speak('greeting_familiar') || 'Welcome back!'
      return greeting
    }
  }

  /**
   * Handle user message
   * User "speaks through" impersonated traveler → companion responds
   */
  async handleUserMessage(message: string): Promise<MessageResponse> {
    const traveler = this.impersonatedEntity.entity
    const companion = this.companionEntity.entity

    // 0. v5.8.0: Broadcast context to world (replaces manual updateTriggerContext)
    const now = Date.now()
    const silenceDuration = this.lastMessageTime
      ? (now - this.lastMessageTime) / 1000
      : 0

    this.world.broadcastContext({
      'user.message': message,
      'user.silence': silenceDuration
    })

    this.lastMessageTime = now

    // 1. Record traveler's speech (v5.8.3: Let core handle vocabulary via Crystallizer)
    // World will crystallize patterns automatically via world.lexicon
    this.world.recordSpeech(traveler, message)

    // 2. Analyze context (from companion's perspective)
    const context = this.contextAnalyzer.analyzeIntent(message, companion)

    // 3. Broadcast context emotion hint → let MDM triggers handle emotion
    // v6.3: Removed direct emotion manipulation for ontology-first compliance
    if (context.emotionHint) {
      this.world.broadcastContext({
        'context.valence': context.emotionHint.valence,
        'context.arousal': context.emotionHint.arousal,
        'user.intent': context.intent
      })
    }

    // 4. Traveler "speaks" (controlled by user)
    if (traveler.memory) {
      traveler.remember({
        type: 'interaction',
        subject: this.companionEntity.name,
        content: { message, intent: context.intent },
        timestamp: Date.now(),
        salience: 0.7
      })
    }

    // 5. Companion remembers traveler's message
    // v6.5: Higher salience for user messages (1.0 instead of 0.7)
    // User conversations are always important and should persist longer
    companion.remember({
      type: 'interaction',
      subject: 'traveler',
      content: { message, intent: context.intent },
      timestamp: Date.now(),
      salience: 1.0  // Maximum salience for user messages
    })

    // v6.6: Name extraction (human-like memory)
    // Extract names from message and store as semantic units
    // Works for any entity (not just traveler) - cultivation, not hardcode
    const namePatterns = [
      { pattern: /(?:ผม|ฉัน|กู)ชื่อ\s+(\w+)/gi, owner: 'self' },           // "ผมชื่อ X" → self
      { pattern: /(?:my|our)\s+name\s+is\s+(\w+)/gi, owner: 'self' },       // "my name is X" → self
      { pattern: /call\s+me\s+(\w+)/gi, owner: 'self' },                    // "call me X" → self
      { pattern: /เพื่อน(?:ผม|ฉัน|กู)ชื่อ\s+(\w+)/gi, owner: 'other' },   // "เพื่อนผมชื่อ X" → other
      { pattern: /friend.*?name.*?is\s+(\w+)/gi, owner: 'other' },          // "friend's name is X" → other
      { pattern: /คุณชื่อ\s+(\w+)/gi, owner: 'addressee' },                 // "คุณชื่อ X" → addressee (companion)
      { pattern: /your\s+name\s+is\s+(\w+)/gi, owner: 'addressee' }         // "your name is X" → addressee
    ]

    for (const { pattern, owner } of namePatterns) {
      const matches = [...message.matchAll(pattern)]
      for (const match of matches) {
        const name = match[1]
        if (name && name.length > 1) {
          // Determine actual owner based on context
          let nameOwner: string
          if (owner === 'self') {
            nameOwner = 'traveler'  // Speaker introduces themselves
          } else if (owner === 'addressee') {
            nameOwner = this.companionEntity.name  // Speaker addresses companion
          } else {
            nameOwner = 'other'  // Third party
          }

          // Store name as separate semantic memory
          companion.remember({
            type: 'interaction',  // Keep same type for ContextAnalyzer compatibility
            subject: name,  // Name is now searchable subject
            content: { type: 'name', owner: nameOwner, introducedAt: Date.now() },
            timestamp: Date.now(),
            salience: 1.0  // Names are very important
          })
        }
      }
    }

    // 6. Form/reinforce cognitive link (entity-to-entity)
    if (companion.cognitiveLinks && traveler.cognitiveLinks) {
      companion.connectTo(traveler, { strength: 0.7, bidirectional: true })
      this.emit('link', {
        from: this.companionEntity.name,
        to: this.impersonatedEntity.name,
        strength: 0.7
      })
    }

    // 7. Get response from companion
    const response = await this.getEntityResponse(message, context)

    // 8. Companion remembers own response
    companion.remember({
      type: 'interaction',
      subject: 'self',
      content: { response },
      timestamp: Date.now(),
      salience: 0.4
    })

    // 9. Record speech for linguistics
    this.world.recordSpeech(companion, response)

    // 10. Learn from interaction (Q-learning)
    const emotionDelta = companion.emotion.valence - this.companionEntity.previousValence
    if (Math.abs(emotionDelta) > 0.1 && companion.learning) {
      companion.learning.addExperience({
        timestamp: Date.now(),
        action: 'respond',
        context: { intent: context.intent },
        outcome: emotionDelta > 0 ? 'positive' : 'negative',
        reward: emotionDelta,
        success: emotionDelta > 0
      })
    }

    // 11. Update growth tracker (v5.8.3: Use world.lexicon)
    this.conversationCount++

    // v6.4: Calculate emotional maturity (was missing!)
    const memoryCount = companion.memory?.memories?.length || 0
    const emotionHistory = companion.memory?.memories.filter(m => m.type === 'emotion') || []

    // Calculate average emotional intensity (0 = stable, 1 = volatile)
    // Default to 0.5 if no emotion history (neutral/moderate stability)
    const avgValence = emotionHistory.length > 0
      ? emotionHistory.reduce((sum, m) => sum + Math.abs((m.content as any).valence || 0), 0) / emotionHistory.length
      : 0.5

    // Stability: Low avgValence = high stability (mature)
    // Fixed: was `1 - Math.min(1, avgValence / 0.5)` which could go negative!
    const emotionStability = 1 - Math.min(1, avgValence)

    const relationshipStrength = companion.relationships?.get('traveler')?.strength || 0

    const emotionalMaturity = Math.min(1, (
      (this.conversationCount / 100) * 0.3 +     // Experience weight (30%)
      (memoryCount / 500) * 0.2 +                // Memory depth (20%)
      emotionStability * 0.3 +                   // Stability (30%)
      relationshipStrength * 0.2                 // Bonding (20%)
    ))

    // Get top emergent words from lexicon
    const topWords = this.world.lexicon.getRecent(10).map(entry => entry.term)

    this.growthTracker.update({
      vocabularySize: this.world.lexicon.size,
      vocabularyWords: topWords,  // Top 10 emergent words
      conversationCount: this.conversationCount,
      memoryCount,
      emotionalMaturity  // ✅ Now calculated!
    })

    // Track concepts learned
    for (const keyword of context.keywords) {
      if (keyword.length > 3) {
        this.growthTracker.learnConcept(keyword)
      }
    }

    // 12. Update previous valence
    this.companionEntity.previousValence = companion.emotion.valence

    // 13. v6.2: Check for "sync moment" (emotional alignment)
    // Spawn field if both entities emotionally aligned
    const valenceDiff = Math.abs(companion.emotion.valence - traveler.emotion.valence)
    const arousalDiff = Math.abs(companion.emotion.arousal - traveler.emotion.arousal)
    const alignment = 1 - (valenceDiff + arousalDiff) / 2

    if (alignment > 0.6) {  // High alignment threshold
      this.spawnSyncMoment(this.companionEntity, this.impersonatedEntity)
    }

    // 14. v6.7: WorldMind Analytics (Collective Intelligence)
    // Calculate world stats and detect emergent patterns
    this.debug('   [WorldMind] Calculating analytics...')
    const allEntities = Array.from(this.entities.values()).map(ei => ei.entity)
    this.debug(`   [WorldMind] Entities: ${allEntities.length}`)
    const worldStats = CollectiveIntelligence.calculateStats(allEntities)
    const patterns = CollectiveIntelligence.detectPatterns(allEntities)
    const collectiveEmotion = CollectiveIntelligence.calculateCollectiveEmotion(allEntities)

    // Emit WorldMind events for UI/logging
    if (patterns.length > 0) {
      this.emit('world-mind:pattern', {
        patterns: patterns.map(p => ({
          pattern: p.pattern,
          strength: p.strength.toFixed(2),
          entities: p.entities.length
        })),
        stats: {
          avgValence: worldStats.avgEmotionalValence?.toFixed(2),
          avgArousal: worldStats.avgEmotionalArousal?.toFixed(2),
          totalMemories: worldStats.totalMemories
        }
      })
    }

    // Store patterns for future use (e.g., influence next response)
    this.worldMind['patterns'] = patterns
    this.worldMind['lastStats'] = worldStats
    this.worldMind['collectiveEmotion'] = collectiveEmotion

    // Debug: Confirm storage
    this.debug(`   [WorldMind] Stored: patterns=${patterns.length}, stats=${!!worldStats}, collectiveEmotion=${!!collectiveEmotion}`)

    // v5.8.5: newWordsLearned deprecated (vocabulary handled by world.lexicon)
    return {
      name: this.companionEntity.name,
      response,
      emotion: { ...companion.emotion },
      previousValence: this.companionEntity.previousValence,
      newWordsLearned: [] // Deprecated: vocabulary tracking moved to world.lexicon
    }
  }

  /**
   * Get entity response (MDM dialogue first, LLM fallback)
   * Companion responds to traveler's message
   */
  private async getEntityResponse(
    userMessage: string,
    context: ReturnType<ContextAnalyzer['analyzeIntent']>
  ): Promise<string> {
    const entity = this.companionEntity.entity

    // 0. v6.7: WorldMind influence (collective intelligence affects response)
    // Check if we have collective emotion data from previous conversation
    const collectiveEmotion = this.worldMind['collectiveEmotion']
    const lastStats = this.worldMind['lastStats']
    const lastPatterns = this.worldMind['patterns'] || []

    // If world mood is strongly negative, companion shows empathy
    // Fallback: if no specific dialogue, adjust context for LLM
    if (collectiveEmotion && collectiveEmotion.valence < -0.4) {
      if (Math.random() < 0.3) {
        const empathyResponses = entity.speak('empathetic') || entity.speak('sad')
        if (empathyResponses) {
          this.debug('   [WorldMind] Collective mood negative → empathetic response')
          return empathyResponses
        }
      }
      // Store hint for LLM fallback
      context['worldMindHint'] = 'empathy'
    }

    // If high emotional synchronization detected, companion feels connected
    const syncPattern = lastPatterns.find(p => p.pattern === 'synchronization')
    if (syncPattern && syncPattern.strength > 0.7) {
      if (Math.random() < 0.25) {
        const connectionResponses = entity.speak('connected') || entity.speak('happy')
        if (connectionResponses) {
          this.debug(`   [WorldMind] Synchronization detected (${syncPattern.strength.toFixed(2)}) → connected response`)
          return connectionResponses
        }
      }
      context['worldMindHint'] = 'synchronization'
    }

    // If stillness pattern (calm world), companion is peaceful
    const stillPattern = lastPatterns.find(p => p.pattern === 'stillness')
    if (stillPattern && stillPattern.strength > 0.8) {
      if (Math.random() < 0.2) {
        const calmResponses = entity.speak('peaceful') || entity.speak('calm') || entity.speak('curious')
        if (calmResponses) {
          this.debug(`   [WorldMind] Stillness detected (${stillPattern.strength.toFixed(2)}) → peaceful response`)
          return calmResponses
        }
      }
      context['worldMindHint'] = 'stillness'
    }

    // 1. Try MDM dialogue first (based on intent)
    let response: string | undefined

    // v6.5 Phase 2: Use CategoryMapper for context-aware category selection
    const mappingResult = this.categoryMapper.map({
      intent: context.intent,
      keywords: context.keywords,
      memoryRelevance: context.relevantMemories.length,
      recentCategories: this.recentCategories,
      userMessage
    }, entity)

    const category = mappingResult.category

    // Log mapping decision (for debugging)
    if (!this.silentMode && mappingResult.reason) {
      console.log(`   [CategoryMapper] ${mappingResult.reason}`)
    }

    if (category) {
      response = entity.speak(category)

      // Track this category for future repetition avoidance
      this.recentCategories.unshift(category)
      if (this.recentCategories.length > 10) {
        this.recentCategories.pop()
      }
    }

    // v6.5: Memory-aware context (check for strong memories to influence dialogue)
    if (!response && entity.memory) {
      const memoryContextKeys = this.dialogueEnhancer.getMemoryContextKeys(entity, 5)

      // If user message matches a strong memory subject, trigger nostalgic response
      const matchingMemory = memoryContextKeys.find(subject =>
        userMessage.toLowerCase().includes(subject.toLowerCase())
      )

      if (matchingMemory) {
        // 40% chance to respond with nostalgic tone when memory is triggered
        if (Math.random() < 0.4) {
          response = entity.speak('nostalgic')
        }
      }

      // If entity has many recent memories (>20), show focus/inspired state
      const recentMemories = entity.memory.memories.filter(m =>
        Date.now() - m.timestamp < 60000  // Last 60 seconds
      )
      if (!response && recentMemories.length > 20) {
        response = entity.speak(Math.random() < 0.5 ? 'focused' : 'inspired')
      }
    }

    // v6.5: Boost salience of recalled memories (rehearsal effect)
    // When user mentions something that triggers relevant memories, strengthen those memories
    if (context.relevantMemories.length > 0 && entity.memory) {
      for (const memory of context.relevantMemories) {
        // Find the memory in buffer and boost its salience
        const memoryInBuffer = entity.memory.memories.find(m =>
          m.timestamp === memory.timestamp &&
          m.subject === memory.subject
        )
        if (memoryInBuffer) {
          memoryInBuffer.salience = Math.min(1.0, memoryInBuffer.salience + 0.15)  // Boost by 15%
        }
      }
    }

    // If new words learned, acknowledge (v5.8.3: Check world.lexicon)
    if (!response && context.keywords.some(k => this.world.lexicon.get(k.toLowerCase()) === undefined)) {
      response = entity.speak('learned_new_word')
    }

    // v6.6: Emergent name recall (human-like memory)
    // If user asks about name and we have name memories, respond with actual name
    if (!response && context.intent === 'question' && context.relevantMemories.length > 0) {
      const nameKeywords = ['ชื่อ', 'name', 'called']
      const asksAboutName = nameKeywords.some(kw => userMessage.toLowerCase().includes(kw))

      if (asksAboutName) {
        // Find name memories (those with content.type === 'name')
        const nameMemories = context.relevantMemories
          .filter(m => m.content?.type === 'name')
          .sort((a, b) => b.salience - a.salience)  // Strongest memory first

        if (nameMemories.length > 0) {
          const bestMemory = nameMemories[0]

          // Salience-based confidence (human-like fuzzy recall)
          if (bestMemory.salience > 0.8) {
            // Clear memory - confident response
            response = `จำได้! คุณชื่อ ${bestMemory.subject}`
          } else if (bestMemory.salience > 0.4) {
            // Fuzzy memory - uncertain response
            const firstChar = bestMemory.subject[0]
            response = `เอ่อ... ${firstChar} อะไรสักอย่าง? 🤔`
          } else {
            // Very weak memory - guess with doubt
            response = `จำได้แต่ไม่แน่ใจ... ${bestMemory.subject} ใช่ไหม? 😅`
          }
        } else {
          // Has relevantMemories but not name type - check if name in subject
          const possibleNames = context.relevantMemories.filter(m =>
            m.subject !== 'traveler' && m.subject !== 'self' && m.subject.length > 1
          )
          if (possibleNames.length > 0) {
            response = `จำได้! คุณชื่อ ${possibleNames[0].subject}`
          }
        }
      }
    }

    // If confused (low memory relevance)
    if (!response && context.relevantMemories.length === 0 && context.intent === 'question') {
      response = entity.speak('confused')
    }

    // Emotion-based fallback (for better variety when intent doesn't match)
    if (!response) {
      const emotion = entity.emotion
      if (emotion.valence > 0.5) {
        response = entity.speak('happy')
      } else if (emotion.valence < -0.3) {
        response = entity.speak('sad')
      } else if (emotion.arousal > 0.6) {
        response = entity.speak('excited')
      } else if (emotion.arousal < 0.3) {
        response = entity.speak('tired')
      } else {
        response = entity.speak('curious')
      }
    }

    // v6.1: Proto-language generation (if vocabulary ≥ 20 words)
    // Emergent language from learned vocabulary + crystallized patterns
    // v6.2: Environment-aware (temperature, light, humidity affect word choice)
    // v5.8.3: Use world.lexicon as SSOT
    if (!response && this.world.lexicon.size >= 20) {
      let vocabularyPool = this.world.lexicon.getAll().map(e => e.term)

      // v6.2: Get environment state at entity position
      const envState = this.environment.getState(entity.x, entity.y)

      // Add environment-based vocabulary modifiers
      const tempCelsius = envState.temperature - 273
      if (tempCelsius > 30) vocabularyPool.push('ร้อน', 'hot', '🥵')
      else if (tempCelsius < 15) vocabularyPool.push('หนาว', 'cold', '🥶')

      if (envState.humidity > 0.7) vocabularyPool.push('ชื้น', 'humid', '💧')
      if (envState.light < 0.4) vocabularyPool.push('มืด', 'dark', '🌙')
      else if (envState.light > 0.8) vocabularyPool.push('สว่าง', 'bright', '☀️')

      // v6.2: Weather-based vocabulary
      const weatherState = this.weather.getState()
      if (weatherState.rain) {
        vocabularyPool.push('ฝนตก', 'rain', '🌧️', 'wet', 'เปียก')
        if (weatherState.rainIntensity > 0.7) {
          vocabularyPool.push('heavy rain', 'ฝนหนัก', '⛈️')
        }
      }

      response = this.world.protoGenerator?.generateResponse(userMessage, {
        vocabularyPool,
        emotion: entity.emotion,
        minWords: 1,
        maxWords: 4,
        allowParticles: true,
        allowEmoji: true,
        creativity: 0.6  // High creativity for emergent language
      })

      // Log proto-language event
      if (response) {
        this.emit('proto-lang', {
          message: response,
          vocabularySize: vocabularyPool.length,
          environment: {
            temperature: tempCelsius.toFixed(1) + '°C',
            humidity: (envState.humidity * 100).toFixed(0) + '%',
            light: (envState.light * 100).toFixed(0) + '%'
          }
        })
      }
    }

    // 2. LLM fallback (if no MDM dialogue matched)
    if (!response && this.world.languageGenerator) {
      try {
        this.emit('llm', { action: 'fallback' })

        const prompt = this.promptBuilder.buildPrompt(
          entity,
          userMessage,
          context
        )

        const llmResponse = await this.world.languageGenerator.generate({
          speaker: entity,
          context: prompt
        })

        response = llmResponse.text
      } catch (error) {
        this.emit('error', { type: 'llm', message: error instanceof Error ? error.message : String(error) })
        response = entity.speak('intro') || '...'
      }
    }

    // 3. Final fallback (generic)
    if (!response) {
      response = entity.speak('intro') || '...'
    }

    // v6.5: Apply dialogue enhancement (micro-variations, emotional breathing)
    // Detect language from response (simple heuristic: Thai chars = Thai, else English)
    const language: 'th' | 'en' = /[\u0E00-\u0E7F]/.test(response) ? 'th' : 'en'
    response = this.dialogueEnhancer.enhance(response, entity, language)

    return response
  }

  /**
   * Spawn new entity friend (LLM-generated essence)
   * Only available when LLM is configured
   */
  async spawnFriend(description?: string): Promise<EntityInfo | null> {
    if (!this.world.languageGenerator) {
      return null  // LLM not available
    }

    // Build prompt for LLM to generate entity essence
    const prompt = description
      ? `Create a companion entity for a chat space. Description: "${description}"\n\nGenerate a JSON object with:\n- essence (Thai + English description of personality)\n- languageProfile (native language + weights)\n- emotion.base (initial valence/arousal/dominance)\n- dialogue (intro, greeting, confused, etc.)\n\nBe creative and make them interesting!`
      : `Create a new companion entity that would be a good friend for an INTP kid. Make them different but complementary.\n\nGenerate a JSON object following the same format as companion.mdm.`

    try {
      const response = await this.world.languageGenerator.generate({
        speaker: this.companionEntity.entity,
        context: prompt
      })

      // Parse LLM response as JSON
      const generatedData = JSON.parse(response.text)

      // Merge with defaults
      const material = {
        $schema: 'mdspec/v5.7',
        material: `entity.friend_${Date.now()}`,
        ...generatedData
      }

      // Spawn entity
      const entity = this.world.spawn(material, 200, 200)
      const name = generatedData.essence?.en?.split(' ')[0] || `Friend${this.entities.size + 1}`

      entity.enable('memory', 'learning', 'relationships')
      entity.enableAutonomous()  // v5.6: New friend also autonomous

      const entityInfo: EntityInfo = {
        name,
        entity,
        previousValence: entity.emotion.valence
      }

      this.entities.set(name, entityInfo)

      // Companion entity remembers meeting new friend
      if (this.companionEntity.entity.memory) {
        this.companionEntity.entity.remember({
          type: 'interaction',
          subject: name,
          content: { action: 'met', essence: generatedData.essence },
          timestamp: Date.now(),
          salience: 0.8
        })
      }

      return entityInfo
    } catch (error) {
      if (!this.silentMode) console.error('[Spawn Error]', error)
      return null
    }
  }

  /**
   * Spawn additional companion by ID (e.g., "orz_archivist")
   * Unlike spawnFriend (LLM-generated), this loads predefined .mdm files
   * v6.x: Multi-companion interaction support
   */
  spawnCompanionById(companionId: string): EntityInfo | null {
    // 1. Load companion from CompanionLoader
    const companionData = companionLoader.get(companionId)

    if (!companionData) {
      const available = companionLoader.list().map(c => c.id).join(', ')
      this.emit('error', {
        type: 'spawn',
        message: `Companion "${companionId}" not found. Available: ${available}`
      })
      return null
    }

    // 2. Check if already spawned
    if (this.entities.has(companionId)) {
      this.emit('error', {
        type: 'spawn',
        message: `Companion "${companionId}" is already in the world`
      })
      return null
    }

    // 3. Spawn entity with full features
    const entityInfo = this.spawnEntity(companionId, companionData.material)

    // 4. Setup cognitive links with existing entities
    const newCompanion = entityInfo.entity
    const hiIntrovert = this.companionEntity.entity
    const traveler = this.impersonatedEntity.entity

    // Connect with hi_introvert (bidirectional, medium-strong bond)
    if (newCompanion.cognitiveLinks && hiIntrovert.cognitiveLinks) {
      newCompanion.connectTo(hiIntrovert, { strength: 0.5, bidirectional: true })
    }

    // Connect with traveler (bidirectional, weaker initial bond)
    if (newCompanion.cognitiveLinks && traveler.cognitiveLinks) {
      newCompanion.connectTo(traveler, { strength: 0.3, bidirectional: true })
    }

    // 5. Memory: Companions remember meeting each other
    if (hiIntrovert.memory) {
      hiIntrovert.remember({
        type: 'interaction',
        subject: companionId,
        content: { action: 'met', essence: companionData.essence, timestamp: Date.now() },
        timestamp: Date.now(),
        salience: 0.7
      })
    }

    if (newCompanion.memory) {
      newCompanion.remember({
        type: 'interaction',
        subject: this.companionEntity.name,
        content: { action: 'met', essence: this.companionEntity.entity.essence, timestamp: Date.now() },
        timestamp: Date.now(),
        salience: 0.7
      })
    }

    this.debug(`v6.x: Spawned companion "${companionId}" with P2P cognition`)
    this.emit('spawn', { name: companionId, entityInfo })

    return entityInfo
  }

  /**
   * Get available companions (for UI display)
   * Returns list of companion IDs with their essences
   */
  getAvailableCompanions(): Array<{ id: string; essence: string }> {
    return companionLoader.list().map(c => ({
      id: c.id,
      essence: c.essence
    }))
  }

  /**
   * Generate autonomous message from companion
   * Companion speaks spontaneously (self-monologue)
   */
  async generateAutonomousMessage(): Promise<{
    name: string
    response: string
    emotion: EmotionalState
  } | null> {
    const companion = this.companionEntity.entity

    // Check if autonomous
    if (!companion.isAutonomous()) {
      return null
    }

    // Use self_monologue dialogue
    let response = companion.speak('self_monologue')

    // Fallback: emotion-based self-talk
    if (!response) {
      const emotion = companion.emotion
      if (emotion.valence > 0.5) {
        response = companion.speak('happy')
      } else if (emotion.valence < -0.3) {
        response = companion.speak('sad')
      } else {
        response = companion.speak('curious')
      }
    }

    // Last resort: proto-language (if vocabulary enough)
    // v5.8.3: Use world.lexicon as SSOT
    if (!response && this.world.lexicon.size >= 20) {
      let vocabularyPool = this.world.lexicon.getAll().map(e => e.term)

      // Environment-aware vocabulary
      const envState = this.environment.getState(companion.x, companion.y)
      const tempCelsius = envState.temperature - 273

      if (tempCelsius > 30) vocabularyPool.push('ร้อน', 'hot', '🥵')
      else if (tempCelsius < 15) vocabularyPool.push('หนาว', 'cold', '🥶')

      if (envState.humidity > 0.7) vocabularyPool.push('ชื้น', 'humid', '💧')
      if (envState.light < 0.4) vocabularyPool.push('มืด', 'dark', '🌙')

      const weatherState = this.weather.getState()
      if (weatherState.rain) {
        vocabularyPool.push('ฝนตก', 'rain', '🌧️')
      }

      // Generate proto-language
      response = this.world.protoGenerator?.generate({
        vocabularyPool,
        emotion: companion.emotion,
        minWords: 1,
        maxWords: 4,
        allowParticles: true,
        allowEmoji: true,
        creativity: 0.6
      })
    }

    // If still no response, skip this cycle
    if (!response) {
      return null
    }

    return {
      name: this.companionEntity.name,
      response,
      emotion: { ...companion.emotion }
    }
  }

  /**
   * Get status summary (both entities)
   */
  getStatusSummary(): string {
    let output = `📊 Status\n\n`

    // Show all entities in world
    for (const entityInfo of this.entities.values()) {
      const entity = entityInfo.entity
      const emotion = entity.emotion
      const memoryCount = entity.memory?.count() || 0

      const isImpersonated = entityInfo === this.impersonatedEntity ? ' (YOU)' : ''
      output += `${entityInfo.name}${isImpersonated}:\n`
      output += `  Emotion: ${emotion.valence.toFixed(2)} (${this.getEmotionWord(emotion)})\n`
      output += `  Arousal: ${emotion.arousal.toFixed(2)}\n`
      output += `  Memories: ${memoryCount}\n\n`
    }

    // Vocabulary stats (v5.8.3: Use world.lexicon)
    const lexiconSize = this.world.lexicon.size
    output += `📚 Vocabulary: ${lexiconSize} terms (crystallized from conversations)\n`
    output += `💬 Conversations: ${this.conversationCount}\n`

    // Linguistics stats
    const lexiconStats = this.world.getLexiconStats()
    if (lexiconStats && lexiconStats.totalTerms > 0) {
      output += `\n🗣️ Linguistics:\n`
      output += `  Terms crystallized: ${lexiconStats.totalTerms}\n`
      output += `  Total usage: ${lexiconStats.totalUsage}\n`
    }

    return output
  }

  /**
   * Get emotion word
   */
  private getEmotionWord(emotion: EmotionalState): string {
    if (emotion.arousal > 0.6) return 'anxious'
    if (emotion.valence > 0.5) return 'happy'
    if (emotion.valence < -0.5) return 'sad'
    if (emotion.valence > 0) return 'calm'
    return 'neutral'
  }

  /**
   * Get growth summary
   */
  getGrowthSummary(): string {
    return this.growthTracker.getSummary()
  }

  /**
   * Save session
   */
  saveSession(filename: string = '.hi-introvert-session.json') {
    const state = {
      // v5.8.3: No need to save vocabulary - world.lexicon already in world state
      growth: this.growthTracker.toJSON(),
      world: toWorldFile(this.world),
      conversationCount: this.conversationCount,
      timestamp: Date.now()
    }

    fs.writeFileSync(filename, JSON.stringify(state, null, 2))
    this.emit('save', { filename })
  }

  /**
   * Save session with conversation history
   */
  saveSessionWithHistory(filename: string = '.hi-introvert-session.json', messages: any[]) {
    const state = {
      // v5.8.3: No need to save vocabulary - world.lexicon already in world state
      growth: this.growthTracker.toJSON(),
      world: toWorldFile(this.world),
      conversationCount: this.conversationCount,
      messages,  // Include conversation history
      timestamp: Date.now()
    }

    fs.writeFileSync(filename, JSON.stringify(state, null, 2))
    this.emit('save', { filename, messageCount: messages.length })
  }

  /**
   * Load session
   * v6.3: Fixed memory loss bug - properly cleanup intervals before loading
   */
  loadSession(filename: string = '.hi-introvert-session.json') {
    if (!fs.existsSync(filename)) {
      this.emit('load', { status: 'not_found', filename })
      return false
    }

    try {
      const data = JSON.parse(fs.readFileSync(filename, 'utf-8'))

      // v6.3: CRITICAL - Clear all intervals before loading new world
      // This prevents old intervals from interfering with loaded state
      this.clearIntervals()

      // v5.8.3: Restore growth + conversation count (no vocabulary - in world.lexicon)
      this.growthTracker = GrowthTracker.fromJSON(data.growth)
      this.conversationCount = data.conversationCount || 0

      // Restore world (this will restore entity state)
      this.world = fromWorldFile(data.world)

      // Restore entity references
      this.companionEntity.entity = this.world.entities[0]
      this.impersonatedEntity.entity = this.world.entities[1]

      // v6.3: Restart all intervals with new world instance
      this.setupEnvironmentSensors()
      this.setupIntervals()

      this.emit('load', {
        status: 'success',
        filename,
        vocabularySize: this.world.lexicon.size,
        entityCount: this.world.entities.length
      })

      return true
    } catch (error) {
      this.emit('error', {
        type: 'load',
        message: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }

  /**
   * Load session with conversation history
   */
  loadSessionWithHistory(filename: string = '.hi-introvert-session.json'): {
    success: boolean
    messages?: any[]
    vocabularySize?: number
    error?: string
  } {
    if (!fs.existsSync(filename)) {
      return { success: false, error: 'File not found' }
    }

    try {
      const data = JSON.parse(fs.readFileSync(filename, 'utf-8'))

      // v5.8.3: Restore growth + conversation count (no vocabulary - in world.lexicon)
      this.growthTracker = GrowthTracker.fromJSON(data.growth)
      this.conversationCount = data.conversationCount || 0

      // Restore world
      this.world = fromWorldFile(data.world)

      // Restore entity references
      this.companionEntity.entity = this.world.entities[0]
      this.impersonatedEntity.entity = this.world.entities[1]

      return {
        success: true,
        messages: data.messages || [],
        vocabularySize: this.world.lexicon.size
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Toggle autosave
   */
  toggleAutoSave(): boolean {
    this.autoSaveEnabled = !this.autoSaveEnabled
    return this.autoSaveEnabled
  }

  /**
   * Check if autosave enabled
   */
  isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled
  }

  /**
   * Get all events
   */
  getAllEvents() {
    return this.world.events || []
  }

  /**
   * v6.1: Setup P2P Cognitive Links
   * Creates bidirectional cognitive link between companion and traveler
   * Enables emotional resonance and shared awareness
   */
  private setupCognitiveLinks() {
    const companion = this.companionEntity.entity
    const traveler = this.impersonatedEntity.entity

    // Connect companion → traveler (bidirectional)
    companion.connectTo(traveler, {
      strength: 0.7,        // Strong initial connection
      bidirectional: true   // Traveler also connects to companion
    })

    this.debug('v6.1: P2P Cognition enabled (companion ↔ traveler)')
    this.emit('cognitive-link', {
      source: 'companion',
      target: 'traveler',
      strength: 0.7
    })
  }

  /**
   * v6.1: Initialize companion skills
   * Sets up initial skill proficiencies for personality
   */
  private initializeCompanionSkills() {
    const companion = this.companionEntity.entity

    if (!companion.skills) {
      if (!this.silentMode) console.warn('Skills system not enabled for companion')
      return
    }

    // Companion's personality-driven skills
    // (Thai kid who loves thinking, doesn't talk much, but wants to learn)
    companion.skills.addSkill('conversation', {
      proficiency: 0.3,     // Not very talkative yet (novice)
      learningRate: 0.15,   // Learns conversation moderately
      decayRate: 0.002
    })

    companion.skills.addSkill('creativity', {
      proficiency: 0.5,     // Natural creative thinker (competent)
      learningRate: 0.2,    // Learns creativity faster
      decayRate: 0.001
    })

    companion.skills.addSkill('empathy', {
      proficiency: 0.4,     // Shy but empathetic (competent)
      learningRate: 0.1,
      decayRate: 0.0015,
      relatedSkills: ['conversation']  // Empathy helps conversation
    })

    companion.skills.addSkill('learning', {
      proficiency: 0.6,     // Loves learning (proficient)
      learningRate: 0.25,   // Fast learner
      decayRate: 0.0005
    })

    this.debug('v6.1: Companion skills initialized:', {
      conversation: 0.3,
      creativity: 0.5,
      empathy: 0.4,
      learning: 0.6
    })

    this.emit('skills-initialized', {
      entity: 'companion',
      skills: Array.from(companion.skills['skills'].keys())
    })
  }

  /**
   * v5.8.5: Get vocabulary statistics (for UI/tests)
   * Adapter method for world.lexicon
   */
  getVocabularyStats() {
    return {
      total: this.world.lexicon.size,
      learnedWords: this.world.lexicon.size, // All terms are learned through crystallization
      conversationCount: this.conversationCount
    }
  }

  /**
   * v5.8.5: Get vocabulary size (for tests backward compatibility)
   */
  getVocabularySize(): number {
    return this.world.lexicon.size
  }

  /**
   * v5.8.5: Check if word exists in lexicon (for tests backward compatibility)
   */
  canUse(word: string): boolean {
    return this.world.lexicon.get(word.toLowerCase()) !== undefined
  }

  /**
   * v6.1: Use crystallized patterns in proto-language
   * Enhances emergent language with discovered patterns
   */
  private enhanceProtoLanguageWithCrystallization() {
    // Trigger crystallization analysis
    if (this.world.lexicon) {
      const patterns = this.world.lexicon.getAll()

      if (patterns.length > 0) {
        this.debug(`v6.1: Crystallized ${patterns.length} linguistic patterns`)
        this.emit('crystallization', {
          patternCount: patterns.length,
          topPatterns: patterns.slice(0, 5).map(p => p.phrase)
        })
      }
    }
  }

  /**
   * v6.2: Spawn "sync moment" field
   * Creates field when conversation resonates (high emotional alignment)
   * Field boosts valence and strengthens relationship
   */
  spawnSyncMoment(sourceEntity: EntityInfo, targetEntity: EntityInfo) {
    const source = sourceEntity.entity
    const target = targetEntity.entity

    // Calculate emotional alignment
    const valenceDiff = Math.abs(source.emotion.valence - target.emotion.valence)
    const arousalDiff = Math.abs(source.emotion.arousal - target.emotion.arousal)
    const alignment = 1 - (valenceDiff + arousalDiff) / 2

    // Only spawn if alignment > 0.5 (emotionally in sync)
    if (alignment < 0.5) return

    // Field spec for "sync moment"
    const fieldSpec = {
      material: 'field.sync_moment',
      type: 'field' as const,
      origin: 'self' as const,
      radius: 200,              // Wide radius (both entities affected)
      duration: 5000,           // 5 seconds
      effect_on_others: {
        valence: 0.3,           // Gentle positive boost
        arousal: 0.1,           // Slight energy increase
        relationshipBoost: 0.5, // Strengthen bond
        sourceEntity: source.material  // Track field source
      }
    }

    // Spawn at source entity position
    this.world.spawnField(fieldSpec, source.x, source.y)

    // v6.2: Update Trust (Task 9) - Positive interaction increases trust
    const sourceTrust = this.trustSystems.get(source.uuid)
    const targetTrust = this.trustSystems.get(target.uuid)

    if (sourceTrust && targetTrust) {
      // Trust boost based on alignment (0.05 to 0.15)
      const trustDelta = alignment * 0.15
      sourceTrust.updateTrust(target.uuid, trustDelta)
      targetTrust.updateTrust(source.uuid, trustDelta)
    }

    // v6.2: CRDT Memory Sync during sync moment (Task 8)
    // When emotionally aligned, entities share memories bidirectionally
    // BUT only if they trust each other (Task 9: Privacy check)
    const sourceLog = this.memoryLogs.get(source.uuid)
    const targetLog = this.memoryLogs.get(target.uuid)

    if (sourceLog && targetLog && sourceTrust && targetTrust) {
      // Check if both entities trust each other enough to share memories
      const sourceCanShare = sourceTrust.shouldShare('memory', target.uuid)
      const targetCanShare = targetTrust.shouldShare('memory', source.uuid)

      if (sourceCanShare && targetCanShare) {
        // Append recent memories to CRDT logs
        if (source.memory?.memories) {
          for (const mem of source.memory.memories.slice(-5)) {  // Last 5 memories
            sourceLog.append(mem)
          }
        }
        if (target.memory?.memories) {
          for (const mem of target.memory.memories.slice(-5)) {  // Last 5 memories
            targetLog.append(mem)
          }
        }

        // Bidirectional merge (CRDT operation)
        const sourceResult = sourceLog.merge(targetLog)
        const targetResult = targetLog.merge(sourceLog)

        if (sourceResult.added > 0 || targetResult.added > 0) {
          this.emit('memory-sync', {
            source: sourceEntity.name,
            target: targetEntity.name,
            sourceAdded: sourceResult.added,
            targetAdded: targetResult.added,
            alignment,
            trusted: true
          })
        }
      } else {
        // Not enough trust to share memories
        this.emit('trust-blocked', {
          source: sourceEntity.name,
          target: targetEntity.name,
          sourceTrust: sourceTrust.getTrust(target.uuid),
          targetTrust: targetTrust.getTrust(source.uuid)
        })
      }
    }

    this.debug(`v6.2: Sync moment (${sourceEntity.name} ↔ ${targetEntity.name}, alignment: ${alignment.toFixed(2)})`)
    this.emit('field', {
      type: 'sync_moment',
      source: sourceEntity.name,
      target: targetEntity.name,
      alignment
    })
  }

  /**
   * v6.2: Spawn "longing" field
   * Creates field when entity misses someone (high familiarity, low recent interaction)
   * Field gently nudges toward reconnection
   */
  spawnLongingField(sourceEntity: EntityInfo, targetEntityName: string) {
    const source = sourceEntity.entity
    const target = this.entities.get(targetEntityName)?.entity

    if (!target) return

    // Check if relationship exists
    const relationship = source.relationships?.get(target.material)
    if (!relationship) return

    // Only spawn if high familiarity but no recent interaction
    const timeSinceLastInteraction = relationship.lastInteraction
      ? Date.now() - relationship.lastInteraction
      : Infinity

    if (relationship.familiarity < 0.5 || timeSinceLastInteraction < 60000) return

    // Field spec for "longing"
    const fieldSpec = {
      material: 'field.longing',
      type: 'field' as const,
      origin: 'self' as const,
      radius: 150,              // Medium radius
      duration: 8000,           // 8 seconds
      effect_on_others: {
        valence: -0.1,          // Slight melancholy
        arousal: -0.05,         // Calm, reflective
        dominance: -0.05,       // Vulnerable
        linkStrength: 0.3,      // Strengthen cognitive link (thinking of them)
        sourceEntity: source.material
      }
    }

    // Spawn at source entity position
    this.world.spawnField(fieldSpec, source.x, source.y)

    this.debug(`v6.2: Longing field (${sourceEntity.name} → ${targetEntityName})`)
    this.emit('field', {
      type: 'longing',
      source: sourceEntity.name,
      target: targetEntityName,
      familiarity: relationship.familiarity
    })
  }
}
