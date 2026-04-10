import { NextResponse } from 'next/server'
import { generateIntelligenceReport, sendNewsletter } from '@/lib/newsletter-service'

export const dynamic = 'force-dynamic'
// Allow up to 300 s on Vercel Pro / Fluid; Hobby plans are capped at 60 s.
export const maxDuration = 300

export async function GET(req: Request) {
  // Require CRON_SECRET to prevent unauthorised triggers
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    console.log('[intelligence-report] Starting daily intelligence report job…')

    // 1. Generate AI-powered report
    console.log('[intelligence-report] Generating report content…')
    const { subject, htmlContent } = await generateIntelligenceReport()
    console.log('[intelligence-report] Report generated:', subject)

    // 2. Send to all active subscribers
    console.log('[intelligence-report] Sending to subscribers…')
    const result = await sendNewsletter(subject, htmlContent, 'all')
    console.log(
      `[intelligence-report] Sent ${result.sentCount}/${result.totalRecipients} emails.`,
      result.errors.length ? `Errors: ${result.errors.join(', ')}` : '',
    )

    return NextResponse.json({
      success: true,
      subject,
      sentCount: result.sentCount,
      totalRecipients: result.totalRecipients,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[intelligence-report] Job failed:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
