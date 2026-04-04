import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.article.updateMany({
      where: { published: false },
      data: { published: true },
    })

    return NextResponse.json({ 
      message: `Published ${result.count} articles`,
      count: result.count 
    })
  } catch (error) {
    console.error('Error publishing articles:', error)
    return NextResponse.json({ error: 'Failed to publish articles' }, { status: 500 })
  }
}
