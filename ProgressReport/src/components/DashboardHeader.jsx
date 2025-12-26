function DashboardHeader({ displayName, onSignOut, monthFilter, monthOptions = [], onChangeMonthFilter }) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-primary)]">Progress dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
        {/* <p className="text-sm text-slate-500">Logged in securely. Review your daily performance and activity mix.</p> */}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {monthOptions.length > 0 && onChangeMonthFilter ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter by month</span>
            <select
              value={monthFilter}
              onChange={(e) => onChangeMonthFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)]"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button
          onClick={onSignOut}
          className="rounded-lg border border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-soft)]"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

export default DashboardHeader
