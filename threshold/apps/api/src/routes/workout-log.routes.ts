import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/workout-logs?page=1&limit=20
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20)

  const where = { userId: req.userId! }
  const [logs, total] = await Promise.all([
    prisma.workoutLog.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workoutLog.count({ where }),
  ])

  res.json({ success: true, data: { logs, total, page, pages: Math.ceil(total / limit) } })
})

// GET /api/workout-logs/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const log = await prisma.workoutLog.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!log) return res.status(404).json({ success: false, error: 'Not found' })
  res.json({ success: true, data: log })
})

// POST /api/workout-logs
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { date, name, sessionType, durationMin, effortRating, notes, exercisesJson, plannedJson, tss } = req.body

  if (!sessionType) {
    return res.status(400).json({ success: false, error: 'sessionType is required' })
  }

  const log = await prisma.workoutLog.create({
    data: {
      userId: req.userId!,
      date: date ? new Date(date) : new Date(),
      name: name || null,
      sessionType,
      durationMin: durationMin ? parseInt(durationMin) : null,
      effortRating: effortRating ? parseInt(effortRating) : null,
      notes: notes || null,
      plannedJson: plannedJson ?? null,
      exercisesJson: exercisesJson ?? [],
      tss: tss ? parseInt(tss) : null,
    },
  })

  res.status(201).json({ success: true, data: log })
})

// PUT /api/workout-logs/:id
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const existing = await prisma.workoutLog.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' })

  const { name, sessionType, durationMin, effortRating, notes, exercisesJson, tss } = req.body

  const log = await prisma.workoutLog.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(sessionType && { sessionType }),
      ...(durationMin !== undefined && { durationMin: durationMin ? parseInt(durationMin) : null }),
      ...(effortRating !== undefined && { effortRating: effortRating ? parseInt(effortRating) : null }),
      ...(notes !== undefined && { notes }),
      ...(exercisesJson !== undefined && { exercisesJson }),
      ...(tss !== undefined && { tss: tss ? parseInt(tss) : null }),
    },
  })

  res.json({ success: true, data: log })
})

// DELETE /api/workout-logs/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const existing = await prisma.workoutLog.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' })

  await prisma.workoutLog.delete({ where: { id: req.params.id } })
  res.json({ success: true, data: null })
})

export default router
