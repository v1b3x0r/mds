import type { EmotionalState } from '@v1b3x0r/mds-core'

export interface Message {
  type: 'user' | 'entity' | 'monologue' | 'system'
  sender: string
  text: string
  emotion?: EmotionalState
  target?: string  // @mention target (e.g., "yuki")
  timestamp: number
}

export interface Command {
  name: string
  execute: (args?: string[]) => void | Promise<void>
}
