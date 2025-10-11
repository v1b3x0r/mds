/**
 * Material Definition System - Name Validator
 * Implements npm-style package naming rules
 */

const RESERVED_SCOPES = ['@npm', '@node', '@official']  // @mds is our own scope
const NAME_PATTERN = /^(@[a-z0-9-]+\/)?[a-z0-9-]+$/
const MAX_LENGTH = 214

/**
 * Validate material name according to npm naming rules
 * @throws {Error} if name is invalid
 */
export function validateName(name: string): void {
  // Length check
  if (name.length > MAX_LENGTH) {
    throw new Error(`Material name too long (max ${MAX_LENGTH} characters): "${name}"`)
  }

  // Format check (lowercase, hyphens, optional scope)
  if (!NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid material name format: "${name}". ` +
      `Use: @scope/name or name (lowercase letters, numbers, hyphens only)`
    )
  }

  // Reserved scope check
  if (name.startsWith('@')) {
    const scope = name.split('/')[0]
    if (RESERVED_SCOPES.includes(scope)) {
      throw new Error(`Scope ${scope} is reserved for official use`)
    }
  }

  // No leading/trailing hyphens
  const materialName = name.includes('/') ? name.split('/')[1] : name
  if (materialName.startsWith('-') || materialName.endsWith('-')) {
    throw new Error(`Material name cannot start or end with hyphens: "${name}"`)
  }

  // No consecutive hyphens
  if (materialName.includes('--')) {
    throw new Error(`Material name cannot contain consecutive hyphens: "${name}"`)
  }
}

/**
 * Check if a name uses a reserved scope
 */
export function isReservedScope(name: string): boolean {
  if (!name.startsWith('@')) return false
  const scope = name.split('/')[0]
  return RESERVED_SCOPES.includes(scope)
}

/**
 * Extract scope from scoped name
 * @returns scope without @ symbol, or null if unscoped
 */
export function extractScope(name: string): string | null {
  if (!name.startsWith('@')) return null
  return name.split('/')[0].substring(1) // remove @
}

/**
 * Extract material name without scope
 */
export function extractMaterialName(name: string): string {
  return name.includes('/') ? name.split('/')[1] : name
}
