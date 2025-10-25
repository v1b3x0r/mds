import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { WorldSession } from './session/WorldSession.js'
import { StatusBar } from './components/StatusBar.js'
import { EntityPanel } from './components/EntityPanel.js'
import { ChatView } from './components/ChatView.js'
import type { Message } from './types/index.js'

export const App: React.FC = () => {
  const [session] = useState(() => new WorldSession())
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [, forceUpdate] = useState(0) // Force re-render for emotion updates

  useEffect(() => {
    // Try to restore previous session
    const restored = session.loadSession()

    // Show greeting (first-time or returning)
    const entityInfo = session.getEntityInfo()

    if (entityInfo) {
      const greeting = session.getGreeting()

      setMessages([{
        type: 'entity',
        sender: entityInfo.name,
        text: greeting,
        emotion: { ...entityInfo.entity.emotion },
        timestamp: Date.now()
      }])
    }

    setLoading(false)

    // Update EntityPanel every 1 second (for emotion changes)
    const emotionUpdateInterval = setInterval(() => {
      forceUpdate(n => n + 1)
    }, 1000)

    // Cleanup on unmount
    return () => {
      clearInterval(emotionUpdateInterval)
    }
  }, [session])

  // Keyboard shortcuts (ESC or Q to quit)
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      process.exit(0)
    }
  })

  const handleSubmit = async () => {
    if (!input.trim()) return

    // Handle commands
    if (input.startsWith('/')) {
      handleCommand(input)
      setInput('')
      return
    }

    // User message
    const userMessage = input
    setMessages(prev => [
      ...prev,
      {
        type: 'user',
        sender: 'you',
        text: userMessage,
        timestamp: Date.now()
      }
    ])

    setInput('')

    // Entity response (async - may use LLM)
    try {
      const response = await session.handleUserMessage(userMessage)

      setMessages(prev => [
        ...prev,
        {
          type: 'entity',
          sender: response.name,
          text: response.response,
          emotion: response.emotion,
          timestamp: Date.now()
        }
      ])

      // Show vocabulary growth (optional debug)
      if (response.newWordsLearned && response.newWordsLearned.length > 0) {
        console.log('[Vocab Growth]', response.newWordsLearned)
      }

      // Force re-render for emotion update
      forceUpdate(n => n + 1)
    } catch (error) {
      console.error('[Error]', error)
      setMessages(prev => [
        ...prev,
        {
          type: 'system',
          sender: 'system',
          text: `error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: Date.now()
        }
      ])
    }
  }

  const handleCommand = (cmd: string) => {
    const [command, ...args] = cmd.slice(1).split(' ')

    switch (command) {
      case 'help':
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: 'commands:\n  /status       entity emotion + memories + vocabulary\n  /growth       vocabulary & concept growth summary\n  /spawn [desc] spawn new friend (LLM only)\n  /history      show event log (world events)\n  /lexicon      emergent language terms\n  /autosave     toggle autosave (on|off)\n  /save [file]  save session manually\n  /load [file]  load previous session\n  /clear        clear chat history\n  /exit         leave chat',
            timestamp: Date.now()
          }
        ])
        break

      case 'status':
        const statusText = session.getStatusSummary()
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: statusText,
            timestamp: Date.now()
          }
        ])
        break

      case 'growth':
        const growthText = session.getGrowthSummary()
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: growthText,
            timestamp: Date.now()
          }
        ])
        break

      case 'spawn':
        const description = args.join(' ')
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: 'spawning new friend... (this may take a moment)',
            timestamp: Date.now()
          }
        ])

        // Spawn async
        session.spawnFriend(description || undefined).then(newEntity => {
          if (newEntity) {
            const intro = newEntity.entity.speak('intro') || `Hi, I'm ${newEntity.name}!`
            setMessages(prev => [
              ...prev,
              {
                type: 'system',
                sender: 'system',
                text: `✨ ${newEntity.name} joined the space!`,
                timestamp: Date.now()
              },
              {
                type: 'entity',
                sender: newEntity.name,
                text: intro,
                emotion: { ...newEntity.entity.emotion },
                timestamp: Date.now()
              }
            ])
            forceUpdate(n => n + 1)
          } else {
            setMessages(prev => [
              ...prev,
              {
                type: 'system',
                sender: 'system',
                text: '❌ Failed to spawn. LLM not available or error occurred.',
                timestamp: Date.now()
              }
            ])
          }
        })
        break


      case 'history':
        const allEvents = session.getAllEvents()
        const speechEvents = allEvents.filter(e =>
          e.type === 'entity_spoke' || e.type === 'user_spoke'
        )

        const historyText = speechEvents.slice(-20).map(e => {
          const time = new Date(e.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
          return `[${time}] ${e.data.speaker}: ${e.data.text}`
        }).join('\n')

        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: 'recent conversation history:\n\n' + (historyText || '(no events yet)'),
            timestamp: Date.now()
          }
        ])
        break

      case 'lexicon':
        const lexiconStats = session.world.getLexiconStats()
        const lexiconOutput = lexiconStats && lexiconStats.totalTerms > 0
          ? `🗣️ Linguistics Lexicon\n  Terms: ${lexiconStats.totalTerms}\n  Usage: ${lexiconStats.totalUsage}\n  Avg usage: ${(lexiconStats.totalUsage / lexiconStats.totalTerms).toFixed(1)}`
          : 'No linguistic patterns detected yet'
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: lexiconOutput,
            timestamp: Date.now()
          }
        ])
        break

      case 'autosave':
        const enabled = session.toggleAutoSave()
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: `autosave: ${enabled ? 'on' : 'off'}`,
            timestamp: Date.now()
          }
        ])
        break

      case 'save':
        const saveFilename = args[0] || '.hi-introvert-session.json'
        try {
          session.saveSession(saveFilename)
          setMessages(prev => [
            ...prev,
            {
              type: 'system',
              sender: 'system',
              text: `session saved to ${saveFilename}`,
              timestamp: Date.now()
            }
          ])
        } catch (error) {
          setMessages(prev => [
            ...prev,
            {
              type: 'system',
              sender: 'system',
              text: `error saving: ${error}`,
              timestamp: Date.now()
            }
          ])
        }
        break

      case 'load':
        const loadFilename = args[0] || '.hi-introvert-session.json'
        const loaded = session.loadSession(loadFilename)
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: loaded
              ? `session restored from ${loadFilename}`
              : `no saved session found at ${loadFilename}`,
            timestamp: Date.now()
          }
        ])
        break

      case 'clear':
        setMessages([])
        break

      case 'exit':
        process.exit(0)
        break

      default:
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            sender: 'system',
            text: `unknown command: ${command}. type /help for commands.`,
            timestamp: Date.now()
          }
        ])
    }
  }

  const getStatusWord = (emotion: any) => {
    if (emotion.arousal > 0.6) return 'anxious'
    if (emotion.valence > 0.5) return 'happy'
    if (emotion.valence < -0.5) return 'sad'
    if (emotion.valence > 0) return 'calm'
    return 'quiet'
  }

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>hi, introvert.</Text>
        <Text></Text>
        <Text dimColor>loading...</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" height="100%">
      {/* Fixed header: Status + Entities */}
      <Box flexDirection="column" paddingX={1}>
        <StatusBar autoSave={session.isAutoSaveEnabled()} />
        <EntityPanel entities={session.getAllEntities()} />
        <Text dimColor>{'─'.repeat(60)}</Text>
      </Box>

      {/* Scrollable chat area */}
      <Box flexDirection="column" flexGrow={1} paddingBottom={1}>
        <ChatView messages={messages} />
      </Box>

      {/* Fixed footer: Input */}
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor>{'─'.repeat(60)}</Text>
        <Box>
          <Text dimColor>&gt; </Text>
          <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
        </Box>
      </Box>
    </Box>
  )
}

function getStatusWord(emotion: any): string {
  if (emotion.arousal > 0.6) return 'anxious'
  if (emotion.valence > 0.5) return 'happy'
  if (emotion.valence < -0.5) return 'sad'
  if (emotion.valence > 0) return 'calm'
  return 'quiet'
}
