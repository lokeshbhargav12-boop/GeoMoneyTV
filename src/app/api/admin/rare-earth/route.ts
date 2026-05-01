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

    const body = await req.json()
    const { name, symbol, category, price, unit, description, imageUrl, supply, demand, countries, applications } = body

    if (!name || !symbol || !category) {
      return NextResponse.json({ error: 'Name, symbol, and category are required' }, { status: 400 })
    }

    const material = await prisma.rareEarthMaterial.create({
      data: {
        name,
        symbol,
        category,
        price: price ? parseFloat(price) : null,
        unit: unit || null,
        description: description || null,
        imageUrl: imageUrl || null,
        supply: supply || null,
        demand: demand || null,
        countries: countries || null,
        applications: applications || null,
      },
    })

    return NextResponse.json(material)
  } catch (error: any) {
    console.error('Create material error:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A material with this name or symbol already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, symbol, category, price, unit, description, imageUrl, supply, demand, countries, applications } = body

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    const material = await prisma.rareEarthMaterial.update({
      where: { id },
      data: {
        name,
        symbol,
        category,
        price: price ? parseFloat(price) : null,
        unit: unit || null,
        description: description || null,
        imageUrl: imageUrl || null,
        supply: supply || null,
        demand: demand || null,
        countries: countries || null,
        applications: applications || null,
      },
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error('Update material error:', error)
    return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 })
    }

    await prisma.rareEarthMaterial.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete material error:', error)
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }
}
