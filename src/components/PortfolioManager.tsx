"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Loader2,
  DollarSign,
  PieChart,
  Wallet,
} from "lucide-react";

interface PortfolioAsset {
  id: string;
  symbol: string;
  label: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  totalValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  change: number;
  changePercent: number;
  notes: string | null;
  createdAt: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalPnl: number;
  totalPnlPercent: number;
  assetCount: number;
}

const COMMON_SYMBOLS = [
  { symbol: "GOLD", label: "Gold" },
  { symbol: "SILVER", label: "Silver" },
  { symbol: "COPPER", label: "Copper" },
  { symbol: "ZINC", label: "Zinc" },
  { symbol: "LEAD", label: "Lead" },
  { symbol: "NICKEL", label: "Nickel" },
  { symbol: "CRUDE", label: "Crude Oil" },
  { symbol: "NATGAS", label: "Natural Gas" },
  { symbol: "URANIUM", label: "Uranium" },
  { symbol: "LITHIUM", label: "Lithium" },
  { symbol: "ASX200", label: "ASX 200" },
];

export default function PortfolioManager() {
  const { data: session } = useSession();
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formSymbol, setFormSymbol] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formBuyPrice, setFormBuyPrice] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/user/portfolio");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAssets(data.assets || []);
      setSummary(data.summary || null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchPortfolio();
    } else if (session === null) {
      setLoading(false);
    }
  }, [session, fetchPortfolio]);

  const handleSymbolSelect = (symbol: string, label: string) => {
    setFormSymbol(symbol);
    setFormLabel(label);
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSymbol || !formQuantity || !formBuyPrice) return;
    setFormLoading(true);

    try {
      const res = await fetch("/api/user/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: formSymbol,
          label: formLabel || formSymbol,
          quantity: Number(formQuantity),
          buyPrice: Number(formBuyPrice),
          notes: formNotes || null,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setFormSymbol("");
        setFormLabel("");
        setFormQuantity("");
        setFormBuyPrice("");
        setFormNotes("");
        fetchPortfolio();
      }
    } catch {
      // silently fail
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/user/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchPortfolio();
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: value >= 100 ? 2 : value >= 1 ? 2 : 4,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-geo-gold" />
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      {summary && summary.assetCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Wallet className="w-3.5 h-3.5" />
              Total Value
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {formatCurrency(summary.totalValue)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              Cost Basis
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {formatCurrency(summary.totalCostBasis)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <PieChart className="w-3.5 h-3.5" />
              P&L
            </div>
            <div className="text-xl font-bold font-mono">
              <span
                className={
                  summary.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                }
              >
                {summary.totalPnl >= 0 ? "+" : ""}
                {formatCurrency(summary.totalPnl)}
                <span className="text-sm ml-1">
                  ({formatPercent(summary.totalPnlPercent)})
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl border border-geo-gold/30 bg-geo-gold/10 px-4 py-2.5 text-sm font-semibold text-geo-gold hover:bg-geo-gold/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "Cancel" : "Add Asset"}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddAsset}
          className="mb-6 rounded-xl border border-geo-gold/30 bg-geo-gold/5 p-5 space-y-4"
        >
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">
              Symbol / Asset
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_SYMBOLS.map((s) => (
                <button
                  type="button"
                  key={s.symbol}
                  onClick={() => handleSymbolSelect(s.symbol, s.label)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    formSymbol === s.symbol
                      ? "border-geo-gold/50 bg-geo-gold/20 text-geo-gold"
                      : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  {s.symbol}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={formSymbol}
                onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                placeholder="Symbol (e.g. GOLD)"
                className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-gray-500 focus:border-geo-gold/40 focus:outline-none"
                required
              />
              <input
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Label (e.g. Gold)"
                className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-gray-500 focus:border-geo-gold/40 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">
                Quantity
              </label>
              <input
                type="number"
                step="any"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                placeholder="e.g. 10"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-gray-500 focus:border-geo-gold/40 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">
                Buy Price ($)
              </label>
              <input
                type="number"
                step="any"
                value={formBuyPrice}
                onChange={(e) => setFormBuyPrice(e.target.value)}
                placeholder="e.g. 2000.00"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-gray-500 focus:border-geo-gold/40 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">
              Notes (optional)
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Any notes about this position..."
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-geo-gold/40 focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full h-10 rounded-xl bg-geo-gold text-black font-semibold text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {formLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Portfolio
              </>
            )}
          </button>
        </form>
      )}

      {/* Assets List */}
      {assets.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm mb-2">No portfolio assets yet</p>
          <p className="text-gray-500 text-xs mb-4">
            Add commodities, indices, or any tracked instruments to monitor
            your positions.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-geo-gold/30 bg-geo-gold/10 px-4 py-2 text-sm font-semibold text-geo-gold hover:bg-geo-gold/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Asset
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {asset.label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                      {asset.symbol}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <div className="text-[10px] text-gray-500">Qty</div>
                      <div className="text-xs font-mono text-white">
                        {asset.quantity}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">Buy Price</div>
                      <div className="text-xs font-mono text-white">
                        {formatCurrency(asset.buyPrice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">
                        Current Price
                      </div>
                      <div className="text-xs font-mono text-white">
                        {formatCurrency(asset.currentPrice)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">
                        Current Value
                      </div>
                      <div className="text-xs font-mono text-white">
                        {formatCurrency(asset.totalValue)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      {asset.pnl >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span
                        className={`text-sm font-bold font-mono ${
                          asset.pnl >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {asset.pnl >= 0 ? "+" : ""}
                        {formatCurrency(asset.pnl)}
                        <span className="text-xs ml-1">
                          ({formatPercent(asset.pnlPercent)})
                        </span>
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono ${
                        asset.change >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {asset.change >= 0 ? "▲" : "▼"}{" "}
                      {formatCurrency(asset.change)} ({formatPercent(asset.changePercent)})
                    </span>
                  </div>
                  {asset.notes && (
                    <p className="mt-2 text-[11px] text-gray-500 italic">
                      {asset.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(asset.id)}
                  disabled={deletingId === asset.id}
                  className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  title="Remove asset"
                >
                  {deletingId === asset.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}