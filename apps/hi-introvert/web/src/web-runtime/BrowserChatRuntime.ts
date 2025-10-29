import { World, type WorldOptions, type Entity } from '@v1b3x0r/mds-core'

type Utterance = { speaker: string; text: string; listener?: string; emotion?: { valence: number; arousal: number } }

export class BrowserChatRuntime {
  world: World
  user!: Entity
  companion!: Entity
  private subs: Array<(utt: Utterance) => void> = []
  private lastTranscriptCount = 0
  private ticker?: number

  constructor(opts?: { companionId?: string }) {
    const options: WorldOptions = {
      features: {
        ontology: true,
        history: true,
        rendering: 'headless',
        linguistics: true
      },
      linguistics: { analyzeEvery: 30, minUsage: 1, maxTranscript: 500 }
    }

    this.world = new World(options)

    const traveler = BASE_TRAVELER
    const companion = BASE_COMPANION

    this.user = this.world.spawn(traveler, { x: 120, y: 160 })
    this.companion = this.world.spawn(companion, { x: 260, y: 160 })

    // simple ticking
    this.ticker = window.setInterval(() => {
      this.world.tick(0.5)
      // flush new transcript
      const t = this.world.transcript?.count ?? 0
      if (t > this.lastTranscriptCount) {
        const news = this.world.transcript?.getAll().slice(this.lastTranscriptCount) ?? []
        this.lastTranscriptCount = t
        news.forEach(utt => this.subs.forEach(cb => cb(utt)))
      }
    }, 500)
  }

  onTranscript(cb: (utt: Utterance) => void): () => void {
    this.subs.push(cb)
    return () => { this.subs = this.subs.filter(x => x !== cb) }
  }

  async send(text: string): Promise<void> {
    // user says
    this.world.broadcastContext({ 'user.message': text })
    this.world.recordSpeech(this.user, text)

    // naive intent detection
    const isGreeting = /hi|hello|สวัสดี|หวัดดี/i.test(text)
    const isQuestion = /\?|อะไร|ทำไม|ยังไง|when|why|how|what|who/i.test(text)

    // try MDM speak first (simple category)
    let says: string | undefined
    try {
      says = this.compainionSpeak(isGreeting ? 'greeting' : isQuestion ? 'question' : 'default')
    } catch {}

    if (!says) {
      // fallback: short, introvert
      const fallbacks = ['อืม...', 'ครับ', 'ค่ะ', 'hmm', '...']
      says = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    }

    this.world.recordSpeech(this.companion, says)
  }

  private compainionSpeak(category?: string): string | undefined {
    // world/entity may have MDM dialogue attached; call speak if available
    const anyCompanion = this.companion as any
    if (typeof anyCompanion.speak === 'function') {
      return anyCompanion.speak(category)
    }
    return undefined
  }

  destroy(): void {
    if (this.ticker) window.clearInterval(this.ticker)
  }
}

// Minimal materials for demo (lean)
const BASE_TRAVELER = {
  essence: 'A traveler who is curious and gentle.',
  languageWeights: { th: 0.6, en: 0.4 },
  behavior: {}
}

const BASE_COMPANION = {
  essence: 'A shy Thai kid who speaks little but listens.',
  nativeLanguage: 'th',
  languageWeights: { th: 0.7, en: 0.3 },
  dialogue: {
    greeting: [
      'สวัสดี', 'หวัดดีครับ', 'hello'
    ],
    question: [
      'อืม... คำถามยากจัง', 'ไม่แน่ใจนะ', 'hmm'
    ],
    default: [
      'อืม...', 'ครับ', 'ค่ะ', 'hmm'
    ]
  },
  behavior: {}
}

