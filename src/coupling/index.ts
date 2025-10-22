/**
 * MDS v5.2 - Coupling Systems
 * Bridge between symbolic (emotion/cognition) and physical layers
 */

export type {
  PhysicalProperties,
  CouplingConfig
} from './symbolic-physical'

export {
  SymbolicPhysicalCoupler,
  createCoupler,
  emotionToSpeed,
  emotionToMass,
  emotionToForce,
  emotionToPhysicsColor,
  COUPLING_PRESETS
} from './symbolic-physical'
