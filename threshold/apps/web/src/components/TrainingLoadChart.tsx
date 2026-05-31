'use client'

import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts'
import { apiGet } from '@/lib/api'

interface DataPoint {
  date: string
  tss: number
  atl: number
  ctl: number
  tsb: number
}

const RANGES = [
  { label: '4W', days: 28 },
  { label: '8W', days: 56 },
  { label: '16W', days: 112 },
]

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

function tsbColor(tsb: number) {
  if (tsb > 5) return '#4CAF50'
  if (tsb >= -10) return '#FF8C00'
  return '#FF3B30'
}

function tsbLabel(tsb: number) {
  if (tsb > 5) return 'Fresh'
  if (tsb >= -10) return 'Optimal'
  return 'Fatigued'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as DataPoint
  if (!d) return null

  return (
    <div className="rounded-xl p-3 text-xs space-y-1.5" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
      <div className="font-bold text-white mb-2">{fmt(label)}</div>
      {d.tss > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">TSS</span>
          <span className="text-white font-semibold">{d.tss}</span>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <span style={{ color: '#FF3B30' }}>ATL (Fatigue)</span>
        <span className="text-white font-semibold">{d.atl}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span style={{ color: '#3B9EFF' }}>CTL (Fitness)</span>
        <span className="text-white font-semibold">{d.ctl}</span>
      </div>
      <div className="flex justify-between gap-4 pt-1 border-t border-[#2A2A2A]">
        <span style={{ color: tsbColor(d.tsb) }}>TSB (Form)</span>
        <span style={{ color: tsbColor(d.tsb) }} className="font-bold">
          {d.tsb > 0 ? '+' : ''}{d.tsb} · {tsbLabel(d.tsb)}
        </span>
      </div>
    </div>
  )
}

export default function TrainingLoadChart() {
  const [data, setData] = useState<DataPoint[]>([])
  const [days, setDays] = useState(56)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    apiGet<DataPoint[]>(`/api/training-load?days=${days}`)
      .then(d => setData(d))
      .catch(() => setError('Failed to load training load data'))
      .finally(() => setLoading(false))
  }, [days])

  // Use local date to match how the backend stores dates
  const todayLocal = new Date()
  const today = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`
  const todayData = data.find(d => d.date === today)
  const hasData = data.some(d => d.tss > 0 || d.ctl > 1)

  return (
    <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Training Load</h2>
          {todayData && (
            <div className="flex gap-4 text-xs">
              <span><span className="text-gray-500">Fitness </span><span className="font-bold text-white">{todayData.ctl}</span></span>
              <span><span className="text-gray-500">Fatigue </span><span className="font-bold" style={{ color: '#FF3B30' }}>{todayData.atl}</span></span>
              <span>
                <span className="text-gray-500">Form </span>
                <span className="font-bold" style={{ color: tsbColor(todayData.tsb) }}>
                  {todayData.tsb > 0 ? '+' : ''}{todayData.tsb}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Range toggle */}
        <div className="flex gap-1.5">
          {RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setDays(r.days)}
              className="px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
              style={{
                background: days === r.days ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1E1E1E',
                border: `1px solid ${days === r.days ? '#FF3B30' : '#2A2A2A'}`,
                color: days === r.days ? '#fff' : '#6B7280',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* TSB zone legend */}
      <div className="flex gap-3 mb-4 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#4CAF5033' }} />Fresh (TSB &gt; 5)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#FF8C0033' }} />Optimal (−10 to 5)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#FF3B3033' }} />Fatigued (&lt; −10)</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && <p className="text-red-400 text-sm py-8 text-center">{error}</p>}

      {!loading && !error && !hasData && (
        <div className="py-12 text-center">
          <p className="text-gray-400 text-sm">No training data yet.</p>
          <p className="text-gray-600 text-xs mt-1">Sync activities from Strava or Polar, or log a workout to see your training load.</p>
        </div>
      )}

      {!loading && !error && hasData && (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={d => {
                const date = new Date(d)
                const dom = date.getDate()
                if (dom === 1) return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                if (dom % 7 === 0) return String(dom)
                return ''
              }}
              tick={{ fill: '#4B5563', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => {
                const map: Record<string, string> = { ctl: 'Fitness (CTL)', atl: 'Fatigue (ATL)', tsb: 'Form (TSB)' }
                return <span style={{ color: '#9CA3AF', fontSize: 11 }}>{map[value] ?? value}</span>
              }}
              wrapperStyle={{ paddingTop: 12 }}
            />

            {/* Zero line for TSB */}
            <ReferenceLine y={0} stroke="#444" strokeDasharray="3 3" />

            {/* Daily TSS bars */}
            <Bar dataKey="tss" fill="#FF3B3018" stroke="#FF3B3040" strokeWidth={1} radius={[2, 2, 0, 0]} name="tss" legendType="none" />

            {/* Today marker */}
            <ReferenceLine
              x={today}
              stroke="#aaaaaa"
              strokeWidth={2}
              strokeDasharray="5 3"
              label={({ viewBox }: { viewBox?: { x?: number; y?: number } }) => (
                <text
                  x={(viewBox?.x ?? 0) + 4}
                  y={(viewBox?.y ?? 0) + 14}
                  fill="#aaaaaa"
                  fontSize={10}
                  fontWeight="600"
                >
                  Today
                </text>
              )}
            />

            <Line type="monotone" dataKey="ctl" stroke="#3B9EFF" strokeWidth={2} dot={false} name="ctl" />
            <Line type="monotone" dataKey="atl" stroke="#FF3B30" strokeWidth={2} dot={false} name="atl" />
            <Line type="monotone" dataKey="tsb" stroke="#9CA3AF" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="tsb" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
