import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: [
            'logo_url', 'ticker_symbols', 'news_sources', 'news_api_key', 'alpha_vantage_key', 'ai_model',
            'youtube_channel_id', 'youtube_api_key',
            'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email',
            'hero_title', 'hero_subtitle', 'newsletter_title', 'newsletter_subtitle', 'partner_logos', 'footer_text'
          ]
        }
      }
    })

    const settingsMap: any = {}
    settings.forEach((setting) => {
      if (setting.key === 'ticker_symbols' || setting.key === 'news_sources') {
        try {
          settingsMap[setting.key === 'ticker_symbols' ? 'tickers' : 'newsSources'] = JSON.parse(setting.value)
        } catch {
          settingsMap[setting.key === 'ticker_symbols' ? 'tickers' : 'newsSources'] = []
        }
      } else if (setting.key === 'logo_url') {
        settingsMap.logoUrl = setting.value
      } else if (setting.key === 'news_api_key') {
        settingsMap.newsApiKey = setting.value
      } else if (setting.key === 'alpha_vantage_key') {
        settingsMap.alphaVantageKey = setting.value
      } else if (setting.key === 'ai_model') {
        settingsMap.aiModel = setting.value
      } else {
        // Map all other keys using camelCase conversion
        const camelKey = setting.key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
        settingsMap[camelKey] = setting.value
      }
    })

    return NextResponse.json({
      logoUrl: settingsMap.logoUrl || '/logo.png',
      tickers: settingsMap.tickers || [],
      newsSources: settingsMap.newsSources || [],
      newsApiKey: settingsMap.newsApiKey || '',
      alphaVantageKey: settingsMap.alphaVantageKey || '',
      aiModel: settingsMap.aiModel || 'arcee-ai/trinity-large-preview:free',
      youtubeChannelId: settingsMap.youtubeChannelId || 'UCGb6oaBpGLmLYnxUHmLXFAQ',
      youtubeApiKey: settingsMap.youtubeApiKey || '',
      smtpHost: settingsMap.smtpHost || 'smtp.gmail.com',
      smtpPort: settingsMap.smtpPort || '587',
      smtpUser: settingsMap.smtpUser || '',
      smtpPass: settingsMap.smtpPass || '',
      smtpFromName: settingsMap.smtpFromName || 'GeoMoney TV',
      smtpFromEmail: settingsMap.smtpFromEmail || '',
      heroTitle: settingsMap.heroTitle || '',
      heroSubtitle: settingsMap.heroSubtitle || '',
      newsletterTitle: settingsMap.newsletterTitle || '',
      newsletterSubtitle: settingsMap.newsletterSubtitle || '',
      partnerLogos: settingsMap.partnerLogos || '',
      footerText: settingsMap.footerText || '',
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to public/uploads
    const filename = `logo-${Date.now()}${path.extname(file.name)}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')

    // Ensure directory exists (you might want to use fs.mkdir here if not sure)
    // For now assuming public exists, but uploads might not.
    const fs = require('fs')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const logoUrl = `/uploads/${filename}`

    // Update database
    await prisma.siteSettings.upsert({
      where: { key: 'logo_url' },
      update: { value: logoUrl },
      create: { key: 'logo_url', value: logoUrl },
    })

    return NextResponse.json({ logoUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to update logo' }, { status: 500 })
  }
}
