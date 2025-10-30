/**
 * MDS v6.0 - World Lexicon
 * Registry of terms that emerged from entity conversations
 *
 * Design:
 * - World crystallizes repeated phrases into lexicon
 * - Terms have usage tracking + decay
 * - Entities can learn terms by hearing them
 */

/**
 * Single term in world lexicon
 */
export interface LexiconEntry {
  term: string            // The word/phrase (e.g., "sup lol", "あ、hi")
  meaning: string         // Semantic meaning (auto-generated or manual)
  origin: string          // Entity ID who first used it

  // Classification
  category?: string       // "greeting" | "expression" | "concept" | "slang"

  // Usage tracking
  usageCount: number      // How many times used total
  lastUsed: number        // Timestamp of last use
  firstSeen: number       // Timestamp when first detected

  // Semantic metadata
  relatedTerms: string[]  // Similar/related terms
  emotionContext?: {      // Typical emotion when used
    valence: number       // Average valence
    arousal: number       // Average arousal
  }

  // Decay system
  weight: number          // 0-1, decays if not used
  decayRate: number       // How fast it decays per tick
}

/**
 * World's shared vocabulary
 * Terms emerge from conversations and can be learned by entities
 */
export class WorldLexicon {
  private entries: Map<string, LexiconEntry> = new Map()

  /**
   * Add or update term in lexicon
   * @returns {entry, created} - The entry and whether it was newly created
   */
  add(entry: Omit<LexiconEntry, 'weight' | 'decayRate'>): { entry: LexiconEntry, created: boolean } {
    const existing = this.entries.get(entry.term)

    if (existing) {
      // Term exists → increase usage
      existing.usageCount++
      existing.lastUsed = Date.now()
      existing.weight = Math.min(1, existing.weight + 0.1)

      // Update emotion context (rolling average)
      if (entry.emotionContext && existing.emotionContext) {
        const alpha = 0.3  // Weight for new data
        existing.emotionContext.valence =
          alpha * entry.emotionContext.valence +
          (1 - alpha) * existing.emotionContext.valence

        existing.emotionContext.arousal =
          alpha * entry.emotionContext.arousal +
          (1 - alpha) * existing.emotionContext.arousal
      }

      return { entry: existing, created: false }
    } else {
      // New term
      const newEntry: LexiconEntry = {
        ...entry,
        weight: 0.5,        // Start at medium weight
        decayRate: 0.01     // Decay 1% per tick if not used
      }
      this.entries.set(entry.term, newEntry)

      return { entry: newEntry, created: true }
    }
  }

  /**
   * Get specific term
   */
  get(term: string): LexiconEntry | undefined {
    return this.entries.get(term)
  }

  /**
   * Get all terms
   */
  getAll(): LexiconEntry[] {
    return Array.from(this.entries.values())
  }

  /**
   * Get popular terms (usage ≥ threshold)
   */
  getPopular(minUsage: number = 5): LexiconEntry[] {
    return this.getAll()
      .filter(e => e.usageCount >= minUsage)
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * Get terms by category
   */
  getByCategory(category: string): LexiconEntry[] {
    return this.getAll().filter(e => e.category === category)
  }

  /**
   * Get recent terms (added in last N ms)
   */
  getRecent(withinMs: number): LexiconEntry[] {
    const cutoff = Date.now() - withinMs
    return this.getAll()
      .filter(e => e.firstSeen > cutoff)
      .sort((a, b) => b.firstSeen - a.firstSeen)
  }

  /**
   * Decay unused terms
   * Call this every tick
   */
  decay(_deltaMs: number): void {
    const now = Date.now()

    for (const [term, entry] of this.entries.entries()) {
      const timeSinceUse = now - entry.lastUsed

      // Only decay if not used for > 10 seconds
      if (timeSinceUse > 10000) {
        entry.weight *= (1 - entry.decayRate)

        // Forget term if weight too low
        if (entry.weight < 0.01) {
          this.entries.delete(term)
        }
      }
    }
  }

  /**
   * Get total term count
   */
  get size(): number {
    return this.entries.size
  }

  /**
   * Clear all terms
   */
  clear(): void {
    this.entries.clear()
  }

  /**
   * Export lexicon as JSON (for save/load)
   */
  toJSON(): LexiconEntry[] {
    return this.getAll()
  }

  /**
   * Import lexicon from JSON
   */
  fromJSON(entries: LexiconEntry[]): void {
    this.clear()
    for (const entry of entries) {
      this.entries.set(entry.term, entry)
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalTerms: number
    totalUsage: number
    avgWeight: number
    categories: Record<string, number>
  } {
    const all = this.getAll()
    const totalUsage = all.reduce((sum, e) => sum + e.usageCount, 0)
    const avgWeight = all.reduce((sum, e) => sum + e.weight, 0) / all.length || 0

    const categories: Record<string, number> = {}
    for (const entry of all) {
      if (entry.category) {
        categories[entry.category] = (categories[entry.category] || 0) + 1
      }
    }

    return {
      totalTerms: all.length,
      totalUsage,
      avgWeight,
      categories
    }
  }
}
