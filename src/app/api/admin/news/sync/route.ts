import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncNewsToDatabase } from '@/lib/news-service'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const count = await syncNewsToDatabase(userId)

    return NextResponse.json({ 
      success: true, 
      count,
      message: `Successfully synced ${count} new articles` 
    })
  } catch (error) {
    console.error('News sync error:', error)
    return NextResponse.json({ 
      error: 'Failed to sync news',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
