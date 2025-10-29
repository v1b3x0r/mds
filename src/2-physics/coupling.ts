/**
 * MDS v5.2 Phase 2.3 - Symbolic-Physical Coupling
 * Bridge between emotional/cognitive state and physical behavior
 *
 * Design principles:
 * - Emotions influence movement speed, mass, friction
 * - Intent affects attraction/repulsion forces
 * - Memory strength modulates interaction intensity
 * - Creates emergent "body language" from internal state
 *
 * Theory:
 * - High arousal → faster movement (anxiety, excitement)
 * - Low valence → heavier, slower (sadness, depression)
 * - High dominance → stronger forces (confidence, assertiveness)
 * - Relationships → attraction/repulsion bias
 */

import type { EmotionalState } from '@mds/1-ontology/emotion'
import type { Intent } from '@mds/1-ontology/intent/intent'

/**
 * Physical properties that can be modulated by symbolic state
 */
export interface PhysicalProperties {
  mass: number              // Base mass (1.0 = normal)
  friction: number          // Drag coefficient (0..1)
  speed: number             // Speed multiplier (1.0 = normal)
  forceMultiplier: number   // Interaction force multiplier
  bounce: number            // Elasticity (0..1)
}

/**
 * Coupling configuration
 */
export interface CouplingConfig {
  arousalToSpeed?: number       // How much arousal affects speed (default: 0.5)
  valenceToMass?: number        // How much valence affects mass (default: 0.3)
  dominanceToForce?: number     // How much dominance affects forces (default: 0.4)
  memoryToAttraction?: number   // Memory strength → attraction (default: 0.2)
  intentToDirection?: number    // Intent → movement bias (default: 0.6)
  enabled?: boolean             // Global coupling toggle (default: true)
}

/**
 * Symbolic-Physical Coupler
 * Translates emotional/cognitive state into physical behavior
 */
export class SymbolicPhysicalCoupler {
  private config: Required<CouplingConfig>

  constructor(config: CouplingConfig = {}) {
    this.config = {
      arousalToSpeed: config.arousalToSpeed ?? 0.5,
      valenceToMass: config.valenceToMass ?? 0.3,
      dominanceToForce: config.dominanceToForce ?? 0.4,
      memoryToAttraction: config.memoryToAttraction ?? 0.2,
      intentToDirection: config.intentToDirection ?? 0.6,
      enabled: config.enabled ?? true
    }
  }

  /**
   * Calculate physical properties from emotional state
   * @param emotion Current emotional state (PAD model)
   * @returns Modified physical properties
   */
  emotionToPhysics(emotion: EmotionalState): Partial<PhysicalProperties> {
    if (!this.config.enabled) {
      return {}
    }

    const { valence, arousal, dominance } = emotion

    // Arousal → Speed
    // High arousal = faster (anxiety, excitement)
    // Low arousal = slower (calm, lethargy)
    const speedModifier = 1.0 + (arousal * this.config.arousalToSpeed)

    // Valence → Mass
    // Low valence = heavier (sadness weighs you down)
    // High valence = lighter (joy makes you float)
    const massModifier = 1.0 - (valence * this.config.valenceToMass)

    // Dominance → Force strength
    // High dominance = stronger forces (assertive, confident)
    // Low dominance = weaker forces (submissive, timid)
    const forceModifier = 1.0 + (dominance * this.config.dominanceToForce)

    // Valence → Friction
    // Negative valence = higher friction (stuck, sluggish)
    // Positive valence = lower friction (flowing, smooth)
    const baseFriction = 0.5
    const frictionModifier = valence < 0
      ? baseFriction + Math.abs(valence) * 0.3  // Increase friction for negative valence
      : baseFriction - valence * 0.2             // Decrease friction for positive valence

    return {
      speed: Math.max(0.1, speedModifier),           // Never completely stop
      mass: Math.max(0.5, Math.min(2.0, massModifier)),  // Cap between 0.5-2.0
      forceMultiplier: Math.max(0.5, forceModifier),
      friction: Math.max(0.1, Math.min(1.0, frictionModifier))
    }
  }

  /**
   * Calculate attraction bias from memory strength
   * @param memoryStrength Memory strength for target (0..1)
   * @returns Attraction multiplier (1.0 = neutral, >1 = attract, <1 = repel)
   */
  memoryToAttraction(memoryStrength: number): number {
    if (!this.config.enabled) {
      return 1.0
    }

    // Strong memories → stronger attraction
    // memoryStrength 0 → 1.0 (neutral)
    // memoryStrength 1 → 1.2 (20% more attraction)
    return 1.0 + (memoryStrength * this.config.memoryToAttraction)
  }

  /**
   * Calculate movement bias from intent
   * @param intent Current intent/goal
   * @param targetPosition Position of intent target
   * @param currentPosition Current entity position
   * @returns Force vector bias {x, y}
   */
  intentToMovement(
    intent: Intent | null,
    targetPosition: { x: number; y: number } | null,
    currentPosition: { x: number; y: number }
  ): { x: number; y: number } {
    if (!this.config.enabled || !intent || !targetPosition) {
      return { x: 0, y: 0 }
    }

    // Calculate direction to target
    const dx = targetPosition.x - currentPosition.x
    const dy = targetPosition.y - currentPosition.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist === 0) {
      return { x: 0, y: 0 }
    }

    // Normalize and scale by intent motivation and config
    const strength = intent.motivation * this.config.intentToDirection

    return {
      x: (dx / dist) * strength,
      y: (dy / dist) * strength
    }
  }

  /**
   * Apply emotional modulation to velocity
   * @param velocity Current velocity {vx, vy}
   * @param emotion Emotional state
   * @returns Modified velocity
   */
  modulateVelocity(
    velocity: { vx: number; vy: number },
    emotion: EmotionalState
  ): { vx: number; vy: number } {
    if (!this.config.enabled) {
      return velocity
    }

    const physics = this.emotionToPhysics(emotion)
    const speedMult = physics.speed ?? 1.0

    return {
      vx: velocity.vx * speedMult,
      vy: velocity.vy * speedMult
    }
  }

  /**
   * Apply emotional modulation to force
   * @param force Current force vector {fx, fy}
   * @param emotion Emotional state
   * @param memoryStrength Optional memory strength for target
   * @returns Modified force
   */
  modulateForce(
    force: { fx: number; fy: number },
    emotion: EmotionalState,
    memoryStrength: number = 0
  ): { fx: number; fy: number } {
    if (!this.config.enabled) {
      return force
    }

    const physics = this.emotionToPhysics(emotion)
    const forceMult = (physics.forceMultiplier ?? 1.0) * this.memoryToAttraction(memoryStrength)

    return {
      fx: force.fx * forceMult,
      fy: force.fy * forceMult
    }
  }

  /**
   * Get complete physical profile from emotional state
   */
  getPhysicalProfile(emotion: EmotionalState): PhysicalProperties {
    const modifiers = this.emotionToPhysics(emotion)

    return {
      mass: modifiers.mass ?? 1.0,
      friction: modifiers.friction ?? 0.5,
      speed: modifiers.speed ?? 1.0,
      forceMultiplier: modifiers.forceMultiplier ?? 1.0,
      bounce: 0.3  // Default bounce (not emotion-dependent yet)
    }
  }

  /**
   * Enable/disable coupling
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * Check if coupling is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Get current config
   */
  getConfig(): CouplingConfig {
    return { ...this.config }
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<CouplingConfig>): void {
    Object.assign(this.config, config)
  }
}

/**
 * Helper: Create coupler with default config
 */
export function createCoupler(config?: CouplingConfig): SymbolicPhysicalCoupler {
  return new SymbolicPhysicalCoupler(config)
}

/**
 * Helper: Calculate emotion-based speed multiplier
 */
export function emotionToSpeed(emotion: EmotionalState): number {
  // Arousal = primary driver of speed
  // High arousal = fast (excited, anxious)
  // Low arousal = slow (calm, tired)
  return 1.0 + (emotion.arousal * 0.5)
}

/**
 * Helper: Calculate emotion-based mass multiplier
 */
export function emotionToMass(emotion: EmotionalState): number {
  // Valence = emotional weight
  // Negative valence = heavier (sadness)
  // Positive valence = lighter (joy)
  return 1.0 - (emotion.valence * 0.3)
}

/**
 * Helper: Calculate emotion-based force multiplier
 */
export function emotionToForce(emotion: EmotionalState): number {
  // Dominance = force of presence
  // High dominance = stronger forces
  // Low dominance = weaker forces
  return 1.0 + (emotion.dominance * 0.4)
}

/**
 * Helper: Get emotional "color" for physics (for debugging/visualization)
 */
export function emotionToPhysicsColor(emotion: EmotionalState): string {
  const speed = emotionToSpeed(emotion)
  const mass = emotionToMass(emotion)

  // Fast + light = bright colors
  // Slow + heavy = dark colors
  const brightness = Math.floor((speed / mass) * 128 + 127)

  const r = emotion.valence > 0 ? brightness : 128
  const g = emotion.arousal > 0 ? brightness : 128
  const b = emotion.dominance > 0 ? brightness : 128

  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Preset coupling configurations
 */
export const COUPLING_PRESETS = {
  /**
   * Subtle coupling (realistic human-like)
   */
  subtle: {
    arousalToSpeed: 0.2,
    valenceToMass: 0.1,
    dominanceToForce: 0.15,
    memoryToAttraction: 0.1,
    intentToDirection: 0.3
  },

  /**
   * Standard coupling (balanced)
   */
  standard: {
    arousalToSpeed: 0.5,
    valenceToMass: 0.3,
    dominanceToForce: 0.4,
    memoryToAttraction: 0.2,
    intentToDirection: 0.6
  },

  /**
   * Extreme coupling (exaggerated for experimentation)
   */
  extreme: {
    arousalToSpeed: 1.0,
    valenceToMass: 0.8,
    dominanceToForce: 1.0,
    memoryToAttraction: 0.5,
    intentToDirection: 1.0
  },

  /**
   * Disabled coupling (emotions don't affect physics)
   */
  disabled: {
    arousalToSpeed: 0,
    valenceToMass: 0,
    dominanceToForce: 0,
    memoryToAttraction: 0,
    intentToDirection: 0,
    enabled: false
  }
} as const
