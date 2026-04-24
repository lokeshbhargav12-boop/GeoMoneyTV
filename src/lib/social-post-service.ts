import { prisma } from './prisma'
import { callOpenRouter } from './openrouter'
import nodemailer from 'nodemailer'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export type SocialTextProvider = 'openrouter' | 'huggingface'
export type SocialImageProvider = 'openrouter-svg' | 'huggingface' | 'webhook' | 'none'

export interface SocialPostTemplate {
    id: string
    name: string
    body: string
    imageStyle: string
}

export interface SocialPostGeneratorSettings {
    provider: SocialTextProvider
    textModel: string
    imageProvider: SocialImageProvider
    imageModel: string
    activeTemplateId: string
    templates: SocialPostTemplate[]
}

interface GenerationOptions {
    settings?: Partial<SocialPostGeneratorSettings>
    templateId?: string
    retryCount?: number
}

const SOCIAL_POST_SETTINGS_KEY = 'social_post_generator_settings'

export const OPENROUTER_FREE_MODELS = [
    'google/gemma-3-27b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'deepseek/deepseek-r1:free',
]

export const HUGGINGFACE_FREE_TEXT_MODELS = [
    'Qwen/Qwen2.5-72B-Instruct',
    'HuggingFaceH4/zephyr-7b-beta',
    'mistralai/Mistral-7B-Instruct-v0.3',
]

export const HUGGINGFACE_FREE_IMAGE_MODELS = [
    'black-forest-labs/FLUX.1-schnell',
]

interface HuggingFaceModelSelection {
    modelId: string
    provider?: string
}

interface HuggingFaceProviderMapping {
    status: string
    providerId: string
    task: string
}

const SUPPORTED_HF_IMAGE_PROVIDERS = [
    'hf-inference',
    'fal-ai',
    'black-forest-labs',
] as const

const HF_IMAGE_PROVIDER_PREFERENCE = [
    'hf-inference',
    'fal-ai',
    'black-forest-labs',
]

const hfProviderMappingCache = new Map<string, Promise<Record<string, HuggingFaceProviderMapping>>>()

function parseHuggingFaceModelSelection(input: string): HuggingFaceModelSelection {
    const raw = input.trim()
    if (!raw) {
        throw new Error('Hugging Face model ID is required')
    }

    const providerPrefixed = raw.match(/^([a-z0-9-]+):(\S.+)$/i)
    if (providerPrefixed) {
        return {
            provider: providerPrefixed[1],
            modelId: providerPrefixed[2].trim(),
        }
    }

    if (/^https?:\/\//i.test(raw)) {
        try {
            const url = new URL(raw)
            const segments = url.pathname.split('/').filter(Boolean)
            if (url.hostname.includes('huggingface.co') && segments.length >= 2) {
                const owner = segments[0]
                const model = segments[1]
                return {
                    provider: url.searchParams.get('inference_provider')?.trim() || 'hf-inference',
                    modelId: `${owner}/${model}`,
                }
            }
        } catch {
            // Fall through to raw model handling.
        }
    }

    return {
        modelId: raw,
    }
}

async function fetchHuggingFaceProviderMappings(modelId: string): Promise<Record<string, HuggingFaceProviderMapping>> {
    const cached = hfProviderMappingCache.get(modelId)
    if (cached) {
        return cached
    }

    const request = (async () => {
        const [owner, ...rest] = modelId.split('/')
        const modelPath = [owner, ...rest].map((segment) => encodeURIComponent(segment)).join('/')
        const res = await fetch(`https://huggingface.co/api/models/${modelPath}?expand=inferenceProviderMapping`)
        if (!res.ok) {
            const body = await res.text()
            throw new Error(`Failed to load Hugging Face provider mapping for ${modelId} (${res.status}): ${body.slice(0, 200)}`)
        }

        const data = await res.json()
        return (data.inferenceProviderMapping || {}) as Record<string, HuggingFaceProviderMapping>
    })()

    hfProviderMappingCache.set(modelId, request)
    return request
}

async function resolveHuggingFaceImageSelection(selection: HuggingFaceModelSelection): Promise<Required<HuggingFaceModelSelection> & { providerId: string }> {
    const mappings = await fetchHuggingFaceProviderMappings(selection.modelId)
    const imageMappings = Object.entries(mappings).filter(([, mapping]) => mapping?.task === 'text-to-image')

    if (!imageMappings.length) {
        throw new Error(`Model ${selection.modelId} does not expose any Hugging Face text-to-image inference providers.`)
    }

    const requestedProvider = selection.provider?.trim()
    if (requestedProvider) {
        const requestedMapping = mappings[requestedProvider]

        if (!requestedMapping) {
            throw new Error(
                `Model ${selection.modelId} is not available on Hugging Face provider ${requestedProvider}. `
                + `Available image providers: ${imageMappings.map(([provider]) => provider).join(', ')}`,
            )
        }

        if (requestedMapping.task !== 'text-to-image') {
            throw new Error(`Model ${selection.modelId} is not mapped for text-to-image on provider ${requestedProvider}.`)
        }

        if (!SUPPORTED_HF_IMAGE_PROVIDERS.includes(requestedProvider as typeof SUPPORTED_HF_IMAGE_PROVIDERS[number])) {
            throw new Error(
                `Provider ${requestedProvider} is not wired in this app yet for image generation. `
                + `Supported routed providers: ${SUPPORTED_HF_IMAGE_PROVIDERS.join(', ')}.`,
            )
        }

        return {
            modelId: selection.modelId,
            provider: requestedProvider,
            providerId: requestedMapping.providerId,
        }
    }

    for (const provider of HF_IMAGE_PROVIDER_PREFERENCE) {
        const mapping = mappings[provider]
        if (mapping?.task === 'text-to-image') {
            return {
                modelId: selection.modelId,
                provider,
                providerId: mapping.providerId,
            }
        }
    }

    throw new Error(
        `Model ${selection.modelId} is available on Hugging Face, but only through providers this app does not support yet. `
        + `Available image providers: ${imageMappings.map(([provider]) => provider).join(', ')}.`,
    )
}

async function downloadImageToUploads(bytes: Buffer): Promise<string> {
    const outputDir = path.join(process.cwd(), 'public', 'uploads', 'social-posts')
    await mkdir(outputDir, { recursive: true })

    const filename = `social-post-${Date.now()}.png`
    await writeFile(path.join(outputDir, filename), bytes)

    return `/uploads/social-posts/${filename}`
}

async function downloadRemoteImage(url: string): Promise<Buffer> {
    const res = await fetch(url)
    if (!res.ok) {
        throw new Error(`Failed to download generated image (${res.status}) from ${url}`)
    }

    return Buffer.from(await res.arrayBuffer())
}

async function pollBlackForestLabsImage(pollingUrl: string): Promise<Buffer> {
    for (let attempt = 0; attempt < 6; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const pollRes = await fetch(pollingUrl, {
            headers: { 'Content-Type': 'application/json' },
        })
        if (!pollRes.ok) {
            const body = await pollRes.text()
            throw new Error(`Black Forest Labs polling failed (${pollRes.status}): ${body.slice(0, 200)}`)
        }

        const pollData = await pollRes.json()
        if (pollData.status === 'Ready' && pollData.result?.sample) {
            return downloadRemoteImage(pollData.result.sample)
        }
    }

    throw new Error('Black Forest Labs image generation timed out before a sample image was ready.')
}

export const OPENROUTER_INFOGRAPHIC_MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    ...OPENROUTER_FREE_MODELS.filter((model) => model !== 'meta-llama/llama-3.3-70b-instruct:free'),
]

const INFOGRAPHIC_WIDTH = 1080
const INFOGRAPHIC_HEIGHT = 1350

const DEFAULT_TEMPLATES: SocialPostTemplate[] = [
    {
        id: 'market-flash',
        name: 'Market Flash',
        body: 'Lead with the single most urgent macro or geopolitical signal. Give one sharp takeaway for X, then expand with why it matters for flows, supply chains, or strategic materials.',
        imageStyle: 'Editorial newsroom aesthetic, dark background, gold accents, global market map, premium financial media composition.',
    },
    {
        id: 'materials-watch',
        name: 'Critical Materials Watch',
        body: 'Center the post on rare earths, processing chokepoints, export controls, or strategic material pricing. Sound analytical and operator-focused, not promotional.',
        imageStyle: 'Industrial strategic materials collage, refined documentary look, mines, shipping routes, data overlays, cinematic but realistic.',
    },
    {
        id: 'geo-brief',
        name: 'Geo Brief',
        body: 'Frame the post like a concise intelligence brief. Explain the event, the transmission mechanism, and what to watch next within 24 to 72 hours.',
        imageStyle: 'Geopolitical intelligence briefing board, maps, redaction layers, modern editorial magazine style, realistic and clean.',
    },
]

const DEFAULT_GENERATOR_SETTINGS: SocialPostGeneratorSettings = {
    provider: 'openrouter',
    textModel: OPENROUTER_FREE_MODELS[0],
    imageProvider: 'openrouter-svg',
    imageModel: OPENROUTER_INFOGRAPHIC_MODELS[0],
    activeTemplateId: DEFAULT_TEMPLATES[0].id,
    templates: DEFAULT_TEMPLATES,
}

function mergeGeneratorSettings(
    raw?: Partial<SocialPostGeneratorSettings> | null,
): SocialPostGeneratorSettings {
    const templates = Array.isArray(raw?.templates) && raw?.templates.length
        ? raw.templates
            .filter((template): template is SocialPostTemplate => Boolean(template?.id && template?.name && template?.body))
            .map((template) => ({
                id: template.id,
                name: template.name,
                body: template.body,
                imageStyle: template.imageStyle || '',
            }))
        : DEFAULT_TEMPLATES

    const activeTemplateId = templates.some((template) => template.id === raw?.activeTemplateId)
        ? raw!.activeTemplateId!
        : templates[0].id

    return {
        provider: raw?.provider === 'huggingface' ? 'huggingface' : 'openrouter',
        textModel: raw?.textModel?.trim() || DEFAULT_GENERATOR_SETTINGS.textModel,
        imageProvider:
            raw?.imageProvider === 'openrouter-svg'
                || raw?.imageProvider === 'webhook'
                || raw?.imageProvider === 'none'
                || raw?.imageProvider === 'huggingface'
                ? raw.imageProvider
                : DEFAULT_GENERATOR_SETTINGS.imageProvider,
        imageModel: raw?.imageModel?.trim() || DEFAULT_GENERATOR_SETTINGS.imageModel,
        activeTemplateId,
        templates,
    }
}

export async function getSocialPostGeneratorSettings(): Promise<SocialPostGeneratorSettings> {
    const setting = await prisma.siteSettings.findUnique({ where: { key: SOCIAL_POST_SETTINGS_KEY } })
    if (!setting?.value) {
        return DEFAULT_GENERATOR_SETTINGS
    }

    try {
        return mergeGeneratorSettings(JSON.parse(setting.value))
    } catch {
        return DEFAULT_GENERATOR_SETTINGS
    }
}

export async function saveSocialPostGeneratorSettings(
    settings: Partial<SocialPostGeneratorSettings>,
): Promise<SocialPostGeneratorSettings> {
    const merged = mergeGeneratorSettings(settings)
    await prisma.siteSettings.upsert({
        where: { key: SOCIAL_POST_SETTINGS_KEY },
        update: { value: JSON.stringify(merged) },
        create: { key: SOCIAL_POST_SETTINGS_KEY, value: JSON.stringify(merged) },
    })
    return merged
}

function getTemplateById(settings: SocialPostGeneratorSettings, templateId?: string): SocialPostTemplate {
    return (
        settings.templates.find((template) => template.id === templateId) ||
        settings.templates.find((template) => template.id === settings.activeTemplateId) ||
        settings.templates[0]
    )
}

async function callHuggingFaceChat(prompt: string, model: string): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN
    if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY or HF_TOKEN is not configured')
    }

    const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500,
        }),
    })

    if (!res.ok) {
        const body = await res.text()
        throw new Error(`Hugging Face chat failed (${res.status}): ${body.slice(0, 200)}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content?.trim()) {
        throw new Error('Hugging Face returned empty content')
    }

    return content
}

async function generateImageWithHuggingFace(prompt: string, model: string): Promise<Buffer> {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN
    if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY or HF_TOKEN is not configured')
    }

    const parsedSelection = parseHuggingFaceModelSelection(model)
    const selection = await resolveHuggingFaceImageSelection(parsedSelection)

    if (selection.provider === 'hf-inference') {
        const res = await fetch(`https://router.huggingface.co/hf-inference/models/${encodeURIComponent(selection.modelId)}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    guidance_scale: 5.5,
                    num_inference_steps: 18,
                },
            }),
        })

        if (!res.ok) {
            const body = await res.text()
            throw new Error(
                `Hugging Face image failed (${res.status}) for ${selection.provider}:${selection.modelId}. `
                + `The model may be unsupported by that inference provider, gated, or deprecated. ${body.slice(0, 220)}`,
            )
        }

        return Buffer.from(await res.arrayBuffer())
    }

    if (selection.provider === 'fal-ai') {
        const res = await fetch(`https://router.huggingface.co/fal-ai/${selection.providerId}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                image_size: {
                    width: INFOGRAPHIC_WIDTH,
                    height: INFOGRAPHIC_HEIGHT,
                },
                guidance_scale: 5.5,
                num_inference_steps: 18,
            }),
        })

        if (!res.ok) {
            const body = await res.text()
            throw new Error(
                `Hugging Face image failed (${res.status}) for ${selection.provider}:${selection.modelId}. `
                + `The mapped provider route ${selection.providerId} rejected the request. ${body.slice(0, 220)}`,
            )
        }

        const data = await res.json()
        const imageUrl = data.images?.[0]?.url
        if (!imageUrl) {
            throw new Error(`fal-ai did not return an image URL for ${selection.modelId}.`)
        }

        return downloadRemoteImage(imageUrl)
    }

    if (selection.provider === 'black-forest-labs') {
        const res = await fetch(`https://router.huggingface.co/black-forest-labs/v1/${selection.providerId}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                width: INFOGRAPHIC_WIDTH,
                height: INFOGRAPHIC_HEIGHT,
                steps: 18,
                guidance: 5.5,
            }),
        })

        if (!res.ok) {
            const body = await res.text()
            throw new Error(
                `Hugging Face image failed (${res.status}) for ${selection.provider}:${selection.modelId}. `
                + `The mapped provider route ${selection.providerId} rejected the request. ${body.slice(0, 220)}`,
            )
        }

        const data = await res.json()
        if (!data.polling_url) {
            throw new Error(`Black Forest Labs did not return a polling URL for ${selection.modelId}.`)
        }

        return pollBlackForestLabsImage(data.polling_url)
    }

    throw new Error(`Hugging Face image provider ${selection.provider} is not supported by this app yet.`)
}

function getSvgMarkup(content: string): string {
    const trimmed = content.trim().replace(/^```svg\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
    const start = trimmed.indexOf('<svg')
    const end = trimmed.lastIndexOf('</svg>')

    if (start === -1) {
        throw new Error(`OpenRouter did not return valid SVG markup. Preview: ${trimmed.slice(0, 200)}`)
    }

    if (end === -1 || end <= start) {
        return `${trimmed.slice(start)}\n</svg>`
    }

    return trimmed.slice(start, end + '</svg>'.length)
}

const SVG_SELF_CLOSING_TAGS = new Set([
    'animate',
    'animateMotion',
    'animateTransform',
    'circle',
    'ellipse',
    'feBlend',
    'feColorMatrix',
    'feComponentTransfer',
    'feComposite',
    'feFlood',
    'feGaussianBlur',
    'feImage',
    'feMergeNode',
    'feMorphology',
    'feOffset',
    'feTurbulence',
    'image',
    'line',
    'mpath',
    'path',
    'polygon',
    'polyline',
    'rect',
    'stop',
    'use',
])

function rebalanceSvgMarkup(svg: string): string {
    const stack: string[] = []
    const tagPattern = /<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?>/g

    for (let match = tagPattern.exec(svg); match; match = tagPattern.exec(svg)) {
        const fullTag = match[0]
        const tagName = match[1].toLowerCase()

        if (tagName === 'svg') {
            continue
        }

        const isClosingTag = fullTag.startsWith('</')
        const isSelfClosingTag = fullTag.endsWith('/>') || SVG_SELF_CLOSING_TAGS.has(tagName)

        if (!isClosingTag && !isSelfClosingTag) {
            stack.push(tagName)
            continue
        }

        if (!isClosingTag) {
            continue
        }

        const openTagIndex = stack.lastIndexOf(tagName)
        if (openTagIndex === -1) {
            continue
        }

        stack.length = openTagIndex
    }

    if (!stack.length) {
        return svg
    }

    const closingTags = stack.slice().reverse().map((tagName) => `</${tagName}>`).join('')

    if (/<\/svg>\s*$/i.test(svg)) {
        return svg.replace(/<\/svg>\s*$/i, `${closingTags}</svg>`)
    }

    return `${svg}${closingTags}`
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function sanitizeSvgColorAttributes(svg: string): string {
    const opacityAttributeFor = (attributeName: string): string | null => {
        switch (attributeName) {
            case 'fill':
                return 'fill-opacity'
            case 'stroke':
                return 'stroke-opacity'
            case 'stop-color':
                return 'stop-opacity'
            case 'flood-color':
                return 'flood-opacity'
            default:
                return null
        }
    }

    return svg.replace(
        /\s(fill|stroke|stop-color|flood-color)="rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*((?:0|1)(?:\.\d+)?)\s*\)"/gi,
        (_match, attributeName: string, red: string, green: string, blue: string, alpha: string) => {
            const opacityAttribute = opacityAttributeFor(attributeName.toLowerCase())
            const opacitySuffix = opacityAttribute ? ` ${opacityAttribute}="${alpha}"` : ''
            return ` ${attributeName}="rgb(${red},${green},${blue})"${opacitySuffix}`
        },
    )
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
    const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
        const nextLine = currentLine ? `${currentLine} ${word}` : word
        if (nextLine.length <= maxCharsPerLine) {
            currentLine = nextLine
            continue
        }

        if (currentLine) {
            lines.push(currentLine)
        }
        currentLine = word

        if (lines.length >= maxLines) {
            break
        }
    }

    if (currentLine && lines.length < maxLines) {
        lines.push(currentLine)
    }

    if (words.length && lines.length === maxLines) {
        const joined = lines.join(' ')
        const original = words.join(' ')
        if (joined.length < original.length) {
            lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?-]*$/, '')}...`
        }
    }

    return lines.length ? lines : ['GeoMoney market intelligence update']
}

function sanitizeGraphicText(text: string, maxChars: number): string {
    return text
        .replace(/https?:\/\/\S+/gi, ' ')
        .replace(/#[\w-]+/g, ' ')
        .replace(/[•▪◦●]/g, ' ')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxChars)
        .trim()
}

function buildGraphicCopy(
    topic: string,
    template: SocialPostTemplate,
    text: { shortText: string; longText: string },
): { headline: string; support: string } {
    const headline = sanitizeGraphicText(
        text.shortText || topic || template.name || 'GeoMoney market intelligence update',
        140,
    ) || 'GeoMoney market intelligence update'

    const contextSource = sanitizeGraphicText(text.longText || topic || headline, 320)
    const supportSentences = contextSource
        .split(/[.!?]+\s*/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence && sentence.toLowerCase() !== headline.toLowerCase())
        .slice(0, 2)

    return {
        headline,
        support: supportSentences.join(' | ') || sanitizeGraphicText(template.name, 80) || 'Global macro and strategic materials update',
    }
}

function detectImageMime(bytes: Buffer): string {
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return 'image/png'
    }

    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return 'image/jpeg'
    }

    if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
        return 'image/webp'
    }

    return 'image/png'
}

async function composeIllustrativeSocialCard(
    backgroundBytes: Buffer,
    template: SocialPostTemplate,
    text: { shortText: string; longText: string },
): Promise<string> {
    const { Resvg } = await import('@resvg/resvg-js')
    const mimeType = detectImageMime(backgroundBytes)
    const dataUri = `data:${mimeType};base64,${backgroundBytes.toString('base64')}`
    const graphicCopy = buildGraphicCopy(template.name, template, text)
    const headlineLines = wrapText(graphicCopy.headline, 23, 4)
    const bodyLines = wrapText(graphicCopy.support, 44, 2)
    const headlineStartY = 220
    const bodyStartY = headlineStartY + (headlineLines.length * 72) + 42

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${INFOGRAPHIC_WIDTH}" height="${INFOGRAPHIC_HEIGHT}" viewBox="0 0 ${INFOGRAPHIC_WIDTH} ${INFOGRAPHIC_HEIGHT}">
  <defs>
        <linearGradient id="scrimGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(5,10,20,0.08)"/>
            <stop offset="55%" stop-color="rgba(7,12,24,0.34)"/>
            <stop offset="100%" stop-color="rgba(4,8,18,0.88)"/>
    </linearGradient>
        <linearGradient id="headlinePanel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="rgba(15,23,42,0.82)"/>
            <stop offset="100%" stop-color="rgba(15,23,42,0.52)"/>
    </linearGradient>
        <linearGradient id="chartPanel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="rgba(8,15,28,0.92)"/>
            <stop offset="100%" stop-color="rgba(15,23,42,0.72)"/>
        </linearGradient>
        <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(245,158,11,0.0)"/>
            <stop offset="20%" stop-color="rgba(245,158,11,0.55)"/>
            <stop offset="80%" stop-color="rgba(245,158,11,0.18)"/>
            <stop offset="100%" stop-color="rgba(245,158,11,0.0)"/>
        </linearGradient>
        <radialGradient id="glowAccent" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(245,158,11,0.25)"/>
            <stop offset="100%" stop-color="rgba(245,158,11,0)"/>
        </radialGradient>
  </defs>

    <!-- 1. Background image -->
  <image href="${dataUri}" x="0" y="0" width="${INFOGRAPHIC_WIDTH}" height="${INFOGRAPHIC_HEIGHT}" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="0" width="${INFOGRAPHIC_WIDTH}" height="${INFOGRAPHIC_HEIGHT}" fill="url(#scrimGradient)"/>

    <!-- 2. Visual overlays -->
    <g opacity="0.95">
        <rect x="56" y="64" width="968" height="1222" rx="38" fill="none" stroke="rgba(255,255,255,0.08)"/>
        <rect x="72" y="82" width="520" height="28" rx="14" fill="rgba(15,23,42,0.74)"/>
        <circle cx="868" cy="314" r="170" fill="url(#glowAccent)"/>
        <path d="M710 274 C 796 202, 892 188, 982 232" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="3"/>
        <path d="M690 338 C 786 272, 900 260, 1000 310" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
        <path d="M640 860 L 1006 860" stroke="url(#accentLine)" stroke-width="2"/>
        <path d="M640 890 L 972 890" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <path d="M640 920 L 946 920" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
        <rect x="758" y="190" width="194" height="194" rx="26" fill="rgba(15,23,42,0.32)" stroke="rgba(255,255,255,0.08)"/>
        <rect x="784" y="216" width="142" height="142" rx="20" fill="rgba(15,23,42,0.52)" stroke="rgba(255,255,255,0.12)"/>
        <circle cx="854" cy="286" r="34" fill="rgba(245,158,11,0.95)"/>
        <path d="M838 286 L 854 270 L 878 294" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    </g>

    <!-- 3. Charts -->
    <g transform="translate(72 942)">
        <rect x="0" y="0" width="936" height="230" rx="26" fill="url(#chartPanel)" stroke="rgba(255,255,255,0.10)"/>
        <text x="32" y="42" fill="#f59e0b" font-size="20" font-family="Arial, Helvetica, sans-serif" font-weight="700">Market signal</text>
        <text x="32" y="74" fill="#cbd5e1" font-size="18" font-family="Arial, Helvetica, sans-serif">Layered data overlay for strategic materials and macro risk</text>
        <path d="M36 172 C 120 138, 196 154, 270 116 S 430 130, 504 102 S 676 126, 758 84 S 854 88, 900 58" fill="none" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>
        <path d="M36 186 L 900 186" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
        <rect x="36" y="118" width="22" height="54" rx="11" fill="rgba(255,255,255,0.12)"/>
        <rect x="74" y="98" width="22" height="74" rx="11" fill="rgba(255,255,255,0.12)"/>
        <rect x="112" y="132" width="22" height="40" rx="11" fill="rgba(255,255,255,0.12)"/>
        <circle cx="270" cy="116" r="7" fill="#f59e0b"/>
        <circle cx="504" cy="102" r="7" fill="#f59e0b"/>
        <circle cx="758" cy="84" r="7" fill="#f59e0b"/>
        <rect x="690" y="26" width="214" height="50" rx="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)"/>
        <text x="716" y="58" fill="#f8fafc" font-size="18" font-family="Arial, Helvetica, sans-serif" font-weight="700">GeoMoney intelligence layer</text>
    </g>

    <!-- 4. Text -->
    <rect x="72" y="112" width="640" height="${Math.max(228, 92 + (headlineLines.length * 72) + (bodyLines.length * 34))}" rx="30" fill="url(#headlinePanel)" stroke="rgba(255,255,255,0.10)"/>
    <text x="108" y="154" fill="#f59e0b" font-size="22" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeXml(template.name.toUpperCase())}</text>

  ${headlineLines.map((line, index) => (
        `<text x="108" y="${headlineStartY + (index * 72)}" fill="#ffffff" font-size="60" font-family="Arial, Helvetica, sans-serif" font-weight="800">${escapeXml(line)}</text>`
    )).join('')}

  ${bodyLines.map((line, index) => (
        `<text x="108" y="${bodyStartY + (index * 34)}" fill="#dbe4f0" font-size="26" font-family="Arial, Helvetica, sans-serif" font-weight="500">${escapeXml(line)}</text>`
    )).join('')}

    <rect x="72" y="1236" width="936" height="1.5" fill="rgba(255,255,255,0.14)"/>
    <text x="72" y="1274" fill="#f8fafc" font-size="28" font-family="Arial, Helvetica, sans-serif" font-weight="700">GeoMoney</text>
    <text x="238" y="1274" fill="#cbd5e1" font-size="20" font-family="Arial, Helvetica, sans-serif">Global macro, geopolitics, and strategic materials</text>
</svg>`.trim()

    return downloadImageToUploads(
        new Resvg(sanitizeSvgColorAttributes(svg), {
            fitTo: { mode: 'width', value: INFOGRAPHIC_WIDTH },
        }).render().asPng(),
    )
}

function normalizeSvgMarkup(svg: string): string {
    const sanitized = svg
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')

    const rebalanced = rebalanceSvgMarkup(sanitized)

    return rebalanced.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
        const hasXmlns = /\sxmlns=/.test(attrs)
        const hasWidth = /\swidth=/.test(attrs)
        const hasHeight = /\sheight=/.test(attrs)
        const hasViewBox = /\sviewBox=/.test(attrs)

        return `<svg${attrs}${hasXmlns ? '' : ' xmlns="http://www.w3.org/2000/svg"'}${hasWidth ? '' : ` width="${INFOGRAPHIC_WIDTH}"`}${hasHeight ? '' : ` height="${INFOGRAPHIC_HEIGHT}"`}${hasViewBox ? '' : ` viewBox="0 0 ${INFOGRAPHIC_WIDTH} ${INFOGRAPHIC_HEIGHT}"`}>`
    })
}

function buildFallbackInfographicBackground(template: SocialPostTemplate): string {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${INFOGRAPHIC_WIDTH}" height="${INFOGRAPHIC_HEIGHT}" viewBox="0 0 ${INFOGRAPHIC_WIDTH} ${INFOGRAPHIC_HEIGHT}">
    <defs>
        <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#07111f"/>
            <stop offset="52%" stop-color="#10253d"/>
            <stop offset="100%" stop-color="#26130a"/>
        </linearGradient>
        <radialGradient id="signalGlow" cx="78%" cy="24%" r="42%">
            <stop offset="0%" stop-color="rgba(245,158,11,0.34)"/>
            <stop offset="100%" stop-color="rgba(245,158,11,0)"/>
        </radialGradient>
        <linearGradient id="gridStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(255,255,255,0.03)"/>
            <stop offset="50%" stop-color="rgba(255,255,255,0.12)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.03)"/>
        </linearGradient>
    </defs>

    <rect width="${INFOGRAPHIC_WIDTH}" height="${INFOGRAPHIC_HEIGHT}" fill="url(#bgGradient)"/>
    <rect width="${INFOGRAPHIC_WIDTH}" height="${INFOGRAPHIC_HEIGHT}" fill="url(#signalGlow)"/>
    <circle cx="872" cy="282" r="192" fill="rgba(245,158,11,0.08)"/>
    <circle cx="894" cy="304" r="128" fill="rgba(255,255,255,0.03)"/>
    <path d="M604 214 C 726 140, 860 136, 1000 236" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3"/>
    <path d="M560 284 C 694 214, 840 212, 1006 318" fill="none" stroke="rgba(245,158,11,0.18)" stroke-width="2"/>

    <g opacity="0.55">
        <path d="M70 904 H1010" stroke="url(#gridStroke)" stroke-width="2"/>
        <path d="M70 972 H1010" stroke="url(#gridStroke)" stroke-width="1.5"/>
        <path d="M70 1040 H1010" stroke="url(#gridStroke)" stroke-width="1.5"/>
        <path d="M70 1108 H1010" stroke="url(#gridStroke)" stroke-width="1.5"/>
        <path d="M150 874 V1170" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <path d="M362 874 V1170" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <path d="M574 874 V1170" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <path d="M786 874 V1170" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </g>

    <g>
        <rect x="72" y="76" width="936" height="1198" rx="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
        <rect x="72" y="76" width="592" height="362" rx="34" fill="rgba(7,17,31,0.34)"/>
        <rect x="72" y="942" width="936" height="232" rx="28" fill="rgba(7,17,31,0.44)" stroke="rgba(255,255,255,0.10)"/>
        <rect x="756" y="180" width="196" height="196" rx="26" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)"/>
        <rect x="782" y="206" width="144" height="144" rx="22" fill="rgba(7,17,31,0.36)" stroke="rgba(255,255,255,0.08)"/>
        <circle cx="854" cy="278" r="34" fill="#f59e0b" opacity="0.92"/>
        <path d="M836 278 L 852 262 L 876 288" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.76"/>
    </g>

    <g>
        <path d="M108 1122 C 188 1042, 270 1088, 356 1004 S 542 1038, 630 962 S 804 958, 918 884" fill="none" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/>
        <circle cx="356" cy="1004" r="8" fill="#f59e0b"/>
        <circle cx="630" cy="962" r="8" fill="#f59e0b"/>
        <circle cx="918" cy="884" r="8" fill="#f59e0b"/>
    </g>

    <text x="108" y="146" fill="#f59e0b" font-size="24" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeXml(template.name.toUpperCase())}</text>
</svg>`.trim()
}

async function renderSvgMarkupToPng(svg: string): Promise<Buffer> {
    const { Resvg } = await import('@resvg/resvg-js')

    return new Resvg(sanitizeSvgColorAttributes(svg), {
        fitTo: { mode: 'width', value: INFOGRAPHIC_WIDTH },
    }).render().asPng()
}

async function generateInfographicWithOpenRouter(
    topic: string,
    template: SocialPostTemplate,
    settings: SocialPostGeneratorSettings,
    text: { shortText: string; longText: string },
): Promise<string> {
    const preferredInfographicModels = [
        settings.imageModel,
        ...OPENROUTER_INFOGRAPHIC_MODELS,
    ].filter((model, index, list) => Boolean(model) && list.indexOf(model) === index)

    const prompt = `You are an SVG background scene designer. Create a ${INFOGRAPHIC_WIDTH}x${INFOGRAPHIC_HEIGHT} vertical editorial background scene for a social media post.

Use a premium business-media aesthetic with cinematic lighting, realistic industrial or geopolitical composition, and strong negative space. Output ONLY the raw <svg>...</svg> code.

Brand: GeoMoney
Topic: ${topic}
Visual direction: ${template.imageStyle || 'Professional editorial magazine cover with premium financial media styling.'}

Creative direction:
- This must look like a premium magazine cover or institutional research graphic, not a toy infographic
- Build one strong hero background scene with depth, atmosphere, shadow, and layered composition
- Prefer realistic silhouettes, refined geometry, documentary-industrial mood, and subtle market-data overlays
- Leave clear negative space in the upper-left for headline text
- Leave room in the lower third for a chart/data panel overlay

Hard bans:
- No childish, cartoon, clip-art, or playful style
- No simple blocky factories, crude arrows, chevrons, stick graphics, or classroom infographic icons
- No emoji, no hashtags, no bullets, no list boxes, no sticker-like UI chips
- No charts, no labels, no headlines, no paragraphs, no footer copy
- No dense dashboards, tiny cards, or walls of text
- No external images, no CSS, no JavaScript, no foreignObject

Layout requirements:
- 1080x1350 canvas
- Background only: do not render any final text or chart copy into the SVG
- Use lighting, texture, silhouette, and atmosphere to communicate the story

If the topic is about rare earths, processing, supply chains, or geopolitics, use a sophisticated editorial composition: industrial infrastructure, map fragments, material textures, global routing hints, and restrained data marks. Avoid anything that looks childish or diagrammatic.
`

    const result = await callOpenRouter(prompt, {
        temperature: 0.4,
        maxTokens: 2200,
        caller: 'social-post-infographic',
        preferredModels: preferredInfographicModels,
        allowFallback: false,
    })

    const svg = normalizeSvgMarkup(getSvgMarkup(result.content))
    let backgroundBytes: Buffer

    try {
        backgroundBytes = await renderSvgMarkupToPng(svg)
    } catch (error) {
        console.warn(
            'OpenRouter SVG parse failed, using fallback infographic background:',
            error instanceof Error ? error.message : String(error),
        )
        backgroundBytes = await renderSvgMarkupToPng(buildFallbackInfographicBackground(template))
    }

    return composeIllustrativeSocialCard(backgroundBytes, template, text)
}

async function generateTextForProvider(
    prompt: string,
    settings: SocialPostGeneratorSettings,
): Promise<string> {
    if (settings.provider === 'huggingface') {
        return callHuggingFaceChat(prompt, settings.textModel)
    }

    const result = await callOpenRouter(prompt, {
        temperature: 0.7,
        maxTokens: 1500,
        caller: 'social-post-gen',
        preferredModels: [settings.textModel],
        allowFallback: false,
    })
    return result.content
}

// ─────────────────────────────────────────────────────────────────────────────
// Social Post Generation
// ─────────────────────────────────────────────────────────────────────────────

export async function generateSocialPost(options: GenerationOptions = {}): Promise<{
    text: string
    imagePrompt: string
    imageUrl: string | null
    settings: SocialPostGeneratorSettings
    template: SocialPostTemplate
}> {
    const storedSettings = await getSocialPostGeneratorSettings()
    const settings = mergeGeneratorSettings({
        ...storedSettings,
        ...options.settings,
        templates: options.settings?.templates || storedSettings.templates,
    })
    const template = getTemplateById(settings, options.templateId)

    // Gather recent context from the DB
    const [articles, materials, tickers] = await Promise.all([
        prisma.article.findMany({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { title: true, category: true, aiSummary: true },
        }),
        prisma.rareEarthMaterial.findMany({
            take: 5,
            select: { name: true, symbol: true, price: true, unit: true },
        }),
        prisma.commodityPrice.findMany({
            take: 5,
            select: { label: true, price: true, change: true },
        }),
    ])

    const articlesCtx = articles
        .map(a => `• [${a.category}] ${a.title}: ${a.aiSummary || 'N/A'}`)
        .join('\n') || 'No recent articles.'

    const materialsCtx = materials
        .map(m => `• ${m.name} (${m.symbol}): ${m.price != null ? `$${m.price}/${m.unit || 'unit'}` : 'N/A'}`)
        .join('\n') || 'No materials data.'

    const tickersCtx = tickers
        .map(t => {
            const chg = t.change != null ? (t.change >= 0 ? `+${t.change.toFixed(2)}` : t.change.toFixed(2)) : 'N/A'
            return `• ${t.label}: $${t.price.toFixed(2)} [${chg}]`
        })
        .join('\n') || 'No ticker data.'

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const prompt = `You are a social media editor for GeoMoney, a premium geopolitical intelligence platform. Today is ${today}.

Selected template: ${template.name}
Template guidance: ${template.body}
Image style guidance: ${template.imageStyle}
Retry count for this generation: ${options.retryCount || 0}

Based on the latest data below, generate a social media package with a text part and a media image prompt. The package will be reviewed by an admin who may regenerate it multiple times.

LIVE DATA:
ARTICLES:
${articlesCtx}

MATERIALS:
${materialsCtx}

MARKET TICKERS:
${tickersCtx}

REQUIREMENTS:
- The text part should be engaging, informative, and professional
- Include 2-3 relevant hashtags
- Keep shortText under 280 characters for X compatibility
- longText should be 1-3 short paragraphs for LinkedIn/Instagram
- Include an emoji or two for visual appeal
- Focus on the most impactful geopolitical or market insight of the day
- Do NOT include any financial advice or recommendations
- imagePrompt must describe a realistic media-ready editorial image aligned to the text
- shortText and longText must feel like the same campaign idea

Respond ONLY with valid JSON (no markdown fences):
{
  "shortText": "The X/Twitter-compatible post (max 280 chars)",
  "longText": "The LinkedIn/Instagram version (can be longer, 1-3 paragraphs)",
  "imagePrompt": "A detailed prompt for generating an accompanying image. Should be a professional, editorial-style image related to the post content. Describe composition, style, colors, and subject matter."
}`

    const content = await generateTextForProvider(prompt, settings)

    let parsed: any = {}
    try {
        const cleaned = content.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
        parsed = JSON.parse(cleaned)
    } catch {
        // Fallback: use raw text
        parsed = {
            shortText: content.slice(0, 280),
            longText: content,
            imagePrompt: 'Professional editorial illustration of global financial markets and geopolitics',
        }
    }

    // Generate image via Hugging Face, webhook, or skip.
    let imageUrl: string | null = null
    try {
        imageUrl = await generateImage(
            parsed.imagePrompt || 'Geopolitical finance illustration',
            settings,
            template,
            {
                shortText: parsed.shortText || '',
                longText: parsed.longText || '',
            },
        )
    } catch (err) {
        console.warn('Image generation failed:', err instanceof Error ? err.message : String(err))
    }

    // Combine short + long text for storage
    const fullText = JSON.stringify({
        shortText: parsed.shortText || '',
        longText: parsed.longText || '',
        provider: settings.provider,
        textModel: settings.textModel,
        imageProvider: settings.imageProvider,
        imageModel: settings.imageModel,
        templateId: template.id,
        templateName: template.name,
    })

    return {
        text: fullText,
        imagePrompt: parsed.imagePrompt || '',
        imageUrl,
        settings,
        template,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Generation (uses a configurable image API)
// ─────────────────────────────────────────────────────────────────────────────

async function generateImage(
    prompt: string,
    settings: SocialPostGeneratorSettings,
    template: SocialPostTemplate,
    text: { shortText: string; longText: string },
): Promise<string | null> {
    if (settings.imageProvider === 'none') {
        return null
    }

    if (settings.imageProvider === 'openrouter-svg') {
        return generateInfographicWithOpenRouter(prompt, template, settings, text)
    }

    if (settings.imageProvider === 'huggingface') {
        const backgroundBytes = await generateImageWithHuggingFace(prompt, settings.imageModel)
        return composeIllustrativeSocialCard(backgroundBytes, template, text)
    }

    // Use the n8n webhook for image generation.
    const imageApiUrl = process.env.SOCIAL_IMAGE_API_URL
    const imageApiKey = process.env.SOCIAL_IMAGE_API_KEY

    if (!imageApiUrl) {
        console.info('SOCIAL_IMAGE_API_URL not configured, skipping image generation')
        return null
    }

    const res = await fetch(imageApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(imageApiKey ? { Authorization: `Bearer ${imageApiKey}` } : {}),
        },
        body: JSON.stringify({ prompt }),
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Image API returned ${res.status}: ${errText.slice(0, 200)}`)
    }

    const data = await res.json()
    const imageUrl = data.imageUrl || data.url || null
    if (!imageUrl) {
        return null
    }

    const backgroundBytes = await downloadRemoteImage(imageUrl)
    return composeIllustrativeSocialCard(backgroundBytes, template, text)
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Notification
// ─────────────────────────────────────────────────────────────────────────────

export async function sendPostReadyEmail(postId: string): Promise<void> {
    // Get SMTP settings from DB  
    const smtpSettings = await prisma.siteSettings.findMany({
        where: { key: { startsWith: 'smtp_' } },
    })
    const smtp: Record<string, string> = {}
    smtpSettings.forEach(s => { smtp[s.key] = s.value })

    const adminEmail = process.env.ADMIN_EMAIL || smtp.smtp_user
    if (!adminEmail || !smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) {
        console.warn('SMTP not configured, cannot send post-ready email')
        return
    }

    const post = await prisma.socialPost.findUnique({ where: { id: postId } })
    if (!post) return

    let textContent: any = {}
    try { textContent = JSON.parse(post.text) } catch { textContent = { shortText: post.text } }

    const approveUrl = `${process.env.NEXTAUTH_URL || 'https://geomoney.tv'}/admin/social-posts`

    const smtpPort = parseInt(smtp.smtp_port || '587')
    const smtpSecure = smtpPort === 465
    const transporter = nodemailer.createTransport({
        host: smtp.smtp_host || 'smtp.gmail.com',
        port: smtpPort,
        secure: smtpSecure,
        requireTLS: !smtpSecure,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
        auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
        tls: { rejectUnauthorized: false },
    })

    const fromAddress = `${smtp.smtp_from_name || 'GeoMoney TV'} <${smtp.smtp_from_email || smtp.smtp_user}>`

    await transporter.sendMail({
        from: fromAddress,
        to: adminEmail,
        subject: '🚀 Social Media Post Ready for Approval — GeoMoney',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 24px; border-radius: 12px;">
        <h2 style="color: #f5a623; margin-bottom: 16px;">📱 New Social Media Post Ready</h2>
        <p style="color: #ccc; font-size: 14px;">A new social media post has been generated and is waiting for your approval.</p>
        
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #f5a623; margin: 0 0 8px;">X/Twitter Version:</h3>
          <p style="color: #eee; font-size: 14px;">${textContent.shortText || 'N/A'}</p>
        </div>
        
        <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #f5a623; margin: 0 0 8px;">LinkedIn/Instagram Version:</h3>
          <p style="color: #eee; font-size: 14px; white-space: pre-wrap;">${textContent.longText || 'N/A'}</p>
        </div>
        
        ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" style="width: 100%; border-radius: 8px; margin: 16px 0;" />` : ''}
        
        <div style="margin-top: 24px; text-align: center;">
          <a href="${approveUrl}" style="display: inline-block; background: #f5a623; color: #000; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; margin: 4px;">Review in Admin Panel</a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 24px; text-align: center;">
          Reply <strong>YES</strong> to this email to auto-approve, or visit the admin panel to review, edit, or regenerate.
        </p>
      </div>
    `,
    })

    await prisma.socialPost.update({
        where: { id: postId },
        data: { emailSent: true },
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Social Media Publishing
// ─────────────────────────────────────────────────────────────────────────────

interface PublishResult {
    platform: string
    success: boolean
    error?: string
    postUrl?: string
}

export async function publishToSocialMedia(postId: string): Promise<PublishResult[]> {
    const post = await prisma.socialPost.findUnique({ where: { id: postId } })
    if (!post) throw new Error('Post not found')

    let textContent: any = {}
    try { textContent = JSON.parse(post.text) } catch { textContent = { shortText: post.text, longText: post.text } }

    const platforms: string[] = post.platforms ? JSON.parse(post.platforms) : ['linkedin', 'x', 'instagram']
    const results: PublishResult[] = []

    // Try n8n webhook first (recommended approach)
    const n8nPublishUrl = process.env.N8N_SOCIAL_PUBLISH_WEBHOOK
    if (n8nPublishUrl) {
        try {
            const res = await fetch(n8nPublishUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: post.id,
                    shortText: textContent.shortText,
                    longText: textContent.longText,
                    imageUrl: post.imageUrl,
                    platforms,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                // Expect n8n to return { results: [{ platform, success, postUrl?, error? }] }
                if (data.results && Array.isArray(data.results)) {
                    results.push(...data.results)
                } else {
                    // Assume all succeeded via n8n
                    for (const p of platforms) {
                        results.push({ platform: p, success: true })
                    }
                }
            } else {
                const errText = await res.text()
                for (const p of platforms) {
                    results.push({ platform: p, success: false, error: `n8n webhook failed: ${errText.slice(0, 100)}` })
                }
            }
        } catch (err) {
            for (const p of platforms) {
                results.push({ platform: p, success: false, error: `n8n error: ${err instanceof Error ? err.message : String(err)}` })
            }
        }
    } else {
        // Direct API publishing (requires individual platform API keys)
        for (const platform of platforms) {
            try {
                const result = await publishToPlatform(platform, textContent, post.imageUrl)
                results.push(result)
            } catch (err) {
                results.push({
                    platform,
                    success: false,
                    error: err instanceof Error ? err.message : String(err),
                })
            }
        }
    }

    // Update post status
    const allSuccess = results.every(r => r.success)
    const anySuccess = results.some(r => r.success)

    await prisma.socialPost.update({
        where: { id: postId },
        data: {
            status: allSuccess ? 'published' : anySuccess ? 'published' : 'pending',
            publishedAt: anySuccess ? new Date() : undefined,
            publishLog: JSON.stringify(results),
            platforms: JSON.stringify(platforms),
        },
    })

    return results
}

async function publishToPlatform(
    platform: string,
    text: { shortText: string; longText: string },
    imageUrl: string | null,
): Promise<PublishResult> {
    switch (platform) {
        case 'x': {
            const apiKey = process.env.X_API_KEY
            const apiSecret = process.env.X_API_SECRET
            const accessToken = process.env.X_ACCESS_TOKEN
            const accessSecret = process.env.X_ACCESS_TOKEN_SECRET
            if (!apiKey || !accessToken) {
                return { platform, success: false, error: 'X API credentials not configured' }
            }
            // Post via n8n webhook is recommended. Direct X API v2 posting
            // requires OAuth 1.0a signing which is complex. Configure N8N_SOCIAL_PUBLISH_WEBHOOK instead.
            return { platform, success: false, error: 'Direct X posting not implemented. Use n8n webhook.' }
        }
        case 'linkedin': {
            const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
            if (!accessToken) {
                return { platform, success: false, error: 'LinkedIn access token not configured' }
            }
            return { platform, success: false, error: 'Direct LinkedIn posting not implemented. Use n8n webhook.' }
        }
        case 'instagram': {
            return { platform, success: false, error: 'Direct Instagram posting not implemented. Use n8n webhook.' }
        }
        default:
            return { platform, success: false, error: `Unknown platform: ${platform}` }
    }
}
