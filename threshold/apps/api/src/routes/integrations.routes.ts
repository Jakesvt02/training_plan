import { Router } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/integrations/connections — list this user's connected devices
router.get('/connections', requireAuth, async (req: AuthRequest, res) => {
  const connections = await prisma.deviceConnection.findMany({
    where: { userId: req.userId! },
    select: { provider: true, providerUserId: true, expiresAt: true, createdAt: true },
  })
  res.json({ success: true, data: connections })
})

export default router
