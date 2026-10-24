import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'
import { WAITLIST_LAUNCH_MESSAGE, buildWaitlistPreferences } from '@/lib/waitlist'

export async function POST(req: Request) {
  try {
    const { email, password, name, joinWaitlist } = await req.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const trimmedName = typeof name === 'string' ? name.trim() : ''

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: trimmedName || null,
        password: hashedPassword,
      },
    })

    // Optionally enroll in waitlist immediately if requested during registration
    if (joinWaitlist) {
      try {
        const existingSub = await prisma.newsletter.findUnique({
          where: { email: normalizedEmail },
        })
        const displayName = trimmedName || normalizedEmail.split('@')[0]
        if (!existingSub) {
          await prisma.newsletter.create({
            data: {
              email: normalizedEmail,
              active: true,
              materialPreferences: buildWaitlistPreferences(null, {
                name: displayName,
                source: 'account_registration',
              }),
            },
          })
        } else {
          await prisma.newsletter.update({
            where: { email: normalizedEmail },
            data: {
              active: true,
              materialPreferences: buildWaitlistPreferences(existingSub.materialPreferences, {
                name: displayName,
                source: 'account_registration',
              }),
            },
          })
        }
      } catch (waitlistErr) {
        console.error('Failed to add user to waitlist during registration:', waitlistErr)
      }
    }

    // Best-effort welcome email with the GeoMoney Intelligence Platform launch & waitlist notice
    try {
      const smtpSettings = await prisma.siteSettings.findMany({
        where: {
          key: {
            in: [
              'smtp_host',
              'smtp_port',
              'smtp_user',
              'smtp_pass',
              'smtp_from_name',
              'smtp_from_email',
            ],
          },
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
          auth: {
            user: smtp.smtp_user,
            pass: smtp.smtp_pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        })

        const fromAddress = `${smtp.smtp_from_name || 'GeoMoney TV'} <${smtp.smtp_from_email || smtp.smtp_user}>`
        const displayName = trimmedName || 'Member'

        await transporter.sendMail({
          from: fromAddress,
          to: normalizedEmail,
          subject: 'Welcome to GeoMoney — Join the GeoMoney Pro Waitlist',
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e0e0e0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #D4AF37;">
    <h1 style="color:#D4AF37;margin:0;font-size:28px;letter-spacing:2px;">GeoMoney</h1>
    <p style="color:#888;margin:8px 0 0;font-size:13px;letter-spacing:1px;">INTELLIGENCE PLATFORM</p>
  </div>

  <div style="text-align:center;margin-bottom:28px;">
    <h2 style="color:#ffffff;margin:0 0 8px;font-size:22px;">Welcome, ${displayName}!</h2>
    <p style="color:#aaa;margin:0;font-size:15px;">Your GeoMoney account has been created.</p>
  </div>

  <div style="background:#111;border:1px solid #D4AF37;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center;">
    <p style="color:#ffffff;font-size:16px;font-weight:600;line-height:1.6;margin:0 0 20px;">
      ${WAITLIST_LAUNCH_MESSAGE}
    </p>
    <a href="https://geomoneytv.com/#waitlist" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;">
      Join GeoMoney Pro Waitlist
    </a>
  </div>
</div>
</body>
</html>`,
        })
      }
    } catch (emailErr) {
      console.error('Failed to send registration welcome email (non-fatal):', emailErr)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: WAITLIST_LAUNCH_MESSAGE,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    )
  }
}