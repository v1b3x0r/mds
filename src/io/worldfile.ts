/**
 * MDS v5.0 - WorldFile Persistence
 * Save/load entire world state to single .world.mdm file
 *
 * Design principles:
 * - Single file contains everything (materials, entities, relationships)
 * - Deterministic restoration (same file = same state)
 * - Two-pass loading (entities first, then relationships)
 * - Delta compression (store only non-default values)
 */

import { World } from '../world/world'
import type { WorldOptions } from '../world/world'
import type { MdsMaterial } from '../schema/mdspec'
import type { MdsField as MdsFieldSpec } from '../schema/fieldspec'
import type { Entity } from '../core/entity'
import type { EmotionalState, Memory, Intent, Relationship } from '../ontology'

/**
 * WorldFile format (v5 schema)
 */
export interface WorldFile {
  $schema: string             // https://mds.v1b3.dev/schema/world/v5
  version: string             // "5.0.0"
  id: string                  // World UUID
  createdAt: number           // Unix timestamp (ms)
  savedAt: number             // Unix timestamp (ms)

  metadata?: {
    name?: string
    description?: string
    author?: string
    tags?: string[]
  }

  options: WorldOptions       // World configuration

  state: {
    worldTime: number         // Simulation time (seconds)
    tickCount: number         // Frame count
  }

  materials: MdsMaterial[]    // Material definitions
  fields: MdsFieldSpec[]      // Field definitions

  entities: SerializedEntity[]        // All entities
  activeFields?: SerializedField[]    // Active fields (optional)

  relationships?: Record<string, SerializedRelationship[]>  // Entity bonds (v5)
  eventLog?: any[]            // History events (if enabled)
}

/**
 * Serialized entity state
 */
export interface SerializedEntity {
  id: string
  material: string            // Material ID reference

  // Physics state
  x: number
  y: number
  vx: number
  vy: number

  // Entity state
  age: number
  opacity: number
  entropy: number

  // v5 Ontology (optional - only if present)
  memory?: Memory[]
  emotion?: EmotionalState
  intent?: Intent[]

  // Behavior state (optional - only if non-default)
  hoverCount?: number
  lastHoverTime?: number
}

/**
 * Serialized field state
 */
export interface SerializedField {
  material: string            // Field spec ID reference
  x: number
  y: number
  t: number                   // Age (ms)
}

/**
 * Serialized relationship
 */
export interface SerializedRelationship {
  targetId: string
  trust: number
  familiarity: number
  lastInteraction?: number
  interactionCount?: number
}

/**
 * Serialize World to WorldFile
 */
export function toWorldFile(world: World, metadata?: WorldFile['metadata']): WorldFile {
  const entities = world.entities
  const fields = world.fields

  // Collect unique materials and field specs
  const materialMap = new Map<string, MdsMaterial>()
  const fieldMap = new Map<string, MdsFieldSpec>()

  for (const entity of entities) {
    if (!materialMap.has(entity.m.material)) {
      materialMap.set(entity.m.material, entity.m)
    }
  }

  for (const field of fields) {
    if (!fieldMap.has(field.f.material)) {
      fieldMap.set(field.f.material, field.f)
    }
  }

  // Serialize entities
  const serializedEntities: SerializedEntity[] = entities.map(e => {
    const base: SerializedEntity = {
      id: e.id,
      material: e.m.material,
      x: e.x,
      y: e.y,
      vx: e.vx,
      vy: e.vy,
      age: e.age,
      opacity: e.opacity,
      entropy: e.entropy
    }

    // Add ontology data if present (delta compression)
    if (e.memory) {
      base.memory = e.memory.getAll()
    }

    if (e.emotion) {
      base.emotion = { ...e.emotion }
    }

    if (e.intent) {
      base.intent = e.intent.getAll()
    }

    // Add behavior state if non-default
    if (e.hoverCount > 0) base.hoverCount = e.hoverCount
    if (e.lastHoverTime > 0) base.lastHoverTime = e.lastHoverTime

    return base
  })

  // Serialize active fields (optional)
  const serializedFields: SerializedField[] | undefined = fields.length > 0
    ? fields.map(f => ({
        material: f.f.material,
        x: f.x,
        y: f.y,
        t: f.t
      }))
    : undefined

  // Serialize relationships (v5)
  const relationships: Record<string, SerializedRelationship[]> = {}
  for (const entity of entities) {
    if (entity.relationships && entity.relationships.size > 0) {
      relationships[entity.id] = Array.from(entity.relationships.entries()).map(
        ([targetId, rel]) => {
          const serialized: SerializedRelationship = {
            targetId,
            trust: rel.trust,
            familiarity: rel.familiarity
          }

          // Optional fields (delta compression)
          if (rel.lastInteraction !== undefined) {
            serialized.lastInteraction = rel.lastInteraction
          }
          if (rel.interactionCount !== undefined) {
            serialized.interactionCount = rel.interactionCount
          }

          return serialized
        }
      )
    }
  }

  // Build WorldFile
  const worldFile: WorldFile = {
    $schema: 'https://mds.v1b3.dev/schema/world/v5',
    version: '5.0.0',
    id: world.id,
    createdAt: world.createdAt,
    savedAt: Date.now(),
    metadata,
    options: world.getOptions(),
    state: {
      worldTime: world.worldTime,
      tickCount: world.tickCount
    },
    materials: Array.from(materialMap.values()),
    fields: Array.from(fieldMap.values()),
    entities: serializedEntities
  }

  // Add optional fields (delta compression)
  if (serializedFields && serializedFields.length > 0) {
    worldFile.activeFields = serializedFields
  }

  if (Object.keys(relationships).length > 0) {
    worldFile.relationships = relationships
  }

  if (world.historyEnabled && world.eventLog.length > 0) {
    worldFile.eventLog = world.eventLog
  }

  return worldFile
}

/**
 * Deserialize WorldFile to World
 * Two-pass loading: entities first, then relationships
 */
export function fromWorldFile(worldFile: WorldFile): World {
  // Validate schema version
  if (!worldFile.$schema.includes('/v5')) {
    throw new Error(`Unsupported WorldFile schema: ${worldFile.$schema}`)
  }

  // Create World with saved options
  const world = new World(worldFile.options)

  // Override world state
  world.id = worldFile.id
  world.createdAt = worldFile.createdAt
  world.worldTime = worldFile.state.worldTime
  world.tickCount = worldFile.state.tickCount

  // Register materials
  const materialMap = new Map<string, MdsMaterial>()
  for (const material of worldFile.materials) {
    materialMap.set(material.material, material)
    world.registerMaterial(material.material, material)
  }

  // Register field specs
  const fieldMap = new Map<string, MdsFieldSpec>()
  for (const fieldSpec of worldFile.fields) {
    fieldMap.set(fieldSpec.material, fieldSpec)
    world.registerField(fieldSpec.material, fieldSpec)
  }

  // Pass 1: Restore entities (without relationships)
  const entityMap = new Map<string, Entity>()

  for (const data of worldFile.entities) {
    const material = materialMap.get(data.material)
    if (!material) {
      console.warn(`Material not found: ${data.material}`)
      continue
    }

    // Spawn entity with same RNG seed (deterministic)
    const entity = world.spawn(material, { x: data.x, y: data.y })

    // Restore entity state
    entity.id = data.id  // Override generated UUID
    entity.vx = data.vx
    entity.vy = data.vy
    entity.age = data.age
    entity.opacity = data.opacity
    entity.entropy = data.entropy

    // Restore ontology data
    if (data.memory && entity.memory) {
      // Clear initial spawn memory before restoring
      entity.memory.clear()
      for (const mem of data.memory) {
        entity.memory.add(mem)
      }
    }

    if (data.emotion && entity.emotion) {
      entity.emotion.valence = data.emotion.valence
      entity.emotion.arousal = data.emotion.arousal
      entity.emotion.dominance = data.emotion.dominance
    }

    if (data.intent && entity.intent) {
      // Clear default intent before restoring
      entity.intent.clear()
      for (const intent of data.intent) {
        entity.intent.push(intent)
      }
    }

    // Restore behavior state
    if (data.hoverCount !== undefined) entity.hoverCount = data.hoverCount
    if (data.lastHoverTime !== undefined) entity.lastHoverTime = data.lastHoverTime

    entityMap.set(entity.id, entity)
  }

  // Pass 2: Restore relationships (after all entities exist)
  if (worldFile.relationships) {
    for (const [entityId, rels] of Object.entries(worldFile.relationships)) {
      const entity = entityMap.get(entityId)
      if (!entity || !entity.relationships) continue

      for (const rel of rels) {
        const target = entityMap.get(rel.targetId)
        if (!target) {
          console.warn(`Relationship target not found: ${rel.targetId}`)
          continue
        }

        // Restore relationship
        const relationship: Relationship = {
          trust: rel.trust,
          familiarity: rel.familiarity,
          lastInteraction: rel.lastInteraction,
          interactionCount: rel.interactionCount
        }

        entity.relationships.set(rel.targetId, relationship)
      }
    }
  }

  // Restore active fields (if any)
  if (worldFile.activeFields) {
    for (const fieldData of worldFile.activeFields) {
      const fieldSpec = fieldMap.get(fieldData.material)
      if (!fieldSpec) {
        console.warn(`Field spec not found: ${fieldData.material}`)
        continue
      }

      const field = world.spawnField(fieldSpec, fieldData.x, fieldData.y)
      field.t = fieldData.t  // Restore age
    }
  }

  // Restore event log (if present)
  if (worldFile.eventLog) {
    world.historyEnabled = true
    world.eventLog = worldFile.eventLog
  }

  return world
}

/**
 * Save WorldFile to JSON string
 */
export function saveWorldFile(world: World, metadata?: WorldFile['metadata']): string {
  const worldFile = toWorldFile(world, metadata)
  return JSON.stringify(worldFile, null, 2)
}

/**
 * Load WorldFile from JSON string
 */
export function loadWorldFile(json: string): World {
  const worldFile = JSON.parse(json) as WorldFile
  return fromWorldFile(worldFile)
}

/**
 * Download WorldFile as .world.mdm file (browser only)
 */
export function downloadWorldFile(
  world: World,
  filename: string = 'world.world.mdm',
  metadata?: WorldFile['metadata']
): void {
  const json = saveWorldFile(world, metadata)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

/**
 * Upload WorldFile from file input (browser only)
 */
export function uploadWorldFile(
  file: File,
  callback: (world: World) => void
): void {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const json = e.target?.result as string
      const world = loadWorldFile(json)
      callback(world)
    } catch (err) {
      console.error('Failed to load WorldFile:', err)
      throw err
    }
  }

  reader.readAsText(file)
}
