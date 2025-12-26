function DashboardHeader({ displayName, onSignOut }) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-primary)]">Progress dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
        {/* <p className="text-sm text-slate-500">Logged in securely. Review your daily performance and activity mix.</p> */}
      </div>
      <div className="flex flex-wrap gap-2">
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
