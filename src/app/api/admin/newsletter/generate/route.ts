import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateNewsletterContent } from '@/lib/newsletter-service'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, htmlContent } = await generateNewsletterContent()

    return NextResponse.json({
      subject,
      htmlContent,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Newsletter generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate newsletter' }, { status: 500 })
  }
}
