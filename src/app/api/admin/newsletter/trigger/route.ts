import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  generateWeeklyReport,
  generateDailyReport,
  sendNewsletter,
} from '@/lib/newsletter-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await req.json()

    let subject: string
    let htmlContent: string
    let reportType: 'daily' | 'weekly'

    if (type === 'daily-report') {
      ;({ subject, htmlContent } = await generateDailyReport())
      reportType = 'daily'
    } else if (type === 'weekly-report') {
      ;({ subject, htmlContent } = await generateWeeklyReport())
      reportType = 'weekly'
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "daily-report" or "weekly-report".' }, { status: 400 })
    }

    const result = await sendNewsletter(subject, htmlContent, 'all', {
      reportType,
      attachPdf: true,
    })

    return NextResponse.json({
      success: true,
      subject,
      reportType,
      sentCount: result.sentCount,
      totalRecipients: result.totalRecipients,
      errors: result.errors,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[admin/trigger] failed:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
