import type { MdsMaterial, MdsLocaleOverlay } from '@mds/schema/mdspec'
import type { MdsField as MdsFieldSpec } from '@mds/schema/fieldspec'

export interface PackManifest {
  id: string
  version?: string
  notes?: string | string[]
  materials?: Record<string, MdsMaterial>
  fields?: Record<string, MdsFieldSpec>
  functions?: Record<string, unknown>
  compose?: Record<string, unknown>
  emergence?: Record<string, unknown>
  localeOverlays?: Record<string, MdsLocaleOverlay>
}

export interface PackAggregate {
  ids: string[]
  materials: Record<string, MdsMaterial>
  fields: Record<string, MdsFieldSpec>
  functions: Record<string, unknown>
  compose: Record<string, unknown>
  emergence: Record<string, unknown>
  localeOverlays: Record<string, MdsLocaleOverlay>
  notes: string[]
}

export type PackLoader = (id: string) => Promise<PackManifest | undefined>

export interface PackResolverOptions {
  loader?: PackLoader
  fetch?: (url: string) => Promise<any>
}

const packRegistry = new Map<string, PackManifest>()
const resolutionCache = new Map<string, PackAggregate>()

export class PackResolver {
  static register(id: string, manifest: PackManifest): void {
    if (!id) return
    packRegistry.set(id, manifest)
  }

  static async resolve(include: string[] = [], options: PackResolverOptions = {}): Promise<PackAggregate> {
    if (!include || include.length === 0) {
      return PackResolver.emptyAggregate()
    }

    const cacheKey = include.join('|')
    const cached = resolutionCache.get(cacheKey)
    if (cached) return cached

    const aggregate = PackResolver.emptyAggregate(include)

    for (const id of include) {
      if (!id) continue
      const manifest = await PackResolver.loadManifest(id, options)
      if (!manifest) {
        throw new Error(`PackResolver: manifest for "${id}" not found`)
      }
      PackResolver.mergeManifest(aggregate, manifest)
    }

    resolutionCache.set(cacheKey, aggregate)
    return aggregate
  }

  private static emptyAggregate(ids: string[] = []): PackAggregate {
    return {
      ids,
      materials: {},
      fields: {},
      functions: {},
      compose: {},
      emergence: {},
      localeOverlays: {},
      notes: []
    }
  }

  private static async loadManifest(id: string, options: PackResolverOptions): Promise<PackManifest | undefined> {
    if (packRegistry.has(id)) {
      return packRegistry.get(id)
    }

    if (options.loader) {
      const loaded = await options.loader(id)
      if (loaded) {
        packRegistry.set(id, loaded)
        return loaded
      }
    }

    const fetched = await PackResolver.fetchManifest(id, options.fetch)
    if (fetched) {
      packRegistry.set(id, fetched)
      return fetched
    }

    return undefined
  }

  private static async fetchManifest(id: string, fetcher?: (url: string) => Promise<any>): Promise<PackManifest | undefined> {
    const fn = fetcher ?? (typeof globalThis !== 'undefined' && typeof (globalThis as any).fetch === 'function'
      ? (globalThis as any).fetch.bind(globalThis)
      : undefined)

    if (!fn) return undefined

    const url = PackResolver.defaultPackUrl(id)
    try {
      const response = await fn(url)
      if (response && typeof response.json === 'function') {
        if ('ok' in response && response.ok === false) return undefined
        const json = await response.json()
        return PackResolver.normaliseManifest(id, json)
      }
      if (response && typeof response.text === 'function') {
        const text = await response.text()
        return PackResolver.normaliseManifest(id, JSON.parse(text))
      }
      if (typeof response === 'string') {
        return PackResolver.normaliseManifest(id, JSON.parse(response))
      }
    } catch (error) {
      console.warn(`PackResolver: failed to fetch pack "${id}" from ${url}:`, error)
    }
    return undefined
  }

  private static defaultPackUrl(id: string): string {
    const clean = id.replace(/^@/, '').replace(/[^a-zA-Z0-9/_-]/g, '')
    const path = clean.startsWith('pack/') ? clean.slice('pack/'.length) : clean.replace(/^pack\//, '')
    return `https://cdn.jsdelivr.net/npm/@v1b3x0r/mds-core/packs/${path}.json`
  }

  private static normaliseManifest(id: string, raw: any): PackManifest {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(`PackResolver: malformed manifest for "${id}"`)
    }
    return {
      id: raw.id ?? id,
      version: raw.version,
      notes: raw.notes,
      materials: raw.materials ?? raw.entities ?? {},
      fields: raw.fields ?? {},
      functions: raw.functions ?? {},
      compose: raw.compose ?? {},
      emergence: raw.emergence ?? {},
      localeOverlays: raw.localeOverlays ?? raw.locale_overlay ?? {}
    }
  }

  private static mergeManifest(target: PackAggregate, manifest: PackManifest): void {
    target.ids.push(manifest.id)

    if (manifest.notes) {
      if (Array.isArray(manifest.notes)) {
        target.notes.push(...manifest.notes)
      } else {
        target.notes.push(manifest.notes)
      }
    }

    if (manifest.materials) {
      for (const [id, material] of Object.entries(manifest.materials)) {
        if (!target.materials[id]) {
          target.materials[id] = material
        }
      }
    }

    if (manifest.fields) {
      for (const [id, field] of Object.entries(manifest.fields)) {
        if (!target.fields[id]) {
          target.fields[id] = field
        }
      }
    }

    if (manifest.functions) {
      Object.assign(target.functions, manifest.functions)
    }

    if (manifest.compose) {
      Object.assign(target.compose, manifest.compose)
    }

    if (manifest.emergence) {
      Object.assign(target.emergence, manifest.emergence)
    }

    if (manifest.localeOverlays) {
      for (const [id, overlay] of Object.entries(manifest.localeOverlays)) {
        if (!target.localeOverlays[id]) {
          target.localeOverlays[id] = overlay
        }
      }
    }
  }
}
