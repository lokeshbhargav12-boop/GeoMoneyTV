import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Free rare earth materials data
const RARE_EARTH_DATA = [
  {
    name: 'Lanthanum',
    symbol: 'La',
    category: 'Light Rare Earth',
    description: 'Used in batteries, camera lenses, and catalysts',
    applications: ['Batteries', 'Optics', 'Catalysts', 'Petroleum refining'],
    countries: ['China', 'Australia', 'United States', 'India'],
  },
  {
    name: 'Cerium',
    symbol: 'Ce',
    category: 'Light Rare Earth',
    description: 'Most abundant rare earth element',
    applications: ['Catalysts', 'Glass polishing', 'Metallurgy', 'LED lighting'],
    countries: ['China', 'Australia', 'United States'],
  },
  {
    name: 'Praseodymium',
    symbol: 'Pr',
    category: 'Light Rare Earth',
    description: 'Used in magnets and alloys',
    applications: ['Magnets', 'Alloys', 'Glass coloring', 'Carbon arc lighting'],
    countries: ['China', 'Australia', 'United States'],
  },
  {
    name: 'Neodymium',
    symbol: 'Nd',
    category: 'Light Rare Earth',
    description: 'Critical for permanent magnets in electric vehicles and wind turbines',
    applications: ['Permanent magnets', 'Lasers', 'Glass coloring', 'Motors'],
    countries: ['China', 'Australia', 'United States', 'Myanmar'],
  },
  {
    name: 'Dysprosium',
    symbol: 'Dy',
    category: 'Heavy Rare Earth',
    description: 'Crucial for high-performance magnets',
    applications: ['Magnets', 'Lasers', 'Nuclear reactors', 'Data storage'],
    countries: ['China', 'Australia', 'Myanmar'],
  },
  {
    name: 'Europium',
    symbol: 'Eu',
    category: 'Heavy Rare Earth',
    description: 'Used in phosphors for displays',
    applications: ['Phosphors', 'LED lights', 'Fluorescent lamps', 'Nuclear reactors'],
    countries: ['China', 'United States'],
  },
  {
    name: 'Terbium',
    symbol: 'Tb',
    category: 'Heavy Rare Earth',
    description: 'Used in green phosphors and magnets',
    applications: ['Magnets', 'Phosphors', 'Solid-state devices', 'Fuel cells'],
    countries: ['China', 'Australia'],
  },
  {
    name: 'Yttrium',
    symbol: 'Y',
    category: 'Heavy Rare Earth',
    description: 'Used in LED lights and superconductors',
    applications: ['LED lights', 'Superconductors', 'Lasers', 'Cancer treatment'],
    countries: ['China', 'Australia', 'India'],
  },
]

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
    // Seed database with rare earth data
    for (const material of RARE_EARTH_DATA) {
      await prisma.rareEarthMaterial.upsert({
        where: { symbol: material.symbol },
        update: {
          name: material.name,
          category: material.category,
          description: material.description,
          applications: JSON.stringify(material.applications),
          countries: JSON.stringify(material.countries),
          lastUpdated: new Date(),
        },
        create: {
          name: material.name,
          symbol: material.symbol,
          category: material.category,
          description: material.description,
          applications: JSON.stringify(material.applications),
          countries: JSON.stringify(material.countries),
          unit: 'kg',
        },
      })
    }

    return NextResponse.json({ message: 'Rare earth materials seeded successfully' })
  } catch (error) {
    console.error('Error seeding rare earth materials:', error)
    return NextResponse.json(
      { error: 'Failed to seed rare earth materials' },
      { status: 500 }
    )
  }
}
