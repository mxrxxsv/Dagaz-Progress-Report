import { useState } from 'react'
import AddSessionForm from '../components/AddSessionForm'
import DashboardHeader from '../components/DashboardHeader'
import DayPickerModal from '../components/DayPickerModal'
import SessionTable from '../components/SessionTable'
import StatCard from '../components/StatCard'

function DashboardPage({
  displayName,
  summary,
  entryForm,
  entryErrors,
  draftSavedAt,
  lastSavedId,
  formRef,
  rows,
  editingId,
  sort,
  loading,
  loadError,
  isSyncing,
  sheetUrl,
  importStatus,
  onChangeSheetUrl,
  onImportSpreadsheet,
  onResetRows,
  onRetryLoad,
  monthFilter,
  monthOptions,
  onChangeMonthFilter,
  page,
  totalPages,
  onChangePage,
  onEditRow,
  onDeleteRow,
  onSort,
  daysOfWeek,
  showDayModal,
  onSignOut,
  onChangeEntryField,
  onSubmitEntry,
  onCancelEdit,
  onOpenDayModal,
  onSelectDay,
  onCloseDayModal,
}) {
  const [showSettings, setShowSettings] = useState(false)

  const LoadingPanel = () => (
    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg backdrop-blur">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-blue-50 opacity-80 animate-pulse" />
      <div className="relative flex items-center gap-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500 border-t-transparent text-blue-600" style={{ animation: 'spin 1s linear infinite' }}>
          •
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Loading your dashboard</p>
          <p className="text-xs text-slate-600">Fetching latest rows and stats…</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <DashboardHeader
          displayName={displayName}
          onSignOut={onSignOut}
          monthFilter={monthFilter}
          monthOptions={monthOptions}
          onChangeMonthFilter={onChangeMonthFilter}
        />

        {showSettings ? (
          <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-primary)]">Data settings</p>
                <label className="block text-sm font-medium text-slate-700" htmlFor="sheetUrl">
                  Google Sheet link or ID
                </label>
                <input
                  id="sheetUrl"
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => onChangeSheetUrl?.(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)]"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onImportSpreadsheet}
                    className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-strong)] focus:outline-none focus:ring focus:ring-[var(--brand-focus)]"
                  >
                    Import sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheetUrl?.('')
                      onResetRows?.()
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring focus:ring-slate-200"
                  >
                    Clear table 
                  </button>
                  {importStatus ? <span className="text-xs text-slate-600">{importStatus}</span> : null}
                </div>
                {/* <p className="text-xs text-slate-500">Clearing only resets the table view locally; saved rows remain on the server.</p> */}
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring focus:ring-slate-200"
              >
                Close
              </button>
            </div>
          </section>
        ) : null}

        {loadError && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{loadError}</span>
            {onRetryLoad && (
              <button type="button" className="rounded bg-red-600 px-3 py-1 text-white" onClick={onRetryLoad}>
                Retry
              </button>
            )}
          </div>
        )}

        {loading && !loadError && <LoadingPanel />}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total hours" value={`${summary.totalHours.toFixed(2)} hrs`} helper="Sum of recorded shifts" />
          <StatCard label="Total activities" value={summary.totalActivities.toLocaleString()} helper="Productivity total" />
          <StatCard label="Minutes per activity" value={summary.minutesPerActivity.toFixed(2)} helper="(Total hours × 60) ÷ total activities" />
          <StatCard label="Disputed orders" value={summary.totalDisputed} helper="Needs follow-up" />
        </section>

        <SessionTable
          lastSavedId={lastSavedId}
          rows={rows}
          editingId={editingId}
          sort={sort}
          monthFilter={monthFilter}
          monthOptions={monthOptions}
          onChangeMonthFilter={onChangeMonthFilter}
          page={page}
          totalPages={totalPages}
          onChangePage={onChangePage}
          onEditRow={onEditRow}
          onDeleteRow={onDeleteRow}
          onSort={onSort}
          onOpenSettings={() => setShowSettings(true)}
        />

        {isSyncing && !loading && (
          <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm font-medium text-blue-900 shadow-sm backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-white to-blue-100 opacity-80 animate-pulse" />
            <div className="relative flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-500 border-t-transparent" style={{ animation: 'spin 1s linear infinite' }}>
                
              </span>
              <span>Saving changes to the server…</span>
            </div>
          </div>
        )}

        <AddSessionForm
          entryForm={entryForm}
          entryErrors={entryErrors}
          draftSavedAt={draftSavedAt}
          formRef={formRef}
          editingId={editingId}
          onChangeField={onChangeEntryField}
          onSubmit={onSubmitEntry}
          onCancelEdit={onCancelEdit}
          onOpenDayModal={onOpenDayModal}
        />

        <DayPickerModal
          open={showDayModal}
          daysOfWeek={daysOfWeek}
          onSelectDay={onSelectDay}
          onClose={onCloseDayModal}
        />

        
      </div>
    </div>
  )
}

export default DashboardPage
