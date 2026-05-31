import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// ─── TDEE + macro targets ────────────────────────────────────────────────────

function calcBmr(weightKg: number, heightCm: number, ageYears: number, gender: string): number {
  return gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161
}

// Base burn = BMR × sedentary multiplier (1.2).
// Exercise calories are added separately from synced activities,
// so we don't apply a training-days multiplier here — that would double-count.
function calcBaseBurn(weightKg: number, heightCm: number, ageYears: number, gender: string): number {
  return Math.round(calcBmr(weightKg, heightCm, ageYears, gender) * 1.2)
}

// Keep TDEE for macro target calculation (goal-adjusted calories still need activity context)
function calcTdee(weightKg: number, heightCm: number, ageYears: number, gender: string, trainingDays: number): number {
  const bmr = calcBmr(weightKg, heightCm, ageYears, gender)
  const multiplier =
    trainingDays <= 1 ? 1.2 :
    trainingDays <= 2 ? 1.375 :
    trainingDays <= 4 ? 1.55 :
    trainingDays <= 5 ? 1.725 : 1.9
  return Math.round(bmr * multiplier)
}

function calcMacros(tdee: number, weightKg: number, goal: string, weeklyWeightGoalKg?: number | null) {
  let calAdjustment: number
  let proteinPerKg: number
  let fatPerKg: number

  // If user set a specific weekly weight change target, derive the calorie adjustment from it.
  // 1 kg of body fat ≈ 7,700 kcal → daily adjustment = weeklyGoal * 7700 / 7
  if (weeklyWeightGoalKg != null) {
    calAdjustment = Math.round(weeklyWeightGoalKg * 7700 / 7)
    // Cap aggressive deficits at -1100 kcal/day (1.0 kg/week) for safety
    calAdjustment = Math.max(-1100, Math.min(700, calAdjustment))
  } else {
    switch (goal) {
      case 'fat_loss':       calAdjustment = -400; break
      case 'muscle_gain':    calAdjustment = +250; break
      case 'recomposition':  calAdjustment = 0;    break
      case 'endurance':
      case 'race_completion':
      case 'race_time':      calAdjustment = +100; break
      default:               calAdjustment = 0
    }
  }

  switch (goal) {
    case 'fat_loss':       proteinPerKg = 2.4; fatPerKg = 0.8; break
    case 'muscle_gain':    proteinPerKg = 2.0; fatPerKg = 1.0; break
    case 'recomposition':  proteinPerKg = 2.4; fatPerKg = 0.9; break
    case 'endurance':
    case 'race_completion':
    case 'race_time':      proteinPerKg = 1.8; fatPerKg = 1.0; break
    default:               proteinPerKg = 2.0; fatPerKg = 1.0
  }

  const targetCalories = tdee + calAdjustment
  const proteinG = Math.round(weightKg * proteinPerKg)
  const fatG = Math.round(weightKg * fatPerKg)
  const carbsG = Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4)

  return { targetCalories, calAdjustment, proteinG, fatG, carbsG: Math.max(carbsG, 50) }
}

// GET /api/nutrition/targets
router.get('/targets', requireAuth, async (req: AuthRequest, res) => {
  const profile = await prisma.athleteProfile.findUnique({ where: { userId: req.userId! } })
  if (!profile) {
    res.status(404).json({ success: false, error: 'No profile found' })
    return
  }

  const ageYears = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
  const tdee = calcTdee(profile.weightKg, profile.heightCm, ageYears, profile.gender, profile.trainingDaysPerWeek)
  const baseBurn = calcBaseBurn(profile.weightKg, profile.heightCm, ageYears, profile.gender)
  const macros = calcMacros(tdee, profile.weightKg, profile.goal, profile.weeklyWeightGoalKg)

  res.json({ success: true, data: { tdee, baseBurn, ...macros, goal: profile.goal, weightKg: profile.weightKg, weeklyWeightGoalKg: profile.weeklyWeightGoalKg } })
})

// GET /api/nutrition/summary?date=YYYY-MM-DD
// Returns full energy balance: base burn + exercise calories + eaten + remaining
router.get('/summary', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0]
  const date = new Date(dateStr)
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)

  const [profile, activities, workoutLogs, nutritionEntries] = await Promise.all([
    prisma.athleteProfile.findUnique({ where: { userId } }),
    prisma.activity.findMany({
      where: { userId, startedAt: { gte: dayStart, lte: dayEnd } },
      select: { id: true, name: true, type: true, calories: true, durationSec: true, tss: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId, date },
      select: { id: true, name: true, durationMin: true, effortRating: true, tss: true },
    }),
    prisma.nutritionLog.findMany({
      where: { userId, date },
      select: { calories: true, proteinG: true, carbsG: true, fatG: true },
    }),
  ])

  if (!profile) {
    res.status(404).json({ success: false, error: 'No profile found' })
    return
  }

  const ageYears = Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
  const tdee = calcTdee(profile.weightKg, profile.heightCm, ageYears, profile.gender, profile.trainingDaysPerWeek)
  const baseBurn = calcBaseBurn(profile.weightKg, profile.heightCm, ageYears, profile.gender)
  const macros = calcMacros(tdee, profile.weightKg, profile.goal, profile.weeklyWeightGoalKg)

  // Exercise calories: use recorded calories from Strava/Polar if available,
  // otherwise estimate from TSS (1 TSS ≈ 5 kcal for a 70kg athlete, scaled by weight)
  const exerciseActivities = activities.map(a => {
    const burned = a.calories ??
      (a.tss ? Math.round(a.tss * 5 * (profile.weightKg / 70)) : 0)
    return { id: a.id, name: a.name ?? a.type, type: a.type, calories: burned, source: 'activity' as const }
  })

  const exerciseWorkouts = workoutLogs.map(w => {
    const burned = w.tss ? Math.round(w.tss * 5 * (profile.weightKg / 70)) :
      w.durationMin ? Math.round(w.durationMin * 5) : 0
    return { id: w.id, name: w.name ?? 'Workout', type: 'workout', calories: burned, source: 'log' as const }
  })

  const allExercise = [...exerciseActivities, ...exerciseWorkouts].filter(e => e.calories > 0)
  const exerciseCalories = allExercise.reduce((s, e) => s + e.calories, 0)
  const totalBurn = baseBurn + exerciseCalories

  const eaten = nutritionEntries.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    proteinG: acc.proteinG + e.proteinG,
    carbsG: acc.carbsG + e.carbsG,
    fatG: acc.fatG + e.fatG,
  }), { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })

  const remaining = totalBurn - eaten.calories

  res.json({
    success: true,
    data: {
      date: dateStr,
      tdee,
      baseBurn,
      exerciseCalories,
      totalBurn,
      targetCalories: macros.targetCalories,
      eaten: { ...eaten, calories: Math.round(eaten.calories) },
      remaining,
      macroTargets: { proteinG: macros.proteinG, carbsG: macros.carbsG, fatG: macros.fatG },
      exercises: allExercise,
      goal: profile.goal,
      weightKg: profile.weightKg,
    },
  })
})

// ─── Daily log ───────────────────────────────────────────────────────────────

// GET /api/nutrition/log?date=YYYY-MM-DD
router.get('/log', requireAuth, async (req: AuthRequest, res) => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0]
  const date = new Date(dateStr)

  const entries = await prisma.nutritionLog.findMany({
    where: { userId: req.userId!, date },
    orderBy: { createdAt: 'asc' },
  })

  res.json({ success: true, data: entries })
})

// POST /api/nutrition/log
router.post('/log', requireAuth, async (req: AuthRequest, res) => {
  const { date, mealType, name, calories, proteinG, carbsG, fatG } = req.body

  if (!name || calories == null) {
    res.status(400).json({ success: false, error: 'name and calories are required' })
    return
  }

  const entry = await prisma.nutritionLog.create({
    data: {
      userId: req.userId!,
      date: date ? new Date(date) : new Date(),
      mealType: mealType || 'snack',
      name,
      calories: Math.round(calories),
      proteinG: proteinG ?? 0,
      carbsG: carbsG ?? 0,
      fatG: fatG ?? 0,
    },
  })

  res.json({ success: true, data: entry })
})

// DELETE /api/nutrition/log/:id
router.delete('/log/:id', requireAuth, async (req: AuthRequest, res) => {
  const entry = await prisma.nutritionLog.findUnique({ where: { id: req.params.id } })
  if (!entry || entry.userId !== req.userId!) {
    res.status(404).json({ success: false, error: 'Not found' })
    return
  }
  await prisma.nutritionLog.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// ─── Food search (Open Food Facts proxy) ────────────────────────────────────

router.get('/search', requireAuth, async (req: AuthRequest, res) => {
  const q = (req.query.q as string)?.trim()
  if (!q || q.length < 2) {
    res.json({ success: true, data: [] })
    return
  }

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=15&fields=product_name,nutriments,serving_size,brands`
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const json = await response.json() as { products?: Record<string, unknown>[] }

    const results = (json.products ?? [])
      .filter((p): p is Record<string, unknown> => !!p.product_name)
      .map(p => {
        const n = (p.nutriments ?? {}) as Record<string, number>
        const per100 = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0
        const serving = parseFloat(p.serving_size as string) || 100
        const factor = serving / 100
        return {
          name: `${p.product_name as string}${p.brands ? ` (${p.brands})` : ''}`,
          servingSize: `${serving}g`,
          calories: Math.round(per100 * factor),
          proteinG: Math.round((n['proteins_100g'] ?? 0) * factor * 10) / 10,
          carbsG: Math.round((n['carbohydrates_100g'] ?? 0) * factor * 10) / 10,
          fatG: Math.round((n['fat_100g'] ?? 0) * factor * 10) / 10,
        }
      })
      .filter(r => r.calories > 0)
      .slice(0, 10)

    res.json({ success: true, data: results })
  } catch {
    res.json({ success: true, data: [] })
  }
})

export default router
