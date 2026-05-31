import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import {
  getPolarAuthUrl,
  exchangePolarCode,
  registerPolarUser,
  syncPolarActivities,
  getLatestHrvData,
} from '../services/polar.service'
import { randomBytes } from 'crypto'

const router = Router()

// GET /api/polar/connect
router.get('/connect', requireAuth, (req: AuthRequest, res) => {
  const state = `${req.userId!}:${randomBytes(8).toString('hex')}`
  const url = getPolarAuthUrl(state)
  res.json({ success: true, data: { url } })
})

// GET /api/polar/callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4002'

  if (error || !code || !state) {
    res.redirect(`${frontendUrl}/dashboard/integrations?error=polar_denied`)
    return
  }

  const userId = state.split(':')[0]
  if (!userId) {
    res.status(400).json({ error: 'Invalid state' })
    return
  }

  try {
    const tokens = await exchangePolarCode(code)

    await prisma.deviceConnection.upsert({
      where: { userId_provider: { userId, provider: 'polar' } },
      update: {
        accessToken: tokens.access_token,
        providerUserId: String(tokens.x_user_id),
      },
      create: {
        userId,
        provider: 'polar',
        accessToken: tokens.access_token,
        providerUserId: String(tokens.x_user_id),
      },
    })

    // Register user with Polar AccessLink API (required once)
    await registerPolarUser(userId)

    res.redirect(`${frontendUrl}/dashboard/integrations?connected=polar`)
  } catch (err) {
    console.error('Polar callback error:', err)
    res.redirect(`${frontendUrl}/dashboard/integrations?error=polar_failed`)
  }
})

// POST /api/polar/sync
router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await syncPolarActivities(req.userId!)
    res.json({ success: true, data: result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sync failed'
    res.status(400).json({ success: false, error: msg })
  }
})

// GET /api/polar/hrv
router.get('/hrv', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await getLatestHrvData(req.userId!)
    res.json({ success: true, data: data ?? { trend: null } })
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch HRV data' })
  }
})

// DELETE /api/polar/disconnect
router.delete('/disconnect', requireAuth, async (req: AuthRequest, res) => {
  await prisma.deviceConnection.deleteMany({
    where: { userId: req.userId!, provider: 'polar' },
  })
  res.json({ success: true, data: null })
})

export default router
