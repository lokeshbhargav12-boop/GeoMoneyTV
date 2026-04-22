import { getAiModel } from './get-ai-model'

function getOpenRouterApiKey(): string | undefined {
    return process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
}

/**
 * Models tried in sequence when the primary model fails.
 * Ordered by reliability on the free tier.
 * Last verified: April 2026 — remove any model that consistently returns 404.
 */
const FALLBACK_MODELS = [
    'google/gemma-3-27b-it:free',             // Google AI Studio — 100% uptime
    'google/gemma-4-26b-a4b-it:free',          // Gemma 4 MoE — high availability
    'meta-llama/llama-3.3-70b-instruct:free',  // Meta Llama 3.3 70B — confirmed
    'nvidia/nemotron-3-super-120b-a12b:free',  // NVIDIA Nemotron 120B — confirmed
    'openai/gpt-oss-120b:free',               // OpenAI open-source 120B — confirmed
    'minimax/minimax-m2.5:free',              // MiniMax M2.5 — confirmed
    'deepseek/deepseek-r1:free',              // DeepSeek R1
    'microsoft/phi-4:free',                   // Microsoft Phi-4
    'z-ai/glm-4.5-air:free',                  // GLM 4.5 Air — confirmed backup
]

/** Per-model request timeout in milliseconds. Prevents slow models blocking the chain. */
const MODEL_TIMEOUT_MS = 20_000

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
        throw new Error('OPENROUTER_API_KEY is not configured. If you just edited .env or .env.local, restart the Next.js dev server.')
    }

    const {
        temperature = 0.3,
        maxTokens = 1200,
        caller = 'openrouter',
        preferredModels = [],
    } = options

    const adminModel = await getAiModel()
    const models = [
        ...preferredModels,
        adminModel,
        ...FALLBACK_MODELS,
    ].filter((model, index, list) => Boolean(model) && list.indexOf(model) === index)

    let lastError = 'No models available'

    for (const model of models) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS)

            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${openRouterApiKey}`,
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
            }).finally(() => clearTimeout(timeoutId))

            if (!res.ok) {
                const body = await res.text()
                if (res.status === 401 || res.status === 403) {
                    throw new Error(
                        'OpenRouter authentication failed. Check OPENROUTER_API_KEY and restart the Next.js dev server if you changed .env or .env.local.',
                    )
                }
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

            // Run the caller-supplied transform (e.g. JSON.parse).
            // If it throws the model is treated as failed and we try the next one.
            try {
                const result = transform(content, model)
                console.info(`callOpenRouter: success with model ${model} [${caller}]`)
                return result
            } catch (transformErr) {
                lastError = `[${caller}] ${model}: transform failed — ${transformErr instanceof Error ? transformErr.message : String(transformErr)}`
                console.warn(`callOpenRouter: bad output, trying next. ${lastError}`)
                continue
            }
        } catch (err) {
            if (
                err instanceof Error &&
                err.message.startsWith('OpenRouter authentication failed')
            ) {
                throw err
            }

            lastError = `[${caller}] ${model}: ${err instanceof Error ? err.message : String(err)}`
            console.warn(`callOpenRouter: threw, trying next. ${lastError}`)
        }
    }

    throw new Error(`All AI models exhausted. Last error: ${lastError}`)
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
    options: OpenRouterOptions = {},
): Promise<{ data: T; model: string }> {
    return callOpenRouterWithTransform<{ data: T; model: string }>(
        prompt,
        (content, model) => {
            const first = content.indexOf('{')
            const last = content.lastIndexOf('}')

            if (first === -1 || last === -1 || last <= first) {
                throw new Error(`No JSON object found. Preview: ${content.slice(0, 300)}`)
            }

            const data: T = JSON.parse(content.substring(first, last + 1))
            return { data, model }
        },
        options,
    )
}

