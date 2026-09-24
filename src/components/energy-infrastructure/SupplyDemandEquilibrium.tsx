"use client";

import {
  Activity,
  AlertTriangle,
  Droplet,
  Flame,
  Gauge,
  Layers,
  Ship,
  TrendingUp,
  Zap,
} from "lucide-react";
import type {
  MacroIndicatorsData,
  SupplyDemandBalanceData,
} from "@/lib/energy-infrastructure-service";

interface SupplyDemandEquilibriumProps {
  balance?: SupplyDemandBalanceData;
  macro?: MacroIndicatorsData;
}

export default function SupplyDemandEquilibrium({
  balance,
  macro,
}: SupplyDemandEquilibriumProps) {
  const b = balance ?? {
    globalCrudeSupplyMMBPD: 102.7,
    globalCrudeDemandMMBPD: 103.4,
    netCrudeBalanceMMBPD: -0.7,
    globalLngSupplyMtpa: 416.0,
    globalLngDemandMtpa: 422.5,
    netLngBalanceMtpa: -6.5,
    crudeDaysOfCover: 54.2,
    euGasStoragePercent: 68.4,
    usWorkingGasBcf: 2840,
    sprInventoryMMBBL: 392.5,
  };

  const m = macro ?? {
    energyCpiScore: 68,
    crackSpread321: 26.4,
    tankerFreightIndex: 64.5,
    lngCharterDayRate: 72000,
    geopoliticalRiskPremium: 4.65,
    globalGridStressIndex: 65,
  };

  return (
    <div className="space-y-4 text-gray-100">
      {/* Top Supply-Demand Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-300">
              Crude Balance
            </span>
            <Droplet className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-1.5 text-lg font-bold font-mono text-rose-300">
            {b.netCrudeBalanceMMBPD > 0 ? `+${b.netCrudeBalanceMMBPD}` : b.netCrudeBalanceMMBPD} MMBPD
          </p>
          <p className="text-[10px] text-rose-200/70">
            {b.netCrudeBalanceMMBPD < 0 ? "Global Deficit / Draw" : "Global Surplus / Build"}
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              LNG Balance
            </span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-1.5 text-lg font-bold font-mono text-amber-300">
            {b.netLngBalanceMtpa > 0 ? `+${b.netLngBalanceMtpa}` : b.netLngBalanceMtpa} mtpa
          </p>
          <p className="text-[10px] text-amber-200/70">Tight seaborne LNG market</p>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
              EU Gas Storage
            </span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-1.5 text-lg font-bold font-mono text-cyan-300">
            {b.euGasStoragePercent}%
          </p>
          <p className="text-[10px] text-cyan-200/70">Seasonal target buffer</p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Crude Cover
            </span>
            <Gauge className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1.5 text-lg font-bold font-mono text-emerald-300">
            {b.crudeDaysOfCover} days
          </p>
          <p className="text-[10px] text-emerald-200/70">Forward consumption days</p>
        </div>
      </div>
      {/* Global Oil & Gas Balance Sheet */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
          Global Oil & Methane Supply / Demand Balance Sheet
        </h3>
        <p className="mt-0.5 text-[11px] text-gray-400">
          Estimates combining live EIA inventory withdrawals, OPEC+ output, and seasonal consumption models.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase text-gray-400">
                <th className="pb-1.5">Energy Stream</th>
                <th className="pb-1.5">Global Supply</th>
                <th className="pb-1.5">Global Demand</th>
                <th className="pb-1.5">Net Imbalance</th>
                <th className="pb-1.5">Market Implication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              <tr>
                <td className="py-2 font-medium text-white flex items-center gap-1.5">
                  <Droplet className="h-3.5 w-3.5 text-rose-400" />
                  Crude Liquids
                </td>
                <td className="py-2 font-mono">{b.globalCrudeSupplyMMBPD} MMBPD</td>
                <td className="py-2 font-mono">{b.globalCrudeDemandMMBPD} MMBPD</td>
                <td className="py-2 font-mono font-bold text-rose-400">
                  {b.netCrudeBalanceMMBPD} MMBPD
                </td>
                <td className="py-2 text-[11px] text-amber-300">Inventory draws; backwardation supported</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-white flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  Liquefied Gas (LNG)
                </td>
                <td className="py-2 font-mono">{b.globalLngSupplyMtpa} mtpa</td>
                <td className="py-2 font-mono">{b.globalLngDemandMtpa} mtpa</td>
                <td className="py-2 font-mono font-bold text-amber-300">
                  {b.netLngBalanceMtpa} mtpa
                </td>
                <td className="py-2 text-[11px] text-cyan-300">JKM/TTF arbitrage active; high charter rates</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-white flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  US Working Gas
                </td>
                <td className="py-2 font-mono">104.2 BCFD</td>
                <td className="py-2 font-mono">102.8 BCFD</td>
                <td className="py-2 font-mono font-bold text-emerald-400">+1.4 BCFD</td>
                <td className="py-2 text-[11px] text-gray-400">In-storage: {b.usWorkingGasBcf} Bcf (+2.1% vs 5-yr avg)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Macroeconomic Factors & Economic Transmission Matrix */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
          Macroeconomic Factor Transmission Engine
        </h3>
        <p className="mt-0.5 text-[11px] text-gray-400">
          How infrastructure constraints, refining bottlenecks, and geopolitical premia pass into broader economic indicators.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Energy CPI Pressure Index</span>
              <span className="font-mono font-bold text-amber-300">{m.energyCpiScore} / 100</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                style={{ width: `${m.energyCpiScore}%` }}
                className={`h-full rounded-full ${
                  m.energyCpiScore > 75 ? "bg-rose-500" : m.energyCpiScore > 50 ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              High score signals energy costs filtering into transportation and headline CPI.
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">3:2:1 Crack Spread</span>
              <span className="font-mono font-bold text-emerald-400">${m.crackSpread321} / bbl</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" />
              Healthy downstream processing profitability
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              Margin per barrel converted into gasoline and distillate products.
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Geopolitical Risk Premium</span>
              <span className="font-mono font-bold text-rose-400">+${m.geopoliticalRiskPremium} / bbl</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              Chokepoint & transit risk component
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              Spread premium pricing Red Sea diversions and Strait of Hormuz readiness.
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Tanker Freight (VLCC)</span>
              <span className="font-mono font-bold text-cyan-300">WS {m.tankerFreightIndex}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-300">
              <Ship className="h-3.5 w-3.5 text-cyan-400" />
              Middle East $\rightarrow$ China voyage
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              Worldscale index reflects ton-mile demand and rerouting around Africa.
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">LNG Carrier Charter Rate</span>
              <span className="font-mono font-bold text-amber-300">${(m.lngCharterDayRate / 1000).toFixed(0)}k / day</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-300">
              <Ship className="h-3.5 w-3.5 text-amber-400" />
              TFDE 160k cbm standard carrier
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              Spot day-rates for trans-Atlantic and Middle East export routes.
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">US SPR Cushion</span>
              <span className="font-mono font-bold text-purple-300">{b.sprInventoryMMBBL} MMBBL</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-300">
              <Gauge className="h-3.5 w-3.5 text-purple-400" />
              ~55% of 714 MMBBL total capacity
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              Current strategic inventory reserve available for emergency market release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
