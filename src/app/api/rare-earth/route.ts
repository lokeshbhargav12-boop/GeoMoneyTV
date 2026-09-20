import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CRITICAL_MATERIALS_DATA } from '@/data/critical-materials'

export async function GET() {
  try {
    // Get all rare earth materials from database
    const materials = await prisma.rareEarthMaterial.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('Error fetching rare earth materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rare earth materials' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Seed database with critical materials data
    for (const material of CRITICAL_MATERIALS_DATA) {
      await prisma.rareEarthMaterial.upsert({
        where: { symbol: material.symbol },
        update: {
          name: material.name,
          category: material.category,
          description: `${material.description}\n\nSource: ${material.source}`,
          supply: material.supply || null,
          demand: material.demand || null,
          unit: material.unit || 'kg',
          price: material.price ?? null,
          applications: JSON.stringify(material.applications),
          countries: JSON.stringify(material.countries),
          lastUpdated: new Date(),
        },
        create: {
          name: material.name,
          symbol: material.symbol,
          category: material.category,
          description: `${material.description}\n\nSource: ${material.source}`,
          supply: material.supply || null,
          demand: material.demand || null,
          unit: material.unit || 'kg',
          price: material.price ?? null,
          applications: JSON.stringify(material.applications),
          countries: JSON.stringify(material.countries),
        },
      })
    }

    return NextResponse.json({
      message: 'Critical materials seeded successfully',
      count: CRITICAL_MATERIALS_DATA.length,
    })
  } catch (error) {
    console.error('Error seeding critical materials:', error)
    return NextResponse.json(
      { error: 'Failed to seed critical materials' },
      { status: 500 }
    )
  }
}
