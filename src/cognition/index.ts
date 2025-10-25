/**
 * MDS v5.5 - P2P Cognition Module
 * Distributed cognition systems for entity networks
 *
 * Core concept: Understanding propagates like energy through cognitive fields,
 * not through explicit message passing. Global coherence emerges from local interactions.
 */

// Resonance Field (signal propagation)
export { ResonanceField } from './resonance-field'
export type {
  SignalType,
  CognitiveSignal,
  PropagationResult
} from './resonance-field'

// Cognitive Links (entity connections)
export { CognitiveLinkManager } from './cognitive-link'
export type {
  CognitiveLink,
  CognitiveLinkOptions
} from './cognitive-link'

// Memory Log (CRDT)
export { MemoryLog, createMemoryLog, mergeLogs } from './memory-log'
export type {
  VectorClock,
  MemoryEvent,
  MergeResult
} from './memory-log'

// Network Topology (Small-World)
export { CognitiveNetwork, createCognitiveNetwork } from './network-topology'
export type {
  NetworkConfig,
  NetworkStats
} from './network-topology'

// Trust & Privacy System
export { TrustSystem, createTrustSystem, deceive } from './trust-system'
export type {
  SharePolicy,
  TrustConfig,
  PrivacySettings,
  TrustEntry
} from './trust-system'
