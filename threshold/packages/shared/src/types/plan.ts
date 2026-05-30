export interface SessionPlan {
  dayOfWeek: number
  sessionType: string
  name: string
  estimatedDurationMin: number
  estimatedTss: number
  description?: string | null
  sessionJson: unknown
  isSwapped: boolean
  originalType?: string
}

export interface WeeklyPlan {
  templateId: string
  templateName: string
  intensityLevel: string
  weeklyTssTarget: number
  sessions: SessionPlan[]
  reason: string
}

export interface WeeklyPlanResponse {
  phase: string
  readinessScore: number
  weeklyPlan: WeeklyPlan
}

export interface CheckIn {
  id: string
  userId: string
  date: string
  sleep: number
  energy: number
  motivation: number
  stress: boolean
  stressNote?: string | null
  sorenessMap: { area: string; severity: number }[]
  readinessScore: number
  notes?: string | null
  createdAt: string
}

export interface TrainingLoad {
  date: string
  atl: number
  ctl: number
  tsb: number
  dailyTss: number
}

export interface DeviceConnection {
  provider: string
  providerUserId?: string | null
  expiresAt?: string | null
  createdAt: string
}

export interface Activity {
  id: string
  provider: string
  type: string
  name?: string | null
  startedAt: string
  durationSec: number
  distanceM?: number | null
  avgHr?: number | null
  maxHr?: number | null
  calories?: number | null
  tss?: number | null
  elevationM?: number | null
}

export interface ActivitiesResponse {
  activities: Activity[]
  total: number
  page: number
  pages: number
}

export interface LogSet {
  reps?: number
  weightKg?: number
  durationSec?: number
  distanceM?: number
  meters?: number
  notes?: string
}

export interface LogExercise {
  name: string
  sets: LogSet[]
}

export interface WorkoutLog {
  id: string
  userId: string
  date: string
  name?: string | null
  sessionType: string
  durationMin?: number | null
  effortRating?: number | null
  notes?: string | null
  plannedJson?: unknown
  exercisesJson: LogExercise[]
  tss?: number | null
  createdAt: string
  updatedAt: string
}

export interface WorkoutLogsResponse {
  logs: WorkoutLog[]
  total: number
  page: number
  pages: number
}
