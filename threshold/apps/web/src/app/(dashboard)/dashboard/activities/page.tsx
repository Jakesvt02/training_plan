'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '@/lib/api'
import { ActivityCard } from '@/components/activity-card'
import type { Activity, ActivitiesResponse } from '@threshold/shared'

const TYPES = ['All', 'Run', 'Ride', 'Workout', 'Walk', 'Swim']

export default function ActivitiesPage() {
  const [data, setData] = useState<ActivitiesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('All')

  const load = useCallback(async (p: number, type: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (type !== 'All') params.set('type', type.toLowerCase())
      const result = await apiGet<ActivitiesResponse>(`/api/activities?${params}`)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page, typeFilter) }, [page, typeFilter, load])

  function changeType(t: string) {
    setTypeFilter(t)
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Activity Log</h1>
          {data && <p className="text-gray-400 text-sm mt-0.5">{data.total} activities synced</p>}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => changeType(t)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition cursor-pointer"
            style={{
              background: typeFilter === t ? 'linear-gradient(135deg, #FF3B30, #FF8C00)' : '#1A1A1A',
              color: typeFilter === t ? '#fff' : '#9CA3AF',
              border: `1px solid ${typeFilter === t ? 'transparent' : '#2A2A2A'}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.activities.length ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-4">🏃</p>
          <p className="text-gray-400">No activities yet</p>
          <p className="text-xs text-gray-600 mt-1">Connect Strava or Polar and sync to see your workouts here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.activities.map((activity: Activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {/* Pagination */}
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
              <span className="text-sm text-gray-500">
                Page {page} of {data.pages}
              </span>
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
