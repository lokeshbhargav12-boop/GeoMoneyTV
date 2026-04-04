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

    const { tickers, alphaVantageKey } = await req.json()

    // Save Ticker Symbols
    await prisma.siteSettings.upsert({
      where: { key: 'ticker_symbols' },
      update: { value: JSON.stringify(tickers) },
      create: { key: 'ticker_symbols', value: JSON.stringify(tickers) },
    })

    // Save Alpha Vantage API Key
    if (alphaVantageKey !== undefined) {
      await prisma.siteSettings.upsert({
        where: { key: 'alpha_vantage_key' },
        update: { value: alphaVantageKey },
        create: { key: 'alpha_vantage_key', value: alphaVantageKey },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ticker save error:', error)
    return NextResponse.json({ error: 'Failed to save tickers' }, { status: 500 })
  }
}
