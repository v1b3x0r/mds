/**
 * Companion Loader
 *
 * Discovers and loads .mdm companion files from entities/ directory
 * Supports selection via CLI args or returns default
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface CompanionMetadata {
  id: string           // e.g. "hi_introvert" or "orz-archivist"
  filename: string     // e.g. "entity.companion.hi_introvert.mdm"
  path: string         // Full path to file
  material: any        // Parsed JSON content
  essence: string      // Short description from essence field
}

export class CompanionLoader {
  private companions: Map<string, CompanionMetadata> = new Map()
  private entitiesDir: string

  constructor() {
    // Try production path first (dist/../entities), fallback to dev (src/../../entities)
    this.entitiesDir = path.join(__dirname, '../entities')
    if (!fs.existsSync(this.entitiesDir)) {
      this.entitiesDir = path.join(__dirname, '../../entities')
    }

    this.discoverCompanions()
  }

  /**
   * Scan entities/ directory for companion .mdm files
   * Pattern: entity.companion.*.mdm
   */
  private discoverCompanions(): void {
    if (!fs.existsSync(this.entitiesDir)) {
      throw new Error(`Entities directory not found: ${this.entitiesDir}`)
    }

    const files = fs.readdirSync(this.entitiesDir)
    const companionFiles = files.filter(f =>
      f.startsWith('entity.companion.') && f.endsWith('.mdm')
    )

    for (const filename of companionFiles) {
      try {
        const fullPath = path.join(this.entitiesDir, filename)
        const material = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))

        // Extract ID from filename: entity.companion.{ID}.mdm
        const id = filename.replace('entity.companion.', '').replace('.mdm', '')

        // Extract essence for display
        const essence = typeof material.essence === 'string'
          ? material.essence
          : material.essence?.en || material.essence?.th || 'Unknown companion'

        this.companions.set(id, {
          id,
          filename,
          path: fullPath,
          material,
          essence: essence.substring(0, 80) // Truncate for display
        })
      } catch (error) {
        console.warn(`Failed to load companion ${filename}:`, error)
      }
    }

    if (this.companions.size === 0) {
      throw new Error('No companion .mdm files found in entities/')
    }
  }

  /**
   * Get companion by ID
   * @param id - Companion ID (e.g. "hi_introvert", "orz-archivist")
   * @returns Companion metadata or undefined
   */
  get(id: string): CompanionMetadata | undefined {
    return this.companions.get(id)
  }

  /**
   * Get default companion (first one alphabetically)
   */
  getDefault(): CompanionMetadata {
    const ids = Array.from(this.companions.keys()).sort()
    const defaultId = ids[0]
    return this.companions.get(defaultId)!
  }

  /**
   * List all available companions
   */
  list(): CompanionMetadata[] {
    return Array.from(this.companions.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    )
  }

  /**
   * Get companion by ID or return default
   * @param id - Optional companion ID
   * @returns Companion metadata
   */
  getOrDefault(id?: string): CompanionMetadata {
    if (!id) return this.getDefault()

    const companion = this.get(id)
    if (!companion) {
      const available = this.list().map(c => c.id).join(', ')
      throw new Error(
        `Companion "${id}" not found. Available: ${available}`
      )
    }

    return companion
  }

  /**
   * Print available companions to console
   */
  printList(): void {
    console.log('\n📚 Available Companions:\n')
    for (const companion of this.list()) {
      const isDefault = companion.id === this.getDefault().id
      const marker = isDefault ? '✓ (default)' : ' '
      console.log(`  ${marker} ${companion.id}`)
      console.log(`     "${companion.essence}"`)
      console.log()
    }
  }
}
