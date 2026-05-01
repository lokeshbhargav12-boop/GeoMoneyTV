import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.newsletter.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email already subscribed' },
        { status: 400 }
      )
    }

    // Create newsletter subscription
    await prisma.newsletter.create({
      data: { email },
    })

    // Send confirmation email (best-effort, don't block subscription if SMTP fails)
    try {
      const smtpSettings = await prisma.siteSettings.findMany({
        where: {
          key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email'] },
        },
      })

      const smtp: Record<string, string> = {}
      smtpSettings.forEach((s) => (smtp[s.key] = s.value))

      if (smtp.smtp_user && smtp.smtp_pass) {
        const smtpPort = parseInt(smtp.smtp_port || '587')
        const smtpSecure = smtpPort === 465
        const transporter = nodemailer.createTransport({
          host: smtp.smtp_host || 'smtp.gmail.com',
          port: smtpPort,
          secure: smtpSecure,
          requireTLS: !smtpSecure,
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 30000,
          auth: {
            user: smtp.smtp_user,
            pass: smtp.smtp_pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        })

        const fromAddress = `${smtp.smtp_from_name || 'GeoMoney TV'} <${smtp.smtp_from_email || smtp.smtp_user}>`

        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject: 'Welcome to GeoMoney — Subscription Confirmed',
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e0e0e0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #D4AF37;">
    <h1 style="color:#D4AF37;margin:0;font-size:28px;letter-spacing:2px;">GeoMoney</h1>
    <p style="color:#888;margin:8px 0 0;font-size:13px;letter-spacing:1px;">GEOPOLITICAL INTELLIGENCE</p>
  </div>

  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8860B);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;margin-bottom:16px;">✓</div>
    <h2 style="color:#ffffff;margin:0 0 8px;font-size:22px;">Subscription Confirmed!</h2>
    <p style="color:#aaa;margin:0;font-size:15px;">You have been enrolled in the GeoMoney newsletter.</p>
  </div>

  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Thank you for subscribing. You will now receive our intelligence briefings, market analysis, and geopolitical updates directly in your inbox.
    </p>
    <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0;">
      Our reports cover energy systems, critical materials, global power dynamics, and macroeconomic trends — delivered with analytical precision.
    </p>
  </div>

  <div style="text-align:center;margin-bottom:32px;">
    <a href="https://geomoneytv.com" style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#B8860B);color:#000;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:bold;font-size:14px;letter-spacing:1px;">VISIT GEOMONEY</a>
  </div>

  <div style="border-top:1px solid #222;padding-top:24px;text-align:center;">
    <p style="color:#666;font-size:11px;margin:0;">
      © ${new Date().getFullYear()} GeoMoney TV. All rights reserved.<br/>
      <a href="https://geomoneytv.com" style="color:#D4AF37;text-decoration:none;">geomoneytv.com</a>
    </p>
    <p style="color:#555;font-size:10px;margin:8px 0 0;">
      This email confirms your subscription to the GeoMoney newsletter. All content is for informational purposes only.
    </p>
  </div>
</div>
</body>
</html>`,
        })

        console.log(`Confirmation email sent to ${email}`)
      } else {
        console.warn('SMTP not configured — skipping confirmation email')
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email (non-fatal):', emailError)
    }

    return NextResponse.json({ message: 'Successfully subscribed!' })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const subscribers = await prisma.newsletter.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscribers })
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}
