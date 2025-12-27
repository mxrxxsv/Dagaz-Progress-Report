import jwt from 'jsonwebtoken'
import { env } from '../env.js'

export function requireAuth(req, res, next) {
  const token = req.cookies?.session
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(token, env.SESSION_JWT_SECRET)
    req.user = { id: payload.sub }
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized' })
  }
}
