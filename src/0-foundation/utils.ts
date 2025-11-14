/**
 * Material Definition System - Utility Functions
 */

/**
 * Deep merge two objects (used for material inheritance)
 * Later values override earlier ones
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Array<Partial<T> | Record<string, any>>
): T {
  if (!sources.length) return target

  const result = { ...target } as any

  for (const source of sources) {
    if (!source) continue

    for (const key in source) {
      const sourceValue = (source as any)[key]
      const targetValue = result[key]

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        // Recursively merge objects
        result[key] = deepMerge(targetValue, sourceValue)
      } else if (sourceValue !== undefined) {
        // Override with source value
        result[key] = sourceValue
      }
    }
  }

  return result as T
}

/**
 * Check if value is a plain object (not array, null, etc)
 */
function isPlainObject(value: any): value is Record<string, any> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

/**
 * Parse transform property to extract translate values
 */
export function parseTransform(transform: string): { x: number; y: number } {
  if (transform === 'none' || !transform) {
    return { x: 0, y: 0 }
  }

  // Match translate(x, y) or translate(xpx, ypx)
  const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
  if (!match) return { x: 0, y: 0 }

  return {
    x: parseFloat(match[1]) || 0,
    y: parseFloat(match[2]) || 0
  }
}

/**
 * Extract blur value from backdrop-filter string
 */
export function extractBlurValue(backdropFilter: string): string | null {
  if (!backdropFilter) return null

  const match = backdropFilter.match(/blur\(([^)]+)\)/)
  return match ? match[1] : null
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * Check if element has pseudo-element style already
 */
export function hasPseudoStyle(element: HTMLElement, pseudo: string): boolean {
  const styles = getComputedStyle(element, pseudo)
  return styles.content !== 'none' && styles.content !== ''
}

/**
 * Deep clone object using structuredClone (with polyfill for older environments)
 * Much faster than JSON.parse(JSON.stringify()) and handles more types
 */
export function deepClone<T>(value: T): T {
  // Use native structuredClone if available (fastest)
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  // Fallback: Manual deep clone (faster than JSON.parse/stringify for small objects)
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => deepClone(item)) as any
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as any
  }

  if (value instanceof Map) {
    return new Map(Array.from(value.entries()).map(([k, v]) => [k, deepClone(v)])) as any
  }

  if (value instanceof Set) {
    return new Set(Array.from(value).map(item => deepClone(item))) as any
  }

  // Plain object
  const cloned: any = {}
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      cloned[key] = deepClone((value as any)[key])
    }
  }
  return cloned
}
