'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { apiGet, apiPost } from '@/lib/api'
import { ActivityCard } from '@/components/activity-card'
import TrainingLoadChart from '@/components/TrainingLoadChart'
import type { WeeklyPlanResponse, SessionPlan, Activity, LogExercise, LogSet } from '@threshold/shared'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const SESSION_COLORS: Record<string, string> = {
  run: '#FF8C00',
  long_run: '#FF6B00',
  functional: '#FF3B30',
  hyrox_drills: '#CC2A22',
  lift: '#4CAF50',
  strength: '#2E7D32',
  wod: '#9C27B0',
  rest: '#2A2A2A',
  recovery: '#1A3A1A',
}

function sessionColor(type: string) {
  return SESSION_COLORS[type] ?? '#444'
}

type Json = Record<string, unknown>

// ─── Extract exercises from session JSON for pre-populating the log form ──────

function extractExercises(json: unknown): LogExercise[] {
  const data = json as Json
  const type = data.type as string

  if (type === 'circuit' || type === 'activation') {
    const exercises = (data.exercises as Json[]) ?? []
    return exercises.map(ex => ({
      name: ex.name as string,
      sets: [{}],
    }))
  }

  if (type === 'strength' || type === 'hypertrophy') {
    const exercises = (data.exercises as Json[]) ?? []
    return exercises.map(ex => {
      const sets = typeof ex.sets === 'number' ? ex.sets : 3
      return {
        name: ex.name as string,
        sets: Array.from({ length: sets }, () => ({})),
      }
    })
  }

  return []
}

// ─── Human-readable workout summary ──────────────────────────────────────────

function WorkoutDetails({ json }: { json: unknown }) {
  const data = json as Json
  const type = data.type as string

  if (type === 'rest') return null

  if (type === 'run') {
    const zone = data.targetZone as number
    const dur = data.durationMin as number
    const notes = data.notes as string | undefined
    return (
      <ul className="space-y-1">
        <li className="flex items-center gap-2"><Dot /><span>{dur} min — Zone {zone} {zone <= 2 ? '(easy, conversational)' : zone === 3 ? '(steady state)' : zone === 4 ? '(threshold)' : '(hard effort)'}</span></li>
        {notes && <li className="flex items-start gap-2"><Dot /><span>{notes}</span></li>}
      </ul>
    )
  }

  if (type === 'intervals') {
    const sets = (data.sets as Json[]) ?? []
    const repeats = data.repeats as number
    const rest = data.rest as string | undefined
    const warmup = data.warmup as string | undefined
    const cooldown = data.cooldown as string | undefined
    return (
      <ul className="space-y-1">
        {warmup && <li className="flex items-center gap-2"><Dot /><span>Warm-up: {warmup}</span></li>}
        {sets.map((s, i) => {
          const dur = s.durationMin ? `${s.durationMin} min` : s.durationSec ? `${s.durationSec}s` : s.distanceM ? `${s.distanceM}m` : ''
          return <li key={i} className="flex items-center gap-2"><Dot /><span>{repeats}× {dur} @ Zone {String(s.zone)}{rest ? ` — ${rest} rest` : ''}</span></li>
        })}
        {cooldown && <li className="flex items-center gap-2"><Dot /><span>Cool-down: {cooldown}</span></li>}
      </ul>
    )
  }

  if (type === 'circuit') {
    const rounds = data.rounds as number
    const exercises = (data.exercises as Json[]) ?? []
    return (
      <ul className="space-y-1">
        <li className="flex items-center gap-2"><Dot /><span className="font-semibold">{rounds} rounds:</span></li>
        {exercises.map((ex, i) => {
          const detail = ex.meters ? `${ex.meters}m` : ex.reps ? `${ex.reps} reps` : ex.distanceM ? `${ex.distanceM}m` : ex.durationSec ? `${ex.durationSec}s` : ''
          const load = ex.load ? ` (${ex.load})` : ex.weightKg ? ` @ ${ex.weightKg}kg` : ''
          return <li key={i} className="flex items-center gap-2 pl-3"><span className="text-gray-600">—</span><span>{ex.name as string}{detail ? `: ${detail}` : ''}{load}</span></li>
        })}
      </ul>
    )
  }

  if (type === 'simulation' || type === 'brick') {
    const stations = (data.stations as string[]) ?? []
    const runDist = data.runDistanceM as number | undefined
    const pace = data.pace as string | undefined
    return (
      <ul className="space-y-1">
        {runDist && <li className="flex items-center gap-2"><Dot /><span>{runDist}m run between each station</span></li>}
        {pace && <li className="flex items-center gap-2"><Dot /><span>Pace: {pace}</span></li>}
        <li className="flex items-start gap-2"><Dot /><span>Stations: {stations.join(' → ')}</span></li>
      </ul>
    )
  }

  if (type === 'drills') {
    const stations = (data.stations as string[]) ?? []
    const focus = data.focus as string | undefined
    const reps = data.repsPerStation as number | undefined
    return (
      <ul className="space-y-1">
        {focus && <li className="flex items-center gap-2"><Dot /><span>Focus: {focus}</span></li>}
        {reps && <li className="flex items-center gap-2"><Dot /><span>{reps} reps per station</span></li>}
        <li className="flex items-start gap-2"><Dot /><span>{stations.join(', ')}</span></li>
      </ul>
    )
  }

  if (type === 'strength' || type === 'hypertrophy') {
    const exercises = (data.exercises as Json[]) ?? []
    const scheme = data.scheme as string | undefined
    return (
      <ul className="space-y-1">
        {scheme && <li className="flex items-center gap-2"><Dot /><span>{scheme}</span></li>}
        {exercises.map((ex, i) => {
          const rpe = ex.rpe ? ` @ RPE ${ex.rpe}` : ex.rir !== undefined ? ` (${ex.rir} RIR)` : ''
          return (
            <li key={i} className="flex items-center gap-2">
              <span className="text-gray-600 pl-1">—</span>
              <span>{String(ex.sets)}× {String(ex.repsOrRange)} {ex.name as string}{rpe}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  if (type === 'emom') {
    const dur = data.durationMin as number
    const minutes = (data.minutes as Json[]) ?? []
    const stations = (data.stations as string[]) ?? []
    return (
      <ul className="space-y-1">
        <li className="flex items-center gap-2"><Dot /><span>EMOM {dur} min</span></li>
        {minutes.map((m, i) => <li key={i} className="flex items-center gap-2 pl-3"><span className="text-gray-600">—</span><span>Min {String(m.minute)}: {m.work as string}</span></li>)}
        {stations.length > 0 && <li className="flex items-start gap-2"><Dot /><span>{stations.join(' → ')}</span></li>}
      </ul>
    )
  }

  if (type === 'crossfit') {
    const strength = data.strength as Json | undefined
    const skill = data.skill as Json | undefined
    const wod = data.wod as Json | undefined
    return (
      <ul className="space-y-1">
        {strength && <li className="flex items-center gap-2"><Dot /><span>Strength: {strength.movement as string} — {strength.scheme as string}</span></li>}
        {skill && <li className="flex items-center gap-2"><Dot /><span>Skill: {skill.movement as string} ({skill.durationMin as number} min)</span></li>}
        {wod && (
          <>
            <li className="flex items-center gap-2"><Dot /><span className="font-semibold">WOD — {wod.name as string} ({wod.format as string}){wod.durationMin ? ` ${wod.durationMin} min` : ''}</span></li>
            {(wod.movements as Json[] | undefined)?.map((m, i) => (
              <li key={i} className="flex items-center gap-2 pl-3"><span className="text-gray-600">—</span><span>{String(m.reps)} {m.name as string}{m.weight ? ` @ ${String(m.weight)}` : m.weightKg ? ` @ ${String(m.weightKg)}kg` : ''}</span></li>
            ))}
            {wod.notes && <li className="flex items-start gap-2 pl-3"><span className="text-gray-600 text-xs italic">{wod.notes as string}</span></li>}
          </>
        )}
      </ul>
    )
  }

  if (type === 'cycling') {
    const format = data.format as string
    const dur = data.durationMin as number | undefined
    const zone = data.targetZone as number | undefined
    const intervals = (data.intervals as Json[]) ?? []
    const repeats = data.repeats as number | undefined
    const rest = data.rest as string | undefined
    const warmup = data.warmup as string | undefined
    const cooldown = data.cooldown as string | undefined
    return (
      <ul className="space-y-1">
        {format === 'endurance' && dur && zone && <li className="flex items-center gap-2"><Dot /><span>{dur} min — Zone {zone}</span></li>}
        {format === 'recovery' && dur && <li className="flex items-center gap-2"><Dot /><span>{dur} min easy spin — high cadence</span></li>}
        {warmup && <li className="flex items-center gap-2"><Dot /><span>Warm-up: {warmup}</span></li>}
        {intervals.map((iv, i) => {
          const pct = iv.intensityPct ? ` @ ${iv.intensityPct}% FTP` : iv.zone ? ` Zone ${iv.zone}` : ''
          return <li key={i} className="flex items-center gap-2"><Dot /><span>{repeats}× {String(iv.durationMin)} min{pct}{rest ? ` — ${rest} rest` : ''}</span></li>
        })}
        {cooldown && <li className="flex items-center gap-2"><Dot /><span>Cool-down: {cooldown}</span></li>}
        {!!data.notes && <li className="flex items-start gap-2"><Dot /><span className="text-gray-400 text-xs italic">{String(data.notes)}</span></li>}
      </ul>
    )
  }

  if (type === 'recovery' || type === 'activation') {
    const activities = (data.activities as string[]) ?? []
    const exercises = (data.exercises as Json[]) ?? []
    const desc = data.description as string | undefined
    const stations = (data.stations as string[]) ?? []
    const reps = data.repsPerStation as number | undefined
    return (
      <ul className="space-y-1">
        {desc && <li className="flex items-start gap-2"><Dot /><span>{desc}</span></li>}
        {activities.map((a, i) => <li key={i} className="flex items-center gap-2"><Dot /><span className="capitalize">{a}</span></li>)}
        {exercises.map((ex, i) => {
          const detail = ex.meters ? `${ex.meters}m` : ex.reps ? `${ex.reps} reps` : ex.durationSec ? `${ex.durationSec}s` : ''
          return <li key={i} className="flex items-center gap-2 pl-3"><span className="text-gray-600">—</span><span>{ex.name as string}{detail ? `: ${detail}` : ''}</span></li>
        })}
        {stations.length > 0 && <li className="flex items-start gap-2"><Dot /><span>{stations.join(', ')}{reps ? ` — ${reps} reps each` : ''}</span></li>}
      </ul>
    )
  }

  if (type === 'cardio') {
    const options = (data.options as string[]) ?? []
    const notes = data.notes as string | undefined
    return (
      <ul className="space-y-1">
        {options.map((o, i) => <li key={i} className="flex items-center gap-2"><Dot /><span>{o}</span></li>)}
        {notes && <li className="flex items-start gap-2"><Dot /><span className="text-gray-400">{notes}</span></li>}
      </ul>
    )
  }

  return null
}

function Dot() {
  return <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-50 mt-1.5" />
}

// ─── Readiness ring ───────────────────────────────────────────────────────────

function ReadinessRing({ score }: { score: number }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 75 ? '#4CAF50' : score >= 50 ? '#FF8C00' : '#FF3B30'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="112" height="112">
          <circle cx="56" cy="56" r={r} fill="none" stroke="#1E1E1E" strokeWidth="9" />
          <circle
            cx="56" cy="56" r={r} fill="none"
            stroke={color} strokeWidth="9"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="text-center z-10">
          <div className="text-3xl font-black leading-none" style={{ color }}>{score}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">/ 100</div>
        </div>
      </div>
      <span className="text-xs text-gray-500 uppercase tracking-widest">Readiness</span>
    </div>
  )
}

// ─── Workout logging modal ────────────────────────────────────────────────────

const EFFORT_LABELS = ['', 'Very Easy', 'Easy', 'Moderate', 'Hard', 'Max Effort']

function SetRow({ set, setNum, onChange, onRemove }: {
  set: LogSet
  setNum: number
  onChange: (s: LogSet) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-gray-600 text-xs w-8 text-right">{setNum}</span>
      <input
        type="number" min={0} placeholder="Reps"
        value={set.reps ?? ''}
        onChange={e => onChange({ ...set, reps: e.target.value ? parseInt(e.target.value) : undefined })}
        className="w-16 px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-700 focus:outline-none focus:border-[#FF3B30] text-center text-xs"
      />
      <input
        type="number" min={0} step={0.5} placeholder="kg"
        value={set.weightKg ?? ''}
        onChange={e => onChange({ ...set, weightKg: e.target.value ? parseFloat(e.target.value) : undefined })}
        className="w-16 px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-700 focus:outline-none focus:border-[#FF3B30] text-center text-xs"
      />
      <input
        type="number" min={0} placeholder="m"
        value={set.meters ?? ''}
        onChange={e => onChange({ ...set, meters: e.target.value ? parseInt(e.target.value) : undefined })}
        className="w-14 px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-700 focus:outline-none focus:border-[#FF3B30] text-center text-xs"
      />
      <input
        type="number" min={0} placeholder="s"
        value={set.durationSec ?? ''}
        onChange={e => onChange({ ...set, durationSec: e.target.value ? parseInt(e.target.value) : undefined })}
        className="w-14 px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-700 focus:outline-none focus:border-[#FF3B30] text-center text-xs"
      />
      <button type="button" onClick={onRemove} className="text-gray-700 hover:text-red-400 transition cursor-pointer px-1">×</button>
    </div>
  )
}

function WorkoutModal({ session, onClose, onSaved }: {
  session: SessionPlan
  onClose: () => void
  onSaved: () => void
}) {
  const [tab, setTab] = useState<'plan' | 'log'>('plan')
  const [exercises, setExercises] = useState<LogExercise[]>(() => extractExercises(session.sessionJson))
  const [durationMin, setDurationMin] = useState(session.estimatedDurationMin.toString())
  const [effortRating, setEffortRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  function addExercise() {
    setExercises(prev => [...prev, { name: '', sets: [{}] }])
  }

  function updateExercise(i: number, ex: LogExercise) {
    setExercises(prev => prev.map((e, idx) => idx === i ? ex : e))
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i))
  }

  function addSet(exIdx: number) {
    setExercises(prev => prev.map((ex, i) => i === exIdx ? { ...ex, sets: [...ex.sets, {}] } : ex))
  }

  function updateSet(exIdx: number, setIdx: number, s: LogSet) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex
      const sets = [...ex.sets]
      sets[setIdx] = s
      return { ...ex, sets }
    }))
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) }))
  }

  async function save() {
    setError('')
    setSaving(true)
    try {
      await apiPost('/api/workout-logs', {
        sessionType: session.sessionType,
        name: session.name,
        durationMin: durationMin ? parseInt(durationMin) : undefined,
        effortRating: effortRating || undefined,
        notes: notes || undefined,
        plannedJson: session.sessionJson,
        exercisesJson: exercises.filter(ex => ex.name),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div
        className="mt-auto w-full rounded-t-3xl flex flex-col"
        style={{ background: '#111', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-black text-white">{session.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{session.estimatedDurationMin} min · TSS {session.estimatedTss}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none cursor-pointer mt-1">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 mb-4 flex-shrink-0">
          {(['plan', 'log'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-bold transition cursor-pointer capitalize"
              style={{
                background: tab === t ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1A1A1A',
                color: tab === t ? '#fff' : '#6B7280',
              }}
            >
              {t === 'plan' ? 'The Plan' : 'Log It'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          {tab === 'plan' ? (
            <div className="text-xs text-gray-300 space-y-1">
              <WorkoutDetails json={session.sessionJson} />
              {session.description && (
                <p className="text-gray-500 mt-2 text-xs">{session.description}</p>
              )}
            </div>
          ) : (
            <div className="space-y-5">

              {/* Duration + effort */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Duration (min)</label>
                  <input
                    type="number" min={0} max={480}
                    value={durationMin}
                    onChange={e => setDurationMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30] text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Effort (1–5)</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEffortRating(effortRating === n ? 0 : n)}
                        className="flex-1 h-9 rounded-lg font-bold text-sm transition cursor-pointer"
                        style={{
                          background: effortRating === n ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1A1A1A',
                          border: `1px solid ${effortRating === n ? '#FF3B30' : '#2A2A2A'}`,
                          color: effortRating === n ? '#fff' : '#6B7280',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {effortRating > 0 && <p className="text-[10px] text-gray-600 mt-1 text-center">{EFFORT_LABELS[effortRating]}</p>}
                </div>
              </div>

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold">Exercises</label>
                  <button
                    type="button"
                    onClick={addExercise}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', color: '#ccc' }}
                  >
                    + Add
                  </button>
                </div>

                {exercises.length === 0 && (
                  <p className="text-xs text-gray-600 text-center py-2">No exercises — add them above or just save with duration & effort.</p>
                )}

                <div className="space-y-4">
                  {exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="rounded-xl p-3" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Exercise name"
                          value={ex.name}
                          onChange={e => updateExercise(exIdx, { ...ex, name: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] font-semibold text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeExercise(exIdx)}
                          className="text-gray-600 hover:text-red-400 transition cursor-pointer text-xs"
                        >
                          Remove
                        </button>
                      </div>

                      {ex.sets.length > 0 && (
                        <div className="mb-2">
                          <div className="flex gap-1.5 text-[10px] text-gray-600 uppercase tracking-wide mb-1.5 ml-9">
                            <span className="w-16 text-center">Reps</span>
                            <span className="w-16 text-center">kg</span>
                            <span className="w-14 text-center">m</span>
                            <span className="w-14 text-center">sec</span>
                          </div>
                          <div className="space-y-1.5">
                            {ex.sets.map((s, si) => (
                              <SetRow
                                key={si}
                                set={s}
                                setNum={si + 1}
                                onChange={updated => updateSet(exIdx, si, updated)}
                                onRemove={() => removeSet(exIdx, si)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => addSet(exIdx)}
                        className="text-xs text-gray-500 hover:text-white transition cursor-pointer mt-1 ml-9"
                      >
                        + Add set
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] resize-none"
                  rows={2}
                  placeholder="How did it go? Any PRs?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  maxLength={1000}
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={save}
                disabled={saving}
                className="w-full h-12 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
              >
                {saving ? 'Saving...' : 'Save Workout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onStart }: { session: SessionPlan; onStart: (s: SessionPlan) => void }) {
  const [open, setOpen] = useState(false)
  const color = sessionColor(session.sessionType)
  const isRest = session.sessionType === 'rest'

  const typeLabel = session.sessionType
    .split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div
      className={`rounded-xl p-4 transition-all ${isRest ? 'opacity-35' : 'cursor-pointer hover:brightness-110'}`}
      style={{ background: `${color}14`, border: `1px solid ${color}33` }}
      onClick={() => !isRest && setOpen(o => !o)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{typeLabel}</span>
            {session.isSwapped && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Adapted
              </span>
            )}
          </div>
          <p className="font-semibold text-white leading-snug">{session.name}</p>
          {session.description && (
            <p className="text-xs text-gray-500 mt-0.5">{session.description}</p>
          )}
        </div>
        {!isRest && (
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-white">{session.estimatedDurationMin} min</div>
            <div className="text-xs text-gray-500 mt-0.5" title="Training Stress Score — 100 = 1 hour at threshold effort">TSS {session.estimatedTss}</div>
          </div>
        )}
      </div>

      {/* Collapsed preview */}
      {!open && !isRest && (
        <div className="mt-2 text-xs text-gray-500 line-clamp-1">
          {getPreview(session.sessionJson)}
        </div>
      )}

      {/* Expanded details */}
      {open && (
        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-300 space-y-1">
          <WorkoutDetails json={session.sessionJson} />
        </div>
      )}

      {/* Start workout button + tap hint */}
      {!isRest && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-gray-600">{open ? 'tap to collapse' : 'tap for details'}</span>
          {open && (
            <button
              onClick={e => { e.stopPropagation(); onStart(session) }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90 cursor-pointer"
              style={{ background: `linear-gradient(135deg, #FF3B30, #FF8C00)` }}
            >
              Start Workout →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function getPreview(json: unknown): string {
  const data = json as Json
  const type = data.type as string
  if (type === 'run') return `${data.durationMin} min · Zone ${data.targetZone}`
  if (type === 'intervals') {
    const sets = data.sets as Json[]
    const s = sets?.[0]
    const dur = s?.durationMin ? `${s.durationMin} min` : s?.distanceM ? `${s.distanceM}m` : ''
    return `${data.repeats}× ${dur} @ Zone ${s?.zone}`
  }
  if (type === 'circuit') {
    const ex = (data.exercises as Json[])?.[0]
    return `${data.rounds} rounds · ${ex?.name ?? ''}, ...`
  }
  if (type === 'simulation' || type === 'brick') return `${(data.stations as string[])?.length} stations · ${data.pace} pace`
  if (type === 'drills') return `${(data.stations as string[])?.length} stations · ${data.focus} focus`
  if (type === 'strength' || type === 'hypertrophy') {
    const ex = (data.exercises as Json[])?.[0]
    return `${ex?.sets}× ${ex?.repsOrRange} ${ex?.name ?? ''}, ...`
  }
  if (type === 'cycling') return data.format === 'endurance' ? `${data.durationMin} min · Zone ${data.targetZone}` : `${data.repeats}× intervals`
  if (type === 'crossfit') {
    const wod = data.wod as Json
    return wod ? `WOD: ${wod.name} (${wod.format})` : 'Strength + WOD'
  }
  if (type === 'recovery' || type === 'activation') return (data.activities as string[])?.[0] ?? 'Light movement'
  if (type === 'cardio') return (data.options as string[])?.[0] ?? 'Cardio'
  return ''
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [activeSession, setActiveSession] = useState<SessionPlan | null>(null)
  const [savedToast, setSavedToast] = useState(false)

  useEffect(() => {
    apiGet<WeeklyPlanResponse>('/api/plan/weekly')
      .then(setPlan)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load plan'))
      .finally(() => setLoading(false))

    apiGet<Activity[]>('/api/activities/recent')
      .then(setRecentActivities)
      .catch(() => {})
  }, [])

  function handleSaved() {
    setActiveSession(null)
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 mb-2">{error || 'No plan available'}</p>
        <p className="text-xs text-gray-600">Complete your morning check-in to generate today's readiness score.</p>
        <a href="/dashboard/checkin" className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}>
          Do check-in →
        </a>
      </div>
    )
  }

  const { weeklyPlan, readinessScore, phase } = plan
  const activeSessions = weeklyPlan.sessions.filter(s => s.sessionType !== 'rest')
  const totalMinutes = weeklyPlan.sessions.reduce((s, x) => s + x.estimatedDurationMin, 0)

  return (
    <>
      {savedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg" style={{ background: '#1E3A1E', border: '1px solid #2A5A2A', color: '#6BCC6B' }}>
          Workout logged!
        </div>
      )}

      {activeSession && (
        <WorkoutModal
          session={activeSession}
          onClose={() => setActiveSession(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="pt-1">
            <h1 className="text-2xl font-black">This Week</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {weeklyPlan.templateName} · <span className="capitalize">{phase} phase</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                weeklyPlan.intensityLevel === 'recovery' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                weeklyPlan.intensityLevel === 'low'      ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                weeklyPlan.intensityLevel === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {weeklyPlan.intensityLevel} intensity
              </span>
              <span className="text-xs text-gray-500">{weeklyPlan.reason}</span>
            </div>
          </div>
          <ReadinessRing score={readinessScore} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
            <div className="text-xl font-black text-white">{activeSessions.length}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Sessions</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: '#141414', border: '1px solid #1E1E1E' }} title="Training Stress Score — total weekly training load. 100 TSS ≈ 1 hour at threshold effort.">
            <div className="text-xl font-black text-white">{weeklyPlan.weeklyTssTarget}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Target TSS</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: '#141414', border: '1px solid #1E1E1E' }} title="Total planned training time this week">
            <div className="text-xl font-black text-white">{totalMinutes}m</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Minutes</div>
          </div>
        </div>

        {/* Week sessions */}
        <div className="space-y-2">
          {weeklyPlan.sessions.map((session, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-9 pt-4 flex-shrink-0 text-center">
                <div className="text-xs font-bold text-gray-500 uppercase">{DAYS[session.dayOfWeek]}</div>
              </div>
              <div className="flex-1">
                <SessionCard session={session} onStart={setActiveSession} />
              </div>
            </div>
          ))}
        </div>

        {/* Training load chart */}
        <TrainingLoadChart />

        {/* Recent activities */}
        {recentActivities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white">Recent Activities</h2>
              <Link href="/dashboard/activities" className="text-xs text-[#FF8C00] hover:underline">
                View all →
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
              {recentActivities.map(activity => (
                <ActivityCard key={activity.id} activity={activity} compact />
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
