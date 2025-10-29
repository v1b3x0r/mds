/**
 * LLM Adapter helper for MDS v4.x
 * Provides an optional OpenRouter-backed bridge with shared creator context.
 */

import { DummyBridge, getLlmBridge, setLlmBridge, type LlmBridge } from '@mds/7-interface/io/bridge-llm'
import type { CreatorContext } from '@mds/7-interface/context/types'

const DEFAULT_OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'openrouter/auto'
const DEFAULT_MAX_TOKENS = 160
const DEFAULT_TEMPERATURE = 0.8
const CACHE_LIMIT = 32

export interface EnableLlmOptions {
  provider: 'openrouter' | string
  apiKey: string
  model?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  headers?: Record<string, string>
  context?: CreatorContext
  cacheSize?: number
}

interface PromptInput {
  materialId: string
  payload: Record<string, unknown>
}

let creatorContext: CreatorContext | null = null
const responseCache = new Map<string, string>()
let cacheLimit = CACHE_LIMIT

function remember(key: string, value: string): void {
  if (responseCache.has(key)) {
    responseCache.set(key, value)
    return
  }

  responseCache.set(key, value)
  if (responseCache.size > cacheLimit) {
    const iterator = responseCache.keys().next()
    if (!iterator.done) {
      responseCache.delete(iterator.value)
    }
  }
}

function fetchCached(key: string): string | undefined {
  return responseCache.get(key)
}

export function setCreatorContext(context: CreatorContext): void {
  creatorContext = JSON.parse(JSON.stringify(context))
}

export function clearCreatorContext(): void {
  creatorContext = null
}

function composeSystemContext(): string | null {
  if (!creatorContext) return null
  const { user } = creatorContext
  const segments = [
    `The creator of this world is ${user.name}.`
  ]

  if (user.signature) {
    segments.push(`Signature: ${user.signature}`)
  }
  if (user.personality) {
    segments.push(`Personality: ${user.personality}`)
  }
  if (user.value_hierarchy) {
    segments.push(`Value hierarchy: ${user.value_hierarchy}`)
  }

  segments.push('You (the entity) exist within their world simulation. When responding, you may reference this relationship naturally.')
  return `System context:\n${segments.join('\n')}`
}

function composePrompt(input: PromptInput): { system?: string; user: string } {
  const system = composeSystemContext() ?? undefined
  const { materialId, payload } = input

  const contextSummary = JSON.stringify(payload, null, 2)
  const user = `Material: ${materialId}\nContext: ${contextSummary}`

  return { system, user }
}

async function callOpenRouter(options: EnableLlmOptions, prompt: PromptInput): Promise<string> {
  const messages = [] as Array<{ role: 'system' | 'user'; content: string }>
  const composed = composePrompt(prompt)

  if (composed.system) {
    messages.push({ role: 'system', content: composed.system })
  }
  messages.push({ role: 'user', content: composed.user })

  const body = {
    model: options.model ?? DEFAULT_MODEL,
    messages,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS
  }

  const response = await fetch(options.baseUrl ?? DEFAULT_OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
      ...(options.headers ?? {})
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    console.warn('[MDS][LLM] OpenRouter request failed', response.status, await safeReadText(response))
    return ''
  }

  const json = await response.json()
  const choice = json?.choices?.[0]?.message?.content
  return typeof choice === 'string' ? choice.trim() : ''
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text()
  } catch (error) {
    return String(error)
  }
}

export function enableLLM(options: EnableLlmOptions): void {
  if (!options || !options.provider) {
    throw new Error('[MDS][LLM] enableLLM requires a provider option')
  }

  if (!options.apiKey) {
    console.warn('[MDS][LLM] enableLLM called without apiKey – falling back to dummy bridge')
    setLlmBridge(DummyBridge)
    clearCreatorContext()
    return
  }

  if (options.context) {
    setCreatorContext(options.context)
  }

  cacheLimit = options.cacheSize ?? CACHE_LIMIT
  responseCache.clear()

  if (options.provider !== 'openrouter') {
    console.warn(`[MDS][LLM] provider "${options.provider}" not recognised – defaulting to DummyBridge`)
    setLlmBridge(DummyBridge)
    return
  }

  const bridge: LlmBridge = {
    async speak(materialId, payload) {
      const cacheKey = JSON.stringify({ materialId, payload })
      const cached = fetchCached(cacheKey)
      if (cached !== undefined) {
        return cached
      }

      try {
        const text = await callOpenRouter(options, { materialId, payload })
        remember(cacheKey, text)
        return text
      } catch (error) {
        console.warn('[MDS][LLM] OpenRouter speak() error', error)
        return ''
      }
    },

    async similarity(essenceA, essenceB) {
      // Placeholder: similarity endpoint can be added in future iterations.
      if (!essenceA || !essenceB) return 0
      const cacheKey = `sim:${essenceA}::${essenceB}`
      const cached = fetchCached(cacheKey)
      if (cached !== undefined) {
        return Number(cached) || 0
      }
      // For now, return 0. Future upgrade will integrate embedding distance.
      remember(cacheKey, '0')
      return 0
    }
  }

  setLlmBridge(bridge)
}

export function getCreatorContext(): CreatorContext | null {
  return creatorContext ? JSON.parse(JSON.stringify(creatorContext)) : null
}

export function isLlmEnabled(): boolean {
  return getLlmBridge() !== DummyBridge
}

export function resetLlmAdapter(): void {
  setLlmBridge(DummyBridge)
  clearCreatorContext()
  responseCache.clear()
}
