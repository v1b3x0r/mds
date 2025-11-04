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

export type WorldLogListener = (entry: WorldLogEntry) => void

export class WorldLogger {
  private entries: WorldLogEntry[] = []
  private capacity: number
  private listeners = new Set<WorldLogListener>()

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

    if (this.listeners.size > 0) {
      for (const listener of this.listeners) {
        listener(item)
      }
    }
  }

  tail(count = 40): WorldLogEntry[] {
    if (count <= 0) return []
    return this.entries.slice(-count)
  }

  tailText(count = 40): string[] {
    return this.tail(count).map(entry => formatLogEntry(entry))
  }

  clear(): void {
    this.entries = []
  }

  subscribe(listener: WorldLogListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setCapacity(capacity: number): void {
    this.capacity = Math.max(10, capacity)
    if (this.entries.length > this.capacity) {
      this.entries.splice(0, this.entries.length - this.capacity)
    }
  }
}

export function formatLogEntry(entry: WorldLogEntry): string {
  const iso = new Date(entry.timestamp).toISOString()
  const time = iso.split('T')[1]?.replace('Z', '') ?? iso

  switch (entry.type) {
    case 'behavior.say': {
      const speaker = (entry.data?.entity as string | undefined) ?? 'entity'
      const text = entry.data?.text ?? entry.text ?? ''
      const mode = entry.data?.mode ? ` (${entry.data.mode})` : ''
      return `[${time}] ${speaker}${mode}: ${text}`
    }
    case 'utterance': {
      const speaker = (entry.data?.entity as string | undefined) ?? 'entity'
      const text = entry.data?.text ?? entry.text ?? ''
      const mode = entry.data?.mode ? ` (${entry.data.mode})` : ''
      return `[${time}] ${speaker}${mode}: ${text}`
    }
    case 'translation.learn': {
      const source = entry.data?.source ?? entry.data?.original ?? ''
      const lang = entry.data?.lang ?? 'lang'
      const text = entry.data?.text ?? entry.text ?? ''
      return `[${time}] translation → ${lang}: ${text}${source ? ` ← ${source}` : ''}`
    }
    case 'behavior.context':
    case 'context':
      return `[${time}] context: ${safeStringify(entry.data)}`
    default:
      if (entry.text && entry.text.trim().length > 0) {
        return `[${time}] ${entry.text}`
      }
      return `[${time}] ${entry.type}${entry.data ? `: ${safeStringify(entry.data)}` : ''}`
  }
}

function safeStringify(data: Record<string, unknown> | undefined): string {
  if (!data) return ''
  try {
    return JSON.stringify(data)
  } catch {
    return '[unserializable]'
  }
}
