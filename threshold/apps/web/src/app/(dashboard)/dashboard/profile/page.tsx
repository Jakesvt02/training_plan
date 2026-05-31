'use client'

import { useState, useEffect } from 'react'
import { apiGet, apiPut } from '@/lib/api'
import { updateStoredUser } from '@/lib/auth'

const DISCIPLINES = [
  { value: 'hyrox', label: 'HYROX' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'bodybuilding', label: 'Bodybuilding' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'general_fitness', label: 'General Fitness' },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'elite', label: 'Elite' },
]

const GOALS = [
  { value: 'race_completion', label: 'Race Completion' },
  { value: 'race_time', label: 'Race Time' },
  { value: 'competition', label: 'Competition' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'recomposition', label: 'Body Recomposition' },
  { value: 'general_fitness', label: 'General Fitness' },
  { value: 'endurance', label: 'Endurance' },
]

interface ProfileData {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    createdAt: string
  }
  profile: {
    gender: string
    dateOfBirth: string  // ISO string
    heightCm: number
    weightKg: number
    primaryDiscipline: string
    experienceLevel: string
    trainingDaysPerWeek: number
    goal: string
    goalDate?: string | null
    goalDetail?: string | null
    weeklyWeightGoalKg?: number | null
    bmi: number
  } | null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', min, max, step, placeholder }: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] transition"
    />
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white focus:outline-none focus:border-[#FF3B30] transition cursor-pointer"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  // Editable fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [trainingDays, setTrainingDays] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [goal, setGoal] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [goalDetail, setGoalDetail] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [weeklyWeightGoalKg, setWeeklyWeightGoalKg] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  useEffect(() => {
    apiGet<ProfileData>('/api/profile')
      .then(d => {
        setData(d)
        setFirstName(d.user.firstName)
        setLastName(d.user.lastName)
        if (d.profile) {
          setWeightKg(String(d.profile.weightKg))
          setHeightCm(String(d.profile.heightCm))
          setTrainingDays(String(d.profile.trainingDaysPerWeek))
          setExperienceLevel(d.profile.experienceLevel)
          setGoal(d.profile.goal)
          setGoalDate(d.profile.goalDate ? d.profile.goalDate.split('T')[0] : '')
          setGoalDetail(d.profile.goalDetail ?? '')
          setDiscipline(d.profile.primaryDiscipline)
          setWeeklyWeightGoalKg(d.profile.weeklyWeightGoalKg != null ? String(d.profile.weeklyWeightGoalKg) : '')
          setGender(d.profile.gender)
          setDateOfBirth(d.profile.dateOfBirth ? d.profile.dateOfBirth.split('T')[0] : '')
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const result = await apiPut<ProfileData>('/api/profile', {
        firstName, lastName,
        weightKg: parseFloat(weightKg),
        heightCm: parseFloat(heightCm),
        trainingDaysPerWeek: parseInt(trainingDays),
        experienceLevel,
        goal,
        goalDate: goalDate || null,
        goalDetail: goalDetail || null,
        primaryDiscipline: discipline,
        weeklyWeightGoalKg: weeklyWeightGoalKg ? parseFloat(weeklyWeightGoalKg) : null,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
      })
      setData(result)
      // Update the name shown in the nav
      updateStoredUser({ firstName: result.user.firstName, lastName: result.user.lastName })
      setToast('Profile saved')
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-gray-400 text-center py-16">{error || 'No profile found'}</p>
  }

  const memberSince = new Date(data.user.createdAt).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
  const age = data.profile ? Math.floor((Date.now() - new Date(data.profile.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)) : null

  return (
    <div>

      {toast && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#1E3A1E', border: '1px solid #2A5A2A', color: '#6BCC6B' }}>
          {toast}
        </div>
      )}

      {/* Header card */}
      <div className="rounded-2xl p-5 mb-6 flex items-center gap-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}>
          {firstName.charAt(0)}{lastName.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-black text-white">{firstName} {lastName}</h1>
          <p className="text-sm text-gray-400">{data.user.email}</p>
          <p className="text-xs text-gray-600 mt-0.5">Member since {memberSince}</p>
        </div>
      </div>

      <form onSubmit={save}>
        <div className="sm:grid sm:grid-cols-2 sm:gap-6">

          {/* Left column */}
          <div className="space-y-5">
            {/* Personal */}
            <Section title="Personal">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                  <Input value={firstName} onChange={setFirstName} />
                </Field>
                <Field label="Last name">
                  <Input value={lastName} onChange={setLastName} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of birth">
                  <Input type="date" value={dateOfBirth} onChange={setDateOfBirth} />
                </Field>
                <Field label="Gender">
                  <Select
                    value={gender}
                    onChange={setGender}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                  />
                </Field>
              </div>
              {data.profile && (
                <div className="grid grid-cols-2 gap-3">
                  <StatBadge label="Age" value={age ? `${age}y` : '—'} />
                  <StatBadge label="BMI" value={String(data.profile.bmi)} />
                </div>
              )}
            </Section>

            {/* Body */}
            <Section title="Body">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight (kg)">
                  <Input type="number" value={weightKg} onChange={setWeightKg} min={20} max={500} step={0.1} />
                </Field>
                <Field label="Height (cm)">
                  <Input type="number" value={heightCm} onChange={setHeightCm} min={50} max={300} step={0.5} />
                </Field>
              </div>
            </Section>

            {/* Training */}
            <Section title="Training">
              <Field label="Primary Discipline">
                <Select value={discipline} onChange={setDiscipline} options={DISCIPLINES} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Experience Level">
                  <Select value={experienceLevel} onChange={setExperienceLevel} options={EXPERIENCE_LEVELS} />
                </Field>
                <Field label="Training Days / Week">
                  <Select
                    value={trainingDays}
                    onChange={setTrainingDays}
                    options={[1,2,3,4,5,6,7].map(n => ({ value: String(n), label: `${n} day${n > 1 ? 's' : ''}` }))}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-5 mt-5 sm:mt-0">
            {/* Goal */}
            <Section title="Goal">
              <Field label="Primary Goal">
                <Select value={goal} onChange={setGoal} options={GOALS} />
              </Field>
              <Field label="Goal / Race Date (optional)">
                <Input type="date" value={goalDate} onChange={setGoalDate} />
              </Field>
              <Field label="Goal Detail (optional)">
                <Input
                  value={goalDetail}
                  onChange={setGoalDetail}
                  placeholder="e.g. Sub-90 min HYROX, 100kg bench press..."
                />
              </Field>
              <Field label="Weekly weight goal">
                <Select
                  value={weeklyWeightGoalKg}
                  onChange={setWeeklyWeightGoalKg}
                  options={[
                    { value: '-1',    label: 'Lose 1 kg / week' },
                    { value: '-0.75', label: 'Lose 0.75 kg / week' },
                    { value: '-0.5',  label: 'Lose 0.5 kg / week' },
                    { value: '-0.25', label: 'Lose 0.25 kg / week' },
                    { value: '0',     label: 'Maintain weight' },
                    { value: '0.25',  label: 'Gain 0.25 kg / week' },
                    { value: '0.5',   label: 'Gain 0.5 kg / week' },
                  ]}
                />
                {weeklyWeightGoalKg && weeklyWeightGoalKg !== '0' && (
                  <p className="text-xs text-gray-500 mt-1 px-1">
                    {parseFloat(weeklyWeightGoalKg) < 0
                      ? `${Math.abs(Math.round(parseFloat(weeklyWeightGoalKg) * 7700 / 7))} kcal/day deficit applied in Nutrition`
                      : `${Math.round(parseFloat(weeklyWeightGoalKg) * 7700 / 7)} kcal/day surplus applied in Nutrition`
                    }
                  </p>
                )}
              </Field>
              {goalDate && (
                <div className="text-xs text-gray-500 px-1">
                  {(() => {
                    const days = Math.ceil((new Date(goalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    if (days < 0) return 'Goal date has passed'
                    if (days === 0) return 'Goal date is today!'
                    const weeks = Math.floor(days / 7)
                    return weeks > 0 ? `${weeks} week${weeks !== 1 ? 's' : ''} away (${days} days)` : `${days} day${days !== 1 ? 's' : ''} away`
                  })()}
                </div>
              )}
            </Section>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-5">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer mt-6"
          style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2 text-center" style={{ background: '#1A1A1A', border: '1px solid #222' }}>
      <div className="text-sm font-bold text-white">{value}</div>
      <div className="text-[10px] text-gray-600 mt-0.5">{label}</div>
    </div>
  )
}
