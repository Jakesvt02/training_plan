import type { Activity } from '@threshold/shared'

const TYPE_ICONS: Record<string, string> = {
  run: '🏃',
  ride: '🚴',
  virtualride: '🚴',
  walk: '🚶',
  hike: '⛰️',
  swim: '🏊',
  workout: '💪',
  weighttraining: '🏋️',
  yoga: '🧘',
  skiing: '⛷️',
  rowing: '🚣',
  elliptical: '⚙️',
}

const TYPE_COLORS: Record<string, string> = {
  run: '#FF8C00',
  ride: '#4CAF50',
  virtualride: '#4CAF50',
  walk: '#64B5F6',
  hike: '#81C784',
  swim: '#4FC3F7',
  workout: '#FF3B30',
  weighttraining: '#AB47BC',
  yoga: '#F06292',
  rowing: '#26C6DA',
}

function typeColor(type: string) {
  return TYPE_COLORS[type.toLowerCase()] ?? '#888'
}

function typeIcon(type: string) {
  return TYPE_ICONS[type.toLowerCase()] ?? '⚡'
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`
  return `${Math.round(m)} m`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  // Compare local calendar dates so a workout done at 9pm yesterday isn't "Today"
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((nowDay.getTime() - dDay.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
}

export function ActivityCard({ activity, compact = false }: { activity: Activity; compact?: boolean }) {
  const color = typeColor(activity.type)
  const icon = typeIcon(activity.type)
  const typeName = activity.type.charAt(0).toUpperCase() + activity.type.slice(1)

  if (compact) {
    return (
      <div className="flex items-center gap-3 py-3 border-b border-[#1A1A1A] last:border-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${color}20` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{activity.name || typeName}</p>
          <p className="text-xs text-gray-500">{formatDate(activity.startedAt)} · {formatDuration(activity.durationSec)}{activity.distanceM ? ` · ${formatDistance(activity.distanceM)}` : ''}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {activity.tss != null && (
            <div>
              <div className="text-sm font-bold" style={{ color }}>{activity.tss} <span className="text-xs font-normal text-gray-500">TSS</span></div>
              <div className="text-[9px] text-gray-600 leading-tight">Training Stress</div>
            </div>
          )}
          {activity.avgHr && <div className="text-xs text-gray-500">{activity.avgHr} bpm</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#141414', border: '1px solid #1E1E1E' }}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${color}20` }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{activity.name || typeName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.startedAt)} · <span style={{ color }} className="font-medium">{typeName}</span> · {activity.provider}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-3">
            <Stat label="Duration" value={formatDuration(activity.durationSec)} />
            {activity.distanceM != null && <Stat label="Distance" value={formatDistance(activity.distanceM)} />}
            {activity.avgHr != null && <Stat label="Avg HR" value={`${activity.avgHr} bpm`} />}
            {activity.maxHr != null && <Stat label="Max HR" value={`${activity.maxHr} bpm`} />}
            {activity.calories != null && <Stat label="Calories" value={`${activity.calories} kcal`} />}
            {activity.elevationM != null && activity.elevationM > 0 && <Stat label="Elevation" value={`${Math.round(activity.elevationM)} m`} />}
            {activity.tss != null && <Stat label="Training Stress" value={String(activity.tss)} color={color} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold" style={{ color: color ?? '#F5F5F5' }}>{value}</div>
    </div>
  )
}
