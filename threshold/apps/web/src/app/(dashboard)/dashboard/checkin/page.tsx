'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api'

const BODY_AREAS = [
  'Neck', 'Upper Back', 'Lower Back', 'Left Shoulder', 'Right Shoulder',
  'Left Arm', 'Right Arm', 'Chest', 'Core', 'Left Hip', 'Right Hip',
  'Left Quad', 'Right Quad', 'Left Hamstring', 'Right Hamstring',
  'Left Knee', 'Right Knee', 'Left Calf', 'Right Calf', 'Left Ankle', 'Right Ankle',
]

interface Soreness {
  area: string
  severity: 1 | 2 | 3
}

function RatingInput({ label, value, onChange, sublabels }: {
  label: string
  value: number
  onChange: (v: number) => void
  sublabels?: [string, string]
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-lg font-bold text-sm transition cursor-pointer ${
              value === n
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={{
              background: value === n
                ? `linear-gradient(135deg, #FF3B30, #FF8C00)`
                : '#1E1E1E',
              border: `1px solid ${value === n ? '#FF3B30' : '#2A2A2A'}`,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      {sublabels && (
        <div className="flex justify-between mt-1 text-xs text-gray-600">
          <span>{sublabels[0]}</span>
          <span>{sublabels[1]}</span>
        </div>
      )}
    </div>
  )
}

export default function CheckInPage() {
  const router = useRouter()
  const [sleep, setSleep] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [motivation, setMotivation] = useState(3)
  const [stress, setStress] = useState(false)
  const [stressNote, setStressNote] = useState('')
  const [sorenessMap, setSorenessMap] = useState<Soreness[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ readinessScore: number } | null>(null)

  function toggleSoreness(area: string) {
    setSorenessMap(prev => {
      const existing = prev.find(s => s.area === area)
      if (!existing) return [...prev, { area, severity: 1 }]
      if (existing.severity < 3) return prev.map(s => s.area === area ? { ...s, severity: (s.severity + 1) as 1 | 2 | 3 } : s)
      return prev.filter(s => s.area !== area)
    })
  }

  function severityColor(severity: number) {
    return severity === 1 ? '#FF8C00' : severity === 2 ? '#FF6B00' : '#FF3B30'
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await apiPost<{ checkIn: unknown; readinessScore: number }>('/api/checkin', {
        sleep, energy, motivation, stress,
        stressNote: stress ? stressNote : undefined,
        sorenessMap,
        notes: notes || undefined,
      })
      setDone(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    const score = done.readinessScore
    const color = score >= 75 ? '#4CAF50' : score >= 50 ? '#FF8C00' : '#FF3B30'
    const label = score >= 75 ? 'Great — push hard today' : score >= 50 ? 'Average — train smart' : 'Low — recovery day'

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6" style={{ background: `${color}20`, border: `3px solid ${color}` }}>
          <div>
            <div className="text-4xl font-black" style={{ color }}>{score}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">/ 100</div>
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2">Readiness Score</h2>
        <p className="text-gray-400 mb-8">{label}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 rounded-xl font-bold text-white cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
        >
          See This Week's Plan →
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Morning Check-in</h1>
      <p className="text-gray-400 text-sm mb-8">Takes 60 seconds — shapes today's training.</p>

      <form onSubmit={submit}>
        <div className="sm:grid sm:grid-cols-2 sm:gap-8">

          {/* Left column: ratings + stress + notes */}
          <div className="space-y-6">
            <RatingInput label="Sleep Quality" value={sleep} onChange={setSleep} sublabels={['Poor', 'Excellent']} />
            <RatingInput label="Energy Level" value={energy} onChange={setEnergy} sublabels={['Exhausted', 'Energised']} />
            <RatingInput label="Motivation" value={motivation} onChange={setMotivation} sublabels={['Zero drive', 'Ready to go']} />

            {/* Stress toggle */}
            <div>
              <label className="block text-sm font-semibold mb-2">Elevated Stress?</label>
              <div className="flex gap-3">
                {(['No', 'Yes'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStress(opt === 'Yes')}
                    className="flex-1 h-10 rounded-lg font-bold text-sm transition cursor-pointer"
                    style={{
                      background: (stress ? opt === 'Yes' : opt === 'No') ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1E1E1E',
                      border: `1px solid ${(stress ? opt === 'Yes' : opt === 'No') ? '#FF3B30' : '#2A2A2A'}`,
                      color: (stress ? opt === 'Yes' : opt === 'No') ? '#fff' : '#6B7280',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {stress && (
                <input
                  className="mt-2 w-full px-3 py-2 rounded-lg text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30]"
                  placeholder="What's stressing you? (optional)"
                  value={stressNote}
                  onChange={e => setStressNote(e.target.value)}
                  maxLength={500}
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3B30] resize-none"
                rows={3}
                placeholder="Anything else worth noting today..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={1000}
              />
            </div>
          </div>

          {/* Right column: soreness map */}
          <div className="mt-6 sm:mt-0">
            <label className="block text-sm font-semibold mb-1">Soreness / Pain</label>
            <p className="text-xs text-gray-500 mb-3">Tap to mark sore. Tap again to increase severity (1→2→3). Tap once more to clear.</p>
            <div className="grid grid-cols-3 gap-2">
              {BODY_AREAS.map(area => {
                const entry = sorenessMap.find(s => s.area === area)
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleSoreness(area)}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer"
                    style={{
                      background: entry ? `${severityColor(entry.severity)}22` : '#1E1E1E',
                      border: `1px solid ${entry ? severityColor(entry.severity) : '#2A2A2A'}`,
                      color: entry ? severityColor(entry.severity) : '#6B7280',
                    }}
                  >
                    {area}{entry ? ` ×${entry.severity}` : ''}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-6">{error}</p>}

        <div className="fixed bottom-0 left-0 right-0 p-4 sm:static sm:p-0 sm:mt-8" style={{ background: 'linear-gradient(to top, #0D0D0D 80%, transparent)' }}>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #FF3B30, #FF8C00)' }}
          >
            {loading ? 'Submitting...' : 'Submit Check-in →'}
          </button>
        </div>
      </form>
    </div>
  )
}
