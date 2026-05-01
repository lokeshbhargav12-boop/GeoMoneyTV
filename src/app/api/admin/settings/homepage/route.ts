import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const keys = ['hero_title', 'hero_subtitle', 'newsletter_title', 'newsletter_subtitle', 'partner_logos', 'footer_text']
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: keys } },
    })

    const map: Record<string, string> = {}
    settings.forEach((s) => (map[s.key] = s.value))

    return NextResponse.json({
      heroTitle: map['hero_title'] || '',
      heroSubtitle: map['hero_subtitle'] || '',
      newsletterTitle: map['newsletter_title'] || '',
      newsletterSubtitle: map['newsletter_subtitle'] || '',
      partnerLogos: map['partner_logos'] || '',
      footerText: map['footer_text'] || '',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch homepage settings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const fields: Record<string, string> = {
      hero_title: body.heroTitle || '',
      hero_subtitle: body.heroSubtitle || '',
      newsletter_title: body.newsletterTitle || '',
      newsletter_subtitle: body.newsletterSubtitle || '',
      partner_logos: body.partnerLogos || '',
      footer_text: body.footerText || '',
    }

    for (const [key, value] of Object.entries(fields)) {
      await prisma.siteSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save homepage settings' }, { status: 500 })
  }
}
