import { BaseContextProvider } from '@mds/7-interface/context/ContextProvider'

export class ProcessContextProvider extends BaseContextProvider {
  name = 'process'

  getContext(): Record<string, any> {
    if (typeof process === 'undefined') {
      return { 'process.available': 0 }
    }

    const mem = typeof process.memoryUsage === 'function' ? process.memoryUsage() : undefined
    const context: Record<string, any> = {
      'process.available': 1,
      'process.pid': typeof process.pid === 'number' ? process.pid : 0,
      'process.uptime': typeof process.uptime === 'function' ? process.uptime() : 0,
      'process.argv.length': Array.isArray(process.argv) ? process.argv.length : 0,
      'process.title': process.title ?? 'process'
    }

    if (mem) {
      context['process.memory.rss'] = mem.rss ?? 0
      context['process.memory.heapUsed'] = mem.heapUsed ?? 0
      context['process.memory.heapTotal'] = mem.heapTotal ?? 0
    }

    if (process.version) {
      context['process.version.node'] = process.version
    }

    if (process.platform) {
      context['process.platform'] = process.platform
    }

    return context
  }
}
