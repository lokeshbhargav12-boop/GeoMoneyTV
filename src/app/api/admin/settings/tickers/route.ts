import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dedupeTickerSymbolConfigs, normalizeTickerSymbolConfig } from '@/lib/ticker-symbols'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tickers, alphaVantageKey } = await req.json()

    const normalizedTickers = Array.isArray(tickers)
      ? dedupeTickerSymbolConfigs(
        tickers
          .filter(
            (item): item is { label: string; symbol: string; type: string; sourceSymbol?: string } =>
              typeof item?.label === 'string' &&
              typeof item?.symbol === 'string' &&
              typeof item?.type === 'string',
          )
          .map((item) => normalizeTickerSymbolConfig(item)),
      )
      : []

    // Save Ticker Symbols
    await prisma.siteSettings.upsert({
      where: { key: 'ticker_symbols' },
      update: { value: JSON.stringify(normalizedTickers) },
      create: { key: 'ticker_symbols', value: JSON.stringify(normalizedTickers) },
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
