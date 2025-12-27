import { env } from '../env.js'
import { getUserTokens, updateAccessToken } from './userTokens.js'

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_DRIVE_FILE_URL = 'https://www.googleapis.com/drive/v3/files'

export function buildGoogleAuthUrl(state, scopes) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  })
  return `${GOOGLE_OAUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  })
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error('Failed to exchange code')
  return res.json()
}

export async function fetchDriveFile(accessToken, fileId, alt = 'media') {
  const url = `${GOOGLE_DRIVE_FILE_URL}/${fileId}?alt=${alt}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch file')
  return res
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error('Failed to refresh access token')
  return res.json()
}

export async function getAuthorizedAccessToken(userId) {
  const tokens = await getUserTokens(userId)
  if (!tokens) throw new Error('No Google tokens for this user')
  if (tokens.access_token && tokens.expires_at && new Date(tokens.expires_at).getTime() > Date.now()) return tokens.access_token
  if (!tokens.refresh_token) throw new Error('No refresh token to renew access')
  const refreshed = await refreshAccessToken(tokens.refresh_token)
  await updateAccessToken(userId, refreshed.access_token, refreshed.expires_in)
  return refreshed.access_token
}

export async function fetchSheetCsvWithAuth(userId, fileId, gid) {
  const accessToken = await getAuthorizedAccessToken(userId)
  const url = gid
    ? `${GOOGLE_DRIVE_FILE_URL}/${fileId}/export?mimeType=text/csv&gid=${gid}`
    : `${GOOGLE_DRIVE_FILE_URL}/${fileId}/export?mimeType=text/csv`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = await res.text()
    } catch (_) {
      detail = ''
    }
    const reason = detail ? `${res.status} ${res.statusText} - ${detail}` : `${res.status} ${res.statusText}`
    throw new Error(`Failed to fetch sheet with user token; check access and scopes. (${reason})`)
  }
  return res.text()
}
