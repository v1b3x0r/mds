#!/usr/bin/env node
import { BlessedApp } from './ui/BlessedApp.js'

// Export for testing
export { WorldSession } from './session/WorldSession.js'

const app = new BlessedApp()
app.start()
