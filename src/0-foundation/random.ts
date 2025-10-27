/**
 * MDS v4.0 - Random Utilities
 * Seeded random number generation for reproducible simulations
 */

/**
 * Simple seeded random number generator (Mulberry32)
 * Returns a function that generates pseudo-random numbers [0, 1)
 */
export function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Simple 1D Perlin-like noise (for entropy drift)
 * Returns value in [-1, 1] range
 */
export function noise1D(x: number): number {
  const i = Math.floor(x)
  const f = x - i
  const fade = f * f * (3 - 2 * f)  // smoothstep

  // Hash function for pseudo-random values
  const hash = (n: number): number => {
    const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453
    return (s - Math.floor(s)) * 2 - 1
  }

  return hash(i) * (1 - fade) + hash(i + 1) * fade
}
