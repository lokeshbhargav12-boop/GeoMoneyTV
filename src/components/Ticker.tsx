"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TickerItem {
  label: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: string;
}

export default function Ticker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch("/api/ticker");
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      } catch (error) {
        console.error("Error fetching ticker:", error);
      }
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 60000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) {
    return (
      <div className="w-full overflow-hidden bg-black/95 backdrop-blur-md py-2.5 border-b border-white/10">
        <div className="flex items-center gap-6 px-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-12 bg-white/20 rounded"></div>
              <div className="h-3 w-16 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, type: string) => {
    if (type === "index") {
      return price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    if (price >= 1000) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return price.toFixed(3);
  };

  const formatChange = (change: number, type: string) => {
    const sign = change >= 0 ? "+" : "";
    if (type === "index") {
      return `${sign}${change.toFixed(1)}`;
    }
    return `${sign}${change.toFixed(3)}`;
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? "+" : "";
    return `(${sign}${percent.toFixed(2)}%)`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-white";
  };

  const renderItem = (item: TickerItem, index: number) => (
    <div
      key={`${item.symbol}-${index}`}
      className="flex items-center px-5 border-r border-white/10"
    >
      <span className="text-geo-gold font-semibold text-sm tracking-wide mr-2">
        {item.label}
      </span>
      <span className="text-white/60 font-medium text-sm mr-1">
        ·
      </span>
      <span className="text-white font-medium text-sm mr-2">
        {formatPrice(item.price, item.type)}
      </span>
      <span className={`text-sm font-medium ${getChangeColor(item.change)}`}>
        {formatChange(item.change, item.type)}
      </span>
      <span className={`text-sm font-medium ml-1 ${getChangeColor(item.change)}`}>
        {formatPercent(item.changePercent)}
      </span>
    </div>
  );

  return (
    <div className="w-full overflow-hidden bg-black/95 backdrop-blur-md py-2.5 border-b border-geo-gold/20">
      <div className="flex whitespace-nowrap">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            duration: items.length * 6, // dynamic duration based on items length for consistent speed
            ease: "linear",
          }}
          className="flex w-max"
        >
          {/* First half */}
          <div className="flex">
            {items.map((item, i) => renderItem(item, i))}
            {items.map((item, i) => renderItem(item, i + items.length))}
          </div>
          {/* Second half (exact duplicate of first half) */}
          <div className="flex">
            {items.map((item, i) => renderItem(item, i + items.length * 2))}
            {items.map((item, i) => renderItem(item, i + items.length * 3))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
