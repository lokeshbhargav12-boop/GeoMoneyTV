'use client'

import { useState } from 'react'

export default function Newsletter() {
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
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Successfully subscribed!')
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
        
        <form className="mt-8 flex flex-col gap-4 sm:flex-row" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm focus:border-geo-gold focus:outline-none focus:ring-1 focus:ring-geo-gold"
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
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
          >
            {message}
          </div>
        )}
        

      </div>
    </section>
  );
}
