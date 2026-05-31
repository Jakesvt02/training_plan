'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { DisciplineCard } from '@/components/onboarding/DisciplineCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { apiPost } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import {
  DISCIPLINE_LABELS,
  DISCIPLINE_DESCRIPTIONS,
  type Discipline,
  type RegisterPayload,
  type AuthResponse,
} from '@threshold/shared'

const ALL_DISCIPLINES = Object.keys(DISCIPLINE_LABELS) as Discipline[]

type FormData = Partial<RegisterPayload>

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>({ secondaryDisciplines: [] })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function set(field: keyof FormData, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[field as string]; return e })
  }

  function validateStep(): boolean {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!form.firstName?.trim()) e.firstName = 'Required'
      if (!form.lastName?.trim()) e.lastName = 'Required'
      if (!form.email?.includes('@')) e.email = 'Valid email required'
      if (!form.password || form.password.length < 8) e.password = 'At least 8 characters'
    }
    if (step === 2) {
      if (!form.gender) e.gender = 'Required'
      if (!form.dateOfBirth) e.dateOfBirth = 'Required'
      if (!form.heightCm || form.heightCm < 50) e.heightCm = 'Enter your height in cm'
      if (!form.weightKg || form.weightKg < 20) e.weightKg = 'Enter your weight in kg'
    }
    if (step === 4) {
      if (!form.primaryDiscipline) e.primaryDiscipline = 'Select your primary discipline'
      if (!form.experienceLevel) e.experienceLevel = 'Required'
      if (!form.trainingDaysPerWeek) e.trainingDaysPerWeek = 'Required'
    }
    if (step === 5) {
      if (!form.goal) e.goal = 'Required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() { if (validateStep()) setStep(s => s + 1) }
  function back() { setStep(s => s - 1); setErrors({}) }

  async function submit() {
    if (!validateStep()) return
    setLoading(true)
    try {
      const result = await apiPost<AuthResponse>('/api/auth/register', form)
      saveAuth(result.accessToken, result.refreshToken, result.user)
      router.push('/dashboard')
    } catch (err: unknown) {
      const apiErr = err as Error & { fields?: Record<string, string> }
      if (apiErr.fields) setErrors(apiErr.fields)
      else setErrors({ _form: apiErr.message || 'Registration failed' })
    } finally {
      setLoading(false)
    }
  }

  const needsGoalDate =
    form.primaryDiscipline === 'hyrox' ||
    form.primaryDiscipline === 'running' ||
    form.primaryDiscipline === 'cycling' ||
    form.primaryDiscipline === 'powerlifting'

  const isLastStep = step === 5

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D0D' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3A3A3A] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF3B30] to-[#FF8C00] flex items-center justify-center font-black text-white text-sm">
            T
          </div>
          <span className="font-bold text-lg tracking-tight">THRESHOLD</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-400">
          Have an account?{' '}
          <Link href="/login" className="text-[#FF3B30] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </nav>

      {/* Scrollable content — padded above sticky buttons */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-8 pb-32">

          <StepIndicator current={step} />

          {/* ── STEP 1: Account ── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-1">Create your account</h1>
              <p className="text-gray-400 text-sm mb-6">Start your training journey with Threshold</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First name" placeholder="Jaco"
                    value={form.firstName || ''}
                    onChange={e => set('firstName', e.target.value)}
                    error={errors.firstName}
                  />
                  <Input
                    label="Last name" placeholder="van der Merwe"
                    value={form.lastName || ''}
                    onChange={e => set('lastName', e.target.value)}
                    error={errors.lastName}
                  />
                </div>
                <Input
                  label="Email address" type="email" placeholder="jaco@example.com"
                  value={form.email || ''}
                  onChange={e => set('email', e.target.value)}
                  error={errors.email}
                />
                <Input
                  label="Password" type="password" placeholder="Min. 8 characters"
                  value={form.password || ''}
                  onChange={e => set('password', e.target.value)}
                  error={errors.password}
                  hint="Min 8 characters, 1 uppercase letter and 1 number"
                />
              </div>
              {errors._form && <p className="text-red-400 text-sm mt-3">{errors._form}</p>}
            </div>
          )}

          {/* ── STEP 2: Body Stats ── */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-1">Your body stats</h1>
              <p className="text-gray-400 text-sm mb-6">Used to calculate BMI, calorie targets and training load</p>
              <div className="space-y-4">
                <Select
                  label="Gender"
                  value={form.gender || ''}
                  onChange={e => set('gender', e.target.value)}
                  error={errors.gender}
                  placeholder="Select gender"
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                />
                <Input
                  label="Date of birth" type="date"
                  value={form.dateOfBirth || ''}
                  onChange={e => set('dateOfBirth', e.target.value)}
                  error={errors.dateOfBirth}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Height (cm)" type="number" placeholder="178"
                    value={form.heightCm || ''}
                    onChange={e => set('heightCm', parseFloat(e.target.value))}
                    error={errors.heightCm}
                  />
                  <Input
                    label="Weight (kg)" type="number" placeholder="82"
                    value={form.weightKg || ''}
                    onChange={e => set('weightKg', parseFloat(e.target.value))}
                    error={errors.weightKg}
                  />
                </div>
                {form.heightCm && form.weightKg && form.heightCm > 0 && form.weightKg > 0 && (
                  <div className="rounded-xl bg-[#242424] border border-[#3A3A3A] p-4">
                    <p className="text-xs text-gray-400 mb-1">BMI estimate</p>
                    {(() => {
                      const bmi = Math.round((form.weightKg / Math.pow(form.heightCm / 100, 2)) * 10) / 10
                      const label = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese'
                      const color = bmi < 18.5 ? 'text-blue-400' : bmi < 25 ? 'text-green-400' : bmi < 30 ? 'text-yellow-400' : 'text-red-400'
                      return <p className="text-2xl font-black">{bmi} <span className={`text-sm font-normal ${color}`}>{label}</span></p>
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Measurements ── */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-1">Body measurements</h1>
              <p className="text-gray-400 text-sm mb-1">Optional — useful for tracking physique changes over time</p>
              <p className="text-xs text-[#FF3B30] mb-6">You can skip this and add measurements later</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Chest (cm)" type="number" placeholder="100"
                  value={form.chestCm || ''} onChange={e => set('chestCm', parseFloat(e.target.value))} />
                <Input label="Waist (cm)" type="number" placeholder="84"
                  value={form.waistCm || ''} onChange={e => set('waistCm', parseFloat(e.target.value))} />
                <Input label="Hips (cm)" type="number" placeholder="96"
                  value={form.hipsCm || ''} onChange={e => set('hipsCm', parseFloat(e.target.value))} />
                <Input label="Left arm (cm)" type="number" placeholder="38"
                  value={form.leftArmCm || ''} onChange={e => set('leftArmCm', parseFloat(e.target.value))} />
                <Input label="Right arm (cm)" type="number" placeholder="38"
                  value={form.rightArmCm || ''} onChange={e => set('rightArmCm', parseFloat(e.target.value))} />
                <Input label="Left thigh (cm)" type="number" placeholder="58"
                  value={form.leftThighCm || ''} onChange={e => set('leftThighCm', parseFloat(e.target.value))} />
                <Input label="Right thigh (cm)" type="number" placeholder="58"
                  value={form.rightThighCm || ''} onChange={e => set('rightThighCm', parseFloat(e.target.value))} />
                <Input label="Left calf (cm)" type="number" placeholder="38"
                  value={form.leftCalfCm || ''} onChange={e => set('leftCalfCm', parseFloat(e.target.value))} />
                <Input label="Right calf (cm)" type="number" placeholder="38"
                  value={form.rightCalfCm || ''} onChange={e => set('rightCalfCm', parseFloat(e.target.value))} />
              </div>
            </div>
          )}

          {/* ── STEP 4: Training Setup ── */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-1">Training setup</h1>
              <p className="text-gray-400 text-sm mb-6">We use this to build a plan that fits your life</p>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-3">Primary discipline</p>
                  <div className="space-y-2">
                    {ALL_DISCIPLINES.map(d => (
                      <DisciplineCard
                        key={d}
                        discipline={d}
                        label={DISCIPLINE_LABELS[d]}
                        description={DISCIPLINE_DESCRIPTIONS[d]}
                        selected={form.primaryDiscipline === d}
                        onSelect={() => set('primaryDiscipline', d)}
                      />
                    ))}
                  </div>
                  {errors.primaryDiscipline && (
                    <p className="text-xs text-red-400 mt-2">{errors.primaryDiscipline}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Experience level"
                    value={form.experienceLevel || ''}
                    onChange={e => set('experienceLevel', e.target.value)}
                    error={errors.experienceLevel}
                    placeholder="Select level"
                    options={[
                      { value: 'beginner', label: 'Beginner (< 1 year)' },
                      { value: 'intermediate', label: 'Intermediate (1–3 years)' },
                      { value: 'advanced', label: 'Advanced (3–5 years)' },
                      { value: 'elite', label: 'Elite (5+ years, compete)' },
                    ]}
                  />
                  <Select
                    label="Training days / week"
                    value={form.trainingDaysPerWeek?.toString() || ''}
                    onChange={e => set('trainingDaysPerWeek', parseInt(e.target.value))}
                    error={errors.trainingDaysPerWeek}
                    placeholder="Select days"
                    options={[1, 2, 3, 4, 5, 6, 7].map(d => ({
                      value: d.toString(),
                      label: `${d} day${d > 1 ? 's' : ''} per week`,
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Goal ── */}
          {step === 5 && (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-1">What&apos;s your goal?</h1>
              <p className="text-gray-400 text-sm mb-6">This anchors your entire plan — be honest with yourself</p>
              <div className="space-y-4">
                <Select
                  label="Primary goal"
                  value={form.goal || ''}
                  onChange={e => set('goal', e.target.value)}
                  error={errors.goal}
                  placeholder="Select your goal"
                  options={[
                    { value: 'race_completion', label: 'Complete a race / event' },
                    { value: 'race_time', label: 'Hit a target race time' },
                    { value: 'competition', label: 'Compete in a competition' },
                    { value: 'muscle_gain', label: 'Build muscle / bulk' },
                    { value: 'fat_loss', label: 'Lose body fat / cut' },
                    { value: 'recomposition', label: 'Body recomposition' },
                    { value: 'endurance', label: 'Build endurance' },
                    { value: 'general_fitness', label: 'General fitness & health' },
                  ]}
                />
                {needsGoalDate && (
                  <Input
                    label="Target event / competition date" type="date"
                    value={form.goalDate || ''}
                    onChange={e => set('goalDate', e.target.value)}
                    hint="We'll count back from this date to structure your phases"
                  />
                )}
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-1.5">
                    Goal detail <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      form.primaryDiscipline === 'hyrox' ? 'e.g. Sub 1:30 finish at HYROX Cape Town' :
                      form.primaryDiscipline === 'powerlifting' ? 'e.g. 600kg total at regional comp' :
                      'Describe your goal in your own words...'
                    }
                    value={form.goalDetail || ''}
                    onChange={e => set('goalDetail', e.target.value)}
                    className="w-full rounded-xl border border-[#3A3A3A] bg-[#242424] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF3B30] focus:ring-1 focus:ring-[#FF3B30] resize-none"
                  />
                </div>
              </div>
              {errors._form && <p className="text-red-400 text-sm mt-3">{errors._form}</p>}
            </div>
          )}

        </div>
      </main>

      {/* Sticky bottom navigation — always visible, never buried */}
      <div className="flex-shrink-0 border-t border-[#3A3A3A] bg-[#0D0D0D] px-4 sm:px-6 py-4 safe-area-pb">
        <div className="w-full max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={back}
              className="flex-shrink-0 w-12 h-12 rounded-xl border border-[#3A3A3A] text-gray-400 hover:border-[#FF3B30] hover:text-white transition flex items-center justify-center text-lg"
            >
              ←
            </button>
          )}
          <button
            onClick={isLastStep ? submit : next}
            disabled={loading}
            className="flex-1 h-12 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {isLastStep ? 'Create my account' : 'Continue'}
            {!loading && !isLastStep && ' →'}
          </button>
        </div>
      </div>

    </div>
  )
}
