import blessed from 'blessed'
import type { Widgets } from 'blessed'
import { WorldSession } from '../../src/session/WorldSession.js'
import type { Message } from '../../src/types/index.js'
import type { EmotionalState } from '@v1b3x0r/mds-core'

/**
 * Mock BlessedApp for testing
 * Simulates user interactions without actual terminal rendering
 */
export class BlessedAppMock {
  screen: Widgets.Screen
  chatBox: Widgets.BoxElement
  inputBox: Widgets.TextboxElement
  statusBar: Widgets.BoxElement

  session: WorldSession
  messages: Message[] = []

  // Options
  options: {
    llm?: boolean
    mockLLMError?: boolean
    enableClipboardSensor?: boolean
    sensors?: {
      time?: boolean
      weather?: boolean
      spotify?: boolean
      github?: boolean
    }
  }

  constructor(options: BlessedAppMock['options'] = {}) {
    this.options = options

    // Initialize session (with or without LLM)
    this.session = new WorldSession()

    // Create mock screen (headless)
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'hi-introvert-test',
      fullUnicode: true,
      output: process.stdout,
      input: process.stdin,
      terminal: 'xterm-256color',
      fastCSR: true,
      warnings: false
    })

    // Create mock components
    this.chatBox = blessed.box({
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      tags: true
    })

    this.inputBox = blessed.textbox({
      inputOnFocus: true,
      keys: true
    })

    this.statusBar = blessed.box({
      tags: true
    })

    this.screen.append(this.chatBox)
    this.screen.append(this.inputBox)
    this.screen.append(this.statusBar)
  }

  /**
   * Start the app (simulated)
   */
  async start(): Promise<void> {
    // Load session
    const restored = this.session.loadSession()

    // Get greeting
    const entityInfo = this.session.getEntityInfo()
    if (entityInfo) {
      const greeting = this.session.getGreeting()

      this.addMessage({
        type: 'entity',
        sender: entityInfo.name,
        text: greeting,
        emotion: entityInfo.entity.emotion,
        timestamp: Date.now()
      })
    }

    this.updateStatusBar()
  }

  /**
   * Simulate typing a message
   */
  async typeMessage(text: string): Promise<void> {
    // Add user message
    this.addMessage({
      type: 'user',
      sender: 'you',
      text,
      timestamp: Date.now()
    })

    // Get entity response
    try {
      const response = await this.session.handleUserMessage(text)

      this.addMessage({
        type: 'entity',
        sender: response.name,
        text: response.response,
        emotion: response.emotion,
        timestamp: Date.now()
      })

      this.updateStatusBar()
    } catch (error) {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now()
      })
    }
  }

  /**
   * Simulate a command
   */
  async command(cmd: string): Promise<void> {
    const [command, ...args] = cmd.slice(1).split(' ')

    switch (command) {
      case 'help':
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: 'commands:\n  /status\n  /growth\n  /spawn\n  /save\n  /load\n  /clear\n  /quit',
          timestamp: Date.now()
        })
        break

      case 'status':
        const statusText = this.session.getStatusSummary()
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: statusText,
          timestamp: Date.now()
        })
        break

      case 'growth':
        const growthText = this.session.getGrowthSummary()
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: growthText,
          timestamp: Date.now()
        })
        break

      case 'save':
        const filename = args[0] || 'test-session.json'
        this.session.saveSession(filename)
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: `Session saved to ${filename}`,
          timestamp: Date.now()
        })
        break

      case 'load':
        const loadFile = args[0] || 'test-session.json'
        try {
          this.session.loadSession(loadFile)
          this.addMessage({
            type: 'system',
            sender: 'system',
            text: `Session loaded from ${loadFile}`,
            timestamp: Date.now()
          })
        } catch (error) {
          this.addMessage({
            type: 'system',
            sender: 'system',
            text: `Failed to load: ${error}`,
            timestamp: Date.now()
          })
        }
        break

      case 'clear':
        this.messages = []
        this.chatBox.setContent('')
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: 'Chat history cleared',
          timestamp: Date.now()
        })
        break

      default:
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: `Unknown command: ${command}`,
          timestamp: Date.now()
        })
    }
  }

  /**
   * Wait for response (with timeout)
   */
  async waitForResponse(timeout: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.min(timeout, 100)) // Mock: instant in tests
    })
  }

  /**
   * Get last message text
   */
  getLastMessage(): string {
    const lastEntity = this.messages.filter(m => m.type === 'entity').pop()
    return lastEntity?.text || ''
  }

  /**
   * Get last system message
   */
  getLastSystemMessage(): string {
    const lastSystem = this.messages.filter(m => m.type === 'system').pop()
    return lastSystem?.text || ''
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.messages.length
  }

  /**
   * Send key event (for testing scrolling, etc.)
   */
  sendKey(key: string): void {
    // Simulate key press
    this.chatBox.emit('keypress', null, { name: key, full: key })
  }

  /**
   * Restart app (simulate closing and reopening)
   */
  async restart(): Promise<void> {
    this.destroy()

    // Reinitialize
    this.session = new WorldSession()
    this.messages = []

    await this.start()
  }

  /**
   * Destroy app
   */
  destroy(): void {
    if (!this.screen.destroyed) {
      this.screen.destroy()
    }
  }

  /**
   * Add message to chat
   */
  private addMessage(message: Message): void {
    this.messages.push(message)

    const timestamp = new Date(message.timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })

    let line = ''

    if (message.type === 'user') {
      line = `[${timestamp}] you: ${message.text}`
    } else if (message.type === 'entity') {
      const emotion = message.emotion
        ? ` [${message.emotion.valence.toFixed(2)}]`
        : ''
      line = `[${timestamp}] ${message.sender}: ${message.text}${emotion}`
    } else if (message.type === 'system') {
      line = `[${timestamp}] ${message.text}`
    }

    this.chatBox.pushLine(line)
    this.chatBox.setScrollPerc(100)
  }

  /**
   * Update status bar
   */
  private updateStatusBar(): void {
    const companionEmotion = this.session.companionEntity.entity.emotion.valence.toFixed(2)
    const travelerEmotion = this.session.impersonatedEntity.entity.emotion.valence.toFixed(2)
    const memoryCount = this.session.companionEntity.entity.memory?.memories?.length || 0

    this.statusBar.setContent(
      `traveler (YOU): ${travelerEmotion} | ` +
      `companion: ${companionEmotion} | ` +
      `memories: ${memoryCount}`
    )
  }

  // ============ Sensor Mocking Methods ============

  /**
   * Mock clipboard content
   */
  mockClipboard(content: string): void {
    this.session.world.broadcastEvent('clipboard_update', {
      content,
      timestamp: Date.now()
    })
  }

  /**
   * Mock Spotify now playing
   */
  mockSpotify(data: { track: string; artist: string; mood: string }): void {
    this.session.world.broadcastEvent('spotify_update', {
      ...data,
      timestamp: Date.now()
    })
  }

  /**
   * Mock GitHub activity
   */
  mockGitHub(data: { recentCommits: number; openPRs: number; lastCommitMessage: string }): void {
    this.session.world.broadcastEvent('github_update', {
      ...data,
      timestamp: Date.now()
    })
  }

  /**
   * Broadcast multiple sensors at once
   */
  broadcastSensors(sensors: {
    time?: { hour: number; timeOfDay: string }
    weather?: { condition: string; temperature?: number }
    spotify?: { mood: string; track?: string }
    github?: { recentCommits: number }
  }): void {
    if (sensors.time) {
      this.session.world.broadcastEvent('time_update', {
        ...sensors.time,
        timestamp: new Date().toISOString()
      })
    }

    if (sensors.weather) {
      this.session.world.broadcastEvent('weather_update', {
        ...sensors.weather,
        timestamp: Date.now()
      })
    }

    if (sensors.spotify) {
      this.session.world.broadcastEvent('spotify_update', {
        ...sensors.spotify,
        timestamp: Date.now()
      })
    }

    if (sensors.github) {
      this.session.world.broadcastEvent('github_update', {
        ...sensors.github,
        timestamp: Date.now()
      })
    }
  }

  /**
   * Listen to message updates (for streaming LLM test)
   */
  onMessageUpdate(callback: (msg: Message) => void): void {
    // Mock implementation - in real app, this would listen to streaming updates
    // For now, just call callback when messages are added
    const originalAdd = this.addMessage.bind(this)
    this.addMessage = (msg: Message) => {
      originalAdd(msg)
      callback(msg)
    }
  }
}
