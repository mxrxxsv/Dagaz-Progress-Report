import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import express from 'express'
import { env } from '../env.js'
import { buildGoogleAuthUrl, exchangeCodeForTokens } from '../services/google.js'
import { upsertGoogleTokens } from '../services/userTokens.js'
import { createUser, findUserByEmail, getUserById, verifyUserCredentials } from '../services/users.js'

const router = express.Router()

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'openid',
  'email',
]

// Resolves cookie options based on FRONTEND_ORIGIN (avoid domain on localhost)
function buildCookieOptions() {
  const useSecure = env.FRONTEND_ORIGIN.startsWith('https://')
  const sameSite = useSecure ? 'none' : 'lax'
  const hostname = new URL(env.FRONTEND_ORIGIN).hostname
  const domain = hostname === 'localhost' || hostname === '127.0.0.1' ? undefined : hostname
  return { useSecure, sameSite, domain }
}

function toPublicUser(user) {
  if (!user) return null
  const { password_hash, ...rest } = user
  return rest
}

function issueSessionCookie(res, userId) {
  const session = jwt.sign({ sub: userId }, env.SESSION_JWT_SECRET, { expiresIn: '7d' })
  const { useSecure, sameSite, domain } = buildCookieOptions()
  res.cookie('session', session, {
    httpOnly: true,
    secure: useSecure,
    sameSite,
    domain,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

// Email/password login (users stored in Supabase)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' })
    const user = await verifyUserCredentials(email, password)
    issueSessionCookie(res, user.id)
    res.json({ user: toPublicUser(user) })
  } catch (err) {
    const message = err?.message || 'Unable to login'
    const status = message === 'Invalid credentials' ? 401 : 500
    res.status(status).json({ error: message })
  }
})

// Optional registration endpoint (lock down in production)
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' })
    const user = await createUser({ email, password, displayName })
    issueSessionCookie(res, user.id)
    res.status(201).json({ user: toPublicUser(user) })
  } catch (err) {
    res.status(400).json({ error: err?.message || 'Unable to register' })
  }
})

// Session check for frontend bootstrapping
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.session
    if (!token) return res.status(401).json({ error: 'unauthorized' })
    const payload = jwt.verify(token, env.SESSION_JWT_SECRET)
    const user = await getUserById(payload.sub)
    if (!user) return res.status(401).json({ error: 'unauthorized' })
    res.json({ user: toPublicUser(user) })
  } catch (err) {
    res.status(401).json({ error: 'unauthorized' })
  }
})

// Starts Google OAuth flow
router.get('/google/start', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')
  const { useSecure } = buildCookieOptions()
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: useSecure })
  const url = buildGoogleAuthUrl(state, GOOGLE_SCOPES)
  res.redirect(url)
})

// Handles Google OAuth callback
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query
    const savedState = req.cookies?.oauth_state
    if (!code || !state || state !== savedState) return res.status(400).send('Invalid state')

    const tokens = await exchangeCodeForTokens(code)
    // TODO: validate id_token properly; for now parse sub/email best-effort.
    const idToken = tokens.id_token || ''
    const payload = parseIdToken(idToken)
    let user = null
    if (payload.email) {
      user = await findUserByEmail(payload.email)
    }

    if (!user) {
      const displayName = payload.email ? payload.email.split('@')[0] : 'Google User'
      const preferredId = isUuid(payload.sub) ? payload.sub : undefined
      const fallbackEmail = payload.email || `user-${crypto.randomUUID()}@example.invalid`
      user = await createUser({ email: fallbackEmail, displayName, id: preferredId })
    }

    await upsertGoogleTokens(user.id, tokens)

    issueSessionCookie(res, user.id)

    res.redirect(env.FRONTEND_ORIGIN)
  } catch (err) {
    next(err)
  }
})

// Clear session cookie
router.post('/logout', (req, res) => {
  const { useSecure, sameSite, domain } = buildCookieOptions()
  // Mirror the cookie attributes used when issuing the session so it reliably clears.
  res.clearCookie('session', {
    httpOnly: true,
    secure: useSecure,
    sameSite,
    domain,
    path: '/',
  })
  res.status(204).end()
})

function parseIdToken(idToken) {
  try {
    const [, payload] = idToken.split('.')
    if (!payload) return {}
    const json = Buffer.from(payload, 'base64url').toString('utf8')
    return JSON.parse(json)
  } catch (err) {
    return {}
  }
}

function isUuid(value) {
  if (!value || typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default router
