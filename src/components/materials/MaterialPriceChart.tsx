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
    feedSymbol: string | null
    isProxy: boolean
}

interface HistoryResponse {
    benchmark: {
        id: string | null
        productForm: string
        grade: string | null
        benchmarkName: string | null
        market: string | null
        currency: string
        unit: string
    }
    points: { asOf: string; price: number }[]
    source?: 'observations' | 'yahoo'
    feedSymbol?: string | null
    isProxy?: boolean
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

const TIME_RANGES = [
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '1Y', days: 365 },
    { label: '5Y', days: 1825 },
] as const

function benchmarkKey(option: ChartBenchmarkOption): string {
    return option.id ?? `feed:${option.feedSymbol ?? `${option.productForm}::${option.unit}`}`
}

function formatAxisDate(value: string, rangeDays: number): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString(
        'en-US',
        rangeDays > 365
            ? { month: 'short', year: '2-digit' }
            : { month: 'short', day: 'numeric' },
    )
}

export default function MaterialPriceChart({ symbol, benchmarks }: Props) {
    const selectable = useMemo(
        () => benchmarks.filter((b) => Boolean((b.id && b.hasData) || b.feedSymbol)),
        [benchmarks],
    )
    const [selectedKey, setSelectedKey] = useState<string | null>(
        selectable[0] ? benchmarkKey(selectable[0]) : null,
    )
    const [rangeDays, setRangeDays] = useState<number>(365)
    const [history, setHistory] = useState<HistoryResponse | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const firstKey = selectable[0] ? benchmarkKey(selectable[0]) : null
        const selectedExists = selectedKey != null && selectable.some((b) => benchmarkKey(b) === selectedKey)
        if (!selectedExists && firstKey !== selectedKey) setSelectedKey(firstKey)
    }, [selectable, selectedKey])

    const selectedOption = useMemo(
        () => selectable.find((b) => benchmarkKey(b) === selectedKey) ?? null,
        [selectable, selectedKey],
    )

    useEffect(() => {
        if (!selectedOption) {
            setHistory(null)
            return
        }

        const controller = new AbortController()
        const params = new URLSearchParams({ days: String(rangeDays) })
        if (selectedOption.id) params.set('benchmark', selectedOption.id)
        if (selectedOption.feedSymbol) params.set('feed', selectedOption.feedSymbol)

        setLoading(true)
        setHistory(null)
        fetch(`/api/rare-earth/${encodeURIComponent(symbol)}/history?${params.toString()}`, {
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((payload: HistoryResponse | null) => {
                if (!controller.signal.aborted) setHistory(payload)
            })
            .catch((error) => {
                if (error instanceof DOMException && error.name === 'AbortError') return
                if (!controller.signal.aborted) setHistory(null)
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })

        return () => controller.abort()
    }, [symbol, selectedOption, rangeDays])

    const chartData = useMemo(() => {
        if (!history || history.points.length === 0) return null
        return {
            labels: history.points.map((p) => formatAxisDate(p.asOf, rangeDays)),
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
    }, [history, rangeDays])


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
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                {selectable.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectable.map((b) => {
                            const key = benchmarkKey(b)
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedKey(key)}
                                    aria-pressed={selectedKey === key}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        selectedKey === key
                                            ? 'bg-geo-gold/20 border-geo-gold/50 text-geo-gold'
                                            : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                    }`}
                                >
                                    {b.benchmarkName ?? b.productForm}
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <div />
                )}

                <div className="flex gap-1 rounded-lg bg-black/30 border border-white/10 p-1">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range.days}
                            onClick={() => setRangeDays(range.days)}
                            aria-pressed={rangeDays === range.days}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                                rangeDays === range.days
                                    ? 'bg-geo-gold/20 text-geo-gold'
                                    : 'text-gray-500 hover:text-white'
                            }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-64 w-full">
                {loading ? (
                    <div className="h-full w-full bg-white/5 animate-pulse rounded-lg" />
                ) : chartData ? (
                    <Line options={options} data={chartData} />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center bg-black/20 rounded-lg border border-white/5">
                        <LineChart className="w-8 h-8 text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500">
                            {selectedOption?.feedSymbol
                                ? 'Historical market data is temporarily unavailable for this benchmark.'
                                : 'No observations collected yet for this benchmark.'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            {selectedOption?.feedSymbol
                                ? 'Please try again later. The configured market feed may be rate-limited.'
                                : 'History builds automatically as the price scraper runs.'}
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
                        {history.source === 'yahoo'
                            ? `${history.isProxy ? 'Proxy market' : 'Market'} history via Yahoo Finance`
                            : `${history.points.length} recorded observation${history.points.length === 1 ? '' : 's'}`}
                        {' · '}
                        {history.benchmark.currency}/{history.benchmark.unit}
                    </span>
                </div>
            )}
        </div>
    )
}
