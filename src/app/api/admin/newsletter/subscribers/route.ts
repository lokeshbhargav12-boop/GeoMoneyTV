import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseNewsletterContact } from '@/lib/newsletter-contact'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'admin') return null
  return session
}

// POST /api/admin/newsletter/subscribers — add a subscriber (admin, no confirmation email)
export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedContact = parseNewsletterContact(await req.json())
  if ('error' in parsedContact) {
    return NextResponse.json({ error: parsedContact.error }, { status: 400 })
  }

  const { name, phone, email } = parsedContact.data
  const existing = await prisma.newsletter.findUnique({ where: { email } })
  if (existing) {
    await prisma.newsletter.update({
      where: { email },
      data: { name, phone, active: true },
    })
    return NextResponse.json({
      success: true,
      message: existing.active ? 'Subscriber details updated.' : 'Subscriber reactivated.',
    })
  }

  await prisma.newsletter.create({ data: { name, phone, email } })
  return NextResponse.json({ success: true, message: 'Subscriber added successfully.' })
}

// DELETE /api/admin/newsletter/subscribers — remove a subscriber by id
export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.newsletter.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
