'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '@/lib/api'

interface SessionPreview {
  dayOfWeek: number
  name: string
  sessionType: string
  durationMin: number
  tss: number
  sessionJson: unknown
}

interface WeekRow {
  weekNumber: number
  weekStart: string
  weekEnd: string
  phase: string
  intensityLevel: string
  weekInPhase: number
  isCurrent: boolean
  daysToGoal: number | null
  sessions: SessionPreview[]
}

interface HorizonData {
  goalDate: string | null
  goalDetail: string | null
  discipline: string
  weeks: WeekRow[]
}

const PHASE_STYLE: Record<string, { bg: string; border: string; text: string; label: string; desc: string }> = {
  base:  { bg: '#1A2A1A', border: '#2A4A2A', text: '#6BCC6B', label: 'Base',  desc: 'Build aerobic foundation and movement patterns' },
  build: { bg: '#1A1A2A', border: '#2A2A4A', text: '#6B9EFF', label: 'Build', desc: 'Increase intensity and sport-specific volume' },
  peak:  { bg: '#2A1A1A', border: '#4A2A2A', text: '#FF6B6B', label: 'Peak',  desc: 'Race-specific training at near-maximum intensity' },
  taper: { bg: '#2A2A1A', border: '#4A4A2A', text: '#FFD700', label: 'Taper', desc: 'Reduce volume, maintain sharpness for race day' },
}

const INTENSITY_STYLE: Record<string, { label: string; color: string }> = {
  recovery: { label: 'Recovery', color: '#4CAF50' },
  low:      { label: 'Low',      color: '#8BC34A' },
  moderate: { label: 'Moderate', color: '#FF8C00' },
  high:     { label: 'High',     color: '#FF3B30' },
}

const SESSION_COLOR: Record<string, string> = {
  run: '#FF8C00', long_run: '#FF6B00', functional: '#FF3B30', hyrox_drills: '#CC2A22',
  lift: '#4CAF50', strength: '#2E7D32', wod: '#9C27B0', rest: '#2A2A2A', recovery: '#1A5A1A',
  ride: '#3B9EFF', swim: '#00BCD4', walk: '#9CA3AF',
}

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

function fmtFull(date: string) {
  return new Date(date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

type Json = Record<string, unknown>
const s = (v: unknown) => String(v ?? '')

function SessionDetail({ sessionJson }: { sessionJson: unknown }) {
  const data = sessionJson as Json
  const type = data?.type as string

  if (!type || type === 'rest') {
    return <p className="text-xs text-gray-500 italic">Rest day — active recovery only</p>
  }

  if (type === 'strength' || type === 'hypertrophy') {
    const exercises = (data.exercises as Json[]) ?? []
    return (
      <div className="space-y-1.5">
        {exercises.map((ex, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">{ex.name as string}</span>
            <span className="text-gray-500">
              {ex.sets as number} × {ex.reps as string}{ex.restSec ? ` · ${ex.restSec}s rest` : ''}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'circuit' || type === 'activation') {
    const exercises = (data.exercises as Json[]) ?? []
    const rounds = data.rounds as number
    return (
      <div className="space-y-1">
        {rounds && <p className="text-xs text-gray-500 mb-1">{rounds} rounds</p>}
        {exercises.map((ex, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">{ex.name as string}</span>
            <span className="text-gray-500">
              {ex.reps ? `${ex.reps} reps` : ex.meters ? `${ex.meters}m` : ex.durationSec ? `${ex.durationSec}s` : ''}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'run' || type === 'long_run') {
    const intervals = (data.intervals as Json[]) ?? []
    if (intervals.length > 0) {
      return (
        <div className="space-y-1">
          {!!data.warmupMin && <p className="text-xs text-gray-500">Warm-up: {s(data.warmupMin)} min</p>}
          {intervals.map((iv, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-medium">{iv.reps ? `${s(iv.reps)} ×` : ''} {iv.distanceM ? `${s(iv.distanceM)}m` : `${s(iv.durationMin)} min`}</span>
              <span className="text-gray-500">{iv.pace ? `@ ${s(iv.pace)}` : s(iv.effort)}</span>
            </div>
          ))}
          {!!data.cooldownMin && <p className="text-xs text-gray-500">Cool-down: {s(data.cooldownMin)} min</p>}
        </div>
      )
    }
    return (
      <div className="text-xs text-gray-400 space-y-0.5">
        {!!data.distanceKm && <p>Distance: {s(data.distanceKm)} km</p>}
        {!!data.durationMin && <p>Duration: {s(data.durationMin)} min</p>}
        {!!data.pace && <p>Target pace: {s(data.pace)}</p>}
        {!!data.effort && <p>Effort: {s(data.effort)}</p>}
      </div>
    )
  }

  if (type === 'ride') {
    return (
      <div className="text-xs text-gray-400 space-y-0.5">
        {!!data.distanceKm && <p>Distance: {s(data.distanceKm)} km</p>}
        {!!data.durationMin && <p>Duration: {s(data.durationMin)} min</p>}
        {!!data.effort && <p>Effort: {s(data.effort)}</p>}
        {!!data.zones && <p>Zones: {(data.zones as string[]).join(', ')}</p>}
      </div>
    )
  }

  if (type === 'hyrox') {
    const stations = (data.stations as Json[]) ?? []
    return (
      <div className="space-y-1">
        {!!data.runDistanceM && <p className="text-xs text-gray-500 mb-1">Run segments: {s(data.runDistanceM)}m each</p>}
        {stations.map((st, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">{s(st.name)}</span>
            <span className="text-gray-500">
              {st.reps ? `${s(st.reps)} reps` : st.meters ? `${s(st.meters)}m` : ''}
              {st.weightKg ? ` @ ${s(st.weightKg)}kg` : ''}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Fallback
  return <p className="text-xs text-gray-500">{type} session</p>
}

function SessionCard({ session, isExpanded, onToggle }: {
  session: SessionPreview
  isExpanded: boolean
  onToggle: () => void
}) {
  const color = SESSION_COLOR[session.sessionType] ?? '#555'
  const isRest = session.sessionType === 'rest'

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${isRest ? '#1A1A1A' : color + '40'}` }}>
      <button
        onClick={onToggle}
        disabled={isRest}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition cursor-pointer disabled:cursor-default"
        style={{ background: isRest ? '#111' : color + '12' }}
      >
        <div className="text-xs font-black w-8 flex-shrink-0" style={{ color: isRest ? '#444' : color }}>
          {DAY_NAMES[session.dayOfWeek]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{session.name}</div>
          <div className="text-xs text-gray-500">{session.durationMin} min{session.tss ? ` · TSS ${session.tss}` : ''}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ background: isRest ? '#1A1A1A' : color + '22', color: isRest ? '#555' : color }}>
            {session.sessionType.replace(/_/g, ' ')}
          </span>
          {!isRest && <span className="text-gray-600 text-xs">{isExpanded ? '▲' : '▼'}</span>}
        </div>
      </button>

      {isExpanded && !isRest && (
        <div className="px-4 py-3 border-t" style={{ background: color + '08', borderColor: color + '25' }}>
          <SessionDetail sessionJson={session.sessionJson} />
        </div>
      )}
    </div>
  )
}

export default function PlanHorizonPage() {
  const router = useRouter()
  const [data, setData] = useState<HorizonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  useEffect(() => {
    apiGet<HorizonData>('/api/plan/horizon')
      .then(setData)
      .catch(() => setError('Failed to load plan'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !data) return <p className="text-gray-400 text-center py-16">{error || 'No plan data'}</p>

  const phaseCounts = data.weeks.reduce<Record<string, number>>((acc, w) => {
    acc[w.phase] = (acc[w.phase] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">

      {/* Goal banner */}
      <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black mb-1">Training Horizon</h1>
            {data.goalDetail && <p className="text-base font-semibold text-white">{data.goalDetail}</p>}
            {data.goalDate
              ? <p className="text-sm text-gray-400 mt-0.5">Goal: {fmtFull(data.goalDate)}</p>
              : <p className="text-sm text-gray-400 mt-0.5">No goal date — showing 12 weeks. <button onClick={() => router.push('/dashboard/profile')} className="text-[#FF8C00] hover:underline cursor-pointer">Set one in your profile.</button></p>
            }
          </div>
          {data.goalDate && (
            <div className="text-right">
              <div className="text-3xl font-black text-white">{data.weeks[data.weeks.length - 1]?.daysToGoal ?? '—'}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">days to go</div>
            </div>
          )}
        </div>

        {/* Phase bar */}
        {data.weeks.length > 0 && (
          <div className="mt-4">
            <div className="flex rounded-full overflow-hidden h-2">
              {(['base', 'build', 'peak', 'taper'] as const).map(phase => {
                const count = phaseCounts[phase] ?? 0
                if (!count) return null
                return <div key={phase} style={{ width: `${(count / data.weeks.length) * 100}%`, background: PHASE_STYLE[phase].text, opacity: 0.7 }} />
              })}
            </div>
            <div className="flex gap-4 mt-2 flex-wrap">
              {(['base', 'build', 'peak', 'taper'] as const).map(phase => {
                const count = phaseCounts[phase] ?? 0
                if (!count) return null
                return <span key={phase} className="text-xs" style={{ color: PHASE_STYLE[phase].text }}>{PHASE_STYLE[phase].label} · {count}w</span>
              })}
            </div>
          </div>
        )}
      </div>

      {/* Week list */}
      <div className="space-y-2">
        {data.weeks.map(week => {
          const p = PHASE_STYLE[week.phase] ?? PHASE_STYLE.base
          const intensity = INTENSITY_STYLE[week.intensityLevel] ?? INTENSITY_STYLE.moderate
          const isOpen = expandedWeek === week.weekNumber
          const weekTss = week.sessions.reduce((sum, s) => sum + (s.tss ?? 0), 0)

          return (
            <div key={week.weekNumber} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isOpen ? p.border : '#1A1A1A'}` }}>

              {/* Week header */}
              <button
                onClick={() => setExpandedWeek(isOpen ? null : week.weekNumber)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 cursor-pointer transition hover:opacity-90 text-left"
                style={{ background: isOpen ? p.bg : '#111' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: week.isCurrent ? p.text + '22' : '#1A1A1A', color: week.isCurrent ? p.text : '#555' }}>
                    {week.weekNumber}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{fmt(week.weekStart)} – {fmt(week.weekEnd)}</span>
                      {week.isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: p.text + '22', color: p.text }}>This week</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{p.label} wk {week.weekInPhase}</span>
                      {weekTss > 0 && <span>· ~{weekTss} TSS</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {week.daysToGoal !== null && week.daysToGoal <= 14 && week.daysToGoal > 0 && (
                    <span className="text-xs text-yellow-400 font-semibold">{week.daysToGoal}d</span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: intensity.color, background: intensity.color + '22', border: `1px solid ${intensity.color}44` }}>
                    {intensity.label}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: p.bg, border: `1px solid ${p.border}`, color: p.text }}>
                    {p.label}
                  </span>
                  <span className="text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded sessions */}
              {isOpen && (
                <div className="px-3 pb-3 pt-2 space-y-2" style={{ background: p.bg + '66' }}>
                  {week.isCurrent && (
                    <p className="text-xs text-gray-500 px-1 mb-2">
                      Tap a session to see the exercises. Today&apos;s plan adapts intensity to your check-in score.
                    </p>
                  )}
                  {week.sessions.map(session => (
                    <SessionCard
                      key={session.dayOfWeek}
                      session={session}
                      isExpanded={expandedSession === `${week.weekNumber}-${session.dayOfWeek}`}
                      onToggle={() => setExpandedSession(
                        expandedSession === `${week.weekNumber}-${session.dayOfWeek}`
                          ? null
                          : `${week.weekNumber}-${session.dayOfWeek}`
                      )}
                    />
                  ))}
                  {week.isCurrent && (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="mt-1 w-full h-9 rounded-lg text-sm font-bold text-white cursor-pointer hover:opacity-90 transition"
                      style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
                    >
                      See Today&apos;s Adaptive Plan →
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
