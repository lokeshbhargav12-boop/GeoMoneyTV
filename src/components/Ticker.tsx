"use client";

import { motion } from "framer-motion";

const tickerItems = [
  { label: "United States Dollar", value: "↑", color: "text-green-400" },
  { label: "Oil", value: "$82.24 ▲", color: "text-green-400" },
  { label: "BRICS Index", value: "▲ 1.27%", color: "text-green-400" },
  { label: "Gold", value: "$2,428 ▲", color: "text-green-400" },
  { label: "Bitcoin", value: "$68,000 ▼", color: "text-red-400" },
  { label: "Euro", value: "€0.92 -", color: "text-gray-400" },
];

export default function Ticker() {
  return (
    <div className="w-full overflow-hidden border-b border-white/10 bg-geo-dark/80 py-2 backdrop-blur-md">
      <div className="flex whitespace-nowrap">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "linear",
          }}
          className="flex gap-8 px-4"
        >
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-medium text-white">
              <span className="text-gray-400">{item.label}</span>
              <span className={item.color}>{item.value}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
