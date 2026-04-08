"use client";

import { useEffect, useRef } from "react";

interface TradingViewMarketQuotesProps {
  height?: number;
}

const SYMBOL_GROUPS = [
  {
    name: "Global Indices",
    originalName: "Global Indices",
    symbols: [
      { name: "CAPITALCOM:US500", displayName: "S&P 500" },
      { name: "CAPITALCOM:US100", displayName: "NASDAQ 100" },
      { name: "CAPITALCOM:US30", displayName: "Dow Jones 30" },
      { name: "TVC:RUT", displayName: "Russell 2000" },
      { name: "TVC:DEU40", displayName: "DAX 40" },
      { name: "TVC:UK100", displayName: "FTSE 100" },
      { name: "TVC:JP225", displayName: "Nikkei 225" },
      { name: "TVC:HK50", displayName: "Hang Seng 50" },
      { name: "TVC:FR40", displayName: "CAC 40" },
      { name: "TVC:IBEX", displayName: "IBEX 35" },
      { name: "CAPITALCOM:AUS200", displayName: "ASX 200" },
      { name: "TVC:SX5E", displayName: "Euro Stoxx 50" },
      { name: "BSE:SENSEX", displayName: "BSE Sensex" },
      { name: "SSE:000001", displayName: "Shanghai Comp." },
      { name: "TVC:BIST100", displayName: "BIST 100" },
    ],
  },
  {
    name: "Commodities",
    originalName: "Commodities",
    symbols: [
      { name: "XAUUSD", displayName: "Gold" },
      { name: "COMEX:SI1!", displayName: "Silver" },
      { name: "COMEX:HG1!", displayName: "Copper" },
      { name: "TVC:USOIL", displayName: "WTI Crude Oil" },
      { name: "TVC:UKOIL", displayName: "Brent Crude" },
      { name: "NYMEX:NG1!", displayName: "Natural Gas" },
      { name: "COMEX:PL1!", displayName: "Platinum" },
      { name: "COMEX:PA1!", displayName: "Palladium" },
      { name: "CBOT:ZW1!", displayName: "Wheat" },
      { name: "CBOT:ZC1!", displayName: "Corn" },
    ],
  },
  {
    name: "Crypto",
    originalName: "Crypto",
    symbols: [
      { name: "BINANCE:BTCUSDT", displayName: "Bitcoin" },
      { name: "BINANCE:ETHUSDT", displayName: "Ethereum" },
      { name: "BINANCE:SOLUSDT", displayName: "Solana" },
      { name: "BINANCE:BNBUSDT", displayName: "BNB" },
      { name: "BINANCE:XRPUSDT", displayName: "XRP" },
      { name: "BINANCE:ADAUSDT", displayName: "Cardano" },
      { name: "BINANCE:DOGEUSDT", displayName: "Dogecoin" },
      { name: "BINANCE:AVAXUSDT", displayName: "Avalanche" },
    ],
  },
  {
    name: "Bonds & Yields",
    originalName: "Bonds & Yields",
    symbols: [
      { name: "TVC:US10Y", displayName: "US 10Y Yield" },
      { name: "TVC:US02Y", displayName: "US 2Y Yield" },
      { name: "TVC:US30Y", displayName: "US 30Y Yield" },
      { name: "TVC:DE10Y", displayName: "Germany 10Y" },
      { name: "TVC:GB10Y", displayName: "UK 10Y Gilt" },
      { name: "TVC:JP10Y", displayName: "Japan 10Y JGB" },
      { name: "TVC:IT10Y", displayName: "Italy 10Y BTP" },
      { name: "TVC:AU10Y", displayName: "Australia 10Y" },
    ],
  },
  {
    name: "FX & Macro",
    originalName: "FX & Macro",
    symbols: [
      { name: "TVC:DXY", displayName: "Dollar Index (DXY)" },
      { name: "FX:EURUSD", displayName: "EUR / USD" },
      { name: "FX:GBPUSD", displayName: "GBP / USD" },
      { name: "FX:USDJPY", displayName: "USD / JPY" },
      { name: "FX:USDCHF", displayName: "USD / CHF" },
      { name: "FX:AUDUSD", displayName: "AUD / USD" },
      { name: "FX:USDCAD", displayName: "USD / CAD" },
      { name: "FX:NZDUSD", displayName: "NZD / USD" },
    ],
  },
  {
    name: "Top Stocks",
    originalName: "Top Stocks",
    symbols: [
      { name: "NASDAQ:AAPL", displayName: "Apple" },
      { name: "NASDAQ:MSFT", displayName: "Microsoft" },
      { name: "NASDAQ:NVDA", displayName: "NVIDIA" },
      { name: "NASDAQ:GOOGL", displayName: "Alphabet" },
      { name: "NASDAQ:AMZN", displayName: "Amazon" },
      { name: "NASDAQ:TSLA", displayName: "Tesla" },
      { name: "NYSE:JPM", displayName: "JPMorgan Chase" },
      { name: "NYSE:XOM", displayName: "ExxonMobil" },
      { name: "NYSE:BRK.B", displayName: "Berkshire B" },
      { name: "NYSE:BAC", displayName: "Bank of America" },
    ],
  },
];

export default function TradingViewMarketQuotes({
  height = 560,
}: TradingViewMarketQuotesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.text = JSON.stringify({
      width: "100%",
      height,
      symbolsGroups: SYMBOL_GROUPS,
      showSymbolLogo: false,
      isTransparent: true,
      colorTheme: "dark",
      locale: "en",
    });
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [height]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full"
      style={{ height: `${height}px`, overflow: "hidden" }}
    />
  );
}
