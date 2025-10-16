/**
 * Shared TypeScript interfaces for optional extensions.
 */

export interface CreatorContext {
  user: {
    name: string
    signature?: string
    personality?: string
    value_hierarchy?: string
  }
}
