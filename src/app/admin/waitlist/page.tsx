"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Crown,
  Users,
  UserCheck,
  Search,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { WAITLIST_LAUNCH_MESSAGE } from "@/lib/waitlist";

interface WaitlistEntry {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  source: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  hasAccount: boolean;
  userId: string | null;
  userRole: string | null;
}

function formatSourceLabel(source: string): string {
  switch (source) {
    case "account_registration":
      return "Account Registration";
    case "signin_registered_banner":
      return "Post-Registration Sign In";
    case "user_profile":
      return "User Profile";
    case "homepage_waitlist_section":
      return "Homepage Waitlist";
    case "waitlist_modal":
      return "Waitlist Modal";
    case "admin":
      return "Admin Added";
    default:
      if (source.startsWith("pricing_")) return "Pricing Page";
      if (source.startsWith("membership_")) return "Membership Page";
      if (source === "payment_page") return "Checkout Page";
      return "Waitlist";
  }
}

export default function AdminWaitlistPage() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "registered" | "guest">(
    "all"
  );

  // Add member form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/waitlist");
      if (!res.ok) throw new Error("Failed to load waitlist");
      const data = await res.json();
      setWaitlist(data.waitlist || []);
    } catch (err: any) {
      setError(err.message || "Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setAddFeedback({ ok: false, msg: "Please enter a valid email address." });
      return;
    }

    setAdding(true);
    setAddFeedback(null);
    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setAddFeedback({ ok: true, msg: data.message || "Added to waitlist!" });
      setNewName("");
      setNewEmail("");
      fetchWaitlist();
    } catch (err: any) {
      setAddFeedback({ ok: false, msg: err.message || "Failed to add member" });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from the GeoMoney Basic waitlist?`)) return;

    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to remove entry");
      setWaitlist((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to remove entry");
    }
  };

  const exportCSV = () => {
    const escapeCsv = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = [
      ["Name", "Email", "Account Status", "Source", "Status", "Joined Date"],
      ...filteredWaitlist.map((entry) => [
        escapeCsv(entry.name || "N/A"),
        escapeCsv(entry.email),
        entry.hasAccount ? "Registered User" : "Waitlist Guest",
        escapeCsv(formatSourceLabel(entry.source)),
        entry.active ? "Active" : "Inactive",
        escapeCsv(new Date(entry.joinedAt).toLocaleString()),
      ]),
    ];

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `geomoney-basic-waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredWaitlist = useMemo(() => {
    return waitlist.filter((entry) => {
      if (filterType === "registered" && !entry.hasAccount) return false;
      if (filterType === "guest" && entry.hasAccount) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        entry.email.toLowerCase().includes(q) ||
        (entry.name && entry.name.toLowerCase().includes(q)) ||
        formatSourceLabel(entry.source).toLowerCase().includes(q)
      );
    });
  }, [waitlist, filterType, searchQuery]);

  const registeredCount = waitlist.filter((w) => w.hasAccount).length;
  const guestCount = waitlist.length - registeredCount;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <Crown className="w-8 h-8 text-geo-gold" />
            GeoMoney Basic Waitlist
          </h1>
          <p className="mt-1 text-gray-400 text-sm">
            Manage users who joined the waitlist for priority access upon launch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchWaitlist}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {waitlist.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-lg bg-geo-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Active Launch Notice Banner */}
      <div className="rounded-xl border border-geo-gold/30 bg-geo-gold/5 p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-geo-gold shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-geo-gold mb-1">
            Active Waitlist Prompt Shown to New Accounts
          </div>
          <p className="text-sm text-gray-200">{WAITLIST_LAUNCH_MESSAGE}</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Waitlist Members</span>
            <Crown className="w-5 h-5 text-geo-gold" />
          </div>
          <div className="text-3xl font-bold text-white">
            {loading ? "..." : waitlist.length.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Registered Accounts</span>
            <UserCheck className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {loading ? "..." : registeredCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Public Waitlist Signups</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {loading ? "..." : guestCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Add to Waitlist Form */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-geo-gold" />
          Add Person to GeoMoney Basic Waitlist
        </h2>
        <form
          onSubmit={handleAddMember}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            placeholder="Full Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="sm:w-64 rounded-lg border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50"
          />
          <input
            type="email"
            placeholder="email@example.com"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50"
          />
          <button
            type="submit"
            disabled={adding}
            className="flex items-center justify-center gap-2 rounded-lg bg-geo-gold/20 hover:bg-geo-gold/30 border border-geo-gold/30 px-5 py-2.5 text-sm font-semibold text-geo-gold transition-all disabled:opacity-50"
          >
            {adding ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add to Waitlist
          </button>
        </form>
        {addFeedback && (
          <p
            className={`mt-2.5 text-xs ${
              addFeedback.ok ? "text-green-400" : "text-red-400"
            }`}
          >
            {addFeedback.msg}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(
            [
              { key: "all", label: `All (${waitlist.length})` },
              {
                key: "registered",
                label: `Registered Users (${registeredCount})`,
              },
              { key: "guest", label: `Guests (${guestCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                filterType === tab.key
                  ? "bg-geo-gold text-black font-semibold"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50"
          />
        </div>
      </div>

      {/* Waitlist Table */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : filteredWaitlist.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/30">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  #
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Email
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Account
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Source
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Joined
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredWaitlist.map((entry, idx) => (
                <tr
                  key={entry.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {entry.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      {entry.email}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {entry.hasAccount ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/30 px-2.5 py-0.5 text-xs font-medium text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Registered User
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300">
                        Waitlist Guest
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                    {formatSourceLabel(entry.source)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-geo-gold/15 border border-geo-gold/30 px-2.5 py-0.5 text-xs font-medium text-geo-gold">
                      <Crown className="w-3 h-3" />
                      Priority Access
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(entry.joinedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleRemove(entry.id, entry.email)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded"
                      title="Remove from waitlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Crown className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-300 font-medium">
            No waitlist members found.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Users who join the GeoMoney Basic waitlist will appear here.
          </p>
        </div>
      )}
    </div>
  );
}