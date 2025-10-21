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
export { Engine } from './core/engine'
export type { EngineOptions, WorldBounds, BoundaryBehavior } from './core/engine'
export { Entity } from './core/entity'
export { Field } from './core/field'

// World container (v5 recommended)
export { World } from './world'
export type { WorldOptions, SpawnOptions, WorldEvent } from './world'

// Renderers (v5)
export {
  DOMRenderer,
  CanvasRenderer,
  HeadlessRenderer,
  StateMapper
} from './render'

export type {
  RendererAdapter,
  VisualStyle
} from './render'

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
} from './physics'

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
} from './physics'

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
} from './communication'

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
} from './communication'

// Cognitive (v5 Phase 7)
export {
  LearningSystem,
  createExperience,
  calculateReward,
  MemoryConsolidation,
  memorySimilarity,
  SkillSystem,
  createSkill,
  SKILL_PRESETS
} from './cognitive'

export type {
  Experience,
  Pattern,
  LearningStats,
  LearningConfig,
  ConsolidatedMemory,
  ConsolidationConfig,
  Skill,
  SkillLevel,
  SkillConfig
} from './cognitive'

// World Mind (v5 Phase 8)
export {
  CollectiveIntelligence
} from './world-mind'

export type {
  WorldStats,
  EmergentPattern,
  PatternDetection
} from './world-mind'

// IO
export { loadMaterial, loadMaterials } from './io/loader'
export { setLlmBridge, getLlmBridge, DummyBridge } from './io/bridge-llm'
export type { LlmBridge } from './io/bridge-llm'
export {
  enableLLM,
  setCreatorContext,
  clearCreatorContext,
  getCreatorContext,
  isLlmEnabled,
  resetLlmAdapter
} from './io/llmAdapter'

// MDM Parser (v5.1 declarative config)
export {
  MdmParser,
  parseMaterial,
  detectLanguage,
  getDialoguePhrase
} from './io/mdm-parser'

export type {
  ParsedDialogue,
  EmotionTrigger,
  TriggerContext,
  ParsedMaterialConfig
} from './io/mdm-parser'

// WorldFile persistence (v5)
export {
  toWorldFile,
  fromWorldFile,
  saveWorldFile,
  loadWorldFile,
  downloadWorldFile,
  uploadWorldFile
} from './io/worldfile'

export type {
  WorldFile,
  SerializedEntity,
  SerializedField,
  SerializedRelationship
} from './io/worldfile'

// Utils
export { clamp, distance, similarity, lerp, randRange, randInt } from './utils/math'
export { parseSeconds, applyRule } from './utils/events'
export { seededRandom, noise1D } from './utils/random'

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

export type { CreatorContext } from './types'

// v5 Ontology (optional features)
export {
  MemoryBuffer,
  createMemory,
  blendEmotions,
  emotionDistance,
  applyEmotionalDelta,
  driftToBaseline,
  emotionToColor,
  emotionToHex,
  EMOTION_BASELINES,
  IntentStack,
  createIntent,
  INTENT_TEMPLATES,
  createRelationship,
  updateRelationship,
  relationshipStrength,
  isBonded,
  decayRelationship
} from './ontology'

export type {
  Memory,
  MemoryType,
  MemoryFilter,
  EmotionalState,
  EmotionalDelta,
  Intent,
  IntentGoal,
  Relationship,
  RelationshipEntry
} from './ontology'
