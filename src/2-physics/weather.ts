/**
 * MDS v5 Phase 5 - Weather System
 * Rain, wind patterns, evaporation
 *
 * Design principles:
 * - Time-based weather patterns
 * - Affects environment and entity physics
 * - Configurable intensity and frequency
 */

/**
 * Weather state
 */
export interface WeatherState {
  rain: boolean
  rainIntensity: number      // 0..1
  windStrength: number       // Multiplier for base wind
  evaporationRate: number    // Humidity decrease rate
  cloudCover: number         // 0..1 (affects light)
}

/**
 * Weather configuration
 */
export interface WeatherConfig {
  rainProbability?: number        // Chance of rain per update
  rainDuration?: number           // Average rain duration (seconds)
  maxRainIntensity?: number       // Maximum rain intensity
  evaporationBase?: number        // Base evaporation rate
  windVariation?: number          // Wind strength variation range
}

/**
 * Weather system
 * Manages dynamic weather conditions
 */
export class Weather {
  private state: WeatherState
  private config: Required<WeatherConfig>
  private rainTimer: number = 0
  private nextRainCheck: number = 0

  constructor(config: WeatherConfig = {}) {
    this.config = {
      rainProbability: config.rainProbability ?? 0.1,
      rainDuration: config.rainDuration ?? 30,
      maxRainIntensity: config.maxRainIntensity ?? 1.0,
      evaporationBase: config.evaporationBase ?? 0.01,
      windVariation: config.windVariation ?? 0.5
    }

    this.state = {
      rain: false,
      rainIntensity: 0,
      windStrength: 1.0,
      evaporationRate: this.config.evaporationBase,
      cloudCover: 0
    }
  }

  /**
   * Update weather system
   */
  update(dt: number): void {
    // Check for rain start
    if (!this.state.rain) {
      this.nextRainCheck -= dt
      if (this.nextRainCheck <= 0) {
        this.nextRainCheck = 10 + Math.random() * 20  // Check every 10-30 seconds

        if (Math.random() < this.config.rainProbability) {
          this.startRain()
        }
      }
    }

    // Update rain
    if (this.state.rain) {
      this.rainTimer -= dt

      // Rain intensity (ramp up then down)
      const progress = 1 - (this.rainTimer / this.config.rainDuration)
      if (progress < 0.2) {
        // Ramp up
        this.state.rainIntensity = (progress / 0.2) * this.config.maxRainIntensity
      } else if (progress > 0.8) {
        // Ramp down
        this.state.rainIntensity = ((1 - progress) / 0.2) * this.config.maxRainIntensity
      } else {
        // Peak
        this.state.rainIntensity = this.config.maxRainIntensity
      }

      // Cloud cover follows rain
      this.state.cloudCover = this.state.rainIntensity * 0.7

      // Evaporation decreases during rain
      this.state.evaporationRate = this.config.evaporationBase * (1 - this.state.rainIntensity * 0.8)

      // End rain
      if (this.rainTimer <= 0) {
        this.stopRain()
      }
    } else {
      // No rain: higher evaporation, clear sky
      this.state.evaporationRate = this.config.evaporationBase
      this.state.cloudCover *= 0.95  // Gradual clearing
    }

    // Wind variation
    this.state.windStrength = 1.0 + (Math.random() - 0.5) * this.config.windVariation
    if (this.state.rain) {
      // Stronger wind during rain
      this.state.windStrength *= 1.5
    }
  }

  /**
   * Start rain
   */
  private startRain(): void {
    this.state.rain = true
    this.rainTimer = this.config.rainDuration * (0.5 + Math.random() * 0.5)  // Variable duration
  }

  /**
   * Stop rain
   */
  private stopRain(): void {
    this.state.rain = false
    this.state.rainIntensity = 0
  }

  /**
   * Get current weather state
   */
  getState(): WeatherState {
    return { ...this.state }
  }

  /**
   * Force rain (for testing/demos)
   */
  forceRain(duration: number = 30, intensity: number = 1.0): void {
    this.state.rain = true
    this.rainTimer = duration
    this.state.rainIntensity = intensity
    this.state.cloudCover = intensity * 0.7
  }

  /**
   * Clear weather (stop rain immediately)
   */
  clearWeather(): void {
    this.stopRain()
    this.state.cloudCover = 0
  }

  /**
   * Check if raining
   */
  isRaining(): boolean {
    return this.state.rain
  }

  /**
   * Get rain intensity
   */
  getRainIntensity(): number {
    return this.state.rainIntensity
  }

  /**
   * Get wind multiplier
   */
  getWindMultiplier(): number {
    return this.state.windStrength
  }

  /**
   * Get evaporation rate
   */
  getEvaporationRate(): number {
    return this.state.evaporationRate
  }

  /**
   * Get cloud cover (affects light)
   */
  getCloudCover(): number {
    return this.state.cloudCover
  }
}

/**
 * Helper: Create weather with preset
 */
export function createWeather(preset: 'calm' | 'stormy' | 'dry' | 'variable'): Weather {
  switch (preset) {
    case 'calm':
      return new Weather({
        rainProbability: 0.05,
        rainDuration: 20,
        maxRainIntensity: 0.3,
        windVariation: 0.2
      })

    case 'stormy':
      return new Weather({
        rainProbability: 0.3,
        rainDuration: 60,
        maxRainIntensity: 1.0,
        windVariation: 0.8
      })

    case 'dry':
      return new Weather({
        rainProbability: 0.01,
        rainDuration: 10,
        maxRainIntensity: 0.2,
        evaporationBase: 0.02,
        windVariation: 0.3
      })

    case 'variable':
    default:
      return new Weather({
        rainProbability: 0.15,
        rainDuration: 40,
        maxRainIntensity: 0.8,
        windVariation: 0.5
      })
  }
}
