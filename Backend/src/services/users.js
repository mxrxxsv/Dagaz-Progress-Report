import crypto from 'crypto'
import { supabaseAdmin } from '../supabase.js'

const SALT_BYTES = 16
const KEY_LENGTH = 64

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES)
  const derivedKey = await scryptAsync(password, salt)
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false
  const [saltHex, keyHex] = passwordHash.split(':')
  if (!saltHex || !keyHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const storedKey = Buffer.from(keyHex, 'hex')
  const derivedKey = await scryptAsync(password, salt)
  if (storedKey.length !== derivedKey.length) return false
  return crypto.timingSafeEqual(storedKey, derivedKey)
}

const userColumns = 'id,email,display_name,password_hash,created_at'

function stripSecret(user) {
  if (!user) return null
  const { password_hash, ...rest } = user
  return rest
}

export async function findUserByEmail(email) {
  if (!email) return null
  const lower = email.toLowerCase()
  const { data, error } = await supabaseAdmin.from('app_users').select(userColumns).eq('email', lower).maybeSingle()
  if (error) throw error
  return data
}

export async function getUserById(id) {
  if (!id) return null
  const { data, error } = await supabaseAdmin.from('app_users').select(userColumns).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createUser({ email, password, displayName, id } = {}) {
  if (!email) throw new Error('Email is required')
  const lower = email.toLowerCase()
  const password_hash = password ? await hashPassword(password) : null
  const payload = {
    email: lower,
    display_name: displayName || lower.split('@')[0] || 'User',
    password_hash,
  }
  if (id) payload.id = id
  const { data, error } = await supabaseAdmin.from('app_users').insert(payload).select(userColumns).single()
  if (error) {
    if (error.code === '23505') {
      throw new Error('User already exists')
    }
    throw error
  }
  return stripSecret(data)
}

export async function verifyUserCredentials(email, password) {
  const user = await findUserByEmail(email)
  if (!user || !user.password_hash) throw new Error('Invalid credentials')
  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) throw new Error('Invalid credentials')
  return stripSecret(user)
}
