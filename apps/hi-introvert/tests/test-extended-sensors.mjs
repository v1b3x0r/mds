/**
 * Quick test for ExtendedSensors
 */

import { ExtendedSensors } from '../src/sensors/ExtendedSensors.ts'

const sensors = new ExtendedSensors({ realSensors: true })

console.log('🔍 Testing Extended Sensors...\n')

const metrics = sensors.getAllMetrics()

console.log('Network:', metrics.network.connected ? '✅ Connected' : '❌ Offline')
console.log('  Interfaces:', metrics.network.interfaceCount)
console.log('  IPv6:', metrics.network.hasIPv6 ? 'Yes' : 'No')

console.log('\nStorage:')
console.log('  Total:', metrics.storage.totalGB.toFixed(1), 'GB')
console.log('  Free:', metrics.storage.freeGB.toFixed(1), 'GB')
console.log('  Usage:', (metrics.storage.usagePercent * 100).toFixed(1) + '%')

console.log('\nCircadian:', metrics.circadian, '(hour:', new Date().getHours() + ')')

console.log('\nBrightness:', (metrics.brightness * 100).toFixed(0) + '%')

console.log('\nProcess Count:', metrics.processCount)

console.log('\nGit:')
console.log('  In Repo:', metrics.git.inRepo ? 'Yes' : 'No')
if (metrics.git.inRepo) {
  console.log('  Diff Lines:', metrics.git.diffLines)
  console.log('  Staged Lines:', metrics.git.stagedLines)
  console.log('  Has Changes:', metrics.git.hasChanges ? 'Yes' : 'No')
}

console.log('\n✅ All sensors functional!')
console.log('\nFormatted output:')
console.log(sensors.formatMetrics(metrics))
