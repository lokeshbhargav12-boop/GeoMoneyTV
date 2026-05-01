import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendNewsletter } from '@/lib/newsletter-service'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, htmlContent, recipients, testEmail } = await req.json()

    if (!subject || !htmlContent) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }
    
    // Determine recipients for service
    const targetRecipients = testEmail ? testEmail : recipients;

    const result = await sendNewsletter(subject, htmlContent, targetRecipients)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Newsletter send error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send newsletter' }, { status: 500 })
  }
}

// GET sent reports
export async function GET() {
  try {
    const reports = await prisma.newsletterReport.findMany({
      orderBy: { sentAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ reports })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
