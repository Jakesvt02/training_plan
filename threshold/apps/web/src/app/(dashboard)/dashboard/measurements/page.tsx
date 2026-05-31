'use client'

import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip,
} from 'recharts'

interface Measurement {
  id: string
  date: string
  weightKg: number
  bmi: number
  bodyFatPercent: number | null
  chestCm: number | null
  waistCm: number | null
  hipsCm: number | null
  leftArmCm: number | null
  rightArmCm: number | null
  leftThighCm: number | null
  rightThighCm: number | null
}

type MetricKey = 'weightKg' | 'bodyFatPercent' | 'waistCm' | 'chestCm' | 'hipsCm' | 'leftArmCm' | 'rightArmCm' | 'leftThighCm' | 'rightThighCm'

const METRICS: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: 'weightKg',       label: 'Weight',      unit: 'kg',  color: '#FF8C00' },
  { key: 'bodyFatPercent', label: 'Body Fat',     unit: '%',   color: '#FF3B30' },
  { key: 'waistCm',        label: 'Waist',        unit: 'cm',  color: '#3B9EFF' },
  { key: 'chestCm',        label: 'Chest',        unit: 'cm',  color: '#9C27B0' },
  { key: 'hipsCm',         label: 'Hips',         unit: 'cm',  color: '#E91E63' },
  { key: 'leftArmCm',      label: 'Left Arm',     unit: 'cm',  color: '#4CAF50' },
  { key: 'rightArmCm',     label: 'Right Arm',    unit: 'cm',  color: '#81C784' },
  { key: 'leftThighCm',    label: 'Left Thigh',   unit: 'cm',  color: '#00BCD4' },
  { key: 'rightThighCm',   label: 'Right Thigh',  unit: 'cm',  color: '#4DD0E1' },
]

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MiniTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-2 py-1 text-xs" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <span className="text-white font-bold">{payload[0].value}{unit}</span>
      <span className="text-gray-500 ml-1">{fmt(payload[0].payload.date)}</span>
    </div>
  )
}

function Sparkline({ data, metricKey, color, unit }: {
  data: Measurement[]
  metricKey: MetricKey
  color: string
  unit: string
}) {
  const filtered = data.filter(d => d[metricKey] != null)
  if (filtered.length < 2) return <div className="h-16 flex items-center justify-center text-xs text-gray-600">Not enough data</div>

  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={filtered} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
        <XAxis dataKey="date" hide />
        <YAxis domain={['auto', 'auto']} hide />
        <Tooltip content={<MiniTooltip unit={unit} />} />
        <Line type="monotone" dataKey={metricKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [weightKg, setWeightKg] = useState('')
  const [bodyFatPercent, setBodyFatPercent] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [chestCm, setChestCm] = useState('')
  const [hipsCm, setHipsCm] = useState('')
  const [leftArmCm, setLeftArmCm] = useState('')
  const [rightArmCm, setRightArmCm] = useState('')
  const [leftThighCm, setLeftThighCm] = useState('')
  const [rightThighCm, setRightThighCm] = useState('')

  useEffect(() => {
    apiGet<Measurement[]>('/api/measurements?limit=90')
      .then(setMeasurements)
      .catch(() => setError('Failed to load measurements'))
      .finally(() => setLoading(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!weightKg) return
    setSaving(true)
    setError('')
    try {
      const m = await apiPost<Measurement>('/api/measurements', {
        date,
        weightKg: parseFloat(weightKg),
        bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
        waistCm: waistCm ? parseFloat(waistCm) : undefined,
        chestCm: chestCm ? parseFloat(chestCm) : undefined,
        hipsCm: hipsCm ? parseFloat(hipsCm) : undefined,
        leftArmCm: leftArmCm ? parseFloat(leftArmCm) : undefined,
        rightArmCm: rightArmCm ? parseFloat(rightArmCm) : undefined,
        leftThighCm: leftThighCm ? parseFloat(leftThighCm) : undefined,
        rightThighCm: rightThighCm ? parseFloat(rightThighCm) : undefined,
      })
      setMeasurements(prev => [...prev, m].sort((a, b) => a.date.localeCompare(b.date)))
      setShowForm(false)
      setWeightKg(''); setBodyFatPercent(''); setWaistCm('')
      setChestCm(''); setHipsCm('')
      setLeftArmCm(''); setRightArmCm(''); setLeftThighCm(''); setRightThighCm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    setDeletingId(id)
    try {
      await apiDelete(`/api/measurements/${id}`)
      setMeasurements(prev => prev.filter(m => m.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const latest = measurements[measurements.length - 1]
  const first = measurements[0]
  const weightDelta = latest && first && latest.id !== first.id
    ? (latest.weightKg - first.weightKg).toFixed(1)
    : null

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] transition"

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Body Measurements</h1>
          {weightDelta !== null && (
            <p className="text-sm text-gray-400 mt-0.5">
              {parseFloat(weightDelta) > 0 ? '+' : ''}{weightDelta} kg since {fmt(first.date)}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white cursor-pointer transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
        >
          + Log
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <form onSubmit={submit} className="rounded-2xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">New Entry</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Weight (kg) *</label>
              <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} step="0.1" min="20" max="500" placeholder="75.0" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Body Fat %',    val: bodyFatPercent, set: setBodyFatPercent },
              { label: 'Waist (cm)',    val: waistCm,        set: setWaistCm },
              { label: 'Chest (cm)',    val: chestCm,        set: setChestCm },
              { label: 'Hips (cm)',     val: hipsCm,         set: setHipsCm },
              { label: 'Left Arm (cm)', val: leftArmCm,      set: setLeftArmCm },
              { label: 'Right Arm (cm)',val: rightArmCm,     set: setRightArmCm },
              { label: 'Left Thigh (cm)', val: leftThighCm,  set: setLeftThighCm },
              { label: 'Right Thigh (cm)',val: rightThighCm, set: setRightThighCm },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{f.label}</label>
                <input type="number" value={f.val} onChange={e => f.set(e.target.value)} step="0.5" placeholder="—" className={inputClass} />
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !weightKg} className="flex-1 h-10 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90 disabled:opacity-50 transition" style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}>
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 h-10 rounded-xl text-sm text-gray-400 cursor-pointer hover:text-white transition" style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Latest stats */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Weight', value: `${latest.weightKg} kg` },
            { label: 'BMI', value: String(latest.bmi) },
            { label: 'Body Fat', value: latest.bodyFatPercent ? `${latest.bodyFatPercent}%` : '—' },
            { label: 'Waist', value: latest.waistCm ? `${latest.waistCm} cm` : '—' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 text-center" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
              <div className="text-lg font-black text-white">{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sparkline grid — only show metrics that have at least 2 data points */}
      {measurements.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {METRICS.filter(m => measurements.filter(d => d[m.key] != null).length >= 2).map(m => {
            const pts = measurements.filter(d => d[m.key] != null)
            const vals = pts.map(d => d[m.key] as number)
            const min = Math.min(...vals)
            const max = Math.max(...vals)
            const delta = vals[vals.length - 1] - vals[0]
            return (
              <div key={m.key} className="rounded-2xl p-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{m.label}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-white">{vals[vals.length - 1]}{m.unit}</span>
                    {delta !== 0 && (
                      <span style={{ color: delta < 0 ? '#4CAF50' : '#FF3B30' }}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}{m.unit}
                      </span>
                    )}
                  </div>
                </div>
                <Sparkline data={measurements} metricKey={m.key} color={m.color} unit={m.unit} />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>Min {min}{m.unit}</span>
                  <span>Max {max}{m.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History */}
      {measurements.length > 0 ? (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
          <div className="px-5 py-3 border-b border-[#1E1E1E]">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">History</h2>
          </div>
          <div className="divide-y divide-[#1E1E1E]">
            {[...measurements].reverse().map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#1A1A1A] transition">
                <div>
                  <div className="text-sm font-semibold text-white">{fmt(m.date)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {m.weightKg} kg · BMI {m.bmi}
                    {m.bodyFatPercent ? ` · ${m.bodyFatPercent}% BF` : ''}
                    {m.waistCm ? ` · Waist ${m.waistCm}cm` : ''}
                    {m.leftArmCm ? ` · L.Arm ${m.leftArmCm}cm` : ''}
                    {m.rightArmCm ? ` / R.Arm ${m.rightArmCm}cm` : ''}
                  </div>
                </div>
                <button
                  onClick={() => remove(m.id)}
                  disabled={deletingId === m.id}
                  className="text-xs text-gray-600 hover:text-red-400 transition cursor-pointer disabled:opacity-40"
                >
                  {deletingId === m.id ? '...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-10 text-center" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
          <p className="text-gray-400 text-sm">No measurements logged yet.</p>
          <p className="text-gray-600 text-xs mt-1">Tap + Log to record your first entry.</p>
        </div>
      )}

    </div>
  )
}
