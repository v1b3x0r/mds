/**
 * WorldLogger - lightweight log buffer for semantic-first worlds.
 * Keeps recent events in memory for UI/debug without Node dependencies.
 */

export interface WorldLogEntry {
  timestamp: number
  type: string
  text?: string
  data?: Record<string, unknown>
}

export class WorldLogger {
  private entries: WorldLogEntry[] = []
  private capacity: number

  constructor(capacity: number = 1000) {
    this.capacity = Math.max(10, capacity)
  }

  push(entry: Omit<WorldLogEntry, 'timestamp'> & Partial<Pick<WorldLogEntry, 'timestamp'>>): void {
    const item: WorldLogEntry = {
      timestamp: entry.timestamp ?? Date.now(),
      type: entry.type,
      text: entry.text,
      data: entry.data
    }

    this.entries.push(item)
    if (this.entries.length > this.capacity) {
      const overflow = this.entries.length - this.capacity
      this.entries.splice(0, overflow)
    }
  }

  tail(count = 40): WorldLogEntry[] {
    if (count <= 0) return []
    return this.entries.slice(-count)
  }

  tailText(count = 40): string[] {
    return this.tail(count).map(entry => entry.text ?? this.format(entry))
  }

  clear(): void {
    this.entries = []
  }

  private format(entry: WorldLogEntry): string {
    const time = new Date(entry.timestamp).toISOString()
    if (entry.data) {
      try {
        return `[${time}] ${entry.type}: ${JSON.stringify(entry.data)}`
      } catch {
        return `[${time}] ${entry.type}`
      }
    }
    return `[${time}] ${entry.type}`
  }
}
