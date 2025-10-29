/**
 * MDS v5 Phase 5 - Environment System
 * Environmental gradients (temperature, humidity, light) and wind
 *
 * Design principles:
 * - Continuous gradient functions (not grid-based)
 * - Configurable hotspots and zones
 * - Time-varying conditions (day/night cycles)
 * - Affects entity physics and behavior
 */

import { lerp } from '@mds/0-foundation/math'

/**
 * Environment gradient configuration
 */
export interface EnvironmentConfig {
  // Temperature (Kelvin)
  baseTemperature?: number        // Default: 293K (20°C)
  temperatureVariance?: number    // Spatial variation amplitude
  hotspots?: HotSpot[]            // Heat sources

  // Humidity (0..1)
  baseHumidity?: number           // Default: 0.5
  humidityVariance?: number       // Spatial variation
  moistZones?: MoistZone[]        // Humid areas

  // Light (0..1, lux normalized)
  baseLight?: number              // Default: 0.8
  lightVariance?: number          // Spatial variation
  lightSources?: LightSource[]    // Point lights

  // Wind (pixels/second)
  windVelocity?: { vx: number, vy: number }
  windTurbulence?: number         // Randomness factor

  // Time
  timeScale?: number              // Speed of day/night cycle (0 = static)
}

/**
 * Hotspot (heat source)
 */
export interface HotSpot {
  x: number
  y: number
  radius: number
  intensity: number  // Temperature delta (K)
}

/**
 * Moist zone (humidity source)
 */
export interface MoistZone {
  x: number
  y: number
  radius: number
  intensity: number  // Humidity delta (0..1)
}

/**
 * Light source
 */
export interface LightSource {
  x: number
  y: number
  radius: number
  intensity: number  // Light delta (0..1)
}

/**
 * Environment state at a point
 */
export interface EnvironmentState {
  temperature: number  // Kelvin
  humidity: number     // 0..1
  light: number        // 0..1
  windVx: number       // pixels/second
  windVy: number       // pixels/second
}

/**
 * Environment class
 * Provides continuous gradient functions for environmental properties
 */
export class Environment {
  private config: Required<EnvironmentConfig>
  private time: number = 0  // Internal time (seconds)

  constructor(config: EnvironmentConfig = {}) {
    this.config = {
      baseTemperature: config.baseTemperature ?? 293,
      temperatureVariance: config.temperatureVariance ?? 10,
      hotspots: config.hotspots ?? [],

      baseHumidity: config.baseHumidity ?? 0.5,
      humidityVariance: config.humidityVariance ?? 0.2,
      moistZones: config.moistZones ?? [],

      baseLight: config.baseLight ?? 0.8,
      lightVariance: config.lightVariance ?? 0.1,
      lightSources: config.lightSources ?? [],

      windVelocity: config.windVelocity ?? { vx: 0, vy: 0 },
      windTurbulence: config.windTurbulence ?? 0.1,

      timeScale: config.timeScale ?? 0  // Static by default
    }
  }

  /**
   * Update environment (advance time)
   */
  update(dt: number): void {
    this.time += dt * this.config.timeScale
  }

  /**
   * Get environment state at position
   */
  getState(x: number, y: number): EnvironmentState {
    return {
      temperature: this.getTemperature(x, y),
      humidity: this.getHumidity(x, y),
      light: this.getLight(x, y),
      windVx: this.getWindVx(x, y),
      windVy: this.getWindVy(x, y)
    }
  }

  /**
   * Get temperature at position (Kelvin)
   */
  getTemperature(x: number, y: number): number {
    // Base temperature with spatial noise
    let temp = this.config.baseTemperature
    temp += Math.sin(x * 0.01) * this.config.temperatureVariance
    temp += Math.cos(y * 0.01) * this.config.temperatureVariance

    // Add hotspot contributions
    for (const hotspot of this.config.hotspots) {
      const dx = x - hotspot.x
      const dy = y - hotspot.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < hotspot.radius) {
        const falloff = 1 - (dist / hotspot.radius)
        temp += hotspot.intensity * falloff * falloff  // Quadratic falloff
      }
    }

    // Day/night cycle (if timeScale > 0)
    if (this.config.timeScale > 0) {
      const dayNight = Math.sin(this.time * Math.PI * 2)  // -1..1
      temp += dayNight * 5  // ±5K variation
    }

    return Math.max(0, temp)  // Prevent negative Kelvin
  }

  /**
   * Get humidity at position (0..1)
   */
  getHumidity(x: number, y: number): number {
    // Base humidity with spatial noise
    let humidity = this.config.baseHumidity
    humidity += Math.sin(x * 0.008) * this.config.humidityVariance
    humidity += Math.cos(y * 0.008) * this.config.humidityVariance

    // Add moist zone contributions
    for (const zone of this.config.moistZones) {
      const dx = x - zone.x
      const dy = y - zone.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < zone.radius) {
        const falloff = 1 - (dist / zone.radius)
        humidity += zone.intensity * falloff
      }
    }

    return Math.max(0, Math.min(1, humidity))
  }

  /**
   * Get light intensity at position (0..1)
   */
  getLight(x: number, y: number): number {
    // Base light with spatial variation
    let light = this.config.baseLight
    light += Math.sin(x * 0.005 + y * 0.005) * this.config.lightVariance

    // Add light source contributions
    for (const source of this.config.lightSources) {
      const dx = x - source.x
      const dy = y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < source.radius) {
        const falloff = 1 - (dist / source.radius)
        light += source.intensity * falloff * falloff
      }
    }

    // Day/night cycle
    if (this.config.timeScale > 0) {
      const dayNight = Math.sin(this.time * Math.PI * 2)  // -1..1
      light *= lerp(0.2, 1.0, (dayNight + 1) / 2)  // 20% at night, 100% at noon
    }

    return Math.max(0, Math.min(1, light))
  }

  /**
   * Get wind X velocity at position
   */
  getWindVx(x: number, _y: number): number {
    let vx = this.config.windVelocity.vx

    // Add turbulence
    if (this.config.windTurbulence > 0) {
      vx += (Math.sin(x * 0.02 + this.time) - 0.5) * this.config.windTurbulence * 50
    }

    return vx
  }

  /**
   * Get wind Y velocity at position
   */
  getWindVy(_x: number, y: number): number {
    let vy = this.config.windVelocity.vy

    // Add turbulence
    if (this.config.windTurbulence > 0) {
      vy += (Math.cos(y * 0.02 + this.time) - 0.5) * this.config.windTurbulence * 50
    }

    return vy
  }

  /**
   * Add hotspot dynamically
   */
  addHotspot(hotspot: HotSpot): void {
    this.config.hotspots.push(hotspot)
  }

  /**
   * Add moist zone dynamically
   */
  addMoistZone(zone: MoistZone): void {
    this.config.moistZones.push(zone)
  }

  /**
   * Add light source dynamically
   */
  addLightSource(source: LightSource): void {
    this.config.lightSources.push(source)
  }

  /**
   * Set wind velocity
   */
  setWind(vx: number, vy: number): void {
    this.config.windVelocity = { vx, vy }
  }

  /**
   * Get configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config }
  }
}

/**
 * Helper: Create environment with preset configurations
 */
export function createEnvironment(preset: 'desert' | 'forest' | 'ocean' | 'arctic' | 'custom', config?: EnvironmentConfig): Environment {
  switch (preset) {
    case 'desert':
      return new Environment({
        baseTemperature: 313,  // 40°C
        temperatureVariance: 15,
        baseHumidity: 0.1,
        humidityVariance: 0.05,
        baseLight: 0.95,
        windVelocity: { vx: 20, vy: 5 },
        windTurbulence: 0.3,
        ...config
      })

    case 'forest':
      return new Environment({
        baseTemperature: 288,  // 15°C
        temperatureVariance: 5,
        baseHumidity: 0.7,
        humidityVariance: 0.1,
        baseLight: 0.6,
        windVelocity: { vx: -10, vy: 0 },
        windTurbulence: 0.15,
        ...config
      })

    case 'ocean':
      return new Environment({
        baseTemperature: 285,  // 12°C
        temperatureVariance: 3,
        baseHumidity: 0.9,
        humidityVariance: 0.05,
        baseLight: 0.7,
        windVelocity: { vx: 30, vy: -10 },
        windTurbulence: 0.5,
        ...config
      })

    case 'arctic':
      return new Environment({
        baseTemperature: 253,  // -20°C
        temperatureVariance: 8,
        baseHumidity: 0.3,
        humidityVariance: 0.1,
        baseLight: 0.5,
        windVelocity: { vx: -40, vy: -20 },
        windTurbulence: 0.8,
        ...config
      })

    case 'custom':
    default:
      return new Environment(config)
  }
}
