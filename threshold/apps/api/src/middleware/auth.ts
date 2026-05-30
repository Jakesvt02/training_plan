import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }

  try {
    const token = header.slice(7)
    const payload = verifyAccessToken(token)
    req.userId = payload.userId
    req.userEmail = payload.email
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}
