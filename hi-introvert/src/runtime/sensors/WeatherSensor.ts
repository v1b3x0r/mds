/**
 * Weather Sensor - v6.7
 * Wraps MDS Weather system and exposes context for entities
 *
 * Mapping strategy:
 * - Rain state → Binary flag + intensity
 * - Wind strength → Normalized multiplier
 * - Cloud cover → Light reduction factor
 * - Evaporation → Environmental dryness
 */

import { Weather, WeatherState } from '@v1b3x0r/mds-core'

export interface WeatherContext {
  'weather.rain': number              // 0 or 1 (binary)
  'weather.rainIntensity': number     // 0..1
  'weather.windStrength': number      // Multiplier (typically 0.5..2.0)
  'weather.cloudCover': number        // 0..1 (affects light/mood)
  'weather.evaporationRate': number   // 0..1 (affects humidity)
}

export class WeatherSensor {
  private weather: Weather

  constructor(weather: Weather) {
    this.weather = weather
  }

  /**
   * Get current weather state
   */
  getState(): WeatherState {
    return this.weather.getState()
  }

  /**
   * Map weather state to world.broadcastContext() format
   * (Generic key-value context for MDM triggers)
   */
  mapToContext(state?: WeatherState): WeatherContext {
    const weatherState = state || this.weather.getState()

    return {
      'weather.rain': weatherState.rain ? 1 : 0,
      'weather.rainIntensity': weatherState.rainIntensity,
      'weather.windStrength': weatherState.windStrength,
      'weather.cloudCover': weatherState.cloudCover,
      'weather.evaporationRate': weatherState.evaporationRate
    }
  }

  /**
   * Pretty print weather for debugging
   */
  formatWeather(state?: WeatherState): string {
    const weatherState = state || this.weather.getState()

    if (!weatherState.rain) {
      return `Weather: Clear (wind: ${weatherState.windStrength.toFixed(2)}x, clouds: ${(weatherState.cloudCover * 100).toFixed(0)}%)`
    }

    return `Weather: Rain (intensity: ${(weatherState.rainIntensity * 100).toFixed(0)}%, wind: ${weatherState.windStrength.toFixed(2)}x, clouds: ${(weatherState.cloudCover * 100).toFixed(0)}%)`
  }
}
