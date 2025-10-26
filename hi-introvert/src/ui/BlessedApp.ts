import blessed from 'blessed'
import type { Widgets } from 'blessed'
import { WorldSession } from '../session/WorldSession.js'
import { getEmoji } from '../utils/emoji.js'
import type { Message } from '../types/index.js'
import { findClosestThaiEmotion } from '@v1b3x0r/mds-core'

/**
 * blessed-based TUI for hi-introvert
 * Replaces Ink to fix stdin.setRawMode issues
 */
export class BlessedApp {
  screen: Widgets.Screen
  chatBox: Widgets.BoxElement
  inputBox: Widgets.TextboxElement
  statusBar: Widgets.BoxElement
  contextPanel?: Widgets.BoxElement  // v1.2: Live context feed

  session: WorldSession
  messages: Message[] = []
  statusInterval?: NodeJS.Timeout  // v6.3: Cleanup interval on exit
  contextInterval?: NodeJS.Timeout  // v1.2: Context panel update interval
  showContext: boolean = true  // v1.2: Toggle context panel visibility
  lastVocabSize: number = 0    // v5.8.7: Track vocab growth for emergent detection
  seenTerms: Set<string> = new Set()  // v5.8.7: Track terms already notified (polling-based)

  constructor(options?: { companionId?: string }) {
    // v1.2: Initialize session with optional companion selection
    this.session = new WorldSession(options)
    this.session.setSilentMode(true)  // ✅ Disable console.log for clean TUI

    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'hi, introvert',
      fullUnicode: true,  // Thai Unicode support
      dockBorders: true
    })

    // Create UI components
    this.chatBox = this.createChatBox()
    this.inputBox = this.createInputBox()
    this.statusBar = this.createStatusBar()
    this.contextPanel = this.createContextPanel()  // v1.2: Context panel

    // Append to screen
    this.screen.append(this.chatBox)
    this.screen.append(this.inputBox)
    this.screen.append(this.statusBar)
    if (this.showContext && this.contextPanel) {
      this.screen.append(this.contextPanel)  // v1.2: Show by default
    }

    // Setup event handlers
    this.setupKeyBindings()
    this.setupInputHandler()
    this.setupSessionEventListeners()

    // Initial render
    this.screen.render()
  }

  /**
   * Create scrollable chat box
   */
  private createChatBox(): Widgets.BoxElement {
    return blessed.box({
      top: 0,
      left: 0,
      width: this.showContext ? '70%' : '100%',  // v1.2: 70% when context visible
      height: '100%-3',  // Leave space for input + status
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      vi: true,
      mouse: true,
      tags: true,  // Enable {color} tags
      wrap: true,  // ✅ Enable word wrap
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'cyan'
        },
        scrollbar: {
          bg: 'blue',
          fg: 'white'
        }
      },
      scrollbar: {
        ch: '█',
        track: {
          bg: 'grey'
        },
        style: {
          inverse: true
        }
      },
      label: ' Chat ',
      padding: {
        left: 1,
        right: 1
      }
    })
  }

  /**
   * v1.2: Create context panel (live feed)
   */
  private createContextPanel(): Widgets.BoxElement {
    return blessed.box({
      top: 0,
      left: '70%',
      width: '30%',
      height: '100%-3',
      scrollable: true,
      alwaysScroll: true,
      keys: true,
      mouse: true,
      tags: true,
      wrap: true,
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'yellow'
        }
      },
      label: ' Context ',
      padding: {
        left: 1,
        right: 1
      }
    })
  }

  /**
   * Create input box
   */
  private createInputBox(): Widgets.TextboxElement {
    return blessed.textbox({
      bottom: 1,
      left: 0,
      width: '100%',
      height: 1,
      inputOnFocus: true,
      mouse: true,
      keys: true,
      style: {
        fg: 'white',
        bg: 'black'
      }
    })
  }

  /**
   * Create status bar
   */
  private createStatusBar(): Widgets.BoxElement {
    return blessed.box({
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      tags: true,
      style: {
        fg: 'grey',
        bg: 'black'
      }
    })
  }

  /**
   * Setup keyboard bindings
   */
  private setupKeyBindings() {
    // ESC or Ctrl+C to quit
    this.screen.key(['escape', 'C-c'], () => {
      this.cleanup()
      process.exit(0)
    })

    // Tab to focus input
    this.screen.key(['tab'], () => {
      this.inputBox.focus()
      this.inputBox.readInput()  // Force input mode
      this.screen.render()
    })

    // F2 to toggle context panel (v1.2)
    this.screen.key(['f2'], () => {
      this.toggleContextPanel()
    })

    // Arrow keys to scroll chat (when not in input)
    this.chatBox.key(['up', 'down', 'pageup', 'pagedown'], (ch, key) => {
      if (key.name === 'up') this.chatBox.scroll(-1)
      if (key.name === 'down') this.chatBox.scroll(1)
      if (key.name === 'pageup') this.chatBox.scroll(-this.chatBox.height as number)
      if (key.name === 'pagedown') this.chatBox.scroll(this.chatBox.height as number)
      this.screen.render()
    })
  }

  /**
   * Setup input handler
   */
  private setupInputHandler() {
    this.inputBox.on('submit', async (input: string) => {
      const text = input.trim()

      if (!text) {
        this.inputBox.clearValue()
        this.inputBox.focus()
        this.screen.render()
        return
      }

      // Handle commands
      if (text.startsWith('/')) {
        await this.handleCommand(text)
        this.inputBox.clearValue()
        this.inputBox.focus()
        this.screen.render()
        return
      }

      // Handle user message
      await this.handleUserMessage(text)

      this.inputBox.clearValue()
      this.inputBox.focus()
      this.screen.render()
    })
  }

  /**
   * Add message to chat
   */
  private addMessage(message: Message) {
    this.messages.push(message)
    this.renderAllMessages()
  }

  /**
   * Render a single message (helper for load)
   */
  private renderMessage(message: Message): string {
    const timestamp = new Date(message.timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })

    if (message.type === 'user') {
      return `{cyan-fg}[${timestamp}]{/} {bold}you:{/bold}\n  ${message.text}\n`
    } else if (message.type === 'entity') {
      // Emoji emergence based on emotion
      const emoji = message.emotion ? getEmoji(message.emotion.valence) : '💭'
      const emotionText = message.emotion
        ? ` {dim}(${message.emotion.valence.toFixed(2)}){/}`
        : ''
      return `{cyan-fg}[${timestamp}]{/} ${emoji} {green-fg}${message.sender}:{/}${emotionText}\n  ${message.text}\n`
    } else if (message.type === 'system') {
      return `{cyan-fg}[${timestamp}]{/} {grey-fg}⚙ system{/}\n  {dim}${message.text}{/}\n`
    }

    return ''
  }

  /**
   * Render all messages (full re-render to prevent overlap)
   */
  private renderAllMessages() {
    const lines: string[] = []

    // Only show last 50 messages to prevent lag
    const recentMessages = this.messages.slice(-50)

    for (const msg of recentMessages) {
      lines.push(this.renderMessage(msg))
    }

    // Join with blank line separator for better readability
    this.chatBox.setContent(lines.join('\n'))
    this.chatBox.setScrollPerc(100)  // Auto-scroll to bottom
  }

  /**
   * Handle user message
   */
  private async handleUserMessage(text: string) {
    // Add user message
    this.addMessage({
      type: 'user',
      sender: 'you',
      text,
      timestamp: Date.now()
    })

    this.screen.render()

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

      // v5.8.7: Check for emergent language detection
      this.checkEmergentLanguage()

      // Update status bar
      this.updateStatusBar()

    } catch (error) {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now()
      })
    }

    // Update status bar after all changes
    this.updateStatusBar()
    this.screen.render()
  }

  /**
   * Handle command
   */
  private async handleCommand(cmd: string) {
    const [command, ...args] = cmd.slice(1).split(' ')

    switch (command) {
      case 'help':
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: `commands:
  /status       entity emotion + memories + vocabulary
  /growth       vocabulary & concept growth summary
  /spawn [desc] spawn new friend (LLM only)
  /history      show event log (world events)
  /lexicon      emergent language terms
  /autosave     toggle autosave (on|off)
  /save [file]  save session manually
  /load [file]  load previous session
  /clear        clear chat history
  /quit         leave chat`,
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

      case 'lexicon':
        const lexiconStats = this.session.world.getLexiconStats()
        if (!lexiconStats || lexiconStats.totalTerms === 0) {
          this.addMessage({
            type: 'system',
            sender: 'system',
            text: 'No emergent terms yet. Keep talking!',
            timestamp: Date.now()
          })
        } else {
          const popular = this.session.world.getPopularTerms(3)
          const lines = [
            '🗣️ Emergent Lexicon',
            '─'.repeat(40),
            `${'Total terms:'.padEnd(20)}${lexiconStats.totalTerms}`,
            `${'Total usage:'.padEnd(20)}${lexiconStats.totalUsage}`,
            ''
          ]

          if (popular.length > 0) {
            lines.push('Popular terms:')
            for (const entry of popular) {
              lines.push(`  • ${entry.term.padEnd(15)} ${entry.usageCount}× (${entry.strength.toFixed(2)})`)
            }
          }

          this.addMessage({
            type: 'system',
            sender: 'system',
            text: lines.join('\n'),
            timestamp: Date.now()
          })
        }
        break

      case 'history':
        const recent = this.session.world.getRecentUtterances(10)
        if (recent.length === 0) {
          this.addMessage({
            type: 'system',
            sender: 'system',
            text: 'No conversation history yet.',
            timestamp: Date.now()
          })
        } else {
          let historyText = `📜 Recent Conversation (last ${recent.length})\n\n`
          for (const utt of recent.reverse()) {
            historyText += `[${utt.speaker}]: ${utt.text.substring(0, 60)}${utt.text.length > 60 ? '...' : ''}\n`
          }

          this.addMessage({
            type: 'system',
            sender: 'system',
            text: historyText,
            timestamp: Date.now()
          })
        }
        break

      case 'save':
        const saveFilename = args[0] || '.hi-introvert-session.json'
        this.session.saveSessionWithHistory(saveFilename, this.messages)
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: `Session saved to ${saveFilename}`,
          timestamp: Date.now()
        })
        break

      case 'load':
        const loadFilename = args[0] || '.hi-introvert-session.json'
        const loadResult = this.session.loadSessionWithHistory(loadFilename)

        if (loadResult.success) {
          // Restore messages
          this.messages = loadResult.messages || []

          // Re-render all messages
          this.renderAllMessages()

          this.addMessage({
            type: 'system',
            sender: 'system',
            text: `Session loaded from ${loadFilename}\nMessages: ${this.messages.length}, Vocabulary: ${loadResult.vocabularySize}`,
            timestamp: Date.now()
          })
        } else {
          this.addMessage({
            type: 'system',
            sender: 'system',
            text: `Failed to load session: ${loadResult.error || 'File not found'}`,
            timestamp: Date.now()
          })
        }
        break

      case 'clear':
        this.messages = []
        this.renderAllMessages()
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: 'Chat history cleared (memories preserved)',
          timestamp: Date.now()
        })
        break

      case 'quit':
      case 'exit':
        this.cleanup()
        process.exit(0)
        break

      default:
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: `Unknown command: ${command}. Type /help for available commands.`,
          timestamp: Date.now()
        })
    }

    this.screen.render()
  }

  /**
   * v1.2: Toggle context panel visibility
   */
  private toggleContextPanel() {
    this.showContext = !this.showContext

    if (this.showContext && this.contextPanel) {
      // Show context panel
      this.screen.append(this.contextPanel)
      this.chatBox.width = '70%'
      this.updateContextPanel()
    } else if (this.contextPanel) {
      // Hide context panel
      this.screen.remove(this.contextPanel)
      this.chatBox.width = '100%'
    }

    this.screen.render()
  }

  /**
   * v1.2: Update context panel with live data
   */
  private updateContextPanel() {
    if (!this.contextPanel || !this.showContext) return

    // v5.8.7: Check for new terms (polling-based detection)
    this.checkEmergentLanguagePolling()

    const companion = this.session.companionEntity.entity
    const traveler = this.session.impersonatedEntity.entity
    const world = this.session.world

    // Get data
    const memCount = companion.memory?.count() || 0
    const recentMem = companion.memory?.memories?.[0]
    const emotion = companion.emotion
    // v5.8.5: Use world.lexicon instead of vocabularyTracker
    const vocabSize = world.lexicon.size
    const conversationCount = this.session.conversationCount
    const weather = world.environment?.weather?.type || 'Clear'
    const temp = world.environment?.temperature || 25
    const tickCount = world.entities?.length || 0  // Use entity count as proxy for activity

    // Get cognitive link (handle case where cognitiveLinks might not be an array)
    const links = Array.isArray(companion.cognitiveLinks) ? companion.cognitiveLinks : []
    const link = links.find(l => l.targetId === traveler.id)

    // Build content
    const lines: string[] = []
    lines.push('{bold}{yellow-fg}🧠 Memory{/}')
    lines.push(`  Total: {cyan-fg}${memCount}{/}`)
    if (recentMem) {
      const memText = recentMem.content?.message || recentMem.content?.response || JSON.stringify(recentMem.content).substring(0, 20)
      lines.push(`  Recent: {dim}"${memText.substring(0, 20)}..."{/}`)
    }
    lines.push('')

    // v5.8: Show emotion with higher granularity (18 emotions vs 8)
    const emotionLabel = findClosestThaiEmotion(emotion)

    lines.push('{bold}{magenta-fg}💭 Emotion{/}')
    lines.push(`  {yellow-fg}${emotionLabel}{/}`)  // Compact: show label only
    lines.push(`  V:{${emotion.valence >= 0 ? 'green' : 'red'}-fg}${emotion.valence.toFixed(2)}{/} A:{cyan-fg}${emotion.arousal.toFixed(2)}{/} D:{yellow-fg}${emotion.dominance.toFixed(2)}{/}`)
    if (emotion.vitality !== undefined) {
      lines.push(`  Vit: {cyan-fg}${emotion.vitality.toFixed(2)}{/}`)
    }
    lines.push('')

    lines.push('{bold}{blue-fg}🌍 World{/}')
    lines.push(`  Weather: {cyan-fg}${weather}{/}`)
    lines.push(`  Temp: {yellow-fg}${temp}°C{/}`)
    lines.push(`  Entities: {dim}${tickCount}{/}`)
    lines.push('')

    if (link) {
      lines.push('{bold}{green-fg}🔗 Link{/}')
      lines.push(`  companion ↔ you`)
      lines.push(`  Trust: {cyan-fg}${link.trust?.toFixed(2) || '0.00'}{/}`)
      lines.push(`  Strength: {green-fg}${link.strength.toFixed(2)}{/}`)
      lines.push('')
    }

    lines.push('{bold}{red-fg}📚 Vocabulary{/}')
    // v5.8.5: Use world.lexicon stats
    const totalWords = vocabSize
    const protoActive = totalWords >= 20 // Match WorldSession threshold
    lines.push(`  Total: {cyan-fg}${totalWords}{/} terms`)
    lines.push(`  Conversations: {green-fg}${conversationCount}{/}`)
    // Avoid template string in blessed tags
    const protoColor = protoActive ? 'green-fg' : 'dim'
    const protoSymbol = protoActive ? '✓' : '✗'
    lines.push(`  Proto: {${protoColor}}${protoSymbol}{/}`)
    lines.push('')

    // v5.8.7: OS Sensor info
    lines.push('{bold}{grey-fg}💻 OS Info{/}')
    const osMetrics = this.session.osSensor.getMetrics()
    lines.push(`  Platform: {dim}${process.platform}{/}`)
    lines.push(`  Locale: {dim}${Intl.DateTimeFormat().resolvedOptions().locale}{/}`)
    lines.push(`  Timezone: {dim}${Intl.DateTimeFormat().resolvedOptions().timeZone}{/}`)
    lines.push(`  CPU: {yellow-fg}${(osMetrics.cpuUsage * 100).toFixed(0)}%{/}`)
    lines.push(`  Memory: {cyan-fg}${(osMetrics.memoryUsage * 100).toFixed(0)}%{/}`)
    const battColor = osMetrics.batteryLevel > 0.5 ? 'green-fg' : 'red-fg'
    lines.push(`  Battery: {${battColor}}${(osMetrics.batteryLevel * 100).toFixed(0)}%{/} ${osMetrics.batteryCharging ? '⚡' : ''}`)

    this.contextPanel.setContent(lines.join('\n'))
  }

  /**
   * v5.8.7: Check for emergent language detection (immediate - after user message)
   * Show system message when new terms are learned
   */
  private checkEmergentLanguage() {
    const currentSize = this.session.world.lexicon?.size || 0

    if (currentSize > this.lastVocabSize) {
      const newCount = currentSize - this.lastVocabSize

      // Get the new words (within last 5 seconds)
      const recentWords = this.session.world.lexicon?.getRecent(5000) || []

      if (recentWords.length > 0) {
        const wordList = recentWords
          .slice(0, 5) // Show max 5 words
          .map(entry => `"${entry.term}"`)
          .join(', ')

        this.addMessage({
          type: 'system',
          sender: 'system',
          text: `{cyan-fg}✨ Emergent language:{/} ${newCount} new term${newCount > 1 ? 's' : ''} detected: ${wordList}`,
          timestamp: Date.now()
        })
      }

      this.lastVocabSize = currentSize
    }
  }

  /**
   * v5.8.7: Polling-based detection for background crystallization
   * Runs every context panel update (~1 second interval)
   * Detects terms added by world.tick() that aren't caught by immediate detection
   */
  private checkEmergentLanguagePolling() {
    const allTerms = this.session.world.lexicon?.getAll() || []

    // Find new terms not yet seen
    const newTerms = allTerms.filter(entry => {
      // Skip if already notified
      if (this.seenTerms.has(entry.term)) return false

      // Only show terms detected within last 2 seconds (avoid flooding on startup)
      const age = Date.now() - entry.firstSeen
      return age < 2000
    })

    if (newTerms.length > 0) {
      const wordList = newTerms
        .slice(0, 5) // Show max 5 words
        .map(entry => `"${entry.term}"`)
        .join(', ')

      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `{cyan-fg}✨ World discovered:{/} ${newTerms.length} new term${newTerms.length > 1 ? 's' : ''} — ${wordList}`,
        timestamp: Date.now()
      })

      // Mark as seen
      newTerms.forEach(entry => this.seenTerms.add(entry.term))

      // Update lastVocabSize to stay in sync
      this.lastVocabSize = this.session.world.lexicon?.size || 0
    }
  }

  /**
   * Update status bar
   */
  private updateStatusBar() {
    const companionEmotion = this.session.companionEntity.entity.emotion.valence.toFixed(2)
    const travelerEmotion = this.session.impersonatedEntity.entity.emotion.valence.toFixed(2)
    const memoryCount = this.session.companionEntity.entity.memory?.count() || 0

    this.statusBar.setContent(
      `{bold}traveler (YOU):{/bold} ${travelerEmotion} | ` +
      `{bold}companion:{/bold} ${companionEmotion} | ` +
      `memories: ${memoryCount} | ` +
      `{dim}[F2:context | TAB:focus | ESC:quit]{/}`
    )
  }

  /**
   * Start the app
   */
  async start() {
    // v5.8.7: Initialize vocab tracking
    this.lastVocabSize = this.session.world.lexicon?.size || 0

    // v5.8.7: Mark all existing terms as seen (avoid flooding on startup)
    const existingTerms = this.session.world.lexicon?.getAll() || []
    existingTerms.forEach(entry => this.seenTerms.add(entry.term))

    // Load session with history (if exists)
    const loadResult = this.session.loadSessionWithHistory()

    if (loadResult.success && loadResult.messages && loadResult.messages.length > 0) {
      // Restore previous session
      this.messages = loadResult.messages
      this.renderAllMessages()

      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `Session restored: ${loadResult.messages.length} messages, ${loadResult.vocabularySize} words`,
        timestamp: Date.now()
      })
    } else {
      // New session - show greeting
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
    }

    // Update status
    this.updateStatusBar()

    // Focus input
    this.inputBox.focus()

    // Render
    this.screen.render()

    // v1.2: Update context panel every 500ms (live feed)
    this.contextInterval = setInterval(() => {
      this.updateContextPanel()
      this.screen.render()
    }, 500)

    // Update status bar every 2 seconds
    this.statusInterval = setInterval(() => {
      this.updateStatusBar()
      this.screen.render()
    }, 2000)

    // Autonomous behavior: companion speaks spontaneously (every 15-45 seconds)
    const scheduleAutonomousMessage = () => {
      const delay = 15000 + Math.random() * 30000  // 15-45 seconds
      setTimeout(async () => {
        await this.triggerAutonomousMessage()
        scheduleAutonomousMessage()  // Schedule next one
      }, delay)
    }
    scheduleAutonomousMessage()
  }

  /**
   * Trigger autonomous message from companion
   */
  private async triggerAutonomousMessage() {
    // Only trigger if companion is autonomous (not impersonated)
    if (this.session.companionEntity.entity.isAutonomous()) {
      try {
        const response = await this.session.generateAutonomousMessage()

        if (response) {
          this.addMessage({
            type: 'entity',
            sender: response.name,
            text: response.response,
            emotion: response.emotion,
            timestamp: Date.now()
          })

          this.updateStatusBar()
          this.screen.render()
        }
      } catch (error) {
        // Silent fail for autonomous messages (don't spam errors)
        console.error('[Autonomous]', error)
      }
    }
  }

  /**
   * Setup session event listeners
   * Listen to WorldSession events and display in chatBox
   */
  private setupSessionEventListeners() {
    // Vocabulary learning
    this.session.on('vocab', (data: { words: string[] }) => {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `{yellow-fg}[Vocab] Learned: ${data.words.join(', ')}{/}`,
        timestamp: Date.now()
      })
      this.screen.render()
    })

    // Cognitive link
    this.session.on('link', (data: { from: string; to: string; strength: number }) => {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `{blue-fg}[Link] ${data.from} ↔ ${data.to} (${data.strength.toFixed(2)}){/}`,
        timestamp: Date.now()
      })
      this.screen.render()
    })

    // Save session
    this.session.on('save', (data: { filename: string }) => {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `{green-fg}[Save] Session saved to ${data.filename}{/}`,
        timestamp: Date.now()
      })
      this.screen.render()
    })

    // Load session
    this.session.on('load', (data: any) => {
      if (data.status === 'not_found') {
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: `{dim}[Load] No saved session found{/}`,
          timestamp: Date.now()
        })
      } else if (data.status === 'success') {
        this.addMessage({
          type: 'system',
          sender: 'system',
          text: `{green-fg}[Load] Session restored: ${data.vocabularySize} words, ${data.entityCount} entities{/}`,
          timestamp: Date.now()
        })
      }
      this.screen.render()
    })

    // Impersonate/Unpossess
    this.session.on('impersonate', (data: { entityName: string }) => {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `{magenta-fg}[Control] You now control ${data.entityName}{/}`,
        timestamp: Date.now()
      })
      this.screen.render()
    })

    this.session.on('unpossess', (data: { entityName: string }) => {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `{magenta-fg}[Control] ${data.entityName} is autonomous again{/}`,
        timestamp: Date.now()
      })
      this.screen.render()
    })

    // LLM fallback
    this.session.on('llm', (data: { action: string }) => {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `{cyan-fg}[LLM] Using fallback generation{/}`,
        timestamp: Date.now()
      })
      this.screen.render()
    })

    // Errors
    this.session.on('error', (data: { type: string; message: string }) => {
      this.addMessage({
        type: 'system',
        sender: 'system',
        text: `{red-fg}[Error ${data.type}] ${data.message}{/}`,
        timestamp: Date.now()
      })
      this.screen.render()
    })
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Clear intervals to prevent memory leaks
    if (this.statusInterval) clearInterval(this.statusInterval)
    if (this.contextInterval) clearInterval(this.contextInterval)  // v1.2

    // Save session WITH conversation history
    this.session.saveSessionWithHistory('.hi-introvert-session.json', this.messages)
    this.screen.destroy()
  }
}
