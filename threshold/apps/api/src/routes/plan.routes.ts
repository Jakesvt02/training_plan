import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { selectWeeklyTemplate, determinePlanPhase } from '../services/adaptive.service'
import { Discipline } from '@prisma/client'

const router = Router()

// GET /api/plan/weekly — returns adaptive weekly plan based on latest check-in + training load
router.get('/weekly', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!

    const profile = await prisma.athleteProfile.findUnique({ where: { userId } })
    if (!profile) {
      res.status(404).json({ success: false, error: 'No athlete profile found. Complete onboarding first.' })
      return
    }

    // Latest check-in for readiness + soreness
    const latestCheckIn = await prisma.checkIn.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    })

    const readinessScore = latestCheckIn?.readinessScore ?? 70
    const sorenessMap = (latestCheckIn?.sorenessMap ?? []) as { area: string; severity: number }[]

    // Latest training plan for phase context
    const activePlan = await prisma.trainingPlan.findFirst({
      where: { userId },
      orderBy: { startDate: 'desc' },
    })

    const phase = determinePlanPhase(
      activePlan?.endDate ?? profile.goalDate ?? null,
      activePlan?.startDate ?? new Date(),
    )

    const weeklyPlan = await selectWeeklyTemplate(
      {
        userId,
        discipline: profile.primaryDiscipline as Discipline,
        phase,
        readinessScore,
        recentHrvTrend: null, // will be populated once Polar sync is implemented
      },
      { sorenessMap },
    )

    if (!weeklyPlan) {
      res.status(404).json({ success: false, error: 'No template found for this discipline and phase.' })
      return
    }

    res.json({ success: true, data: { phase, readinessScore, weeklyPlan } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/plan/horizon — upcoming weeks with phase + intensity forecast
router.get('/horizon', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const profile = await prisma.athleteProfile.findUnique({ where: { userId } })
    if (!profile) {
      res.status(404).json({ success: false, error: 'No athlete profile found.' })
      return
    }

    const goalDate = profile.goalDate ?? null
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1) // Monday this week

    const weeksAhead = goalDate
      ? Math.min(52, Math.ceil((goalDate.getTime() - startDate.getTime()) / (7 * 24 * 3600 * 1000)) + 1)
      : 12

    const weeks = []
    for (let i = 0; i < weeksAhead; i++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(startDate.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      // Compute phase as if this week is "now"
      const elapsed = weekStart.getTime() - startDate.getTime()
      const total = goalDate ? goalDate.getTime() - startDate.getTime() : null
      const pct = total ? elapsed / total : 0

      let phase = 'base'
      if (total) {
        if (pct < 0.45) phase = 'base'
        else if (pct < 0.75) phase = 'build'
        else if (pct < 0.90) phase = 'peak'
        else phase = 'taper'
      }

      const daysToGoal = goalDate
        ? Math.ceil((goalDate.getTime() - weekStart.getTime()) / (24 * 3600 * 1000))
        : null

      weeks.push({
        weekNumber: i + 1,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        phase,
        isCurrent: i === 0,
        daysToGoal,
      })
    }

    // Fetch ALL templates for this discipline so we can vary by intensity within a phase
    const templates = await prisma.programTemplate.findMany({
      where: { discipline: profile.primaryDiscipline as Discipline },
      include: { sessions: { orderBy: { dayOfWeek: 'asc' } } },
      orderBy: [{ phase: 'asc' }, { intensityLevel: 'asc' }],
    })

    // Group templates by phase, ordered by intensity: recovery → low → moderate → high
    const INTENSITY_ORDER = ['recovery', 'low', 'moderate', 'high']
    const byPhase: Record<string, typeof templates> = {}
    for (const t of templates) {
      if (!byPhase[t.phase]) byPhase[t.phase] = []
      byPhase[t.phase].push(t)
    }
    for (const phase of Object.keys(byPhase)) {
      byPhase[phase].sort((a, b) => INTENSITY_ORDER.indexOf(a.intensityLevel) - INTENSITY_ORDER.indexOf(b.intensityLevel))
    }

    // Assign a template to each week — cycle through intensities within the phase
    // so weeks build up: low → moderate → high → moderate → ...
    const weekPhaseCount: Record<string, number> = {}
    const weeksWithTemplate = weeks.map(w => {
      const phaseTemplates = byPhase[w.phase] ?? []
      const idx = weekPhaseCount[w.phase] ?? 0
      // Pattern: low, moderate, high, moderate, low, moderate, high... (deload every 4th)
      const PATTERN = [0, 1, Math.min(2, phaseTemplates.length - 1), 1]
      const template = phaseTemplates[PATTERN[idx % PATTERN.length]]
      weekPhaseCount[w.phase] = idx + 1

      return {
        ...w,
        intensityLevel: template?.intensityLevel ?? 'moderate',
        weekInPhase: idx + 1,
        sessions: template?.sessions.map(s => ({
          dayOfWeek: s.dayOfWeek,
          name: s.name,
          sessionType: s.sessionType,
          durationMin: s.estimatedDurationMin,
          tss: s.estimatedTss,
          sessionJson: s.sessionJson,
        })) ?? [],
      }
    })

    res.json({
      success: true,
      data: {
        goalDate: goalDate?.toISOString().split('T')[0] ?? null,
        goalDetail: profile.goalDetail ?? null,
        discipline: profile.primaryDiscipline,
        weeks: weeksWithTemplate,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/plan/templates — list all available templates (admin/debug)
router.get('/templates', requireAuth, async (_req, res) => {
  try {
    const templates = await prisma.programTemplate.findMany({
      include: { sessions: { orderBy: { dayOfWeek: 'asc' } } },
      orderBy: [{ discipline: 'asc' }, { phase: 'asc' }],
    })
    res.json({ success: true, data: templates })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
