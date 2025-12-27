const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

const defaultHeaders = { 'Content-Type': 'application/json' }

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
      else if (body?.message) message = body.message
    } catch (_) {
      // ignore parse errors and fall back to generic message
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return response
}

export const apiClient = {
  async me() {
    const res = await request('/auth/me')
    return res.json()
  },
  async login(email, password) {
    const res = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    return res.json()
  },
  async getRows(limit = 2000) {
    const res = await request(`/rows?limit=${encodeURIComponent(limit)}`)
    return res.json()
  },
  async upsertRow(row) {
    const res = await request('/rows', { method: 'POST', body: JSON.stringify(row) })
    return res.json()
  },
  async importSheet(sheetUrl) {
    const res = await request('/import/google', { method: 'POST', body: JSON.stringify({ sheetUrl }) })
    return res.json()
  },
  async logout() {
    await request('/auth/logout', { method: 'POST' })
  },
}

export { API_BASE_URL }
