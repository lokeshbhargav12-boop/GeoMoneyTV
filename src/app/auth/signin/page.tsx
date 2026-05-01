"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AUTH_BACKEND_UNAVAILABLE_ERROR = "AUTH_BACKEND_UNAVAILABLE";

function getSignInErrorMessage(error: string) {
  if (error === "CredentialsSignin") {
    return "Invalid email or password";
  }

  if (error === AUTH_BACKEND_UNAVAILABLE_ERROR) {
    return "Local login cannot reach MySQL. Add this machine's public IP to Hostinger Remote MySQL, then try again.";
  }

  return "Something went wrong";
}

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.logoUrl) setLogoUrl(data.logoUrl);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(getSignInErrorMessage(result.error));
      } else {
        const session = await getSession();
        if ((session?.user as any)?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-geo-dark px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="GeoMoney TV"
              className="mx-auto h-20 w-auto object-contain"
            />
          ) : (
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600" />
          )}
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Sign in to GeoMoney TV
          </h2>
          <p className="mt-2 text-sm text-gray-400">Access your account</p>
        </div>

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
    </div>
  );
}
