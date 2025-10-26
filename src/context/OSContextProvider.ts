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

import os from 'os'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { BaseContextProvider } from './ContextProvider'

export interface OSContextConfig {
  pollInterval?: number  // milliseconds (default: 10000)
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
    const cpus = os.cpus()
    this.lastCPUTimes = cpus.map(cpu => ({
      idle: cpu.times.idle,
      total: (Object.values(cpu.times) as number[]).reduce((a, b) => a + b, 0)
    }))
  }

  /**
   * Get CPU usage (0..1)
   */
  private getCPUUsage(): number {
    const cpus = os.cpus()
    let totalUsage = 0

    cpus.forEach((cpu, i) => {
      const lastTimes = this.lastCPUTimes[i]
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
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    return (totalMem - freeMem) / totalMem
  }

  /**
   * Get battery level (macOS, Linux, fallback for others)
   */
  private getBatteryLevel(): { level: number, charging: boolean } {
    try {
      // macOS: Read from pmset
      if (process.platform === 'darwin') {
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
      if (process.platform === 'linux') {
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
