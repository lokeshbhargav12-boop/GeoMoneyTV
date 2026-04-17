import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateWeeklyReport, generateDailyReport } from '@/lib/newsletter-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const type = body.type || 'weekly'

    let subject: string
    let htmlContent: string

    if (type === 'daily') {
      ; ({ subject, htmlContent } = await generateDailyReport())
    } else {
      ; ({ subject, htmlContent } = await generateWeeklyReport())
    }

    return NextResponse.json({
      subject,
      htmlContent,
      reportType: type,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Newsletter generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate newsletter' }, { status: 500 })
  }
}
