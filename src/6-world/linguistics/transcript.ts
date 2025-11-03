/**
 * MDS v6.0 - Transcript Buffer
 * Records all entity utterances for linguistic analysis
 *
 * Design:
 * - World listens to entity speech
 * - Stores in circular buffer (max 1000 utterances)
 * - Provides query methods for crystallizer
 */

/**
 * Single utterance in conversation
 */
export interface Utterance {
  id: string              // Unique ID
  speaker: string         // Entity ID
  text: string            // What was said
  listener?: string       // Target entity ID (if direct message)
  mode?: string           // Speech mode (emoji|proto|short|auto-resolved)
  timestamp: number       // When said (Date.now())
  emotion: {
    valence: number       // -1 to 1
    arousal: number       // 0 to 1
  }
}

/**
 * Circular buffer for conversation transcript
 * Keeps last N utterances for analysis
 */
export class TranscriptBuffer {
  private utterances: Utterance[] = []
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
  }

  /**
   * Add new utterance to buffer
   */
  add(utterance: Utterance): void {
    this.utterances.push(utterance)

    // Maintain buffer size (circular)
    if (this.utterances.length > this.maxSize) {
      this.utterances.shift()
    }
  }

  /**
   * Get last N utterances
   */
  getRecent(count: number): Utterance[] {
    return this.utterances.slice(-count)
  }

  /**
   * Get all utterances since timestamp
   */
  getSince(timestamp: number): Utterance[] {
    return this.utterances.filter(u => u.timestamp > timestamp)
  }

  /**
   * Get all utterances by speaker
   */
  getBySpeaker(speakerId: string): Utterance[] {
    return this.utterances.filter(u => u.speaker === speakerId)
  }

  /**
   * Get all utterances between two entities
   */
  getConversation(speaker1: string, speaker2: string): Utterance[] {
    return this.utterances.filter(
      u =>
        (u.speaker === speaker1 && u.listener === speaker2) ||
        (u.speaker === speaker2 && u.listener === speaker1)
    )
  }

  /**
   * Get total utterance count
   */
  get count(): number {
    return this.utterances.length
  }

  /**
   * Clear all utterances
   */
  clear(): void {
    this.utterances = []
  }

  /**
   * Get all utterances (for export/debug)
   */
  getAll(): Utterance[] {
    return [...this.utterances]
  }
}
