/**
 * WorldRecorder - บันทึกโลกแบบ NDJSON เพื่อติดตามสิ่งที่เกิดขึ้น
 */

import fs from 'fs'

export interface WorldRecorderConfig {
  path?: string
  enabled?: boolean
}

export class WorldRecorder {
  private path: string
  private enabled: boolean
  private lastFlushedTranscriptSize = 0

  constructor(config: WorldRecorderConfig = {}) {
    this.path = config.path ?? 'sessions/world.log.ndjson'
    this.enabled = config.enabled ?? true
  }

  getPath(): string { return this.path }
  isEnabled(): boolean { return this.enabled }
  setEnabled(on: boolean): void { this.enabled = on }

  private ensureDir(): void {
    const dir = this.path.substring(0, this.path.lastIndexOf('/'))
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  log(entry: Record<string, any>): void {
    if (!this.enabled) return
    try {
      this.ensureDir()
      const line = JSON.stringify({ t: Date.now(), ...entry }) + '\n'
      fs.appendFileSync(this.path, line, 'utf-8')
    } catch (_) {
      // เงียบไว้ ไม่โยนทิ้ง flow
    }
  }

  logAnalytics(data: any): void {
    this.log({ type: 'analytics', data })
  }

  logEvent(name: string, data?: any): void {
    this.log({ type: 'event', name, data })
  }

  logUtterance(speaker: string, text: string, listener?: string, emotion?: any): void {
    this.log({ type: 'utterance', speaker, text, listener, emotion })
  }

  tail(count = 20): string[] {
    if (!fs.existsSync(this.path)) return []
    const data = fs.readFileSync(this.path, 'utf-8')
    const lines = data.split('\n').filter(Boolean)
    return lines.slice(-count)
  }
}

