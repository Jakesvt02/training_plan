'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiDelete } from '@/lib/api'

interface Exercise {
  id: string
  name: string
  type: string
  calories: number
  source: 'activity' | 'log'
}

interface Eaten {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

interface Summary {
  date: string
  tdee: number
  baseBurn: number
  exerciseCalories: number
  totalBurn: number
  targetCalories: number
  eaten: Eaten
  remaining: number
  macroTargets: { proteinG: number; carbsG: number; fatG: number }
  exercises: Exercise[]
  goal: string
  weightKg: number
}

interface LogEntry {
  id: string
  mealType: string
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

interface FoodResult {
  name: string
  servingSize: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = typeof MEAL_TYPES[number]
const MEAL_LABELS: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }
const MEAL_ICONS: Record<MealType, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0)
  const over = current > target
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400 font-medium">{label}</span>
        <span style={{ color: over ? '#FF3B30' : '#9CA3AF' }}>
          {Math.round(current)}g <span className="text-gray-600">/ {target}g</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: '#1E1E1E' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#FF3B30' : color }} />
      </div>
    </div>
  )
}

export default function NutritionPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [date, setDate] = useState(todayStr)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add food form
  const [showAdd, setShowAdd] = useState(false)
  const [activeMeal, setActiveMeal] = useState<MealType>('breakfast')
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<FoodResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<FoodResult | null>(null)
  const [manualName, setManualName] = useState('')
  const [manualCal, setManualCal] = useState('')
  const [manualProtein, setManualProtein] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [s, e] = await Promise.all([
      apiGet<Summary>(`/api/nutrition/summary?date=${date}`),
      apiGet<LogEntry[]>(`/api/nutrition/log?date=${date}`),
    ])
    setSummary(s)
    setEntries(e)
  }, [date])

  useEffect(() => {
    setLoading(true)
    reload().catch(() => setError('Failed to load nutrition data')).finally(() => setLoading(false))
  }, [reload])

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await apiGet<FoodResult[]>(`/api/nutrition/search?q=${encodeURIComponent(searchQ)}`)
        setSearchResults(r)
      } finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [searchQ])

  async function addEntry() {
    const name = selected ? selected.name : manualName
    const calories = selected ? selected.calories : parseInt(manualCal)
    if (!name || !calories) return
    setSaving(true)
    try {
      const entry = await apiPost<LogEntry>('/api/nutrition/log', {
        date, mealType: activeMeal, name, calories,
        proteinG: selected ? selected.proteinG : parseFloat(manualProtein) || 0,
        carbsG: selected ? selected.carbsG : parseFloat(manualCarbs) || 0,
        fatG: selected ? selected.fatG : parseFloat(manualFat) || 0,
      })
      setEntries(prev => [...prev, entry])
      setSummary(prev => prev ? {
        ...prev,
        eaten: {
          calories: prev.eaten.calories + entry.calories,
          proteinG: prev.eaten.proteinG + entry.proteinG,
          carbsG: prev.eaten.carbsG + entry.carbsG,
          fatG: prev.eaten.fatG + entry.fatG,
        },
        remaining: prev.remaining - entry.calories,
      } : prev)
      setSelected(null); setSearchQ(''); setSearchResults([])
      setManualName(''); setManualCal(''); setManualProtein(''); setManualCarbs(''); setManualFat('')
      setShowAdd(false)
    } finally { setSaving(false) }
  }

  async function remove(entry: LogEntry) {
    setDeletingId(entry.id)
    try {
      await apiDelete(`/api/nutrition/log/${entry.id}`)
      setEntries(prev => prev.filter(e => e.id !== entry.id))
      setSummary(prev => prev ? {
        ...prev,
        eaten: {
          calories: prev.eaten.calories - entry.calories,
          proteinG: prev.eaten.proteinG - entry.proteinG,
          carbsG: prev.eaten.carbsG - entry.carbsG,
          fatG: prev.eaten.fatG - entry.fatG,
        },
        remaining: prev.remaining + entry.calories,
      } : prev)
    } finally { setDeletingId(null) }
  }

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] transition"

  if (loading) return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" /></div>
  if (error || !summary) return <p className="text-gray-400 text-center py-16">{error || 'No profile found — complete your profile first.'}</p>

  const remaining = summary.remaining
  const remainColor = remaining < 0 ? '#FF3B30' : remaining < 200 ? '#FF8C00' : '#4CAF50'
  const eatenPct = Math.min(100, summary.totalBurn > 0 ? (summary.eaten.calories / summary.totalBurn) * 100 : 0)

  return (
    <div className="space-y-5">

      {/* Header + date */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-black">Nutrition</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-3 py-1.5 rounded-xl text-sm bg-[#141414] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30] cursor-pointer" />
      </div>

      {/* Energy balance card */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Energy Balance</h2>

        {/* Energy breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl py-3 px-2" style={{ background: '#1A1A1A', border: '1px solid #222' }} title={`BMR × 1.2 — calories burned just existing. Your full TDEE with ${summary.tdee} kcal includes your training days, but exercise is added separately below.`}>
            <div className="text-lg font-black text-white">{summary.baseBurn}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Daily base</div>
          </div>
          <div className="rounded-xl py-3 px-2" style={{ background: summary.exerciseCalories > 0 ? '#1A2A1A' : '#1A1A1A', border: `1px solid ${summary.exerciseCalories > 0 ? '#2A4A2A' : '#222'}` }}>
            <div className="text-lg font-black" style={{ color: summary.exerciseCalories > 0 ? '#6BCC6B' : '#444' }}>
              +{summary.exerciseCalories}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Exercise</div>
          </div>
          <div className="rounded-xl py-3 px-2" style={{ background: '#1A1A2A', border: '1px solid #2A2A4A' }}>
            <div className="text-lg font-black text-white">{summary.totalBurn}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">Today&apos;s budget</div>
          </div>
        </div>

        {/* Exercise source breakdown */}
        {summary.exercises.length > 0 && (
          <div className="space-y-1">
            {summary.exercises.map(ex => (
              <div key={ex.id} className="flex items-center justify-between text-xs px-1">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: ex.source === 'activity' ? 'rgba(59,158,255,0.13)' : 'rgba(107,204,107,0.13)', color: ex.source === 'activity' ? '#3B9EFF' : '#6BCC6B', border: `1px solid ${ex.source === 'activity' ? 'rgba(59,158,255,0.27)' : 'rgba(107,204,107,0.27)'}` }}>
                    {ex.source === 'activity' ? 'Synced' : 'Logged'}
                  </span>
                  {ex.name}
                </span>
                <span className="font-semibold" style={{ color: '#6BCC6B' }}>~{ex.calories} kcal</span>
              </div>
            ))}
          </div>
        )}

        {/* Calorie progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">Eaten <span className="font-bold text-white">{Math.round(summary.eaten.calories)} kcal</span></span>
            <span style={{ color: remainColor }} className="font-bold">
              {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#1E1E1E' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${eatenPct}%`,
                background: remaining < 0 ? '#FF3B30' : remaining < 200 ? 'linear-gradient(90deg, #4CAF50, #FF8C00)' : '#4CAF50',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>0</span>
            <span>{summary.totalBurn} kcal budget</span>
          </div>
        </div>

        {/* Macro targets */}
        <div className="pt-2 border-t border-[#1E1E1E] space-y-2.5">
          <MacroBar label="Protein" current={summary.eaten.proteinG} target={summary.macroTargets.proteinG} color="#FF8C00" />
          <MacroBar label="Carbs" current={summary.eaten.carbsG} target={summary.macroTargets.carbsG} color="#3B9EFF" />
          <MacroBar label="Fat" current={summary.eaten.fatG} target={summary.macroTargets.fatG} color="#9C27B0" />
        </div>
      </div>

      {/* Add food button / form */}
      {!showAdd ? (
        <button onClick={() => setShowAdd(true)} className="w-full h-11 rounded-xl font-bold text-white cursor-pointer hover:opacity-90 transition" style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}>
          + Add Food
        </button>
      ) : (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Add Food</h2>
            <button onClick={() => { setShowAdd(false); setSelected(null); setSearchQ('') }} className="text-gray-500 hover:text-white text-xs cursor-pointer">Cancel</button>
          </div>

          {/* Meal selector */}
          <div className="flex gap-2 flex-wrap">
            {MEAL_TYPES.map(m => (
              <button key={m} onClick={() => setActiveMeal(m)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                style={{ background: activeMeal === m ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1E1E1E', border: `1px solid ${activeMeal === m ? '#FF3B30' : '#2A2A2A'}`, color: activeMeal === m ? '#fff' : '#6B7280' }}>
                {MEAL_ICONS[m]} {MEAL_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Search */}
          {!selected && (
            <div className="relative">
              <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search food (e.g. chicken breast, oats)..." className={inputClass} />
              {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border border-[#FF3B30] border-t-transparent rounded-full animate-spin" /></div>}
              {searchResults.length > 0 && (
                <div className="mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid #2A2A2A', background: '#1A1A1A' }}>
                  {searchResults.map((r, i) => (
                    <button key={i} onClick={() => { setSelected(r); setSearchQ('') }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#222] transition cursor-pointer border-b border-[#222] last:border-0">
                      <div>
                        <div className="text-sm text-white font-medium truncate max-w-[280px]">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.servingSize} · P {r.proteinG}g · C {r.carbsG}g · F {r.fatG}g</div>
                      </div>
                      <span className="text-sm font-bold text-white ml-2 flex-shrink-0">{r.calories} kcal</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selected && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: '#1A2A1A', border: '1px solid #2A4A2A' }}>
              <div>
                <div className="text-sm font-semibold text-white">{selected.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{selected.calories} kcal · P {selected.proteinG}g · C {selected.carbsG}g · F {selected.fatG}g</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-gray-500 hover:text-red-400 cursor-pointer ml-3">✕</button>
            </div>
          )}

          {!selected && (
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition select-none">Or enter manually ▾</summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Name</label>
                  <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="e.g. Chicken breast 150g" className={inputClass} />
                </div>
                {[
                  { label: 'Calories', val: manualCal, set: setManualCal },
                  { label: 'Protein (g)', val: manualProtein, set: setManualProtein },
                  { label: 'Carbs (g)', val: manualCarbs, set: setManualCarbs },
                  { label: 'Fat (g)', val: manualFat, set: setManualFat },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{f.label}</label>
                    <input type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder="0" min="0" className={inputClass} />
                  </div>
                ))}
              </div>
            </details>
          )}

          <button onClick={addEntry} disabled={saving || (!selected && (!manualName || !manualCal))}
            className="w-full h-10 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90 disabled:opacity-40 transition"
            style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}>
            {saving ? 'Adding...' : `Add to ${MEAL_LABELS[activeMeal]}`}
          </button>
        </div>
      )}

      {/* Meal sections */}
      {MEAL_TYPES.map(meal => {
        const mealEntries = entries.filter(e => e.mealType === meal)
        if (!mealEntries.length) return null
        const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0)
        return (
          <div key={meal} className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
              <span className="text-sm font-bold text-white">{MEAL_ICONS[meal]} {MEAL_LABELS[meal]}</span>
              <span className="text-xs text-gray-500">{mealCals} kcal</span>
            </div>
            <div className="divide-y divide-[#1E1E1E]">
              {mealEntries.map(e => (
                <div key={e.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#1A1A1A] transition">
                  <div>
                    <div className="text-sm text-white">{e.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">P {e.proteinG}g · C {e.carbsG}g · F {e.fatG}g</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{e.calories}</span>
                    <button onClick={() => remove(e)} disabled={deletingId === e.id}
                      className="text-xs text-gray-600 hover:text-red-400 transition cursor-pointer disabled:opacity-40">
                      {deletingId === e.id ? '…' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {entries.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
          <p className="text-gray-400 text-sm">Nothing logged yet.</p>
          <p className="text-gray-600 text-xs mt-1">Tap + Add Food to log your first meal.</p>
        </div>
      )}

    </div>
  )
}
