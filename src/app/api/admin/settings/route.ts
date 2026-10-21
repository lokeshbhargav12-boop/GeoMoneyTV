import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

const LOGO_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_LOGO_SIZE = 5 * 1024 * 1024

async function resolveLogoUrl(rawValue?: string | null): Promise<string | null> {
  const value = rawValue?.trim()
  if (!value) return null

  if (value.startsWith('/api/media/')) {
    const assetId = value.replace('/api/media/', '').split('?')[0].split('#')[0]
    if (!assetId) return null

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: { id: true },
    })

    return asset ? value : null
  }

  if (value.startsWith('/uploads/')) {
    const relativePath = value.replace(/^\/uploads\//, '')
    const localFilePath = path.join(process.cwd(), 'public', 'uploads', relativePath)
    return fs.existsSync(localFilePath) ? value : null
  }

  return value
}

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
    for (const setting of settings) {
      if (setting.key === 'ticker_symbols' || setting.key === 'news_sources') {
        try {
          settingsMap[setting.key === 'ticker_symbols' ? 'tickers' : 'newsSources'] = JSON.parse(setting.value)
        } catch {
          settingsMap[setting.key === 'ticker_symbols' ? 'tickers' : 'newsSources'] = []
        }
      } else if (setting.key === 'logo_url') {
        settingsMap.logoUrl = await resolveLogoUrl(setting.value)
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
    }

    return NextResponse.json({
      logoUrl: settingsMap.logoUrl || '',
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

    if (!LOGO_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid logo format. Allowed types: JPEG, PNG, WEBP, GIF, SVG',
        },
        { status: 400 },
      )
    }

    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json({ error: 'Logo file too large (max 5MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = path.extname(file.name).toLowerCase() || '.png'
    const filename = `logo-${Date.now()}${ext}`
    const newAsset = await prisma.mediaAsset.create({
      data: {
        kind: 'site-logo',
        filename,
        mimeType: file.type,
        data: buffer,
      },
      select: { id: true },
    })

    const logoUrl = `/api/media/${newAsset.id}`

    const previousLogo = await prisma.siteSettings.findUnique({
      where: { key: 'logo_url' },
      select: { value: true },
    })

    // Update database
    await prisma.siteSettings.upsert({
      where: { key: 'logo_url' },
      update: { value: logoUrl },
      create: { key: 'logo_url', value: logoUrl },
    })

    const previousValue = previousLogo?.value?.trim()
    if (previousValue?.startsWith('/api/media/')) {
      const previousAssetId = previousValue.replace('/api/media/', '').split('?')[0].split('#')[0]
      if (previousAssetId && previousAssetId !== newAsset.id) {
        await prisma.mediaAsset.deleteMany({ where: { id: previousAssetId, kind: 'site-logo' } })
      }
    }

    return NextResponse.json({ logoUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to update logo' }, { status: 500 })
  }
}
