'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw } from 'lucide-react'

export default function HomepageAdminPage() {
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [newsletterTitle, setNewsletterTitle] = useState('')
  const [newsletterSubtitle, setNewsletterSubtitle] = useState('')
  const [partnerLogos, setPartnerLogos] = useState('')
  const [footerText, setFooterText] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/homepage')
      const data = await res.json()
      setHeroTitle(data.heroTitle || '')
      setHeroSubtitle(data.heroSubtitle || '')
      setNewsletterTitle(data.newsletterTitle || '')
      setNewsletterSubtitle(data.newsletterSubtitle || '')
      setPartnerLogos(data.partnerLogos || '')
      setFooterText(data.footerText || '')
    } catch (error) {
      console.error('Error fetching homepage settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroTitle, heroSubtitle, newsletterTitle, newsletterSubtitle, partnerLogos, footerText }),
      })
      if (!res.ok) throw new Error('Failed to save')
      alert('Homepage settings saved successfully!')
    } catch (error) {
      console.error(error)
      alert('Failed to save homepage settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-white">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Homepage Configuration</h1>
          <p className="mt-2 text-gray-400">Configure content displayed on the main homepage</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Hero Section */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Hero Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Hero Title</label>
            <input type="text" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="e.g., Geopolitical Intelligence for Smart Money"
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
            <p className="mt-1 text-xs text-gray-500">Leave empty to use the default title</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Hero Subtitle</label>
            <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="e.g., Real-time analysis across commodities, currencies, and critical materials"
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Newsletter Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Newsletter Title</label>
            <input type="text" value={newsletterTitle} onChange={(e) => setNewsletterTitle(e.target.value)}
              placeholder="e.g., Join 120,000+ Professionals Worldwide"
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Newsletter Subtitle</label>
            <input type="text" value={newsletterSubtitle} onChange={(e) => setNewsletterSubtitle(e.target.value)}
              placeholder="e.g., Get the GeoMoney Weekly Intelligence Brief"
              className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
          </div>
        </div>
      </div>

      {/* Partner Logos */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Partner Logos</h2>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Partner Names (comma-separated)</label>
          <input type="text" value={partnerLogos} onChange={(e) => setPartnerLogos(e.target.value)}
            placeholder="e.g., Bloomberg, PwC, ThinkMarkets"
            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
          <p className="mt-1 text-xs text-gray-500">These appear as text logos on the newsletter section</p>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white mb-4">Footer</h2>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Footer Text</label>
          <input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)}
            placeholder="e.g., © 2025 GeoMoney TV. All rights reserved."
            className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500" />
        </div>
      </div>
    </div>
  )
}
