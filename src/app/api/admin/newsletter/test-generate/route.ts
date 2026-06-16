import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAiModel } from '@/lib/get-ai-model'
import { COMPLIANCE_PROMPT, enforceCompliance } from '@/lib/compliance-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface RagContextSettings {
  dailyPromptTemplate?: string
  weeklyPromptTemplate?: string
  contextWindowSize?: number
  temperature?: number
  maxTokens?: number
  enabledDataSources?: {
    articles: boolean
    materials: boolean
    tickers: boolean
    userPreferences: boolean
  }
}

// Modular helper: fetch data context
async function buildDataContext(
  ragSettings: RagContextSettings = {},
  userId?: string
) {
  const startTime = Date.now()
  const context: any = {
    articles: [],
    materials: [],
    tickers: [],
    userPreferences: null,
    generationTime: 0,
    errors: [],
  }

  const enabledDataSources = ragSettings.enabledDataSources || {
    articles: true,
    materials: true,
    tickers: true,
    userPreferences: true,
  }

  try {
    // Fetch articles
    if (enabledDataSources.articles) {
      const take = ragSettings.contextWindowSize || 10
      context.articles = await prisma.article.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take,
        select: { 
          title: true, 
          category: true, 
          aiSummary: true, 
          aiAnalysis: true, 
          createdAt: true 
        },
      })
    }
  } catch (err: any) {
    context.errors.push(`Failed to fetch articles: ${err.message}`)
  }

  try {
    // Fetch materials
    if (enabledDataSources.materials) {
      context.materials = await prisma.rareEarthMaterial.findMany({
        select: { 
          id: true,
          name: true, 
          symbol: true, 
          category: true, 
          price: true, 
          unit: true,
          supply: true,
          demand: true,
          countries: true,
        },
      })
    }
  } catch (err: any) {
    context.errors.push(`Failed to fetch materials: ${err.message}`)
  }

  try {
    // Fetch tickers
    if (enabledDataSources.tickers) {
      context.tickers = await prisma.commodityPrice.findMany({
        select: { 
          label: true, 
          symbol: true, 
          price: true, 
          change: true, 
          previousClose: true, 
          type: true 
        },
      })
    }
  } catch (err: any) {
    context.errors.push(`Failed to fetch tickers: ${err.message}`)
  }

  try {
    // Fetch user preferences if userId provided
    if (enabledDataSources.userPreferences && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          trackedMaterials: {
            include: {
              material: true
            }
          }
        }
      })
      
      if (user) {
        context.userPreferences = {
          name: user.name,
          email: user.email,
          trackedMaterials: user.trackedMaterials.map(tm => ({
            name: tm.material.name,
            symbol: tm.material.symbol,
            category: tm.material.category,
          }))
        }
      }

      // Also check if they're a newsletter subscriber
      const subscriber = await prisma.newsletter.findUnique({
        where: { email: user?.email || '' },
      })
      
      if (subscriber?.materialPreferences) {
        try {
          context.userPreferences.materialPreferences = JSON.parse(subscriber.materialPreferences)
        } catch {
          context.userPreferences.materialPreferences = subscriber.materialPreferences
        }
      }
    }
  } catch (err: any) {
    context.errors.push(`Failed to fetch user preferences: ${err.message}`)
  }

  context.generationTime = Date.now() - startTime
  return context
}

// Modular helper: build prompt
function buildPrompt(
  type: 'daily' | 'weekly',
  dataContext: any,
  ragSettings: RagContextSettings = {},
  userPreferences?: any
): string {
  const publicationDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // Build context strings
  const articlesCtx = dataContext.articles
    ?.map((a: any) => `• [${a.category.toUpperCase()}] ${a.title}: ${a.aiSummary || a.aiAnalysis || 'No summary available'}`)
    .join('\n') || 'No recent articles in the database.'

  const materialsCtx = dataContext.materials
    ?.map((m: any) => {
      let countries = ''
      try { countries = JSON.parse(m.countries || '[]').join(', ') } catch { }
      return `• ${m.name} (${m.symbol}) [${m.category}]: ${m.price != null ? `$${m.price} per ${m.unit || 'unit'}` : 'Price N/A'} | Supply: ${m.supply || 'N/A'} | Demand: ${m.demand || 'N/A'} | Countries: ${countries || 'N/A'}`
    })
    .join('\n') || 'No critical materials data available.'

  const tickersCtx = dataContext.tickers
    ?.map((t: any) => {
      const chg = t.change != null ? (t.change >= 0 ? `+${t.change.toFixed(2)}` : t.change.toFixed(2)) : 'N/A'
      return `• ${t.label} (${t.symbol}): $${t.price.toFixed(2)} [${chg}]`
    })
    .join('\n') || 'No ticker data available.'

  const userCtx = userPreferences 
    ? `USER PROFILE:
Name: ${userPreferences.name || 'N/A'}
Email: ${userPreferences.email || 'N/A'}
Tracked Materials: ${userPreferences.trackedMaterials?.map((m: any) => m.name).join(', ') || 'None'}
Material Preferences: ${JSON.stringify(userPreferences.materialPreferences || {})}
`
    : ''

  // Check for custom template
  const customTemplate = type === 'daily' 
    ? ragSettings.dailyPromptTemplate 
    : ragSettings.weeklyPromptTemplate

  if (customTemplate && customTemplate.trim()) {
    // Use custom template with substitutions
    return customTemplate
      .replace('{{PUBLICATION_DATE}}', publicationDate)
      .replace('{{COMPLIANCE_PROMPT}}', COMPLIANCE_PROMPT)
      .replace('{{ARTICLES}}', articlesCtx)
      .replace('{{MATERIALS}}', materialsCtx)
      .replace('{{TICKERS}}', tickersCtx)
      .replace('{{USER_CONTEXT}}', userCtx)
  }

  // Default prompts
  if (type === 'daily') {
    return `You are a senior critical materials and geopolitical intelligence analyst for GeoMoney. Today is ${publicationDate}.

${COMPLIANCE_PROMPT}

Your task: write the GeoMoney Daily Materials Intelligence Report in structured JSON. This report focuses on CRITICAL MATERIALS (rare earths, strategic minerals) and how geopolitical events affect their supply chains, pricing, and strategic importance.

${userCtx}

LIVE DATA
=========
CRITICAL MATERIALS (rare earths, strategic minerals — the PRIMARY focus):
${materialsCtx}

LATEST ARTICLES (for geopolitical context):
${articlesCtx}

MARKET TICKERS (for broader context):
${tickersCtx}

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown fences, no extra keys:
{
  "dailyThesis": "2-3 sentence paragraph. What is the primary system dynamic affecting critical materials today? What supply chain, policy, or geopolitical channel is most active?",
  "executiveSummary": "3-4 sentence paragraph. Overview of today's critical materials environment: price behavior, supply chain signals, policy developments, and geopolitical transmission effects.",
  "materialHighlights": [
    {
      "name": "Material Name (Symbol)",
      "priceNote": "Current price context and recent behavior",
      "supplyChainStatus": "1-2 sentences on supply chain conditions, concentration risk, processing bottlenecks",
      "geopoliticalExposure": "1-2 sentences on how current geopolitical dynamics affect this material"
    }
  ],
  "supplyChainAnalysis": "2-3 sentences. What is the current state of global rare earth and strategic material supply chains? Processing concentration, export controls, stockpiling activity.",
  "policyWatch": "2-3 sentences. Any relevant policy developments: export controls, quota changes, trade restrictions, strategic stockpiling announcements, or regulatory shifts.",
  "geopoliticalTransmission": "2-3 sentences. How are current geopolitical events (from articles) transmitting into critical materials markets? Which transmission channel is most active?",
  "scenarioDaily": "2-3 sentences. Under current conditions, what is the most likely near-term path for critical materials? What would change this trajectory?",
  "watchpoints": ["watchpoint 1", "watchpoint 2", "watchpoint 3", "watchpoint 4", "watchpoint 5"]
}`
  }

  // Weekly report
  // Identify key ticker proxies for Market Snapshot section
  const remx = dataContext.tickers?.find((t: any) => t.symbol?.toUpperCase().includes('REMX'))
  const mp = dataContext.tickers?.find((t: any) => t.symbol?.toUpperCase() === 'MP')
  const uup = dataContext.tickers?.find((t: any) => t.symbol?.toUpperCase().includes('UUP') || t.label?.toUpperCase().includes('DOLLAR'))
  const uso = dataContext.tickers?.find((t: any) => t.symbol?.toUpperCase().includes('USO') || t.label?.toUpperCase().includes('OIL') || t.label?.toUpperCase().includes('WTI'))

  const fmtTicker = (t: any, fallback: string) => {
    if (!t) return fallback
    const chg = t.change != null ? ` (${t.change >= 0 ? '+' : ''}${t.change.toFixed(2)})` : ''
    return `$${t.price.toFixed(2)}${chg}`
  }

  return `You are a senior geopolitical and financial intelligence analyst for GeoMoney, a premium geopolitical intelligence platform. Today is ${publicationDate}.

${COMPLIANCE_PROMPT}

Your task: write the dynamic text sections of the GeoMoney Weekly Intelligence Report in structured JSON. Each field must be concise, analytical, data-grounded, and professional — not generic filler. Draw directly from the live data below.

${userCtx}

LIVE DATA
=========
LATEST ARTICLES (geopolitical events, market developments):
${articlesCtx}

CRITICAL MATERIALS (rare earths, strategic minerals):
${materialsCtx}

MARKET TICKERS:
${tickersCtx}

KEY LEVELS: REMX ${fmtTicker(remx, '[verify]')}, MP ${fmtTicker(mp, '[verify]')}, UUP ${fmtTicker(uup, '[verify]')}, USO ${fmtTicker(uso, '[verify]')}

OUTPUT FORMAT — respond ONLY with valid JSON, no markdown fences, no extra keys:
{
  "weeklyThesis": "2-3 sentence paragraph. Identify the primary geopolitical transmission channel active this week, which secondary channels are building pressure, and the central analytical question for the next reporting window.",
  "executiveSummaryPara1": "Paragraph describing the week's dominant operating environment and the 3 reinforcing dynamics.",
  "executiveSummaryPara2": "Paragraph focused on the primary geopolitical theater and how energy-linked assets are behaving.",
  "executiveSummaryPara3": "Paragraph on critical materials opacity and any secondary geopolitical layer forming outside the primary theater.",
  "executiveSummaryConclusion": "One sentence central analytical conclusion for the week.",
  "snapshotEnergy": "2-3 sentences. How are energy-linked assets behaving? What does price action tell us about embedded disruption risk vs. resolved market view?",
  "snapshotMaterials": "2-3 sentences. State of rare earth and strategic material pricing — transparency issues, processing concentration, policy sensitivity.",
  "snapshotCurrency": "2-3 sentences. What does currency and capital flow behavior indicate? Selective defensive preference or broad-based risk aversion?",
  "marketSnapshotReadthrough": "2-3 sentences. Based on relative moves this week, which stress channel is leading, which is lagging, and what does currency behavior indicate?",
  "keyDevelopment1Title": "Short title for development 1",
  "keyDevelopment1Body": "2-3 sentences expanding on the primary geopolitical driver and its market transmission mechanism.",
  "keyDevelopment2Title": "Short title for development 2",
  "keyDevelopment2Body": "2-3 sentences on a secondary geopolitical actor benefiting from or shaping the current environment.",
  "keyDevelopment3Title": "Short title for development 3",
  "keyDevelopment3Body": "2-3 sentences on a regional tension or alignment shift that merits strategic attention.",
  "keyDevelopment4Title": "Short title for development 4",
  "keyDevelopment4Body": "2-3 sentences on a cross-cutting risk multiplier (cyber, logistics, sanctions, etc.).",
  "scenarioBaseline": "3 sentences. What is the most likely path — localized persistence without decisive change?",
  "scenarioEscalation": "3 sentences. What triggers escalation and what does it look like across energy, materials, and capital flows?",
  "scenarioDeescalation": "3 sentences. What does a moderation path look like and what structural limits remain on normalization?",
  "scenarioCriticalMaterials": "3 sentences. Independent of military escalation, what policy or supply-chain triggers could reprice strategic materials rapidly?",
  "watchpoints": ["watchpoint 1", "watchpoint 2", "watchpoint 3", "watchpoint 4", "watchpoint 5", "watchpoint 6", "watchpoint 7"]
}`
}

// Modular helper: call AI with retry
async function callAI(
  prompt: string,
  temperature: number = 0.4,
  maxTokens: number = 3500
): Promise<{ response: any; rawContent: string; errors: string[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured')
  }

  const aiModel = await getAiModel()
  const errors: string[] = []

  const maxRetries = 3
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://geomoneytv.com',
          'X-Title': 'GeoMoney Intelligence Report',
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: temperature,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
          const backoff = Math.min(2000 * 2 ** attempt, 15000)
          console.warn(`[OpenRouter] ${res.status} on attempt ${attempt + 1}, retrying in ${backoff}ms…`)
          await new Promise((r) => setTimeout(r, backoff))
          continue
        }
        throw new Error(`AI generation failed (HTTP ${res.status}): ${errText.slice(0, 200)}`)
      }

      const data = await res.json()
      const rawContent = data.choices?.[0]?.message?.content || '{}'
      
      // Try to parse JSON
      let parsed = {}
      try {
        const cleaned = rawContent.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
        parsed = JSON.parse(cleaned)
      } catch (parseErr: any) {
        errors.push(`JSON parse error: ${parseErr.message}. Raw response truncated to 500 chars.`)
        // Return partial data
        return { 
          response: { _raw: rawContent.slice(0, 500) }, 
          rawContent, 
          errors 
        }
      }

      return { response: parsed, rawContent, errors }
    } catch (err: any) {
      errors.push(`Attempt ${attempt + 1} failed: ${err.message}`)
      if (attempt === maxRetries) {
        throw err
      }
    }
  }

  throw new Error('AI generation failed after all retries')
}

// Modular helper: build HTML from parsed data
function buildHtml(type: 'daily' | 'weekly', data: any): string {
  const gold = '#D4AF37'
  const bg = '#0a0a0a'
  const cardBg = '#111111'
  const border = '#222222'
  const text = '#d0d0d0'
  const muted = '#888888'

  const sectionTitle = (title: string) =>
    `<h2 style="color:${gold};font-size:15px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid ${border};">${title}</h2>`

  const card = (content: string) =>
    `<div style="background:${cardBg};border:1px solid ${border};border-radius:8px;padding:20px 24px;margin-bottom:8px;">${content}</div>`

  const para = (content: string) =>
    `<p style="color:${text};font-size:13px;line-height:1.75;margin:0 0 10px;">${content}</p>`

  const publicationDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  if (type === 'daily') {
    // Build daily HTML
    const materialsHtml = (data.materialHighlights || [])
      .map((m: any) => `
        <div style="padding:14px 0;border-bottom:1px solid ${border};">
          <div style="color:${gold};font-size:13px;font-weight:700;margin-bottom:6px;">${enforceCompliance(m.name || 'N/A').cleaned}</div>
          <div style="color:${text};font-size:12px;line-height:1.7;margin-bottom:4px;"><strong style="color:#fff;">Price:</strong> ${enforceCompliance(m.priceNote || 'N/A').cleaned}</div>
          <div style="color:${text};font-size:12px;line-height:1.7;margin-bottom:4px;"><strong style="color:#fff;">Supply Chain:</strong> ${enforceCompliance(m.supplyChainStatus || 'N/A').cleaned}</div>
          <div style="color:${text};font-size:12px;line-height:1.7;"><strong style="color:#fff;">Geopolitical Exposure:</strong> ${enforceCompliance(m.geopoliticalExposure || 'N/A').cleaned}</div>
        </div>
      `).join('')

    const watchpointHtml = (data.watchpoints || [])
      .map((w: string) => `<li style="color:${text};font-size:12px;line-height:1.7;margin-bottom:6px;">${enforceCompliance(w).cleaned}</li>`)
      .join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GeoMoney Daily Materials Intelligence Report</title>
</head>
<body style="margin:0;padding:0;background-color:${bg};color:${text};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:660px;margin:0 auto;padding:32px 20px;">
  <div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid ${gold};">
    <p style="color:${muted};font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Intelligence Platform</p>
    <h1 style="color:${gold};margin:0 0 4px;font-size:26px;letter-spacing:3px;font-weight:800;">GEOMONEY</h1>
    <h2 style="color:#ffffff;margin:0 0 12px;font-size:14px;font-weight:400;letter-spacing:2px;">DAILY MATERIALS INTELLIGENCE REPORT</h2>
    <div style="display:inline-block;background:#1a1a1a;border:1px solid ${border};border-radius:4px;padding:6px 16px;">
      <span style="color:${muted};font-size:11px;">Data as of: </span>
      <span style="color:#ffffff;font-size:11px;font-weight:600;">${publicationDate}</span>
    </div>
  </div>

  <div style="margin-bottom:28px;">
    ${sectionTitle('Daily Thesis')}
    ${card(`<p style="color:${text};font-size:13px;line-height:1.8;margin:0;font-style:italic;">${enforceCompliance(data.dailyThesis || 'No thesis generated').cleaned}</p>`)}
  </div>

  <div style="margin-bottom:28px;">
    ${sectionTitle('Executive Summary')}
    ${card(`<p style="color:${text};font-size:13px;line-height:1.8;margin:0;">${enforceCompliance(data.executiveSummary || 'No summary generated').cleaned}</p>`)}
  </div>

  <div style="margin-bottom:28px;">
    ${sectionTitle('Material Highlights')}
    ${card(materialsHtml || `<p style="color:${muted};font-size:12px;">No material highlights available.</p>`)}
  </div>

  <div style="margin-bottom:28px;">
    ${sectionTitle('Supply Chain Analysis')}
    ${card(`<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${enforceCompliance(data.supplyChainAnalysis || 'N/A').cleaned}</p>`)}
  </div>

  <div style="margin-bottom:28px;">
    ${sectionTitle('Policy Watch')}
    ${card(`<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${enforceCompliance(data.policyWatch || 'N/A').cleaned}</p>`)}
  </div>

  <div style="margin-bottom:28px;">
    ${sectionTitle('Watchpoints')}
    ${card(`<ul style="margin:0;padding-left:20px;">${watchpointHtml || '<li style="color:' + muted + ';">No watchpoints available</li>'}</ul>`)}
  </div>

  <div style="padding-top:20px;border-top:1px solid ${border};text-align:center;">
    <p style="color:${gold};font-size:13px;font-weight:700;letter-spacing:2px;margin:0 0 6px;">GEOMONEY</p>
    <p style="color:${muted};font-size:10px;margin:0;line-height:1.6;">
      &copy; ${new Date().getFullYear()} GeoMoney Intelligence Platform. All rights reserved.
    </p>
  </div>
</div>
</body>
</html>`
  }

  // Weekly HTML (simplified version - full version would be as comprehensive as original)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GeoMoney Weekly Intelligence Report</title>
</head>
<body style="margin:0;padding:0;background-color:${bg};color:${text};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:660px;margin:0 auto;padding:32px 20px;">
  <div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid ${gold};">
    <p style="color:${muted};font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Intelligence Platform</p>
    <h1 style="color:${gold};margin:0 0 4px;font-size:26px;letter-spacing:3px;font-weight:800;">GEOMONEY</h1>
    <h2 style="color:#ffffff;margin:0 0 12px;font-size:14px;font-weight:400;letter-spacing:2px;">WEEKLY INTELLIGENCE REPORT</h2>
    <div style="display:inline-block;background:#1a1a1a;border:1px solid ${border};border-radius:4px;padding:6px 16px;">
      <span style="color:${muted};font-size:11px;">Data as of: </span>
      <span style="color:#ffffff;font-size:11px;font-weight:600;">${publicationDate}</span>
    </div>
  </div>

  <div style="margin-bottom:28px;">
    ${sectionTitle('Weekly Thesis')}
    ${card(`<p style="color:${text};font-size:13px;line-height:1.8;margin:0;font-style:italic;">${enforceCompliance(data.weeklyThesis || 'No thesis generated').cleaned}</p>`)}
  </div>

  <div style="margin-bottom:28px;">
    ${sectionTitle('Executive Summary')}
    ${card(`
      ${para(enforceCompliance(data.executiveSummaryPara1 || '').cleaned)}
      ${para(enforceCompliance(data.executiveSummaryPara2 || '').cleaned)}
      ${para(enforceCompliance(data.executiveSummaryPara3 || '').cleaned)}
      <div style="background:#1a1a1a;border-left:3px solid ${gold};padding:10px 14px;border-radius:0 4px 4px 0;">
        <p style="color:#ffffff;font-size:12px;font-weight:600;line-height:1.7;margin:0;">${enforceCompliance(data.executiveSummaryConclusion || '').cleaned}</p>
      </div>
    `)}
  </div>

  <div style="padding-top:20px;border-top:1px solid ${border};text-align:center;">
    <p style="color:${gold};font-size:13px;font-weight:700;letter-spacing:2px;margin:0 0 6px;">GEOMONEY</p>
    <p style="color:${muted};font-size:10px;margin:0;line-height:1.6;">
      &copy; ${new Date().getFullYear()} GeoMoney Intelligence Platform. All rights reserved.
    </p>
  </div>
</div>
</body>
</html>`
}

export async function POST(req: Request) {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { type = 'weekly', userId, debug = true, ragSettings = {} } = body

    // Step 1: Build Data Context
    const dataContext = await buildDataContext(ragSettings, userId)

    // Step 2: Build Prompt
    const prompt = buildPrompt(type, dataContext, ragSettings, dataContext.userPreferences)

    // Step 3: Call AI
    const aiResult = await callAI(
      prompt,
      ragSettings.temperature ?? 0.4,
      ragSettings.maxTokens ?? 3500
    )

    // Step 4: Build HTML
    const htmlContent = buildHtml(type, aiResult.response)

    const generationTime = Date.now() - startTime

    // Prepare response
    const response: any = {
      subject: `GeoMoney ${type === 'daily' ? 'Daily Materials' : 'Weekly Intelligence'} Report — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      htmlContent,
    }

    // Include debug info if requested
    if (debug) {
      response.debug = {
        dataContext: {
          articlesCount: dataContext.articles?.length || 0,
          materialsCount: dataContext.materials?.length || 0,
          tickersCount: dataContext.tickers?.length || 0,
          userPreferences: dataContext.userPreferences,
        },
        prompt,
        rawResponse: aiResult.rawContent,
        parsedData: aiResult.response,
        errors: [...dataContext.errors, ...aiResult.errors],
        generationTime,
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Test generation error:', error)
    return NextResponse.json({ 
      error: error.message || 'Test generation failed',
      debug: {
        errors: [error.message],
        generationTime: Date.now() - startTime,
      }
    }, { status: 500 })
  }
}
