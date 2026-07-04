import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = header.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(500).json({ error: 'JWT_SECRET is not configured' })
  }

  try {
    const payload = jwt.verify(token, secret)
    req.user = { id: payload.userId }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function attachUser(req, _res, next) {
  if (!req.user?.id) return next()
  req.userDoc = await User.findById(req.user.id)
  next()
}

export function signToken(userId) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}
