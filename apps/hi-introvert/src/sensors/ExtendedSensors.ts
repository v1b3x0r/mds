/**
 * Extended OS Sensors - v6.3
 * Additional lean sensors for rich OS awareness
 *
 * Philosophy: "The machine is the body, the companion feels it"
 * - Zero external dependencies (Node.js built-in only)
 * - Cross-platform (macOS, Linux, Windows graceful degradation)
 * - Offline-first (no external APIs)
 * - Minimal overhead (<5% CPU, <10MB RAM)
 */

import os from 'os'
import fs from 'fs'
import { execSync } from 'child_process'

// ============================================================================
// Type Definitions
// ============================================================================

export interface NetworkState {
  connected: boolean
  interfaceCount: number
  hasIPv6: boolean
  latency?: number  // ms (optional, requires active ping)
}

export interface StorageMetrics {
  totalGB: number
  freeGB: number
  usagePercent: number
}

export type CircadianPhase = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening' | 'night'

export interface GitState {
  inRepo: boolean
  diffLines: number
  stagedLines: number
  hasChanges: boolean
}

export interface ExtendedMetrics {
  network: NetworkState
  storage: StorageMetrics
  circadian: CircadianPhase
  brightness: number
  processCount: number
  git: GitState
  timestamp: number
}

// ============================================================================
// Sensor Cache (Performance Optimization)
// ============================================================================

interface CacheEntry {
  value: any
  expires: number
}

class SensorCache {
  private cache = new Map<string, CacheEntry>()

  get<T>(key: string, ttlMs: number, fetcher: () => T): T {
    const cached = this.cache.get(key)
    if (cached && Date.now() < cached.expires) {
      return cached.value as T
    }

    const value = fetcher()
    this.cache.set(key, { value, expires: Date.now() + ttlMs })
    return value
  }

  clear(): void {
    this.cache.clear()
  }
}

// ============================================================================
// Extended Sensors Class
// ============================================================================

export class ExtendedSensors {
  private cache = new SensorCache()
  private realSensors: boolean

  constructor(options: { realSensors?: boolean } = {}) {
    // Enable real sensors by default (except in test mode)
    this.realSensors = options.realSensors ?? (process.env.NODE_ENV !== 'test')
  }

  // ==========================================================================
  // 1. Network State (Passive + Optional Active)
  // ==========================================================================

  /**
   * Get network connection state (passive, no overhead)
   * Checks if any non-internal network interfaces are active
   */
  getNetworkState(): NetworkState {
    if (!this.realSensors) {
      return { connected: true, interfaceCount: 1, hasIPv6: false }
    }

    try {
      const interfaces = os.networkInterfaces()
      const activeInterfaces = Object.values(interfaces)
        .flat()
        .filter(iface => iface && !iface.internal && iface.address)

      return {
        connected: activeInterfaces.length > 0,
        interfaceCount: activeInterfaces.length,
        hasIPv6: activeInterfaces.some(i => i && i.family === 'IPv6')
      }
    } catch (error) {
      return { connected: false, interfaceCount: 0, hasIPv6: false }
    }
  }

  /**
   * Measure network latency (active, optional)
   * Pings 1.1.1.1 (Cloudflare DNS) to measure latency
   * Only use if user enables "network awareness"
   */
  getNetworkLatency(): number | undefined {
    if (!this.realSensors) return undefined

    // Cache for 60 seconds (expensive operation)
    return this.cache.get('network.latency', 60000, () => {
      try {
        const platform = process.platform
        let pingCmd: string

        if (platform === 'darwin' || platform === 'linux') {
          pingCmd = 'ping -c 1 -W 1 1.1.1.1'
        } else if (platform === 'win32') {
          pingCmd = 'ping -n 1 -w 1000 1.1.1.1'
        } else {
          return undefined
        }

        const output = execSync(pingCmd, {
          encoding: 'utf-8',
          timeout: 2000,
          stdio: ['ignore', 'pipe', 'ignore']
        })

        // Parse latency from output
        // macOS/Linux: "time=12.3 ms"
        // Windows: "time=12ms" or "time<1ms"
        const match = output.match(/time[=<](\d+\.?\d*)\s*ms/i)
        if (match) {
          return parseFloat(match[1])
        }

        return undefined
      } catch (error) {
        return undefined // Network unreachable or timeout
      }
    })
  }

  // ==========================================================================
  // 2. Storage Metrics
  // ==========================================================================

  /**
   * Get storage metrics (home directory)
   * Cross-platform: macOS, Linux, Windows
   */
  getStorageMetrics(): StorageMetrics {
    if (!this.realSensors) {
      return { totalGB: 500, freeGB: 250, usagePercent: 0.5 }
    }

    // Cache for 5 minutes (slow-changing metric)
    return this.cache.get('storage', 300000, () => {
      try {
        const platform = process.platform

        if (platform === 'darwin' || platform === 'linux') {
          // Use df command (universal, no Node.js version requirement)
          const homePath = os.homedir()
          const output = execSync(`df -k "${homePath}"`, {
            encoding: 'utf-8',
            timeout: 2000
          })

          // Parse df output:
          // Filesystem  1K-blocks     Used  Available Use% Mounted on
          // /dev/disk1  500000000 250000000 250000000  50% /
          const lines = output.trim().split('\n')
          if (lines.length >= 2) {
            const parts = lines[1].split(/\s+/)
            const totalKB = parseInt(parts[1])
            const availableKB = parseInt(parts[3])

            return {
              totalGB: totalKB / (1024 * 1024),
              freeGB: availableKB / (1024 * 1024),
              usagePercent: 1 - (availableKB / totalKB)
            }
          }
        } else if (platform === 'win32') {
          // Windows: Use wmic (built-in)
          const output = execSync('wmic logicaldisk get size,freespace,caption', {
            encoding: 'utf-8',
            timeout: 2000
          })

          // Parse first drive (usually C:)
          const lines = output.trim().split('\n').filter(l => l.trim())
          if (lines.length >= 2) {
            const parts = lines[1].split(/\s+/)
            const freeBytes = parseInt(parts[1])
            const totalBytes = parseInt(parts[2])

            return {
              totalGB: totalBytes / (1024 ** 3),
              freeGB: freeBytes / (1024 ** 3),
              usagePercent: 1 - (freeBytes / totalBytes)
            }
          }
        }

        // Fallback
        return { totalGB: 500, freeGB: 250, usagePercent: 0.5 }
      } catch (error) {
        return { totalGB: 0, freeGB: 0, usagePercent: 0.5 }
      }
    })
  }

  // ==========================================================================
  // 3. Circadian Phase (Time of Day Awareness)
  // ==========================================================================

  /**
   * Get circadian rhythm phase
   * Based on hour of day (simplified biological clock)
   */
  getCircadianPhase(): CircadianPhase {
    const now = new Date()
    const hour = now.getHours()

    // Circadian rhythm (simplified)
    if (hour >= 6 && hour < 9) return 'dawn'       // Fresh start, hopeful
    if (hour >= 9 && hour < 12) return 'morning'   // Energy peak, productive
    if (hour >= 12 && hour < 14) return 'noon'     // Focus time, concentrated
    if (hour >= 14 && hour < 17) return 'afternoon' // Steady work
    if (hour >= 17 && hour < 20) return 'dusk'     // Wind down, nostalgic
    if (hour >= 20 && hour < 23) return 'evening'  // Reflective, calm
    return 'night'                                  // Rest mode, sleepy
  }

  // ==========================================================================
  // 4. Screen Brightness
  // ==========================================================================

  /**
   * Get screen brightness (0..1)
   * Platform-specific: macOS (native), Linux (sysfs), Windows (skip)
   */
  getBrightness(): number {
    if (!this.realSensors) return 0.8

    // Cache for 60 seconds (slow-changing)
    return this.cache.get('brightness', 60000, () => {
      try {
        const platform = process.platform

        if (platform === 'darwin') {
          // macOS: Use AppleScript (suppress stderr to avoid terminal pollution)
          const output = execSync(
            `osascript -e 'tell application "System Events" to get brightness of first display' 2>/dev/null`,
            { encoding: 'utf-8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'] }
          )
          const brightness = parseFloat(output.trim())
          return isNaN(brightness) ? 0.8 : brightness / 100
        } else if (platform === 'linux') {
          // Linux: Read from sysfs
          const backlightPath = '/sys/class/backlight'
          if (fs.existsSync(backlightPath)) {
            const devices = fs.readdirSync(backlightPath)
            if (devices.length > 0) {
              const device = devices[0]
              const actualPath = `${backlightPath}/${device}/actual_brightness`
              const maxPath = `${backlightPath}/${device}/max_brightness`

              if (fs.existsSync(actualPath) && fs.existsSync(maxPath)) {
                const actual = parseInt(fs.readFileSync(actualPath, 'utf-8'))
                const max = parseInt(fs.readFileSync(maxPath, 'utf-8'))
                return actual / max
              }
            }
          }
        }

        // Fallback: Assume bright
        return 0.8
      } catch (error) {
        return 0.8
      }
    })
  }

  // ==========================================================================
  // 5. Process Count
  // ==========================================================================

  /**
   * Get active process count
   * Indicates system "busyness"
   */
  getProcessCount(): number {
    if (!this.realSensors) return 100

    // Cache for 30 seconds
    return this.cache.get('processCount', 30000, () => {
      try {
        const platform = process.platform

        if (platform === 'darwin' || platform === 'linux') {
          const output = execSync('ps aux | wc -l', {
            encoding: 'utf-8',
            timeout: 1000
          })
          return parseInt(output.trim()) - 1 // Subtract header line
        } else if (platform === 'win32') {
          const output = execSync('tasklist | find /c /v ""', {
            encoding: 'utf-8',
            timeout: 1000
          })
          return parseInt(output.trim())
        }

        return 100 // Fallback
      } catch (error) {
        return 100
      }
    })
  }

  // ==========================================================================
  // 6. Git Repository State (Developer-Specific)
  // ==========================================================================

  /**
   * Get git repository state (if in repo)
   * Developer companion: knows when you're coding actively
   */
  getGitState(): GitState {
    if (!this.realSensors) {
      return { inRepo: false, diffLines: 0, stagedLines: 0, hasChanges: false }
    }

    // Cache for 2 minutes (moderate frequency)
    return this.cache.get('git', 120000, () => {
      try {
        const cwd = process.cwd()

        // Check if in git repo
        try {
          execSync('git rev-parse --is-inside-work-tree', {
            cwd,
            stdio: 'ignore',
            timeout: 500
          })
        } catch {
          return { inRepo: false, diffLines: 0, stagedLines: 0, hasChanges: false }
        }

        // Get diff size (unstaged changes)
        const diffOutput = execSync('git diff | wc -l', {
          cwd,
          encoding: 'utf-8',
          timeout: 1000
        })
        const diffLines = parseInt(diffOutput.trim())

        // Get staged diff size
        const stagedOutput = execSync('git diff --cached | wc -l', {
          cwd,
          encoding: 'utf-8',
          timeout: 1000
        })
        const stagedLines = parseInt(stagedOutput.trim())

        return {
          inRepo: true,
          diffLines,
          stagedLines,
          hasChanges: diffLines > 0 || stagedLines > 0
        }
      } catch (error) {
        return { inRepo: false, diffLines: 0, stagedLines: 0, hasChanges: false }
      }
    })
  }

  // ==========================================================================
  // Aggregate Methods
  // ==========================================================================

  /**
   * Get all extended metrics
   * One-stop shop for all sensors
   */
  getAllMetrics(): ExtendedMetrics {
    return {
      network: this.getNetworkState(),
      storage: this.getStorageMetrics(),
      circadian: this.getCircadianPhase(),
      brightness: this.getBrightness(),
      processCount: this.getProcessCount(),
      git: this.getGitState(),
      timestamp: Date.now()
    }
  }

  /**
   * Clear sensor cache
   * Useful for testing or forcing fresh reads
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Pretty print extended metrics for debugging
   */
  formatMetrics(metrics: ExtendedMetrics): string {
    return `Network: ${metrics.network.connected ? 'Connected' : 'Offline'} (${metrics.network.interfaceCount} interfaces)
Storage: ${metrics.storage.freeGB.toFixed(1)}GB free / ${metrics.storage.totalGB.toFixed(1)}GB total (${(metrics.storage.usagePercent * 100).toFixed(1)}% used)
Circadian: ${metrics.circadian} (${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')})
Brightness: ${(metrics.brightness * 100).toFixed(0)}%
Processes: ${metrics.processCount}
Git: ${metrics.git.inRepo ? `${metrics.git.diffLines} lines changed` : 'Not in repo'}`
  }
}
