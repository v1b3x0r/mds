/**
 * MDS v4.0 → v5.0 - Info-Physics Engine
 * Living materials with autonomous behavior
 *
 * v5 additions:
 * - World container (three-phase tick loop)
 * - Memory system (MemoryBuffer with decay)
 * - Emotional state (PAD model + contagion)
 * - Intent system (goal-driven behavior)
 * - Relationships (entity bonds)
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * // v4 usage (still works - Engine directly)
 * import { Engine, loadMaterial } from '@v1b3x0r/mds-core'
 *
 * const engine = new Engine()
 * const material = await loadMaterial('./paper.shy.mdm')
 * const entity = engine.spawn(material, 100, 100)
 * engine.start()
 *
 * // v5 usage (World with full features)
 * import { World, loadMaterial } from '@v1b3x0r/mds-core'
 *
 * const world = new World({ features: { ontology: true } })
 * const material = await loadMaterial('./paper.curious.mdm')
 * const entity = world.spawn(material, 100, 100)
 *
 * // Use ontology features
 * entity.remember({ type: 'observation', subject: 'world', timestamp: 0 })
 * entity.feel({ valence: 0.5, arousal: 0.3, dominance: 0.5 })
 * entity.setIntent({ goal: 'wander', motivation: 0.4 })
 *
 * world.start()
 * ```
 */

// Core engine (v4 legacy - still fully supported)
export { Engine } from './0-foundation/engine'
export type { EngineOptions, WorldBounds, BoundaryBehavior } from './0-foundation/engine'
export { Entity } from './0-foundation/entity'
export type { ReflectionResult } from './0-foundation/entity'  // v5.4
export { Field } from './0-foundation/field'

// World container (v5 recommended)
export { World } from './6-world'
export type { WorldOptions, SpawnOptions, WorldEvent } from './6-world'

// v6.0: Linguistics system
export {
  TranscriptBuffer,
  WorldLexicon,
  LinguisticCrystallizer,
  ProtoLanguageGenerator  // v6.1: Emergent language generation
} from './6-world'

export type {
  Utterance,
  LexiconEntry,
  CrystallizerConfig,
  ProtoSentenceConfig  // v6.1: Proto-language config
} from './6-world'

// Renderers (v5)
export {
  DOMRenderer,
  CanvasRenderer,
  HeadlessRenderer,
  StateMapper
} from './7-interface/render'

export type {
  RendererAdapter,
  VisualStyle
} from './7-interface/render'

// Physics (v5 Phase 5)
export {
  Environment,
  createEnvironment,
  Weather,
  createWeather,
  CollisionDetector,
  SpatialGrid,
  checkCollisionSimple,
  getEntityRadius,
  EnergySystem,
  initializeThermalProperties
} from './2-physics'

export type {
  EnvironmentConfig,
  EnvironmentState,
  HotSpot,
  MoistZone,
  LightSource,
  WeatherState,
  WeatherConfig,
  AABB,
  CollisionPair,
  EnergyConfig
} from './2-physics'

// Communication (v5 Phase 6)
export {
  MessageBuilder,
  MessageQueue,
  MessageDelivery,
  createMessage,
  DialogueManager,
  DialogueBuilder,
  createNode,
  createChoice,
  LanguageGenerator,
  createOpenRouterGenerator,
  createMockGenerator,
  SemanticSimilarity,
  createOpenAISemantic,
  createMockSemantic,
  jaccardSimilarity,
  levenshteinDistance,
  levenshteinSimilarity
} from './4-communication'

// Context Providers (v5.8.0 - Auto-context injection)
export {
  OSContextProvider,
  ChatContextProvider
} from './7-interface/context'

export type {
  ContextProvider
} from './7-interface/context'

export type {
  Message,
  MessageType,
  MessagePriority,
  DialogueNode,
  DialogueChoice,
  DialogueTree,
  DialogueState,
  LanguageConfig,
  LanguageRequest,
  LanguageResponse,
  Embedding,
  SemanticConfig
} from './4-communication'

// Cognitive (v5 Phase 7)
export {
  LearningSystem,
  createExperience,
  calculateReward,
  // MemoryConsolidation (imported separately)
  // memorySimilarity (imported separately)
  SkillSystem,
  createSkill,
  SKILL_PRESETS
} from './3-cognition'

export type {
  Experience,
  Pattern,
  LearningStats,
  LearningConfig,
  // ConsolidatedMemory (from 1-ontology)
  // ConsolidationConfig (from 1-ontology)
  Skill,
  SkillLevel,
  SkillConfig
} from './3-cognition'

// World Mind (v5 Phase 8)
export {
  CollectiveIntelligence
} from './3-cognition/world-mind'

export type {
  WorldStats,
  EmergentPattern,
  PatternDetection
} from './3-cognition/world-mind'

// IO
export { loadMaterial, loadMaterials } from './7-interface/io/loader'
export { setLlmBridge, getLlmBridge, DummyBridge } from './7-interface/io/bridge-llm'
export type { LlmBridge } from './7-interface/io/bridge-llm'

// Validation (v5.2) - Moved to separate bundle for bundle size optimization
// Import from '@v1b3x0r/mds-core/validator' for validation features
// export { validateMaterial } from './core/mdm-validator'
// export type { ValidationError, ValidationResult, ValidationOptions } from './core/mdm-validator'

// Similarity (v5.2 Phase 2.1)
export {
  MockSimilarityProvider,
  OpenAISimilarityProvider,
  CohereSimilarityProvider,
  createSimilarityProvider,
} from './4-communication/semantics'

export type {
  SimilarityProvider,
  SimilarityProviderConfig,
  BaseSimilarityProvider
} from './4-communication/semantics'

// Coupling (v5.2 Phase 2.3)
export type {
  PhysicalProperties,
  CouplingConfig
} from './2-physics/coupling'

export {
  SymbolicPhysicalCoupler,
  createCoupler,
  emotionToSpeed,
  emotionToMass,
  emotionToForce,
  emotionToPhysicsColor,
  COUPLING_PRESETS
} from './2-physics/coupling'

export {
  enableLLM,
  setCreatorContext,
  clearCreatorContext,
  getCreatorContext,
  isLlmEnabled,
  resetLlmAdapter
} from './7-interface/io/llmAdapter'

// MDM Parser (v5.1 declarative config)
export {
  MdmParser,
  parseMaterial,
  detectLanguage,
  getDialoguePhrase
} from './7-interface/io/mdm-parser'

export type {
  ParsedDialogue,
  EmotionTrigger,
  TriggerContext,
  ParsedMaterialConfig
} from './7-interface/io/mdm-parser'

// WorldFile persistence (v5)
export {
  toWorldFile,
  fromWorldFile,
  saveWorldFile,
  loadWorldFile,
  downloadWorldFile,
  uploadWorldFile
} from './7-interface/io/worldfile'

export type {
  WorldFile,
  SerializedEntity,
  SerializedField,
  SerializedRelationship
} from './7-interface/io/worldfile'

// Utils
export { clamp, distance, similarity, lerp, randRange, randInt } from './0-foundation/math'
export { parseSeconds, applyRule } from './0-foundation/events'
export { seededRandom, noise1D } from './0-foundation/random'

// Types
export type {
  MdsMaterial,
  LangText,
  MdsBehaviorRule,
  MdsPhysics,
  MdsManifest,
  MdsAiBinding
} from './schema/mdspec'

export type {
  MdsField,
  MdsFieldVisual
} from './schema/fieldspec'

export type { CreatorContext } from './7-interface/context/types'

// v5 Ontology (optional features)
export {
  MemoryBuffer,
  createMemory,
  MemoryCrystallizer,
  createCrystallizer,
  crystallizeMemories,
  blendEmotions,
  emotionDistance,
  applyEmotionalDelta,
  driftToBaseline,
  emotionToColor,
  emotionToHex,
  resonate,  // v5.5: P2P emotional resonance
  EMOTION_BASELINES,
  EMOTION_BASELINES_TH,  // v5.8: Thai emotion baselines
  THAI_EMOTION_KEYWORDS,
  ENGLISH_EMOTION_KEYWORDS,
  detectEmotionFromText,
  detectAllEmotions,
  blendMultipleEmotions,
  findClosestThaiEmotion,
  IntentStack,
  createIntent,
  INTENT_TEMPLATES,
  IntentReasoner,
  createReasoner,
  reasonAbout,
  chooseBestIntent,
  createRelationship,
  updateRelationship,
  relationshipStrength,
  isBonded,
  decayRelationship,
  RelationshipDecayManager,
  createDecayManager,
  applyDecay,
  shouldPrune,
  DECAY_PRESETS
} from './1-ontology'

// Memory Consolidation (v6.4)
export { MemoryConsolidation, memorySimilarity } from './1-ontology/memory/consolidation'
export type { ConsolidatedMemory, ConsolidationConfig } from './1-ontology/memory/consolidation'

export type {
  Memory,
  MemoryType,
  MemoryFilter,
  CrystalMemory,
  CrystallizationConfig,
  EmotionalState,
  EmotionalDelta,
  Intent,
  IntentGoal,
  ReasonedIntent,
  ReasoningContext,
  ReasoningConfig,
  Relationship,
  RelationshipEntry,
  DecayCurve,
  DecayConfig,
  DecayStats
} from './1-ontology'

// v5.5: P2P Cognition (Phase 9)
export {
  ResonanceField,
  CognitiveLinkManager,
  MemoryLog,
  createMemoryLog,
  mergeLogs,
  CognitiveNetwork,
  createCognitiveNetwork,
  TrustSystem,
  createTrustSystem,
  deceive
} from './3-cognition'

export type {
  SignalType,
  CognitiveSignal,
  PropagationResult,
  CognitiveLink,
  CognitiveLinkOptions,
  VectorClock,
  MemoryEvent,
  MergeResult,
  NetworkConfig,
  NetworkStats,
  SharePolicy,
  TrustConfig,
  PrivacySettings,
  TrustEntry
} from './3-cognition'
