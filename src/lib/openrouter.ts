import { getAiModel } from './get-ai-model'

function getOpenRouterApiKey(): string | undefined {
    return process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
}

/**
 * Models tried in sequence when the primary model fails.
 * Ordered to prefer general instruction models that reliably return structured text.
 * Last verified against OpenRouter's live /api/v1/models catalog: October 2026.
 */
const FALLBACK_MODELS = [
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'google/gemma-4-26b-a4b-it:free',
]

const RETIRED_FREE_MODELS = new Set([
    'google/gemma-3-27b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-4-scout:free',
    'microsoft/phi-4:free',
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-r1:free',
    'qwen/qwen3-235b-a22b:free',
    'openai/gpt-oss-120b:free',
    'minimax/minimax-m2.5:free',
    'z-ai/glm-4.5-air:free',
])

/** Per-model request timeout in milliseconds. Prevents slow models blocking the chain. */
const MODEL_TIMEOUT_MS = 20_000

export type AiFailureCode = 'configuration' | 'authentication' | 'rate_limit' | 'timeout' | 'invalid_output' | 'provider_unavailable'

export class AiProviderError extends Error {
    constructor(public code: AiFailureCode, message: string, public retryAfter?: number) {
        super(message)
        this.name = 'AiProviderError'
    }
}

/** Safe public diagnostics: never expose upstream bodies, credentials or prompts. */
export function getAiFailure(error: unknown) {
    const code = error instanceof AiProviderError ? error.code : 'provider_unavailable'
    const messages: Record<AiFailureCode, string> = {
        configuration: 'AI is not configured on this server. An administrator must configure the provider key.',
        authentication: 'The AI provider rejected this server’s credentials. An administrator must check the provider configuration.',
        rate_limit: 'The AI provider is rate limited or has exhausted its quota. Please retry later.',
        timeout: 'The AI provider did not finish within the request deadline. Please retry.',
        invalid_output: 'The AI provider returned an incomplete or invalid answer. No new analysis was generated. Please retry.',
        provider_unavailable: 'The AI provider is unavailable. No new analysis was generated. Please retry later.',
    }
    return {
        code,
        error: messages[code],
        retryable: !['configuration', 'authentication'].includes(code),
        retryAfter: error instanceof AiProviderError ? error.retryAfter : undefined,
        status: code === 'rate_limit' ? 429 : code === 'timeout' ? 504 : 503,
    }
}

interface ModelCapability { supported_parameters?: string[]; reasoning?: { mandatory?: boolean } }
let catalog: Map<string, ModelCapability> | null = null
let catalogAsOf = 0
let catalogRequest: Promise<Map<string, ModelCapability>> | null = null

async function getModelCapabilities(): Promise<Map<string, ModelCapability>> {
    if (catalog && Date.now() - catalogAsOf < 3_600_000) return catalog
    if (!catalogRequest) {
        catalogRequest = (async () => {
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), 3_000)
            try {
                const response = await fetch('https://openrouter.ai/api/v1/models', { signal: controller.signal, cache: 'no-store' })
                if (!response.ok) throw new Error('Model catalog unavailable')
                const body = await response.json()
                const models = new Map<string, ModelCapability>()
                for (const model of body.data || []) if (typeof model.id === 'string') models.set(model.id, model)
                catalog = models
                catalogAsOf = Date.now()
                return models
            } catch {
                catalog = catalog || new Map<string, ModelCapability>()
                // Avoid re-fetching the catalog for every request during an outage.
                catalogAsOf = Date.now() - 3_540_000
                return catalog
            } finally {
                clearTimeout(timer)
                catalogRequest = null
            }
        })()
    }
    return catalogRequest
}

export interface OpenRouterResult {
    content: string
    model: string
}

export interface OpenRouterOptions {
    temperature?: number
    maxTokens?: number
    /** Caller label used in warn/error logs */
    caller?: string
    /** Optional preferred models tried before the admin/default model chain. */
    preferredModels?: string[]
    /** When false, only try the explicitly selected/admin model and do not fall back. */
    allowFallback?: boolean
    /** Includes model selection, all attempts, and response-body reads. */
    timeoutMs?: number
    modelTimeoutMs?: number
    maxAttempts?: number
    signal?: AbortSignal
    jsonMode?: boolean
}

/**
 * Core retry loop. Calls each model in sequence.
 * `transform` receives the raw text content and must return the final result.
 * If transform throws (e.g. bad JSON), the model is skipped and the next tried.
 * Only throws if ALL models are exhausted.
 */
async function callOpenRouterWithTransform<R>(
    prompt: string,
    transform: (content: string, model: string) => R,
    options: OpenRouterOptions = {},
): Promise<R> {
    const openRouterApiKey = getOpenRouterApiKey()

    if (!openRouterApiKey) {
        throw new AiProviderError('configuration', 'OPENROUTER_API_KEY is not configured')
    }

    const {
        temperature = 0.3,
        maxTokens = 1200,
        caller = 'openrouter',
        preferredModels = [],
        allowFallback = true,
        timeoutMs = 55_000,
        modelTimeoutMs = MODEL_TIMEOUT_MS,
        maxAttempts = 3,
        signal,
        jsonMode = false,
    } = options

    const deadline = Date.now() + timeoutMs
    if (signal?.aborted) throw new AiProviderError('timeout', 'Request cancelled')
    const [adminModel, capabilities] = await Promise.all([getAiModel(), getModelCapabilities()])
    const models = (
        allowFallback
            ? [
                ...preferredModels,
                adminModel,
                ...FALLBACK_MODELS,
            ]
            : (preferredModels.length ? preferredModels : [adminModel])
    ).filter(
        (model, index, list) =>
            Boolean(model)
            && !RETIRED_FREE_MODELS.has(model)
            && list.indexOf(model) === index,
    ).slice(0, Math.max(1, maxAttempts))

    let lastError = new AiProviderError('provider_unavailable', 'No models available')

    for (const model of models) {
        if (signal?.aborted) throw new AiProviderError('timeout', 'Request cancelled')
        const remaining = deadline - Date.now()
        if (remaining <= 0) throw new AiProviderError('timeout', 'AI request deadline exceeded')
        const controller = new AbortController()
        const abort = () => controller.abort()
        signal?.addEventListener('abort', abort, { once: true })
        const timeoutId = setTimeout(abort, Math.min(modelTimeoutMs, remaining))
        try {
            const capability = capabilities.get(model)
            const parameters = capability?.supported_parameters || []
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://geomoneytv.com',
                    'X-Title': 'GeoMoney Intelligence',
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature,
                    max_tokens: maxTokens,
                    ...(jsonMode && parameters.includes('response_format') ? { response_format: { type: 'json_object' } } : {}),
                    ...(parameters.includes('reasoning') && !capability?.reasoning?.mandatory ? { reasoning: { enabled: false } } : {}),
                }),
            })

            if (!res.ok) {
                const body = await res.text()
                if (res.status === 401 || res.status === 403) {
                    throw new AiProviderError('authentication', 'OpenRouter authentication failed')
                }
                if (res.status === 402) throw new AiProviderError('rate_limit', 'Provider credits exhausted', 60)
                const retrySeconds = Number(res.headers.get('retry-after'))
                lastError = new AiProviderError(res.status === 429 ? 'rate_limit' : 'provider_unavailable', `${model}: HTTP ${res.status}`, Number.isFinite(retrySeconds) && retrySeconds > 0 ? retrySeconds : undefined)
                let providerCode: unknown
                try { providerCode = JSON.parse(body)?.error?.code } catch { /* Not all upstream errors are JSON. */ }
                console.warn(`[${caller}] ${lastError.message}; provider code: ${typeof providerCode === 'string' || typeof providerCode === 'number' ? providerCode : 'unspecified'}`)
                continue
            }

            const data = await res.json()
            const content = typeof data.choices?.[0]?.message?.content === 'string' ? data.choices[0].message.content : ''

            if (!content.trim()) {
                lastError = new AiProviderError('invalid_output', `${model}: empty response`)
                console.warn(`callOpenRouter: empty content${allowFallback ? ', trying next.' : '.'} Model: ${model}`)
                continue
            }

            // Run the caller-supplied transform (e.g. JSON.parse).
            // If it throws the model is treated as failed and we try the next one.
            try {
                const result = transform(content, model)
                console.info(`callOpenRouter: success with model ${model} [${caller}]`)
                return result
            } catch (transformErr) {
                lastError = new AiProviderError('invalid_output', `${model}: output validation failed`)
                console.warn(`[${caller}] ${lastError.message}`, transformErr instanceof Error ? transformErr.message : 'Invalid output')
                continue
            }
        } catch (err) {
            if (err instanceof AiProviderError && ['authentication', 'configuration', 'rate_limit'].includes(err.code)) {
                throw err
            }

            lastError = new AiProviderError(controller.signal.aborted ? 'timeout' : 'provider_unavailable', `${model}: ${err instanceof Error ? err.message : String(err)}`)
            console.warn(`[${caller}] ${lastError.message}`)
        } finally {
            clearTimeout(timeoutId)
            signal?.removeEventListener('abort', abort)
        }
    }

    throw lastError
}

/**
 * Calls OpenRouter with automatic model fallback.
 * Returns the raw text content and the model that succeeded.
 */
export async function callOpenRouter(
    prompt: string,
    options: OpenRouterOptions = {},
): Promise<OpenRouterResult> {
    return callOpenRouterWithTransform(
        prompt,
        (content, model) => ({ content, model }),
        options,
    )
}

/**
 * Calls OpenRouter with automatic model fallback and parses the first JSON
 * object from the response. A malformed/truncated JSON response counts as a
 * model failure — the next fallback model is tried automatically.
 */
export async function callOpenRouterJson<T = unknown>(
    prompt: string,
    options: OpenRouterOptions & { validate?: (data: T, model: string) => T } = {},
): Promise<{ data: T; model: string }> {
    return callOpenRouterWithTransform<{ data: T; model: string }>(
        prompt,
        (content, model) => {
            const first = content.indexOf('{')
            const last = content.lastIndexOf('}')

            if (first === -1 || last === -1 || last <= first) {
                throw new Error('No JSON object found in provider response')
            }

            const data: T = JSON.parse(content.substring(first, last + 1))
            return { data: options.validate ? options.validate(data, model) : data, model }
        },
        { ...options, jsonMode: true },
    )
}

