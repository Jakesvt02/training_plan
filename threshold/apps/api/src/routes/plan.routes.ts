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
