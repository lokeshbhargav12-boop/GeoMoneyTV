"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail,
  Send,
  Eye,
  RefreshCw,
  Sparkles,
  FileText,
  Users,
  Clock,
  Plus,
  Trash2,
  Zap,
  Calendar,
  Timer,
  Brain,
  Newspaper,
  Bug,
  Terminal,
  Settings,
  UserCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Code,
  Database,
  Bot,
} from "lucide-react";

// Safe JSON parse -- handles HTML error pages from timeouts/crashes
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const status = res.status;
    if (status === 504 || status === 502)
      throw new Error("Request timed out. Try again.");
    if (status === 401 || status === 403)
      throw new Error("Session expired. Please refresh and sign in again.");
    if (status >= 500)
      throw new Error(
        "Server error (" + status + "). Check runtime logs for details."
      );
    throw new Error("Unexpected response (" + status + "). Please try again.");
  }
}

// Types
interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
  materialPreferences?: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface SentReport {
  id: string;
  subject: string;
  sentCount: number;
  sentAt: string;
  reportType?: string;
}

interface TriggerState {
  loading: boolean;
  result: { ok: boolean; msg: string } | null;
}

interface RagContextSettings {
  dailyPromptTemplate: string;
  weeklyPromptTemplate: string;
  contextWindowSize: number;
  temperature: number;
  maxTokens: number;
  enabledDataSources: {
    articles: boolean;
    materials: boolean;
    tickers: boolean;
    userPreferences: boolean;
  };
}

interface DebugInfo {
  prompt?: string;
  rawResponse?: string;
  parsedData?: any;
  dataContext?: {
    articlesCount: number;
    materialsCount: number;
    tickersCount: number;
    userPreferences?: any;
  };
  errors?: string[];
  generationTime?: number;
}

// Countdown hook
function useCountdown(utcHour: number, utcMinute: number) {
  const [countdown, setCountdown] = useState("--:--:--");
  const [nextRunIST, setNextRunIST] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const next = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          utcHour,
          utcMinute,
          0
        )
      );
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

      setNextRunIST(
        next.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
        })
      );

      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [utcHour, utcMinute]);

  return { countdown, nextRunIST };
}

// Page
export default function NewslettersPage() {
  const [activeTab, setActiveTab] = useState<
    "subscribers" | "compose" | "sent" | "test-debug"
  >("subscribers");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sentReports, setSentReports] = useState<SentReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Add subscriber
  const [newEmail, setNewEmail] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);
  const [addResult, setAddResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  // Manual triggers
  const [dailyTrigger, setDailyTrigger] = useState<TriggerState>({
    loading: false,
    result: null,
  });
  const [weeklyTrigger, setWeeklyTrigger] = useState<TriggerState>({
    loading: false,
    result: null,
  });

  // Compose state
  const [composeType, setComposeType] = useState<"daily" | "weekly">("weekly");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendResult, setSendResult] = useState<string | null>(null);

  // Daily Intelligence Report: 05:50 UTC = 11:20 AM IST
  const { countdown, nextRunIST } = useCountdown(5, 50);

  // Test & Debug state
  const [selectedTestUser, setSelectedTestUser] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [ragSettings, setRagSettings] = useState<RagContextSettings>({
    dailyPromptTemplate: "",
    weeklyPromptTemplate: "",
    contextWindowSize: 10,
    temperature: 0.4,
    maxTokens: 3500,
    enabledDataSources: {
      articles: true,
      materials: true,
      tickers: true,
      userPreferences: true,
    },
  });
  const [savingRagSettings, setSavingRagSettings] = useState(false);
  const [testGenerationLoading, setTestGenerationLoading] = useState(false);
  const [activeDebugSection, setActiveDebugSection] = useState<string | null>(null);

  const activeCount = subscribers.filter((s) => s.active).length;

  useEffect(() => {
    fetchSubscribers();
    fetchSentReports();
    fetchUsers();
    fetchRagSettings();
  }, []);

  async function fetchSubscribers() {
    try {
      const res = await fetch("/api/newsletter");
      const data = await safeJson(res);
      setSubscribers(data.subscribers || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const data = await safeJson(res);
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }

  async function fetchSentReports() {
    try {
      const res = await fetch("/api/admin/newsletter/send");
      const data = await safeJson(res);
      setSentReports(data.reports || []);
    } catch {}
  }

  async function fetchRagSettings() {
    try {
      const res = await fetch("/api/admin/newsletter/rag-settings");
      if (res.ok) {
        const data = await safeJson(res);
        if (data.settings) {
          setRagSettings(data.settings);
        }
      }
    } catch (err) {
      console.error("Failed to fetch RAG settings:", err);
    }
  }

  async function saveRagSettings() {
    setSavingRagSettings(true);
    try {
      const res = await fetch("/api/admin/newsletter/rag-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: ragSettings }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      alert("RAG settings saved successfully!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingRagSettings(false);
    }
  }

  async function handleAddEmail() {
    if (!newEmail || !newEmail.includes("@")) {
      setAddResult({ ok: false, msg: "Enter a valid email address." });
      return;
    }
    setAddingEmail(true);
    setAddResult(null);
    try {
      const res = await fetch("/api/admin/newsletter/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Failed");
      setAddResult({ ok: true, msg: data.message });
      setNewEmail("");
      fetchSubscribers();
    } catch (err: any) {
      setAddResult({ ok: false, msg: err.message });
    } finally {
      setAddingEmail(false);
    }
  }

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Remove ${email} from the subscriber list?`)) return;
    try {
      await fetch("/api/admin/newsletter/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchSubscribers();
    } catch {}
  }

  async function handleTrigger(type: "daily-report" | "weekly-report") {
    const label =
      type === "daily-report"
        ? "Daily Materials Report"
        : "Weekly Intelligence Report";
    if (
      !confirm(
        `Send the ${label} (with PDF attachment) to all ${activeCount} active subscribers now?`
      )
    )
      return;

    const setState =
      type === "daily-report" ? setDailyTrigger : setWeeklyTrigger;
    setState({ loading: true, result: null });

    try {
      const res = await fetch("/api/admin/newsletter/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Failed");
      setState({
        loading: false,
        result: {
          ok: true,
          msg: `Sent to ${data.sentCount}/${data.totalRecipients} subscribers (${data.reportType} report with PDF).`,
        },
      });
      fetchSentReports();
    } catch (err: any) {
      setState({ loading: false, result: { ok: false, msg: err.message } });
    }
  }

  const exportToCSV = () => {
    const csv = [
      ["Email", "Status", "Subscribed Date"],
      ...subscribers.map((s) => [
        s.email,
        s.active ? "Active" : "Inactive",
        new Date(s.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  async function handleGenerate() {
    setGenerating(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/newsletter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: composeType }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGeneratedSubject(data.subject);
      setGeneratedHtml(data.htmlContent);
      setShowPreview(true);
    } catch (err: any) {
      alert(err.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function handleTestGenerate() {
    setTestGenerationLoading(true);
    setDebugInfo(null);
    setGeneratedHtml("");
    setGeneratedSubject("");
    try {
      const res = await fetch("/api/admin/newsletter/test-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: composeType,
          userId: selectedTestUser || undefined,
          debug: true,
          ragSettings: ragSettings,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
      setGeneratedSubject(data.subject);
      setGeneratedHtml(data.htmlContent);
      setDebugInfo(data.debug || null);
      setShowPreview(true);
      setShowDebugPanel(true);
    } catch (err: any) {
      alert(err.message || "Failed to generate");
    } finally {
      setTestGenerationLoading(false);
    }
  }

  async function handleTestSend() {
    if (!testEmail) {
      alert("Enter a test email address");
      return;
    }
    if (!generatedHtml) {
      alert("Generate the newsletter first");
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: generatedSubject,
          htmlContent: generatedHtml,
          testEmail,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSendResult(`Test email sent to ${testEmail}!`);
      fetchSentReports();
    } catch (err: any) {
      setSendResult(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  async function handleSendAll() {
    if (!generatedHtml) {
      alert("Generate the newsletter first");
      return;
    }
    if (!confirm(`Send to all ${activeCount} active subscribers?`)) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: generatedSubject,
          htmlContent: generatedHtml,
          recipients: "all",
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSendResult(
        `Sent to ${data.sentCount}/${data.totalRecipients} recipients!`
      );
      fetchSentReports();
    } catch (err: any) {
      setSendResult(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  const tabs = [
    {
      key: "subscribers" as const,
      label: "Subscribers",
      icon: Users,
      count: subscribers.length,
    },
    { key: "compose" as const, label: "Compose & Send", icon: Sparkles },
    {
      key: "sent" as const,
      label: "Sent Reports",
      icon: FileText,
      count: sentReports.length,
    },
    {
      key: "test-debug" as const,
      label: "Test & Debug",
      icon: Bug,
    },
  ];

  const selectedUserData = users.find((u) => u.id === selectedTestUser);
  const selectedSubscriberData = subscribers.find(
    (s) => s.email === selectedUserData?.email
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Mail className="w-8 h-8 text-purple-400" />
          Newsletter Management
        </h1>
        <p className="mt-2 text-gray-400">
          Daily Materials & Weekly Intelligence reports with PDF attachments
        </p>
      </div>

      {/* Scheduler Panel */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <Timer className="w-5 h-5 text-geo-gold" />
          <h2 className="font-semibold text-white">Scheduler</h2>
          <span className="text-xs text-gray-500">
            Auto-dispatch status & manual controls
          </span>
        </div>

        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Daily Materials Report */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">
                Daily Materials Report
              </span>
              <span className="ml-auto text-[10px] bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full font-medium tracking-wide">
                AUTO + PDF
              </span>
            </div>

            <div className="flex items-end gap-8">
              <div>
                <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">
                  Next Run (IST)
                </div>
                <div className="text-base font-bold text-white">
                  {nextRunIST || "11:20 AM"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">
                  Countdown
                </div>
                <div className="text-2xl font-mono font-bold text-geo-gold tracking-widest tabular-nums">
                  {countdown}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Focus: Critical materials, supply chains, geopolitical exposure.
              Sent as PDF attachment.
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Fires at 05:50 UTC (11:20 AM IST) every day automatically
            </div>

            <button
              onClick={() => handleTrigger("daily-report")}
              disabled={dailyTrigger.loading || activeCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-all disabled:opacity-40"
            >
              {dailyTrigger.loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating & Sending...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Send Now (PDF) &middot; {activeCount} subscriber
                  {activeCount !== 1 ? "s" : ""}
                </>
              )}
            </button>

            {dailyTrigger.result && (
              <div
                className={`text-xs px-3 py-2 rounded-lg ${dailyTrigger.result.ok ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
              >
                {dailyTrigger.result.msg}
              </div>
            )}
          </div>

          {/* Weekly Intelligence Report */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">
                Weekly Intelligence Report
              </span>
              <span className="ml-auto text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-medium tracking-wide">
                AUTO + PDF
              </span>
            </div>

            <div className="flex items-end gap-8">
              <div>
                <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">
                  Format
                </div>
                <div className="text-base font-bold text-white">
                  Full Intelligence Report
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">
                  Last Sent
                </div>
                <div className="text-sm font-medium text-gray-300">
                  {sentReports.find((r) => r.reportType === "weekly")
                    ? new Date(
                        sentReports.find((r) => r.reportType === "weekly")!
                          .sentAt
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : sentReports[0]
                      ? new Date(sentReports[0].sentAt).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )
                      : "Never"}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Full thesis, scenario outlook, transmission maps,
              compliance-checked. Sent as PDF attachment.
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              Fires every Monday at 06:00 UTC (11:30 AM IST). Use "Compose
              & Send" for preview.
            </div>

            <button
              onClick={() => handleTrigger("weekly-report")}
              disabled={weeklyTrigger.loading || activeCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-all disabled:opacity-40"
            >
              {weeklyTrigger.loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating & Sending...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Send Now (PDF) &middot; {activeCount} subscriber
                  {activeCount !== 1 ? "s" : ""}
                </>
              )}
            </button>

            {weeklyTrigger.result && (
              <div
                className={`text-xs px-3 py-2 rounded-lg ${weeklyTrigger.result.ok ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
              >
                {weeklyTrigger.result.msg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-purple-400 text-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Subscribers Tab */}
      {activeTab === "subscribers" && (
        <div className="space-y-6">
          {/* Add subscriber */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-geo-gold" />
              Add Subscriber
            </h3>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="name@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50 transition-colors"
              />
              <button
                onClick={handleAddEmail}
                disabled={addingEmail}
                className="flex items-center gap-2 px-5 py-2.5 bg-geo-gold/20 hover:bg-geo-gold/30 border border-geo-gold/30 rounded-lg text-geo-gold text-sm font-medium transition-all disabled:opacity-40"
              >
                {addingEmail ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add
              </button>
            </div>
            {addResult && (
              <p
                className={`mt-2.5 text-xs ${addResult.ok ? "text-green-400" : "text-red-400"}`}
              >
                {addResult.msg}
              </p>
            )}
          </div>

          {/* List controls */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {activeCount} active / {subscribers.length} total
            </p>
            {subscribers.length > 0 && (
              <button
                onClick={exportToCSV}
                className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10 transition-colors"
              >
                Export CSV
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-white/5 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : subscribers.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Subscribed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                      Remove
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/5">
                  {subscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-white/10 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-white">
                        {sub.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${sub.active ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"}`}
                        >
                          {sub.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(sub.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemove(sub.id, sub.email)}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded"
                          title="Remove subscriber"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No subscribers yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Add the first subscriber using the form above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === "compose" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white mb-2">
              Generate AI Report
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Choose a report type then generate. Both use the compliance engine
              and can be sent as PDF attachments.
            </p>

            {/* Report type selector */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setComposeType("daily")}
                className={`flex-1 rounded-lg border p-4 text-left transition-all ${composeType === "daily" ? "border-purple-500/50 bg-purple-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">
                    Daily Materials Report
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Critical materials focus, supply chain analysis, geopolitical
                  exposure
                </p>
              </button>
              <button
                onClick={() => setComposeType("weekly")}
                className={`flex-1 rounded-lg border p-4 text-left transition-all ${composeType === "weekly" ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white">
                    Weekly Intelligence Report
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Full thesis, scenario outlook, transmission maps, market
                  snapshot
                </p>
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-colors disabled:opacity-50 ${composeType === "daily" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating {composeType === "daily" ? "Daily" : "Weekly"}{" "}
                  Report...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate{" "}
                  {composeType === "daily"
                    ? "Daily Materials"
                    : "Weekly Intelligence"}{" "}
                  Report
                </>
              )}
            </button>
          </div>

          {generatedHtml && (
            <>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-white">
                    Generated Report
                  </h2>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>
                <div className="rounded-md bg-black/30 border border-white/10 p-3 mb-4">
                  <p className="text-sm text-gray-400">Subject:</p>
                  <p className="text-white font-medium">{generatedSubject}</p>
                </div>
                {showPreview && (
                  <div className="rounded-lg border border-white/10 overflow-hidden max-h-[600px] overflow-y-auto">
                    <iframe
                      srcDoc={generatedHtml}
                      className="w-full min-h-[500px]"
                      title="Report Preview"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6">
                <h2 className="text-lg font-medium text-yellow-400 mb-4">
                  Send Report
                </h2>

                <div className="mb-4 p-4 rounded-lg bg-black/30 border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3">
                    Test Send
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="Enter test email address"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:outline-none"
                    />
                    <button
                      onClick={handleTestSend}
                      disabled={sending || !testEmail}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? "Sending..." : "Send Test"}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3">
                    Send to All Subscribers
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    This will send the generated report to all {activeCount}{" "}
                    active subscribers.
                  </p>
                  <button
                    onClick={handleSendAll}
                    disabled={sending || activeCount === 0}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending
                      ? "Sending..."
                      : `Send to ${activeCount} Subscribers`}
                  </button>
                </div>

                {sendResult && (
                  <div
                    className={`mt-4 p-3 rounded-lg text-sm ${sendResult.startsWith("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}
                  >
                    {sendResult}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Test & Debug Tab */}
      {activeTab === "test-debug" && (
        <div className="space-y-6">
          {/* User Selection */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCircle className="w-5 h-5 text-geo-gold" />
              <h2 className="text-lg font-medium text-white">
                Test User Selection
              </h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Select a registered user to test personalized newsletter generation. 
              This will use their preferences and tracked materials for the RAG context.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Select User
                </label>
                <select
                  value={selectedTestUser}
                  onChange={(e) => setSelectedTestUser(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2.5 text-white focus:outline-none focus:border-geo-gold/50"
                >
                  <option value="">-- Select a user --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Report Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setComposeType("daily")}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      composeType === "daily"
                        ? "border-purple-500/50 bg-purple-500/20 text-purple-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    Daily Materials
                  </button>
                  <button
                    onClick={() => setComposeType("weekly")}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      composeType === "weekly"
                        ? "border-blue-500/50 bg-blue-500/20 text-blue-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    Weekly Intelligence
                  </button>
                </div>
              </div>
            </div>

            {/* Selected User Info */}
            {selectedUserData && (
              <div className="mt-4 p-4 rounded-lg bg-black/30 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">
                    Selected User Details
                  </span>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    <span className="text-white">{selectedUserData.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{" "}
                    <span className="text-white">{selectedUserData.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Subscriber:</span>{" "}
                    <span className={selectedSubscriberData ? "text-green-400" : "text-yellow-400"}>
                      {selectedSubscriberData ? "Yes" : "Not subscribed"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RAG Context Settings */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-geo-gold" />
                <h2 className="text-lg font-medium text-white">
                  RAG Context Settings
                </h2>
              </div>
              <button
                onClick={saveRagSettings}
                disabled={savingRagSettings}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-400 text-sm font-medium transition-all disabled:opacity-40"
              >
                {savingRagSettings ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Save Settings
              </button>
            </div>

            {/* Data Sources Toggles */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Enabled Data Sources for RAG Context
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "articles", label: "Articles", icon: FileText },
                  { key: "materials", label: "Materials", icon: Database },
                  { key: "tickers", label: "Market Tickers", icon: Terminal },
                  { key: "userPreferences", label: "User Preferences", icon: UserCircle },
                ].map((source) => (
                  <button
                    key={source.key}
                    onClick={() =>
                      setRagSettings((prev) => ({
                        ...prev,
                        enabledDataSources: {
                          ...prev.enabledDataSources,
                          [source.key]: !prev.enabledDataSources[source.key as keyof typeof prev.enabledDataSources],
                        },
                      }))
                    }
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      ragSettings.enabledDataSources[source.key as keyof typeof ragSettings.enabledDataSources]
                        ? "border-green-500/50 bg-green-500/10 text-green-400"
                        : "border-white/10 bg-white/5 text-gray-500 hover:bg-white/10"
                    }`}
                  >
                    <source.icon className="w-4 h-4" />
                    {source.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Parameters */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Temperature ({ragSettings.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={ragSettings.temperature}
                  onChange={(e) =>
                    setRagSettings((prev) => ({
                      ...prev,
                      temperature: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-geo-gold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower = more deterministic, Higher = more creative
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={ragSettings.maxTokens}
                  onChange={(e) =>
                    setRagSettings((prev) => ({
                      ...prev,
                      maxTokens: parseInt(e.target.value) || 3500,
                    }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white focus:outline-none focus:border-geo-gold/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Context Window (articles)
                </label>
                <input
                  type="number"
                  value={ragSettings.contextWindowSize}
                  onChange={(e) =>
                    setRagSettings((prev) => ({
                      ...prev,
                      contextWindowSize: parseInt(e.target.value) || 10,
                    }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white focus:outline-none focus:border-geo-gold/50"
                />
              </div>
            </div>

            {/* Prompt Templates */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Daily Report Prompt Template
                </label>
                <textarea
                  value={ragSettings.dailyPromptTemplate}
                  onChange={(e) =>
                    setRagSettings((prev) => ({
                      ...prev,
                      dailyPromptTemplate: e.target.value,
                    }))
                  }
                  placeholder="Leave empty to use default prompt..."
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Weekly Report Prompt Template
                </label>
                <textarea
                  value={ragSettings.weeklyPromptTemplate}
                  onChange={(e) =>
                    setRagSettings((prev) => ({
                      ...prev,
                      weeklyPromptTemplate: e.target.value,
                    }))
                  }
                  placeholder="Leave empty to use default prompt..."
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Test Generation */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-geo-gold" />
              <h2 className="text-lg font-medium text-white">
                Test Generation
              </h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Generate a test newsletter with debug information. This will show you 
              the raw prompt, data context, and AI response for debugging purposes.
            </p>
            <button
              onClick={handleTestGenerate}
              disabled={testGenerationLoading}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-colors disabled:opacity-50 ${
                composeType === "daily" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {testGenerationLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating with Debug...
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4" />
                  Generate Test with Debug Info
                </>
              )}
            </button>
          </div>

          {/* Debug Panel */}
          {showDebugPanel && debugInfo && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-medium text-yellow-400">
                    Debug Information
                  </h2>
                </div>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>

              {/* Data Context Summary */}
              {debugInfo.dataContext && (
                <div className="mb-4 p-4 rounded-lg bg-black/30 border border-white/10">
                  <button
                    onClick={() => setActiveDebugSection(activeDebugSection === "context" ? null : "context")}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">
                        Data Context Summary
                      </span>
                    </div>
                    {activeDebugSection === "context" ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {activeDebugSection === "context" && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="p-2 rounded bg-white/5">
                        <span className="text-gray-500">Articles:</span>{" "}
                        <span className="text-white font-mono">{debugInfo.dataContext.articlesCount}</span>
                      </div>
                      <div className="p-2 rounded bg-white/5">
                        <span className="text-gray-500">Materials:</span>{" "}
                        <span className="text-white font-mono">{debugInfo.dataContext.materialsCount}</span>
                      </div>
                      <div className="p-2 rounded bg-white/5">
                        <span className="text-gray-500">Tickers:</span>{" "}
                        <span className="text-white font-mono">{debugInfo.dataContext.tickersCount}</span>
                      </div>
                      <div className="p-2 rounded bg-white/5">
                        <span className="text-gray-500">Generation Time:</span>{" "}
                        <span className="text-white font-mono">{debugInfo.generationTime}ms</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Prompt */}
              {debugInfo.prompt && (
                <div className="mb-4">
                  <button
                    onClick={() => setActiveDebugSection(activeDebugSection === "prompt" ? null : "prompt")}
                    className="flex items-center justify-between w-full p-4 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">
                        View Raw Prompt
                      </span>
                    </div>
                    {activeDebugSection === "prompt" ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {activeDebugSection === "prompt" && (
                    <div className="mt-2 p-4 rounded-lg bg-black/50 border border-white/10 overflow-auto max-h-[400px]">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {debugInfo.prompt}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Response */}
              {debugInfo.rawResponse && (
                <div className="mb-4">
                  <button
                    onClick={() => setActiveDebugSection(activeDebugSection === "response" ? null : "response")}
                    className="flex items-center justify-between w-full p-4 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">
                        View AI Raw Response
                      </span>
                    </div>
                    {activeDebugSection === "response" ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {activeDebugSection === "response" && (
                    <div className="mt-2 p-4 rounded-lg bg-black/50 border border-white/10 overflow-auto max-h-[400px]">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {debugInfo.rawResponse}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Data */}
              {debugInfo.parsedData && (
                <div className="mb-4">
                  <button
                    onClick={() => setActiveDebugSection(activeDebugSection === "parsed" ? null : "parsed")}
                    className="flex items-center justify-between w-full p-4 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-white">
                        View Parsed Data
                      </span>
                    </div>
                    {activeDebugSection === "parsed" ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {activeDebugSection === "parsed" && (
                    <div className="mt-2 p-4 rounded-lg bg-black/50 border border-white/10 overflow-auto max-h-[400px]">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(debugInfo.parsedData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Errors */}
              {debugInfo.errors && debugInfo.errors.length > 0 && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      Errors During Generation
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {debugInfo.errors.map((error, idx) => (
                      <li key={idx} className="text-xs text-red-300 font-mono">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Generated Preview */}
          {generatedHtml && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white">
                  Generated Preview
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>
              </div>
              <div className="rounded-md bg-black/30 border border-white/10 p-3 mb-4">
                <p className="text-sm text-gray-400">Subject:</p>
                <p className="text-white font-medium">{generatedSubject}</p>
              </div>
              {showPreview && (
                <div className="rounded-lg border border-white/10 overflow-hidden max-h-[600px] overflow-y-auto">
                  <iframe
                    srcDoc={generatedHtml}
                    className="w-full min-h-[500px]"
                    title="Test Report Preview"
                  />
                </div>
              )}

              {/* Manual Send Section */}
              <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <h3 className="text-sm font-medium text-yellow-400 mb-3">
                  Send Test Email
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="Enter test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    onClick={handleTestSend}
                    disabled={sending || !testEmail}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? "Sending..." : "Send Test"}
                  </button>
                </div>
                {sendResult && (
                  <div
                    className={`mt-3 p-2 rounded-lg text-sm ${
                      sendResult.startsWith("Error")
                        ? "bg-red-500/10 text-red-400"
                        : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    {sendResult}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sent Reports Tab */}
      {activeTab === "sent" && (
        <div>
          {sentReports.length > 0 ? (
            <div className="space-y-4">
              {sentReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">
                        {report.subject}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {report.sentCount} recipients
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(report.sentAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.reportType && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${report.reportType === "daily" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}
                        >
                          {report.reportType === "daily" ? "Daily" : "Weekly"}
                        </span>
                      )}
                      <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400 font-medium">
                        Sent
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No reports sent yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Use the Scheduler above or "Compose & Send" tab.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
