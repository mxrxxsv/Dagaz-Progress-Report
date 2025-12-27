import { useEffect, useMemo, useRef, useState } from 'react'

import { parseTimeToDecimal, formatDecimalToTime } from '../utils/time'

// Keys used for lightweight localStorage persistence of table rows and the draft form.
const STORAGE_KEYS = {
  rows: 'progressRows',
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
  timeStart: normalizeTimeForInput(row.timeStart),
  timeEnd: normalizeTimeForInput(row.timeEnd),
})

export function useProgressData(initialRows) {
  const [rows, setRows] = useState(initialRows)
  const [sort, setSort] = useState({ column: 'date', direction: 'desc' })
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [entryErrors, setEntryErrors] = useState({})
  const [monthFilter, setMonthFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState(null)
  const [lastSavedId, setLastSavedId] = useState(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState(null)
  const formRef = useRef(null)

  // On first mount, hydrate rows and draft entry from storage if available.
  useEffect(() => {
    try {
      const savedRows = localStorage.getItem(STORAGE_KEYS.rows)
      const savedEntry = localStorage.getItem(STORAGE_KEYS.entry)

      if (savedRows) {
        const parsedRows = JSON.parse(savedRows)
        if (Array.isArray(parsedRows) && parsedRows.length > 0) setRows(parsedRows.map(normalizeRowTimes))
      }

      if (savedEntry) {
        const parsedEntry = JSON.parse(savedEntry)
        if (parsedEntry && typeof parsedEntry === 'object') setEntryForm((prev) => ({ ...prev, ...parsedEntry }))
      }
    } catch (err) {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Normalize any initial rows (e.g., seeded/CSV) so time inputs render correctly in edit mode.
  useEffect(() => {
    setRows((prev) => prev.map(normalizeRowTimes))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist rows whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.rows, JSON.stringify(rows))
    } catch (err) {
      // ignore storage errors
    }
  }, [rows])

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
        hours: acc.hours + row.totalHours,
        activities: acc.activities + row.productivityTotalActivities,
        orders: acc.orders + row.ordersInput,
        disputed: acc.disputed + row.disputedOrders,
        emails: acc.emails + row.emailsFollowedUp,
        sites: acc.sites + row.averageActivitiesPerSite,
      }),
      { hours: 0, activities: 0, orders: 0, disputed: 0, emails: 0, sites: 0 },
    )

    const minutesPerActivity = totals.activities ? (totals.hours * 60) / totals.activities : 0
    const avgActivitiesPerSite = filteredRows.length ? totals.sites / filteredRows.length : 0

    return {
      totalHours: totals.hours,
      totalActivities: totals.activities,
      totalOrdersInput: totals.orders,
      totalDisputed: totals.disputed,
      totalEmails: totals.emails,
      minutesPerActivity,
      avgActivitiesPerSite,
      minutesPerActivity,
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
  const handleAddEntry = (event) => {
    event.preventDefault()
    const errors = validateEntry()
    setEntryErrors(errors)
    if (Object.keys(errors).length > 0) return

    const toNumber = (value) => Number.parseFloat(value)
    const hoursDecimal = parseTimeToDecimal(entryForm.totalHours)
    const timeStart24 = normalizeTimeForInput(to24h(entryForm.timeStart))
    const timeEnd24 = normalizeTimeForInput(to24h(entryForm.timeEnd))

    const totalActivities =
      toNumber(entryForm.ordersInput) +
      toNumber(entryForm.disputedOrders) +
      toNumber(entryForm.emailsFollowedUp) +
      toNumber(entryForm.updatedOrders) +
      toNumber(entryForm.videosUploaded)

    const branches = toNumber(entryForm.branches)
    const productivityPerHour = hoursDecimal ? totalActivities / hoursDecimal : 0
    const averageActivitiesPerSite = hoursDecimal && branches ? totalActivities / (branches * hoursDecimal) : 0
    const newRow = {
      id: editingId || Date.now(),
      ...entryForm,
      timeStart: timeStart24,
      timeEnd: timeEnd24,
      totalHours: Number(hoursDecimal.toFixed(2)),
      branches,
      ordersInput: toNumber(entryForm.ordersInput),
      disputedOrders: toNumber(entryForm.disputedOrders),
      emailsFollowedUp: toNumber(entryForm.emailsFollowedUp),
      updatedOrders: toNumber(entryForm.updatedOrders),
      videosUploaded: toNumber(entryForm.videosUploaded),
      productivityTotalActivities: totalActivities,
      productivityPerHour: Number(productivityPerHour.toFixed(2)),
      averageActivitiesPerSite: Number(averageActivitiesPerSite.toFixed(2)),
    }

    setRows((prev) => {
      if (editingId) return prev.map((row) => (row.id === editingId ? newRow : row))
      return [newRow, ...prev]
    })
    setEntryForm(emptyEntryForm)
    setEntryErrors({})
    setEditingId(null)
    setLastSavedId(newRow.id)
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
    },
  }
}
