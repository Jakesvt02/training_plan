import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/profile
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } }),
    prisma.athleteProfile.findUnique({ where: { userId } }),
  ])

  if (!user) return res.status(404).json({ success: false, error: 'User not found' })

  res.json({ success: true, data: { user, profile } })
})

// PUT /api/profile — update editable fields
router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!
  const {
    firstName, lastName,
    weightKg, heightCm,
    trainingDaysPerWeek, experienceLevel,
    goal, goalDate, goalDetail,
    primaryDiscipline, weeklyWeightGoalKg,
    gender, dateOfBirth, currentFitnessLevel,
  } = req.body

  const userUpdate: Record<string, unknown> = {}
  if (firstName) userUpdate.firstName = String(firstName).trim()
  if (lastName) userUpdate.lastName = String(lastName).trim()

  const profileUpdate: Record<string, unknown> = {}
  if (weightKg != null) profileUpdate.weightKg = parseFloat(weightKg)
  if (heightCm != null) profileUpdate.heightCm = parseFloat(heightCm)
  if (trainingDaysPerWeek != null) profileUpdate.trainingDaysPerWeek = parseInt(trainingDaysPerWeek)
  if (experienceLevel) profileUpdate.experienceLevel = experienceLevel
  if (goal) profileUpdate.goal = goal
  if (goalDate !== undefined) profileUpdate.goalDate = goalDate ? new Date(goalDate) : null
  if (goalDetail !== undefined) profileUpdate.goalDetail = goalDetail || null
  if (primaryDiscipline) profileUpdate.primaryDiscipline = primaryDiscipline
  if (weeklyWeightGoalKg !== undefined) profileUpdate.weeklyWeightGoalKg = weeklyWeightGoalKg != null ? parseFloat(weeklyWeightGoalKg) : null
  if (gender) profileUpdate.gender = gender
  if (dateOfBirth) profileUpdate.dateOfBirth = new Date(dateOfBirth)
  if (currentFitnessLevel !== undefined) profileUpdate.currentFitnessLevel = currentFitnessLevel || null

  // Recalculate BMI if weight or height changed
  if (profileUpdate.weightKg || profileUpdate.heightCm) {
    const existing = await prisma.athleteProfile.findUnique({ where: { userId } })
    const w = (profileUpdate.weightKg as number) ?? existing?.weightKg ?? 0
    const h = ((profileUpdate.heightCm as number) ?? existing?.heightCm ?? 0) / 100
    if (w && h) profileUpdate.bmi = parseFloat((w / (h * h)).toFixed(1))
  }

  const [user, profile] = await Promise.all([
    Object.keys(userUpdate).length
      ? prisma.user.update({ where: { id: userId }, data: userUpdate, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } })
      : prisma.user.findUnique({ where: { id: userId }, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } }),
    Object.keys(profileUpdate).length
      ? prisma.athleteProfile.update({ where: { userId }, data: profileUpdate })
      : prisma.athleteProfile.findUnique({ where: { userId } }),
  ])

  res.json({ success: true, data: { user, profile } })
})

export default router
