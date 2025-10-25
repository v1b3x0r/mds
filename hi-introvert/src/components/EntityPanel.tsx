import React from 'react'
import { Box, Text } from 'ink'
import type { EntityInfo } from '../session/WorldSession.js'
import { getEmoji, getStatus } from '../utils/emoji.js'

interface EntityPanelProps {
  entities: EntityInfo[]
}

const getFlag = (name: string): string => {
  if (name === 'yuki') return '🇯🇵'
  if (name === 'somchai') return '🇹🇭'
  if (name === 'mei') return '🇨🇳'
  if (name === 'aria') return '🇰🇷'
  return '🌍'
}

export const EntityPanel: React.FC<EntityPanelProps> = ({ entities }) => {
  return (
    <Box justifyContent="space-around" marginBottom={1} borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1}>
      {entities.map(info => {
        const { emotion } = info.entity
        return (
          <Box key={info.name} flexDirection="column" width={16} paddingX={1}>
            <Text bold color="cyan">
              {info.name} {getFlag(info.name)}
            </Text>
            <Text>
              {getEmoji(emotion.valence)} <Text dimColor>{getStatus(emotion)}</Text>
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
