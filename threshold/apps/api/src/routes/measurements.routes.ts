import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { calculateBmi } from '../lib/bmi'

const router = Router()

// GET /api/measurements?limit=90
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const limit = Math.min(365, parseInt(req.query.limit as string) || 90)

  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId: req.userId! },
    orderBy: { date: 'asc' },
    take: limit,
  })

  res.json({ success: true, data: measurements })
})

// POST /api/measurements
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const {
    date, weightKg, bodyFatPercent,
    chestCm, waistCm, hipsCm,
    leftArmCm, rightArmCm,
    leftThighCm, rightThighCm,
  } = req.body

  if (!weightKg || weightKg < 20 || weightKg > 500) {
    res.status(400).json({ success: false, error: 'Valid weight required' })
    return
  }

  const profile = await prisma.athleteProfile.findUnique({ where: { userId: req.userId! } })
  const heightCm = profile?.heightCm ?? 170
  const bmi = calculateBmi(weightKg, heightCm)

  const measurement = await prisma.bodyMeasurement.create({
    data: {
      userId: req.userId!,
      date: date ? new Date(date) : new Date(),
      weightKg,
      bmi,
      bodyFatPercent: bodyFatPercent ?? null,
      chestCm: chestCm ?? null,
      waistCm: waistCm ?? null,
      hipsCm: hipsCm ?? null,
      leftArmCm: leftArmCm ?? null,
      rightArmCm: rightArmCm ?? null,
      leftThighCm: leftThighCm ?? null,
      rightThighCm: rightThighCm ?? null,
    },
  })

  res.json({ success: true, data: measurement })
})

// DELETE /api/measurements/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const existing = await prisma.bodyMeasurement.findUnique({ where: { id: req.params.id } })
  if (!existing || existing.userId !== req.userId!) {
    res.status(404).json({ success: false, error: 'Not found' })
    return
  }
  await prisma.bodyMeasurement.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
