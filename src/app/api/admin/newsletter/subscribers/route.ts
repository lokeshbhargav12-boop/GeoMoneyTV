import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  const { email } = await req.json()
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email address required' }, { status: 400 })
  }

  const sanitized = email.trim().toLowerCase()

  const existing = await prisma.newsletter.findUnique({ where: { email: sanitized } })
  if (existing) {
    if (!existing.active) {
      await prisma.newsletter.update({ where: { email: sanitized }, data: { active: true } })
      return NextResponse.json({ success: true, message: 'Subscriber reactivated.' })
    }
    return NextResponse.json({ error: 'Email is already subscribed.' }, { status: 400 })
  }

  await prisma.newsletter.create({ data: { email: sanitized } })
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
