import { prisma } from './prisma'

/**
 * Returns the AI model ID to use for OpenRouter calls.
 * Priority: admin panel (DB) → OPENROUTER_AI_MODEL env var → built-in default
 */
export async function getAiModel(): Promise<string> {
  const envDefault =
    process.env.OPENROUTER_AI_MODEL || 'google/gemma-3-27b-it:free'
  try {
    const setting = await prisma.siteSettings.findUnique({
      where: { key: 'ai_model' },
    })
    return setting?.value?.trim() || envDefault
  } catch (err) {
    console.warn(
      'getAiModel: DB lookup failed, falling back to env/default:',
      err instanceof Error ? err.message : String(err),
    )
    return envDefault
  }
}
