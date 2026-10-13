'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { LineChart } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export interface ChartBenchmarkOption {
    id: string | null
    productForm: string
    benchmarkName: string | null
    unit: string
    currency: string
    isLive: boolean
    hasData: boolean
}

interface HistoryResponse {
    benchmark: {
        id: string
        productForm: string
        grade: string | null
        benchmarkName: string | null
        market: string | null
        currency: string
        unit: string
    }
    points: { asOf: string; price: number }[]
}

interface Props {
    symbol: string
    benchmarks: ChartBenchmarkOption[]
}

function formatAxisPrice(value: number): string {
    if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (value < 1) return value.toFixed(4)
    return value.toFixed(2)
}

export default function MaterialPriceChart({ symbol, benchmarks }: Props) {
    const selectable = useMemo(() => benchmarks.filter((b) => b.id), [benchmarks])
    const [selectedId, setSelectedId] = useState<string | null>(selectable[0]?.id ?? null)
    const [history, setHistory] = useState<HistoryResponse | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!selectedId) return
        setLoading(true)
        fetch(`/api/rare-earth/${encodeURIComponent(symbol)}/history?benchmark=${encodeURIComponent(selectedId)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((payload: HistoryResponse | null) => setHistory(payload))
            .catch(() => setHistory(null))
            .finally(() => setLoading(false))
    }, [symbol, selectedId])

    const chartData = useMemo(() => {
        if (!history || history.points.length === 0) return null
        return {
            labels: history.points.map((p) =>
                new Date(p.asOf).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ),
            datasets: [
                {
                    data: history.points.map((p) => p.price),
                    borderColor: 'rgba(212,175,55,1)',
                    backgroundColor: 'rgba(212,175,55,0.12)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: 'rgba(212,175,55,1)',
                    fill: true,
                    tension: 0.25,
                },
            ],
        }
    }, [history])


    const options = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(10,10,10,0.9)',
                    borderColor: 'rgba(212,175,55,0.4)',
                    borderWidth: 1,
                    titleColor: '#9ca3af',
                    bodyColor: '#ffffff',
                    displayColors: false,
                    callbacks: {
                        label: (ctx: { parsed: { y: number | null } }) =>
                            ctx.parsed.y != null && history
                                ? `${history.benchmark.currency === 'USD' ? '$' : `${history.benchmark.currency} `}${formatAxisPrice(ctx.parsed.y)}/${history.benchmark.unit}`
                                : '',
                    },
                },
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#6b7280', maxTicksLimit: 8, font: { size: 10 } },
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#6b7280',
                        font: { size: 10 },
                        callback: (value: string | number) =>
                            typeof value === 'number' ? formatAxisPrice(value) : value,
                    },
                },
            },
            interaction: { mode: 'index' as const, intersect: false },
        }),
        [history],
    )

    if (selectable.length === 0) return null

    return (
        <div>
            {selectable.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectable.map((b) => (
                        <button
                            key={b.id}
                            onClick={() => setSelectedId(b.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                selectedId === b.id
                                    ? 'bg-geo-gold/20 border-geo-gold/50 text-geo-gold'
                                    : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                            }`}
                        >
                            {b.benchmarkName ?? b.productForm}
                        </button>
                    ))}
                </div>
            )}

            <div className="h-64 w-full">
                {loading ? (
                    <div className="h-full w-full bg-white/5 animate-pulse rounded-lg" />
                ) : chartData ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center bg-black/20 rounded-lg border border-white/5">
                        <LineChart className="w-8 h-8 text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500">
                            No observations collected yet for this benchmark.
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            History builds automatically as the price scraper runs.
                        </p>
                    </div>
                )}
            </div>

            {history && history.points.length > 0 && (
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                        {history.benchmark.benchmarkName ?? history.benchmark.productForm}
                        {history.benchmark.market ? ` · ${history.benchmark.market}` : ''}
                    </span>
                    <span>
                        {history.points.length} observation{history.points.length === 1 ? '' : 's'} ·{' '}
                        {history.benchmark.currency}/{history.benchmark.unit}
                    </span>
                </div>
            )}
        </div>
    )
}
