export function getPathValue(source: Record<string, any>, path: string): any {
  if (!path) return undefined
  const segments = path.split('.')
  let current: any = source

  for (const segment of segments) {
    if (current == null) return undefined
    current = current[segment]
  }

  return current
}

export function setPathValue(
  target: Record<string, any>,
  path: string,
  value: any
): void {
  if (!path) return
  const segments = path.split('.')
  let current: Record<string, any> = target

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    if (!current[segment] || typeof current[segment] !== 'object') {
      current[segment] = {}
    }
    current = current[segment]
  }

  current[segments[segments.length - 1]] = value
}
