import { NextResponse } from 'next/server'
import { generateBriefReport, sendNewsletter } from '@/lib/newsletter-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 120 seconds to allow for AI generation and sending

// The GeoMoney Brief — sent three times a week (Monday, Wednesday & Friday).
// Scheduled from server.js (Hostinger) and vercel.json crons, e.g.
//   "30 6 * * 1,3,5" (06:30 UTC) → /api/cron/newsletter
export async function GET(req: Request) {
  // Require CRON_SECRET to prevent unauthorised triggers
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    console.log("Starting The GeoMoney Brief job...")

    // 1. Generate the brief
    console.log("Generating brief content...")
    const { subject, htmlContent } = await generateBriefReport()
    console.log("Successfully generated newsletter:", subject)

    // 2. Send Newsletter to all active subscribers
    console.log("Sending newsletter to subscribers...")
    const result = await sendNewsletter(subject, htmlContent, 'all', {
      reportType: 'brief',
    })
    console.log(`Successfully sent ${result.sentCount}/${result.totalRecipients} emails.`)

    return NextResponse.json({
      success: true,
      subject,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("The GeoMoney Brief job failed:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error"
    }, { status: 500 })
  }
}
