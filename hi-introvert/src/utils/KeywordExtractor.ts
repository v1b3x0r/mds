/**
 * Keyword Extractor
 *
 * Simple topic/keyword extraction for memory tagging.
 * Uses frequency-based scoring with stopword filtering.
 *
 * Design:
 * - No external NLP libraries (keep it lightweight)
 * - Multilingual support (Thai + English)
 * - TF-IDF-like scoring
 */

export class KeywordExtractor {
  private static thaiStopwords = new Set([
    // Thai common words
    'ที่', 'ใน', 'ของ', 'และ', 'ครับ', 'ค่ะ', 'คะ', 'นะ', 'จ้ะ', 'จา',
    'เป็น', 'มี', 'ได้', 'ไม่', 'แล้ว', 'จะ', 'ว่า', 'ด้วย', 'ก็', 'จาก',
    'ให้', 'กับ', 'อยู่', 'เพื่อ', 'ถ้า', 'แต่', 'ยัง', 'หรือ', 'ซึ่ง', 'ตัว',
    'การ', 'เลย', 'มาก', 'นี้', 'นั้น', 'อย่าง', 'ถึง', 'เท่า', 'แบบ', 'ช่วง',
    'ผม', 'คุณ', 'เขา', 'เธอ', 'เรา', 'พวก', 'ทุก', 'บาง', 'หนึ่ง', 'สอง',
    'กัน', 'ก่อน', 'หลัง', 'อีก', 'ขึ้น', 'ลง', 'ออก', 'เข้า'
  ])

  private static englishStopwords = new Set([
    // English common words
    'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'can', 'could', 'may', 'might', 'must', 'shall',
    'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else',
    'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'this', 'that', 'these', 'those',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by',
    'about', 'as', 'into', 'through', 'during', 'before', 'after',
    'very', 'too', 'so', 'just', 'only', 'also', 'even',
    'what', 'when', 'where', 'who', 'which', 'why', 'how'
  ])

  /**
   * Extract keywords from text
   *
   * @param text - Input text (Thai, English, or mixed)
   * @param limit - Max keywords to return (default: 10)
   * @param minLength - Min word length to consider (default: 2)
   * @returns Array of keywords, sorted by importance
   */
  static extract(text: string, limit: number = 10, minLength: number = 2): string[] {
    if (!text || text.trim().length === 0) return []

    // 1. Normalize text
    const normalized = text
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, ' ')  // Keep Thai, English, numbers
      .replace(/\s+/g, ' ')
      .trim()

    // 2. Tokenize (split by space)
    const words = normalized.split(' ').filter(w => w.length >= minLength)

    if (words.length === 0) return []

    // 3. Filter stopwords
    const filtered = words.filter(word =>
      !this.thaiStopwords.has(word) && !this.englishStopwords.has(word)
    )

    // 4. Count word frequency
    const frequency = new Map<string, number>()
    for (const word of filtered) {
      frequency.set(word, (frequency.get(word) || 0) + 1)
    }

    // 5. Calculate TF-IDF-like scores
    // Higher frequency = more important
    // Longer words = slightly more important (nouns tend to be longer)
    const scored = Array.from(frequency.entries()).map(([word, count]) => ({
      word,
      score: count * (1 + word.length * 0.1)  // Length bonus
    }))

    // 6. Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    // 7. Return top N keywords
    return scored.slice(0, limit).map(item => item.word)
  }

  /**
   * Extract keywords from multiple texts (union)
   * Useful for building context from multiple memories
   */
  static extractFromMultiple(texts: string[], limit: number = 10): string[] {
    const allKeywords = new Set<string>()

    for (const text of texts) {
      const keywords = this.extract(text, limit)
      keywords.forEach(kw => allKeywords.add(kw))
    }

    return Array.from(allKeywords).slice(0, limit)
  }

  /**
   * Check if two keyword sets overlap
   * Returns overlap ratio (0-1)
   */
  static overlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0

    const set1 = new Set(keywords1)
    const set2 = new Set(keywords2)

    const intersection = Array.from(set1).filter(kw => set2.has(kw))
    const union = new Set([...keywords1, ...keywords2])

    return intersection.length / union.size  // Jaccard similarity
  }

  /**
   * Find most relevant keyword from a list
   * Used for topic identification
   */
  static findMostRelevant(query: string, candidateKeywords: string[][]): string[] {
    const queryKeywords = this.extract(query, 5)

    let bestMatch: string[] = []
    let bestScore = 0

    for (const candidate of candidateKeywords) {
      const score = this.overlap(queryKeywords, candidate)
      if (score > bestScore) {
        bestScore = score
        bestMatch = candidate
      }
    }

    return bestMatch
  }
}
