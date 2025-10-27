/**
 * MDS v5 Phase 5 - Energy Transfer System
 * Thermal conductivity between entities and environment
 *
 * Design principles:
 * - Heat flows from hot to cold (second law of thermodynamics)
 * - Transfer rate proportional to temperature difference
 * - Conductivity affects transfer speed
 * - Energy conservation (total heat constant)
 */

import type { Entity } from '../0-foundation/entity'
import type { Environment } from './environment'

/**
 * Energy transfer configuration
 */
export interface EnergyConfig {
  thermalTransferRate?: number      // Base transfer coefficient
  environmentCoupling?: number      // Entity ↔ environment coupling strength
  minTemperature?: number           // Absolute minimum (Kelvin)
  maxTemperature?: number           // Absolute maximum (Kelvin)
}

/**
 * Energy system
 * Manages thermal energy transfer
 */
export class EnergySystem {
  private config: Required<EnergyConfig>

  constructor(config: EnergyConfig = {}) {
    this.config = {
      thermalTransferRate: config.thermalTransferRate ?? 0.1,
      environmentCoupling: config.environmentCoupling ?? 0.05,
      minTemperature: config.minTemperature ?? 100,   // 100K absolute min
      maxTemperature: config.maxTemperature ?? 400    // 400K absolute max
    }
  }

  /**
   * Update thermal transfer between entities
   */
  updateEntityTransfer(entities: Entity[], dt: number): void {
    // Pairwise thermal transfer
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i]
        const b = entities[j]

        // Skip if either doesn't have temperature
        if (a.temperature === undefined || b.temperature === undefined) continue

        // Calculate distance
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        // Only transfer if close enough (< 100px)
        if (dist > 100) continue

        // Proximity factor (closer = more transfer)
        const proximityFactor = 1 - (dist / 100)

        // Temperature difference
        const tempDiff = b.temperature - a.temperature

        // Get conductivity (average of both entities)
        const conductivityA = a.conductivity ?? 0.5
        const conductivityB = b.conductivity ?? 0.5
        const avgConductivity = (conductivityA + conductivityB) / 2

        // Transfer amount (proportional to diff, proximity, conductivity)
        const transfer = tempDiff * this.config.thermalTransferRate * proximityFactor * avgConductivity * dt

        // Apply transfer (energy flows from hot to cold)
        a.temperature += transfer
        b.temperature -= transfer

        // Clamp to valid range
        a.temperature = this.clampTemperature(a.temperature)
        b.temperature = this.clampTemperature(b.temperature)
      }
    }
  }

  /**
   * Update thermal transfer with environment
   */
  updateEnvironmentTransfer(entities: Entity[], environment: Environment, dt: number): void {
    for (const entity of entities) {
      if (entity.temperature === undefined) continue

      // Get environment temperature at entity position
      const envState = environment.getState(entity.x, entity.y)
      const envTemp = envState.temperature

      // Temperature difference
      const tempDiff = envTemp - entity.temperature

      // Entity conductivity affects coupling with environment
      const conductivity = entity.conductivity ?? 0.5

      // Transfer from environment
      const transfer = tempDiff * this.config.environmentCoupling * conductivity * dt

      entity.temperature += transfer
      entity.temperature = this.clampTemperature(entity.temperature)
    }
  }

  /**
   * Update humidity exchange with environment
   */
  updateHumidityTransfer(entities: Entity[], environment: Environment, dt: number): void {
    for (const entity of entities) {
      if (entity.humidity === undefined) continue

      // Get environment humidity at entity position
      const envState = environment.getState(entity.x, entity.y)
      const envHumidity = envState.humidity

      // Humidity difference
      const humidityDiff = envHumidity - entity.humidity

      // Transfer (entities equilibrate with environment)
      const transfer = humidityDiff * this.config.environmentCoupling * dt

      entity.humidity += transfer
      entity.humidity = Math.max(0, Math.min(1, entity.humidity))
    }
  }

  /**
   * Apply decay based on temperature
   * Hot entities decay faster (thermal degradation)
   */
  applyThermalDecay(entity: Entity, dt: number): void {
    if (entity.temperature === undefined) return

    // Reference temperature (293K = 20°C)
    const refTemp = 293

    // Decay rate increases with temperature (Arrhenius-like)
    const tempFactor = Math.exp((entity.temperature - refTemp) / 50)

    // Base decay rate from material
    const baseDecay = entity.m.manifestation?.aging?.decay_rate ?? 0

    // Apply temperature-modified decay
    const thermalDecay = baseDecay * tempFactor * dt

    entity.opacity = Math.max(0, entity.opacity - thermalDecay)
  }

  /**
   * Clamp temperature to valid range
   */
  private clampTemperature(temp: number): number {
    return Math.max(this.config.minTemperature, Math.min(this.config.maxTemperature, temp))
  }

  /**
   * Get configuration
   */
  getConfig(): EnergyConfig {
    return { ...this.config }
  }

  /**
   * Calculate total thermal energy in system
   */
  static calculateTotalEnergy(entities: Entity[]): number {
    let total = 0

    for (const entity of entities) {
      if (entity.temperature !== undefined) {
        const mass = entity.m.physics?.mass ?? 1
        // Simplified: E = m * T (ignoring specific heat capacity)
        total += mass * entity.temperature
      }
    }

    return total
  }
}

/**
 * Helper: Initialize entity thermal properties
 */
export function initializeThermalProperties(
  entity: Entity,
  temperature?: number,
  humidity?: number,
  density?: number,
  conductivity?: number
): void {
  // @ts-ignore - v5 extension
  entity.temperature = temperature ?? 293  // 20°C default
  // @ts-ignore - v5 extension
  entity.humidity = humidity ?? 0.5
  // @ts-ignore - v5 extension
  entity.density = density ?? 1.0  // kg/m³
  // @ts-ignore - v5 extension
  entity.conductivity = conductivity ?? 0.5  // 0..1
}

/**
 * Helper: Get entity specific heat capacity
 * (Material-dependent, future extension)
 */
export function getSpecificHeat(entity: Entity): number {
  // @ts-ignore - future extension
  return entity.m.physics?.specificHeat ?? 1.0
}
