import { useEffect, useMemo, useState } from 'react'

import { initialData } from './data/initialData'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'

const STORAGE_KEYS = {
  rows: 'progressRows',
  entry: 'progressEntryDraft',
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

const parseTimeToDecimal = (value) => {
  if (!value || typeof value !== 'string') return Number.NaN
  const parts = value.split(':').map(Number)
  if (parts.length < 2 || parts.length > 3) return Number.NaN
  const [h, m, s = 0] = parts
  if ([h, m, s].some((v) => Number.isNaN(v))) return Number.NaN
  return h + m / 60 + s / 3600
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [displayName, setDisplayName] = useState('Analyst')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [rows, setRows] = useState(initialData)
  const [sort, setSort] = useState({ column: 'date', direction: 'desc' })
  const [showDayModal, setShowDayModal] = useState(false)
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [entryErrors, setEntryErrors] = useState({})
  const [monthFilter, setMonthFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    try {
      const savedRows = localStorage.getItem(STORAGE_KEYS.rows)
      const savedEntry = localStorage.getItem(STORAGE_KEYS.entry)

      if (savedRows) {
        const parsedRows = JSON.parse(savedRows)
        if (Array.isArray(parsedRows) && parsedRows.length > 0) setRows(parsedRows)
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.rows, JSON.stringify(rows))
    } catch (err) {
      // ignore storage errors
    }
  }, [rows])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.entry, JSON.stringify(entryForm))
    } catch (err) {
      // ignore storage errors
    }
  }, [entryForm])

  const handleAuthFieldChange = (key, value) => setAuthForm((prev) => ({ ...prev, [key]: value }))

  const handleEntryFieldChange = (key, value) => {
    setEntryForm((prev) => ({ ...prev, [key]: value }))
    setEntryErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

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

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
    if (page > nextTotalPages) setPage(nextTotalPages)
    if (page < 1 && nextTotalPages >= 1) setPage(1)
  }, [filteredRows.length, page])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, page])

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

  const handleLogin = (event) => {
    event.preventDefault()
    if (!authForm.email || !authForm.password) {
      setAuthError('Please enter both email and password to continue.')
      return
    }
    setIsAuthenticated(true)
    setDisplayName(authForm.email.split('@')[0] || 'Analyst')
    setAuthError('')
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setAuthForm({ email: '', password: '' })
  }

  const handleSort = (column) => {
    setSort((prev) => {
      const direction = prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
      return { column, direction }
    })
    setPage(1)
  }

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

    return errors
  }

  const handleAddEntry = (event) => {
    event.preventDefault()
    const errors = validateEntry()
    setEntryErrors(errors)
    if (Object.keys(errors).length > 0) return

    const toNumber = (value) => Number.parseFloat(value)
    const hoursDecimal = parseTimeToDecimal(entryForm.totalHours)

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
      id: Date.now(),
      ...entryForm,
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

    setRows((prev) => [newRow, ...prev])
    setEntryForm(emptyEntryForm)
    setEntryErrors({})
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        authForm={authForm}
        authError={authError}
        onChangeField={handleAuthFieldChange}
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <DashboardPage
      displayName={displayName}
      summary={summary}
      entryForm={entryForm}
      entryErrors={entryErrors}
      rows={paginatedRows}
      sort={sort}
      monthFilter={monthFilter}
      monthOptions={monthOptions}
      onChangeMonthFilter={(value) => {
        setMonthFilter(value)
        setPage(1)
      }}
      page={page}
      totalPages={totalPages}
      onChangePage={setPage}
      onSort={handleSort}
      daysOfWeek={daysOfWeek}
      showDayModal={showDayModal}
      onSignOut={handleSignOut}
      onChangeEntryField={handleEntryFieldChange}
      onSubmitEntry={handleAddEntry}
      onOpenDayModal={() => setShowDayModal(true)}
      onSelectDay={(day) => {
        handleEntryFieldChange('day', day)
        setShowDayModal(false)
      }}
      onCloseDayModal={() => setShowDayModal(false)}
    />
  )
}

export default App
