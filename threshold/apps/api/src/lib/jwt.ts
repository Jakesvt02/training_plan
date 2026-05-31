import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'crypto'
import { prisma } from './prisma'

const SECRET = process.env.JWT_SECRET!
const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY_DAYS = 30

export function signAccessToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_EXPIRY })
}

export function verifyAccessToken(token: string): { userId: string; email: string } {
  return jwt.verify(token, SECRET) as { userId: string; email: string }
}

export async function createRefreshToken(userId: string): Promise<string> {
  // Generate a cryptographically random token
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRY_DAYS)

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  })

  // Return the raw token — this is the only time it exists in plain text
  return rawToken
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ userId: string; newRefreshToken: string } | null> {
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    // If token is reused after revocation it may indicate theft — revoke all for this user
    if (stored && stored.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    return null
  }

  // Revoke the used token (rotation — each refresh token is single-use)
  await prisma.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  })

  // Issue a new refresh token
  const newRefreshToken = await createRefreshToken(stored.userId)
  return { userId: stored.userId, newRefreshToken }
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
