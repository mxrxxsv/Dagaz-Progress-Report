// Simple in-memory token store for demo purposes. Replace with persistent storage in production.
const tokens = new Map()

export function setUserTokens(userId, { access_token, refresh_token, expires_in }) {
  if (!userId) return
  const expiresAt = expires_in ? Date.now() + expires_in * 1000 - 30_000 : Date.now() + 3_300_000 // 55 minutes fallback
  const existing = tokens.get(userId) || {}
  tokens.set(userId, {
    ...existing,
    access_token,
    refresh_token: refresh_token || existing.refresh_token,
    expires_at: expiresAt,
  })
}

export function getUserTokens(userId) {
  if (!userId) return null
  return tokens.get(userId) || null
}

export function updateAccessToken(userId, access_token, expires_in) {
  if (!userId || !access_token) return
  const existing = tokens.get(userId) || {}
  const expiresAt = expires_in ? Date.now() + expires_in * 1000 - 30_000 : Date.now() + 3_300_000
  tokens.set(userId, { ...existing, access_token, expires_at: expiresAt })
}
