import { BaseContextProvider } from '@mds/7-interface/context/ContextProvider'

export interface BrowserContextConfig {
  includeActiveElement?: boolean
}

/**
 * BrowserContextProvider
 * Provides viewport/time/visibility hints for web environments without relying on Node APIs.
 */
export class BrowserContextProvider extends BaseContextProvider {
  name = 'browser'

  constructor(private readonly config: BrowserContextConfig = {}) {
    super()
  }

  getContext(): Record<string, any> {
    if (typeof window === 'undefined') {
      return { 'browser.supported': 0 }
    }

    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const context: Record<string, any> = {
      'browser.supported': 1,
      'viewport.width': window.innerWidth,
      'viewport.height': window.innerHeight,
      'viewport.scrollY': window.scrollY,
      'time.hour': hour,
      'time.minute': minute,
      'time.isNight': hour < 6 || hour >= 21 ? 1 : 0,
      'timezone.offsetMinutes': -now.getTimezoneOffset()
    }

    if (typeof document !== 'undefined') {
      context['viewport.visibility'] = document.visibilityState === 'hidden' ? 0 : 1
      if (this.config.includeActiveElement) {
        const active = document.activeElement
        if (active && active.tagName) {
          context['interaction.activeElement'] = active.tagName.toLowerCase()
        }
      }
    }

    if (typeof navigator !== 'undefined') {
      if (typeof navigator.onLine === 'boolean') {
        context['network.online'] = navigator.onLine ? 1 : 0
      }
      if (navigator.language) {
        context['browser.language'] = navigator.language
      }
    }

    return context
  }
}
