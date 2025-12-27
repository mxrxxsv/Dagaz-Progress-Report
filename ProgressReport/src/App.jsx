import { useEffect, useState } from 'react'

import { initialData } from './data/initialData'
import { useProgressData } from './hooks/useProgressData'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import { apiClient, API_BASE_URL } from './api/client'
import './App.css'

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
    draftSavedAt,
    monthFilter,
    monthOptions,
    page,
    totalPages,
    editingId,
    lastSavedId,
    showDayModal,
    formRef,
    summary,
    loading,
    loadError,
    isSyncing,
    loadedOnce,
    sheetUrl,
    importStatus,
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
    reloadRows,
    setSheetUrl,
    handleImportSpreadsheet,
    resetRows,
  } = actions

  const handleAuthFieldChange = (key, value) => setAuthForm((prev) => ({ ...prev, [key]: value }))

  // Bootstrap session from backend cookie
  useEffect(() => {
    let active = true
    const checkSession = async () => {
      try {
        const { user } = await apiClient.me()
        if (!active) return
        setIsAuthenticated(true)
        setDisplayName(user?.display_name || user?.email?.split('@')[0] || 'Analyst')
        reloadRows()
      } catch (_err) {
        if (!active) return
        setIsAuthenticated(false)
      }
    }
    checkSession()
    return () => {
      active = false
    }
  }, [reloadRows])

  const handleLogin = (event) => {
    event.preventDefault()
    if (!authForm.email || !authForm.password) {
      setAuthError('Please enter both email and password to continue.')
      return
    }
    setAuthError('')
    apiClient
      .login(authForm.email, authForm.password)
      .then(async ({ user }) => {
        setIsAuthenticated(true)
        setDisplayName(user?.display_name || user?.email?.split('@')[0] || 'Analyst')
        await reloadRows()
      })
      .catch((err) => {
        setIsAuthenticated(false)
        setAuthError(err?.message || 'Login failed. Check your credentials.')
      })
  }

  const handleSignOut = async () => {
    setIsAuthenticated(false)
    setAuthForm({ email: '', password: '' })
    try {
      await apiClient.logout()
    } catch (err) {
      // ignore logout failure; still clear local state
    }
    resetRows()
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        authForm={authForm}
        authError={authError}
        onChangeField={handleAuthFieldChange}
        onSubmit={handleLogin}
        googleAuthUrl={`${API_BASE_URL}/auth/google/start`}
      />
    )
  }

  return (
    <DashboardPage
      displayName={displayName}
      summary={summary}
      entryForm={entryForm}
      entryErrors={entryErrors}
      draftSavedAt={draftSavedAt}
      formRef={formRef}
      lastSavedId={lastSavedId}
      rows={rows}
      editingId={editingId}
      sort={sort}
      loading={loading}
      loadError={loadError}
      isSyncing={isSyncing}
      sheetUrl={sheetUrl}
      importStatus={importStatus}
      onChangeSheetUrl={setSheetUrl}
      onImportSpreadsheet={handleImportSpreadsheet}
      onResetRows={resetRows}
      onRetryLoad={reloadRows}
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
