#!/usr/bin/env node
import { BlessedApp } from './ui/BlessedApp.js'

// Export for testing
export { WorldSession } from './session/WorldSession.js'
export { CompanionLoader } from './session/CompanionLoader.js'

// v1.2: Parse CLI arguments for companion selection
// Usage: hi-introvert --companion=orz.archivist
let companionId: string | undefined
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--companion=')) {
    companionId = arg.split('=')[1]
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
hi, introvert v1.2

Usage:
  hi-introvert [options]

Options:
  --companion=ID    Select companion by ID (default: hi_introvert)
                    Available IDs: hi_introvert, orz.archivist
  --help, -h        Show this help message
`)
    process.exit(0)
  }
}

const app = new BlessedApp({ companionId })
app.start()
