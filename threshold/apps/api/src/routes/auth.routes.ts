import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { registerUser, loginUser } from '../services/auth.service'
import { rotateRefreshToken, revokeAllRefreshTokens } from '../lib/jwt'
import { authLimiter } from '../middleware/rateLimit'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authLimiter)

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').escape(),
  body('lastName').trim().notEmpty().withMessage('Last name is required').escape(),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('gender').isIn(['male', 'female']).withMessage('Invalid gender'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth required'),
  body('heightCm').isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50–300 cm'),
  body('weightKg').isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20–500 kg'),
  body('primaryDiscipline')
    .isIn(['hyrox', 'powerlifting', 'bodybuilding', 'crossfit', 'running', 'cycling', 'general_fitness'])
    .withMessage('Invalid discipline'),
  body('experienceLevel')
    .isIn(['beginner', 'intermediate', 'advanced', 'elite'])
    .withMessage('Invalid experience level'),
  body('trainingDaysPerWeek').isInt({ min: 1, max: 7 }).withMessage('Training days must be 1–7'),
  body('goal')
    .isIn(['race_completion', 'race_time', 'competition', 'muscle_gain', 'fat_loss', 'recomposition', 'general_fitness', 'endurance'])
    .withMessage('Invalid goal'),
]

router.post('/register', registerValidation, async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const fields: Record<string, string> = {}
    errors.array().forEach(e => { if ('path' in e) fields[e.path as string] = e.msg })
    res.status(400).json({ success: false, error: 'Validation failed', fields })
    return
  }

  try {
    const result = await registerUser(req.body)
    res.status(201).json({ success: true, data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'EMAIL_TAKEN') {
      res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
        fields: { email: 'An account with this email already exists.' },
      })
      return
    }
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' })
  }
})

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Invalid email or password.' })
      return
    }

    try {
      const result = await loginUser(req.body)
      res.json({ success: true, data: result })
    } catch {
      res.status(401).json({ success: false, error: 'Invalid email or password.' })
    }
  }
)

// Exchange a refresh token for a new access token + rotated refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken || typeof refreshToken !== 'string') {
    res.status(401).json({ success: false, error: 'Refresh token required.' })
    return
  }

  const result = await rotateRefreshToken(refreshToken)
  if (!result) {
    res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' })
    return
  }

  const { signAccessToken } = await import('../lib/jwt')
  const { prisma } = await import('../lib/prisma')
  const user = await prisma.user.findUnique({ where: { id: result.userId } })
  if (!user) {
    res.status(401).json({ success: false, error: 'User not found.' })
    return
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email })
  res.json({ success: true, data: { accessToken, refreshToken: result.newRefreshToken } })
})

// Logout — revoke all refresh tokens for this user
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  await revokeAllRefreshTokens(req.userId!)
  res.json({ success: true })
})

export default router
