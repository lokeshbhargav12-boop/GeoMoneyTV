import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, smtpFromEmail } = await req.json()

    const fields: Record<string, string> = {
      smtp_host: smtpHost || 'smtp.gmail.com',
      smtp_port: smtpPort || '587',
      smtp_user: smtpUser || '',
      smtp_pass: smtpPass || '',
      smtp_from_name: smtpFromName || 'GeoMoney TV',
      smtp_from_email: smtpFromEmail || '',
    }

    for (const [key, value] of Object.entries(fields)) {
      await prisma.siteSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SMTP settings error:', error)
    return NextResponse.json({ error: 'Failed to save SMTP settings' }, { status: 500 })
  }
}
