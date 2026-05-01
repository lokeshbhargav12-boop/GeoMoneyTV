import { NextResponse } from 'next/server'
import { generateNewsletterContent, sendNewsletter } from '@/lib/newsletter-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 120 seconds to allow for AI generation and sending

export async function GET(req: Request) {
  // Optional: Add a CRON_SECRET check here for security if calling from Vercel/Hostinger
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //     return new Response('Unauthorized', { status: 401 });
  // }

  try {
    console.log("Starting Automated Newsletter Job...")

    // 1. Generate Newsletter
    console.log("Generating AI Newsletter content...")
    const { subject, htmlContent } = await generateNewsletterContent()
    console.log("Successfully generated newsletter:", subject)

    // 2. Send Newsletter to all active subscribers
    console.log("Sending newsletter to subscribers...")
    const result = await sendNewsletter(subject, htmlContent, 'all')
    console.log(`Successfully sent ${result.sentCount}/${result.totalRecipients} emails.`)

    return NextResponse.json({
      success: true,
      subject,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("Automated Newsletter Job Failed:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error"
    }, { status: 500 })
  }
}
