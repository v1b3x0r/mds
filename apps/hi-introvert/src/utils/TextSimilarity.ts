/**
 * Text Similarity Utilities
 *
 * Lightweight text comparison for duplicate detection.
 * No external dependencies - pure TypeScript implementations.
 *
 * Supports:
 * - Jaccard similarity (set-based)
 * - Levenshtein distance (edit distance)
 * - Combined score (hybrid approach)
 */

export class TextSimilarity {
  /**
   * Jaccard Similarity (set-based comparison)
   *
   * Measures overlap between word sets.
   * Good for: topic similarity, keyword matching
   *
   * @param a - First text
   * @param b - Second text
   * @returns Similarity score (0-1), 1 = identical
   *
   * @example
   * jaccard("I like pizza", "I love pizza")  // → 0.75 (3/4 words match)
   */
  static jaccard(a: string, b: string): number {
    if (!a || !b) return 0
    if (a === b) return 1

    // Normalize and tokenize
    const wordsA = new Set(a.toLowerCase().split(/\s+/))
    const wordsB = new Set(b.toLowerCase().split(/\s+/))

    // Calculate intersection and union
    const intersection = new Set(
      [...wordsA].filter(word => wordsB.has(word))
    )
    const union = new Set([...wordsA, ...wordsB])

    return intersection.size / union.size
  }

  /**
   * Levenshtein Distance (edit distance)
   *
   * Counts minimum edits needed to transform one string to another.
   * Good for: typo detection, exact matching
   *
   * @param a - First text
   * @param b - Second text
   * @returns Similarity score (0-1), 1 = identical
   *
   * @example
   * levenshtein("pizza", "piza")  // → 0.8 (1 edit, 80% similar)
   */
  static levenshtein(a: string, b: string): number {
    if (!a || !b) return 0
    if (a === b) return 1

    const lenA = a.length
    const lenB = b.length

    // Create DP table
    const dp: number[][] = Array(lenA + 1)
      .fill(null)
      .map(() => Array(lenB + 1).fill(0))

    // Initialize base cases
    for (let i = 0; i <= lenA; i++) dp[i][0] = i
    for (let j = 0; j <= lenB; j++) dp[0][j] = j

    // Fill DP table
    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // Deletion
            dp[i][j - 1] + 1,     // Insertion
            dp[i - 1][j - 1] + 1  // Substitution
          )
        }
      }
    }

    const distance = dp[lenA][lenB]
    const maxLen = Math.max(lenA, lenB)

    // Convert distance to similarity (0-1)
    return 1 - distance / maxLen
  }

  /**
   * Combined Similarity (hybrid approach)
   *
   * Weighted average of Jaccard and Levenshtein.
   * - Jaccard weight: 0.7 (emphasize semantic similarity)
   * - Levenshtein weight: 0.3 (catch exact matches/typos)
   *
   * @param a - First text
   * @param b - Second text
   * @returns Similarity score (0-1), 1 = identical
   *
   * @example
   * combined("I like pizza", "I love pizza")  // → 0.79
   */
  static combined(a: string, b: string): number {
    if (!a || !b) return 0
    if (a === b) return 1

    const jaccardScore = this.jaccard(a, b)
    const levenshteinScore = this.levenshtein(a, b)

    // Weighted average (Jaccard more important for semantic similarity)
    return jaccardScore * 0.7 + levenshteinScore * 0.3
  }

  /**
   * Cosine Similarity (vector-based, simple version)
   *
   * Character n-gram based cosine similarity.
   * Good for: multilingual text (Thai + English)
   *
   * @param a - First text
   * @param b - Second text
   * @param n - N-gram size (default: 2)
   * @returns Similarity score (0-1), 1 = identical
   */
  static cosine(a: string, b: string, n: number = 2): number {
    if (!a || !b) return 0
    if (a === b) return 1

    // Generate n-grams
    const ngramsA = this.generateNgrams(a.toLowerCase(), n)
    const ngramsB = this.generateNgrams(b.toLowerCase(), n)

    // Count n-gram frequencies
    const freqA = new Map<string, number>()
    const freqB = new Map<string, number>()

    for (const ngram of ngramsA) {
      freqA.set(ngram, (freqA.get(ngram) || 0) + 1)
    }

    for (const ngram of ngramsB) {
      freqB.set(ngram, (freqB.get(ngram) || 0) + 1)
    }

    // Calculate cosine similarity
    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    // Dot product
    for (const [ngram, countA] of freqA) {
      const countB = freqB.get(ngram) || 0
      dotProduct += countA * countB
    }

    // Magnitudes
    for (const count of freqA.values()) {
      magnitudeA += count * count
    }
    for (const count of freqB.values()) {
      magnitudeB += count * count
    }

    const magnitude = Math.sqrt(magnitudeA * magnitudeB)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  /**
   * Generate character n-grams
   */
  private static generateNgrams(text: string, n: number): string[] {
    const ngrams: string[] = []
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.push(text.slice(i, i + n))
    }
    return ngrams
  }

  /**
   * Check if two texts are duplicates
   *
   * @param a - First text
   * @param b - Second text
   * @param threshold - Similarity threshold (default: 0.9)
   * @returns True if duplicate (similarity ≥ threshold)
   */
  static isDuplicate(a: string, b: string, threshold: number = 0.9): boolean {
    return this.combined(a, b) >= threshold
  }

  /**
   * Find most similar text from a list
   *
   * @param query - Query text
   * @param candidates - List of candidate texts
   * @param threshold - Minimum similarity threshold (default: 0.5)
   * @returns Most similar text and its score, or null if none above threshold
   */
  static findMostSimilar(
    query: string,
    candidates: string[],
    threshold: number = 0.5
  ): { text: string; score: number } | null {
    let bestMatch: string | null = null
    let bestScore = threshold

    for (const candidate of candidates) {
      const score = this.combined(query, candidate)
      if (score > bestScore) {
        bestScore = score
        bestMatch = candidate
      }
    }

    return bestMatch ? { text: bestMatch, score: bestScore } : null
  }
}
