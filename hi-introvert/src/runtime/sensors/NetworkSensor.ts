/**
 * Network Sensor - v6.7
 * Reads network connectivity and latency metrics
 *
 * Mapping strategy:
 * - Connection state → Binary flag (0 = offline, 1 = online)
 * - Latency → Normalized value (0..1, good to poor)
 * - Interface count → Connection quality indicator
 */

import os from 'os'
import { execSync } from 'child_process'

export interface NetworkMetrics {
  connected: boolean
  interfaceCount: number
  hasIPv6: boolean
  latency?: number  // ms (optional, requires active ping)
  timestamp: number
}

export interface NetworkContext {
  'network.connected': number        // 0 or 1
  'network.latency': number          // 0..1 (0=fast, 1=slow)
  'network.interfaceCount': number   // Number of active interfaces
  'network.hasIPv6': number          // 0 or 1
}

export class NetworkSensor {
  private realSensors: boolean
  private latencyCache: { value?: number, expires: number } = { expires: 0 }

  constructor(options: { realSensors?: boolean } = {}) {
    // Enable real sensors by default (except in test mode)
    this.realSensors = options.realSensors ?? (process.env.NODE_ENV !== 'test')
  }

  /**
   * Get current network metrics
   */
  getMetrics(): NetworkMetrics {
    if (!this.realSensors) {
      return {
        connected: true,
        interfaceCount: 1,
        hasIPv6: false,
        timestamp: Date.now()
      }
    }

    try {
      const interfaces = os.networkInterfaces()
      const activeInterfaces = Object.values(interfaces)
        .flat()
        .filter(iface => iface && !iface.internal && iface.address)

      return {
        connected: activeInterfaces.length > 0,
        interfaceCount: activeInterfaces.length,
        hasIPv6: activeInterfaces.some(i => i && i.family === 'IPv6'),
        latency: this.getCachedLatency(),
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        connected: false,
        interfaceCount: 0,
        hasIPv6: false,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Map network metrics to world.broadcastContext() format
   * (Generic key-value context for MDM triggers)
   */
  mapToContext(metrics: NetworkMetrics): NetworkContext {
    // Normalize latency: 0 = excellent (<20ms), 1 = poor (>200ms)
    let latencyNormalized = 0
    if (metrics.latency !== undefined) {
      latencyNormalized = Math.min(1, metrics.latency / 200)
    }

    return {
      'network.connected': metrics.connected ? 1 : 0,
      'network.latency': latencyNormalized,
      'network.interfaceCount': metrics.interfaceCount,
      'network.hasIPv6': metrics.hasIPv6 ? 1 : 0
    }
  }

  /**
   * Get cached latency (TTL: 60 seconds)
   * Pings 1.1.1.1 (Cloudflare DNS) to measure latency
   */
  private getCachedLatency(): number | undefined {
    if (!this.realSensors) return undefined

    // Return cached value if not expired
    const now = Date.now()
    if (now < this.latencyCache.expires) {
      return this.latencyCache.value
    }

    // Fetch new latency
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
        const latency = parseFloat(match[1])

        // Cache for 60 seconds
        this.latencyCache = {
          value: latency,
          expires: now + 60000
        }

        return latency
      }

      return undefined
    } catch (error) {
      // Network unreachable or timeout
      this.latencyCache = { value: undefined, expires: now + 60000 }
      return undefined
    }
  }

  /**
   * Pretty print metrics for debugging
   */
  formatMetrics(metrics: NetworkMetrics): string {
    const status = metrics.connected ? 'Connected' : 'Offline'
    const latency = metrics.latency !== undefined ? `${metrics.latency.toFixed(1)}ms` : 'N/A'
    const ipv6 = metrics.hasIPv6 ? 'IPv6' : 'IPv4'

    return `Network: ${status} (${metrics.interfaceCount} interfaces, ${ipv6}, latency: ${latency})`
  }
}
