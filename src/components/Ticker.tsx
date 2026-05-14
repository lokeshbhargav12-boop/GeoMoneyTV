"use client";

import { useEffect, useRef } from "react";

export default function Ticker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent multiple injections
    if (containerRef.current && containerRef.current.childElementCount > 0) {
      // clear it before reload
      containerRef.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": [
          {
            "proName": "OANDA:XAUUSD",
            "title": "GOLD"
          },
          {
            "proName": "OANDA:XAGUSD",
            "title": "SILVER"
          },
          {
            "proName": "COMEX:HG1!",
            "title": "COPPER"
          },
          {
            "proName": "LME:ZNC1!",
            "title": "ZINC"
          },
          {
            "proName": "LME:PBD1!",
            "title": "LEAD"
          },
          {
            "proName": "LME:NI1!",
            "title": "NICKEL"
          },
          {
            "proName": "NYMEX:CL1!",
            "title": "CRUDE OIL"
          },
          {
            "proName": "CAPITALCOM:LITHIUM",
            "title": "LITHIUM"
          },
          {
            "proName": "TVC:US02Y",
            "title": "US 2Y"
          },
          {
            "proName": "TVC:US10Y",
            "title": "US 10Y"
          },
          {
            "proName": "BINANCE:BTCUSD",
            "title": "BITCOIN"
          }
        ],
        "showSymbolLogo": true,
        "colorTheme": "dark",
        "isTransparent": true,
        "displayMode": "adaptive",
        "locale": "en"
      }
    `;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden bg-black/95 backdrop-blur-md border-b border-geo-gold/20">
      <div className="tradingview-widget-container" ref={containerRef}></div>
    </div>
  );
}
