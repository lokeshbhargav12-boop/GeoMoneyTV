import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET — list tracked materials for the current user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      trackedMaterials: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, materialId: true, createdAt: true },
      },
    },
  })

  return NextResponse.json({ tracked: user?.trackedMaterials || [] })
}

// POST — add a tracked material
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialId } = await req.json()
  if (!materialId || typeof materialId !== 'string') {
    return NextResponse.json({ error: 'materialId is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify material exists
  const material = await prisma.rareEarthMaterial.findUnique({ where: { id: materialId } })
  if (!material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }

  const tracked = await prisma.trackedMaterial.upsert({
    where: { userId_materialId: { userId: user.id, materialId } },
    create: { userId: user.id, materialId },
    update: {},
  })

  return NextResponse.json({ tracked })
}

// DELETE — remove a tracked material
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialId } = await req.json()
  if (!materialId || typeof materialId !== 'string') {
    return NextResponse.json({ error: 'materialId is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await prisma.trackedMaterial.deleteMany({
    where: { userId: user.id, materialId },
  })

  return NextResponse.json({ success: true })
}
