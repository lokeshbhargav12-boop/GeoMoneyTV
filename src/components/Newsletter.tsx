'use client'

import { useState } from 'react'

export default function Newsletter() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Successfully subscribed!')
        setName('')
        setPhone('')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to subscribe')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong')
    }
  }

  const inputClass = 'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold disabled:opacity-50'

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-geo-dark px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-geo-dark to-geo-dark" />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Subscribe to The GeoMoney Brief
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Weekly intelligence on energy, resources, markets, and global power.
        </p>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="text-left">
            <label htmlFor="newsletter-name" className="sr-only">Full name</label>
            <input
              id="newsletter-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              disabled={status === 'loading'}
              maxLength={100}
              required
            />
          </div>
          <div className="text-left">
            <label htmlFor="newsletter-phone" className="sr-only">Phone number</label>
            <input
              id="newsletter-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Phone number (with country code)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              disabled={status === 'loading'}
              maxLength={32}
              required
            />
          </div>
          <div className="text-left sm:col-span-2">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              disabled={status === 'loading'}
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:col-span-2"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe Now'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 ${
              status === 'success'
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            }`}
            role="status"
          >
            {message}
          </div>
        )}
      </div>
    </section>
  )
}
