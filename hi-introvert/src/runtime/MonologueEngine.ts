/**
 * MonologueEngine - ทำให้ companion พูดคนเดียวอย่างเป็นธรรมชาติเมื่อเงียบ
 *
 * คอนเซปต์: ใช้ lexicon + memories + อารมณ์ ปั้นประโยคสั้นๆ 1 บรรทัด
 * ไม่พึ่ง LLM เป็นหลัก แต่ถ้ามี adapter ก็สามารถต่อได้จาก ChatRuntime ชั้นบน
 */

import type { World, Entity, LexiconEntry, Memory } from '@v1b3x0r/mds-core'

export interface MonologueConfig {
  enabled?: boolean
  idleThresholdMs?: number          // เงียบเกินเท่านี้ค่อยลองพูด
  checkIntervalMs?: number          // ควรเรียกตรวจทุกกี่ ms (ภายนอกจัด interval)
}

export class MonologueEngine {
  private world: World
  private companion: Entity
  private getEmotion: () => { valence: number; arousal: number }
  private getMemories: () => Memory[]
  private enabled: boolean
  private idleThresholdMs: number

  constructor(opts: {
    world: World
    companion: Entity
    getEmotion: () => { valence: number; arousal: number }
    getMemories: () => Memory[]
    config?: MonologueConfig
  }) {
    this.world = opts.world
    this.companion = opts.companion
    this.getEmotion = opts.getEmotion
    this.getMemories = opts.getMemories
    this.enabled = opts.config?.enabled ?? true
    this.idleThresholdMs = opts.config?.idleThresholdMs ?? 30000
  }

  setEnabled(on: boolean): void { this.enabled = on }
  isEnabled(): boolean { return this.enabled }

  /**
   * เรียกเมื่อถึงเวลาตรวจ ถ้าเงียบเกิน threshold จะสุ่มพูดเบาๆ
   * คืนค่า true ถ้าได้พูดจริง
   */
  maybeSpeak(now: number, lastMessageTime: number): boolean {
    if (!this.enabled) return false
    if (!this.world || !this.companion) return false

    const silence = now - (lastMessageTime || 0)
    if (silence < this.idleThresholdMs) return false

    const emotion = this.getEmotion()
    // ความน่าจะเป็นผูกกับอารมณ์ (เศร้า/เหงา พูดเบาๆ มากขึ้นนิดหน่อย)
    const baseP = 0.35
    const valenceFactor = 0.2 * (0.5 - (emotion.valence ?? 0)) // ค่า valence ต่ำ → เพิ่มโอกาสเล็กน้อย
    const arousalFactor = 0.1 * (emotion.arousal ?? 0)          // ตื่นตัวมากขึ้น → เพิ่มโอกาสนิดหน่อย
    const probability = Math.min(0.9, Math.max(0.05, baseP + valenceFactor + arousalFactor))

    if (Math.random() > probability) return false

    const text = this.generateMonologueText()
    if (!text) return false

    this.world.recordSpeech(this.companion, text)
    return true
  }

  private generateMonologueText(): string | null {
    // 1) ใช้ lexicon คำที่เพิ่งเกิด
    const terms = (this.world.lexicon?.getRecent(5) ?? []).map((e: LexiconEntry) => e.term)

    // 2) ดึงคำจาก memories ล่าสุด
    const mems = (this.getMemories() || []).slice(-10)
    const memWords: string[] = []
    for (const m of mems) {
      const c = (m as any).content
      const t = (c?.text || c?.message) as string | undefined
      if (t) {
        memWords.push(...this.pickKeywords(t))
      }
    }

    // รวม pool คำ แล้วเลือก 1-3 คำมาร้อยเป็นวลีสั้น ๆ
    const pool = [...terms, ...memWords].filter(Boolean)
    if (pool.length === 0) {
      const fallback = ['อืม...', 'เงียบดี', 'hmm...', 'quiet', 'คิดอยู่...']
      return fallback[Math.floor(Math.random() * fallback.length)]
    }

    const n = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1))
    const picked = this.sample(pool, n)
    // รูปประโยคสั้น ๆ
    const patterns = [
      `${picked.join(' ')}`,
      `... ${picked.join(' ')}`,
      `${picked[0]} ...`,
      `คิดถึง ${picked[0]}`
    ]
    return patterns[Math.floor(Math.random() * patterns.length)]
  }

  private pickKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 3)
      .slice(0, 3)
  }

  private sample<T>(arr: T[], k: number): T[] {
    const res: T[] = []
    const used = new Set<number>()
    while (res.length < k && used.size < arr.length) {
      const i = Math.floor(Math.random() * arr.length)
      if (!used.has(i)) { used.add(i); res.push(arr[i]) }
    }
    return res
  }
}

