'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { WAITLIST_LAUNCH_MESSAGE } from '@/lib/waitlist'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Post-registration waitlist state
  const [registered, setRegistered] = useState(false)
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'joined' | 'error'>('idle')
  const [waitlistMessage, setWaitlistMessage] = useState('')

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setRegistered(true)
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setWaitlistStatus('loading')
    setWaitlistMessage('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          source: 'account_registration',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setWaitlistStatus('joined')
        setWaitlistMessage('You are now on the GeoMoney Basic waitlist! Priority access upon launch has been reserved.')
      } else {
        setWaitlistStatus('error')
        setWaitlistMessage(data.error || 'Failed to join waitlist')
      }
    } catch {
      setWaitlistStatus('error')
      setWaitlistMessage('Something went wrong. Please try again.')
    }
  }

  if (registered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-geo-dark px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-geo-gold/30 bg-black/80 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 border border-green-500/30">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-geo-gold/10 border border-geo-gold/30 px-3.5 py-1 text-xs font-semibold text-geo-gold">
              <Crown className="w-3.5 h-3.5" />
              Account Created Successfully
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome to GeoMoney, {name || 'Member'}!
            </h2>
          </div>

          {/* Launch & Waitlist Announcement Box */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-geo-gold/10 to-transparent p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-geo-gold shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                {WAITLIST_LAUNCH_MESSAGE}
              </p>
            </div>
          </div>

          {waitlistStatus !== 'joined' ? (
            <form onSubmit={handleJoinWaitlist} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="waitlist-name" className="block text-xs font-medium text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    id="waitlist-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                  />
                </div>
                <div>
                  <label htmlFor="waitlist-email" className="block text-xs font-medium text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                  />
                </div>
              </div>

              {waitlistMessage && waitlistStatus === 'error' && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 text-center">
                  {waitlistMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={waitlistStatus === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-geo-gold to-yellow-500 px-6 py-3.5 text-sm font-bold text-black hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Crown className="w-4 h-4" />
                {waitlistStatus === 'loading' ? 'Joining GeoMoney Basic Waitlist...' : 'Join the Waitlist for GeoMoney Basic'}
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Priority Access Reserved!</span>
              </div>
              <p className="text-xs text-gray-300">{waitlistMessage}</p>
            </div>
          )}

          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(
                  waitlistStatus === 'joined'
                    ? '/auth/signin?registered=true&waitlist=joined'
                    : '/auth/signin?registered=true'
                )
              }
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <span>Continue to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-geo-dark px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-geo-gold to-yellow-600" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Join GeoMoney
          </p>
        </div>

        {/* Pre-Launch Waitlist Notice */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-geo-gold shrink-0 mt-0.5" />
            <p className="text-xs text-gray-200 leading-relaxed">
              {WAITLIST_LAUNCH_MESSAGE}
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-gray-500 focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-geo-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-geo-gold focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <a href="/auth/signin" className="font-medium text-geo-gold hover:text-yellow-500">
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}