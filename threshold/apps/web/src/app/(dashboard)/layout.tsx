'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuth, getUser } from '@/lib/auth'
import { apiPost } from '@/lib/api'
import type { StoredUser } from '@/lib/auth'
import type { LogExercise, LogSet } from '@threshold/shared'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/dashboard/checkin', label: 'Check-in', icon: '◎' },
  { href: '/dashboard/plan', label: 'Plan', icon: '▦' },
  { href: '/dashboard/activities', label: 'Activities', icon: '◈' },
  { href: '/dashboard/log', label: 'History', icon: '≡' },
  { href: '/dashboard/measurements', label: 'Body', icon: '⊡' },
  { href: '/dashboard/nutrition', label: 'Nutrition', icon: '◑' },
  { href: '/dashboard/integrations', label: 'Integrations', icon: '↺' },
  { href: '/dashboard/profile', label: 'Profile', icon: '◉' },
]

const BOTTOM_PRIMARY = ['/dashboard', '/dashboard/checkin', '/dashboard/plan', '/dashboard/nutrition']

const DISTANCE_TYPES = new Set(['run', 'long_run', 'ride', 'swim', 'cardio'])

const SESSION_TYPES = [
  { value: 'run', label: 'Run' },
  { value: 'long_run', label: 'Long Run' },
  { value: 'ride', label: 'Ride / Bike' },
  { value: 'strength', label: 'Strength' },
  { value: 'functional', label: 'Functional' },
  { value: 'hyrox_drills', label: 'HYROX Drills' },
  { value: 'wod', label: 'WOD / CrossFit' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'swim', label: 'Swim' },
  { value: 'yoga', label: 'Yoga / Mobility' },
  { value: 'other', label: 'Other' },
]

const EFFORT_LABELS = ['', 'Very Easy', 'Easy', 'Moderate', 'Hard', 'Max Effort']
const EFFORT_COLORS = ['', '#4CAF50', '#8BC34A', '#FF8C00', '#FF6B00', '#FF3B30']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function SetRow({ set, setNum, onChange, onRemove }: {
  set: LogSet
  setNum: number
  onChange: (s: LogSet) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-gray-600 text-xs w-6 text-right flex-shrink-0">{setNum}</span>
      <input type="number" min={0} placeholder="Reps"
        value={set.reps ?? ''}
        onChange={e => onChange({ ...set, reps: e.target.value ? parseInt(e.target.value) : undefined })}
        className="w-14 px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-700 focus:outline-none focus:border-[#FF3B30] text-center text-xs"
      />
      <input type="number" min={0} step={0.5} placeholder="kg"
        value={set.weightKg ?? ''}
        onChange={e => onChange({ ...set, weightKg: e.target.value ? parseFloat(e.target.value) : undefined })}
        className="w-14 px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-700 focus:outline-none focus:border-[#FF3B30] text-center text-xs"
      />
      <input type="number" min={0} placeholder="m"
        value={set.meters ?? ''}
        onChange={e => onChange({ ...set, meters: e.target.value ? parseInt(e.target.value) : undefined })}
        className="w-12 px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-700 focus:outline-none focus:border-[#FF3B30] text-center text-xs"
      />
      <input type="number" min={0} placeholder="sec"
        value={set.durationSec ?? ''}
        onChange={e => onChange({ ...set, durationSec: e.target.value ? parseInt(e.target.value) : undefined })}
        className="w-12 px-2 py-1.5 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] text-white placeholder-gray-700 focus:outline-none focus:border-[#FF3B30] text-center text-xs"
      />
      <button type="button" onClick={onRemove} className="text-gray-700 hover:text-red-400 transition cursor-pointer px-1 text-base leading-none">×</button>
    </div>
  )
}

function QuickLogModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [sessionType, setSessionType] = useState('run')
  const [date, setDate] = useState(todayStr())
  const [durationMin, setDurationMin] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [effortRating, setEffortRating] = useState(0)
  const [exercises, setExercises] = useState<LogExercise[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const showDistance = DISTANCE_TYPES.has(sessionType)

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
      const sets = [...ex.sets]; sets[setIdx] = s; return { ...ex, sets }
    }))
  }
  function removeSet(exIdx: number, setIdx: number) {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) }))
  }

  async function save() {
    if (!name.trim()) { setError('Give your workout a name'); return }
    setError('')
    setSaving(true)
    try {
      await apiPost('/api/workout-logs', {
        name: name.trim(),
        sessionType,
        date,
        durationMin: durationMin ? parseInt(durationMin) : undefined,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        effortRating: effortRating || undefined,
        exercisesJson: exercises.filter(ex => ex.name.trim()),
        notes: notes || undefined,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (done) return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="mt-auto w-full rounded-t-3xl flex flex-col p-6 space-y-5" style={{ background: '#111' }}>
        <div className="flex justify-center"><div className="w-10 h-1 rounded-full bg-gray-700" /></div>
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✓</div>
          <h2 className="text-xl font-black text-white">Workout logged!</h2>
          <p className="text-sm text-gray-400 mt-1">{name}</p>
        </div>
        <button
          onClick={onSaved}
          className="w-full h-12 rounded-xl font-bold text-white cursor-pointer hover:opacity-90 transition"
          style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  )

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div
        className="mt-auto w-full rounded-t-3xl flex flex-col"
        style={{ background: '#111', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-black text-white">Log Workout</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none cursor-pointer">×</button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 pb-8 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Workout Name</label>
            <input
              type="text"
              placeholder="e.g. Morning Run, Leg Day, HYROX Sim..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] transition"
            />
          </div>

          {/* Type + Date row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Type</label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30] transition appearance-none cursor-pointer"
              >
                {SESSION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                max={todayStr()}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-3 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30] transition"
              />
            </div>
          </div>

          {/* Duration + Distance row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Duration (min)</label>
              <input
                type="number" min={1} max={600} placeholder="45"
                value={durationMin}
                onChange={e => setDurationMin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] transition"
              />
            </div>
            {showDistance && (
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Distance ({sessionType === 'swim' ? 'm' : 'km'})
                </label>
                <input
                  type="number" min={0} step={0.01}
                  placeholder={sessionType === 'swim' ? '1500' : '10.0'}
                  value={distanceKm}
                  onChange={e => setDistanceKm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] transition"
                />
              </div>
            )}
          </div>

          {/* Effort */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Effort</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                  onClick={() => setEffortRating(effortRating === n ? 0 : n)}
                  className="flex-1 py-3 rounded-xl text-sm font-black transition cursor-pointer"
                  style={{
                    background: effortRating === n ? EFFORT_COLORS[n] + '33' : '#1E1E1E',
                    border: `1px solid ${effortRating === n ? EFFORT_COLORS[n] : '#2A2A2A'}`,
                    color: effortRating === n ? EFFORT_COLORS[n] : '#6B7280',
                  }}
                >{n}</button>
              ))}
            </div>
            {effortRating > 0 && (
              <p className="text-xs text-center mt-2 font-semibold" style={{ color: EFFORT_COLORS[effortRating] }}>
                {EFFORT_LABELS[effortRating]}
              </p>
            )}
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-white">Exercises</label>
              <button type="button" onClick={addExercise}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', color: '#ccc' }}>
                + Add
              </button>
            </div>

            {exercises.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-2">
                Optional — tap <span className="text-gray-400">+ Add</span> to log sets, reps & weight
              </p>
            )}

            <div className="space-y-3">
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
                    <button type="button" onClick={() => removeExercise(exIdx)}
                      className="text-gray-600 hover:text-red-400 transition cursor-pointer text-xs">
                      Remove
                    </button>
                  </div>

                  {ex.sets.length > 0 && (
                    <div className="mb-2">
                      <div className="flex gap-1.5 text-[10px] text-gray-600 uppercase tracking-wide mb-1.5 ml-7">
                        <span className="w-14 text-center">Reps</span>
                        <span className="w-14 text-center">kg</span>
                        <span className="w-12 text-center">m</span>
                        <span className="w-12 text-center">sec</span>
                      </div>
                      <div className="space-y-1.5">
                        {ex.sets.map((s, si) => (
                          <SetRow key={si} set={s} setNum={si + 1}
                            onChange={updated => updateSet(exIdx, si, updated)}
                            onRemove={() => removeSet(exIdx, si)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="button" onClick={() => addSet(exIdx)}
                    className="text-xs text-gray-500 hover:text-white transition cursor-pointer mt-1 ml-7">
                    + Add set
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did it go? Any PRs or highlights..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] resize-none transition"
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
      </div>
    </div>,
    document.body
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setUser(getUser())
  }, [pathname])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  function logout() {
    clearAuth()
    router.push('/login')
  }

  function handleQuickLogSaved() {
    setQuickLogOpen(false)
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 3000)
    // Notify pages to refresh
    window.dispatchEvent(new CustomEvent('workout-logged'))
  }

  const primaryNav = NAV.filter(n => BOTTOM_PRIMARY.includes(n.href))
  const drawerNav = NAV.filter(n => !BOTTOM_PRIMARY.includes(n.href))
  const isMoreActive = drawerNav.some(n => pathname === n.href)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D0D', color: '#F5F5F5' }}>

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF3B30] to-[#FF8C00] flex items-center justify-center font-black text-white text-sm">
            T
          </div>
          <span className="font-bold tracking-tight hidden sm:block">THRESHOLD</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname === n.href
                  ? 'bg-[#1E1E1E] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-gray-400 hidden sm:block">
              {user.firstName}
            </span>
          )}
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-[#1E1E1E] cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 sm:px-6 py-6 pb-24 sm:pb-6 max-w-5xl mx-auto w-full">
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>

      {/* Floating action button — log a workout from anywhere */}
      <button
        onClick={() => setQuickLogOpen(true)}
        className="fixed right-4 sm:right-6 bottom-20 sm:bottom-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition hover:scale-105 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
        aria-label="Log workout"
      >
        <span className="text-white text-2xl font-black leading-none">+</span>
      </button>

      {/* Quick log modal */}
      {mounted && quickLogOpen && (
        <QuickLogModal
          onClose={() => setQuickLogOpen(false)}
          onSaved={handleQuickLogSaved}
        />
      )}

      {/* Toast */}
      {savedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl text-sm font-semibold shadow-lg pointer-events-none"
          style={{ background: '#1E3A1E', border: '1px solid #2A5A2A', color: '#6BCC6B' }}>
          Workout logged!
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-[#1E1E1E] flex" style={{ background: '#0D0D0D' }}>
        {primaryNav.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition ${
              pathname === n.href ? 'text-[#FF3B30]' : 'text-gray-500'
            }`}
          >
            <span className="text-lg leading-none">{n.icon}</span>
            {n.label}
          </Link>
        ))}
        {/* More tab */}
        <button
          onClick={() => setDrawerOpen(o => !o)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition cursor-pointer ${
            isMoreActive || drawerOpen ? 'text-[#FF3B30]' : 'text-gray-500'
          }`}
        >
          <span className="text-lg leading-none">☰</span>
          More
        </button>
      </nav>

      {/* Mobile "More" drawer — slides up from bottom */}
      {drawerOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="sm:hidden fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl border-t border-x border-[#2A2A2A] py-4"
            style={{ background: '#141414' }}
          >
            <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-4" />
            {user && (
              <div className="px-4 pb-3 border-b border-[#1E1E1E] mb-2">
                <p className="text-sm font-semibold text-white">{user.firstName}</p>
                <p className="text-xs text-gray-500">Signed in</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1 px-3">
              {drawerNav.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl text-xs font-medium transition ${
                    pathname === n.href
                      ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                      : 'text-gray-400 active:bg-[#1E1E1E]'
                  }`}
                >
                  <span className="text-2xl leading-none">{n.icon}</span>
                  {n.label}
                </Link>
              ))}
            </div>
            <div className="px-4 mt-3 pt-3 border-t border-[#1E1E1E]">
              <button
                onClick={logout}
                className="w-full py-3 rounded-xl text-sm font-medium text-gray-400 border border-[#2A2A2A] hover:border-[#FF3B30] hover:text-white transition cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
