import { prisma } from './prisma'

/**
 * Returns the AI model ID to use for OpenRouter calls.
 * Priority: admin panel (DB) → OPENROUTER_AI_MODEL env var → built-in default
 */
export async function getAiModel(): Promise<string> {
    const envDefault =
        process.env.OPENROUTER_AI_MODEL || 'qwen/qwen3.8-27b:free'
    try {
        const setting = await lookupSetting()
        return setting?.value?.trim() || envDefault
    } catch (err) {
        console.warn(
            'getAiModel: DB lookup failed, falling back to env/default:',
            err instanceof Error ? err.message : String(err),
        )
        return envDefault
    }
}

// A failed/slow settings database must not consume the provider request budget.
let cachedValue: { value: string | null; expires: number } | null = null
let pending: Promise<{ value: string } | null> | null = null
async function lookupSetting(): Promise<{ value: string } | null> {
    if (cachedValue && Date.now() < cachedValue.expires) return cachedValue.value ? { value: cachedValue.value } : null
    if (!pending) {
        pending = prisma.siteSettings.findUnique({ where: { key: 'ai_model' } })
            .then((setting) => {
                cachedValue = { value: setting?.value || null, expires: Date.now() + 60_000 }
                return setting
            })
            .catch(() => {
                cachedValue = { value: null, expires: Date.now() + 30_000 }
                return null
            })
            .finally(() => { pending = null })
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
        return await Promise.race([pending, new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 1_500) })])
    } finally {
        if (timer) clearTimeout(timer)
    }
}
