import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/activities?page=1&limit=20&type=run
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20)
  const type = req.query.type as string | undefined

  const where = {
    userId: req.userId!,
    ...(type ? { type } : {}),
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        provider: true,
        type: true,
        name: true,
        startedAt: true,
        durationSec: true,
        distanceM: true,
        avgHr: true,
        maxHr: true,
        calories: true,
        tss: true,
        elevationM: true,
      },
    }),
    prisma.activity.count({ where }),
  ])

  res.json({
    success: true,
    data: {
      activities,
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  })
})

// GET /api/activities/recent — last 5 for dashboard widget
router.get('/recent', requireAuth, async (req: AuthRequest, res) => {
  const activities = await prisma.activity.findMany({
    where: { userId: req.userId! },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      provider: true,
      type: true,
      name: true,
      startedAt: true,
      durationSec: true,
      distanceM: true,
      avgHr: true,
      tss: true,
    },
  })
  res.json({ success: true, data: activities })
})

export default router
