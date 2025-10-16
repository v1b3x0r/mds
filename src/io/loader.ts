/**
 * MDS v4.0 - Material Loader
 * Load material definitions from JSON manifests
 */

import type { MdsMaterial } from '../schema/mdspec'

/**
 * Load a material from a JSON manifest file
 * @param path - Relative or absolute path to .mdspec.json file
 * @returns Parsed material definition
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
