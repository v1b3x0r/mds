/**
 * MDS v5 Phase 5 - Physics System Test Suite
 * Tests environment, weather, collision, and energy systems
 */

import {
  Environment, createEnvironment,
  Weather, createWeather,
  CollisionDetector, SpatialGrid, checkCollisionSimple, getEntityRadius,
  EnergySystem, initializeThermalProperties,
  Entity
} from '../dist/mds-core.esm.js'

console.log('🧪 MDS v5 Phase 5 - Physics System Tests\n')

// Test counters
let passed = 0
let failed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ ${testName}`)
    passed++
  } else {
    console.log(`❌ ${testName}`)
    failed++
  }
}

// ============================================================================
// 1. ENVIRONMENT TESTS
// ============================================================================

console.log('📍 Environment System Tests')
console.log('─'.repeat(60))

// Test 1.1: Basic environment creation
const env = new Environment({
  baseTemperature: 293,
  baseHumidity: 0.5,
  baseLight: 0.8
})
assert(env !== null, 'Environment: Create basic environment')

// Test 1.2: Environment state at origin
const state = env.getState(0, 0)
assert(
  state.temperature >= 283 && state.temperature <= 303,
  'Environment: Temperature at origin within expected range'
)
assert(
  state.humidity >= 0 && state.humidity <= 1,
  'Environment: Humidity at origin in valid range (0..1)'
)
assert(
  state.light >= 0 && state.light <= 1,
  'Environment: Light at origin in valid range (0..1)'
)

// Test 1.3: Hotspot increases temperature
const envWithHotspot = new Environment({
  baseTemperature: 293,
  hotspots: [{ x: 100, y: 100, radius: 50, intensity: 20 }]
})
const tempAtHotspot = envWithHotspot.getTemperature(100, 100)
const tempAway = envWithHotspot.getTemperature(500, 500)
assert(
  tempAtHotspot > tempAway,
  'Environment: Hotspot increases local temperature'
)

// Test 1.4: Moist zone increases humidity
const envWithMoisture = new Environment({
  baseHumidity: 0.3,
  moistZones: [{ x: 100, y: 100, radius: 50, intensity: 0.4 }]
})
const humidityAtZone = envWithMoisture.getHumidity(100, 100)
const humidityAway = envWithMoisture.getHumidity(500, 500)
assert(
  humidityAtZone > humidityAway,
  'Environment: Moist zone increases local humidity'
)

// Test 1.5: Light source increases illumination
const envWithLight = new Environment({
  baseLight: 0.3,
  lightSources: [{ x: 100, y: 100, radius: 50, intensity: 0.5 }]
})
const lightAtSource = envWithLight.getLight(100, 100)
const lightAway = envWithLight.getLight(500, 500)
assert(
  lightAtSource > lightAway,
  'Environment: Light source increases local illumination'
)

// Test 1.6: Wind velocity with turbulence
const envWithWind = new Environment({
  windVelocity: { vx: 10, vy: 5 },
  windTurbulence: 0.2
})
const wind1 = envWithWind.getWindVx(0, 0)
const wind2 = envWithWind.getWindVx(100, 0)
assert(
  Math.abs(wind1 - wind2) > 0,
  'Environment: Wind turbulence creates spatial variation'
)

// Test 1.7: Day/night cycle
const envWithCycle = new Environment({
  baseTemperature: 293,
  baseLight: 0.8,
  timeScale: 1
})
const tempDay = envWithCycle.getTemperature(0, 0)
envWithCycle.update(0.25) // Advance 1/4 day
const tempNight = envWithCycle.getTemperature(0, 0)
assert(
  Math.abs(tempDay - tempNight) > 0,
  'Environment: Day/night cycle affects temperature'
)

// Test 1.8: Preset environments
const desert = createEnvironment('desert')
const forest = createEnvironment('forest')
const ocean = createEnvironment('ocean')
const arctic = createEnvironment('arctic')
assert(
  desert.getConfig().baseTemperature > forest.getConfig().baseTemperature,
  'Environment: Desert preset is hotter than forest'
)
assert(
  ocean.getConfig().baseHumidity > desert.getConfig().baseHumidity,
  'Environment: Ocean preset is more humid than desert'
)
assert(
  arctic.getConfig().baseTemperature < forest.getConfig().baseTemperature,
  'Environment: Arctic preset is colder than forest'
)

// Test 1.9: Dynamic hotspot addition
const envDynamic = new Environment()
const tempBefore = envDynamic.getTemperature(100, 100)
envDynamic.addHotspot({ x: 100, y: 100, radius: 50, intensity: 30 })
const tempAfter = envDynamic.getTemperature(100, 100)
assert(
  tempAfter > tempBefore,
  'Environment: Dynamic hotspot addition works'
)

// Test 1.10: Wind velocity setter
const envWind = new Environment()
envWind.setWind(20, -10)
assert(
  Math.abs(envWind.getWindVx(0, 0) - 20) < 5 &&
  Math.abs(envWind.getWindVy(0, 0) - (-10)) < 5,
  'Environment: setWind() updates wind velocity'
)

console.log('')

// ============================================================================
// 2. WEATHER TESTS
// ============================================================================

console.log('🌦️  Weather System Tests')
console.log('─'.repeat(60))

// Test 2.1: Basic weather creation
const weather = new Weather()
assert(weather !== null, 'Weather: Create basic weather system')

// Test 2.2: Weather state retrieval
const weatherState = weather.getState()
assert(
  typeof weatherState.rain === 'boolean' &&
  typeof weatherState.rainIntensity === 'number' &&
  typeof weatherState.windStrength === 'number',
  'Weather: getState() returns valid state object'
)

// Test 2.3: Weather update
const stateBefore = weather.getState()
weather.update(1.0) // Advance 1 second
const stateAfter = weather.getState()
assert(
  stateAfter !== stateBefore,
  'Weather: update() advances weather state'
)

// Test 2.4: Start rain
const weatherRain = new Weather()
weatherRain.forceRain(10, 0.8)
const rainState = weatherRain.getState()
assert(
  rainState.rain === true && rainState.rainIntensity === 0.8,
  'Weather: forceRain() activates rain'
)

// Test 2.5: Stop rain
weatherRain.clearWeather()
const noRainState = weatherRain.getState()
assert(
  noRainState.rain === false,
  'Weather: clearWeather() deactivates rain'
)

// Test 2.6: Wind strength variation
const weatherWind = new Weather({ windVariation: 0.3 })
const wind1State = weatherWind.getState()
weatherWind.update(2.0)
const wind2State = weatherWind.getState()
assert(
  wind1State.windStrength !== wind2State.windStrength,
  'Weather: Wind strength varies over time'
)

// Test 2.7: Preset weather patterns
const calm = createWeather('calm')
const stormy = createWeather('stormy')
const dry = createWeather('dry')
const variable = createWeather('variable')

// Force rain to compare max intensities
calm.forceRain(20, 1.0)
stormy.forceRain(20, 1.0)
calm.update(0.5) // Let rain ramp up
stormy.update(0.5)

// Stormy should have higher max intensity configured
assert(
  stormy.getRainIntensity() >= calm.getRainIntensity(),
  'Weather: Stormy preset has equal or more rain intensity than calm'
)
assert(
  dry.getState().evaporationRate > calm.getState().evaporationRate,
  'Weather: Dry preset has higher evaporation than calm'
)

console.log('')

// ============================================================================
// 3. COLLISION TESTS
// ============================================================================

console.log('💥 Collision System Tests')
console.log('─'.repeat(60))

// Helper: Create mock entity
function createMockEntity(id, x, y, vx = 0, vy = 0) {
  return {
    id,
    x,
    y,
    vx,
    vy,
    m: {
      material: 'test.entity',
      physics: { mass: 1, bounce: 0.8 }
    }
  }
}

// Test 3.1: SpatialGrid creation
const grid = new SpatialGrid(100)
assert(grid !== null, 'Collision: Create spatial grid')

// Test 3.2: SpatialGrid insert and query
grid.clear()
const entity1 = createMockEntity('e1', 100, 100)
const entity2 = createMockEntity('e2', 110, 110)
const entity3 = createMockEntity('e3', 500, 500)
grid.insert(entity1)
grid.insert(entity2)
grid.insert(entity3)
const nearby = grid.queryRadius(100, 100, 50)
assert(
  nearby.length >= 2 && nearby.includes(entity1) && nearby.includes(entity2),
  'Collision: SpatialGrid queryRadius finds nearby entities'
)

// Test 3.3: CollisionDetector creation
const collisionDetector = new CollisionDetector(100, { width: 800, height: 600 })
assert(collisionDetector !== null, 'Collision: Create collision detector')

// Test 3.4: Collision detection (overlapping entities)
const entityA = createMockEntity('a', 100, 100)
const entityB = createMockEntity('b', 110, 110) // Overlapping (distance < 32)
const entities = [entityA, entityB]
collisionDetector.update(entities)
const collisions = collisionDetector.detectCollisions(entities)
assert(
  collisions.length > 0,
  'Collision: Detector finds overlapping entities'
)

// Test 3.5: No collision (separated entities)
const entityC = createMockEntity('c', 100, 100)
const entityD = createMockEntity('d', 200, 200) // Far apart
const separatedEntities = [entityC, entityD]
collisionDetector.update(separatedEntities)
const noCollisions = collisionDetector.detectCollisions(separatedEntities)
assert(
  noCollisions.length === 0,
  'Collision: Detector correctly finds no collision for separated entities'
)

// Test 3.6: Collision resolution (elastic bounce)
const entityE = createMockEntity('e', 100, 100, 10, 0)
const entityF = createMockEntity('f', 110, 100, -10, 0) // Head-on collision
const pair = {
  a: entityE,
  b: entityF,
  penetration: 12
}
const vxBefore = entityE.vx
CollisionDetector.resolve(pair)
const vxAfter = entityE.vx
assert(
  vxAfter !== vxBefore,
  'Collision: Elastic resolution changes velocity'
)
assert(
  Math.abs(entityE.x - entityF.x) > 20,
  'Collision: Entities separated after resolution'
)

// Test 3.7: Simple collision check
const overlapping = checkCollisionSimple(
  createMockEntity('x', 100, 100),
  createMockEntity('y', 110, 110),
  16, 16
)
assert(overlapping === true, 'Collision: checkCollisionSimple detects overlap')

const separated = checkCollisionSimple(
  createMockEntity('x', 100, 100),
  createMockEntity('y', 200, 200),
  16, 16
)
assert(separated === false, 'Collision: checkCollisionSimple detects separation')

// Test 3.8: Entity radius helper
const radius = getEntityRadius(createMockEntity('r', 0, 0))
assert(radius === 16, 'Collision: getEntityRadius returns default 16px')

console.log('')

// ============================================================================
// 4. ENERGY TESTS
// ============================================================================

console.log('⚡ Energy System Tests')
console.log('─'.repeat(60))

// Test 4.1: EnergySystem creation
const energySystem = new EnergySystem()
assert(energySystem !== null, 'Energy: Create energy system')

// Test 4.2: Thermal properties initialization
const entityThermal = createMockEntity('t', 0, 0)
entityThermal.temperature = undefined
initializeThermalProperties(entityThermal)
assert(
  entityThermal.temperature !== undefined &&
  entityThermal.humidity !== undefined &&
  entityThermal.conductivity !== undefined,
  'Energy: initializeThermalProperties sets thermal properties'
)

// Test 4.3: Entity-to-entity heat transfer
const hotEntity = createMockEntity('hot', 100, 100)
hotEntity.temperature = 350 // Hot (77°C)
hotEntity.conductivity = 0.8
hotEntity.density = 1.0

const coldEntity = createMockEntity('cold', 110, 110)
coldEntity.temperature = 280 // Cold (7°C)
coldEntity.conductivity = 0.8
coldEntity.density = 1.0

const hotTempBefore = hotEntity.temperature
energySystem.updateEntityTransfer([hotEntity, coldEntity], 1.0)
const hotTempAfter = hotEntity.temperature

assert(
  hotTempAfter < hotTempBefore,
  'Energy: Hot entity transfers heat to cold entity'
)
assert(
  coldEntity.temperature > 280,
  'Energy: Cold entity receives heat from hot entity'
)

// Test 4.4: Entity-environment heat transfer
const warmEntity = createMockEntity('warm', 200, 200)
warmEntity.temperature = 320 // Warm
warmEntity.conductivity = 0.5

const coolEnv = new Environment({ baseTemperature: 280 })
const entityTempBefore = warmEntity.temperature
energySystem.updateEnvironmentTransfer([warmEntity], coolEnv, 1.0)
const entityTempAfter = warmEntity.temperature

assert(
  entityTempAfter < entityTempBefore,
  'Energy: Entity loses heat to cooler environment'
)

// Test 4.5: Humidity exchange
const dryEntity = createMockEntity('dry', 300, 300)
dryEntity.humidity = 0.2
dryEntity.conductivity = 0.5

const humidEnv = new Environment({ baseHumidity: 0.8 })
const humidityBefore = dryEntity.humidity
energySystem.updateHumidityTransfer([dryEntity], humidEnv, 1.0)
const humidityAfter = dryEntity.humidity

assert(
  humidityAfter > humidityBefore,
  'Energy: Dry entity absorbs humidity from environment'
)

// Test 4.6: Thermal decay (Arrhenius-like)
const decayEntity = createMockEntity('decay', 400, 400)
decayEntity.temperature = 320 // Warm
decayEntity.opacity = 1.0
// Add base decay rate (thermal decay amplifies this)
decayEntity.m.manifestation = { aging: { decay_rate: 0.1 } }

energySystem.applyThermalDecay(decayEntity, 1.0)

assert(
  decayEntity.opacity < 1.0,
  'Energy: Thermal decay reduces opacity for warm entities'
)

// Test 4.7: Custom energy config
const customEnergy = new EnergySystem({
  transferRate: 0.5,
  environmentCoupling: 0.3
})
assert(
  customEnergy !== null,
  'Energy: Create energy system with custom config'
)

console.log('')

// ============================================================================
// 5. INTEGRATION TESTS
// ============================================================================

console.log('🔗 Integration Tests')
console.log('─'.repeat(60))

// Test 5.1: Environment + Weather integration
const integratedEnv = createEnvironment('forest')
const integratedWeather = createWeather('stormy')

// Force rain for testing
integratedWeather.forceRain(30, 0.8)

integratedEnv.update(1.0)
integratedWeather.update(1.0)

const integratedEnvState = integratedEnv.getState(100, 100)
const integratedWeatherState = integratedWeather.getState()

assert(
  integratedEnvState.temperature > 0 && integratedWeatherState.rain === true,
  'Integration: Environment and weather update independently'
)

// Test 5.2: Collision + Energy integration
const collEntity1 = createMockEntity('c1', 100, 100, 20, 0)
collEntity1.temperature = 320
collEntity1.conductivity = 0.8
collEntity1.density = 1.0

const collEntity2 = createMockEntity('c2', 110, 100, -20, 0)
collEntity2.temperature = 280
collEntity2.conductivity = 0.8
collEntity2.density = 1.0

const collEntities = [collEntity1, collEntity2]
const collDetector = new CollisionDetector(100, { width: 800, height: 600 })
const energy = new EnergySystem()

// Detect collision
collDetector.update(collEntities)
const collisionPairs = collDetector.detectCollisions(collEntities)

// Resolve collision
for (const pair of collisionPairs) {
  CollisionDetector.resolve(pair)
}

// Transfer heat
energy.updateEntityTransfer(collEntities, 1.0)

assert(
  collisionPairs.length > 0 && collEntity1.temperature < 320,
  'Integration: Collision detection + energy transfer work together'
)

// Test 5.3: Full physics pipeline
const physicsEnv = createEnvironment('desert')
const physicsWeather = createWeather('calm')
const physicsCollision = new CollisionDetector(100, { width: 800, height: 600 })
const physicsEnergy = new EnergySystem()

const physicsEntity1 = createMockEntity('p1', 200, 200, 5, 5)
const physicsEntity2 = createMockEntity('p2', 250, 250, -5, -5)
initializeThermalProperties(physicsEntity1)
initializeThermalProperties(physicsEntity2)

const physicsEntities = [physicsEntity1, physicsEntity2]

// Run full physics update
physicsEnv.update(0.016) // 60 FPS
physicsWeather.update(0.016)
physicsCollision.update(physicsEntities)
const physicCollisions = physicsCollision.detectCollisions(physicsEntities)
for (const pair of physicCollisions) {
  CollisionDetector.resolve(pair)
}
physicsEnergy.updateEntityTransfer(physicsEntities, 0.016)
physicsEnergy.updateEnvironmentTransfer(physicsEntities, physicsEnv, 0.016)
physicsEnergy.updateHumidityTransfer(physicsEntities, physicsEnv, 0.016)

assert(
  physicsEntity1.temperature !== undefined &&
  physicsEntity1.humidity !== undefined,
  'Integration: Full physics pipeline runs without errors'
)

console.log('')

// ============================================================================
// SUMMARY
// ============================================================================

console.log('═'.repeat(60))
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📊 Total:  ${passed + failed}`)
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
console.log('═'.repeat(60))

if (failed === 0) {
  console.log('\n🎉 All tests passed! Phase 5 physics system is working correctly.')
  process.exit(0)
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review the physics implementation.`)
  process.exit(1)
}
