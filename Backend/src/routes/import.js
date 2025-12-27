import express from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { upsertRows } from '../services/rows.js'
import { fetchSheetCsvWithAuth } from '../services/google.js'

const SHEET_URL_REGEX = /\/d\/([a-zA-Z0-9-_]+)/
const GID_REGEX = /[?&#]gid=(\d+)/

const normalizeHeader = (header) => header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

// Simple CSV parser with quote support; auto-detect header row (prefers a row containing "date")
const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return []

  const parseLine = (line) => {
    const cells = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      const next = line[i + 1]
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
        continue
      }
      if (char === ',' && !inQuotes) {
        cells.push(current)
        current = ''
        continue
      }
      current += char
    }
    cells.push(current)
    return cells.map((c) => c.trim())
  }

  // find the first line whose normalized headers include "date"
  let headerIndex = 0
  let headersRaw = parseLine(lines[0])
  let headers = headersRaw.map(normalizeHeader)
  for (let i = 0; i < lines.length; i += 1) {
    const candidate = parseLine(lines[i])
    const norm = candidate.map(normalizeHeader)
    if (norm.some((h) => h === 'date')) {
      headerIndex = i
      headersRaw = candidate
      headers = norm
      break
    }
  }

  const rows = []
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const cells = parseLine(lines[i])
    if (!cells.length) continue
    const record = {}
    headers.forEach((h, idx) => {
      record[h] = cells[idx] ?? ''
    })
    rows.push(record)
  }
  return rows
}

const toNumber = (value) => {
  const num = Number(value)
  if (Number.isFinite(num)) return num
  // Attempt to parse HH:MM into decimal hours
  if (typeof value === 'string' && value.includes(':')) {
    const [h, m = '0'] = value.split(':')
    const hours = Number(h)
    const minutes = Number(m)
    if (Number.isFinite(hours) && Number.isFinite(minutes)) return hours + minutes / 60
  }
  return 0
}

const toHoursFromTimes = (start, end) => {
  if (!start || !end) return 0
  const parse = (t) => {
    const match = `${t}`.trim().match(/^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\s*$/i)
    if (!match) return null
    let [_, h, m, s = '0', meridiem] = match
    let hh = Number(h)
    const mm = Number(m)
    const ss = Number(s)
    if (Number.isNaN(hh) || Number.isNaN(mm) || Number.isNaN(ss)) return null
    if (meridiem) {
      const lower = meridiem.toLowerCase()
      if (hh === 12) hh = 0
      if (lower === 'pm') hh += 12
    }
    return hh * 3600 + mm * 60 + ss
  }
  const startSec = parse(start)
  const endSec = parse(end)
  if (startSec == null || endSec == null || endSec <= startSec) return 0
  return (endSec - startSec) / 3600
}

const toDayName = (dateStr) => {
  if (!dateStr) return ''
  const normalized = `${dateStr}`.trim()
  const isSlash = normalized.includes('/')
  const parts = isSlash ? normalized.split('/') : normalized.split('-')
  if (parts.length !== 3) return ''
  // Handle MM/DD/YYYY or YYYY-MM-DD
  const [a, b, c] = parts
  const iso = isSlash ? `${c}-${a.padStart(2, '0')}-${b.padStart(2, '0')}` : `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

const mapToDbRows = (records) =>
  records
    .map((rec, idx) => ({
      // If an id column exists and is numeric, keep it; otherwise drop so DB assigns one.
      id: rec.id && Number.isFinite(Number(rec.id)) ? Number(rec.id) : undefined,
      day: rec.day || rec.day_of_week || rec.dayname || rec.day_name || '',
      date: rec.date || rec.report_date || '',
      time_start: rec.time_start || rec.time_start_hh_mm || rec.time_start_h_mm || rec.timestart || '',
      time_end: rec.time_end || rec.time_end_hh_mm || rec.time_end_h_mm || rec.timeend || rec.time_ends || '',
      total_hours:
        toNumber(
          rec.total_hours ||
            rec.total_hours_hh_mm ||
            rec.total_hours_h_mm ||
            rec.hours ||
            rec.totalhours ||
            rec.total_hours_in_decimal ||
            rec.total_hours_decimal ||
            rec.total___of_hours ||
            rec.hours_decimalised,
        ),
      branches: toNumber(rec.branches || rec.num_branches || rec.number_of_branches || rec.of_branches),
      orders_input: toNumber(
        rec.orders_input || rec.orders || rec.ordersinput || rec.orders_input_order_tracking || rec.orders_input_order_tracking_,
      ),
      disputed_orders: toNumber(rec.disputed_orders || rec.disputed || rec.of_disputed_orders),
      emails_followed_up: toNumber(
        rec.emails_followed_up || rec.emails || rec.emailsfollowedup || rec.of_emails_followed_up,
      ),
      updated_orders: toNumber(
        rec.updated_orders || rec.updated || rec.of_updated_orders_success_failed_value || rec.of_updated_orders,
      ),
      videos_uploaded: toNumber(rec.videos_uploaded || rec.videos || rec.of_videos_uploaded),
      platform_used: rec.platform_used || rec.platform || rec.platforms || rec.platform_use || rec.platform_used_,
      remarks: rec.remarks || rec.notes || '',
      fallback_row_index: idx + 1,
    }))
    .map((row) => {
      const hours = row.total_hours || toHoursFromTimes(row.time_start, row.time_end)
      const day = row.day || toDayName(row.date)
      return { ...row, total_hours: hours, day }
    })
    .filter((row) => {
      const dateStr = `${row.date}`.trim()
      const looksLikeDate = /^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})$/.test(dateStr)
      return looksLikeDate && row.total_hours > 0
    })

const router = express.Router()

// Import a public Google Sheet CSV (sheet must be shared “anyone with the link can view”).
router.post('/google', requireAuth, async (req, res, next) => {
  try {
    const { sheetUrl } = req.body || {}
    if (!sheetUrl || typeof sheetUrl !== 'string') return res.status(400).json({ error: 'sheetUrl is required' })

    const match = sheetUrl.match(SHEET_URL_REGEX)
    const sheetId = match?.[1] || sheetUrl
    const gidMatch = sheetUrl.match(GID_REGEX)
    const gid = gidMatch?.[1]
    if (!sheetId) return res.status(400).json({ error: 'Could not parse sheet ID from URL' })

    let csvText = ''
    try {
      csvText = await fetchSheetCsvWithAuth(req.user.id, sheetId, gid)
    } catch (authErr) {
      // Fallback to public fetch if tokens missing/insufficient
      const csvUrl = gid
        ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
        : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
      const response = await fetch(csvUrl)
      if (!response.ok) {
        return res
          .status(400)
          .json({ error: 'Failed to fetch sheet (private?). Sign in with Google and grant Drive/Sheets access.' })
      }
      csvText = await response.text()
    }

    const records = parseCsv(csvText)
    const rows = mapToDbRows(records)
    if (!rows.length) return res.status(400).json({ error: 'No rows to import (check headers and data).' })

    await upsertRows(req.user.id, rows)
    res.json({ imported: rows.length })
  } catch (err) {
    next(err)
  }
})

export default router
