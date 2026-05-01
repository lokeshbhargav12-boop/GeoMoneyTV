import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newsSources, newsApiKey } = await req.json()

    // Save news sources
    await prisma.siteSettings.upsert({
      where: { key: 'news_sources' },
      update: { value: JSON.stringify(newsSources) },
      create: { key: 'news_sources', value: JSON.stringify(newsSources) },
    })

    // Save NewsAPI key
    await prisma.siteSettings.upsert({
      where: { key: 'news_api_key' },
      update: { value: newsApiKey },
      create: { key: 'news_api_key', value: newsApiKey },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('News settings save error:', error)
    return NextResponse.json({ error: 'Failed to save news settings' }, { status: 500 })
  }
}
