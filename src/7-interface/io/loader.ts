/**
 * MDS v5.0 - Material Loader
 * Load material definitions from .mdm files (Material Definition)
 */

import type { MdsMaterial } from '../../schema/mdspec'

/**
 * Load a material from a .mdm file (Material Definition)
 * @param path - Relative or absolute path to .mdm file
 * @returns Parsed material definition
 *
 * @example
 * const material = await loadMaterial('./paper.shy.mdm')
 */
export async function loadMaterial(path: string): Promise<MdsMaterial> {
  const res = await fetch(path)

  if (!res.ok) {
    throw new Error(`Failed to load material: ${path} (${res.status})`)
  }

  const json = await res.json()
  return json as MdsMaterial
}

/**
 * Load multiple materials in parallel
 * @param paths - Array of paths to load
 * @returns Array of material definitions
 */
export async function loadMaterials(paths: string[]): Promise<MdsMaterial[]> {
  return Promise.all(paths.map(loadMaterial))
}
