/**
 * MDS v5 Phase 5 - Physics Module
 * Environmental physics, collision, energy transfer
 */

export * from './environment'
export * from './weather'
export * from './collision'
export * from './energy'

// Type-only exports
export type {
  EnvironmentConfig,
  EnvironmentState,
  HotSpot,
  MoistZone,
  LightSource
} from './environment'

export type {
  WeatherState,
  WeatherConfig
} from './weather'

export type {
  AABB,
  CollisionPair
} from './collision'

export type {
  EnergyConfig
} from './energy'
