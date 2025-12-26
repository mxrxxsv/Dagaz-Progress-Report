import { useEffect, useState } from 'react'

import { initialData } from './data/initialData'
import { useProgressData } from './hooks/useProgressData'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const AUTH_STORAGE_KEY = 'progressAuth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [displayName, setDisplayName] = useState('Analyst')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const { state, actions } = useProgressData(initialData)
  const {
    rows,
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
    formRef,
    summary,
  } = state

  const {
    setMonthFilter,
    setPage,
    setShowDayModal,
    handleSort,
    handleEntryFieldChange,
    handleAddEntry,
    handleEditRow,
    handleCancelEdit,
    handleDeleteRow,
  } = actions

  const handleAuthFieldChange = (key, value) => setAuthForm((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth)
        if (parsed?.email) {
          setIsAuthenticated(true)
          setDisplayName(parsed.displayName || 'Analyst')
        }
      }
    } catch (err) {
      // ignore storage errors
    }
  }, [])

  const handleLogin = (event) => {
    event.preventDefault()
    if (!authForm.email || !authForm.password) {
      setAuthError('Please enter both email and password to continue.')
      return
    }
    setIsAuthenticated(true)
    const name = authForm.email.split('@')[0] || 'Analyst'
    setDisplayName(name)
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email: authForm.email, displayName: name }))
    } catch (err) {
      // ignore storage errors
    }
    setAuthError('')
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setAuthForm({ email: '', password: '' })
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch (err) {
      // ignore storage errors
    }
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
      formRef={formRef}
      lastSavedId={lastSavedId}
      rows={rows}
      editingId={editingId}
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
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      onSort={handleSort}
      daysOfWeek={daysOfWeek}
      showDayModal={showDayModal}
      onSignOut={handleSignOut}
      onChangeEntryField={handleEntryFieldChange}
      onSubmitEntry={handleAddEntry}
      onCancelEdit={handleCancelEdit}
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
