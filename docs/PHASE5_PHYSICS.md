# MDS v5 Phase 5 - Environmental Physics & Collision

**Status**: ✅ Complete (43/43 tests passing)
**Bundle Size**: 79.53 KB minified (19.24 KB gzipped)
**Date**: 2025-10-21

---

## Overview

Phase 5 introduces a comprehensive environmental physics system that makes entities interact with their surroundings through temperature, humidity, light, wind, and collision dynamics.

Unlike traditional game physics (which simulates realistic motion), MDS physics simulates **meaning-driven interactions**:
- Temperature affects decay rate (hot entities fade faster)
- Humidity creates moisture exchange
- Emotions modify physical properties (joy reduces entropy, fear adds chaos, sadness increases viscosity)
- Collisions preserve momentum but are influenced by material properties

---

## Systems

### 1. Environment System

Continuous gradient functions for environmental properties:

```typescript
import { Environment, createEnvironment } from '@v1b3x0r/mds-core'

// Create custom environment
const env = new Environment({
  baseTemperature: 293,  // 20°C
  temperatureVariance: 10,
  hotspots: [
    { x: 400, y: 300, radius: 100, intensity: 30 }  // +30K hotspot
  ],
  baseHumidity: 0.5,
  moistZones: [
    { x: 200, y: 200, radius: 80, intensity: 0.3 }  // +30% humidity
  ],
  baseLight: 0.8,
  lightSources: [
    { x: 300, y: 100, radius: 150, intensity: 0.5 }
  ],
  windVelocity: { vx: 10, vy: 5 },
  windTurbulence: 0.2,
  timeScale: 1  // Day/night cycle speed
})

// Query environment at position
const state = env.getState(x, y)
// Returns: { temperature, humidity, light, windVx, windVy }

// Update environment (for day/night cycles)
env.update(dt)
```

**Presets**: `desert`, `forest`, `ocean`, `arctic`

```typescript
const desert = createEnvironment('desert')
// Hot (40°C), dry (10% humidity), bright, windy
```

**Features**:
- Spatial noise-based gradients (sine/cosine patterns)
- Radial falloff for hotspots/zones/lights (quadratic)
- Time-varying conditions (day/night affects temperature ±5K, light 20%-100%)
- Wind turbulence (position-dependent noise)
- Dynamic modification (addHotspot, addMoistZone, setWind)

---

### 2. Weather System

Dynamic weather patterns that evolve over time:

```typescript
import { Weather, createWeather } from '@v1b3x0r/mds-core'

const weather = new Weather({
  rainProbability: 0.1,      // 10% chance per check
  rainDuration: 30,          // Average 30 seconds
  maxRainIntensity: 1.0,
  evaporationBase: 0.01,
  windVariation: 0.5
})

// Update weather
weather.update(dt)

// Get current state
const state = weather.getState()
// Returns: { rain, rainIntensity, windStrength, evaporationRate, cloudCover }

// Force rain (for testing/demos)
weather.forceRain(duration, intensity)
weather.clearWeather()
```

**Presets**: `calm`, `stormy`, `dry`, `variable`

```typescript
const stormy = createWeather('stormy')
// 30% rain probability, 60s duration, max intensity, 0.8 wind variation
```

**Features**:
- Probabilistic rain start (checks every 10-30s)
- Rain intensity curve (ramp up → peak → ramp down)
- Cloud cover follows rain intensity
- Evaporation inversely proportional to rain
- Wind strength increases 1.5× during rain
- Variable duration (50%-100% of configured value)

---

### 3. Collision System

Efficient spatial partitioning and elastic collision response:

```typescript
import { CollisionDetector, SpatialGrid } from '@v1b3x0r/mds-core'

// Create collision detector
const detector = new CollisionDetector(100, { width: 800, height: 600 })
// cellSize: 100px grid cells
// bounds: world dimensions

// Update grid with entities
detector.update(entities)

// Detect all collisions
const collisions = detector.detectCollisions(entities)
// Returns: CollisionPair[] = [{ a, b, penetration }, ...]

// Resolve collision (elastic)
for (const pair of collisions) {
  CollisionDetector.resolve(pair)
}
```

**Features**:
- **Spatial Grid**: O(n) collision detection using grid partitioning (vs O(n²) naive)
- **AABB**: Axis-Aligned Bounding Box detection
- **Elastic Response**: Conserves momentum with restitution coefficient
- **Mass-based**: Heavier entities push lighter ones more
- **Configurable bounciness**: Uses `physics.bounce` from material

**Collision Resolution**:
1. Separate entities (move apart by penetration/2)
2. Calculate relative velocity in collision normal
3. Apply impulse based on masses and restitution
4. Update velocities (energy may be lost based on bounce coefficient)

**Helpers**:
```typescript
// Simple collision check (no spatial partitioning)
const colliding = checkCollisionSimple(entityA, entityB, radiusA, radiusB)

// Get entity radius (default 16px)
const radius = getEntityRadius(entity)
```

---

### 4. Energy System

Thermal energy transfer between entities and environment:

```typescript
import { EnergySystem, initializeThermalProperties } from '@v1b3x0r/mds-core'

const energy = new EnergySystem({
  thermalTransferRate: 0.1,      // Entity ↔ Entity transfer speed
  environmentCoupling: 0.05,     // Entity ↔ Environment coupling
  minTemperature: 100,           // Absolute min (100K)
  maxTemperature: 400            // Absolute max (400K)
})

// Initialize entity thermal properties
initializeThermalProperties(entity,
  temperature = 293,   // 20°C
  humidity = 0.5,
  density = 1.0,
  conductivity = 0.5
)

// Update thermal transfer
energy.updateEntityTransfer(entities, dt)           // Entity ↔ Entity
energy.updateEnvironmentTransfer(entities, env, dt) // Entity ↔ Environment
energy.updateHumidityTransfer(entities, env, dt)    // Humidity exchange

// Apply thermal decay (hot → faster decay)
energy.applyThermalDecay(entity, dt)
```

**Transfer Mechanisms**:

1. **Entity ↔ Entity** (pairwise, within 100px):
   ```
   transfer = tempDiff × rate × proximity × avgConductivity × dt
   ```
   - Heat flows from hot to cold
   - Closer entities transfer faster
   - Higher conductivity = faster transfer

2. **Entity ↔ Environment**:
   ```
   transfer = tempDiff × coupling × conductivity × dt
   ```
   - Entities equilibrate with local environment temperature

3. **Humidity Exchange**:
   ```
   transfer = humidityDiff × coupling × dt
   ```
   - Entities absorb/release moisture from environment

4. **Thermal Decay** (Arrhenius-like):
   ```
   tempFactor = exp((temperature - 293) / 50)
   decay = baseDecay × tempFactor × dt
   ```
   - Hot entities decay exponentially faster
   - 293K (20°C) is reference temperature
   - Requires `manifestation.aging.decay_rate` in material

**Features**:
- Temperature clamping (100K - 400K range)
- Mass-based energy calculation (E = m × T)
- Material-dependent conductivity
- Conservation of total energy (entity-entity transfers are symmetric)

---

## Integration with World

Phase 5 physics integrates seamlessly with the World container:

```typescript
import { World } from '@v1b3x0r/mds-core'

const world = new World({
  features: {
    ontology: true,
    physics: true,      // 🆕 Enable Phase 5 physics
    rendering: 'dom'
  },
  environment: 'forest',         // 🆕 Environment preset
  weather: 'calm',               // 🆕 Weather preset
  collision: true,               // 🆕 Enable collision detection
  worldBounds: {                 // Optional: world boundaries
    minX: 0,
    maxX: 800,
    minY: 0,
    maxY: 600
  },
  boundaryBehavior: 'bounce'    // 'none' | 'clamp' | 'bounce'
})
```

### Tick Loop Integration

Physics runs in **Phase 1.5** (between physical motion and mental updates):

```
Phase 1:   Physical update (v4 engine: forces, integration)
Phase 1.5: 🆕 Environmental Physics (NEW)
  ├─ Update environment (day/night cycles)
  ├─ Update weather (rain probability, intensity curves)
  ├─ Collision detection + resolution
  ├─ Thermal energy transfer
  │  ├─ Entity ↔ Entity heat transfer
  │  ├─ Entity ↔ Environment heat transfer
  │  ├─ Humidity exchange
  │  └─ Thermal decay (hot entities fade faster)
  └─ Weather effects (wind, rain, evaporation)
Phase 2:   Mental update (emotion, memory, intent)
Phase 3:   Relational update (bond graph)
Phase 4:   Rendering (DOM/Canvas/Headless)
```

---

## Emotion-Physics Coupling

Phase 5 adds **emotion-physics feedback** in the mental update phase:

```typescript
// Joy (positive valence) → Reduces entropy (increased order)
if (entity.emotion.valence > 0.5) {
  const joyStrength = (entity.emotion.valence - 0.5) * 2
  entity.entropy *= Math.pow(0.99, joyStrength * 10)
}

// Fear (high arousal, low dominance) → Kinetic randomness (chaos)
if (entity.emotion.arousal > 0.7 && entity.emotion.dominance < 0.3) {
  const fearStrength = entity.emotion.arousal * (1 - entity.emotion.dominance)
  const randomAngle = Math.random() * Math.PI * 2
  const randomSpeed = fearStrength * 30
  entity.vx += Math.cos(randomAngle) * randomSpeed * dt
  entity.vy += Math.sin(randomAngle) * randomSpeed * dt
}

// Sadness (negative valence) → Viscosity (slowed movement)
if (entity.emotion.valence < -0.3) {
  const sadnessStrength = Math.abs(entity.emotion.valence + 0.3) / 1.3
  const dampingFactor = 1 - (sadnessStrength * 0.05)
  entity.vx *= dampingFactor
  entity.vy *= dampingFactor
}
```

**Philosophy**: Emotions are not just internal states — they modify the physical fabric of the entity's interaction with the world.

---

## Material Schema Extensions

Phase 5 adds optional physics properties to MdsMaterial:

```json
{
  "material": "entity.flame",
  "essence": "A flickering warmth that seeks connection",
  "manifestation": {
    "emoji": "🔥",
    "aging": { "decay_rate": 0.05 }
  },
  "physics": {
    "mass": 0.8,
    "friction": 0.02,
    "bounce": 0.6,
    "temperature": 350,      // 🆕 77°C (hot entity)
    "humidity": 0.1,         // 🆕 Dry
    "density": 0.5,          // 🆕 kg/m³
    "conductivity": 0.9      // 🆕 High thermal transfer
  }
}
```

**Note**: All Phase 5 properties are **optional** — entities without them will get defaults:
- `temperature`: 293K (20°C)
- `humidity`: 0.5
- `density`: 1.0 kg/m³
- `conductivity`: 0.5

---

## Performance

### Bundle Size
- **Phase 4 (v4.2)**: 18.42 KB
- **Phase 5 (v5.0)**: 79.53 KB (+61.11 KB)
- **Gzipped**: 19.24 KB

**Added Code**:
- `environment.ts`: 320 LOC
- `weather.ts`: 200 LOC
- `collision.ts`: 290 LOC
- `energy.ts`: 180 LOC
- Total: ~990 LOC of physics systems

### Collision Detection
- **Naive**: O(n²) - check every pair
- **Spatial Grid**: O(n) average case
  - Grid cell size: 100px (configurable)
  - Only checks entities in same/adjacent cells
  - ~10-20× faster for n > 50

### Thermal Transfer
- Entity ↔ Entity: O(n²) within 100px radius (most entities don't interact)
- Entity ↔ Environment: O(n) (independent per entity)
- Typical performance: <1ms for 100 entities @ 60 FPS

---

## Testing

**Test Suite**: `tests/test-physics.mjs`

**Coverage**: 43 tests across 5 categories
- ✅ Environment (14 tests): gradients, hotspots, zones, wind, cycles, presets
- ✅ Weather (7 tests): rain, wind, evaporation, presets
- ✅ Collision (10 tests): spatial grid, detection, resolution, helpers
- ✅ Energy (8 tests): thermal transfer, humidity, decay, config
- ✅ Integration (3 tests): combined systems, full physics pipeline

**Run tests**:
```bash
npm test                    # Run all tests
node tests/test-physics.mjs # Run physics tests only
```

**Result**: 100% pass rate (43/43)

---

## Demo

**Interactive Demo**: `examples/07-physics/environment-demo.html`

Features:
- 🌡️ Real-time environment visualization (temperature gradient heatmap)
- 🌧️ Animated rain effects
- 🔥 Hotspot spawning (click to add heat sources)
- 💥 Collision detection with visual feedback
- 🎨 Temperature-based entity coloring (red=hot, blue=cold)
- 📊 Live HUD with stats (temp, humidity, wind, collisions, energy)
- 🎛️ Interactive controls:
  - Environment presets (desert, forest, ocean, arctic)
  - Weather control (calm, stormy, dry, toggle rain)
  - Entity spawning with random thermal properties
  - Physics toggle

**Run demo**:
```bash
# Open in browser
open examples/07-physics/environment-demo.html
```

---

## Next Steps (Phase 6+)

Phase 5 completes the physics layer. Remaining phases:

- **Phase 6**: Communication & Language (entity dialogue, language models)
- **Phase 7**: Cognitive Evolution (learning, memory evolution)
- **Phase 8**: World Mind & Final Polish (collective intelligence, optimization)

**Target**: v5.0.0 stable release with 100% checklist completion

---

## API Reference

### Environment

```typescript
class Environment {
  constructor(config?: EnvironmentConfig)
  update(dt: number): void
  getState(x: number, y: number): EnvironmentState
  getTemperature(x: number, y: number): number
  getHumidity(x: number, y: number): number
  getLight(x: number, y: number): number
  getWindVx(x: number, y: number): number
  getWindVy(x: number, y: number): number
  addHotspot(hotspot: HotSpot): void
  addMoistZone(zone: MoistZone): void
  addLightSource(source: LightSource): void
  setWind(vx: number, vy: number): void
  getConfig(): EnvironmentConfig
}

function createEnvironment(
  preset: 'desert' | 'forest' | 'ocean' | 'arctic' | 'custom',
  config?: EnvironmentConfig
): Environment
```

### Weather

```typescript
class Weather {
  constructor(config?: WeatherConfig)
  update(dt: number): void
  getState(): WeatherState
  forceRain(duration?: number, intensity?: number): void
  clearWeather(): void
  isRaining(): boolean
  getRainIntensity(): number
  getWindMultiplier(): number
  getEvaporationRate(): number
  getCloudCover(): number
}

function createWeather(
  preset: 'calm' | 'stormy' | 'dry' | 'variable'
): Weather
```

### Collision

```typescript
class SpatialGrid {
  constructor(cellSize?: number, bounds?: { width, height })
  clear(): void
  insert(entity: Entity): void
  queryRadius(x: number, y: number, radius: number): Entity[]
}

class CollisionDetector {
  constructor(cellSize?: number, bounds?: { width, height })
  update(entities: Entity[]): void
  detectCollisions(entities: Entity[]): CollisionPair[]
  static resolve(pair: CollisionPair): void
}

function checkCollisionSimple(
  a: Entity,
  b: Entity,
  radiusA?: number,
  radiusB?: number
): boolean

function getEntityRadius(entity: Entity): number
```

### Energy

```typescript
class EnergySystem {
  constructor(config?: EnergyConfig)
  updateEntityTransfer(entities: Entity[], dt: number): void
  updateEnvironmentTransfer(entities: Entity[], env: Environment, dt: number): void
  updateHumidityTransfer(entities: Entity[], env: Environment, dt: number): void
  applyThermalDecay(entity: Entity, dt: number): void
  getConfig(): EnergyConfig
  static calculateTotalEnergy(entities: Entity[]): number
}

function initializeThermalProperties(
  entity: Entity,
  temperature?: number,
  humidity?: number,
  density?: number,
  conductivity?: number
): void
```

---

**Built with meaning, not just motion.** 🔥❄️💧⚡
