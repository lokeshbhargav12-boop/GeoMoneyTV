"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";

interface ProfileDetailsData {
  id: string;
  name: string | null;
  phone: string | null;
  email: string;
}

export default function ProfileDetails() {
  const { update } = useSession();
  const [profile, setProfile] = useState<ProfileDetailsData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/profile", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile details");

      setProfile(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const startEditing = () => {
    if (!profile) return;
    setName(profile.name || "");
    setPhone(profile.phone || "");
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile details");

      setProfile(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
      setEditing(false);
      setSuccess(data.message || "Profile details updated.");

      // Keep the name shown in the profile header and navigation in sync.
      // The database update has already succeeded, so a session-refresh failure
      // should not incorrectly report that saving the profile failed.
      try {
        await update({ user: { name: data.user.name } });
      } catch {
        // The fresh name will be picked up on the next sign-in/session refresh.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <UserRound className="h-5 w-5 text-geo-gold" />
          <div>
            <h2 className="text-lg font-semibold">Basic Details</h2>
            <p className="mt-0.5 text-xs text-gray-500">Your personal contact information</p>
          </div>
        </div>
        {profile && !editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-gray-300 transition-colors hover:border-geo-gold/40 hover:text-geo-gold"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Details
          </button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-8 text-sm text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin text-geo-gold" />
            Loading your details...
          </div>
        ) : !profile ? (
          <div className="py-4 text-center">
            <p className="text-sm text-red-400">{error || "Profile details are unavailable."}</p>
            <button
              type="button"
              onClick={loadProfile}
              className="mt-3 text-sm font-medium text-geo-gold hover:text-yellow-500"
            >
              Try again
            </button>
          </div>
        ) : editing ? (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-xs font-medium text-gray-400">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="profile-phone" className="mb-1.5 block text-xs font-medium text-gray-400">
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={32}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="profile-email" className="mb-1.5 block text-xs font-medium text-gray-400">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  readOnly
                  aria-readonly="true"
                  className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-gray-400"
                />
                <p className="mt-1.5 text-xs text-gray-500">This email is used to sign in and cannot be changed here.</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                  setName(profile.name || "");
                  setPhone(profile.phone || "");
                }}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-geo-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Details"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <UserRound className="h-3.5 w-3.5 text-geo-gold" />
                  Full Name
                </dt>
                <dd className="mt-2 break-words text-sm font-medium text-white">{profile.name || "Not provided"}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <Phone className="h-3.5 w-3.5 text-geo-gold" />
                  Phone Number
                </dt>
                <dd className="mt-2 break-words text-sm font-medium text-white">{profile.phone || "Not provided"}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <Mail className="h-3.5 w-3.5 text-geo-gold" />
                  Email Address
                </dt>
                <dd className="mt-2 break-all text-sm font-medium text-white">{profile.email}</dd>
              </div>
            </dl>
            {!profile.phone && (
              <button
                type="button"
                onClick={startEditing}
                className="mt-4 text-xs font-medium text-geo-gold hover:text-yellow-500"
              >
                Add your phone number to complete your profile →
              </button>
            )}
          </>
        )}

        {success && !editing && (
          <p className="mt-4 flex items-center gap-2 text-sm text-green-400" role="status">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </p>
        )}
      </div>
    </section>
  );
}
