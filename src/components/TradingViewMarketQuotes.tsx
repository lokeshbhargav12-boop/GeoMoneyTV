'use client'

import { useEffect, useRef } from 'react'

interface TradingViewMarketQuotesProps {
  height?: number
}

const MACRO_SYMBOLS = [
  { name: 'XAUUSD', displayName: 'Gold' },
  { name: 'TVC:USOIL', displayName: 'WTI Oil' },
  { name: 'COMEX:HG1!', displayName: 'Copper' },
  { name: 'TVC:DXY', displayName: 'USD / DXY' },
  { name: 'CAPITALCOM:US500', displayName: 'S&P 500' },
  { name: 'NYMEX:NG1!', displayName: 'Nat Gas' },
  { name: 'COMEX:SI1!', displayName: 'Silver' },
  { name: 'TVC:US10Y', displayName: 'US 10Y Yield' },
  { name: 'BITSTAMP:BTCUSD', displayName: 'Bitcoin' },
  { name: 'TVC:UKOIL', displayName: 'Brent Crude' },
]

export default function TradingViewMarketQuotes({ height = 560 }: TradingViewMarketQuotesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js'
    script.text = JSON.stringify({
      width: '100%',
      height,
      symbolsGroups: [
        {
          name: 'GeoMoney Macro',
          originalName: 'GeoMoney Macro',
          symbols: MACRO_SYMBOLS,
        },
      ],
      showSymbolLogo: false,
      isTransparent: true,
      colorTheme: 'dark',
      locale: 'en',
    })
    container.appendChild(script)

    return () => {
      if (container) container.innerHTML = ''
    }
  }, [height])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full overflow-hidden"
      style={{ height: `${height}px` }}
    />
  )
}
