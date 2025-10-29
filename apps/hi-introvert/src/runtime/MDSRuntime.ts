/**
 * MDS Generic Runtime
 *
 * Generic orchestrator for any MDS application.
 * Zero domain logic - pure MDS coordination.
 *
 * Features:
 * - Entity lifecycle (spawn, tick)
 * - Built-in sensors (OS, network, weather) - disable-able
 * - Analytics emission (WorldMind + growth)
 * - Persistence (save/load .world.mdm)
 * - Event-driven (framework-agnostic)
 */

import { EventEmitter } from 'events'
import fs from 'fs'
import {
  World,
  Entity,
  CollectiveIntelligence,
  toWorldFile,
  fromWorldFile,
  type LexiconEntry,
  type WorldOptions,
  type MdsMaterial,
  type WorldFile
} from '@v1b3x0r/mds-core'

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  // World setup (pass-through to MDS core)
  world: WorldOptions

  // Entities to spawn
  entities: Array<{
    name: string            // Unique identifier
    material: MdsMaterial   // .mdm content
    x?: number              // Spawn position (random if not specified)
    y?: number
  }>

  // Built-in sensors (disable-able)
  sensors?: {
    os?: boolean           // OS metrics (CPU, memory, battery)
    network?: boolean      // Network metrics
    weather?: boolean      // Weather context
  }

  // Auto-tick
  autoTick?: boolean       // Default: true
  tickRate?: number        // ms (default: 500)

  // Session persistence
  persistence?: {
    autoSave?: boolean
    interval?: number      // seconds
    savePath?: string      // .world.mdm path
  }
}

/**
 * Analytics data structure
 */
export interface AnalyticsData {
  worldMind: {
    stats: ReturnType<typeof CollectiveIntelligence.calculateStats>
    patterns: ReturnType<typeof CollectiveIntelligence.detectPatterns>
    collectiveEmotion: ReturnType<typeof CollectiveIntelligence.calculateCollectiveEmotion>
  }
  growth: {
    vocabularySize: number
    vocabularyWords: string[]
    totalMemories: number
    conversationCount?: number
  }
  entities: Array<{
    id: string
    name: string
    age: number
    emotion: any
    memoryCount: number
    relationshipCount: number
  }>
  context?: Record<string, any>  // Live sensor values
}

/**
 * MDS Generic Runtime
 */
export class MDSRuntime extends EventEmitter {
  world: World
  entities: Map<string, Entity> = new Map()

  // Built-in sensors (optional)
  private osSensor?: any
  private networkSensor?: any
  private weatherSensor?: any

  // Tick interval
  private tickInterval?: NodeJS.Timeout

  // Auto-save interval
  private saveInterval?: NodeJS.Timeout

  // Config
  private config: RuntimeConfig

  constructor(config: RuntimeConfig) {
    super()
    this.config = config

    // Create world
    this.world = new World(config.world)

    // Spawn entities
    for (const { name, material, x, y } of config.entities) {
      const entity = this.world.spawn(material, {
        x: x ?? Math.random() * 400,
        y: y ?? Math.random() * 400
      })
      this.entities.set(name, entity)
      this.emit('entity:spawned', { name, entity })
    }

    // Setup built-in sensors (default: enabled)
    this.setupSensors(config.sensors)

    // Auto-tick
    if (config.autoTick !== false) {
      this.startTicking(config.tickRate || 500)
    }

    // Auto-save
    if (config.persistence?.autoSave) {
      const interval = (config.persistence.interval || 60) * 1000
      const savePath = config.persistence.savePath || 'sessions/autosave.world.mdm'
      this.startAutoSave(interval, savePath)
    }
  }

  /**
   * Setup built-in sensors
   */
  private setupSensors(sensorsConfig?: RuntimeConfig['sensors']): void {
    const config = sensorsConfig ?? {}

    // OS sensor (default: enabled)
    if (config.os !== false) {
      // Lazy-load sensor modules
      try {
        const { OSSensor } = require('./sensors/OSSensor')
        this.osSensor = new OSSensor()
      } catch (error) {
        console.warn('OSSensor not available:', error)
      }
    }

    // Network sensor (default: enabled)
    if (config.network !== false) {
      try {
        const { NetworkSensor } = require('./sensors/NetworkSensor')
        this.networkSensor = new NetworkSensor()
      } catch (error) {
        console.warn('NetworkSensor not available:', error)
      }
    }

    // Weather sensor (default: enabled if world.weather exists)
    if (config.weather !== false && this.world.weather) {
      try {
        const { WeatherSensor } = require('./sensors/WeatherSensor')
        this.weatherSensor = new WeatherSensor(this.world.weather)
      } catch (error) {
        console.warn('WeatherSensor not available:', error)
      }
    }
  }

  /**
   * Tick world (sensors → broadcast → world.tick → analytics)
   */
  tick(): void {
    // 1. Update sensors → broadcastContext
    const context: Record<string, any> = {}

    if (this.osSensor) {
      const osMetrics = this.osSensor.getMetrics()
      const osContext = this.osSensor.mapToContext(osMetrics)
      Object.assign(context, osContext)
    }

    if (this.networkSensor) {
      const networkMetrics = this.networkSensor.getMetrics()
      const networkContext = this.networkSensor.mapToContext(networkMetrics)
      Object.assign(context, networkContext)
    }

    if (this.weatherSensor) {
      const weatherState = this.weatherSensor.getState()
      const weatherContext = this.weatherSensor.mapToContext(weatherState)
      Object.assign(context, weatherContext)
    }

    if (Object.keys(context).length > 0) {
      this.world.broadcastContext(context)
    }

    // 2. World tick (entities respond to context via MDM triggers)
    this.world.tick(0.5)

    // 3. Emit analytics
    this.emitAnalytics(context)

    // 4. Emit tick event
    this.emit('tick', { time: this.world.worldTime })
  }

  /**
   * Calculate and emit analytics
   */
  private emitAnalytics(context?: Record<string, any>): void {
    const entities = Array.from(this.entities.values())

    // WorldMind analytics
    const stats = CollectiveIntelligence.calculateStats(entities)
    const patterns = CollectiveIntelligence.detectPatterns(entities)
    const collectiveEmotion = CollectiveIntelligence.calculateCollectiveEmotion(entities)

    // Growth metrics
    const vocabularySize = this.world.lexicon?.size || 0
    const vocabularyWords = this.world.lexicon?.getRecent(10).map((entry: LexiconEntry) => entry.term) || []
    const totalMemories = entities.reduce(
      (sum: number, entity: Entity) => sum + (entity.memory?.count() || 0),
      0
    )

    // Entity metrics
    const entityMetrics = Array.from(this.entities.entries()).map(([name, entity]) => ({
      id: entity.id,
      name,
      age: entity.age,
      emotion: entity.emotion,
      memoryCount: entity.memory?.count() || 0,
      relationshipCount: entity.relationships?.size || 0
    }))

    const analyticsData: AnalyticsData = {
      worldMind: {
        stats,
        patterns,
        collectiveEmotion
      },
      growth: {
        vocabularySize,
        vocabularyWords,
        totalMemories
      },
      entities: entityMetrics,
      context
    }

    this.emit('analytics', analyticsData)
  }

  /**
   * Start auto-tick
   */
  private startTicking(intervalMs: number): void {
    this.tickInterval = setInterval(() => {
      this.tick()
    }, intervalMs)
  }

  /**
   * Stop auto-tick
   */
  stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = undefined
    }
  }

  /**
   * Start auto-save
   */
  private startAutoSave(intervalMs: number, savePath: string): void {
    this.saveInterval = setInterval(() => {
      try {
        this.save(savePath)
      } catch (error) {
        this.emit('error', { type: 'autosave', error })
      }
    }, intervalMs)
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
      this.saveInterval = undefined
    }
  }

  /**
   * Save world to .world.mdm file
   */
  save(filePath: string): void {
    const worldFile = toWorldFile(this.world)

    // Ensure directory exists
    const dir = filePath.substring(0, filePath.lastIndexOf('/'))
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(filePath, JSON.stringify(worldFile, null, 2), 'utf-8')
    this.emit('saved', { path: filePath })
  }

  /**
   * Load world from .world.mdm file
   */
  load(filePath: string): void {
    const worldFile: WorldFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Stop ticking during load
    const wasTickin = !!this.tickInterval
    this.stopTicking()

    // Load world
    this.world = fromWorldFile(worldFile)

    // Rebuild entities map (TODO: need entity name persistence)
    this.entities.clear()
    // For now, just assign numeric names
    this.world.entities.forEach((entity: Entity, index: number) => {
      this.entities.set(`entity_${index}`, entity)
    })

    // Resume ticking if it was running
    if (wasTickin) {
      this.startTicking(this.config.tickRate || 500)
    }

    this.emit('loaded', { path: filePath })
  }

  /**
   * Get entity by name
   */
  get(name: string): Entity | undefined {
    return this.entities.get(name)
  }

  /**
   * Find entity by predicate
   */
  find(predicate: (entity: Entity) => boolean): Entity | undefined {
    return Array.from(this.entities.values()).find(predicate)
  }

  /**
   * Filter entities by predicate
   */
  filter(predicate: (entity: Entity) => boolean): Entity[] {
    return Array.from(this.entities.values()).filter(predicate)
  }

  /**
   * Cleanup (stop intervals, cleanup resources)
   */
  destroy(): void {
    this.stopTicking()
    this.stopAutoSave()
    this.removeAllListeners()
  }
}
