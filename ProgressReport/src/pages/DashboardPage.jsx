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
        <DashboardHeader displayName={displayName} onSignOut={onSignOut} />

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total hours" value={`${summary.totalHours.toFixed(2)} hrs`} helper="Sum of recorded shifts" />
          <StatCard label="Total activities" value={summary.totalActivities.toLocaleString()} helper="Productivity total" />
          <StatCard label="Avg activities / hr" value={summary.avgActivitiesPerHour.toFixed(1)} helper="Efficiency rate" />
          <StatCard label="Disputed orders" value={summary.totalDisputed} helper="Needs follow-up" />
        </section>

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

        <SessionTable rows={rows} />
      </div>
    </div>
  )
}

export default DashboardPage
