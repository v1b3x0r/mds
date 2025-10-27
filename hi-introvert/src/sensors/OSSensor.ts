/**
 * OS Sensor - v6.2
 * Reads system metrics (CPU, memory, battery) and maps to environment state
 *
 * Mapping strategy:
 * - CPU temperature/usage → Environment temperature
 * - Memory usage → Environment humidity
 * - Battery level → Environment light
 * - Network activity → Environment wind
 */

import os from 'os'
import fs from 'fs'

export interface OSMetrics {
  // CPU
  cpuUsage: number        // 0..1 (average across cores)
  cpuTemp: number         // Kelvin (estimated from thermal pressure)

  // Memory
  memoryUsage: number     // 0..1 (used / total)
  memoryPressure: number  // 0..1 (how stressed is memory)

  // Battery (macOS only, fallback for others)
  batteryLevel: number    // 0..1
  batteryCharging: boolean

  // System
  uptime: number          // seconds
  loadAverage: number[]   // 1min, 5min, 15min

  // Timestamp
  timestamp: number
}

export interface EnvironmentMapping {
  temperature: number     // Kelvin (mapped from CPU)
  humidity: number        // 0..1 (mapped from memory)
  light: number           // 0..1 (mapped from battery)
  windVx: number          // pixels/s (mapped from load)
  windVy: number          // pixels/s (mapped from network)
}

export class OSSensor {
  private lastCPUInfo: os.CpuInfo[] = []
  private lastCPUTimes: { idle: number, total: number }[] = []
  private realSensors: boolean

  constructor(options: { realSensors?: boolean } = {}) {
    // v6.3: Enable real sensors by default (except in test mode)
    this.realSensors = options.realSensors ?? (process.env.NODE_ENV !== 'test')
    this.initializeCPU()
  }

  /**
   * Initialize CPU tracking
   */
  private initializeCPU(): void {
    const cpus = os.cpus()
    this.lastCPUInfo = cpus
    this.lastCPUTimes = cpus.map(cpu => ({
      idle: cpu.times.idle,
      total: Object.values(cpu.times).reduce((a, b) => a + b, 0)
    }))
  }

  /**
   * Get current OS metrics
   */
  getMetrics(): OSMetrics {
    const cpuUsage = this.getCPUUsage()
    const cpuTemp = this.estimateCPUTemperature(cpuUsage)
    const memoryUsage = this.getMemoryUsage()
    const memoryPressure = this.estimateMemoryPressure(memoryUsage)
    const battery = this.getBatteryLevel()

    return {
      cpuUsage,
      cpuTemp,
      memoryUsage,
      memoryPressure,
      batteryLevel: battery.level,
      batteryCharging: battery.charging,
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      timestamp: Date.now()
    }
  }

  /**
   * Map OS metrics to environment state
   */
  mapToEnvironment(metrics: OSMetrics): EnvironmentMapping {
    // CPU → Temperature
    // Base: 293K (20°C), Range: 283K-323K (10°C-50°C)
    const temperature = 283 + (metrics.cpuUsage * 40) + (metrics.cpuTemp - 293)

    // Memory → Humidity
    // High memory usage = high humidity (heavy, sluggish feeling)
    const humidity = metrics.memoryUsage * 0.7 + metrics.memoryPressure * 0.3

    // Battery → Light
    // Full battery = bright, Low battery = dim
    const light = metrics.batteryCharging
      ? Math.min(1, metrics.batteryLevel + 0.2)  // Charging = extra bright
      : metrics.batteryLevel * 0.9                // Draining = dimmer

    // Load average → Wind
    // High load = strong wind (turbulent system)
    const loadNormalized = Math.min(1, metrics.loadAverage[0] / os.cpus().length)
    const windVx = loadNormalized * 30 - 15  // -15 to +15 px/s
    const windVy = (metrics.memoryPressure - 0.5) * 20  // -10 to +10 px/s

    return {
      temperature,
      humidity,
      light,
      windVx,
      windVy
    }
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
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)

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
   * Estimate CPU temperature from usage
   * (Real thermal sensors require platform-specific APIs)
   */
  private estimateCPUTemperature(usage: number): number {
    // Rough estimation:
    // Idle: ~40°C (313K)
    // Full load: ~80°C (353K)
    const baseTemp = 313  // 40°C idle
    const tempRange = 40   // +40K at full load
    return baseTemp + (usage * tempRange)
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
   * Estimate memory pressure (0..1)
   * High pressure when free memory < 20% of total
   */
  private estimateMemoryPressure(usage: number): number {
    if (usage < 0.7) return 0
    if (usage < 0.85) return (usage - 0.7) / 0.15  // Linear ramp 0.7-0.85
    return 1  // Critical pressure
  }

  /**
   * Get battery level (macOS only, fallback for others)
   */
  private getBatteryLevel(): { level: number, charging: boolean } {
    try {
      // macOS: Read from pmset
      if (process.platform === 'darwin') {
        const { execSync } = require('child_process')
        const output = execSync('pmset -g batt', { encoding: 'utf-8' })

        // Parse output: "Now drawing from 'Battery Power' -InternalBattery-0 (id=12345) 67%; discharging; 3:42 remaining present: true"
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

        if (fs.existsSync(capacityPath)) {
          const capacity = parseInt(fs.readFileSync(capacityPath, 'utf-8'))
          const status = fs.readFileSync(statusPath, 'utf-8').trim()

          return {
            level: capacity / 100,
            charging: status === 'Charging' || status === 'Full'
          }
        }
      }
    } catch (error) {
      // Ignore errors, use fallback
    }

    // Fallback: Assume plugged in (simulated battery)
    return { level: 1.0, charging: true }
  }

  /**
   * Pretty print metrics for debugging
   */
  formatMetrics(metrics: OSMetrics): string {
    return `CPU: ${(metrics.cpuUsage * 100).toFixed(1)}% @ ${(metrics.cpuTemp - 273).toFixed(0)}°C
Memory: ${(metrics.memoryUsage * 100).toFixed(1)}% (pressure: ${(metrics.memoryPressure * 100).toFixed(0)}%)
Battery: ${(metrics.batteryLevel * 100).toFixed(0)}% ${metrics.batteryCharging ? '(charging)' : '(draining)'}
Load: ${metrics.loadAverage.map(l => l.toFixed(2)).join(', ')}
Uptime: ${(metrics.uptime / 3600).toFixed(1)}h`
  }
}
