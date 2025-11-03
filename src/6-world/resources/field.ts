/**
 * MDS Phase 1 - Resource Field System
 * Spatial resource distribution (water, food, energy)
 *
 * Design:
 * - Fields can be point sources, areas, or gradients
 * - Entities sense and consume from fields
 * - Fields deplete and regenerate over time
 * - Links resource pressure to spatial dynamics
 */

/**
 * Resource field distribution type
 */
export type ResourceFieldType = 'point' | 'area' | 'gradient'

/**
 * Point source configuration (e.g., water well)
 */
export interface PointSource {
  x: number
  y: number
}

/**
 * Area source configuration (e.g., oasis rectangle)
 */
export interface AreaSource {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Gradient source configuration (e.g., water spreading from center)
 */
export interface GradientSource {
  center: { x: number; y: number }
  radius: number
  falloff: number  // 0..1, how quickly intensity drops with distance
}

/**
 * Resource field representing spatial resource distribution
 *
 * @example
 * // Water well (point source)
 * {
 *   id: 'well_1',
 *   resourceType: 'water',
 *   type: 'point',
 *   position: { x: 200, y: 200 },
 *   intensity: 1.0,
 *   depletionRate: 0.01,
 *   regenerationRate: 0.005
 * }
 *
 * @example
 * // Oasis (area source)
 * {
 *   id: 'oasis_1',
 *   resourceType: 'water',
 *   type: 'area',
 *   area: { x: 100, y: 100, width: 50, height: 50 },
 *   intensity: 0.8,
 *   depletionRate: 0.005,
 *   regenerationRate: 0.01
 * }
 *
 * @example
 * // Water gradient (spreading from center)
 * {
 *   id: 'lake_1',
 *   resourceType: 'water',
 *   type: 'gradient',
 *   gradient: { center: { x: 300, y: 300 }, radius: 100, falloff: 0.8 },
 *   intensity: 1.0,
 *   depletionRate: 0.001,
 *   regenerationRate: 0.002
 * }
 */
export interface ResourceField {
  id: string                    // Unique identifier
  resourceType: string          // e.g., "water", "food", "energy"
  type: ResourceFieldType       // Distribution type

  // Spatial configuration (only one should be set based on type)
  position?: PointSource        // For point sources
  area?: AreaSource             // For area sources
  gradient?: GradientSource     // For gradient sources

  // Resource dynamics
  intensity: number             // 0..1, current resource availability
  maxIntensity?: number         // 0..1, max intensity (default: 1.0)
  depletionRate?: number        // Rate of natural depletion (per second)
  regenerationRate?: number     // Rate of natural regeneration (per second)

  // Metadata
  lastUpdated?: number          // World time when last updated
  totalConsumed?: number        // Total amount consumed (cumulative)
}

/**
 * Calculate resource intensity at a given position
 *
 * @param field - Resource field
 * @param x - Position X
 * @param y - Position Y
 * @returns Intensity at position (0..1)
 *
 * @example
 * const intensity = getIntensityAt(waterField, entityX, entityY)
 * if (intensity > 0.5) {
 *   console.log('Strong water source nearby!')
 * }
 */
export function getIntensityAt(field: ResourceField, x: number, y: number): number {
  if (field.intensity <= 0) return 0

  switch (field.type) {
    case 'point': {
      if (!field.position) return 0

      // Point source: intensity decreases with distance
      const dx = x - field.position.x
      const dy = y - field.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Simple inverse square law (1 / (1 + distance^2))
      const falloff = 1 / (1 + distance * distance * 0.0001)
      return field.intensity * falloff
    }

    case 'area': {
      if (!field.area) return 0

      // Area source: uniform intensity within bounds
      const inBoundsX = x >= field.area.x && x <= field.area.x + field.area.width
      const inBoundsY = y >= field.area.y && y <= field.area.y + field.area.height

      if (inBoundsX && inBoundsY) {
        return field.intensity
      }
      return 0
    }

    case 'gradient': {
      if (!field.gradient) return 0

      // Gradient source: intensity decreases with distance from center
      const dx = x - field.gradient.center.x
      const dy = y - field.gradient.center.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > field.gradient.radius) return 0

      // Apply falloff (0 = linear, 1 = steep)
      const normalized = distance / field.gradient.radius
      const falloff = Math.pow(1 - normalized, 1 + field.gradient.falloff * 3)

      return field.intensity * falloff
    }

    default:
      return 0
  }
}

/**
 * Check if position is within field range
 *
 * @param field - Resource field
 * @param x - Position X
 * @param y - Position Y
 * @param threshold - Minimum intensity threshold (default: 0.01)
 * @returns true if position is within field influence
 */
export function isInRange(
  field: ResourceField,
  x: number,
  y: number,
  threshold: number = 0.01
): boolean {
  return getIntensityAt(field, x, y) >= threshold
}

/**
 * Consume resource from field
 * Decreases field intensity based on consumption amount
 *
 * @param field - Resource field
 * @param x - Position X
 * @param y - Position Y
 * @param amount - Amount to consume (0..1)
 * @param worldTime - Current world time
 * @returns Actual amount consumed (may be less if field is depleted)
 *
 * @example
 * const consumed = consumeFrom(waterField, entity.x, entity.y, 0.3, world.worldTime)
 * entity.satisfyNeed('water', consumed)
 */
export function consumeFrom(
  field: ResourceField,
  x: number,
  y: number,
  amount: number,
  worldTime: number
): number {
  const intensityAtPos = getIntensityAt(field, x, y)

  if (intensityAtPos <= 0) return 0

  // Actual consumption is limited by available intensity
  const actualConsumption = Math.min(amount, intensityAtPos)

  // Deplete field intensity
  field.intensity = Math.max(0, field.intensity - actualConsumption)
  field.lastUpdated = worldTime
  field.totalConsumed = (field.totalConsumed ?? 0) + actualConsumption

  return actualConsumption
}

/**
 * Update resource field (depletion and regeneration)
 * Should be called during world tick
 *
 * @param field - Resource field
 * @param dt - Delta time in seconds
 * @param worldTime - Current world time
 *
 * @example
 * for (const field of world.resourceFields.values()) {
 *   updateResourceField(field, dt, world.worldTime)
 * }
 */
export function updateResourceField(
  field: ResourceField,
  dt: number,
  worldTime: number
): void {
  const maxIntensity = field.maxIntensity ?? 1.0

  // Natural depletion
  if (field.depletionRate && field.depletionRate > 0) {
    field.intensity = Math.max(0, field.intensity - field.depletionRate * dt)
  }

  // Natural regeneration
  if (field.regenerationRate && field.regenerationRate > 0) {
    field.intensity = Math.min(maxIntensity, field.intensity + field.regenerationRate * dt)
  }

  field.lastUpdated = worldTime
}

/**
 * Find nearest resource field to a position
 *
 * @param fields - Array of resource fields
 * @param x - Position X
 * @param y - Position Y
 * @param resourceType - Filter by resource type (optional)
 * @returns Nearest field or undefined if none found
 *
 * @example
 * const nearestWater = findNearestField(
 *   Array.from(world.resourceFields.values()),
 *   entity.x,
 *   entity.y,
 *   'water'
 * )
 */
export function findNearestField(
  fields: ResourceField[],
  x: number,
  y: number,
  resourceType?: string
): ResourceField | undefined {
  let nearest: ResourceField | undefined
  let minDistance = Infinity

  for (const field of fields) {
    // Filter by resource type if specified
    if (resourceType && field.resourceType !== resourceType) continue

    // Skip depleted fields
    if (field.intensity <= 0) continue

    // Calculate distance to field center
    let fx = 0
    let fy = 0

    if (field.position) {
      fx = field.position.x
      fy = field.position.y
    } else if (field.area) {
      fx = field.area.x + field.area.width / 2
      fy = field.area.y + field.area.height / 2
    } else if (field.gradient) {
      fx = field.gradient.center.x
      fy = field.gradient.center.y
    }

    const dx = x - fx
    const dy = y - fy
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minDistance) {
      minDistance = distance
      nearest = field
    }
  }

  return nearest
}
