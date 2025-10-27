#!/usr/bin/env node
/**
 * Hi-Introvert Simple CLI
 * No TUI bugs, minimal LOC, full MDS features
 */

import readline from 'readline'
import chalk from 'chalk'
import { ChatRuntime } from './apps/hi-introvert/ChatRuntime.js'

// Export for testing
export { ChatRuntime } from './apps/hi-introvert/ChatRuntime.js'
export { CompanionLoader } from './session/CompanionLoader.js'

// Parse CLI args
const companionId = process.argv[2] || 'hi_introvert'

console.log(chalk.cyan('\n╔════════════════════════════════════╗'))
console.log(chalk.cyan('║') + '  🌱 Hi, Introvert               ' + chalk.cyan('║'))
console.log(chalk.cyan('╚════════════════════════════════════╝'))
console.log(chalk.dim('  Commands: /help for full list'))
console.log(chalk.dim(`  Companion: ${companionId}`))
console.log(chalk.dim('  Auto-save: every 60s → sessions/world_log.json\n'))

// Create ChatRuntime (ALL MDS features enabled!)
const runtime = new ChatRuntime({
  world: {
    features: {
      ontology: true,          // Memory, emotion, intent system
      history: true,           // Event log
      rendering: 'headless',   // No DOM (CLI mode)
      physics: true,           // Environmental physics
      communication: true,     // Message system
      languageGeneration: true, // LLM dialogue (if API key set)
      cognitive: true,         // Learning/skills
      cognition: true,         // P2P cognition
      linguistics: true        // Emergent linguistics
    },
    // Environmental physics
    environment: 'forest',     // Forest environment
    weather: 'variable',       // Variable weather
    collision: true,           // Collision detection

    // P2P Cognition config
    cognition: {
      network: { k: 8, p: 0.2 },           // Small-world network
      trust: { initialTrust: 0.5, trustThreshold: 0.6 },
      resonance: { decayRate: 0.2, minStrength: 0.1 }
    },

    // Linguistics config
    linguistics: {
      enabled: true,
      maxTranscript: 1000,
      analyzeEvery: 50,
      minUsage: 3
    },

    // LLM (optional - uses env var)
    llm: {
      provider: 'openrouter',
      apiKey: process.env.OPENROUTER_KEY,
      languageModel: 'anthropic/claude-3.5-sonnet'
    }
  },
  companion: { name: companionId },
  sensors: { os: true, network: true, weather: true },
  autoTick: true,
  tickRate: 1000,
  silentMode: true,
  persistence: {
    autoSave: true,
    interval: 60,  // Save every 60 seconds
    savePath: 'sessions/world_log.json'  // Single world file for all entities
  }
})

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.blue('You: ')
})

// Monitor world transcript for spontaneous speech
let lastTranscriptSize = 0
setInterval(() => {
  const currentSize = runtime.world.transcript?.count || 0

  if (currentSize > lastTranscriptSize) {
    // New utterances detected!
    const newUtterances = runtime.world.transcript?.getAll().slice(lastTranscriptSize) || []

    for (const utterance of newUtterances) {
      // Only show companion's spontaneous speech (not echoes or responses)
      if (utterance.speaker === runtime.companion.id && utterance.listener !== runtime.user.id) {
        const emoji = getEmoji(utterance.emotion.valence)
        console.log(chalk.green(`\n[Companion ${emoji} thinks]: `) + chalk.dim(utterance.text))
        console.log()
        rl.prompt()
      }
    }

    lastTranscriptSize = currentSize
  }
}, 2000)  // Check every 2 seconds

rl.prompt()

// Handle input
rl.on('line', async (input: string) => {
  const msg = input.trim()
  if (!msg) {
    rl.prompt()
    return
  }

  // Commands
  if (msg.startsWith('/')) {
    handleCommand(msg)
    rl.prompt()
    return
  }

  // Send message
  try {
    const res = await runtime.sendMessage(msg)
    const emoji = getEmoji(res.emotion.valence)
    console.log(chalk.green(`\nCompanion ${emoji}: `) + res.response)

    // Show emotion change
    const delta = res.emotion.valence - res.previousValence
    if (Math.abs(delta) > 0.1) {
      const arrow = delta > 0 ? '↗' : '↘'
      console.log(chalk.dim(`  ${arrow} ${res.emotion.valence.toFixed(2)}`))
    }
    console.log()
  } catch (err: any) {
    console.log(chalk.red(`\n[Error] ${err.message}\n`))
  }

  rl.prompt()
})

// Ctrl+C
rl.on('SIGINT', () => {
  console.log(chalk.dim('\n\n👋 Goodbye!\n'))
  runtime.stop()
  process.exit(0)
})

// Commands
function handleCommand(cmd: string) {
  const [c] = cmd.slice(1).toLowerCase().split(' ')

  if (c === 'quit' || c === 'exit') {
    console.log(chalk.dim('\n👋 Goodbye!\n'))
    runtime.destroy()
    rl.close()
    process.exit(0)
  }

  if (c === 'status') {
    console.log(chalk.cyan('\n📊 Status'))
    console.log(chalk.dim('─'.repeat(40)))
    console.log(`  Companion: ${runtime.companion.id}`)
    console.log(`  Age: ${Math.floor(runtime.companion.age / 1000)}s`)
    console.log(`  Emotion: ${runtime.companion.emotion.valence.toFixed(2)}`)
    console.log(`  Memories: ${runtime.companion.memory?.memories?.length || 0}`)
    console.log(`  Vocabulary: ${runtime.world.lexicon?.size || 0}`)
    console.log(`  Relationships: ${runtime.companion.relationships?.size || 0}`)

    // Show environment context (safely check for properties)
    if (runtime.world.environment && runtime.world.environment.temperature !== undefined) {
      console.log(chalk.dim('\n  Environment:'))
      console.log(`    Temp: ${runtime.world.environment.temperature.toFixed(1)}°C`)
      console.log(`    Humidity: ${(runtime.world.environment.humidity * 100).toFixed(0)}%`)
    }
    if (runtime.world.weather && runtime.world.weather.condition) {
      console.log(chalk.dim('  Weather:'))
      console.log(`    Condition: ${runtime.world.weather.condition}`)
      console.log(`    Intensity: ${(runtime.world.weather.intensity * 100).toFixed(0)}%`)
    }
    console.log()
    return
  }

  if (c === 'growth') {
    const g = runtime.getGrowth()
    console.log(chalk.cyan('\n🌱 Growth'))
    console.log(chalk.dim('─'.repeat(40)))
    console.log(`  Conversations: ${g.conversationCount}`)
    console.log(`  Vocabulary: ${g.vocabularySize}`)
    console.log(`  Maturity: ${(g.maturity * 100).toFixed(1)}%`)
    console.log(`  Top words: ${g.vocabularyWords.slice(0, 5).join(', ')}`)
    console.log()
    return
  }

  if (c === 'save') {
    const savePath = 'sessions/world_log.json'
    try {
      runtime.save(savePath)
      console.log(chalk.green(`\n💾 World saved: ${savePath}\n`))
    } catch (err: any) {
      console.log(chalk.red(`\n[Error saving] ${err.message}\n`))
    }
    return
  }

  if (c === 'context') {
    console.log(chalk.cyan('\n🌐 Live Context (Sensors)'))
    console.log(chalk.dim('─'.repeat(40)))

    // Listen to next analytics event to get fresh sensor data
    runtime.once('analytics', (data: any) => {
      if (data.context && Object.keys(data.context).length > 0) {
        console.log(chalk.dim('  Real-time sensor readings:\n'))

        // Display context in organized sections
        for (const [key, value] of Object.entries(data.context)) {
          if (typeof value === 'object' && value !== null) {
            console.log(chalk.bold(`  ${key}:`))
            for (const [subkey, subval] of Object.entries(value)) {
              console.log(`    ${subkey}: ${JSON.stringify(subval)}`)
            }
          } else {
            console.log(`  ${key}: ${value}`)
          }
        }
      } else {
        console.log(chalk.yellow('  No sensor data available'))
        console.log(chalk.dim('  (Sensors may not be loaded or enabled)'))
      }
      console.log()
      rl.prompt()
    })

    // Trigger a tick to get fresh data
    runtime.tick()
    return
  }

  if (c === 'help') {
    console.log(chalk.cyan('\n📖 Commands'))
    console.log(chalk.dim('─'.repeat(40)))
    console.log('  /quit    - Exit')
    console.log('  /status  - Show status')
    console.log('  /growth  - Show growth')
    console.log('  /context - Show live sensors')
    console.log('  /save    - Save world (auto-saves every 60s)')
    console.log('  /help    - This message')
    console.log()
    return
  }

  console.log(chalk.yellow(`\n❓ Unknown: /${c}\n`))
}

function getEmoji(v: number): string {
  if (v > 0.7) return '😊'
  if (v > 0.5) return '🙂'
  if (v > 0.3) return '😐'
  if (v > 0.1) return '😕'
  return '😞'
}
