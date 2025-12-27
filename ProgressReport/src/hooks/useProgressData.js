import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { apiClient } from '../api/client'
import { parseTimeToDecimal, formatDecimalToTime } from '../utils/time'

// Key used for lightweight localStorage persistence of the draft form only.
const STORAGE_KEYS = {
  entry: 'progressEntryDraft',
}

const emptyEntryForm = {
  day: '',
  date: '',
  timeStart: '',
  timeEnd: '',
  totalHours: '',
  branches: '',
  ordersInput: '',
  disputedOrders: '',
  emailsFollowedUp: '',
  updatedOrders: '',
  videosUploaded: '',
  platformUsed: '',
  remarks: '',
}

// Pads time strings so they render in <input type="time"> (expects HH:MM or HH:MM:SS with leading zeros).
const normalizeTimeForInput = (value) => {
  if (!value || typeof value !== 'string') return ''
  const parts = value.split(':')
  if (parts.length < 2) return ''
  const [h, m, s] = parts
  const hh = String(h ?? '').padStart(2, '0')
  const mm = String(m ?? '').padStart(2, '0')
  if (parts.length >= 3) {
    const ss = String(s ?? '').padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }
  return `${hh}:${mm}`
}

const to24h = (value) => {
  if (!value || typeof value !== 'string') return ''
  const match = value.trim().match(/^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?\s*(am|pm)?$/i)
  if (!match) return ''
  let [_, h, m, s = '00', meridiem] = match
  let hourNum = Number(h)
  const minuteNum = Number(m)
  const secNum = Number(s)
  if (Number.isNaN(hourNum) || Number.isNaN(minuteNum) || Number.isNaN(secNum)) return ''
  if (minuteNum > 59 || secNum > 59) return ''

  if (meridiem) {
    const lower = meridiem.toLowerCase()
    if (hourNum === 12) hourNum = 0
    if (lower === 'pm') hourNum += 12
    if (hourNum === 24) hourNum = 12
  }
  if (hourNum > 23) return ''
  const hh = String(hourNum).padStart(2, '0')
  const mm = String(minuteNum).padStart(2, '0')
  const ss = String(secNum).padStart(2, '0')
  return ss === '00' ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`
}

const to12hDisplay = (value) => {
  if (!value || typeof value !== 'string') return ''
  const v24 = to24h(value)
  if (!v24) return ''
  const [hStr, mStr = '00'] = v24.split(':')
  let hourNum = Number(hStr)
  if (Number.isNaN(hourNum)) return ''
  const meridiem = hourNum >= 12 ? 'PM' : 'AM'
  hourNum = hourNum % 12 || 12
  const hh = String(hourNum).padStart(2, '0')
  const mm = String(Number(mStr)).padStart(2, '0')
  return `${hh}:${mm} ${meridiem}`
}

const normalizeRowTimes = (row) => ({
  ...row,
  timeStart: normalizeTimeForInput(row.timeStart || row.time_start),
  timeEnd: normalizeTimeForInput(row.timeEnd || row.time_end),
})

const fromApiRow = (row) => ({
  id: row.id,
  day: row.day || '',
  date: row.date || '',
  timeStart: row.time_start || '',
  timeEnd: row.time_end || '',
  totalHours: row.total_hours ?? 0,
  branches: row.branches ?? 0,
  ordersInput: row.orders_input ?? 0,
  disputedOrders: row.disputed_orders ?? 0,
  emailsFollowedUp: row.emails_followed_up ?? 0,
  updatedOrders: row.updated_orders ?? 0,
  videosUploaded: row.videos_uploaded ?? 0,
  platformUsed: row.platform_used || '',
  remarks: row.remarks || '',
})

const toApiRow = (row, includeId = true) => {
  const payload = {
    day: row.day,
    date: row.date,
    time_start: row.timeStart,
    time_end: row.timeEnd,
    total_hours: row.totalHours,
    branches: row.branches,
    orders_input: row.ordersInput,
    disputed_orders: row.disputedOrders,
    emails_followed_up: row.emailsFollowedUp,
    updated_orders: row.updatedOrders,
    videos_uploaded: row.videosUploaded,
    platform_used: row.platformUsed,
    remarks: row.remarks,
  }
  // Only include id when updating existing rows; avoid overriding identity column for inserts.
  if (includeId && row.id) payload.id = row.id
  return payload
}

const withDerivedMetrics = (row) => {
  const totalActivities =
    Number(row.ordersInput ?? 0) +
    Number(row.disputedOrders ?? 0) +
    Number(row.emailsFollowedUp ?? 0) +
    Number(row.updatedOrders ?? 0) +
    Number(row.videosUploaded ?? 0)

  const productivityPerHour = row.totalHours ? totalActivities / row.totalHours : 0
  const averageActivitiesPerSite = row.totalHours && row.branches ? totalActivities / (row.branches * row.totalHours) : 0

  return {
    ...row,
    productivityTotalActivities: totalActivities,
    productivityPerHour: Number(productivityPerHour.toFixed(2)),
    averageActivitiesPerSite: Number(averageActivitiesPerSite.toFixed(2)),
  }
}

export function useProgressData(initialRows) {
  const [rows, setRows] = useState(() => initialRows.map((row) => withDerivedMetrics(normalizeRowTimes(row))))
  const [sort, setSort] = useState({ column: 'date', direction: 'desc' })
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [entryErrors, setEntryErrors] = useState({})
  const [monthFilter, setMonthFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState(null)
  const [lastSavedId, setLastSavedId] = useState(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')
  const [importStatus, setImportStatus] = useState('')
  const formRef = useRef(null)

  // On first mount, hydrate draft entry from storage if available and pull rows from the backend.
  useEffect(() => {
    try {
      const savedEntry = localStorage.getItem(STORAGE_KEYS.entry)
      if (savedEntry) {
        const parsedEntry = JSON.parse(savedEntry)
        if (parsedEntry && typeof parsedEntry === 'object') setEntryForm((prev) => ({ ...prev, ...parsedEntry }))
      }
    } catch (err) {
      // ignore storage errors
    }
  }, [])

  const loadRowsFromApi = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await apiClient.getRows(2000)
      const mapped = (response?.data || []).map((row) => withDerivedMetrics(normalizeRowTimes(fromApiRow(row))))
      setRows(mapped)
    } catch (err) {
      setLoadError(err?.message || 'Unable to load data from the server.')
    } finally {
      setLoading(false)
      setLoadedOnce(true)
    }
  }, [])

  useEffect(() => {
    loadRowsFromApi()
  }, [loadRowsFromApi])

  // Persist the in-progress form draft as the user types.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.entry, JSON.stringify(entryForm))
      setDraftSavedAt(Date.now())
    } catch (err) {
      // ignore storage errors
    }
  }, [entryForm])

  const handleEntryFieldChange = (key, value) => {
    setEntryForm((prev) => ({ ...prev, [key]: value }))
    setEntryErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // Build dropdown options for month filter from existing rows (latest first).
  const monthOptions = useMemo(() => {
    const set = new Map()
    rows.forEach((row) => {
      if (!row.date) return
      const [year, month] = row.date.split('-')
      if (!year || !month) return
      const key = `${year}-${month}`
      if (set.has(key)) return
      const dateObj = new Date(`${year}-${month}-01T00:00:00`)
      const label = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      set.set(key, label)
    })
    const sorted = Array.from(set.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
    return [{ value: 'all', label: 'All months' }, ...sorted.map(([value, label]) => ({ value, label }))]
  }, [rows])

  const filteredRows = useMemo(() => {
    if (monthFilter === 'all') return rows
    return rows.filter((row) => row.date && row.date.startsWith(monthFilter))
  }, [rows, monthFilter])

  // Sort filtered rows by current column and direction; handles dates, strings, and numbers.
  const sortedRows = useMemo(() => {
    const arr = [...filteredRows]
    const { column, direction } = sort
    const factor = direction === 'asc' ? 1 : -1

    const toNumber = (value) => {
      const num = Number(value)
      return Number.isFinite(num) ? num : 0
    }

    arr.sort((a, b) => {
      const va = a[column]
      const vb = b[column]

      if (column === 'date') {
        const da = new Date(`${a.date}T00:00:00`).getTime() || 0
        const db = new Date(`${b.date}T00:00:00`).getTime() || 0
        if (da === db) return 0
        return da > db ? factor : -factor
      }

      if (typeof va === 'string' || typeof vb === 'string') {
        return String(va || '').localeCompare(String(vb || '')) * factor
      }

      const na = toNumber(va)
      const nb = toNumber(vb)
      if (na === nb) return 0
      return na > nb ? factor : -factor
    })

    return arr
  }, [filteredRows, sort])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))

  // Clamp page if data shrinks (e.g., after delete or filter change).
  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
    if (page > nextTotalPages) setPage(nextTotalPages)
    if (page < 1 && nextTotalPages >= 1) setPage(1)
  }, [filteredRows.length, page])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, page])

  // Aggregate summary stats across the currently filtered rows.
  const summary = useMemo(() => {
    const totals = filteredRows.reduce(
      (acc, row) => ({
        hours: acc.hours + Number(row.totalHours || 0),
        activities: acc.activities + Number(row.productivityTotalActivities || 0),
        orders: acc.orders + Number(row.ordersInput || 0),
        disputed: acc.disputed + Number(row.disputedOrders || 0),
        emails: acc.emails + Number(row.emailsFollowedUp || 0),
        sites: acc.sites + Number(row.averageActivitiesPerSite || 0),
      }),
      { hours: 0, activities: 0, orders: 0, disputed: 0, emails: 0, sites: 0 },
    )

    const minutesPerActivityRaw = totals.activities ? (totals.hours * 60) / totals.activities : 0
    const avgActivitiesPerSiteRaw = filteredRows.length ? totals.sites / filteredRows.length : 0

    return {
      totalHours: totals.hours,
      totalActivities: totals.activities,
      totalOrdersInput: totals.orders,
      totalDisputed: totals.disputed,
      totalEmails: totals.emails,
      minutesPerActivity: Number(minutesPerActivityRaw.toFixed(2)),
      avgActivitiesPerSite: Number(avgActivitiesPerSiteRaw.toFixed(2)),
    }
  }, [filteredRows])

  const handleSort = (column) => {
    setSort((prev) => {
      const direction = prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
      return { column, direction }
    })
    setPage(1)
  }

  // Basic client-side validation for required fields and numeric constraints.
  const validateEntry = () => {
    const errors = {}

    const requiredText = ['day', 'date', 'timeStart', 'timeEnd', 'remarks']
    requiredText.forEach((key) => {
      if (!entryForm[key]) errors[key] = 'Required'
    })

    const requiredNumeric = ['branches', 'ordersInput', 'disputedOrders', 'emailsFollowedUp', 'updatedOrders', 'videosUploaded']
    requiredNumeric.forEach((key) => {
      if (entryForm[key] === '') {
        errors[key] = 'Required'
        return
      }

      const value = Number(entryForm[key])
      if (Number.isNaN(value)) errors[key] = 'Must be a number'
      else if (value < 0) errors[key] = 'Must be positive'
    })

    const hoursDecimal = parseTimeToDecimal(entryForm.totalHours)
    if (!entryForm.totalHours) errors.totalHours = 'Required'
    if (Number.isNaN(hoursDecimal) || hoursDecimal <= 0) errors.totalHours = 'Enter valid time (HH:MM or HH:MM:SS)'

    const start24 = to24h(entryForm.timeStart)
    const end24 = to24h(entryForm.timeEnd)
    if (!start24) errors.timeStart = 'Use format HH:MM AM/PM'
    if (!end24) errors.timeEnd = 'Use format HH:MM AM/PM'
    if (start24 && end24) {
      const startMinutes = parseTimeToDecimal(start24) * 60
      const endMinutes = parseTimeToDecimal(end24) * 60
      if (!Number.isNaN(startMinutes) && !Number.isNaN(endMinutes) && endMinutes <= startMinutes) {
        errors.timeEnd = 'End must be after start'
      }
    }

    return errors
  }

  // Create or update a row, computing derived productivity metrics before saving.
  const handleAddEntry = async (event) => {
    event.preventDefault()
    const errors = validateEntry()
    setEntryErrors(errors)
    if (Object.keys(errors).length > 0) return

    const toNumber = (value) => Number.parseFloat(value)
    const hoursDecimal = parseTimeToDecimal(entryForm.totalHours)
    const timeStart24 = normalizeTimeForInput(to24h(entryForm.timeStart))
    const timeEnd24 = normalizeTimeForInput(to24h(entryForm.timeEnd))

    const newRow = withDerivedMetrics({
      id: editingId || Date.now(),
      ...entryForm,
      timeStart: timeStart24,
      timeEnd: timeEnd24,
      totalHours: Number(hoursDecimal.toFixed(2)),
      branches: toNumber(entryForm.branches),
      ordersInput: toNumber(entryForm.ordersInput),
      disputedOrders: toNumber(entryForm.disputedOrders),
      emailsFollowedUp: toNumber(entryForm.emailsFollowedUp),
      updatedOrders: toNumber(entryForm.updatedOrders),
      videosUploaded: toNumber(entryForm.videosUploaded),
    })

    const previousRows = rows
    setRows((prev) => {
      if (editingId) return prev.map((row) => (row.id === editingId ? newRow : row))
      return [newRow, ...prev]
    })

    setIsSyncing(true)
    try {
      const includeId = Boolean(editingId)
      await apiClient.upsertRow(toApiRow(newRow, includeId))
      await loadRowsFromApi()
      setEntryForm(emptyEntryForm)
      setEntryErrors({})
      setEditingId(null)
      setLastSavedId(newRow.id)
    } catch (err) {
      setRows(previousRows)
      setEntryErrors((prev) => ({ ...prev, form: err?.message || 'Unable to save entry.' }))
    } finally {
      setIsSyncing(false)
    }
  }

  // Load a row into the form for editing and scroll the form into view.
  const handleEditRow = (rowId) => {
    const target = rows.find((row) => row.id === rowId)
    if (!target) return
    setEditingId(rowId)
    setEntryErrors({})
    setEntryForm({
      day: target.day || '',
      date: target.date || '',
      timeStart: to12hDisplay(target.timeStart),
      timeEnd: to12hDisplay(target.timeEnd),
      totalHours: formatDecimalToTime(target.totalHours),
      branches: target.branches ?? '',
      ordersInput: target.ordersInput ?? '',
      disputedOrders: target.disputedOrders ?? '',
      emailsFollowedUp: target.emailsFollowedUp ?? '',
      updatedOrders: target.updatedOrders ?? '',
      videosUploaded: target.videosUploaded ?? '',
      platformUsed: target.platformUsed || '',
      remarks: target.remarks || '',
    })

    requestAnimationFrame(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEntryErrors({})
    setEntryForm(emptyEntryForm)
  }

  const handleDeleteRow = (rowId) => {
    const confirmDelete = window.confirm('Delete this entry?')
    if (!confirmDelete) return
    setRows((prev) => prev.filter((row) => row.id !== rowId))
    setLastSavedId(null)
    if (editingId === rowId) handleCancelEdit()
    // Backend delete is not implemented yet; this only removes the row locally.
  }

  return {
    state: {
      rows: paginatedRows,
      sort,
      entryForm,
      entryErrors,
      monthFilter,
      monthOptions,
      page,
      totalPages,
      editingId,
      lastSavedId,
      showDayModal,
      draftSavedAt,
      loading,
      loadError,
      isSyncing,
      loadedOnce,
      sheetUrl,
      importStatus,
      formRef,
      summary,
    },
    actions: {
      setMonthFilter,
      setPage,
      setShowDayModal,
      handleSort,
      handleEntryFieldChange,
      handleAddEntry,
      handleEditRow,
      handleCancelEdit,
      handleDeleteRow,
      reloadRows: loadRowsFromApi,
      setSheetUrl,
      handleImportSpreadsheet: async () => {
        if (!sheetUrl) {
          setImportStatus('Paste a Google Sheet link or ID to import.')
          return
        }
        setImportStatus('Importing...')
        try {
          const result = await apiClient.importSheet(sheetUrl)
          setImportStatus(`Imported ${result.imported} rows. Refreshing...`)
          await loadRowsFromApi()
          setImportStatus('Imported successfully.')
        } catch (err) {
          setImportStatus(err?.message || 'Import failed.')
        }
      },
      resetRows: () => setRows([]),
    },
  }
}
