import { prisma } from './prisma'
import { callOpenRouter } from './openrouter'
import nodemailer from 'nodemailer'

// ─────────────────────────────────────────────────────────────────────────────
// Social Post Generation
// ─────────────────────────────────────────────────────────────────────────────

export async function generateSocialPost(): Promise<{
    text: string
    imagePrompt: string
    imageUrl: string | null
}> {
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

    const prompt = `You are a social media expert for GeoMoney, a premium geopolitical intelligence platform. Today is ${today}.

Based on the latest data below, write a social media post that will be shared across LinkedIn, X (Twitter), and Instagram.

LIVE DATA:
ARTICLES:
${articlesCtx}

MATERIALS:
${materialsCtx}

MARKET TICKERS:
${tickersCtx}

REQUIREMENTS:
- The post should be engaging, informative, and professional
- Include 2-3 relevant hashtags
- Keep it under 280 characters for X compatibility, but also provide a longer LinkedIn version
- Include an emoji or two for visual appeal
- Focus on the most impactful geopolitical or market insight of the day
- Do NOT include any financial advice or recommendations

Respond ONLY with valid JSON (no markdown fences):
{
  "shortText": "The X/Twitter-compatible post (max 280 chars)",
  "longText": "The LinkedIn/Instagram version (can be longer, 1-3 paragraphs)",
  "imagePrompt": "A detailed prompt for generating an accompanying image. Should be a professional, editorial-style image related to the post content. Describe composition, style, colors, and subject matter."
}`

    const result = await callOpenRouter(prompt, {
        temperature: 0.7,
        maxTokens: 1500,
        caller: 'social-post-gen',
    })

    let parsed: any = {}
    try {
        const cleaned = result.content.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
        parsed = JSON.parse(cleaned)
    } catch {
        // Fallback: use raw text
        parsed = {
            shortText: result.content.slice(0, 280),
            longText: result.content,
            imagePrompt: 'Professional editorial illustration of global financial markets and geopolitics',
        }
    }

    // Generate image via OpenRouter vision or external API
    let imageUrl: string | null = null
    try {
        imageUrl = await generateImage(parsed.imagePrompt || 'Geopolitical finance illustration')
    } catch (err) {
        console.warn('Image generation failed:', err instanceof Error ? err.message : String(err))
    }

    // Combine short + long text for storage
    const fullText = JSON.stringify({
        shortText: parsed.shortText || '',
        longText: parsed.longText || '',
    })

    return {
        text: fullText,
        imagePrompt: parsed.imagePrompt || '',
        imageUrl,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Generation (uses a configurable image API)
// ─────────────────────────────────────────────────────────────────────────────

async function generateImage(prompt: string): Promise<string | null> {
    // Use the n8n webhook for image generation, or a direct API
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
    // Expect { imageUrl: "https://..." } or { url: "https://..." }
    return data.imageUrl || data.url || null
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
