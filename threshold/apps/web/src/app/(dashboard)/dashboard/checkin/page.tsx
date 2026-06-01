'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost, apiGet, apiPut, apiDelete } from '@/lib/api'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'

const BODY_AREAS = [
  'Neck', 'Upper Back', 'Lower Back', 'Left Shoulder', 'Right Shoulder',
  'Left Arm', 'Right Arm', 'Chest', 'Core', 'Left Hip', 'Right Hip',
  'Left Quad', 'Right Quad', 'Left Hamstring', 'Right Hamstring',
  'Left Knee', 'Right Knee', 'Left Calf', 'Right Calf', 'Left Ankle', 'Right Ankle',
]

interface Soreness { area: string; severity: 1 | 2 | 3 }

interface CheckIn {
  id: string
  date: string
  sleep: number
  energy: number
  motivation: number
  stress: boolean
  stressNote: string | null
  sorenessMap: Soreness[]
  readinessScore: number
  notes: string | null
}

function severityColor(severity: number) {
  return severity === 1 ? '#FF8C00' : severity === 2 ? '#FF6B00' : '#FF3B30'
}

function scoreColor(score: number) {
  return score >= 75 ? '#4CAF50' : score >= 50 ? '#FF8C00' : '#FF3B30'
}

function scoreLabel(score: number) {
  return score >= 75 ? 'Ready to push hard' : score >= 50 ? 'Train smart' : 'Recovery day'
}

function RatingInput({ label, value, onChange, sublabels }: {
  label: string; value: number; onChange: (v: number) => void; sublabels?: [string, string]
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className="flex-1 h-10 rounded-lg font-bold text-sm transition cursor-pointer"
            style={{
              background: value === n ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1E1E1E',
              border: `1px solid ${value === n ? '#FF3B30' : '#2A2A2A'}`,
              color: value === n ? '#fff' : '#6B7280',
            }}>
            {n}
          </button>
        ))}
      </div>
      {sublabels && (
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>{sublabels[0]}</span><span>{sublabels[1]}</span>
        </div>
      )}
    </div>
  )
}

// ─── Check-in Form (shared by new + edit) ─────────────────────────────────────

function CheckInForm({
  initial,
  onSave,
  onCancel,
  submitLabel,
}: {
  initial?: Partial<CheckIn>
  onSave: (data: Omit<CheckIn, 'id' | 'date' | 'readinessScore'>) => Promise<void>
  onCancel?: () => void
  submitLabel: string
}) {
  const [sleep, setSleep] = useState(initial?.sleep ?? 3)
  const [energy, setEnergy] = useState(initial?.energy ?? 3)
  const [motivation, setMotivation] = useState(initial?.motivation ?? 3)
  const [stress, setStress] = useState(initial?.stress ?? false)
  const [stressNote, setStressNote] = useState(initial?.stressNote ?? '')
  const [sorenessMap, setSorenessMap] = useState<Soreness[]>(initial?.sorenessMap ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleSoreness(area: string) {
    setSorenessMap(prev => {
      const existing = prev.find(s => s.area === area)
      if (!existing) return [...prev, { area, severity: 1 }]
      if (existing.severity < 3) return prev.map(s => s.area === area ? { ...s, severity: (s.severity + 1) as 1 | 2 | 3 } : s)
      return prev.filter(s => s.area !== area)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSave({ sleep, energy, motivation, stress, stressNote: stress ? stressNote : null, sorenessMap, notes: notes || null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="sm:grid sm:grid-cols-2 sm:gap-8">
        <div className="space-y-6">
          <RatingInput label="Sleep Quality" value={sleep} onChange={setSleep} sublabels={['Poor', 'Excellent']} />
          <RatingInput label="Energy Level" value={energy} onChange={setEnergy} sublabels={['Exhausted', 'Energised']} />
          <RatingInput label="Motivation" value={motivation} onChange={setMotivation} sublabels={['Zero drive', 'Ready to go']} />
          <div>
            <label className="block text-sm font-semibold mb-2">Elevated Stress?</label>
            <div className="flex gap-3">
              {(['No', 'Yes'] as const).map(opt => (
                <button key={opt} type="button" onClick={() => setStress(opt === 'Yes')}
                  className="flex-1 h-10 rounded-lg font-bold text-sm transition cursor-pointer"
                  style={{
                    background: (stress ? opt === 'Yes' : opt === 'No') ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1E1E1E',
                    border: `1px solid ${(stress ? opt === 'Yes' : opt === 'No') ? '#FF3B30' : '#2A2A2A'}`,
                    color: (stress ? opt === 'Yes' : opt === 'No') ? '#fff' : '#6B7280',
                  }}>
                  {opt}
                </button>
              ))}
            </div>
            {stress && (
              <input className="mt-2 w-full px-3 py-2 rounded-lg text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]"
                placeholder="What's stressing you? (optional)" value={stressNote}
                onChange={e => setStressNote(e.target.value)} maxLength={500} />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
            <textarea className="w-full px-3 py-2 rounded-lg text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] resize-none"
              rows={3} placeholder="Anything else worth noting today..." value={notes}
              onChange={e => setNotes(e.target.value)} maxLength={1000} />
          </div>
        </div>

        <div className="mt-6 sm:mt-0">
          <label className="block text-sm font-semibold mb-1">Soreness / Pain</label>
          <p className="text-xs text-gray-500 mb-3">Tap to mark sore. Tap again to increase severity (1→2→3). Tap once more to clear.</p>
          <div className="grid grid-cols-3 gap-2">
            {BODY_AREAS.map(area => {
              const entry = sorenessMap.find(s => s.area === area)
              return (
                <button key={area} type="button" onClick={() => toggleSoreness(area)}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                  style={{
                    background: entry ? `${severityColor(entry.severity)}22` : '#1E1E1E',
                    border: `1px solid ${entry ? severityColor(entry.severity) : '#2A2A2A'}`,
                    color: entry ? severityColor(entry.severity) : '#6B7280',
                  }}>
                  {area}{entry ? ` ×${entry.severity}` : ''}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mt-6">{error}</p>}

      <div className="flex gap-3 mt-8">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-shrink-0 px-6 h-12 rounded-xl font-bold border border-[#2A2A2A] text-gray-400 hover:text-white hover:border-[#FF3B30] transition cursor-pointer">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading}
          className="flex-1 h-12 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ─── History card ─────────────────────────────────────────────────────────────

function HistoryCard({ checkIn, onEdit, onDelete }: {
  checkIn: CheckIn
  onEdit: () => void
  onDelete: () => void
}) {
  const color = scoreColor(checkIn.readinessScore)
  const date = new Date(checkIn.date)
  const dateStr = date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="rounded-2xl p-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
            style={{ background: color + '20', color }}>
            {checkIn.readinessScore}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{dateStr}</p>
            <p className="text-xs mt-0.5" style={{ color }}>{scoreLabel(checkIn.readinessScore)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#2A2A2A] text-gray-400 hover:text-white hover:border-[#FF3B30] transition cursor-pointer">
            Edit
          </button>
          <button onClick={onDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#2A2A2A] text-gray-400 hover:text-[#FF3B30] hover:border-[#FF3B30] transition cursor-pointer">
            Delete
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: 'Sleep', value: checkIn.sleep },
          { label: 'Energy', value: checkIn.energy },
          { label: 'Motivation', value: checkIn.motivation },
        ].map(m => (
          <div key={m.label} className="rounded-lg px-2 py-1.5 text-center" style={{ background: '#1A1A1A' }}>
            <div className="text-sm font-bold text-white">{m.value}<span className="text-xs text-gray-500">/5</span></div>
            <div className="text-[10px] text-gray-500">{m.label}</div>
          </div>
        ))}
      </div>

      {checkIn.stress && (
        <p className="text-xs text-[#FF8C00] mt-2">⚠ Elevated stress{checkIn.stressNote ? ` — ${checkIn.stressNote}` : ''}</p>
      )}
      {checkIn.sorenessMap.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {checkIn.sorenessMap.map(s => (
            <span key={s.area} className="text-[10px] px-2 py-0.5 rounded"
              style={{ background: severityColor(s.severity) + '22', color: severityColor(s.severity) }}>
              {s.area}
            </span>
          ))}
        </div>
      )}
      {checkIn.notes && <p className="text-xs text-gray-500 mt-2 italic">{checkIn.notes}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'new' | 'history'>('new')
  const [done, setDone] = useState<{ readinessScore: number } | null>(null)
  const [history, setHistory] = useState<CheckIn[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editTarget, setEditTarget] = useState<CheckIn | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Date range — default last 30 days
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0])

  function loadHistory() {
    setHistoryLoading(true)
    apiGet<CheckIn[]>(`/api/checkin?from=${fromDate}&to=${toDate}`)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, fromDate, toDate])

  async function submitNew(data: Omit<CheckIn, 'id' | 'date' | 'readinessScore'>) {
    const result = await apiPost<{ checkIn: unknown; readinessScore: number }>('/api/checkin', data)
    setDone(result)
  }

  async function submitEdit(data: Omit<CheckIn, 'id' | 'date' | 'readinessScore'>) {
    if (!editTarget) return
    await apiPut(`/api/checkin/${editTarget.id}`, data)
    setEditTarget(null)
    loadHistory()
  }

  async function confirmDelete(id: string) {
    setDeleting(true)
    try {
      await apiDelete(`/api/checkin/${id}`)
      setDeleteConfirm(null)
      loadHistory()
    } finally {
      setDeleting(false)
    }
  }

  // ── Success screen ──
  if (done) {
    const score = done.readinessScore
    const color = scoreColor(score)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
          style={{ background: `${color}20`, border: `3px solid ${color}` }}>
          <div>
            <div className="text-4xl font-black" style={{ color }}>{score}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">/ 100</div>
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2">Readiness Score</h2>
        <p className="text-gray-400 mb-8">{scoreLabel(score)}</p>
        <button onClick={() => router.push('/dashboard')}
          className="px-6 py-3 rounded-xl font-bold text-white cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}>
          See This Week&apos;s Plan →
        </button>
      </div>
    )
  }

  // ── Edit mode ──
  if (editTarget) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-white transition cursor-pointer text-lg">←</button>
          <div>
            <h1 className="text-2xl font-black">Edit Check-in</h1>
            <p className="text-gray-400 text-sm">
              {new Date(editTarget.date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <CheckInForm
          initial={editTarget}
          onSave={submitEdit}
          onCancel={() => setEditTarget(null)}
          submitLabel="Save Changes"
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">Check-in</h1>
        <div className="flex rounded-xl overflow-hidden border border-[#2A2A2A]">
          {(['new', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-2 text-sm font-semibold transition cursor-pointer capitalize"
              style={{
                background: tab === t ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1A1A1A',
                color: tab === t ? '#fff' : '#9CA3AF',
              }}>
              {t === 'new' ? 'New' : 'History'}
            </button>
          ))}
        </div>
      </div>

      {/* ── New check-in tab ── */}
      {tab === 'new' && (
        <>
          <p className="text-gray-400 text-sm mb-8">Takes 60 seconds — shapes today&apos;s training.</p>
          <CheckInForm onSave={submitNew} submitLabel="Submit Check-in →" />
        </>
      )}

      {/* ── History tab ── */}
      {tab === 'history' && (
        <div className="space-y-4">

          {/* Date range picker */}
          <div className="rounded-2xl p-4 flex flex-wrap items-end gap-3" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30]" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30]" />
            </div>
            {/* Quick ranges */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: '7d',  days: 7 },
                { label: '30d', days: 30 },
                { label: '90d', days: 90 },
              ].map(r => (
                <button key={r.label} onClick={() => {
                  const to = new Date()
                  const from = new Date(); from.setDate(from.getDate() - r.days)
                  setToDate(to.toISOString().split('T')[0])
                  setFromDate(from.toISOString().split('T')[0])
                }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#9CA3AF' }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-400 text-center py-16">No check-ins in this range</p>
          ) : (
            <>
              {/* Chart */}
              <div className="rounded-2xl p-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
                <p className="text-sm font-bold text-white mb-4">Wellness Trends</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history.map(c => ({
                    date: new Date(c.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
                    Readiness: c.readinessScore,
                    Sleep: c.sleep * 20,
                    Energy: c.energy * 20,
                    Motivation: c.motivation * 20,
                  }))} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
                    <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false}
                      interval={Math.max(0, Math.floor(history.length / 6) - 1)} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#fff', fontWeight: 700 }}
                      formatter={(value: number, name: string) => {
                        if (name !== 'Readiness') return [`${Math.round(value / 20)}/5`, name]
                        return [value, name]
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                    <Line type="monotone" dataKey="Readiness" stroke="#FF3B30" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Sleep" stroke="#4FC3F7" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="Energy" stroke="#FF8C00" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="Motivation" stroke="#4CAF50" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-600 mt-2 text-center">Sleep, Energy, Motivation scaled to 0–100 for comparison</p>
              </div>

              {/* Cards — most recent first */}
              <div className="space-y-3">
                {[...history].reverse().map(c => (
                  <HistoryCard
                    key={c.id}
                    checkIn={c}
                    onEdit={() => setEditTarget(c)}
                    onDelete={() => setDeleteConfirm(c.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Delete confirm dialog ── */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-x border-[#2A2A2A] p-6"
            style={{ background: '#141414' }}>
            <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-5" />
            <h3 className="text-lg font-black mb-2">Delete this check-in?</h3>
            <p className="text-sm text-gray-400 mb-6">This can&apos;t be undone. Your readiness score for that day will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-12 rounded-xl font-bold border border-[#2A2A2A] text-gray-400 hover:text-white transition cursor-pointer">
                Cancel
              </button>
              <button onClick={() => confirmDelete(deleteConfirm)} disabled={deleting}
                className="flex-1 h-12 rounded-xl font-bold text-white transition cursor-pointer disabled:opacity-50"
                style={{ background: '#FF3B30' }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
