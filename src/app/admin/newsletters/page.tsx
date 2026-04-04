'use client'

import { useEffect, useState } from 'react'
import { Mail, Send, Eye, RefreshCw, Sparkles, FileText, Users, Clock } from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  active: boolean
  createdAt: string
}

interface SentReport {
  id: string
  subject: string
  sentCount: number
  sentAt: string
}

export default function NewslettersPage() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'compose' | 'sent'>('subscribers')
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [sentReports, setSentReports] = useState<SentReport[]>([])
  const [loading, setLoading] = useState(true)

  // Compose state
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [generatedSubject, setGeneratedSubject] = useState('')
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendResult, setSendResult] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscribers()
    fetchSentReports()
  }, [])

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/newsletter')
      const data = await response.json()
      setSubscribers(data.subscribers || [])
    } catch (error) {
      console.error('Error fetching subscribers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSentReports = async () => {
    try {
      const response = await fetch('/api/admin/newsletter/send')
      const data = await response.json()
      setSentReports(data.reports || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const exportToCSV = () => {
    const csv = [
      ['Email', 'Status', 'Subscribed Date'],
      ...subscribers.map((sub) => [
        sub.email,
        sub.active ? 'Active' : 'Inactive',
        new Date(sub.createdAt).toLocaleDateString(),
      ]),
    ].map((row) => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setGeneratedSubject(data.subject)
      setGeneratedHtml(data.htmlContent)
      setShowPreview(true)
    } catch (error: any) {
      alert(error.message || 'Failed to generate newsletter')
    } finally {
      setGenerating(false)
    }
  }

  const handleTestSend = async () => {
    if (!testEmail) { alert('Please enter a test email address'); return }
    if (!generatedHtml) { alert('Please generate the newsletter first'); return }
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: generatedSubject, htmlContent: generatedHtml, testEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setSendResult(`✅ Test email sent to ${testEmail} successfully!`)
      fetchSentReports()
    } catch (error: any) {
      setSendResult(`❌ ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const handleSendAll = async () => {
    if (!generatedHtml) { alert('Please generate the newsletter first'); return }
    const activeCount = subscribers.filter(s => s.active).length
    if (!confirm(`Send this newsletter to all ${activeCount} active subscribers?`)) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: generatedSubject, htmlContent: generatedHtml, recipients: 'all' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setSendResult(`✅ Newsletter sent to ${data.sentCount}/${data.totalRecipients} recipients!`)
      fetchSentReports()
    } catch (error: any) {
      setSendResult(`❌ ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const tabs = [
    { key: 'subscribers' as const, label: 'Subscribers', icon: Users, count: subscribers.length },
    { key: 'compose' as const, label: 'Compose & Send', icon: Sparkles },
    { key: 'sent' as const, label: 'Sent Reports', icon: FileText, count: sentReports.length },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="w-8 h-8 text-purple-400" />
            Newsletter Management
          </h1>
          <p className="mt-2 text-gray-400">
            AI-powered intelligence reports for your subscribers
          </p>
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
                ? 'border-b-2 border-purple-400 text-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400">
              {subscribers.filter(s => s.active).length} active / {subscribers.length} total
            </p>
            {subscribers.length > 0 && (
              <button onClick={exportToCSV}
                className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
                Export CSV
              </button>
            )}
          </div>

          {subscribers.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Subscribed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/5">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-white/10">
                      <td className="whitespace-nowrap px-6 py-4 text-sm">{subscriber.email}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs ${subscriber.active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                          {subscriber.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                        {new Date(subscriber.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <p className="text-gray-400">No subscribers yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="space-y-6">
          {/* Generate Button */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white mb-2">Generate AI Prediction Report</h2>
            <p className="text-sm text-gray-400 mb-4">
              The AI will analyze current articles, materials prices, and market data to generate a comprehensive prediction report.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Report...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate AI Report</>
              )}
            </button>
          </div>

          {/* Preview */}
          {generatedHtml && (
            <>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-white">Generated Newsletter</h2>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
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
                      className="w-full min-h-[500px] bg-white/5"
                      title="Newsletter Preview"
                    />
                  </div>
                )}
              </div>

              {/* Send Controls */}
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6">
                <h2 className="text-lg font-medium text-yellow-400 mb-4">Send Newsletter</h2>

                {/* Test Send */}
                <div className="mb-6 p-4 rounded-lg bg-black/30 border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3">🧪 Test Send (Debug/Demo)</h3>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="Enter test email address"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white placeholder-gray-500"
                    />
                    <button
                      onClick={handleTestSend}
                      disabled={sending || !testEmail}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>

                {/* Send to All */}
                <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3">📨 Send to All Subscribers</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    This will send the newsletter to all {subscribers.filter(s => s.active).length} active subscribers.
                  </p>
                  <button
                    onClick={handleSendAll}
                    disabled={sending || subscribers.filter(s => s.active).length === 0}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : `Send to ${subscribers.filter(s => s.active).length} Subscribers`}
                  </button>
                </div>

                {/* Result */}
                {sendResult && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${sendResult.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {sendResult}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sent Reports Tab */}
      {activeTab === 'sent' && (
        <div>
          {sentReports.length > 0 ? (
            <div className="space-y-4">
              {sentReports.map((report) => (
                <div key={report.id} className="rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">{report.subject}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {report.sentCount} recipients
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(report.sentAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400 font-medium">
                      Sent
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No newsletters sent yet.</p>
              <p className="text-sm text-gray-500 mt-1">Go to &ldquo;Compose & Send&rdquo; to create your first newsletter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
