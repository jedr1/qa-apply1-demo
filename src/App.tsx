import { useState } from 'react'

const WEBHOOK_URL = 'https://n8n.jed-ryan.com/webhook/a50c62f9-2b79-4ee5-a86b-f5250b638b2b'

const REPORTS = {
  wellDocumented: [
    'Dark mode stops responding after the first shake. Shaking the phone the first time turns it on, but shaking again does nothing.',
    'After filtering properties by date, I searched by name and now I\'m only seeing a subset of properties even after clearing the search box. A page refresh fixes it.',
  ],
  poorlyDocumented: [
    'The Sign Out menu option is greyed out and unclickable even though I\'m clearly logged in.',
    'On mobile I can\'t find any way to add a property. The search bar is also missing.',
  ],
}

const ALL_REPORTS = [...REPORTS.wellDocumented, ...REPORTS.poorlyDocumented]

type Status = 'idle' | 'loading' | 'success' | 'error'

interface WebhookResult {
  summary: string
  likely_area: string
  hypothesis: string
  next_steps: string
  confidence: number
  context_sufficiency: number
  context_sufficiency_reason: string
}

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      <div className="text-sm text-gray-800 leading-relaxed">{children}</div>
    </div>
  )
}

function ResultPanel({ result }: { result: WebhookResult }) {
  const steps = result.next_steps
    .split('\n')
    .map(s => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <Section title="Summary">{result.summary}</Section>

      <div className="border-t border-gray-200" />

      <Section title="Likely Area">{result.likely_area}</Section>

      <div className="border-t border-gray-200" />

      <Section title="Hypothesis">{result.hypothesis}</Section>

      <div className="border-t border-gray-200" />

      <Section title="Next Steps">
        <ol className="space-y-1.5 list-none">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <div className="border-t border-gray-200" />

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Confidence</h3>
        <ConfidenceBar value={result.confidence} label="Overall Confidence" />
        <ConfidenceBar value={result.context_sufficiency} label="Context Sufficiency" />
        <p className="text-xs text-gray-500 leading-relaxed">{result.context_sufficiency_reason}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [selectedReport, setSelectedReport] = useState(ALL_REPORTS[0])
  const isWellDocumented = REPORTS.wellDocumented.includes(selectedReport)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<WebhookResult | null>(null)
  const [rawResponse, setRawResponse] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit() {
    setStatus('loading')
    setResult(null)
    setRawResponse(null)

    const credentials = btoa(`${username}:${password}`)

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({ report: selectedReport }),
      })

      const text = await res.text()

      if (res.ok) {
        try {
          const json = JSON.parse(text)
          setResult(json.result ?? json)
          setStatus('success')
        } catch {
          setRawResponse(text)
          setStatus('success')
        }
      } else {
        setRawResponse(text)
        setStatus('error')
      }
    } catch (err) {
      setRawResponse(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">QA Report Webhook</h1>
          <p className="text-sm text-gray-500 mt-1">Select a report and submit it to the n8n webhook.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Software Report</label>
            <select
              value={selectedReport}
              onChange={e => setSelectedReport(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="Well Documented Area">
                {REPORTS.wellDocumented.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </optgroup>
              <optgroup label="Poorly Documented Area">
                {REPORTS.poorlyDocumented.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </optgroup>
            </select>
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              isWellDocumented
                ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isWellDocumented ? 'bg-green-500' : 'bg-amber-500'}`} />
              {isWellDocumented ? 'Good response expected' : 'Limited response expected'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Processing… (can take a minute or two)' : 'Submit Report'}
        </button>

        {result && <ResultPanel result={result} />}

        {rawResponse && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {status === 'error' ? 'Request failed' : 'Response received'}
              </span>
            </div>
            <pre className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-800 overflow-auto whitespace-pre-wrap break-words">
              {rawResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
