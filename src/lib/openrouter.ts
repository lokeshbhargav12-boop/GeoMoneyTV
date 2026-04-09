import { getAiModel } from './get-ai-model'

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY

/**
 * Models tried in sequence when the primary model fails.
 * Ordered by reliability on the free tier.
 */
const FALLBACK_MODELS = [
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-4-scout:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'microsoft/phi-4:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen3-235b-a22b:free',
  'mistralai/mistral-7b-instruct:free',
]

export interface OpenRouterResult {
  content: string
  model: string
}

export interface OpenRouterOptions {
  temperature?: number
  maxTokens?: number
  /** Caller label used in warn/error logs */
  caller?: string
}

/**
 * Calls OpenRouter with automatic model fallback.
 *
 * Priority: admin-panel model → FALLBACK_MODELS list.
 * Skips a model on any HTTP 4xx/5xx or empty response and tries the next.
 * Only throws if ALL models are exhausted.
 */
export async function callOpenRouter(
  prompt: string,
  options: OpenRouterOptions = {},
): Promise<OpenRouterResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const { temperature = 0.3, maxTokens = 1200, caller = 'openrouter' } = options

  const adminModel = await getAiModel()

  // Build the ordered model list: admin model first, then the fallbacks
  // (deduplicated so the admin model doesn't appear twice)
  const models = [adminModel, ...FALLBACK_MODELS.filter((m) => m !== adminModel)]

  let lastError = 'No models available'

  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://geomoney.tv',
          'X-Title': 'GeoMoney Intelligence',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        lastError = `[${caller}] ${model}: HTTP ${res.status} — ${body.slice(0, 200)}`
        console.warn(`callOpenRouter: model failed, trying next. ${lastError}`)
        continue
      }

      const data = await res.json()
      const content: string = data.choices?.[0]?.message?.content ?? ''

      if (!content.trim()) {
        lastError = `[${caller}] ${model}: empty response`
        console.warn(`callOpenRouter: empty content, trying next. Model: ${model}`)
        continue
      }

      console.info(`callOpenRouter: success with model ${model} [${caller}]`)
      return { content, model }
    } catch (err) {
      lastError = `[${caller}] ${model}: ${err instanceof Error ? err.message : String(err)}`
      console.warn(`callOpenRouter: threw, trying next. ${lastError}`)
    }
  }

  throw new Error(`All AI models exhausted. Last error: ${lastError}`)
}

/**
 * Convenience wrapper: calls OpenRouter and extracts the first JSON object
 * from the response content.  Tries fallbacks automatically.
 */
export async function callOpenRouterJson<T = unknown>(
  prompt: string,
  options: OpenRouterOptions = {},
): Promise<{ data: T; model: string }> {
  const { content, model } = await callOpenRouter(prompt, options)

  const first = content.indexOf('{')
  const last = content.lastIndexOf('}')

  if (first === -1 || last === -1 || last <= first) {
    throw new Error(
      `No JSON object found in AI response (model: ${model}). Preview: ${content.slice(0, 300)}`,
    )
  }

  const data: T = JSON.parse(content.substring(first, last + 1))
  return { data, model }
}
