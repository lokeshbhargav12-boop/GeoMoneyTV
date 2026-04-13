import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  generateIntelligenceReport,
  generateNewsletterContent,
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

    if (type === 'intelligence-report') {
      ;({ subject, htmlContent } = await generateIntelligenceReport())
    } else if (type === 'weekly-newsletter') {
      ;({ subject, htmlContent } = await generateNewsletterContent())
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "intelligence-report" or "weekly-newsletter".' }, { status: 400 })
    }

    const result = await sendNewsletter(subject, htmlContent, 'all')

    return NextResponse.json({
      success: true,
      subject,
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
