/**
 * Material Definition System - Theme Manager
 */

import type { ThemeType } from '../core/types'

/**
 * Theme manager with system preference detection
 */
export class ThemeManager {
  private theme: 'light' | 'dark' | 'auto' = 'auto'
  private mediaQuery: MediaQueryList | null = null
  private listeners: Set<(theme: ThemeType) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.mediaQuery.addEventListener('change', () => {
        if (this.theme === 'auto') {
          this.notifyListeners()
        }
      })
    }
  }

  /**
   * Set theme mode
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.theme = theme
    this.notifyListeners()
  }

  /**
   * Get current effective theme (resolves 'auto')
   */
  getTheme(): ThemeType {
    if (this.theme === 'auto') {
      return this.mediaQuery?.matches ? 'dark' : 'light'
    }
    return this.theme
  }

  /**
   * Get theme mode setting (may be 'auto')
   */
  getThemeMode(): 'light' | 'dark' | 'auto' {
    return this.theme
  }

  /**
   * Subscribe to theme changes
   */
  onChange(listener: (theme: ThemeType) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(): void {
    const currentTheme = this.getTheme()
    this.listeners.forEach(listener => listener(currentTheme))
  }
}
