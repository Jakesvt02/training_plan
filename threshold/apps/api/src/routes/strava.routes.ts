import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { getStravaAuthUrl, exchangeStravaCode, syncStravaActivities } from '../services/strava.service'
import { randomBytes } from 'crypto'

const router = Router()

// GET /api/strava/connect — redirect user to Strava OAuth
router.get('/connect', requireAuth, (req: AuthRequest, res) => {
  const state = `${req.userId!}:${randomBytes(8).toString('hex')}`
  const url = getStravaAuthUrl(state)
  res.json({ success: true, data: { url } })
})

// GET /api/strava/callback — Strava redirects here after authorization
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>

  if (error || !code || !state) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4002'
    res.redirect(`${frontendUrl}/dashboard/integrations?error=strava_denied`)
    return
  }

  const userId = state.split(':')[0]
  if (!userId) {
    res.status(400).json({ error: 'Invalid state' })
    return
  }

  try {
    const tokens = await exchangeStravaCode(code)

    await prisma.deviceConnection.upsert({
      where: { userId_provider: { userId, provider: 'strava' } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at * 1000),
        providerUserId: String(tokens.athlete.id),
      },
      create: {
        userId,
        provider: 'strava',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at * 1000),
        providerUserId: String(tokens.athlete.id),
      },
    })

    // Kick off initial sync
    syncStravaActivities(userId).catch(err => console.error('Strava initial sync error:', err))

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4002'
    res.redirect(`${frontendUrl}/dashboard/integrations?connected=strava`)
  } catch (err) {
    console.error('Strava callback error:', err)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4002'
    res.redirect(`${frontendUrl}/dashboard/integrations?error=strava_failed`)
  }
})

// POST /api/strava/sync — manual sync trigger
router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await syncStravaActivities(req.userId!)
    res.json({ success: true, data: result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sync failed'
    res.status(400).json({ success: false, error: msg })
  }
})

// DELETE /api/strava/disconnect
router.delete('/disconnect', requireAuth, async (req: AuthRequest, res) => {
  await prisma.deviceConnection.deleteMany({
    where: { userId: req.userId!, provider: 'strava' },
  })
  res.json({ success: true, data: null })
})

export default router
