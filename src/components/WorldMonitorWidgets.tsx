import React from "react";
import { Target, Crosshair, BarChart3, Wifi, Flag, Ban, Atom } from "lucide-react";
import { getRiskColor, riskBarColor } from "@/app/world-monitor/constants";

export function ChokepointsWidget({ data, onChokepointClick }: { data: any[], onChokepointClick: (cp: any) => void }) {
  return (
    <div className="flex flex-col h-[400px] bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-geo-gold" />
          <h2 className="text-sm font-bold tracking-wide">GLOBAL CHOKEPOINTS</h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Critical maritime & strategic bottlenecks</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {data.map((cp) => (
          <button
            type="button"
            key={cp.name}
            onClick={() => onChokepointClick(cp)}
            className="w-full px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">{cp.name}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  cp.risk >= 70
                    ? "text-red-400 bg-red-500/10 border-red-500/30"
                    : cp.risk >= 50
                      ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
                      : cp.risk >= 30
                        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                }`}
              >
                {cp.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
              <span>{cp.dailyTraffic}</span>
              <span>{cp.percentGlobal} global</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${riskBarColor(cp.risk)}`}
                style={{ width: `${cp.risk}%` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AssetTrackingWidget({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col h-[400px] bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-geo-gold" />
          <h2 className="text-sm font-bold tracking-wide">ASSET TRACKING</h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Multi-domain surveillance systems</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {data.map((asset) => (
          <div key={asset.type} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <asset.icon className="w-4 h-4 text-geo-gold" />
                <span className="text-xs font-semibold text-white">{asset.type}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
              <span>{asset.active.toLocaleString()} active</span>
              <span>{asset.total.toLocaleString()} total</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-geo-gold/60 rounded-full"
                style={{ width: `${asset.total > 0 ? (asset.active / asset.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
        <div className="px-4 py-4 bg-geo-gold/5 mt-auto">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Total Active Monitoring</div>
          <div className="text-xl font-bold text-geo-gold font-mono">
            {data.reduce((sum, asset) => sum + asset.active, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RiskIndicesWidget({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col h-[400px] bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-geo-gold" />
          <h2 className="text-sm font-bold tracking-wide">RISK INDICES</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {data.map((idx) => (
          <div key={idx.name} className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">{idx.name}</span>
              <span className={`text-xs font-mono ${idx.change > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {idx.change > 0 ? "▲" : "▼"} {Math.abs(idx.change)}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-2xl font-bold font-mono ${getRiskColor(idx.value)}`}>
                {idx.value}
              </span>
              <span className="text-xs text-gray-600">/ 100</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${idx.color}`}
                style={{ width: `${idx.value}%` }}
              />
            </div>
          </div>
        ))}
        <div className="px-4 py-4 bg-geo-gold/5 mt-auto">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Composite Risk Index</div>
          <div className="text-3xl font-bold text-geo-gold font-mono">
            {Math.round(data.reduce((s, i) => s + i.value, 0) / data.length)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SigintWidget({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col h-[400px] bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-wide">SIGINT INTERCEPTS</h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Live signals &amp; electronic intelligence</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {data.map((sig, i) => (
          <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-cyan-400">{sig.source}</span>
              <span className="text-[9px] text-gray-500">{sig.time}</span>
            </div>
            <div className="flex items-center justify-between mb-1 text-[10px]">
              <span className="text-white">{sig.region}</span>
              <span className="text-gray-500 font-mono">{sig.freq}</span>
            </div>
            <p className="text-xs text-gray-300 leading-snug">{sig.detail}</p>
            <div className="mt-2 text-[9px] font-mono font-bold text-red-400">
              CLASS: {sig.classification}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CountryBriefsWidget({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col h-[400px] bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-geo-gold" />
          <h2 className="text-sm font-bold tracking-wide">COUNTRY BRIEFS</h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Intelligence assessments &mdash; threat &amp; stability</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {data.map((cb) => (
          <div key={cb.country} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{cb.flag}</span>
                <span className="text-xs font-bold text-white">{cb.country}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${cb.threat >= 80 ? "text-red-400" : cb.threat >= 60 ? "text-orange-400" : cb.threat >= 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                THREAT: {cb.threat}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="text-[9px] text-gray-600 uppercase">Threat</div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full ${cb.threat >= 70 ? "bg-red-500" : cb.threat >= 50 ? "bg-orange-500" : "bg-yellow-500"}`} style={{ width: `${cb.threat}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 uppercase">Stability</div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full ${cb.stability >= 60 ? "bg-emerald-500" : cb.stability >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${cb.stability}%` }} />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-2">{cb.brief}</p>
            <div className="flex flex-wrap gap-1">
              {cb.hotTopics.map((topic: string) => (
                <span key={topic} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SanctionsWidget({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col h-[400px] bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Ban className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold tracking-wide">SANCTIONS TRACKER</h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Active sanctions regimes &amp; economic warfare</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {data.map((s) => (
          <div key={s.entity} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">{s.entity}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${s.status === "Escalating" ? "text-red-400 bg-red-500/10 border-red-500/30" : s.status === "Active" ? "text-orange-400 bg-orange-500/10 border-orange-500/30" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"}`}>
                {s.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
              <div>
                <div className="text-gray-600 text-[9px]">Type</div>
                <div className="text-gray-400">{s.type}</div>
              </div>
              <div>
                <div className="text-gray-600 text-[9px]">Packages</div>
                <div className="text-gray-400 font-mono">{s.packages}</div>
              </div>
              <div>
                <div className="text-gray-600 text-[9px]">Updated</div>
                <div className="text-gray-400">{s.lastUpdate}</div>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mb-2">Sectors: {s.sectors}</div>
            <div>
              <div className="flex items-center justify-between text-[9px] mb-1">
                <span className="text-gray-600">Impact Index</span>
                <span className={`font-mono font-bold ${s.impact >= 80 ? "text-red-400" : s.impact >= 60 ? "text-orange-400" : "text-yellow-400"}`}>
                  {s.impact}/100
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${s.impact >= 80 ? "bg-red-500" : s.impact >= 60 ? "bg-orange-500" : "bg-yellow-500"}`} style={{ width: `${s.impact}%` }} />
              </div>
            </div>
          </div>
        ))}
        <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/10 mt-auto">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Total Active Regimes</div>
          <div className="text-xl font-bold text-red-400 font-mono">{data.length}</div>
        </div>
      </div>
    </div>
  );
}

export function NuclearMonitorWidget({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col h-[400px] bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <Atom className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-bold tracking-wide">NUCLEAR MONITOR</h2>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Global nuclear arsenal tracking</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {data.map((n) => (
          <div key={n.state} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">{n.state}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${n.alert === "CRITICAL" ? "text-red-400 bg-red-500/10 border-red-500/30 animate-pulse" : n.alert === "HIGH" ? "text-orange-400 bg-orange-500/10 border-orange-500/30" : n.alert === "MODERATE" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"}`}>
                {n.alert}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
              <div>
                <div className="text-gray-600 text-[9px]">Total</div>
                <div className="text-gray-300 font-mono font-bold">{n.warheads.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600 text-[9px]">Deployed</div>
                <div className="text-gray-300 font-mono">{n.deployed.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600 text-[9px]">Status</div>
                <div className={`${n.status === "Expanding" || n.status === "Testing" || n.status === "Threshold" ? "text-red-400" : n.status === "Elevated" || n.status === "Growing" ? "text-orange-400" : "text-emerald-400"}`}>
                  {n.status}
                </div>
              </div>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-yellow-500/70" style={{ width: `${Math.min((n.warheads / 6000) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
        <div className="px-4 py-3 bg-yellow-500/5 border-t border-yellow-500/10 mt-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] text-gray-600 uppercase">Global Warheads</div>
              <div className="text-lg font-bold text-yellow-400 font-mono">{data.reduce((s, n) => s + n.warheads, 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] text-gray-600 uppercase">Deployed</div>
              <div className="text-lg font-bold text-orange-400 font-mono">{data.reduce((s, n) => s + n.deployed, 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
