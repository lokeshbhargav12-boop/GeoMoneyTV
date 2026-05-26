import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET — list portfolio assets for current user, enriched with current prices
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            portfolioAssets: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    // Fetch current prices from ticker API
    let priceMap: Record<string, { price: number; change: number; changePercent: number }> = {}
    try {
        const tickerRes = await fetch(new URL('/api/ticker', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
        if (tickerRes.ok) {
            const tickerData = await tickerRes.json()
            for (const item of tickerData) {
                priceMap[item.symbol] = {
                    price: item.price,
                    change: item.change || 0,
                    changePercent: item.changePercent || 0,
                }
            }
        }
    } catch {
        // prices unavailable — assets still returned but without live data
    }

    const assets = (user?.portfolioAssets || []).map((asset) => {
        const current = priceMap[asset.symbol]
        const currentPrice = current?.price ?? asset.buyPrice
        const totalValue = currentPrice * asset.quantity
        const costBasis = asset.buyPrice * asset.quantity
        const pnl = totalValue - costBasis
        const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0

        return {
            id: asset.id,
            symbol: asset.symbol,
            label: asset.label,
            quantity: asset.quantity,
            buyPrice: asset.buyPrice,
            currentPrice,
            totalValue,
            costBasis,
            pnl,
            pnlPercent,
            change: current?.change ?? 0,
            changePercent: current?.changePercent ?? 0,
            notes: asset.notes,
            createdAt: asset.createdAt,
        }
    })

    // Compute totals
    const totalValue = assets.reduce((s, a) => s + a.totalValue, 0)
    const totalCostBasis = assets.reduce((s, a) => s + a.costBasis, 0)
    const totalPnl = totalValue - totalCostBasis
    const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0

    return NextResponse.json({
        assets,
        summary: {
            totalValue,
            totalCostBasis,
            totalPnl,
            totalPnlPercent,
            assetCount: assets.length,
        },
    })
}

// POST — add a portfolio asset
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { symbol, label, quantity, buyPrice, notes } = body

    if (!symbol || !label || quantity == null || buyPrice == null) {
        return NextResponse.json({ error: 'symbol, label, quantity, and buyPrice are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert — allows updating quantity/price if the same symbol is added again
    const asset = await prisma.portfolioAsset.upsert({
        where: { userId_symbol: { userId: user.id, symbol: symbol.toUpperCase() } },
        create: {
            userId: user.id,
            symbol: symbol.toUpperCase(),
            label,
            quantity: Number(quantity),
            buyPrice: Number(buyPrice),
            notes: notes || null,
        },
        update: {
            quantity: Number(quantity),
            buyPrice: Number(buyPrice),
            label,
            notes: notes || null,
        },
    })

    return NextResponse.json({ asset })
}

// DELETE — remove a portfolio asset
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.portfolioAsset.deleteMany({
        where: { id, userId: user.id },
    })

    return NextResponse.json({ success: true })
}