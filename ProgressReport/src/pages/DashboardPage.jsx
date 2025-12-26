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
  rows,
  sort,
  monthFilter,
  monthOptions,
  onChangeMonthFilter,
  page,
  totalPages,
  onChangePage,
  onSort,
  daysOfWeek,
  showDayModal,
  onSignOut,
  onChangeEntryField,
  onSubmitEntry,
  onOpenDayModal,
  onSelectDay,
  onCloseDayModal,
}) {
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

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total hours" value={`${summary.totalHours.toFixed(2)} hrs`} helper="Sum of recorded shifts" />
          <StatCard label="Total activities" value={summary.totalActivities.toLocaleString()} helper="Productivity total" />
          <StatCard label="Minutes per activity" value={summary.minutesPerActivity.toFixed(2)} helper="(Total hours × 60) ÷ total activities" />
          <StatCard label="Disputed orders" value={summary.totalDisputed} helper="Needs follow-up" />
        </section>

        <SessionTable
          rows={rows}
          sort={sort}
          monthFilter={monthFilter}
          monthOptions={monthOptions}
          onChangeMonthFilter={onChangeMonthFilter}
          page={page}
          totalPages={totalPages}
          onChangePage={onChangePage}
          onSort={onSort}
        />

        <AddSessionForm
          entryForm={entryForm}
          entryErrors={entryErrors}
          onChangeField={onChangeEntryField}
          onSubmit={onSubmitEntry}
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
