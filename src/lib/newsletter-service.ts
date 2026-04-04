import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function generateNewsletterContent() {
  // Gather data for AI prediction
  const [articles, materials, tickers] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { title: true, category: true, aiSummary: true, createdAt: true },
    }),
    prisma.rareEarthMaterial.findMany({
      select: { name: true, symbol: true, category: true, price: true, unit: true },
    }),
    prisma.commodityPrice.findMany({
      select: { label: true, symbol: true, price: true, change: true, type: true },
    }),
  ])

  // Get AI model from settings
  const aiModelSetting = await prisma.siteSettings.findUnique({
    where: { key: 'ai_model' },
  })
  const aiModel = aiModelSetting?.value || 'arcee-ai/trinity-large-preview:free'
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured')
  }

  // Build context for AI
  const articlesContext = articles.map(a => `- ${a.title} (${a.category}): ${a.aiSummary || 'No summary'}`).join('\n')
  const materialsContext = materials.map(m => `- ${m.name} (${m.symbol}): $${m.price || 'N/A'} per ${m.unit || 'unit'}`).join('\n')
  const tickersContext = tickers.map(t => `- ${t.label} (${t.symbol}): $${t.price} (Change: ${t.change || 0})`).join('\n')

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const prompt = `You are a senior geopolitical and market analyst for GeoMoney TV, a premium intelligence platform.
Generate a detailed weekly newsletter report for subscribers. Today is ${currentDate}.

LATEST ARTICLES (for context):
${articlesContext || 'No recent articles'}

CRITICAL MATERIALS PRICES:
${materialsContext || 'No materials data'}

MARKET TICKERS:
${tickersContext || 'No ticker data'}

Generate the newsletter in HTML format with the following sections:
1. **Executive Summary** - Key takeaways for the week (2-3 paragraphs)
2. **Market Overview** - Analysis of current market conditions based on ticker data
3. **Critical Materials Watch** - Price trends and supply chain analysis based on materials data
4. **Geopolitical Developments** - Analysis from recent articles
5. **Scenario Projections** - Forward-looking scenario outlooks for the next week (specific, data-driven):
   - Commodity price direction projections
   - Geopolitical risk assessments
   - Critical material supply chain forecasts
6. **Market Structure Signals** - Key system signals and capital flow dynamics to observe

Use professional HTML styling with inline styles. Use a dark theme (background #0a0a0a, text #e0e0e0).
Use gold (#D4AF37) for headings. Include proper spacing and professional typography.
Make the newsletter look premium and data-rich. Include specific numbers and percentages where possible.
Do NOT include any wrapping markdown code blocks, ONLY return raw HTML.`

  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://geomoneytv.com',
    },
    body: JSON.stringify({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
    }),
  })

  if (!aiResponse.ok) {
    const errData = await aiResponse.text()
    console.error('AI API error:', errData)
    throw new Error('AI generation failed')
  }

  const aiData = await aiResponse.json()
  let htmlContent = aiData.choices?.[0]?.message?.content || ''

  // Clean up markdown code fences if present
  htmlContent = htmlContent.replace(/^```html?\s*/i, '').replace(/\s*```$/i, '').trim()

  // Wrap in email template
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GeoMoney TV Weekly Intelligence Report</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e0e0e0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:680px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #D4AF37;">
    <h1 style="color:#D4AF37;margin:0;font-size:28px;letter-spacing:2px;">GEOMONEY TV</h1>
    <p style="color:#888;margin:8px 0 0;font-size:14px;">Weekly Intelligence Report • ${currentDate}</p>
  </div>
  ${htmlContent}
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #333;text-align:center;">
    <p style="color:#888;font-size:12px;margin:0;">
      © ${new Date().getFullYear()} GeoMoney TV. All rights reserved.<br/>
      <a href="https://geomoneytv.com" style="color:#D4AF37;text-decoration:none;">geomoneytv.com</a>
    </p>
    <p style="color:#666;font-size:10px;margin:12px 0 0;">
      This report is generated by AI and is for informational purposes only. Not financial advice.
    </p>
  </div>
</div>
</body>
</html>`

  const subject = `GeoMoney TV Intelligence Report – ${currentDate}`

  return { subject, htmlContent }
}

export async function sendNewsletter(subject: string, htmlContent: string, recipients: string[] | 'all' | string) {
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
  const transporter = nodemailer.createTransport({
    host: smtp.smtp_host || 'smtp.gmail.com',
    port: parseInt(smtp.smtp_port || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: smtp.smtp_user,
      pass: smtp.smtp_pass,
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

  // Send emails (in batches for large lists)
  let sentCount = 0
  const batchSize = 10
  const errors: string[] = []

  for (let i = 0; i < emailList.length; i += batchSize) {
    const batch = emailList.slice(i, i + batchSize)

    const promises = batch.map(async (email) => {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject,
          html: htmlContent,
        })
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
      htmlContent,
      sentTo: JSON.stringify(emailList),
      sentCount,
    },
  })

  return { sentCount, totalRecipients: emailList.length, errors }
}
