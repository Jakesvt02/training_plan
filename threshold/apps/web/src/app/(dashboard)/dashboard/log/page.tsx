'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiDelete, apiPut } from '@/lib/api'
import type { WorkoutLog, WorkoutLogsResponse, LogExercise } from '@threshold/shared'

const EFFORT_LABELS = ['', 'Very Easy', 'Easy', 'Moderate', 'Hard', 'Max Effort']
const EFFORT_COLORS = ['', '#4CAF50', '#8BC34A', '#FF8C00', '#FF6B00', '#FF3B30']

type Json = Record<string, unknown>

// ─── Planned workout summary (reused from dashboard) ─────────────────────────

function PlannedSummary({ json }: { json: unknown }) {
  if (!json) return <p className="text-gray-600 text-xs italic">No plan snapshot saved</p>
  const data = json as Json
  const type = data.type as string

  if (type === 'rest') return <p className="text-gray-500 text-xs">Rest day</p>

  const lines: string[] = []

  if (type === 'run') {
    lines.push(`${data.durationMin} min · Zone ${data.targetZone}`)
    if (data.notes) lines.push(String(data.notes))
  } else if (type === 'intervals') {
    const sets = (data.sets as Json[]) ?? []
    const s = sets[0]
    const dur = s?.durationMin ? `${s.durationMin} min` : s?.durationSec ? `${s.durationSec}s` : s?.distanceM ? `${s.distanceM}m` : ''
    lines.push(`${data.repeats}× ${dur} @ Zone ${s?.zone}`)
    if (data.rest) lines.push(`Rest: ${data.rest}`)
  } else if (type === 'circuit') {
    lines.push(`${data.rounds} rounds`)
    const exercises = (data.exercises as Json[]) ?? []
    exercises.forEach(ex => {
      const detail = ex.meters ? `${ex.meters}m` : ex.reps ? `${ex.reps} reps` : ex.distanceM ? `${ex.distanceM}m` : ex.durationSec ? `${ex.durationSec}s` : ''
      const load = ex.load ? ` (${ex.load})` : ''
      lines.push(`${ex.name as string}${detail ? ': ' + detail : ''}${load}`)
    })
  } else if (type === 'simulation' || type === 'brick') {
    const stations = (data.stations as string[]) ?? []
    if (data.runDistanceM) lines.push(`${data.runDistanceM}m run between stations`)
    if (data.pace) lines.push(`Pace: ${data.pace}`)
    lines.push(stations.join(' → '))
  } else if (type === 'drills') {
    const stations = (data.stations as string[]) ?? []
    if (data.focus) lines.push(`Focus: ${data.focus}`)
    lines.push(stations.join(', '))
  } else if (type === 'strength' || type === 'hypertrophy') {
    const exercises = (data.exercises as Json[]) ?? []
    exercises.forEach(ex => {
      const rpe = ex.rpe ? ` @ RPE ${ex.rpe}` : ''
      lines.push(`${ex.sets}× ${ex.repsOrRange} ${ex.name as string}${rpe}`)
    })
  } else if (type === 'emom') {
    lines.push(`EMOM ${data.durationMin} min`)
    const stations = (data.stations as string[]) ?? []
    if (stations.length) lines.push(stations.join(' → '))
  } else if (type === 'recovery' || type === 'activation') {
    const activities = (data.activities as string[]) ?? []
    const exercises = (data.exercises as Json[]) ?? []
    activities.forEach(a => lines.push(a))
    exercises.forEach(ex => {
      const detail = ex.meters ? `${ex.meters}m` : ex.reps ? `${ex.reps} reps` : ''
      lines.push(`${ex.name as string}${detail ? ': ' + detail : ''}`)
    })
  }

  return (
    <ul className="space-y-1">
      {lines.map((l, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
          <span className="text-gray-700 mt-0.5 flex-shrink-0">—</span>
          <span>{l}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Actual logged exercises ──────────────────────────────────────────────────

function LoggedExercises({ exercises }: { exercises: LogExercise[] }) {
  if (!exercises.length) return <p className="text-xs text-gray-600 italic">No exercises logged</p>

  return (
    <div className="space-y-3">
      {exercises.map((ex, i) => (
        <div key={i}>
          <p className="text-xs font-semibold text-white mb-1">{ex.name}</p>
          <div className="space-y-1">
            {ex.sets.map((s, j) => {
              const parts: string[] = []
              if (s.reps) parts.push(`${s.reps} reps`)
              if (s.weightKg) parts.push(`${s.weightKg} kg`)
              if (s.meters) parts.push(`${s.meters} m`)
              if (s.durationSec) parts.push(`${s.durationSec}s`)
              return (
                <div key={j} className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="text-gray-600 w-10">Set {j + 1}</span>
                  <span>{parts.length ? parts.join(' · ') : '—'}</span>
                  {s.notes && <span className="text-gray-600 italic">{s.notes}</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Log entry card ───────────────────────────────────────────────────────────

function LogCard({ log, onDelete, onUpdate }: { log: WorkoutLog; onDelete: (id: string) => void; onUpdate: (updated: WorkoutLog) => void }) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [noteText, setNoteText] = useState(log.notes ?? '')
  const [editEffort, setEditEffort] = useState(log.effortRating ?? 0)
  const [saving, setSaving] = useState(false)

  const exercises = log.exercisesJson as LogExercise[]
  const dateStr = new Date(log.date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  const effort = log.effortRating ?? 0
  const effortColor = EFFORT_COLORS[effort] ?? '#888'

  async function del() {
    if (!confirm('Delete this log?')) return
    setDeleting(true)
    try {
      await apiDelete(`/api/workout-logs/${log.id}`)
      onDelete(log.id)
    } finally {
      setDeleting(false)
    }
  }

  async function saveNotes() {
    setSaving(true)
    try {
      const updated = await apiPut<WorkoutLog>(`/api/workout-logs/${log.id}`, {
        notes: noteText || null,
        effortRating: editEffort || null,
      })
      onUpdate(updated)
      setEditingNotes(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>

      {/* Summary row — always visible */}
      <div
        className="p-4 cursor-pointer hover:brightness-105 transition"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-0.5">{dateStr}</p>
            <p className="font-bold text-white leading-snug">{log.name || log.sessionType}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {log.durationMin && (
                <span className="text-xs text-gray-400">{log.durationMin} min</span>
              )}
              {effort > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${effortColor}20`, color: effortColor, border: `1px solid ${effortColor}40` }}>
                  {EFFORT_LABELS[effort]}
                </span>
              )}
              {exercises.length > 0 && (
                <span className="text-xs text-gray-600">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          <span className="text-gray-600 text-sm flex-shrink-0 mt-1">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded: plan vs actual */}
      {open && (
        <div className="border-t border-[#1E1E1E]">
          <div className="grid grid-cols-2 divide-x divide-[#1E1E1E]">

            {/* The Plan */}
            <div className="p-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">The Plan</p>
              <PlannedSummary json={log.plannedJson} />
            </div>

            {/* What You Did */}
            <div className="p-4">
              <p className="text-[10px] font-bold text-[#FF8C00] uppercase tracking-widest mb-3">What You Did</p>
              {log.durationMin && (
                <p className="text-xs text-gray-400 mb-2">{log.durationMin} min{effort > 0 ? ` · ${EFFORT_LABELS[effort]}` : ''}</p>
              )}
              <LoggedExercises exercises={exercises} />
              {log.notes && !editingNotes && (
                <p className="text-xs text-gray-500 mt-3 italic">"{log.notes}"</p>
              )}
            </div>
          </div>

          {/* Notes editor */}
          {editingNotes ? (
            <div className="px-4 py-4 border-t border-[#1E1E1E] space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Training Notes</p>

              {/* Effort rating */}
              <div>
                <p className="text-xs text-gray-400 mb-2">How did it feel?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setEditEffort(n)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                      style={{
                        background: editEffort === n ? EFFORT_COLORS[n] + '33' : '#1E1E1E',
                        border: `1px solid ${editEffort === n ? EFFORT_COLORS[n] : '#2A2A2A'}`,
                        color: editEffort === n ? EFFORT_COLORS[n] : '#6B7280',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {editEffort > 0 && (
                  <p className="text-xs mt-1" style={{ color: EFFORT_COLORS[editEffort] }}>{EFFORT_LABELS[editEffort]}</p>
                )}
              </div>

              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="How did the session go? What felt good, what was hard, anything to note for next time..."
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] resize-none transition"
              />
              <div className="flex gap-2">
                <button onClick={saveNotes} disabled={saving}
                  className="flex-1 h-9 rounded-xl text-sm font-bold text-white cursor-pointer hover:opacity-90 disabled:opacity-50 transition"
                  style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}>
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>
                <button onClick={() => { setEditingNotes(false); setNoteText(log.notes ?? ''); setEditEffort(log.effortRating ?? 0) }}
                  className="px-4 h-9 rounded-xl text-sm text-gray-400 cursor-pointer hover:text-white transition"
                  style={{ background: '#1E1E1E', border: '1px solid #2A2A2A' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-[#1E1E1E] flex items-center justify-between">
              <button
                onClick={() => setEditingNotes(true)}
                className="text-xs text-gray-500 hover:text-[#FF8C00] transition cursor-pointer"
              >
                {log.notes ? '✏️ Edit notes' : '+ Add training notes'}
              </button>
              <button onClick={del} disabled={deleting}
                className="text-xs text-gray-600 hover:text-red-400 transition cursor-pointer">
                {deleting ? 'Deleting...' : 'Delete log'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutHistoryPage() {
  const [data, setData] = useState<WorkoutLogsResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const result = await apiGet<WorkoutLogsResponse>(`/api/workout-logs?page=${p}&limit=20`)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  function handleDelete(id: string) {
    setData(prev => prev ? { ...prev, logs: prev.logs.filter(l => l.id !== id), total: prev.total - 1 } : prev)
  }

  function handleUpdate(updated: WorkoutLog) {
    setData(prev => prev ? { ...prev, logs: prev.logs.map(l => l.id === updated.id ? updated : l) } : prev)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">Workout History</h1>
        {data && (
          <p className="text-gray-400 text-sm mt-0.5">
            {data.total} session{data.total !== 1 ? 's' : ''} logged — tap any to see plan vs actual
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.logs.length ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-gray-400">No workouts logged yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Tap a session on the dashboard and hit "Start Workout" to log your first one.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.logs.map(log => (
              <LogCard key={log.id} log={log} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-30"
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#ccc' }}
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {data.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-30"
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#ccc' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
