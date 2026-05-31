import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// Exponential weighted average decay constants
const ATL_DECAY = 1 - 2 / (7 + 1)   // 7-day time constant
const CTL_DECAY = 1 - 2 / (42 + 1)  // 42-day time constant

// GET /api/training-load?days=90
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const days = Math.min(365, Math.max(14, parseInt(req.query.days as string) || 90))

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  // Fetch all activities in range (+ 42 extra days back for CTL warm-up)
  const warmupSince = new Date(since)
  warmupSince.setDate(warmupSince.getDate() - 42)

  const [activities, workoutLogs] = await Promise.all([
    prisma.activity.findMany({
      where: {
        userId: req.userId!,
        startedAt: { gte: warmupSince },
        tss: { not: null },
      },
      select: { startedAt: true, tss: true },
    }),
    prisma.workoutLog.findMany({
      where: {
        userId: req.userId!,
        date: { gte: warmupSince },
        tss: { not: null },
      },
      select: { date: true, tss: true },
    }),
  ])

  // Build a map of date string → total TSS
  const tssMap = new Map<string, number>()

  for (const a of activities) {
    const key = a.startedAt.toISOString().split('T')[0]
    tssMap.set(key, (tssMap.get(key) ?? 0) + (a.tss ?? 0))
  }
  for (const w of workoutLogs) {
    const key = new Date(w.date).toISOString().split('T')[0]
    tssMap.set(key, (tssMap.get(key) ?? 0) + (w.tss ?? 0))
  }

  // Generate every day from warmupSince to today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allDays: string[] = []
  const cursor = new Date(warmupSince)
  while (cursor <= today) {
    allDays.push(cursor.toISOString().split('T')[0])
    cursor.setDate(cursor.getDate() + 1)
  }

  // Compute ATL, CTL, TSB for each day using EWA
  let atl = 0
  let ctl = 0

  const result: { date: string; tss: number; atl: number; ctl: number; tsb: number }[] = []

  for (const day of allDays) {
    const tss = tssMap.get(day) ?? 0
    atl = atl * ATL_DECAY + tss * (1 - ATL_DECAY)
    ctl = ctl * CTL_DECAY + tss * (1 - CTL_DECAY)
    const tsb = ctl - atl

    // Only include days within the requested window
    if (day >= since.toISOString().split('T')[0]) {
      result.push({
        date: day,
        tss: Math.round(tss),
        atl: Math.round(atl * 10) / 10,
        ctl: Math.round(ctl * 10) / 10,
        tsb: Math.round(tsb * 10) / 10,
      })
    }
  }

  res.json({ success: true, data: result })
})

export default router
