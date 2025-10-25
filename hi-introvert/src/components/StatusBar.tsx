import React from 'react'
import { Box, Text } from 'ink'

interface StatusBarProps {
  autoSave: boolean
}

export const StatusBar: React.FC<StatusBarProps> = ({ autoSave }) => {
  return (
    <Box justifyContent="space-between" marginBottom={1}>
      <Box>
        <Text dimColor>hi, introvert. </Text>
        <Text dimColor color="magenta">v1.0.0</Text>
      </Box>
      <Text dimColor>
        autosave: <Text color={autoSave ? 'green' : 'gray'}>●</Text> {autoSave ? 'on' : 'off'}
      </Text>
    </Box>
  )
}
