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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [displayName, setDisplayName] = useState('Analyst')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [rows, setRows] = useState(initialData)
  const [showDayModal, setShowDayModal] = useState(false)
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [entryErrors, setEntryErrors] = useState({})

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

  const handleEntryFieldChange = (key, value) => setEntryForm((prev) => ({ ...prev, [key]: value }))

  const summary = useMemo(() => {
    const totals = rows.reduce(
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

    const avgActivitiesPerHour = totals.activities ? totals.hours / totals.activities : 0
    const avgActivitiesPerSite = rows.length ? totals.sites / rows.length : 0

    return {
      totalHours: totals.hours,
      totalActivities: totals.activities,
      totalOrdersInput: totals.orders,
      totalDisputed: totals.disputed,
      totalEmails: totals.emails,
      avgActivitiesPerHour,
      avgActivitiesPerSite,
    }
  }, [rows])

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

  const validateEntry = () => {
    const errors = {}

    const requiredText = ['day', 'date', 'timeStart', 'timeEnd', 'remarks']
    requiredText.forEach((key) => {
      if (!entryForm[key]) errors[key] = 'Required'
    })

    const requiredNumeric = [
      'totalHours',
      'branches',
      'ordersInput',
      'disputedOrders',
      'emailsFollowedUp',
      'updatedOrders',
      'videosUploaded',
    ]
    requiredNumeric.forEach((key) => {
      if (entryForm[key] === '') {
        errors[key] = 'Required'
        return
      }

      const value = Number(entryForm[key])
      if (Number.isNaN(value)) errors[key] = 'Must be a number'
      else if (value < 0) errors[key] = 'Must be positive'
    })

    const hoursDecimal = Number.parseFloat(entryForm.totalHours)
    if (Number.isNaN(hoursDecimal) || hoursDecimal <= 0) errors.totalHours = 'Enter hours (positive)'

    return errors
  }

  const handleAddEntry = (event) => {
    event.preventDefault()
    const errors = validateEntry()
    setEntryErrors(errors)
    if (Object.keys(errors).length > 0) return

    const toNumber = (value) => Number.parseFloat(value)
    const hoursDecimal = toNumber(entryForm.totalHours)

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
      branches,
      ordersInput: toNumber(entryForm.ordersInput),
      disputedOrders: toNumber(entryForm.disputedOrders),
      emailsFollowedUp: toNumber(entryForm.emailsFollowedUp),
      updatedOrders: toNumber(entryForm.updatedOrders),
      videosUploaded: toNumber(entryForm.videosUploaded),
      totalHours: Number(hoursDecimal.toFixed(2)),
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
      rows={rows}
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
