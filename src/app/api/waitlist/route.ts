import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import {
    WAITLIST_LAUNCH_MESSAGE,
    buildWaitlistPreferences,
    isWaitlistRecord,
    parseWaitlistMetadata,
} from '@/lib/waitlist';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const emailParam = searchParams.get('email');

        if (!emailParam) {
            return NextResponse.json({ joined: false });
        }

        const email = emailParam.trim().toLowerCase();
        const record = await prisma.newsletter.findUnique({
            where: { email },
        });

        if (!record || !record.active || !isWaitlistRecord(record.materialPreferences)) {
            return NextResponse.json({ joined: false });
        }

        const meta = parseWaitlistMetadata(record.materialPreferences);
        return NextResponse.json({
            joined: true,
            name: meta.name,
            email: record.email,
            joinedAt: meta.joinedAt || record.createdAt.toISOString(),
        });
    } catch (error) {
        console.error('Waitlist GET error:', error);
        return NextResponse.json({ joined: false });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
        const rawName = typeof body?.name === 'string' ? body.name.trim() : '';
        const source = typeof body?.source === 'string' ? body.source.trim() : 'waitlist';

        if (!rawEmail || !rawEmail.includes('@')) {
            return NextResponse.json(
                { error: 'Valid email address is required' },
                { status: 400 }
            );
        }

        let finalName = rawName;
        if (!finalName) {
            const existingUser = await prisma.user.findUnique({
                where: { email: rawEmail },
                select: { name: true },
            });
            finalName = existingUser?.name?.trim() || rawEmail.split('@')[0];
        }

        // Save to newsletter with waitlist info
        const existing = await prisma.newsletter.findUnique({
            where: { email: rawEmail },
        });

        if (!existing) {
            await prisma.newsletter.create({
                data: {
                    email: rawEmail,
                    active: true,
                    materialPreferences: buildWaitlistPreferences(null, {
                        name: finalName,
                        source,
                    }),
                },
            });
        } else {
            await prisma.newsletter.update({
                where: { email: rawEmail },
                data: {
                    active: true,
                    materialPreferences: buildWaitlistPreferences(existing.materialPreferences, {
                        name: finalName,
                        source,
                    }),
                },
            });
        }

        try {
            const smtpSettings = await prisma.siteSettings.findMany({
                where: {
                    key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email'] },
                },
            });

            const smtp: Record<string, string> = {};
            smtpSettings.forEach((s) => (smtp[s.key] = s.value));

            if (smtp.smtp_user && smtp.smtp_pass) {
                const smtpPort = parseInt(smtp.smtp_port || '587');
                const smtpSecure = smtpPort === 465;
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
                });

                const fromAddress = `${smtp.smtp_from_name || 'GeoMoney TV'} <${smtp.smtp_from_email || smtp.smtp_user}>`;

                await transporter.sendMail({
                    from: fromAddress,
                    to: rawEmail,
                    subject: 'GeoMoney Pro Waitlist Confirmation — Priority Access Reserved',
                    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#e0e0e0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #D4AF37;">
    <h1 style="color:#D4AF37;margin:0;font-size:28px;letter-spacing:2px;">GeoMoney Pro</h1>
  </div>

  <div style="text-align:center;margin-bottom:32px;">
    <h2 style="color:#ffffff;margin:0 0 8px;font-size:22px;">Hi ${finalName}, you're on the GeoMoney Pro Waitlist!</h2>
    <p style="color:#aaa;margin:0;font-size:15px;">Your priority access spot for GeoMoney Pro has been reserved.</p>
  </div>

  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="color:#D4AF37;font-size:14px;font-weight:600;line-height:1.6;margin:0 0 12px;">
      ${WAITLIST_LAUNCH_MESSAGE}
    </p>
    <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0;">
      Thank you for joining the GeoMoney Pro Waitlist. You will receive priority access upon launch to our premium analytics, exclusive intelligence reports, and professional geopolitical & critical materials tools.
    </p>
  </div>
</div>
</body>
</html>`,
                });

                console.log(`Waitlist email sent to ${rawEmail}`);
            }
        } catch (emailError) {
            console.error('Failed to send waitlist email (non-fatal):', emailError);
        }

        return NextResponse.json({
            message: 'Successfully joined the waitlist!',
            launchMessage: WAITLIST_LAUNCH_MESSAGE,
        });
    } catch (error) {
        console.error('Waitlist error:', error);
        return NextResponse.json(
            { error: 'Failed to join waitlist' },
            { status: 500 }
        );
    }
}