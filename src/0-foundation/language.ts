/**
 * Shared language constants for fallback ordering across modules.
 * Prioritises Thai / Japanese / Spanish before defaulting to English.
 */
export const LANGUAGE_FALLBACK_PRIORITY = Object.freeze([
  'th',
  'ja',
  'es',
  'ko',
  'zh',
  'en'
] as const)

export type LanguageFallbackCode = typeof LANGUAGE_FALLBACK_PRIORITY[number]
