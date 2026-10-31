"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, Sparkles, CheckCircle2 } from "lucide-react";
import WaitlistModal from "@/components/WaitlistModal";
import { WAITLIST_LAUNCH_MESSAGE } from "@/lib/waitlist";

const AUTH_BACKEND_UNAVAILABLE_ERROR = "AUTH_BACKEND_UNAVAILABLE";

function getSignInErrorMessage(error: string) {
  if (error === "CredentialsSignin") {
    return "Invalid email or password";
  }

  if (error === AUTH_BACKEND_UNAVAILABLE_ERROR) {
    return "Login service is temporarily unavailable. Please verify database connectivity and try again.";
  }

  return "Something went wrong";
}

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [justRegistered, setJustRegistered] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setJustRegistered(true);
      }
      if (params.get("waitlist") === "joined") {
        setWaitlistJoined(true);
      }
    }

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.logoUrl) setLogoUrl(data.logoUrl);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError(getSignInErrorMessage(result.error));
      } else if (result?.ok) {
        const session = await getSession();
        if ((session?.user as any)?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
        router.refresh();
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-geo-dark px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="GeoMoney"
              className="mx-auto h-20 w-auto object-contain"
            />
          ) : (
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600" />
          )}
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Sign in to GeoMoney
          </h2>
          <p className="mt-2 text-sm text-gray-400">Access your account</p>
        </div>

        {justRegistered && (
          <div className="rounded-xl border border-geo-gold/30 bg-gradient-to-br from-amber-500/15 via-geo-gold/10 to-transparent p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Account created successfully! Please sign in below.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-geo-gold shrink-0 mt-0.5" />
              <p className="text-xs text-gray-200 leading-relaxed">
                {WAITLIST_LAUNCH_MESSAGE}
              </p>
            </div>
            {waitlistJoined ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-xs font-medium text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                You're on the GeoMoney Basic waitlist
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsWaitlistOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-geo-gold px-4 py-2 text-xs font-bold text-black hover:bg-yellow-500 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" />
                Join GeoMoney Basic Waitlist
              </button>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-geo-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-geo-gold focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <a
              href="/auth/register"
              className="font-medium text-geo-gold hover:text-yellow-500"
            >
              Register here
            </a>
          </div>
        </form>
      </div>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        defaultEmail={email}
        source="signin_registered_banner"
        onSuccess={() => setWaitlistJoined(true)}
      />
    </div>
  );
}