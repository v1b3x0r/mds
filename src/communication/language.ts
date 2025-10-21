/**
 * MDS v5 Phase 6 - Language Generation System
 * LLM-powered dialogue generation based on entity essence, emotion, and context
 *
 * Design principles:
 * - Generate dialogue from entity essence + emotional state
 * - Use LLM for natural language (OpenRouter, Anthropic, OpenAI)
 * - Cache responses to avoid repeated API calls
 * - Fallback to template-based generation when LLM unavailable
 * - Support multiple languages (essence can be in any language)
 */

import type { Entity } from '../core/entity'
import type { Message } from './message'

/**
 * Language generation config
 */
export interface LanguageConfig {
  provider?: 'openrouter' | 'anthropic' | 'openai' | 'mock'
  apiKey?: string
  model?: string
  temperature?: number
  maxTokens?: number
  cacheEnabled?: boolean
  cacheTTL?: number  // milliseconds
}

/**
 * Language generation request
 */
export interface LanguageRequest {
  speaker: Entity
  listener?: Entity
  context?: string
  previousMessages?: Message[]
  intent?: string
  tone?: 'friendly' | 'formal' | 'playful' | 'serious' | 'angry' | 'sad'
}

/**
 * Language generation response
 */
export interface LanguageResponse {
  text: string
  metadata?: {
    model?: string
    tokensUsed?: number
    cached?: boolean
    latency?: number
  }
}

/**
 * Language generator
 */
export class LanguageGenerator {
  private config: Required<LanguageConfig>
  private cache: Map<string, { response: LanguageResponse, timestamp: number }> = new Map()

  constructor(config: LanguageConfig = {}) {
    this.config = {
      provider: config.provider ?? 'mock',
      apiKey: config.apiKey ?? '',
      model: config.model ?? 'anthropic/claude-3.5-sonnet',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 150,
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTTL: config.cacheTTL ?? 300000  // 5 minutes
    }
  }

  /**
   * Generate dialogue text
   */
  async generate(request: LanguageRequest): Promise<LanguageResponse> {
    const startTime = Date.now()

    // Check cache
    if (this.config.cacheEnabled) {
      const cacheKey = this.getCacheKey(request)
      const cached = this.cache.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
        return {
          ...cached.response,
          metadata: {
            ...cached.response.metadata,
            cached: true,
            latency: Date.now() - startTime
          }
        }
      }
    }

    // Generate new response
    let response: LanguageResponse

    try {
      if (this.config.provider === 'mock') {
        response = await this.generateMock(request)
      } else {
        response = await this.generateLLM(request)
      }
    } catch (error) {
      console.warn('LLM generation failed, falling back to template:', error)
      response = await this.generateTemplate(request)
    }

    response.metadata = {
      ...response.metadata,
      latency: Date.now() - startTime
    }

    // Cache response
    if (this.config.cacheEnabled) {
      const cacheKey = this.getCacheKey(request)
      this.cache.set(cacheKey, {
        response,
        timestamp: Date.now()
      })
    }

    return response
  }

  /**
   * Generate using LLM
   */
  private async generateLLM(request: LanguageRequest): Promise<LanguageResponse> {
    const prompt = this.buildPrompt(request)

    if (this.config.provider === 'openrouter') {
      return await this.callOpenRouter(prompt)
    } else if (this.config.provider === 'anthropic') {
      return await this.callAnthropic(prompt)
    } else if (this.config.provider === 'openai') {
      return await this.callOpenAI(prompt)
    }

    throw new Error(`Unsupported provider: ${this.config.provider}`)
  }

  /**
   * Build LLM prompt
   */
  private buildPrompt(request: LanguageRequest): string {
    const { speaker, listener, context, previousMessages, intent, tone } = request

    let prompt = 'You are generating dialogue for an entity in a living simulation.\n\n'

    // Entity essence
    const essence = typeof speaker.m.essence === 'string'
      ? speaker.m.essence
      : speaker.m.essence?.en || speaker.m.essence?.th || 'an entity'

    prompt += `Entity essence: ${essence}\n`

    // Emotion state
    if (speaker.emotion) {
      const { valence, arousal, dominance } = speaker.emotion
      prompt += `Emotional state: valence=${valence.toFixed(2)}, arousal=${arousal.toFixed(2)}, dominance=${dominance.toFixed(2)}\n`

      // Interpret emotion
      if (valence > 0.5 && arousal > 0.5) prompt += '(Feeling excited/joyful)\n'
      else if (valence > 0.5 && arousal < 0.5) prompt += '(Feeling calm/content)\n'
      else if (valence < -0.5 && arousal > 0.5) prompt += '(Feeling angry/fearful)\n'
      else if (valence < -0.5 && arousal < 0.5) prompt += '(Feeling sad/depressed)\n'
    }

    // Listener
    if (listener) {
      const listenerEssence = typeof listener.m.essence === 'string'
        ? listener.m.essence
        : listener.m.essence?.en || listener.m.essence?.th || 'another entity'

      prompt += `Speaking to: ${listenerEssence}\n`
    }

    // Context
    if (context) {
      prompt += `Context: ${context}\n`
    }

    // Previous messages
    if (previousMessages && previousMessages.length > 0) {
      prompt += `\nRecent conversation:\n`
      for (const msg of previousMessages.slice(-5)) {
        const senderName = msg.sender.m.material
        prompt += `${senderName}: ${msg.content}\n`
      }
    }

    // Intent
    if (intent) {
      prompt += `\nIntent: ${intent}\n`
    }

    // Tone
    if (tone) {
      prompt += `Tone: ${tone}\n`
    }

    prompt += `\nGenerate a short (1-2 sentences) dialogue response that embodies the entity's essence and emotional state. The response should be natural and conversational, not a description.\n\nDialogue:`

    return prompt
  }

  /**
   * Call OpenRouter API
   */
  private async callOpenRouter(prompt: string): Promise<LanguageResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/v1b3x0r/mds',
        'X-Title': 'MDS v5 Language Generation'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'OpenRouter API error')
    }

    return {
      text: data.choices[0].message.content.trim(),
      metadata: {
        model: data.model,
        tokensUsed: data.usage?.total_tokens
      }
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(prompt: string): Promise<LanguageResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'Anthropic API error')
    }

    return {
      text: data.content[0].text.trim(),
      metadata: {
        model: data.model,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens
      }
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<LanguageResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'OpenAI API error')
    }

    return {
      text: data.choices[0].message.content.trim(),
      metadata: {
        model: data.model,
        tokensUsed: data.usage?.total_tokens
      }
    }
  }

  /**
   * Generate using mock (for testing without API)
   */
  private async generateMock(request: LanguageRequest): Promise<LanguageResponse> {
    const { speaker } = request
    const essence = typeof speaker.m.essence === 'string'
      ? speaker.m.essence
      : speaker.m.essence?.en || speaker.m.essence?.th || 'entity'

    // Simple template-based response
    const templates = [
      `As ${essence}, I sense the field around us.`,
      `${essence} speaks: The moment feels significant.`,
      `I am ${essence}, and I understand.`
    ]

    const text = templates[Math.floor(Math.random() * templates.length)]

    return {
      text,
      metadata: {
        model: 'mock',
        tokensUsed: text.split(' ').length,
        cached: false
      }
    }
  }

  /**
   * Generate using template (fallback)
   */
  private async generateTemplate(request: LanguageRequest): Promise<LanguageResponse> {
    const { speaker, intent, tone } = request

    const essence = typeof speaker.m.essence === 'string'
      ? speaker.m.essence
      : speaker.m.essence?.en || speaker.m.essence?.th || 'an entity'

    let text = ''

    if (intent) {
      text = `${intent} (as ${essence})`
    } else if (tone === 'friendly') {
      text = `Hello! I am ${essence}.`
    } else if (tone === 'formal') {
      text = `Greetings. I represent ${essence}.`
    } else {
      text = `I am ${essence}.`
    }

    return {
      text,
      metadata: {
        model: 'template',
        tokensUsed: 0
      }
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: LanguageRequest): string {
    const { speaker, listener, context, intent, tone } = request
    const essence = speaker.m.essence
    const emotion = speaker.emotion ? `${speaker.emotion.valence.toFixed(1)},${speaker.emotion.arousal.toFixed(1)}` : ''
    const listenerKey = listener ? listener.id : 'broadcast'

    return `${essence}_${emotion}_${listenerKey}_${context || ''}_${intent || ''}_${tone || ''}`
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache) {
      if (now - value.timestamp >= this.config.cacheTTL) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * Helper: Create language generator with OpenRouter
 */
export function createOpenRouterGenerator(apiKey: string, model?: string): LanguageGenerator {
  return new LanguageGenerator({
    provider: 'openrouter',
    apiKey,
    model: model || 'anthropic/claude-3.5-sonnet'
  })
}

/**
 * Helper: Create mock generator (for testing)
 */
export function createMockGenerator(): LanguageGenerator {
  return new LanguageGenerator({ provider: 'mock' })
}
