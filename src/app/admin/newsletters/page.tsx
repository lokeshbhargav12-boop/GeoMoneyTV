'use client'

import { useEffect, useState } from 'react'
import {
  Mail, Send, Eye, RefreshCw, Sparkles, FileText, Users, Clock,
  Plus, Trash2, Zap, Calendar, Timer, Brain, Newspaper,
} from 'lucide-react'

// Safe JSON parse -- handles HTML error pages from timeouts/crashes
async function safeJson(res: Response): Promise<any> {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    const status = res.status
    if (status === 504 || status === 502) throw new Error('Request timed out. Try again.')
    if (status === 401 || status === 403) throw new Error('Session expired. Please refresh and sign in again.')
    if (status >= 500) throw new Error('Server error (' + status + '). Check runtime logs for details.')
    throw new Error('Unexpected response (' + status + '). Please try again.')
  }
}

// Types
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
  reportType?: string
}

interface TriggerState {
  loading: boolean
  result: { ok: boolean; msg: string } | null
}

// Countdown hook
function useCountdown(utcHour: number, utcMinute: number) {
  const [countdown, setCountdown] = useState('--:--:--')
  const [nextRunIST, setNextRunIST] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      const next = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, utcMinute, 0),
      )
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1)

      setNextRunIST(
        next.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          day: 'numeric',
          month: 'short',
        }),
      )

      const diff = next.getTime() - now.getTime()
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [utcHour, utcMinute])

  return { countdown, nextRunIST }
}

// Page
export default function NewslettersPage() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'compose' | 'sent'>('subscribers')
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [sentReports, setSentReports] = useState<SentReport[]>([])
  const [loading, setLoading] = useState(true)

  // Add subscriber
  const [newEmail, setNewEmail] = useState('')
  const [addingEmail, setAddingEmail] = useState(false)
  const [addResult, setAddResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Manual triggers
  const [dailyTrigger, setDailyTrigger] = useState<TriggerState>({ loading: false, result: null })
  const [weeklyTrigger, setWeeklyTrigger] = useState<TriggerState>({ loading: false, result: null })

  // Compose state
  const [composeType, setComposeType] = useState<'daily' | 'weekly'>('weekly')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [generatedSubject, setGeneratedSubject] = useState('')
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendResult, setSendResult] = useState<string | null>(null)

  // Daily Intelligence Report: 05:50 UTC = 11:20 AM IST
  const { countdown, nextRunIST } = useCountdown(5, 50)

  const activeCount = subscribers.filter((s) => s.active).length

  useEffect(() => {
    fetchSubscribers()
    fetchSentReports()
  }, [])

  async function fetchSubscribers() {
    try {
      const res = await fetch('/api/newsletter')
      const data = await safeJson(res)
      setSubscribers(data.subscribers || [])
    } catch {}
    finally { setLoading(false) }
  }

  async function fetchSentReports() {
    try {
      const res = await fetch('/api/admin/newsletter/send')
      const data = await safeJson(res)
      setSentReports(data.reports || [])
    } catch {}
  }

  async function handleAddEmail() {
    if (!newEmail || !newEmail.includes('@')) {
      setAddResult({ ok: false, msg: 'Enter a valid email address.' })
      return
    }
    setAddingEmail(true)
    setAddResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Failed')
      setAddResult({ ok: true, msg: data.message })
      setNewEmail('')
      fetchSubscribers()
    } catch (err: any) {
      setAddResult({ ok: false, msg: err.message })
    } finally {
      setAddingEmail(false)
    }
  }

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Remove ${email} from the subscriber list?`)) return
    try {
      await fetch('/api/admin/newsletter/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      fetchSubscribers()
    } catch {}
  }

  async function handleTrigger(type: 'daily-report' | 'weekly-report') {
    const label = type === 'daily-report' ? 'Daily Materials Report' : 'Weekly Intelligence Report'
    if (!confirm(`Send the ${label} (with PDF attachment) to all ${activeCount} active subscribers now?`)) return

    const setState = type === 'daily-report' ? setDailyTrigger : setWeeklyTrigger
    setState({ loading: true, result: null })

    try {
      const res = await fetch('/api/admin/newsletter/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Failed')
      setState({
        loading: false,
        result: { ok: true, msg: `Sent to ${data.sentCount}/${data.totalRecipients} subscribers (${data.reportType} report with PDF).` },
      })
      fetchSentReports()
    } catch (err: any) {
      setState({ loading: false, result: { ok: false, msg: err.message } })
    }
  }

  const exportToCSV = () => {
    const csv = [
      ['Email', 'Status', 'Subscribed Date'],
      ...subscribers.map((s) => [s.email, s.active ? 'Active' : 'Inactive', new Date(s.createdAt).toLocaleDateString()]),
    ].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  async function handleGenerate() {
    setGenerating(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: composeType }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setGeneratedSubject(data.subject)
      setGeneratedHtml(data.htmlContent)
      setShowPreview(true)
    } catch (err: any) {
      alert(err.message || 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  async function handleTestSend() {
    if (!testEmail) { alert('Enter a test email address'); return }
    if (!generatedHtml) { alert('Generate the newsletter first'); return }
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: generatedSubject, htmlContent: generatedHtml, testEmail }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setSendResult(`Test email sent to ${testEmail}!`)
      fetchSentReports()
    } catch (err: any) {
      setSendResult(`Error: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  async function handleSendAll() {
    if (!generatedHtml) { alert('Generate the newsletter first'); return }
    if (!confirm(`Send to all ${activeCount} active subscribers?`)) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: generatedSubject, htmlContent: generatedHtml, recipients: 'all' }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setSendResult(`Sent to ${data.sentCount}/${data.totalRecipients} recipients!`)
      fetchSentReports()
    } catch (err: any) {
      setSendResult(`Error: ${err.message}`)
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Mail className="w-8 h-8 text-purple-400" />
          Newsletter Management
        </h1>
        <p className="mt-2 text-gray-400">Daily Materials &amp; Weekly Intelligence reports with PDF attachments</p>
      </div>

      {/* Scheduler Panel */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <Timer className="w-5 h-5 text-geo-gold" />
          <h2 className="font-semibold text-white">Scheduler</h2>
          <span className="text-xs text-gray-500">Auto-dispatch status &amp; manual controls</span>
        </div>

        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Daily Materials Report */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">Daily Materials Report</span>
              <span className="ml-auto text-[10px] bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full font-medium tracking-wide">
                AUTO + PDF
              </span>
            </div>

            <div className="flex items-end gap-8">
              <div>
                <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">Next Run (IST)</div>
                <div className="text-base font-bold text-white">{nextRunIST || '11:20 AM'}</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">Countdown</div>
                <div className="text-2xl font-mono font-bold text-geo-gold tracking-widest tabular-nums">
                  {countdown}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Focus: Critical materials, supply chains, geopolitical exposure. Sent as PDF attachment.
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Fires at 05:50 UTC (11:20 AM IST) every day automatically
            </div>

            <button
              onClick={() => handleTrigger('daily-report')}
              disabled={dailyTrigger.loading || activeCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-all disabled:opacity-40"
            >
              {dailyTrigger.loading ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Generating &amp; Sending...</>
              ) : (
                <><Zap className="w-3.5 h-3.5" />Send Now (PDF) &middot; {activeCount} subscriber{activeCount !== 1 ? 's' : ''}</>
              )}
            </button>

            {dailyTrigger.result && (
              <div className={`text-xs px-3 py-2 rounded-lg ${dailyTrigger.result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {dailyTrigger.result.msg}
              </div>
            )}
          </div>

          {/* Weekly Intelligence Report */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Weekly Intelligence Report</span>
              <span className="ml-auto text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-medium tracking-wide">
                MANUAL + PDF
              </span>
            </div>

            <div className="flex items-end gap-8">
              <div>
                <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">Format</div>
                <div className="text-base font-bold text-white">Full Intelligence Report</div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">Last Sent</div>
                <div className="text-sm font-medium text-gray-300">
                  {sentReports.find(r => r.reportType === 'weekly')
                    ? new Date(sentReports.find(r => r.reportType === 'weekly')!.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : sentReports[0]
                    ? new Date(sentReports[0].sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Never'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Full thesis, scenario outlook, transmission maps, compliance-checked. Sent as PDF attachment.
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              Trigger manually or use &quot;Compose &amp; Send&quot; for preview
            </div>

            <button
              onClick={() => handleTrigger('weekly-report')}
              disabled={weeklyTrigger.loading || activeCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-all disabled:opacity-40"
            >
              {weeklyTrigger.loading ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Generating &amp; Sending...</>
              ) : (
                <><Zap className="w-3.5 h-3.5" />Send Now (PDF) &middot; {activeCount} subscriber{activeCount !== 1 ? 's' : ''}</>
              )}
            </button>

            {weeklyTrigger.result && (
              <div className={`text-xs px-3 py-2 rounded-lg ${weeklyTrigger.result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                className="flex-1 rounded-lg border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-geo-gold/50 transition-colors"
              />
              <button
                onClick={handleAddEmail}
                disabled={addingEmail}
                className="flex items-center gap-2 px-5 py-2.5 bg-geo-gold/20 hover:bg-geo-gold/30 border border-geo-gold/30 rounded-lg text-geo-gold text-sm font-medium transition-all disabled:opacity-40"
              >
                {addingEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
            {addResult && (
              <p className={`mt-2.5 text-xs ${addResult.ok ? 'text-green-400' : 'text-red-400'}`}>
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
                <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : subscribers.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Subscribed</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/5">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{sub.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${sub.active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                          {sub.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(sub.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
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
              <p className="text-sm text-gray-500 mt-1">Add the first subscriber using the form above.</p>
            </div>
          )}
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-medium text-white mb-2">Generate AI Report</h2>
            <p className="text-sm text-gray-400 mb-4">
              Choose a report type then generate. Both use the compliance engine and can be sent as PDF attachments.
            </p>

            {/* Report type selector */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setComposeType('daily')}
                className={`flex-1 rounded-lg border p-4 text-left transition-all ${composeType === 'daily' ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">Daily Materials Report</span>
                </div>
                <p className="text-xs text-gray-500">Critical materials focus, supply chain analysis, geopolitical exposure</p>
              </button>
              <button
                onClick={() => setComposeType('weekly')}
                className={`flex-1 rounded-lg border p-4 text-left transition-all ${composeType === 'weekly' ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white">Weekly Intelligence Report</span>
                </div>
                <p className="text-xs text-gray-500">Full thesis, scenario outlook, transmission maps, market snapshot</p>
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-colors disabled:opacity-50 ${composeType === 'daily' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Generating {composeType === 'daily' ? 'Daily' : 'Weekly'} Report...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate {composeType === 'daily' ? 'Daily Materials' : 'Weekly Intelligence'} Report</>
              )}
            </button>
          </div>

          {generatedHtml && (
            <>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-white">Generated Report</h2>
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
                      className="w-full min-h-[500px]"
                      title="Report Preview"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6">
                <h2 className="text-lg font-medium text-yellow-400 mb-4">Send Report</h2>

                <div className="mb-4 p-4 rounded-lg bg-black/30 border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3">Test Send</h3>
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
                      {sending ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3">Send to All Subscribers</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    This will send the generated report to all {activeCount} active subscribers.
                  </p>
                  <button
                    onClick={handleSendAll}
                    disabled={sending || activeCount === 0}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : `Send to ${activeCount} Subscribers`}
                  </button>
                </div>

                {sendResult && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${sendResult.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
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
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.reportType && (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${report.reportType === 'daily' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {report.reportType === 'daily' ? 'Daily' : 'Weekly'}
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
                Use the Scheduler above or &quot;Compose &amp; Send&quot; tab.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}