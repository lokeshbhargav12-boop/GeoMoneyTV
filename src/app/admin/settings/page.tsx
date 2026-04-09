"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TickerSymbol {
  label: string;
  symbol: string;
  type: "crypto" | "commodity" | "currency" | "stock";
}

interface NewsSource {
  name: string;
  type: "rss" | "api";
  url: string;
  apiKey?: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tickers, setTickers] = useState<TickerSymbol[]>([]);
  const [newTicker, setNewTicker] = useState<TickerSymbol>({
    label: "",
    symbol: "",
    type: "stock",
  });
  const [alphaVantageKey, setAlphaVantageKey] = useState("");
  const [newsSources, setNewsSources] = useState<NewsSource[]>([]);
  const [newsApiKey, setNewsApiKey] = useState("");
  const [newRssFeed, setNewRssFeed] = useState({ name: "", url: "" });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "tickers" | "news" | "ai" | "youtube" | "smtp"
  >("general");
  const [aiModel, setAiModel] = useState("xiaomi/mimo-v2-flash:free");

  // YouTube settings
  const [youtubeChannelId, setYoutubeChannelId] = useState("UCGb6oaBpGLmLYnxUHmLXFAQ");
  const [youtubeApiKey, setYoutubeApiKey] = useState("");

  // SMTP settings
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("GeoMoney TV");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();

      if (data.logoUrl) setLogoUrl(data.logoUrl);
      if (data.tickers) setTickers(data.tickers);
      if (data.alphaVantageKey) setAlphaVantageKey(data.alphaVantageKey);
      if (data.newsSources) setNewsSources(data.newsSources);
      if (data.newsApiKey) setNewsApiKey(data.newsApiKey);
      if (data.aiModel) setAiModel(data.aiModel);
      if (data.youtubeChannelId) setYoutubeChannelId(data.youtubeChannelId);
      if (data.youtubeApiKey) setYoutubeApiKey(data.youtubeApiKey);
      if (data.smtpHost) setSmtpHost(data.smtpHost);
      if (data.smtpPort) setSmtpPort(data.smtpPort);
      if (data.smtpUser) setSmtpUser(data.smtpUser);
      if (data.smtpPass) setSmtpPass(data.smtpPass);
      if (data.smtpFromName) setSmtpFromName(data.smtpFromName);
      if (data.smtpFromEmail) setSmtpFromEmail(data.smtpFromEmail);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("logo", e.target.files[0]);
    try {
      const res = await fetch("/api/admin/settings", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setLogoUrl(data.logoUrl);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const addTicker = () => {
    if (!newTicker.label || !newTicker.symbol) { alert("Please fill in all ticker fields"); return; }
    setTickers([...tickers, newTicker]);
    setNewTicker({ label: "", symbol: "", type: "stock" });
  };

  const removeTicker = (index: number) => setTickers(tickers.filter((_, i) => i !== index));

  const saveTickers = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/tickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers, alphaVantageKey }),
      });
      if (!res.ok) throw new Error("Failed to save tickers");
      alert("Ticker configuration saved successfully!");
    } catch (error) { console.error(error); alert("Failed to save tickers"); }
    finally { setSaving(false); }
  };

  const addRssFeed = () => {
    if (!newRssFeed.name || !newRssFeed.url) { alert("Please fill in feed name and URL"); return; }
    setNewsSources([...newsSources, { name: newRssFeed.name, type: "rss", url: newRssFeed.url, enabled: true }]);
    setNewRssFeed({ name: "", url: "" });
  };

  const removeNewsSource = (index: number) => setNewsSources(newsSources.filter((_, i) => i !== index));
  const toggleNewsSource = (index: number) => {
    const updated = [...newsSources];
    updated[index].enabled = !updated[index].enabled;
    setNewsSources(updated);
  };

  const saveNewsSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsSources, newsApiKey }),
      });
      if (!res.ok) throw new Error("Failed to save news settings");
      alert("News settings saved successfully!");
    } catch (error) { console.error(error); alert("Failed to save news settings"); }
    finally { setSaving(false); }
  };

  const saveAiSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiModel }),
      });
      if (!res.ok) throw new Error("Failed to save AI settings");
      alert("AI settings saved successfully!");
    } catch (error) { console.error(error); alert("Failed to save AI settings"); }
    finally { setSaving(false); }
  };

  const saveYoutubeSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeChannelId, youtubeApiKey }),
      });
      if (!res.ok) throw new Error("Failed to save YouTube settings");
      alert("YouTube settings saved successfully!");
    } catch (error) { console.error(error); alert("Failed to save YouTube settings"); }
    finally { setSaving(false); }
  };

  const saveSmtpSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, smtpFromEmail }),
      });
      if (!res.ok) throw new Error("Failed to save SMTP settings");
      alert("SMTP settings saved successfully!");
    } catch (error) { console.error(error); alert("Failed to save SMTP settings"); }
    finally { setSaving(false); }
  };

  const syncNews = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/news/sync", { method: "POST" });
      if (!res.ok) throw new Error("Failed to sync news");
      const data = await res.json();
      alert(`Successfully synced ${data.count} articles!`);
    } catch (error) { console.error(error); alert("Failed to sync news"); }
    finally { setSyncing(false); }
  };

  const tabs = [
    { key: "general", label: "General" },
    { key: "youtube", label: "YouTube" },
    { key: "tickers", label: "Tickers" },
    { key: "news", label: "News Sources" },
    { key: "ai", label: "AI Config" },
    { key: "smtp", label: "Email / SMTP" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Site Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-1 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-b-2 border-geo-gold text-geo-gold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-medium text-white">Logo Configuration</h2>
          <p className="mt-1 text-sm text-gray-400">Update the site logo. Recommended size: 200x200px.</p>
          <div className="mt-6 flex items-center gap-x-8">
            <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-white/10 bg-black/50">
              {logoUrl ? (
                <img src={logoUrl} alt="Site Logo" className="h-full w-full object-contain p-2" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-500">No Logo</div>
              )}
            </div>
            <div>
              <label className="block">
                <span className="sr-only">Choose logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:rounded-full file:border-0
                    file:bg-geo-gold file:px-4 file:py-2 file:text-sm
                    file:font-semibold file:text-black hover:file:bg-yellow-500
                    disabled:opacity-50"
                />
              </label>
              {uploading && <p className="mt-2 text-sm text-geo-gold">Uploading...</p>}
            </div>
          </div>
        </div>
      )}

      {/* YouTube Settings */}
      {activeTab === "youtube" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white">YouTube Channel Configuration</h2>
            <p className="mt-1 text-sm text-gray-400">
              Configure the YouTube channel to sync videos from and the API key for shorts detection.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Channel ID</label>
                <input
                  type="text"
                  placeholder="e.g., UCGb6oaBpGLmLYnxUHmLXFAQ"
                  value={youtubeChannelId}
                  onChange={(e) => setYoutubeChannelId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Find your channel ID from YouTube Studio → Settings → Advanced.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">YouTube Data API v3 Key</label>
                <input
                  type="password"
                  placeholder="Enter YouTube Data API Key"
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Required to detect Shorts vs regular videos.{" "}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-geo-gold hover:underline">
                    Get your API key →
                  </a>
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={saveYoutubeSettings}
                disabled={saving}
                className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save YouTube Settings"}
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400">
                Channel: <span className="text-white font-mono">{youtubeChannelId || "Not set"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticker Settings */}
      {activeTab === "tickers" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white">Alpha Vantage API Configuration</h2>
            <p className="mt-1 text-sm text-gray-400">Enter your Alpha Vantage API key to fetch market data.</p>
            <div className="mt-4">
              <input
                type="password"
                placeholder="Alpha Vantage API Key"
                value={alphaVantageKey}
                onChange={(e) => setAlphaVantageKey(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Get your free API key at{" "}
                <a href="https://www.alphavantage.co/support/#api-key" target="_blank" className="text-geo-gold hover:underline">alphavantage.co</a>
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white">Market Ticker Configuration</h2>
            <p className="mt-1 text-sm text-gray-400">Configure which financial instruments appear in the ticker.</p>
            <div className="mt-6 grid grid-cols-4 gap-4">
              <input type="text" placeholder="Label (e.g., Bitcoin)" value={newTicker.label}
                onChange={(e) => setNewTicker({ ...newTicker, label: e.target.value })}
                className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              <input type="text" placeholder="Symbol (e.g., BTC)" value={newTicker.symbol}
                onChange={(e) => setNewTicker({ ...newTicker, symbol: e.target.value })}
                className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              <select value={newTicker.type}
                onChange={(e) => setNewTicker({ ...newTicker, type: e.target.value as any })}
                className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white">
                <option value="stock">Stock</option>
                <option value="crypto">Crypto (vs USD)</option>
                <option value="currency">Forex (vs USD)</option>
              </select>
              <button onClick={addTicker} className="rounded-lg bg-geo-gold px-4 py-2 font-medium text-black hover:bg-yellow-500">Add</button>
            </div>
            <div className="mt-6 space-y-2">
              {tickers.map((ticker, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-4">
                  <div><p className="font-medium text-white">{ticker.label}</p><p className="text-sm text-gray-400">{ticker.symbol} • {ticker.type}</p></div>
                  <button onClick={() => removeTicker(index)} className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30">Remove</button>
                </div>
              ))}
            </div>
            <button onClick={saveTickers} disabled={saving}
              className="mt-6 rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save Ticker Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* News Sources Settings */}
      {activeTab === "news" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white">NewsAPI.org Integration</h2>
            <p className="mt-1 text-sm text-gray-400">Add your NewsAPI.org API key to fetch real-time news articles.</p>
            <div className="mt-4 flex gap-4">
              <input type="password" placeholder="Enter NewsAPI.org API Key" value={newsApiKey}
                onChange={(e) => setNewsApiKey(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Get your API key at{" "}
              <a href="https://newsapi.org" target="_blank" className="text-geo-gold hover:underline">newsapi.org</a>
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white">RSS Feeds</h2>
            <p className="mt-1 text-sm text-gray-400">Add RSS feeds from financial news sources.</p>
            <div className="mt-4 flex gap-4">
              <input type="text" placeholder="Feed Name (e.g., Reuters Business)" value={newRssFeed.name}
                onChange={(e) => setNewRssFeed({ ...newRssFeed, name: e.target.value })}
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              <input type="text" placeholder="RSS Feed URL" value={newRssFeed.url}
                onChange={(e) => setNewRssFeed({ ...newRssFeed, url: e.target.value })}
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              <button onClick={addRssFeed} className="rounded-lg bg-geo-gold px-4 py-2 font-medium text-black hover:bg-yellow-500">Add Feed</button>
            </div>
            <div className="mt-6 space-y-2">
              {newsSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-4">
                  <div className="flex-1"><p className="font-medium text-white">{source.name}</p><p className="text-sm text-gray-400">{source.url}</p></div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleNewsSource(index)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${source.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {source.enabled ? "Enabled" : "Disabled"}
                    </button>
                    <button onClick={() => removeNewsSource(index)} className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={saveNewsSettings} disabled={saving}
              className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save News Settings"}
            </button>
            <button onClick={syncNews} disabled={syncing}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {syncing ? "Syncing..." : "Sync News Now"}
            </button>
          </div>
        </div>
      )}

      {/* AI Settings */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white">AI Model Configuration</h2>
            <p className="mt-1 text-sm text-gray-400">
              Choose which OpenRouter model powers all AI features — market sentiment, news analysis, energy intelligence, and article summaries.
            </p>

            {/* Popular model presets */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Quick-select a model</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (free)", tag: "Recommended", desc: "Google — strong reasoning, free tier" },
                  { id: "meta-llama/llama-4-scout:free", name: "Llama 4 Scout (free)", tag: "Fast", desc: "Meta — fast and capable, free tier" },
                  { id: "microsoft/phi-4:free", name: "Phi-4 (free)", tag: "Efficient", desc: "Microsoft — compact but smart" },
                  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash (free)", tag: "New", desc: "Google — multimodal, very fast" },
                  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (free)", tag: "Reasoning", desc: "DeepSeek — strong chain-of-thought" },
                  { id: "qwen/qwen3-235b-a22b:free", name: "Qwen3 235B (free)", tag: "Powerful", desc: "Alibaba — large context, analytical" },
                  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", tag: "Premium", desc: "Anthropic — best quality (paid)" },
                  { id: "openai/gpt-4o", name: "GPT-4o", tag: "Premium", desc: "OpenAI — flagship model (paid)" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAiModel(m.id)}
                    className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                      aiModel === m.id
                        ? "border-green-500/60 bg-green-500/10"
                        : "border-white/10 bg-black/30 hover:border-white/30 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 flex-none rounded-full border-2 flex items-center justify-center ${
                        aiModel === m.id ? "border-green-500" : "border-white/30"
                      }`}
                    >
                      {aiModel === m.id && (
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{m.name}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                          m.tag === "Recommended" ? "bg-green-500/20 text-green-400" :
                          m.tag === "Premium" ? "bg-yellow-500/20 text-yellow-400" :
                          m.tag === "New" ? "bg-blue-500/20 text-blue-400" :
                          "bg-white/10 text-gray-400"
                        }`}>{m.tag}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom / manual model ID */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom model ID <span className="text-gray-500 font-normal">(or paste any OpenRouter model ID)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. mistralai/mistral-7b-instruct:free"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:border-green-500/40 focus:outline-none"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Browse all available models at{" "}
                <a
                  href="https://openrouter.ai/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-geo-gold hover:underline"
                >
                  openrouter.ai/models
                </a>
              </p>
            </div>

            {/* API key notice */}
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <svg className="w-4 h-4 text-blue-400 flex-none mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-300">
                Your <strong>OpenRouter API key</strong> is read automatically from the{" "}
                <code className="bg-white/10 px-1 rounded">OPENROUTER_API_KEY</code>{" "}
                environment variable — no need to enter it here.
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={saveAiSettings}
                disabled={saving}
                className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save AI Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMTP / Email Settings */}
      {activeTab === "smtp" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white">SMTP / Email Configuration</h2>
            <p className="mt-1 text-sm text-gray-400">
              Configure SMTP settings for sending newsletters. For Gmail, use{" "}
              <span className="text-geo-gold">smtp.gmail.com</span> with an App Password.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">SMTP Host</label>
                <input type="text" placeholder="smtp.gmail.com" value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">SMTP Port</label>
                <input type="text" placeholder="587" value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">SMTP Username (Email)</label>
                <input type="text" placeholder="your@gmail.com" value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">SMTP Password / App Password</label>
                <input type="password" placeholder="App Password" value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">From Name</label>
                <input type="text" placeholder="GeoMoney TV" value={smtpFromName}
                  onChange={(e) => setSmtpFromName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">From Email</label>
                <input type="email" placeholder="noreply@geomoneytv.com" value={smtpFromEmail}
                  onChange={(e) => setSmtpFromEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-400">
                <strong>Gmail Setup:</strong> Go to Google Account → Security → 2-Step Verification → App Passwords.
                Create an App Password and use it above. Use <code className="bg-black/30 px-1 rounded">smtp.gmail.com</code> / port <code className="bg-black/30 px-1 rounded">587</code>.
              </p>
            </div>
            <div className="mt-6">
              <button onClick={saveSmtpSettings} disabled={saving}
                className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save SMTP Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
