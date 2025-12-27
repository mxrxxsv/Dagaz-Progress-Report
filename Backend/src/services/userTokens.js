import { supabaseAdmin } from '../supabase.js'

const EXPIRY_DRIFT_MS = 30_000

function computeExpiresAt(expiresInSeconds) {
  if (!expiresInSeconds) return null
  return new Date(Date.now() + expiresInSeconds * 1000 - EXPIRY_DRIFT_MS).toISOString()
}

export async function upsertGoogleTokens(userId, { access_token, refresh_token, expires_in }) {
  if (!userId) throw new Error('Missing user id for token upsert')
  const payload = {
    user_id: userId,
    access_token,
    refresh_token,
    expires_at: computeExpiresAt(expires_in),
  }
  const { error } = await supabaseAdmin.from('app_user_tokens').upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

export async function getUserTokens(userId) {
  if (!userId) return null
  const { data, error } = await supabaseAdmin.from('app_user_tokens').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateAccessToken(userId, access_token, expires_in) {
  if (!userId || !access_token) return
  const payload = {
    user_id: userId,
    access_token,
    expires_at: computeExpiresAt(expires_in),
  }
  const { error } = await supabaseAdmin.from('app_user_tokens').upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}
