/**
 * Material Definition System - Manifest Loader
 * Loads .mdm.json manifests from CDN or custom URLs
 */

import type { MaterialManifest } from '../core/types'

/**
 * Default CDN for official @mds materials
 */
const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/@mds/materials/manifests'

/**
 * Load manifest from CDN or custom URL
 */
export async function loadManifest(
  name: string,
  options: { cdn?: string } = {}
): Promise<MaterialManifest> {
  const url = resolveManifestURL(name, options.cdn)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Failed to load manifest "${name}": ${response.status} ${response.statusText}`
      )
    }

    const manifest = await response.json()

    // Validate manifest has required fields
    if (!manifest.name) {
      throw new Error(`Invalid manifest: missing "name" field`)
    }

    return manifest
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load manifest "${name}": ${error.message}`)
    }
    throw error
  }
}

/**
 * Load multiple manifests in parallel
 */
export async function loadManifests(
  names: string[],
  options: { cdn?: string } = {}
): Promise<MaterialManifest[]> {
  return Promise.all(names.map(name => loadManifest(name, options)))
}

/**
 * Resolve material name to manifest URL
 */
function resolveManifestURL(name: string, cdn?: string): string {
  const baseURL = cdn || DEFAULT_CDN

  // Extract material path from scoped name
  // @mds/glass-liquid → glass-liquid
  const materialPath = name.startsWith('@')
    ? name.split('/')[1]
    : name

  // Construct full URL
  // For @mds scope: {cdn}/@mds/{material}.mdm.json
  if (name.startsWith('@mds/')) {
    return `${baseURL}/@mds/${materialPath}.mdm.json`
  }

  // For other scopes or unscoped: {cdn}/{name}.mdm.json
  return `${baseURL}/${name}.mdm.json`
}
