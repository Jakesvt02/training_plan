import { Router, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

function calcReadiness(sleep: number, energy: number, motivation: number, stress: boolean, soreness: { severity: number }[]): number {
  // Base score from wellness metrics (0-70)
  const wellnessScore = ((sleep + energy + motivation) / 15) * 70

  // Stress penalty (-10)
  const stressPenalty = stress ? 10 : 0

  // Soreness penalty — weighted by severity
  const sorenessPenalty = soreness.reduce((sum, s) => sum + s.severity * 3, 0)

  return Math.max(0, Math.min(100, Math.round(wellnessScore - stressPenalty - sorenessPenalty)))
}

// POST /api/checkin — submit morning check-in
router.post(
  '/',
  requireAuth,
  [
    body('sleep').isInt({ min: 1, max: 5 }),
    body('energy').isInt({ min: 1, max: 5 }),
    body('motivation').isInt({ min: 1, max: 5 }),
    body('stress').isBoolean(),
    body('sorenessMap').isArray(),
    body('jointPainMap').optional().isArray(),
    body('stressNote').optional().isString().trim().isLength({ max: 500 }),
    body('notes').optional().isString().trim().isLength({ max: 1000 }),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() })
      return
    }

    const { sleep, energy, motivation, stress, stressNote, sorenessMap, jointPainMap, notes } = req.body
    const readinessScore = calcReadiness(sleep, energy, motivation, stress, sorenessMap ?? [])

    const checkIn = await prisma.checkIn.create({
      data: {
        userId: req.userId!,
        sleep,
        energy,
        motivation,
        stress,
        stressNote: stressNote ?? null,
        sorenessMap: sorenessMap ?? [],
        jointPainMap: jointPainMap ?? null,
        readinessScore,
        notes: notes ?? null,
      },
    })

    res.status(201).json({ success: true, data: { checkIn, readinessScore } })
  },
)

// GET /api/checkin/latest
router.get('/latest', requireAuth, async (req: AuthRequest, res) => {
  const checkIn = await prisma.checkIn.findFirst({
    where: { userId: req.userId! },
    orderBy: { date: 'desc' },
  })
  res.json({ success: true, data: checkIn ?? null })
})

// GET /api/checkin — last 30 check-ins
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId: req.userId! },
    orderBy: { date: 'desc' },
    take: 30,
  })
  res.json({ success: true, data: checkIns })
})

export default router
