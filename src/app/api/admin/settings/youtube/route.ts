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

    const { youtubeChannelId, youtubeApiKey } = await req.json()

    await prisma.siteSettings.upsert({
      where: { key: 'youtube_channel_id' },
      update: { value: youtubeChannelId || '' },
      create: { key: 'youtube_channel_id', value: youtubeChannelId || '' },
    })

    await prisma.siteSettings.upsert({
      where: { key: 'youtube_api_key' },
      update: { value: youtubeApiKey || '' },
      create: { key: 'youtube_api_key', value: youtubeApiKey || '' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('YouTube settings error:', error)
    return NextResponse.json({ error: 'Failed to save YouTube settings' }, { status: 500 })
  }
}
