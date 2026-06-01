'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet, apiPost, apiDelete } from '@/lib/api'

interface SessionPreview {
  dayOfWeek: number
  name: string
  sessionType: string
  durationMin: number
  tss: number
  sessionJson: unknown
  override: { action: string; reason?: string | null } | null
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

interface Alternative {
  sessionType: string
  name: string
  durationMin: number
  tss: number
  sessionJson: unknown
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

const SESSION_TYPES = [
  { value: 'run', label: 'Run' },
  { value: 'long_run', label: 'Long Run' },
  { value: 'strength', label: 'Strength' },
  { value: 'functional', label: 'Functional' },
  { value: 'hyrox_drills', label: 'HYROX Drills' },
  { value: 'wod', label: 'WOD' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'ride', label: 'Ride' },
  { value: 'swim', label: 'Swim' },
  { value: 'walk', label: 'Walk' },
]

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
  if (!type || type === 'rest') return <p className="text-xs text-gray-500 italic">Rest day — active recovery only</p>
  if (type === 'strength' || type === 'hypertrophy') {
    const exercises = (data.exercises as Json[]) ?? []
    return (
      <div className="space-y-1.5">
        {exercises.map((ex, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">{ex.name as string}</span>
            <span className="text-gray-500">{ex.sets as number} × {ex.reps as string}{ex.restSec ? ` · ${ex.restSec}s rest` : ''}</span>
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
            <span className="text-gray-500">{ex.reps ? `${ex.reps} reps` : ex.meters ? `${ex.meters}m` : ex.durationSec ? `${ex.durationSec}s` : ''}</span>
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
            <span className="text-gray-500">{st.reps ? `${s(st.reps)} reps` : st.meters ? `${s(st.meters)}m` : ''}{st.weightKg ? ` @ ${s(st.weightKg)}kg` : ''}</span>
          </div>
        ))}
      </div>
    )
  }
  return <p className="text-xs text-gray-500">{type} session</p>
}

// ─── Override Action Sheet ────────────────────────────────────────────────────

type OverrideAction = 'menu' | 'skip' | 'swap' | 'move' | 'custom'

interface OverrideSheetProps {
  session: SessionPreview
  weekStart: string
  onClose: () => void
  onSaved: () => void
}

function OverrideSheet({ session, weekStart, onClose, onSaved }: OverrideSheetProps) {
  const [view, setView] = useState<OverrideAction>('menu')
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [loadingAlts, setLoadingAlts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState('')
  const [moveToDay, setMoveToDay] = useState<number>(session.dayOfWeek)
  // Custom session fields
  const [customName, setCustomName] = useState('')
  const [customType, setCustomType] = useState('run')
  const [customDuration, setCustomDuration] = useState('30')

  const isSkipped = session.override?.action === 'skip'

  async function loadAlternatives() {
    setLoadingAlts(true)
    try {
      const data = await apiGet<Alternative[]>(`/api/plan/alternatives?sessionType=${session.sessionType}`)
      setAlternatives(data)
    } catch {
      setAlternatives([])
    } finally {
      setLoadingAlts(false)
    }
  }

  async function saveOverride(body: Record<string, unknown>) {
    setSaving(true)
    try {
      await apiPost('/api/plan/override', { weekStart, dayOfWeek: session.dayOfWeek, ...body })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function removeOverride() {
    setSaving(true)
    try {
      await apiDelete('/api/plan/override', { weekStart, dayOfWeek: session.dayOfWeek })
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-x border-[#2A2A2A] pb-8" style={{ background: '#141414' }}>
        <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mt-4 mb-4" />

        {/* Session header */}
        <div className="px-5 mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{DAY_NAMES[session.dayOfWeek]}</p>
          <p className="text-base font-bold text-white">{session.name}</p>
          {session.override && (
            <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: '#FF8C0022', color: '#FF8C00' }}>
              {session.override.action} override active
            </span>
          )}
        </div>

        {/* ── Menu view ── */}
        {view === 'menu' && (
          <div className="px-4 space-y-2">
            {!isSkipped && (
              <>
                <ActionBtn icon="⊘" label="Skip this session" sub="Mark as rest day" onClick={() => setView('skip')} />
                <ActionBtn icon="↔" label="Swap for alternative" sub="Replace with a different workout" onClick={() => { setView('swap'); loadAlternatives() }} />
                <ActionBtn icon="→" label="Move to another day" sub="Shift this session to a different day" onClick={() => setView('move')} />
                <ActionBtn icon="✎" label="Custom session" sub="Replace with your own workout" onClick={() => setView('custom')} />
              </>
            )}
            {session.override && (
              <button
                onClick={removeOverride}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold border border-[#FF3B30]/40 text-[#FF3B30] cursor-pointer hover:bg-[#FF3B30]/10 transition"
              >
                Remove override — restore original
              </button>
            )}
          </div>
        )}

        {/* ── Skip view ── */}
        {view === 'skip' && (
          <div className="px-5 space-y-4">
            <p className="text-sm text-gray-400">This session will be marked as a rest day. You can undo this any time.</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reason (optional)</label>
              <input
                className="w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30]"
                placeholder="e.g. travel, injury, fatigue..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <SaveBtn saving={saving} onClick={() => saveOverride({ action: 'skip', reason: reason || null })} />
          </div>
        )}

        {/* ── Swap view ── */}
        {view === 'swap' && (
          <div className="px-5 space-y-3">
            <p className="text-xs text-gray-500 mb-2">Alternatives based on your equipment and discipline</p>
            {loadingAlts ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alternatives.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No alternatives found. Try setting your equipment in Profile.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alternatives.map((alt, i) => (
                  <button
                    key={i}
                    disabled={saving}
                    onClick={() => saveOverride({ action: 'swap', swapName: alt.name, swapType: alt.sessionType, swapDurationMin: alt.durationMin, swapJson: alt.sessionJson })}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition hover:opacity-80"
                    style={{ background: (SESSION_COLOR[alt.sessionType] ?? '#555') + '15', border: `1px solid ${(SESSION_COLOR[alt.sessionType] ?? '#555')}40` }}
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{alt.name}</p>
                      <p className="text-xs text-gray-500">{alt.sessionType.replace(/_/g, ' ')} · {alt.durationMin} min</p>
                    </div>
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="text-gray-400 text-xs">Select →</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Move view ── */}
        {view === 'move' && (
          <div className="px-5 space-y-4">
            <p className="text-sm text-gray-400">Move this session to a different day this week.</p>
            <div className="grid grid-cols-7 gap-1">
              {[1,2,3,4,5,6,7].map(d => (
                <button
                  key={d}
                  onClick={() => setMoveToDay(d)}
                  className="py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                  style={{
                    background: moveToDay === d ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1E1E1E',
                    color: moveToDay === d ? '#fff' : '#9CA3AF',
                    border: `1px solid ${moveToDay === d ? 'transparent' : '#2A2A2A'}`,
                  }}
                >
                  {DAY_NAMES[d]}
                </button>
              ))}
            </div>
            <SaveBtn saving={saving} onClick={() => saveOverride({ action: 'move', moveToDay })} disabled={moveToDay === session.dayOfWeek} />
          </div>
        )}

        {/* ── Custom view ── */}
        {view === 'custom' && (
          <div className="px-5 space-y-4">
            <p className="text-sm text-gray-400">Define your own session to replace this one.</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Session name</label>
              <input
                className="w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30]"
                placeholder="e.g. Beach run, Gym session..."
                value={customName}
                onChange={e => setCustomName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30] cursor-pointer"
                >
                  {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30]"
                  value={customDuration}
                  onChange={e => setCustomDuration(e.target.value)}
                  min={1} max={300}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
              <input
                className="w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30]"
                placeholder="Any details about this session..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <SaveBtn
              saving={saving}
              disabled={!customName.trim()}
              onClick={() => saveOverride({
                action: 'custom',
                customName: customName.trim(),
                customType,
                customDurationMin: parseInt(customDuration) || 30,
                customJson: { type: customType, notes: reason },
                reason: reason || null,
              })}
            />
          </div>
        )}
      </div>
    </>
  )
}

function ActionBtn({ icon, label, sub, onClick }: { icon: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition hover:opacity-80"
      style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
    >
      <span className="text-xl w-7 text-center flex-shrink-0">{icon}</span>
      <div className="text-left">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      <span className="ml-auto text-gray-600 text-xs">›</span>
    </button>
  )
}

function SaveBtn({ saving, onClick, disabled }: { saving: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="w-full h-12 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
      style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
    >
      {saving ? 'Saving...' : 'Save'}
    </button>
  )
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, weekStart, isExpanded, onToggle, onOverride }: {
  session: SessionPreview
  weekStart: string
  isExpanded: boolean
  onToggle: () => void
  onOverride: () => void
}) {
  const color = SESSION_COLOR[session.sessionType] ?? '#555'
  const isRest = session.sessionType === 'rest'
  const hasOverride = !!session.override

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${hasOverride ? '#FF8C0040' : isRest ? '#1A1A1A' : color + '40'}` }}>
      <div
        className="flex items-center gap-2"
        style={{ background: hasOverride ? '#FF8C0008' : isRest ? '#111' : color + '12' }}
      >
        <button
          onClick={isRest ? undefined : onToggle}
          disabled={isRest}
          className="flex-1 flex items-center gap-3 px-3 py-2.5 text-left transition cursor-pointer disabled:cursor-default min-w-0"
        >
          <div className="text-xs font-black w-8 flex-shrink-0" style={{ color: isRest ? '#444' : color }}>
            {DAY_NAMES[session.dayOfWeek]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-white truncate">{session.name}</div>
              {hasOverride && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: '#FF8C0022', color: '#FF8C00' }}>
                  {session.override!.action}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">{session.durationMin > 0 ? `${session.durationMin} min` : 'Rest'}{session.tss ? ` · TSS ${session.tss}` : ''}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded hidden sm:block"
              style={{ background: isRest ? '#1A1A1A' : color + '22', color: isRest ? '#555' : color }}>
              {session.sessionType.replace(/_/g, ' ')}
            </span>
            {!isRest && <span className="text-gray-600 text-xs">{isExpanded ? '▲' : '▼'}</span>}
          </div>
        </button>

        {/* Override trigger — dots menu */}
        <button
          onClick={onOverride}
          className="flex-shrink-0 px-3 py-2.5 text-gray-500 hover:text-white transition cursor-pointer text-lg leading-none"
          title="Change this session"
        >
          ···
        </button>
      </div>

      {isExpanded && !isRest && (
        <div className="px-4 py-3 border-t" style={{ background: color + '08', borderColor: color + '25' }}>
          {session.override?.reason && (
            <p className="text-xs text-[#FF8C00] mb-2 italic">{session.override.reason}</p>
          )}
          <SessionDetail sessionJson={session.sessionJson} />
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanHorizonPage() {
  const router = useRouter()
  const [data, setData] = useState<HorizonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [overrideTarget, setOverrideTarget] = useState<{ session: SessionPreview; weekStart: string } | null>(null)

  function loadData() {
    setLoading(true)
    apiGet<HorizonData>('/api/plan/horizon')
      .then(setData)
      .catch(() => setError('Failed to load plan'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

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
          const overrideCount = week.sessions.filter(s => s.override).length

          return (
            <div key={week.weekNumber} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isOpen ? p.border : '#1A1A1A'}` }}>
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
                      {overrideCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FF8C0022', color: '#FF8C00' }}>{overrideCount} changed</span>
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded hidden sm:block" style={{ color: intensity.color, background: intensity.color + '22', border: `1px solid ${intensity.color}44` }}>
                    {intensity.label}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg hidden sm:block" style={{ background: p.bg, border: `1px solid ${p.border}`, color: p.text }}>
                    {p.label}
                  </span>
                  <span className="text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 pt-2 space-y-2" style={{ background: p.bg + '66' }}>
                  {week.isCurrent && (
                    <p className="text-xs text-gray-500 px-1 mb-2">
                      Tap a session to see exercises. Tap ··· to skip, swap, move or customise.
                    </p>
                  )}
                  {week.sessions.map(session => (
                    <SessionCard
                      key={session.dayOfWeek}
                      session={session}
                      weekStart={week.weekStart}
                      isExpanded={expandedSession === `${week.weekNumber}-${session.dayOfWeek}`}
                      onToggle={() => setExpandedSession(
                        expandedSession === `${week.weekNumber}-${session.dayOfWeek}` ? null : `${week.weekNumber}-${session.dayOfWeek}`
                      )}
                      onOverride={() => setOverrideTarget({ session, weekStart: week.weekStart })}
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

      {/* Override sheet */}
      {overrideTarget && (
        <OverrideSheet
          session={overrideTarget.session}
          weekStart={overrideTarget.weekStart}
          onClose={() => setOverrideTarget(null)}
          onSaved={loadData}
        />
      )}
    </div>
  )
}
