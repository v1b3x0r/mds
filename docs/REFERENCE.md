# MDS API Reference

**Version:** 5.9.0
**Last Updated:** 2025-10-30

Complete API documentation for MDS (Material Definition System).

---

## Table of Contents

### Phase 1: Material Pressure System (v5.9)
- [Entity Needs API](#entity-needs-api)
- [World Resources API](#world-resources-api)
- [CollectiveIntelligence API](#collectiveintelligence-api)
- [Type Definitions](#type-definitions)

### Core Systems
- [World API](#world-api)
- [Entity API](#entity-api)
- [Memory API](#memory-api)
- [Emotion API](#emotion-api)
- [Learning API](#learning-api)
- [Communication API](#communication-api)

### Advanced
- [Physics API](#physics-api)
- [Relationships API](#relationships-api)
- [World Mind API](#world-mind-api)

---

# Phase 1: Material Pressure System (v5.9)

## Entity Needs API

Methods for managing entity resource needs (water, food, energy).

### `entity.getNeed(id: string): Need | undefined`

Get current state of a specific need.

**Parameters:**
- `id` — Resource identifier (e.g., "water", "food", "energy")

**Returns:** `Need` object or `undefined` if not found

**Example:**
```javascript
const waterNeed = entity.getNeed('water')
if (waterNeed) {
  console.log(`Water level: ${(waterNeed.current * 100).toFixed(0)}%`)
  console.log(`Depletion rate: ${waterNeed.depletionRate}/s`)
}
```

---

### `entity.satisfyNeed(id: string, amount: number): void`

Increase a need level (e.g., drink water, eat food).

**Parameters:**
- `id` — Resource identifier
- `amount` — Amount to increase (0..1)

**Example:**
```javascript
// Entity drinks water
const consumed = world.consumeResource('water', entity.x, entity.y, 0.3)
entity.satisfyNeed('water', consumed)  // +30% water level
```

---

### `entity.isCritical(id: string): boolean`

Check if a need is below critical threshold.

**Parameters:**
- `id` — Resource identifier

**Returns:** `true` if `need.current < need.criticalThreshold`

**Example:**
```javascript
if (entity.isCritical('water')) {
  console.log('⚠️ Entity needs water urgently!')

  // Find nearest water source
  const waterField = world.findNearestResourceField(entity.x, entity.y, 'water')
  if (waterField) {
    // Move toward water...
  }
}
```

---

### `entity.getCriticalNeeds(): string[]`

Get array of all critical need IDs.

**Returns:** Array of need IDs below critical threshold

**Example:**
```javascript
const critical = entity.getCriticalNeeds()
if (critical.length > 0) {
  console.log(`Critical needs: ${critical.join(', ')}`)
  // → "Critical needs: water, food"
}
```

---

### `entity.getNeedsSnapshot(): Record<string, number>`

Get all need levels as a key-value object.

**Returns:** Record mapping resource IDs to current levels (0..1)

**Example:**
```javascript
const snapshot = entity.getNeedsSnapshot()
console.log(snapshot)
// → { water: 0.85, food: 0.62, energy: 0.34 }

// Check if any need is low
for (const [id, level] of Object.entries(snapshot)) {
  if (level < 0.3) {
    console.log(`Low ${id}: ${(level * 100).toFixed(0)}%`)
  }
}
```

---

### `entity.speakAboutNeeds(lang?: string): string | undefined`

Generate utterance about critical needs.

**Parameters:**
- `lang` — Language code (optional, defaults to entity's `nativeLanguage`)

**Returns:** Utterance text or `undefined` if no critical needs

**Behavior:**
- Returns `undefined` if no needs are critical
- Utterance varies by severity: desperate → urgent → moderate
- Supports multilingual output (EN, TH)
- Utterances are automatically recorded to world transcript

**Example:**
```javascript
const utterance = entity.speakAboutNeeds()
if (utterance) {
  console.log(`Entity says: "${utterance}"`)
  // Low water: "I need water"
  // Very low water: "Water... please..."
  // Multiple critical: "Water... food..."
}

// Thai language
const utteranceTH = entity.speakAboutNeeds('th')
// → "ต้องการน้ำ" (need water)
```

---

### `entity.updateNeeds(dt: number, worldTime: number): void`

**⚠️ Internal method** — Called automatically by `world.tick()`.

Updates all needs (depletion, emotional impact). You typically don't call this directly.

**Parameters:**
- `dt` — Delta time in seconds
- `worldTime` — Current world time

---

## World Resources API

Methods for managing spatial resource fields.

### `world.addResourceField(field: ResourceField): ResourceField`

Add a resource field to the world.

**Parameters:**
- `field` — ResourceField configuration

**Returns:** The added field

**Example:**
```javascript
// Water well (point source)
world.addResourceField({
  id: 'well_1',
  resourceType: 'water',
  type: 'point',
  position: { x: 200, y: 200 },
  intensity: 1.0,
  depletionRate: 0.01,        // Depletes at 1% per second
  regenerationRate: 0.005     // Regenerates at 0.5% per second
})

// Oasis (area source)
world.addResourceField({
  id: 'oasis_1',
  resourceType: 'water',
  type: 'area',
  area: { x: 100, y: 100, width: 50, height: 50 },
  intensity: 0.8
})

// Lake (gradient source)
world.addResourceField({
  id: 'lake_1',
  resourceType: 'water',
  type: 'gradient',
  gradient: {
    center: { x: 300, y: 300 },
    radius: 100,
    falloff: 0.8  // 0 = linear, 1 = steep
  },
  intensity: 1.0
})
```

---

### `world.getResourceIntensity(resourceType: string, x: number, y: number): number`

Get combined resource intensity at a position.

**Parameters:**
- `resourceType` — Resource identifier (e.g., "water")
- `x` — Position X
- `y` — Position Y

**Returns:** Combined intensity from all fields of that type (0..1+)

**Example:**
```javascript
const waterIntensity = world.getResourceIntensity('water', entity.x, entity.y)

if (waterIntensity > 0.5) {
  console.log('Strong water source here!')
} else if (waterIntensity > 0.1) {
  console.log('Weak water source nearby')
} else {
  console.log('No water here')
}
```

---

### `world.consumeResource(resourceType: string, x: number, y: number, amount: number): number`

Consume resource from fields at a position.

**Parameters:**
- `resourceType` — Resource identifier
- `x` — Position X
- `y` — Position Y
- `amount` — Amount to consume (0..1)

**Returns:** Actual amount consumed (may be less if fields are depleted)

**Behavior:**
- Consumes from all nearby fields of matching type
- Depletes field intensity proportionally
- Returns actual consumption (≤ requested amount)

**Example:**
```javascript
// Entity tries to drink 30% water
const consumed = world.consumeResource('water', entity.x, entity.y, 0.3)

if (consumed > 0) {
  entity.satisfyNeed('water', consumed)
  console.log(`Drank ${(consumed * 100).toFixed(0)}% water`)
} else {
  console.log('No water available here')
}
```

---

### `world.findNearestResourceField(x: number, y: number, resourceType?: string): ResourceField | undefined`

Find nearest resource field to a position.

**Parameters:**
- `x` — Position X
- `y` — Position Y
- `resourceType` — Filter by resource type (optional)

**Returns:** Nearest field or `undefined` if none found

**Behavior:**
- Ignores depleted fields (intensity ≤ 0)
- Returns Euclidean nearest field

**Example:**
```javascript
// Find nearest water
const waterField = world.findNearestResourceField(entity.x, entity.y, 'water')

if (waterField) {
  const dx = waterField.position.x - entity.x
  const dy = waterField.position.y - entity.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  console.log(`Water at "${waterField.id}", ${distance.toFixed(0)}px away`)

  // Move toward water
  const speed = 10
  entity.x += (dx / distance) * speed
  entity.y += (dy / distance) * speed
}
```

---

### `world.getResourceField(id: string): ResourceField | undefined`

Get a specific resource field by ID.

**Parameters:**
- `id` — Field identifier

**Returns:** ResourceField or `undefined` if not found

**Example:**
```javascript
const well = world.getResourceField('well_1')
if (well) {
  console.log(`Well intensity: ${(well.intensity * 100).toFixed(0)}%`)
  console.log(`Total consumed: ${well.totalConsumed?.toFixed(2) ?? 0}`)
}
```

---

### `world.getResourceFields(resourceType?: string): ResourceField[]`

Get all resource fields, optionally filtered by type.

**Parameters:**
- `resourceType` — Filter by resource type (optional)

**Returns:** Array of resource fields

**Example:**
```javascript
// Get all water sources
const waterSources = world.getResourceFields('water')
console.log(`${waterSources.length} water sources in world`)

// Get all resource fields
const allFields = world.getResourceFields()
```

---

### `world.recordEntityDeath(entity: Entity, intensity?: number): void`

Record entity death in emotional climate.

**Parameters:**
- `entity` — Entity that died
- `intensity` — How significant the death (0..1, default: 0.5)

**Behavior:**
- Increases world grief
- Decreases world vitality
- Records death event in climate history
- Affects all surviving entities' emotions

**Example:**
```javascript
// Entity dies of thirst
const waterNeed = entity.getNeed('water')
if (waterNeed && waterNeed.current <= 0) {
  console.log(`💀 ${entity.id} died of thirst`)

  // Record death (high intensity for tragic death)
  world.recordEntityDeath(entity, 0.9)

  // Remove from world
  world.despawn(entity)
}
```

---

### `world.getEmotionalClimate(): EmotionalClimate`

Get current emotional climate snapshot.

**Returns:** EmotionalClimate object (grief, vitality, tension, harmony)

**Example:**
```javascript
const climate = world.getEmotionalClimate()

console.log(`Grief: ${(climate.grief * 100).toFixed(0)}%`)
console.log(`Vitality: ${(climate.vitality * 100).toFixed(0)}%`)
console.log(`Tension: ${(climate.tension * 100).toFixed(0)}%`)
console.log(`Harmony: ${(climate.harmony * 100).toFixed(0)}%`)

// Get human-readable description
import { CollectiveIntelligence } from '@v1b3x0r/mds-core'
const desc = CollectiveIntelligence.describeClimate(climate)
console.log(`Climate: ${desc}`)
// → "Grieving and tense" or "Vital and harmonious"
```

---

## CollectiveIntelligence API

Static methods for world-level collective intelligence.

### `CollectiveIntelligence.recordDeath(climate: EmotionalClimate, entityId: string, intensity: number, worldTime: number): void`

**⚠️ Low-level method** — Use `world.recordEntityDeath()` instead.

Record a death event in emotional climate.

**Parameters:**
- `climate` — Current climate state
- `entityId` — ID of entity that died
- `intensity` — How significant the death (0..1)
- `worldTime` — Current world time

---

### `CollectiveIntelligence.recordBirth(climate: EmotionalClimate, entityId: string, intensity: number, worldTime: number): void`

Record a birth event in emotional climate.

**Parameters:**
- `climate` — Current climate state
- `entityId` — ID of entity that was born
- `intensity` — How significant the birth (0..1)
- `worldTime` — Current world time

**Behavior:**
- Increases world vitality
- Increases world harmony
- Records birth event in climate history

**Example:**
```javascript
const newEntity = world.spawn({ essence: 'Newborn' }, { x: 100, y: 100 })
CollectiveIntelligence.recordBirth(
  world.emotionalClimate,
  newEntity.id,
  0.5,
  world.worldTime
)
```

---

### `CollectiveIntelligence.recordSuffering(climate: EmotionalClimate, intensity: number, worldTime: number): void`

Record suffering event (e.g., critical needs).

**Parameters:**
- `climate` — Current climate state
- `intensity` — How much suffering (0..1)
- `worldTime` — Current world time

**Behavior:**
- Increases world tension
- Records suffering event in climate history
- Called automatically when entities have critical needs

---

### `CollectiveIntelligence.updateEmotionalClimate(climate: EmotionalClimate, dt: number): void`

**⚠️ Internal method** — Called automatically by `world.tick()`.

Update emotional climate (natural decay over time).

**Parameters:**
- `climate` — Current climate state
- `dt` — Delta time in seconds

**Behavior:**
- Grief decays toward 0
- Tension decays toward 0
- Vitality restores toward 0.5
- Harmony restores toward 0.5

---

### `CollectiveIntelligence.getClimateInfluence(climate: EmotionalClimate): { valence: number, arousal: number, dominance: number }`

Calculate emotional climate influence on entities.

**Parameters:**
- `climate` — Current climate state

**Returns:** PAD delta to apply to entities

**Behavior:**
- Grief/harmony affect valence
- Tension/vitality affect arousal
- Grief affects dominance
- Influence is subtle (scaled by 0.1)

**Example:**
```javascript
// Apply climate influence to all entities
const delta = CollectiveIntelligence.getClimateInfluence(world.getEmotionalClimate())

for (const entity of world.entities) {
  if (entity.emotion) {
    entity.feel(delta)
  }
}
```

---

### `CollectiveIntelligence.describeClimate(climate: EmotionalClimate): string`

Get human-readable climate description.

**Parameters:**
- `climate` — Current climate state

**Returns:** Description string

**Possible Descriptions:**
- "neutral" — Default state
- "calm" — Low tension
- "grieving" — High grief (> 0.6)
- "melancholic" — Moderate grief (> 0.3)
- "vital" — High vitality (> 0.7)
- "depleted" — Low vitality (< 0.3)
- "tense" — High tension (> 0.6)
- "harmonious" — High harmony (> 0.7)
- "discordant" — Low harmony (< 0.3)

Descriptors are combined (e.g., "grieving and tense", "vital and harmonious")

**Example:**
```javascript
import { CollectiveIntelligence } from '@v1b3x0r/mds-core'

const climate = world.getEmotionalClimate()
const desc = CollectiveIntelligence.describeClimate(climate)

console.log(`🌍 World feels: ${desc}`)
// → "🌍 World feels: grieving and tense"
```

---

### `CollectiveIntelligence.calculateStats(entities: Entity[]): WorldStats`

Calculate aggregate world statistics.

**Parameters:**
- `entities` — Array of entities

**Returns:** WorldStats object

**Example:**
```javascript
const stats = CollectiveIntelligence.calculateStats(Array.from(world.entities))

console.log(`Population: ${stats.entityCount}`)
console.log(`Avg age: ${stats.avgAge.toFixed(1)}s`)
console.log(`Avg energy: ${(stats.avgEnergy * 100).toFixed(0)}%`)
console.log(`Avg valence: ${stats.avgEmotionalValence?.toFixed(2) ?? 'N/A'}`)
```

---

## Type Definitions

### `Need`

Resource need tracking.

```typescript
interface Need {
  id: string                    // Resource identifier (e.g., "water", "food")
  current: number               // Current level (0..1)
  depletionRate: number         // Depletion per second
  criticalThreshold: number     // When to trigger critical state
  emotionalImpact?: {           // How critical need affects emotion
    valence: number             // Change to pleasure (-1..1)
    arousal: number             // Change to arousal (0..1)
    dominance: number           // Change to dominance (0..1)
  }
  lastUpdated: number           // World time when last updated
}
```

**Example:**
```typescript
const waterNeed: Need = {
  id: 'water',
  current: 0.85,
  depletionRate: 0.015,
  criticalThreshold: 0.3,
  emotionalImpact: {
    valence: -0.6,   // Becomes sad
    arousal: 0.4,    // Becomes stressed
    dominance: -0.3  // Feels helpless
  },
  lastUpdated: 123.5
}
```

---

### `ResourceField`

Spatial resource distribution.

```typescript
type ResourceFieldType = 'point' | 'area' | 'gradient'

interface ResourceField {
  id: string                    // Unique identifier
  resourceType: string          // e.g., "water", "food", "energy"
  type: ResourceFieldType       // Distribution type

  // Spatial configuration (only one should be set based on type)
  position?: { x: number; y: number }              // For point sources
  area?: { x: number; y: number; width: number; height: number }  // For area sources
  gradient?: {                                     // For gradient sources
    center: { x: number; y: number }
    radius: number
    falloff: number  // 0..1, how quickly intensity drops
  }

  // Resource dynamics
  intensity: number             // 0..1, current availability
  maxIntensity?: number         // 0..1, max intensity (default: 1.0)
  depletionRate?: number        // Natural depletion per second
  regenerationRate?: number     // Natural regeneration per second

  // Metadata
  lastUpdated?: number          // World time when last updated
  totalConsumed?: number        // Total amount consumed (cumulative)
}
```

**Example:**
```typescript
// Point source (water well)
const well: ResourceField = {
  id: 'well_1',
  resourceType: 'water',
  type: 'point',
  position: { x: 200, y: 200 },
  intensity: 1.0,
  depletionRate: 0.01,
  regenerationRate: 0.005
}

// Area source (oasis)
const oasis: ResourceField = {
  id: 'oasis_1',
  resourceType: 'water',
  type: 'area',
  area: { x: 100, y: 100, width: 50, height: 50 },
  intensity: 0.8
}

// Gradient source (lake)
const lake: ResourceField = {
  id: 'lake_1',
  resourceType: 'water',
  type: 'gradient',
  gradient: {
    center: { x: 300, y: 300 },
    radius: 100,
    falloff: 0.8
  },
  intensity: 1.0,
  regenerationRate: 0.01
}
```

---

### `EmotionalClimate`

World's collective emotional atmosphere.

```typescript
interface EmotionalClimate {
  grief: number            // 0..1, accumulated loss/death
  vitality: number         // 0..1, life force (births, growth)
  tension: number          // 0..1, collective stress/urgency
  harmony: number          // 0..1, collective peace/contentment

  recentEvents: EmotionalClimateEvent[]  // Events that shaped climate
  decayRate: number        // How quickly emotions fade (default: 0.01/s)
}
```

**Example:**
```typescript
const climate: EmotionalClimate = {
  grief: 0.75,      // High grief (many deaths)
  vitality: 0.25,   // Low vitality
  tension: 0.60,    // High tension
  harmony: 0.20,    // Low harmony
  recentEvents: [
    { type: 'death', timestamp: 120, intensity: 0.9, entityId: 'ent_123' },
    { type: 'death', timestamp: 125, intensity: 0.8, entityId: 'ent_456' }
  ],
  decayRate: 0.01
}
```

---

### `EmotionalClimateEvent`

Event that shapes emotional climate.

```typescript
interface EmotionalClimateEvent {
  type: 'death' | 'birth' | 'suffering' | 'joy' | 'discovery'
  timestamp: number        // World time
  intensity: number        // 0..1, how strong the event was
  entityId?: string        // Entity involved (if applicable)
  metadata?: any           // Additional context
}
```

---

### `WorldStats`

Aggregate world statistics.

```typescript
interface WorldStats {
  entityCount: number
  avgAge: number
  avgEnergy: number
  avgEntropy: number

  // Ontology stats
  totalMemories?: number
  avgEmotionalValence?: number
  avgEmotionalArousal?: number

  // Physics stats
  avgTemperature?: number
  avgVelocity?: number

  // Cognitive stats
  totalExperiences?: number
  avgSkillProficiency?: number

  // Communication stats
  totalMessages?: number
  activeDialogues?: number
}
```

---

# Core Systems

## World API

### Creating a World

```javascript
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: {
    ontology: true,       // Memory, Emotion, Intent, Relationships
    linguistics: true,    // Emergent language, lexicon
    communication: true,  // Messages, dialogue trees
    cognitive: true,      // Learning, skills
    physics: true         // Environmental effects, info-physics
  },
  llm: {
    provider: 'openrouter',  // or 'anthropic', 'openai'
    apiKey: 'sk-...',        // or process.env.OPENROUTER_KEY
    languageModel: 'anthropic/claude-3.5-sonnet',
    embeddingModel: 'openai/text-embedding-3-small'  // optional
  },
  linguistics: {
    enabled: true,
    analyzeEvery: 10,      // Analyze lexicon every 10 ticks
    minUsage: 2            // Min usage count for crystallization
  }
})
```

---

### `world.spawn(material: MdsMaterial, position: { x: number, y: number }): Entity`

Spawn an entity in the world.

**Parameters:**
- `material` — Material definition (MDSpec JSON)
- `position` — Spawn position `{ x, y }`

**Returns:** The spawned Entity

**Example:**
```javascript
const entity = world.spawn({
  $schema: 'v5',
  essence: 'Desert traveler',
  nativeLanguage: 'en',
  needs: {
    resources: [
      { id: 'water', depletionRate: 0.01, criticalThreshold: 0.3 }
    ]
  }
}, { x: 100, y: 100 })

// Enable features
entity.enable('memory', 'learning', 'relationships')
```

---

### `world.despawn(entity: Entity): void`

Remove an entity from the world.

**Parameters:**
- `entity` — Entity to remove

**Example:**
```javascript
if (entity.getNeed('water')?.current <= 0) {
  world.recordEntityDeath(entity, 0.9)
  world.despawn(entity)
}
```

---

### `world.tick(dt: number): void`

Advance world simulation by one tick.

**Parameters:**
- `dt` — Delta time in seconds (typically 1.0 for 1 second per tick)

**Behavior:**
- Updates all entity needs
- Updates resource fields (depletion/regeneration)
- Updates emotional climate
- Applies climate influence to entities
- Updates physics, memory decay, learning, etc.

**Example:**
```javascript
// Real-time simulation
const tickRate = 60  // 60 FPS
const tickDuration = 1 / tickRate

setInterval(() => {
  world.tick(tickDuration)
}, 1000 / tickRate)

// Fixed timestep simulation
for (let i = 0; i < 100; i++) {
  world.tick(1)  // 1 second per tick
}
```

---

### `world.start(): void`

Start automatic world ticking (60 FPS).

**Example:**
```javascript
world.start()

// Stop later
world.stop()
```

---

### `world.stop(): void`

Stop automatic world ticking.

---

### `world.destroy(): void`

Clean up and destroy world (stops ticking, clears entities).

**Example:**
```javascript
world.destroy()
```

---

## Entity API

### Core Properties

```javascript
entity.id         // Unique identifier (UUID)
entity.x          // Position X
entity.y          // Position Y
entity.vx         // Velocity X
entity.vy         // Velocity Y
entity.age        // Age in world ticks
entity.energy     // Energy level (0..1)
entity.entropy    // Entropy level (0..1)
```

---

### Feature Activation (v5.3 Unified API)

```javascript
// Enable features
entity.enable('memory', 'learning', 'relationships', 'skills')

// Disable features
entity.disable('learning')

// Check if enabled
if (entity.isEnabled('memory')) {
  // ...
}

// Enable all features
entity.enableAll()

// Disable all features
entity.disableAll()
```

---

### `entity.feel(delta: EmotionalDelta): void`

Apply emotional change to entity.

**Parameters:**
- `delta` — Emotional change (`{ valence?, arousal?, dominance? }`)

**Example:**
```javascript
// Entity feels joy
entity.feel({ valence: 0.5, arousal: 0.3 })

// Entity feels fear
entity.feel({ valence: -0.6, arousal: 0.7, dominance: -0.4 })

// Apply climate influence
const climateDelta = CollectiveIntelligence.getClimateInfluence(world.getEmotionalClimate())
entity.feel(climateDelta)
```

---

### `entity.speak(phraseId: string, lang?: string): string`

Generate dialogue phrase.

**Parameters:**
- `phraseId` — Phrase identifier (e.g., "intro", "greeting")
- `lang` — Language code (optional, defaults to entity's `nativeLanguage`)

**Returns:** Generated phrase

**Example:**
```javascript
// Entity speaks
const greeting = entity.speak('greeting')
console.log(greeting)
// → "Hello, traveler" (English)

const greetingTH = entity.speak('greeting', 'th')
console.log(greetingTH)
// → "สวัสดี นักเดินทาง" (Thai)
```

---

## Memory API

### `entity.remember(entry: any): void`

Store a memory.

**Parameters:**
- `entry` — Memory entry (any object, typically `{ type, timestamp, ... }`)

**Example:**
```javascript
entity.remember({
  type: 'interaction',
  subject: 'player',
  action: 'gave_water',
  timestamp: world.worldTime
})

entity.remember({
  type: 'event',
  description: 'Found water source',
  location: { x: 200, y: 200 },
  timestamp: world.worldTime
})
```

---

### `entity.memory.recall(filters?: any): any[]`

Recall memories matching filters.

**Parameters:**
- `filters` — Filter object (optional)

**Returns:** Array of matching memories

**Example:**
```javascript
// Recall all memories
const allMemories = entity.memory.recall()

// Recall specific type
const interactions = entity.memory.recall({ type: 'interaction' })

// Recall recent memories (last 10)
const recent = entity.memory.recent(10)
```

---

## Emotion API

### Properties

```javascript
entity.emotion.valence      // Pleasure (-1..1)
entity.emotion.arousal      // Arousal (0..1)
entity.emotion.dominance    // Dominance (0..1)
```

---

### `entity.feel(delta: EmotionalDelta): void`

See [Entity API](#entityapi) above.

---

## Learning API

### `entity.learning.updateQ(state: string, action: string, reward: number, nextState: string): void`

Update Q-learning table.

**Parameters:**
- `state` — Current state identifier
- `action` — Action taken
- `reward` — Reward received (-1..1)
- `nextState` — Resulting state identifier

**Example:**
```javascript
// Entity drinks water
const beforeState = entity.isCritical('water') ? 'thirsty' : 'satisfied'
const action = 'drink_water'

// Consume water
const consumed = world.consumeResource('water', entity.x, entity.y, 0.3)
entity.satisfyNeed('water', consumed)

const afterState = entity.isCritical('water') ? 'thirsty' : 'satisfied'
const reward = consumed > 0 ? 0.8 : -0.5  // Reward for successful drink

entity.learning.updateQ(beforeState, action, reward, afterState)
```

---

### `entity.learning.chooseAction(state: string, explore?: number): string`

Choose action using ε-greedy policy.

**Parameters:**
- `state` — Current state identifier
- `explore` — Exploration rate (0..1, default: 0.1)

**Returns:** Chosen action

**Example:**
```javascript
const state = entity.isCritical('water') ? 'thirsty' : 'satisfied'
const action = entity.learning.chooseAction(state, 0.1)  // 10% exploration

if (action === 'seek_water') {
  // Find and move toward water
}
```

---

## Communication API

### `entity.sendMessage(to: Entity, content: string, type?: MessageType, priority?: MessagePriority): void`

Send message to another entity.

**Parameters:**
- `to` — Target entity
- `content` — Message content
- `type` — Message type (optional)
- `priority` — Message priority (optional)

**Example:**
```javascript
const targetEntity = world.entities[0]
entity.sendMessage(targetEntity, 'Hello!', 'dialogue', 'normal')
```

---

### `entity.receiveMessage(message: Message): void`

Receive a message (typically called automatically).

---

## Physics API

### Environmental Properties

```javascript
entity.temperature      // Current temperature
entity.mass             // Mass (affects physics)
```

---

### Collision Detection

```javascript
world.checkCollision(entity1, entity2)
```

---

## Relationships API

### `entity.relationships.bond(other: Entity, strength: number): void`

Form relationship bond with another entity.

**Parameters:**
- `other` — Target entity
- `strength` — Bond strength (0..1)

**Example:**
```javascript
const friend = world.entities[0]
entity.relationships.bond(friend, 0.8)  // Strong bond
```

---

### `entity.relationships.getBond(otherId: string): number`

Get bond strength with another entity.

**Parameters:**
- `otherId` — Target entity ID

**Returns:** Bond strength (0..1) or 0 if no bond

**Example:**
```javascript
const bondStrength = entity.relationships.getBond(friend.id)
console.log(`Bond strength: ${(bondStrength * 100).toFixed(0)}%`)
```

---

## World Mind API

See [CollectiveIntelligence API](#collectiveintelligence-api) above.

---

# Migration Guide: v5.8 → v5.9

## What's New

**Phase 1: Material Pressure System**
- Resource needs (water, food, energy)
- Spatial resource fields (point, area, gradient)
- Emotional climate (world-mind)
- Emergent language (needs → speech → lexicon)

## Breaking Changes

**None.** All changes are additive. v5.9 is 100% backward compatible with v5.8.

## New APIs to Explore

### 1. Add Resource Needs to Entities

**Before (v5.8):**
```javascript
const entity = world.spawn({
  essence: 'Traveler'
}, { x: 100, y: 100 })
```

**After (v5.9):**
```javascript
const entity = world.spawn({
  essence: 'Thirsty traveler',
  needs: {
    resources: [
      { id: 'water', depletionRate: 0.01, criticalThreshold: 0.3 }
    ]
  }
}, { x: 100, y: 100 })

// Check needs
if (entity.isCritical('water')) {
  console.log('Entity needs water!')
}
```

---

### 2. Add Resource Fields

**New in v5.9:**
```javascript
// Add water source
world.addResourceField({
  id: 'well',
  resourceType: 'water',
  type: 'point',
  position: { x: 250, y: 250 },
  intensity: 1.0,
  regenerationRate: 0.01
})

// Entity consumes water
const consumed = world.consumeResource('water', entity.x, entity.y, 0.3)
entity.satisfyNeed('water', consumed)
```

---

### 3. Track Emotional Climate

**New in v5.9:**
```javascript
import { CollectiveIntelligence } from '@v1b3x0r/mds-core'

// Record death
world.recordEntityDeath(entity, 0.9)

// Get climate
const climate = world.getEmotionalClimate()
console.log(`Grief: ${climate.grief}, Vitality: ${climate.vitality}`)

// Describe climate
const desc = CollectiveIntelligence.describeClimate(climate)
console.log(desc)  // → "Grieving and tense"
```

---

### 4. Emergent Language

**New in v5.9:**
```javascript
// Entity speaks about needs
const utterance = entity.speakAboutNeeds()
if (utterance) {
  console.log(`Entity: "${utterance}"`)
  // → "Need water" or "Water... please..."
}

// Check world lexicon
const lexicon = world.lexicon.getAll()
console.log(`${lexicon.length} terms crystallized`)
```

---

## Bundle Size Impact

- **Full bundle:** 186.74 KB → **359.66 KB** (+172.92 KB)
- **Lite bundle:** 120.42 KB → **266.80 KB** (+146.38 KB)

Phase 1 adds significant functionality (~173 KB). Still zero dependencies.

---

## Examples

See:
- **Desert Demo:** [`demos/desert-survival.mjs`](../demos/desert-survival.mjs)
- **Tests:** [`tests/needs.test.mjs`](../tests/needs.test.mjs), [`tests/emotional-climate.test.mjs`](../tests/emotional-climate.test.mjs)
- **README:** Phase 1 features prominently showcased

---

**Questions?** → [GitHub Issues](https://github.com/v1b3x0r/mds/issues)
**Full Changelog:** [CHANGELOG.md](./CHANGELOG.md)

---

**Last Updated:** 2025-10-30
**Version:** 5.9.0
**Built with 🤍 in Chiang Mai, Thailand 🇹🇭**
