/**
 * MDS v5.0 - World Layer
 * World container with ontology tick loop
 *
 * v6.0: Added linguistics system
 */

export { World } from './world'
export type {
  WorldOptions,
  SpawnOptions,
  WorldEvent
} from './world'

// v6.0: Linguistics exports
export { TranscriptBuffer } from './transcript'
export type { Utterance } from './transcript'

export { WorldLexicon } from './lexicon'
export type { LexiconEntry } from './lexicon'

export { LinguisticCrystallizer } from './crystallizer'
export type { CrystallizerConfig } from './crystallizer'

// v6.1: Proto-language generation
export { ProtoLanguageGenerator } from './proto-language'
export type { ProtoSentenceConfig } from './proto-language'
