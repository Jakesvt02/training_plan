import { PrismaClient, Discipline } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdaptiveInput {
  userId: string
  discipline: Discipline
  phase: string          // base | build | peak | taper
  readinessScore: number // 0-100 from check-in
  recentHrvTrend?: 'improving' | 'stable' | 'declining' | null
}

interface WeeklyPlan {
  templateId: string
  templateName: string
  intensityLevel: string
  weeklyTssTarget: number
  sessions: SessionPlan[]
  reason: string
}

interface SessionPlan {
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

// ─── Intensity selection logic ────────────────────────────────────────────────

function selectIntensity(
  atl: number,
  ctl: number,
  readinessScore: number,
  hrvTrend: string | null | undefined,
): { level: string; reason: string } {
  const tsb = ctl - atl  // positive = fresh, negative = fatigued
  const ratio = ctl > 0 ? atl / ctl : 1

  // Hard override: very low readiness or tanking HRV → recovery
  if (readinessScore < 40 || hrvTrend === 'declining') {
    return { level: 'recovery', reason: `Low readiness (${readinessScore}) or declining HRV → recovery week` }
  }

  // Very fresh (TSB > 15, ratio < 0.85) and good readiness → push harder
  if (tsb > 15 && ratio < 0.85 && readinessScore >= 75) {
    if (hrvTrend === 'improving') {
      return { level: 'high', reason: `Fresh (TSB ${tsb.toFixed(0)}, ATL/CTL ${ratio.toFixed(2)}) + improving HRV → high intensity` }
    }
    return { level: 'moderate', reason: `Fresh (TSB ${tsb.toFixed(0)}) + good readiness → moderate-high` }
  }

  // Moderately fatigued (TSB -10 to 0) or average readiness
  if (tsb >= -10 && readinessScore >= 60) {
    return { level: 'moderate', reason: `Moderate fatigue (TSB ${tsb.toFixed(0)}) + adequate readiness → moderate` }
  }

  // Fatigued (TSB < -10) → low
  if (tsb < -10 && readinessScore >= 55) {
    return { level: 'low', reason: `Accumulated fatigue (TSB ${tsb.toFixed(0)}) → low intensity` }
  }

  // Fatigued + poor readiness → recovery
  return { level: 'recovery', reason: `High fatigue + sub-optimal readiness (${readinessScore}) → recovery week` }
}

// ─── Day-level swap logic ─────────────────────────────────────────────────────

function applyDaySwaps(
  sessions: SessionPlan[],
  readinessScore: number,
  sorenessMap: { area: string; severity: number }[],
): SessionPlan[] {
  if (readinessScore >= 65 && sorenessMap.length === 0) return sessions

  const highSoreness = sorenessMap.some(s => s.severity >= 3)

  return sessions.map(session => {
    // Rest days are never swapped
    if (session.sessionType === 'rest' || session.sessionType === 'recovery') return session

    let shouldSwap = false
    let swapTo = 'recovery'

    // Monday/Tuesday hard sessions → swap to recovery on very low readiness
    if (readinessScore < 55 && ['run', 'functional', 'hyrox_drills', 'wod', 'lift'].includes(session.sessionType)) {
      shouldSwap = true
    }

    // High soreness → swap hard sessions to recovery
    if (highSoreness && ['lift', 'strength', 'hyrox_drills', 'functional', 'wod'].includes(session.sessionType)) {
      shouldSwap = true
    }

    if (!shouldSwap) return session

    // Find the first swappable alternative from swappableWith list
    const swappableWith = (session as unknown as { swappableWith?: string[] }).swappableWith ?? []
    if (swappableWith.includes('recovery')) swapTo = 'recovery'
    else if (swappableWith.includes('rest')) swapTo = 'rest'

    return {
      ...session,
      sessionType: swapTo,
      name: `${session.name} → Swapped to ${swapTo}`,
      estimatedTss: Math.floor(session.estimatedTss * 0.3),
      isSwapped: true,
      originalType: session.sessionType,
    }
  })
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export async function selectWeeklyTemplate(
  input: AdaptiveInput,
  options: {
    sorenessMap?: { area: string; severity: number }[]
  } = {},
): Promise<WeeklyPlan | null> {
  // Get latest training load for this user
  const latestLoad = await prisma.trainingLoad.findFirst({
    where: { userId: input.userId },
    orderBy: { date: 'desc' },
  })

  const atl = latestLoad?.atl ?? 30
  const ctl = latestLoad?.ctl ?? 30

  const { level: intensityLevel, reason } = selectIntensity(
    atl, ctl, input.readinessScore, input.recentHrvTrend,
  )

  // Try exact match, then fall back to adjacent intensities
  const intensityFallbacks: Record<string, string[]> = {
    recovery: ['recovery', 'low'],
    low:      ['low', 'moderate', 'recovery'],
    moderate: ['moderate', 'low', 'high'],
    high:     ['high', 'moderate'],
  }

  let template = null
  for (const level of intensityFallbacks[intensityLevel] ?? [intensityLevel]) {
    template = await prisma.programTemplate.findUnique({
      where: { discipline_phase_intensityLevel: { discipline: input.discipline, phase: input.phase, intensityLevel: level } },
      include: { sessions: { orderBy: { dayOfWeek: 'asc' } } },
    })
    if (template) break
  }

  if (!template) return null

  const sessions: SessionPlan[] = template.sessions.map(s => ({
    dayOfWeek: s.dayOfWeek,
    sessionType: s.sessionType,
    name: s.name,
    estimatedDurationMin: s.estimatedDurationMin,
    estimatedTss: s.estimatedTss,
    description: s.description,
    sessionJson: s.sessionJson,
    isSwapped: false,
  }))

  const finalSessions = applyDaySwaps(
    sessions,
    input.readinessScore,
    options.sorenessMap ?? [],
  )

  return {
    templateId: template.id,
    templateName: template.name,
    intensityLevel: template.intensityLevel,
    weeklyTssTarget: template.weeklyTssTarget,
    sessions: finalSessions,
    reason,
  }
}

// ─── Training load update (called after activity sync) ────────────────────────

export async function updateTrainingLoad(userId: string, date: Date, newTss: number): Promise<void> {
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  // Get previous day's load for EWA calculation
  const yesterday = new Date(dateOnly)
  yesterday.setDate(yesterday.getDate() - 1)

  const prevLoad = await prisma.trainingLoad.findFirst({
    where: { userId, date: { lte: yesterday } },
    orderBy: { date: 'desc' },
  })

  const prevAtl = prevLoad?.atl ?? newTss
  const prevCtl = prevLoad?.ctl ?? newTss

  // Exponentially weighted averages
  const atlAlpha = 2 / (7 + 1)   // 7-day
  const ctlAlpha = 2 / (42 + 1)  // 42-day

  const newAtl = prevAtl + atlAlpha * (newTss - prevAtl)
  const newCtl = prevCtl + ctlAlpha * (newTss - prevCtl)
  const newTsb = newCtl - newAtl

  await prisma.trainingLoad.upsert({
    where: { userId_date: { userId, date: dateOnly } },
    update: { atl: newAtl, ctl: newCtl, tsb: newTsb, dailyTss: newTss },
    create: { userId, date: dateOnly, atl: newAtl, ctl: newCtl, tsb: newTsb, dailyTss: newTss },
  })
}

// ─── Determine current plan phase based on goal date ─────────────────────────

export function determinePlanPhase(goalDate: Date | null | undefined, startDate: Date): string {
  if (!goalDate) return 'base'

  const now = new Date()
  const totalMs = goalDate.getTime() - startDate.getTime()
  const elapsedMs = now.getTime() - startDate.getTime()
  const pct = elapsedMs / totalMs

  if (pct < 0) return 'base'
  if (pct < 0.45) return 'base'
  if (pct < 0.75) return 'build'
  if (pct < 0.90) return 'peak'
  return 'taper'
}
