/**
 * MDS v4.0 - Math Utilities
 * Core mathematical functions for info-physics calculations
 */

/**
 * Clamp value between min and max
 */
export const clamp = (v: number, lo = 0, hi = 1): number =>
  Math.max(lo, Math.min(hi, v))

/**
 * Calculate Euclidean distance between two points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1)

/**
 * Calculate similarity between two values (0..1 range)
 * Returns 1 for identical values, 0 for maximum difference
 */
export const similarity = (a: number, b: number): number =>
  1 - Math.abs(a - b)

/**
 * Linear interpolation between two values
 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t

/**
 * Random float between min and max
 */
export const randRange = (min: number, max: number): number =>
  min + Math.random() * (max - min)

/**
 * Random integer between min (inclusive) and max (exclusive)
 */
export const randInt = (min: number, max: number): number =>
  Math.floor(randRange(min, max))
