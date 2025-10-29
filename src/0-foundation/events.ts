/**
 * MDS v4.0 - Event Utilities
 * Helper functions for behavior rule processing
 */

import type { MdsBehaviorRule } from '@mds/schema/mdspec'

/**
 * Parse time string to milliseconds
 * Supports: "500ms", "2s", "2.5s"
 */
export const parseSeconds = (s?: string): number => {
  if (!s) return 0
  if (s.endsWith('ms')) return parseFloat(s)
  if (s.endsWith('s')) return parseFloat(s) * 1000
  return parseFloat(s)
}

/**
 * Apply behavior rule effect to an entity
 * Implements simple effects from V4-UPGRADE.md spec
 */
export function applyRule(rule: MdsBehaviorRule, entity: any): void {
  if (!rule.effect) return

  // Glow effect
  if (rule.effect.includes('glow')) {
    entity.el.style.filter = 'drop-shadow(0 0 6px rgba(255,220,120,.8))'
    setTimeout(() => (entity.el.style.filter = ''), 200)
  }

  // Slide away effect
  if (rule.effect.includes('slide')) {
    entity.vx += (Math.random() - 0.5) * 2
    entity.vy += (Math.random() - 0.5) * 2
  }

  // Follow cursor effect (placeholder for external implementation)
  if (rule.effect.includes('follow.cursor')) {
    // External behavior engine can hook into this
  }

  // Emoji change
  if (rule.emoji) {
    entity.el.textContent = rule.emoji
  }
}
