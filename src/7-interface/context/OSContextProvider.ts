/**
 * OS Context Provider
 * v5.8.0 - System metrics → trigger context
 *
 * Provides:
 * - cpu.usage: CPU utilization (0-1)
 * - memory.usage: Memory utilization (0-1)
 * - battery.level: Battery level (0-1)
 * - battery.charging: Is battery charging (boolean → 1 or 0)
 * - system.uptime: System uptime in seconds
 * - system.load: Load average (1min)
 */

import { BaseContextProvider } from '@mds/7-interface/context/ContextProvider'

export interface OSContextConfig {
  pollInterval?: number  // milliseconds (default: 10000)
}

type MinimalCPUInfo = {
  times: { idle: number; user: number; nice: number; sys: number; irq: number }
}

type MinimalOSModule = {
  cpus(): MinimalCPUInfo[]
  totalmem(): number
  freemem(): number
  uptime(): number
  loadavg(): number[]
}

const isNodeRuntime =
  typeof process !== 'undefined' &&
  !!process.versions?.node &&
  typeof window === 'undefined'

const FALLBACK_OS: MinimalOSModule = {
  cpus: () => [
    { times: { idle: 0, user: 0, nice: 0, sys: 0, irq: 0 } }
  ],
  totalmem: () => 1,
  freemem: () => 1,
  uptime: () => 0,
  loadavg: () => [0, 0, 0]
}

type NodeModules = {
  os: MinimalOSModule
  execSync?: typeof import('child_process')['execSync']
  existsSync?: (path: string) => boolean
  readFileSync?: (path: string, encoding: BufferEncoding) => string
}

let nodeModules: NodeModules | null = null
let nodeModulesPromise: Promise<void> | null = null

function ensureNodeModules(): void {
  if (!isNodeRuntime || nodeModules || nodeModulesPromise) return
  nodeModulesPromise = Promise.all([
    import('os'),
    import('child_process'),
    import('fs')
  ]).then(([os, child, fs]) => {
    nodeModules = {
      os: ((os as any).default ?? os) as MinimalOSModule,
      execSync: (child as typeof import('child_process')).execSync,
      existsSync: (fs as typeof import('fs')).existsSync,
      readFileSync: (fs as typeof import('fs')).readFileSync
    }
  }).catch(() => {
    nodeModules = null
  })
}

function getOS(): MinimalOSModule {
  ensureNodeModules()
  return nodeModules?.os ?? FALLBACK_OS
}

function getExecSync() {
  ensureNodeModules()
  return nodeModules?.execSync
}

function getExistsSync() {
  ensureNodeModules()
  return nodeModules?.existsSync
}

function getReadFileSync() {
  ensureNodeModules()
  return nodeModules?.readFileSync
}

export class OSContextProvider extends BaseContextProvider {
  name = 'os'
  private lastCPUTimes: { idle: number, total: number }[] = []

  constructor(_config: OSContextConfig = {}) {
    super()
    // _config is intentionally unused (for future features)
    this.initCPU()
  }

  /**
   * Get current OS metrics as context
   */
  getContext(): Record<string, any> {
    const os = getOS()
    return {
      'cpu.usage': this.getCPUUsage(),
      'memory.usage': this.getMemoryUsage(),
      'battery.level': this.getBatteryLevel().level,
      'battery.charging': this.getBatteryLevel().charging ? 1 : 0,
      'system.uptime': os.uptime(),
      'system.load': os.loadavg()[0]  // 1-minute load average
    }
  }

  /**
   * Initialize CPU tracking
   */
  private initCPU(): void {
    const cpus = getOS().cpus()
    this.lastCPUTimes = cpus.map(cpu => ({
      idle: cpu.times.idle,
      total: (Object.values(cpu.times) as number[]).reduce((a, b) => a + b, 0)
    }))
  }

  /**
   * Get CPU usage (0..1)
   */
  private getCPUUsage(): number {
    const cpus = getOS().cpus()
    let totalUsage = 0

    cpus.forEach((cpu, i) => {
      const lastTimes = this.lastCPUTimes[i] ?? { idle: cpu.times.idle, total: (Object.values(cpu.times) as number[]).reduce((a, b) => a + b, 0) }
      const idle = cpu.times.idle
      const total = (Object.values(cpu.times) as number[]).reduce((a, b) => a + b, 0)

      const idleDelta = idle - lastTimes.idle
      const totalDelta = total - lastTimes.total

      const usage = totalDelta > 0 ? 1 - (idleDelta / totalDelta) : 0
      totalUsage += usage

      // Update last times
      this.lastCPUTimes[i] = { idle, total }
    })

    return totalUsage / cpus.length
  }

  /**
   * Get memory usage (0..1)
   */
  private getMemoryUsage(): number {
    const os = getOS()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    return (totalMem - freeMem) / totalMem
  }

  /**
   * Get battery level (macOS, Linux, fallback for others)
   */
  private getBatteryLevel(): { level: number, charging: boolean } {
    if (!isNodeRuntime) {
      return { level: 1, charging: true }
    }

    try {
      const platform = typeof process !== 'undefined' ? process.platform : ''

      const execSync = getExecSync()
      if (platform === 'darwin' && execSync) {
        const output = execSync('pmset -g batt', { encoding: 'utf-8', timeout: 1000 })

        // Parse: "67%; discharging" or "100%; AC Power"
        const match = output.match(/(\d+)%/)
        const chargingMatch = output.match(/(charging|charged|AC Power)/)

        if (match) {
          return {
            level: parseInt(match[1]) / 100,
            charging: !!chargingMatch
          }
        }
      }

      // Linux: Read from /sys/class/power_supply/BAT0/
      const existsSync = getExistsSync()
      const readFileSync = getReadFileSync()
      if (platform === 'linux' && existsSync && readFileSync) {
        const capacityPath = '/sys/class/power_supply/BAT0/capacity'
        const statusPath = '/sys/class/power_supply/BAT0/status'

        if (existsSync(capacityPath)) {
          const capacity = parseInt(readFileSync(capacityPath, 'utf-8'))
          const status = readFileSync(statusPath, 'utf-8').trim()

          return {
            level: capacity / 100,
            charging: status === 'Charging' || status === 'Full'
          }
        }
      }
    } catch (error) {
      // Ignore errors, use fallback
    }

    // Fallback: Assume plugged in (desktop/server)
    return { level: 1.0, charging: true }
  }
}
