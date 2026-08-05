"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Factory,
  Warehouse,
  Flame,
  Scale,
} from "lucide-react";

const PRESETS = [
  { label: "500 MW", capacity: "500", load: "72", heatRate: "9800", heatContent: "24" },
  { label: "1,000 MW", capacity: "1000", load: "75", heatRate: "9500", heatContent: "24" },
  { label: "1,500 MW", capacity: "1500", load: "78", heatRate: "9300", heatContent: "24" },
];

const COAL_GRADES = [
  { name: "Sub-bituminous", heatMin: 17, heatMax: 24, sulfur: "Low", price: 45 },
  { name: "Bituminous Thermal", heatMin: 24, heatMax: 30, sulfur: "Medium", price: 85 },
  { name: "Anthracite", heatMin: 25, heatMax: 28, sulfur: "Low", price: 120 },
  { name: "Metallurgical", heatMin: 26, heatMax: 32, sulfur: "Low-Variable", price: 240 },
];

function fmtNumber(value: number, digits = 0) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

export default function CoalCalculators() {
  const [plantCapacity, setPlantCapacity] = useState("850");
  const [plantLoad, setPlantLoad] = useState("72");
  const [heatRate, setHeatRate] = useState("9800");
  const [coalEnergy, setCoalEnergy] = useState("24");
  const [coalPrice, setCoalPrice] = useState("85");

  const [stockpileTons, setStockpileTons] = useState("450000");
  const [dailyBurn, setDailyBurn] = useState("7800");
  const [dailyInbound, setDailyInbound] = useState("2200");

  const [emissionsCapacity, setEmissionsCapacity] = useState("850");
  const [emissionsLoad, setEmissionsLoad] = useState("72");
  const [emissionsFactor, setEmissionsFactor] = useState("0.98");

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPlantCapacity(preset.capacity);
    setPlantLoad(preset.load);
    setHeatRate(preset.heatRate);
    setCoalEnergy(preset.heatContent);
    setEmissionsCapacity(preset.capacity);
    setEmissionsLoad(preset.load);
  };

  const burnModel = useMemo(() => {
    const capacity = Number.parseFloat(plantCapacity) || 0;
    const capacityFactor = (Number.parseFloat(plantLoad) || 0) / 100;
    const rate = Number.parseFloat(heatRate) || 0;
    const heatContent = Number.parseFloat(coalEnergy) || 1;
    const annualMWh = capacity * capacityFactor * 8760;
    const annualMMBtu = annualMWh * (rate / 1000);
    const annualTons = heatContent > 0 ? annualMMBtu / heatContent : 0;
    const dailyTons = annualTons / 365;
    const fuelCost = annualTons * (Number.parseFloat(coalPrice) || 0);
    const costPerMWh = annualMWh > 0 ? fuelCost / annualMWh : 0;

    return { annualMWh, annualTons, dailyTons, fuelCost, costPerMWh };
  }, [coalEnergy, coalPrice, heatRate, plantCapacity, plantLoad]);

  const stockpileModel = useMemo(() => {
    const stockpile = Number.parseFloat(stockpileTons) || 0;
    const burn = Number.parseFloat(dailyBurn) || 0;
    const inbound = Number.parseFloat(dailyInbound) || 0;
    const netDraw = burn - inbound;
    const runwayDays = netDraw > 0 ? stockpile / netDraw : null;

    const depletion: { day: number; stock: number }[] = [];
    if (netDraw > 0) {
      for (let d = 0; d <= Math.min(90, Math.ceil(stockpile / netDraw) + 5); d++) {
        depletion.push({ day: d, stock: Math.max(0, stockpile - netDraw * d) });
      }
    }

    return { netDraw, runwayDays, depletion };
  }, [dailyBurn, dailyInbound, stockpileTons]);

  const emissionsModel = useMemo(() => {
    const capacity = Number.parseFloat(emissionsCapacity) || 0;
    const capacityFactor = (Number.parseFloat(emissionsLoad) || 0) / 100;
    const factor = Number.parseFloat(emissionsFactor) || 0;
    const annualMWh = capacity * capacityFactor * 8760;
    const annualCo2 = annualMWh * factor;

    return { annualMWh, annualCo2 };
  }, [emissionsCapacity, emissionsFactor, emissionsLoad]);

  return (
    <section id="calculators" className="mb-16 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-amber-300" />
          <h2 className="text-2xl font-bold">Coal Calculators</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 hover:border-amber-300/30 hover:text-amber-200 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Plant Burn Planner */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Factory className="w-5 h-5 text-amber-300" />
            <h3 className="text-lg font-bold">Plant Burn Planner</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Plant Capacity (MW)", value: plantCapacity, setter: setPlantCapacity },
              { label: "Capacity Factor (%)", value: plantLoad, setter: setPlantLoad },
              { label: "Heat Rate (Btu/kWh)", value: heatRate, setter: setHeatRate },
              { label: "Coal Heat Content (MMBtu/ton)", value: coalEnergy, setter: setCoalEnergy },
              { label: "Coal Price ($/ton)", value: coalPrice, setter: setCoalPrice },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-sm text-gray-400 block mb-1.5">{field.label}</label>
                <input
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                />
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="text-xs text-gray-500 mb-1">Annual output</div>
              <div className="text-xl font-bold text-white">{fmtNumber(burnModel.annualMWh)} MWh</div>
            </div>
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="text-xs text-gray-500 mb-1">Annual coal burn</div>
              <div className="text-xl font-bold text-white">{fmtNumber(burnModel.annualTons)} t</div>
            </div>
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="text-xs text-gray-500 mb-1">Daily burn</div>
              <div className="text-xl font-bold text-white">{fmtNumber(burnModel.dailyTons)} t/day</div>
            </div>
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="text-xs text-gray-500 mb-1">Fuel cost</div>
              <div className="text-xl font-bold text-white">${(burnModel.fuelCost / 1_000_000).toFixed(2)}M/yr</div>
            </div>
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 sm:col-span-2">
              <div className="text-xs text-gray-500 mb-1">Cost of fuel / MWh</div>
              <div className="text-xl font-bold text-white">${burnModel.costPerMWh.toFixed(2)} / MWh</div>
            </div>
          </div>
        </div>

        {/* Stockpile Runway */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Warehouse className="w-5 h-5 text-amber-300" />
            <h3 className="text-lg font-bold">Stockpile Runway</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "On-Site Stockpile (tons)", value: stockpileTons, setter: setStockpileTons },
              { label: "Daily Burn (tons/day)", value: dailyBurn, setter: setDailyBurn },
              { label: "Inbound Deliveries (tons/day)", value: dailyInbound, setter: setDailyInbound },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-sm text-gray-400 block mb-1.5">{field.label}</label>
                <input
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                />
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <div className="text-xs text-gray-500 mb-1">Net stockpile draw</div>
              <div className="text-xl font-bold text-white">{fmtNumber(stockpileModel.netDraw)} t/day</div>
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <div className="text-xs text-gray-500 mb-1">Runway</div>
              <div className="text-xl font-bold text-white">
                {stockpileModel.runwayDays === null
                  ? "Stable / Growing"
                  : `${fmtNumber(stockpileModel.runwayDays, 1)} days`}
              </div>
            </div>
            {stockpileModel.depletion.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="text-xs text-gray-500 mb-2">90-day depletion curve</div>
                <div className="flex items-end gap-0.5 h-20">
                  {stockpileModel.depletion.slice(0, 30).map((point, idx) => {
                    const max = Number(stockpileTons) || 1;
                    const h = max > 0 ? (point.stock / max) * 100 : 0;
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-cyan-400/60 hover:bg-cyan-400 rounded-t-sm"
                        style={{ height: `${h}%` }}
                        title={`Day ${point.day}: ${fmtNumber(point.stock)} t`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Emissions View */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-amber-300" />
            <h3 className="text-lg font-bold">Emissions View</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Capacity (MW)", value: emissionsCapacity, setter: setEmissionsCapacity },
              { label: "Capacity Factor (%)", value: emissionsLoad, setter: setEmissionsLoad },
              { label: "Emission Factor (tCO₂/MWh)", value: emissionsFactor, setter: setEmissionsFactor },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-sm text-gray-400 block mb-1.5">{field.label}</label>
                <input
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-300"
                />
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <div className="text-xs text-gray-500 mb-1">Annual generation</div>
              <div className="text-xl font-bold text-white">{fmtNumber(emissionsModel.annualMWh)} MWh</div>
            </div>
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
              <div className="text-xs text-gray-500 mb-1">Annual CO₂</div>
              <div className="text-xl font-bold text-white">{fmtNumber(emissionsModel.annualCo2)} t</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-gray-500 mb-2">Generation vs emissions</div>
              <div className="space-y-2">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: "100%" }} />
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${Math.min(100, (emissionsModel.annualCo2 / Math.max(1, emissionsModel.annualMWh)) * 0.1)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Generation</span>
                <span>CO₂</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Comparator */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-amber-300" />
          <h3 className="text-lg font-bold">Grade Comparator ($/MMBtu)</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COAL_GRADES.map((grade) => {
            const midHeat = (grade.heatMin + grade.heatMax) / 2;
            const $perMMBtu = midHeat > 0 ? grade.price / midHeat : 0;
            return (
              <div key={grade.name} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-amber-300/30 transition-colors">
                <div className="text-sm font-bold text-white mb-1">{grade.name}</div>
                <div className="text-xs text-gray-500 mb-2">{grade.heatMin}-{grade.heatMax} MMBtu/t • {grade.sulfur} sulfur</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">$/MMBtu</span>
                  <span className="text-lg font-bold text-amber-300">${$perMMBtu.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">$/ton</span>
                  <span className="text-sm font-bold text-white">${grade.price}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
