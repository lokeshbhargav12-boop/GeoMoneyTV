"use client";

import { useMemo, useState } from "react";
import { DollarSign, Ship, Anchor, TrendingUp } from "lucide-react";

interface CoalArbitrageProps {
  benchmarks?: { label: string; price: number | null; unit: string }[];
}

export default function CoalArbitrage({ benchmarks = [] }: CoalArbitrageProps) {
  const [originPrice, setOriginPrice] = useState("85");
  const [freight, setFreight] = useState("12");
  const [insurance, setInsurance] = useState("1.5");
  const [loading, setLoading] = useState("2");
  const [loss, setLoss] = useState("1");
  const [destinationBenchmark, setDestinationBenchmark] = useState("API2 Rotterdam");

  const destinationPrice = benchmarks.find((b) => b.label === destinationBenchmark)?.price ?? null;

  const deliveredCost = useMemo(() => {
    const origin = Number.parseFloat(originPrice) || 0;
    const f = Number.parseFloat(freight) || 0;
    const i = Number.parseFloat(insurance) || 0;
    const l = Number.parseFloat(loading) || 0;
    const x = Number.parseFloat(loss) || 0;
    return origin + f + i + l + x;
  }, [originPrice, freight, insurance, loading, loss]);

  const arbitrage = destinationPrice !== null ? destinationPrice - deliveredCost : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-amber-300" />
        <h2 className="text-2xl font-bold">Coal Arbitrage Calculator</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            { label: "Origin coal price ($/t)", value: originPrice, setter: setOriginPrice, icon: Anchor },
            { label: "Freight ($/t)", value: freight, setter: setFreight, icon: Ship },
            { label: "Insurance & finance ($/t)", value: insurance, setter: setInsurance, icon: DollarSign },
            { label: "Loading / port costs ($/t)", value: loading, setter: setLoading, icon: Anchor },
            { label: "Quality loss / moisture ($/t)", value: loss, setter: setLoss, icon: TrendingUp },
          ].map((field) => (
            <div key={field.label}>
              <label className="text-sm text-gray-400 block mb-1.5">{field.label}</label>
              <div className="relative">
                <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-300"
                />
              </div>
            </div>
          ))}

          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Destination benchmark</label>
            <select
              value={destinationBenchmark}
              onChange={(e) => setDestinationBenchmark(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
            >
              {benchmarks.map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label} {b.price !== null ? `($${b.price.toFixed(2)})` : "(live)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-transparent p-6 flex flex-col justify-center">
          <div className="text-sm text-gray-400 mb-1">Delivered cost</div>
          <div className="text-4xl font-bold text-white mb-4">${deliveredCost.toFixed(2)}<span className="text-lg text-gray-500">/t</span></div>

          {destinationPrice !== null && (
            <>
              <div className="text-sm text-gray-400 mb-1">Destination benchmark</div>
              <div className="text-2xl font-bold text-amber-200 mb-4">${destinationPrice.toFixed(2)}<span className="text-sm text-gray-500">/t</span></div>

              <div className="text-sm text-gray-400 mb-1">Arbitrage</div>
              <div className={`text-3xl font-bold ${(arbitrage ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(arbitrage ?? 0) >= 0 ? "+" : ""}${(arbitrage ?? 0).toFixed(2)}<span className="text-lg text-gray-500">/t</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {(arbitrage ?? 0) > 0
                  ? "Origin-delivered coal is cheaper than the destination benchmark."
                  : (arbitrage ?? 0) < 0
                    ? "Destination benchmark is below delivered cost."
                    : "Break-even arbitrage."}
              </p>
            </>
          )}

          {destinationPrice === null && (
            <p className="text-sm text-gray-500">Select a live benchmark with available price data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
