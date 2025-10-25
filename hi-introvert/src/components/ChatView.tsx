import React from 'react'
import { Box, Text } from 'ink'
import type { Message } from '../types/index.js'

interface ChatViewProps {
  messages: Message[]
}

const formatTime = (timestamp?: number): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

export const ChatView: React.FC<ChatViewProps> = ({ messages }) => {
  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1} paddingX={1}>
      {messages.map((msg, i) => {
        const time = formatTime(msg.timestamp)
        const prevMsg = i > 0 ? messages[i - 1] : null

        // Group messages by timestamp (within 2 seconds = same conversation turn)
        const isGrouped = prevMsg && msg.timestamp && prevMsg.timestamp &&
          Math.abs(msg.timestamp - prevMsg.timestamp) < 2000

        if (msg.type === 'user') {
          const userTarget = msg.target || 'everyone'
          return (
            <Box key={i} marginBottom={1} flexDirection="column">
              {!isGrouped && <Box justifyContent="flex-end"><Text dimColor>[{time}]</Text></Box>}
              <Box justifyContent="flex-end" marginLeft={isGrouped ? 2 : 0}>
                <Text>{msg.text} </Text>
                <Text color="cyan" dimColor>:{userTarget} ←</Text>
                <Text color="cyan" bold> you</Text>
              </Box>
            </Box>
          )
        }

        if (msg.type === 'monologue') {
          return (
            <Box key={i} marginBottom={1} flexDirection="column">
              {!isGrouped && <Text dimColor>[{time}]</Text>}
              <Box marginLeft={isGrouped ? 2 : 0}>
                <Text dimColor>{msg.sender.padEnd(11)}</Text>
                <Text dimColor>(thinking: "{msg.text}")</Text>
              </Box>
            </Box>
          )
        }

        if (msg.type === 'system') {
          return (
            <Box key={i} marginBottom={1}>
              <Text dimColor>[{time}] </Text>
              <Text color="yellow" dimColor>{msg.text}</Text>
            </Box>
          )
        }

        // Entity message - check if it's a reply or has target
        const isReply = prevMsg && prevMsg.type === 'user'
        const entityTarget = msg.target || (isReply ? prevMsg.sender : 'everyone')
        const arrow = msg.target ? '→' : (isReply ? '↳' : '→')

        return (
          <Box key={i} marginBottom={0} flexDirection="column">
            {!isGrouped && <Text dimColor>[{time}]</Text>}
            <Box marginLeft={isGrouped ? 2 : 0}>
              <Text color="cyan">{msg.sender.padEnd(11)}</Text>
              <Text dimColor>{arrow} {entityTarget}: </Text>
              <Text>{msg.text}</Text>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
