import { prisma } from '@/lib/prisma'
import { getAiModel } from '@/lib/get-ai-model'
import { COMPLIANCE_PROMPT, enforceCompliance } from '@/lib/compliance-engine'
import { generatePdfFromHtml } from '@/lib/pdf-generator'
import nodemailer from 'nodemailer'

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchOpenRouterWithRetry(
  body: Record<string, any>,
  apiKey: string,
  maxRetries = 3,
): Promise<any> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://geomoneytv.com',
    'X-Title': 'GeoMoney Intelligence Report',
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (res.ok) return res.json()

    const errText = await res.text()

    // Rate-limited (429) or server error (5xx) — retry with backoff
    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      const backoff = Math.min(2000 * 2 ** attempt, 15000) // 2s, 4s, 8s, max 15s
      console.warn(`[OpenRouter] ${res.status} on attempt ${attempt + 1}, retrying in ${backoff}ms…`)
      await new Promise((r) => setTimeout(r, backoff))
      continue
    }

    console.error('[OpenRouter] API error:', errText)
    throw new Error(`AI generation failed (HTTP ${res.status}): ${errText.slice(0, 200)}`)
  }

  throw new Error('AI generation failed after retries')
}

// ─────────────────────────────────────────────────────────────────────────────
// GeoMoney Weekly Intelligence Report
// ─────────────────────────────────────────────────────────────────────────────

export async function generateWeeklyReport(): Promise<{ subject: string; htmlContent: string }> {
  const [articles, materials, tickers] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { title: true, category: true, aiSummary: true, aiAnalysis: true, createdAt: true },
    }),
    prisma.rareEarthMaterial.findMany({
      select: { name: true, symbol: true, category: true, price: true, unit: true },
    }),
    prisma.commodityPrice.findMany({
      select: { label: true, symbol: true, price: true, change: true, previousClose: true, type: true },
    }),
  ])

  const aiModel = await getAiModel()
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter API key not configured')

  const publicationDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // Build live data context strings
  const articlesCtx = articles
    .map(a => `• [${a.category.toUpperCase()}] ${a.title}: ${a.aiSummary || a.aiAnalysis || 'No summary available'}`)
    .join('\n') || 'No recent articles in the database.'

  const materialsCtx = materials
    .map(m => `• ${m.name} (${m.symbol}): ${m.price != null ? `$${m.price} per ${m.unit || 'unit'}` : 'Price N/A'}`)
    .join('\n') || 'No critical materials data available.'

  const tickersCtx = tickers
    .map(t => {
      const chg = t.change != null ? (t.change >= 0 ? `+${t.change.toFixed(2)}` : t.change.toFixed(2)) : 'N/A'
      return `• ${t.label} (${t.symbol}): $${t.price.toFixed(2)} [${chg}]`
    })
    .join('\n') || 'No ticker data available.'

  // Identify key ticker proxies for Market Snapshot section
  const remx = tickers.find(t => t.symbol?.toUpperCase().includes('REMX'))
  const mp = tickers.find(t => t.symbol?.toUpperCase() === 'MP')
  const uup = tickers.find(t => t.symbol?.toUpperCase().includes('UUP') || t.label?.toUpperCase().includes('DOLLAR'))
  const uso = tickers.find(t => t.symbol?.toUpperCase().includes('USO') || t.label?.toUpperCase().includes('OIL') || t.label?.toUpperCase().includes('WTI'))

  const fmtTicker = (t: typeof tickers[0] | undefined, fallback: string) => {
    if (!t) return fallback
    const chg = t.change != null ? ` (${t.change >= 0 ? '+' : ''}${t.change.toFixed(2)})` : ''
    return `$${t.price.toFixed(2)}${chg}`
  }

  const prompt = `You are a senior geopolitical and financial intelligence analyst for GeoMoney, a premium geopolitical intelligence platform. Today is ${publicationDate}.

${COMPLIANCE_PROMPT}

Your task: write the dynamic text sections of the GeoMoney Weekly Intelligence Report in structured JSON. Each field must be concise, analytical, data-grounded, and professional — not generic filler. Draw directly from the live data below.

LIVE DATA
=========
LATEST ARTICLES (geopolitical events, market developments):
${articlesCtx}

CRITICAL MATERIALS (rare earths, strategic minerals):
${materialsCtx}

MARKET TICKERS:
${tickersCtx}

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

  const aiData = await fetchOpenRouterWithRetry({
    model: aiModel,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3500,
    temperature: 0.4,
  }, apiKey)
  let raw = aiData.choices?.[0]?.message?.content || '{}'
  raw = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

  let d: Record<string, any> = {}
  try {
    d = JSON.parse(raw)
  } catch {
    console.error('Failed to parse AI JSON, using fallback text:', raw.slice(0, 200))
    d = { weeklyThesis: raw.slice(0, 500) }
  }

  // Helper for safe string access with compliance enforcement
  const s = (key: string, fallback = '') => {
    const val = typeof d[key] === 'string' ? d[key] : fallback
    return enforceCompliance(val).cleaned
  }
  const watchpoints: string[] = Array.isArray(d.watchpoints)
    ? d.watchpoints.map((w: string) => enforceCompliance(w).cleaned)
    : []

  const subject = `GeoMoney Weekly Intelligence Report — ${publicationDate}`

  const htmlContent = buildIntelligenceReportHtml({
    publicationDate,
    weeklyThesis: s('weeklyThesis'),
    executiveSummaryPara1: s('executiveSummaryPara1'),
    executiveSummaryPara2: s('executiveSummaryPara2'),
    executiveSummaryPara3: s('executiveSummaryPara3'),
    executiveSummaryConclusion: s('executiveSummaryConclusion'),
    snapshotEnergy: s('snapshotEnergy'),
    snapshotMaterials: s('snapshotMaterials'),
    snapshotCurrency: s('snapshotCurrency'),
    remxLevel: fmtTicker(remx, '[verify level]'),
    mpLevel: fmtTicker(mp, '[verify level]'),
    uupLevel: fmtTicker(uup, '[verify level]'),
    usoLevel: fmtTicker(uso, '[verify level]'),
    marketSnapshotReadthrough: s('marketSnapshotReadthrough'),
    keyDevelopment1Title: s('keyDevelopment1Title', 'Primary Geopolitical Driver'),
    keyDevelopment1Body: s('keyDevelopment1Body'),
    keyDevelopment2Title: s('keyDevelopment2Title', 'Secondary Actor Dynamics'),
    keyDevelopment2Body: s('keyDevelopment2Body'),
    keyDevelopment3Title: s('keyDevelopment3Title', 'Regional Alignment Shift'),
    keyDevelopment3Body: s('keyDevelopment3Body'),
    keyDevelopment4Title: s('keyDevelopment4Title', 'Cross-Cutting Risk Multiplier'),
    keyDevelopment4Body: s('keyDevelopment4Body'),
    scenarioBaseline: s('scenarioBaseline'),
    scenarioEscalation: s('scenarioEscalation'),
    scenarioDeescalation: s('scenarioDeescalation'),
    scenarioCriticalMaterials: s('scenarioCriticalMaterials'),
    watchpoints,
  })

  return { subject, htmlContent }
}

function buildIntelligenceReportHtml(p: {
  publicationDate: string
  weeklyThesis: string
  executiveSummaryPara1: string
  executiveSummaryPara2: string
  executiveSummaryPara3: string
  executiveSummaryConclusion: string
  snapshotEnergy: string
  snapshotMaterials: string
  snapshotCurrency: string
  remxLevel: string
  mpLevel: string
  uupLevel: string
  usoLevel: string
  marketSnapshotReadthrough: string
  keyDevelopment1Title: string
  keyDevelopment1Body: string
  keyDevelopment2Title: string
  keyDevelopment2Body: string
  keyDevelopment3Title: string
  keyDevelopment3Body: string
  keyDevelopment4Title: string
  keyDevelopment4Body: string
  scenarioBaseline: string
  scenarioEscalation: string
  scenarioDeescalation: string
  scenarioCriticalMaterials: string
  watchpoints: string[]
}): string {
  const gold = '#D4AF37'
  const bg = '#0a0a0a'
  const cardBg = '#111111'
  const border = '#222222'
  const text = '#d0d0d0'
  const muted = '#888888'
  const accent = '#1a1a1a'

  const sectionTitle = (title: string) =>
    `<h2 style="color:${gold};font-size:15px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid ${border};">${title}</h2>`

  const card = (content: string) =>
    `<div style="background:${cardBg};border:1px solid ${border};border-radius:8px;padding:20px 24px;margin-bottom:8px;">${content}</div>`

  const subheading = (title: string, color = gold) =>
    `<div style="color:${color};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${title}</div>`

  const para = (text: string) =>
    `<p style="color:${text};font-size:13px;line-height:1.75;margin:0 0 10px;">${text}</p>`

  const layerRow = (num: string, title: string, desc: string) => `
    <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid ${border};">
      <div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:${accent};border:1px solid ${border};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${gold};text-align:center;line-height:28px;">${num}</div>
      <div>
        <div style="color:#ffffff;font-size:12px;font-weight:700;margin-bottom:3px;">${title}</div>
        <div style="color:${muted};font-size:12px;line-height:1.6;">${desc}</div>
      </div>
    </div>`

  const scenarioRow = (label: string, dotColor: string, body: string) => `
    <div style="padding:16px 0;border-bottom:1px solid ${border};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0;"></div>
        <div style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.5px;">${label}</div>
      </div>
      <div style="color:${text};font-size:12px;line-height:1.7;padding-left:16px;">${body}</div>
    </div>`

  const devItem = (num: string, title: string, body: string) => `
    <div style="padding:16px 0;border-bottom:1px solid ${border};">
      <div style="display:flex;gap:12px;">
        <div style="flex-shrink:0;color:${gold};font-size:11px;font-weight:700;min-width:20px;">${num}.</div>
        <div>
          <div style="color:#ffffff;font-size:13px;font-weight:700;margin-bottom:5px;">${title}</div>
          <div style="color:${text};font-size:12px;line-height:1.7;">${body}</div>
        </div>
      </div>
    </div>`

  const tickerRow = (label: string, level: string) => `
    <tr>
      <td style="padding:8px 12px;color:${muted};font-size:12px;border-bottom:1px solid ${border};">${label}</td>
      <td style="padding:8px 12px;color:#ffffff;font-size:12px;font-family:monospace;border-bottom:1px solid ${border};text-align:right;">${level}</td>
    </tr>`

  const watchpointList = p.watchpoints
    .map(w => `<li style="color:${text};font-size:12px;line-height:1.7;margin-bottom:6px;">${w}</li>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GeoMoney Intelligence Report</title>
</head>
<body style="margin:0;padding:0;background-color:${bg};color:${text};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:660px;margin:0 auto;padding:32px 20px;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid ${gold};">
    <p style="color:${muted};font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Intelligence Platform</p>
    <h1 style="color:${gold};margin:0 0 4px;font-size:26px;letter-spacing:3px;font-weight:800;">GEOMONEY</h1>
    <h2 style="color:#ffffff;margin:0 0 12px;font-size:14px;font-weight:400;letter-spacing:2px;">WEEKLY INTELLIGENCE REPORT</h2>
    <div style="display:inline-block;background:${accent};border:1px solid ${border};border-radius:4px;padding:6px 16px;">
      <span style="color:${muted};font-size:11px;">Data as of: </span>
      <span style="color:#ffffff;font-size:11px;font-weight:600;">${p.publicationDate}</span>
    </div>
    <div style="margin-top:8px;">
      <span style="color:${muted};font-size:10px;">Time horizon: Weekly intelligence horizon&nbsp;&nbsp;·&nbsp;&nbsp;Use: Informational and analytical only</span>
    </div>
  </div>

  <!-- Weekly Thesis -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Weekly Thesis')}
    ${card(`<p style="color:${text};font-size:13px;line-height:1.8;margin:0;font-style:italic;">${p.weeklyThesis}</p>`)}
  </div>

  <!-- Executive Summary -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Executive Summary')}
    ${card(`
      <p style="color:${text};font-size:13px;line-height:1.8;margin:0 0 12px;">${p.executiveSummaryPara1}</p>
      <p style="color:${text};font-size:13px;line-height:1.8;margin:0 0 12px;">${p.executiveSummaryPara2}</p>
      <p style="color:${text};font-size:13px;line-height:1.8;margin:0 0 12px;">${p.executiveSummaryPara3}</p>
      <div style="background:${accent};border-left:3px solid ${gold};padding:10px 14px;border-radius:0 4px 4px 0;">
        <p style="color:#ffffff;font-size:12px;font-weight:600;line-height:1.7;margin:0;">${p.executiveSummaryConclusion}</p>
      </div>
    `)}
  </div>

  <!-- System Snapshot -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('System Snapshot')}
    <div style="display:grid;gap:8px;">
      ${card(`${subheading('Energy')}<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${p.snapshotEnergy}</p>`)}
      ${card(`${subheading('Critical Materials')}<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${p.snapshotMaterials}</p>`)}
      ${card(`${subheading('Currency &amp; Capital Flows')}<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${p.snapshotCurrency}</p>`)}
    </div>
  </div>

  <!-- Market Snapshot -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Market Snapshot')}
    <p style="color:${muted};font-size:11px;margin:0 0 10px;font-style:italic;">For reference only. Verify all levels before use.</p>
    ${card(`
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="">
            <th style="padding:8px 12px;color:${muted};font-size:11px;font-weight:600;letter-spacing:1px;text-align:left;border-bottom:1px solid ${border};">INSTRUMENT</th>
            <th style="padding:8px 12px;color:${muted};font-size:11px;font-weight:600;letter-spacing:1px;text-align:right;border-bottom:1px solid ${border};">LEVEL / WEEKLY CHANGE</th>
          </tr>
        </thead>
        <tbody>
          ${tickerRow('Rare Earths Exposure Proxy (REMX)', p.remxLevel)}
          ${tickerRow('MP Materials (MP)', p.mpLevel)}
          ${tickerRow('USD Proxy (UUP)', p.uupLevel)}
          ${tickerRow('Oil Exposure Proxy (USO)', p.usoLevel)}
        </tbody>
      </table>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid ${border};">
        <div style="color:${gold};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Read-Through</div>
        <p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${p.marketSnapshotReadthrough}</p>
      </div>
    `)}
  </div>

  <!-- Key Developments -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Key Developments')}
    ${card(`
      <div>
        ${devItem('1', p.keyDevelopment1Title, p.keyDevelopment1Body)}
        ${devItem('2', p.keyDevelopment2Title, p.keyDevelopment2Body)}
        ${devItem('3', p.keyDevelopment3Title, p.keyDevelopment3Body)}
        <div style="padding-top:16px;">
          <div style="display:flex;gap:12px;">
            <div style="flex-shrink:0;color:${gold};font-size:11px;font-weight:700;min-width:20px;">4.</div>
            <div>
              <div style="color:#ffffff;font-size:13px;font-weight:700;margin-bottom:5px;">${p.keyDevelopment4Title}</div>
              <div style="color:${text};font-size:12px;line-height:1.7;">${p.keyDevelopment4Body}</div>
            </div>
          </div>
        </div>
      </div>
    `)}
  </div>

  <!-- Transmission Map -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Transmission Map')}
    <p style="color:${muted};font-size:12px;margin:0 0 10px;">This week's transmission pattern read through four layers:</p>
    ${card(`
      ${layerRow('1', 'Conflict', 'Military and diplomatic escalation increases uncertainty around physical supply continuity, sanctions enforcement, and regional stability.')}
      ${layerRow('2', 'Energy', 'Energy markets price the possibility of disruption before disruption is fully realized. This makes energy the fastest transmission channel from geopolitical risk into broader market behavior.')}
      ${layerRow('3', 'Materials &amp; Industry', 'Strategic materials respond less visibly at first, especially when pricing is opaque. But once policy changes, export controls, or production constraints emerge, repricing can occur abruptly.')}
      <div style="display:flex;gap:16px;padding-top:12px;">
        <div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:${accent};border:1px solid ${border};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${gold};text-align:center;line-height:28px;">4</div>
        <div>
          <div style="color:#ffffff;font-size:12px;font-weight:700;margin-bottom:3px;">Currency &amp; Capital Preference</div>
          <div style="color:${muted};font-size:12px;line-height:1.6;">As stress persists, capital behavior shifts selectively toward perceived resilience, liquidity, and hard-asset exposure. The key point is not wholesale flight, but gradual reweighting of attention and preference.</div>
        </div>
      </div>
    `)}
  </div>

  <!-- Scenario Outlook -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Scenario Outlook')}
    ${card(`
      ${scenarioRow('Baseline Scenario', '#51cf66', p.scenarioBaseline)}
      ${scenarioRow('Escalation Scenario', '#ff6b6b', p.scenarioEscalation)}
      ${scenarioRow('De-escalation Scenario', '#4dabf7', p.scenarioDeescalation)}
      <div style="padding-top:16px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${gold};flex-shrink:0;"></div>
          <div style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.5px;">Critical-Materials Scenario</div>
        </div>
        <div style="color:${text};font-size:12px;line-height:1.7;padding-left:16px;">${p.scenarioCriticalMaterials}</div>
      </div>
    `)}
  </div>

  <!-- Strategic Watchpoints -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Strategic Watchpoints')}
    <p style="color:${muted};font-size:12px;margin:0 0 10px;">The following indicators are most important to monitor over the next reporting window:</p>
    ${card(`<ul style="margin:0;padding-left:20px;">${watchpointList}</ul>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid ${border};">
        <p style="color:${muted};font-size:11px;font-style:italic;margin:0;">These watchpoints are not trade signals. They are system indicators that help determine whether current geopolitical stress remains contained or begins to propagate more broadly.</p>
      </div>
    `)}
  </div>

  <!-- GeoMoney Note -->
  <div style="margin-bottom:32px;">
    ${card(`
      <div style="color:${gold};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">GeoMoney Note</div>
      <p style="color:${muted};font-size:12px;line-height:1.75;margin:0;">GeoMoney analyzes how geopolitical developments transmit through energy systems, strategic materials, capital flows, and market structure. The purpose of this report is to improve understanding of system behavior under stress, not to provide investment, trading, legal, or financial advice.</p>
    `)}
  </div>

  <!-- Footer -->
  <div style="padding-top:20px;border-top:1px solid ${border};text-align:center;">
    <p style="color:${gold};font-size:13px;font-weight:700;letter-spacing:2px;margin:0 0 6px;">GEOMONEY</p>
    <p style="color:${muted};font-size:11px;margin:0 0 12px;">
      <a href="https://geomoneytv.com" style="color:${gold};text-decoration:none;">geomoneytv.com</a>
    </p>
    <p style="color:#555;font-size:10px;margin:0;line-height:1.6;">
      &copy; ${new Date().getFullYear()} GeoMoney Intelligence Platform. All rights reserved.<br/>
      This report is for informational and analytical purposes only and does not constitute financial or investment advice.
    </p>
  </div>

</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// GeoMoney Daily Materials Intelligence Report
// Based on user-tracked critical materials
// ─────────────────────────────────────────────────────────────────────────────

export async function generateDailyReport(): Promise<{ subject: string; htmlContent: string }> {
  const [articles, materials, tickers] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { title: true, category: true, aiSummary: true, aiAnalysis: true, createdAt: true },
    }),
    prisma.rareEarthMaterial.findMany({
      select: { id: true, name: true, symbol: true, category: true, price: true, unit: true, supply: true, demand: true, countries: true },
    }),
    prisma.commodityPrice.findMany({
      select: { label: true, symbol: true, price: true, change: true, previousClose: true, type: true },
    }),
  ])

  const aiModel = await getAiModel()
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter API key not configured')

  const publicationDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const materialsCtx = materials
    .map(m => {
      let countries = ''
      try { countries = JSON.parse(m.countries || '[]').join(', ') } catch {}
      return `• ${m.name} (${m.symbol}) [${m.category}]: ${m.price != null ? `$${m.price} per ${m.unit || 'unit'}` : 'Price N/A'} | Supply: ${m.supply || 'N/A'} | Demand: ${m.demand || 'N/A'} | Countries: ${countries || 'N/A'}`
    })
    .join('\n') || 'No critical materials data available.'

  const articlesCtx = articles
    .map(a => `• [${a.category.toUpperCase()}] ${a.title}: ${a.aiSummary || a.aiAnalysis || 'No summary'}`)
    .join('\n') || 'No recent articles.'

  const tickersCtx = tickers
    .map(t => {
      const chg = t.change != null ? (t.change >= 0 ? `+${t.change.toFixed(2)}` : t.change.toFixed(2)) : 'N/A'
      return `• ${t.label} (${t.symbol}): $${t.price.toFixed(2)} [${chg}]`
    })
    .join('\n') || 'No ticker data.'

  const prompt = `You are a senior critical materials and geopolitical intelligence analyst for GeoMoney. Today is ${publicationDate}.

${COMPLIANCE_PROMPT}

Your task: write the GeoMoney Daily Materials Intelligence Report in structured JSON. This report focuses on CRITICAL MATERIALS (rare earths, strategic minerals) and how geopolitical events affect their supply chains, pricing, and strategic importance.

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

  const aiData = await fetchOpenRouterWithRetry({
    model: aiModel,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.4,
  }, apiKey)

  let raw = aiData.choices?.[0]?.message?.content || '{}'
  raw = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()

  let d: Record<string, any> = {}
  try {
    d = JSON.parse(raw)
  } catch {
    console.error('Failed to parse daily report AI JSON:', raw.slice(0, 200))
    d = { dailyThesis: raw.slice(0, 500) }
  }

  const s = (key: string, fallback = '') => {
    const val = typeof d[key] === 'string' ? d[key] : fallback
    return enforceCompliance(val).cleaned
  }
  const materialHighlights: Array<{ name: string; priceNote: string; supplyChainStatus: string; geopoliticalExposure: string }> =
    Array.isArray(d.materialHighlights) ? d.materialHighlights : []
  const watchpoints: string[] = Array.isArray(d.watchpoints)
    ? d.watchpoints.map((w: string) => enforceCompliance(w).cleaned)
    : []

  const subject = `GeoMoney Daily Materials Report — ${publicationDate}`
  const htmlContent = buildDailyReportHtml({
    publicationDate,
    dailyThesis: s('dailyThesis'),
    executiveSummary: s('executiveSummary'),
    materialHighlights,
    supplyChainAnalysis: s('supplyChainAnalysis'),
    policyWatch: s('policyWatch'),
    geopoliticalTransmission: s('geopoliticalTransmission'),
    scenarioDaily: s('scenarioDaily'),
    watchpoints,
  })

  return { subject, htmlContent }
}

function buildDailyReportHtml(p: {
  publicationDate: string
  dailyThesis: string
  executiveSummary: string
  materialHighlights: Array<{ name: string; priceNote: string; supplyChainStatus: string; geopoliticalExposure: string }>
  supplyChainAnalysis: string
  policyWatch: string
  geopoliticalTransmission: string
  scenarioDaily: string
  watchpoints: string[]
}): string {
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

  const materialsHtml = p.materialHighlights.map((m, i) => `
    <div style="padding:14px 0;${i < p.materialHighlights.length - 1 ? `border-bottom:1px solid ${border};` : ''}">
      <div style="color:${gold};font-size:13px;font-weight:700;margin-bottom:6px;">${enforceCompliance(m.name).cleaned}</div>
      <div style="color:${text};font-size:12px;line-height:1.7;margin-bottom:4px;"><strong style="color:#fff;">Price:</strong> ${enforceCompliance(m.priceNote).cleaned}</div>
      <div style="color:${text};font-size:12px;line-height:1.7;margin-bottom:4px;"><strong style="color:#fff;">Supply Chain:</strong> ${enforceCompliance(m.supplyChainStatus).cleaned}</div>
      <div style="color:${text};font-size:12px;line-height:1.7;"><strong style="color:#fff;">Geopolitical Exposure:</strong> ${enforceCompliance(m.geopoliticalExposure).cleaned}</div>
    </div>
  `).join('')

  const watchpointHtml = p.watchpoints
    .map(w => `<li style="color:${text};font-size:12px;line-height:1.7;margin-bottom:6px;">${w}</li>`)
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

  <!-- Header -->
  <div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid ${gold};">
    <p style="color:${muted};font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px;">Intelligence Platform</p>
    <h1 style="color:${gold};margin:0 0 4px;font-size:26px;letter-spacing:3px;font-weight:800;">GEOMONEY</h1>
    <h2 style="color:#ffffff;margin:0 0 12px;font-size:14px;font-weight:400;letter-spacing:2px;">DAILY MATERIALS INTELLIGENCE REPORT</h2>
    <div style="display:inline-block;background:#1a1a1a;border:1px solid ${border};border-radius:4px;padding:6px 16px;">
      <span style="color:${muted};font-size:11px;">Data as of: </span>
      <span style="color:#ffffff;font-size:11px;font-weight:600;">${p.publicationDate}</span>
    </div>
    <div style="margin-top:8px;">
      <span style="color:${muted};font-size:10px;">Focus: Critical Materials &amp; Strategic Minerals&nbsp;&nbsp;&middot;&nbsp;&nbsp;Use: Informational and analytical only</span>
    </div>
  </div>

  <!-- Daily Thesis -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Daily Thesis')}
    ${card(`<p style="color:${text};font-size:13px;line-height:1.8;margin:0;font-style:italic;">${p.dailyThesis}</p>`)}
  </div>

  <!-- Executive Summary -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Executive Summary')}
    ${card(`<p style="color:${text};font-size:13px;line-height:1.8;margin:0;">${p.executiveSummary}</p>`)}
  </div>

  <!-- Material Highlights -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Material Highlights')}
    ${card(materialsHtml || `<p style="color:${muted};font-size:12px;">No material highlights available.</p>`)}
  </div>

  <!-- Supply Chain Analysis -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Supply Chain Analysis')}
    ${card(`<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${p.supplyChainAnalysis}</p>`)}
  </div>

  <!-- Policy Watch -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Policy Watch')}
    ${card(`<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${p.policyWatch}</p>`)}
  </div>

  <!-- Geopolitical Transmission -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Geopolitical Transmission')}
    ${card(`<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${p.geopoliticalTransmission}</p>`)}
  </div>

  <!-- Scenario Outlook -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Daily Scenario Outlook')}
    ${card(`<p style="color:${text};font-size:12px;line-height:1.75;margin:0;">${p.scenarioDaily}</p>`)}
  </div>

  <!-- Watchpoints -->
  <div style="margin-bottom:28px;">
    ${sectionTitle('Watchpoints')}
    ${card(`
      <ul style="margin:0;padding-left:20px;">${watchpointHtml}</ul>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid ${border};">
        <p style="color:${muted};font-size:11px;font-style:italic;margin:0;">These watchpoints are system indicators, not trade signals.</p>
      </div>
    `)}
  </div>

  <!-- Disclaimer -->
  <div style="margin-bottom:32px;">
    ${card(`
      <div style="color:${gold};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Disclaimer</div>
      <p style="color:${muted};font-size:12px;line-height:1.75;margin:0;">This report is for informational and analytical purposes only and does not constitute financial or investment advice. GeoMoney analyzes how geopolitical developments transmit through critical materials, energy systems, and market structure.</p>
    `)}
  </div>

  <!-- Footer -->
  <div style="padding-top:20px;border-top:1px solid ${border};text-align:center;">
    <p style="color:${gold};font-size:13px;font-weight:700;letter-spacing:2px;margin:0 0 6px;">GEOMONEY</p>
    <p style="color:${muted};font-size:11px;margin:0 0 12px;">
      <a href="https://geomoneytv.com" style="color:${gold};text-decoration:none;">geomoneytv.com</a>
    </p>
    <p style="color:#555;font-size:10px;margin:0;line-height:1.6;">
      &copy; ${new Date().getFullYear()} GeoMoney Intelligence Platform. All rights reserved.<br/>
      This report is for informational and analytical purposes only and does not constitute financial or investment advice.
    </p>
  </div>

</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compatible alias
// ─────────────────────────────────────────────────────────────────────────────
export const generateIntelligenceReport = generateWeeklyReport
export const generateNewsletterContent = generateWeeklyReport

export async function sendNewsletter(
  subject: string,
  htmlContent: string,
  recipients: string[] | 'all' | string,
  options?: { reportType?: 'daily' | 'weekly'; attachPdf?: boolean },
) {
  // Get SMTP settings
  const smtpSettings = await prisma.siteSettings.findMany({
    where: {
      key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email'] },
    },
  })

  const smtp: Record<string, string> = {}
  smtpSettings.forEach((s) => (smtp[s.key] = s.value))

  if (!smtp.smtp_user || !smtp.smtp_pass) {
    throw new Error('SMTP not configured. Go to Settings → Email/SMTP to configure.')
  }

  // Create transporter
  const smtpPort = parseInt(smtp.smtp_port || '587')
  const smtpSecure = smtpPort === 465
  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpSecure,           // true for port 465 (SSL), false for 587 (STARTTLS)
    requireTLS: !smtpSecure,      // enforce STARTTLS upgrade on port 587
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    auth: {
      user: smtp.smtp_user,
      pass: smtp.smtp_pass,
    },
    tls: {
      rejectUnauthorized: false,  // allow self-signed certs on shared hosting
    },
  })

  // Determine recipients
  let emailList: string[] = []

  if (recipients === 'all') {
    // Send to all active subscribers
    const subscribers = await prisma.newsletter.findMany({
      where: { active: true },
      select: { email: true },
    })
    emailList = subscribers.map((s) => s.email)
  } else if (Array.isArray(recipients)) {
    emailList = recipients
  } else if (typeof recipients === 'string') {
    emailList = [recipients]
  }

  if (emailList.length === 0) {
    throw new Error('No recipients specified')
  }

  const fromAddress = `${smtp.smtp_from_name || 'GeoMoney TV'} <${smtp.smtp_from_email || smtp.smtp_user}>`

  // Generate PDF attachment if requested
  let pdfBuffer: Buffer | null = null
  let pdfFilename = 'GeoMoney-Report.pdf'
  if (options?.attachPdf) {
    try {
      const dateStr = new Date().toISOString().split('T')[0]
      const typeLabel = options.reportType === 'daily' ? 'Daily-Materials' : 'Weekly-Intelligence'
      pdfFilename = `GeoMoney-${typeLabel}-Report-${dateStr}.pdf`
      pdfBuffer = await generatePdfFromHtml(htmlContent)
      console.log(`[sendNewsletter] PDF generated: ${pdfFilename} (${pdfBuffer.length} bytes)`)
    } catch (pdfErr: any) {
      console.error('[sendNewsletter] PDF generation failed (sending without attachment):', pdfErr.message)
    }
  }

  // Send emails (in batches for large lists)
  let sentCount = 0
  const batchSize = 10
  const errors: string[] = []

  for (let i = 0; i < emailList.length; i += batchSize) {
    const batch = emailList.slice(i, i + batchSize)

    const promises = batch.map(async (email) => {
      try {
        const mailOpts: any = {
          from: fromAddress,
          to: email,
          subject,
          html: htmlContent,
        }
        if (pdfBuffer) {
          mailOpts.attachments = [
            { filename: pdfFilename, content: pdfBuffer, contentType: 'application/pdf' },
          ]
        }
        await transporter.sendMail(mailOpts)
        sentCount++
      } catch (err: any) {
        console.error(`Failed to send to ${email}:`, err.message)
        errors.push(`${email}: ${err.message}`)
      }
    })

    await Promise.all(promises)
  }

  // Record in database
  await prisma.newsletterReport.create({
    data: {
      subject,
      reportType: options?.reportType || 'weekly',
      htmlContent,
      sentTo: JSON.stringify(emailList),
      sentCount,
    },
  })

  return { sentCount, totalRecipients: emailList.length, errors }
}
