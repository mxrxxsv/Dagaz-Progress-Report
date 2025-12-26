import { useMemo, useState } from 'react'

const initialData = [
  {
    id: 1,
    day: 'Sat',
    date: '2025-11-01',
    timeStart: '6:42 PM',
    timeEnd: '8:54 PM',
    branches: 27,
    ordersInput: 12,
    disputedOrders: 11,
    emailsFollowedUp: 34,
    updatedOrders: 20,
    videosUploaded: 10,
    totalHours: 2.17,
    productivityTotalActivities: 87,
    productivityPerHour: 40,
    averageActivitiesPerSite: 1.49,
    remarks: 'Dual Role Work: GDK KH, IVI Holdings (GDK), Pepes Trinity, BK',
  },
  {
    id: 2,
    day: 'Mon',
    date: '2025-11-03',
    timeStart: '10:25 AM',
    timeEnd: '1:13 PM',
    branches: 27,
    ordersInput: 14,
    disputedOrders: 18,
    emailsFollowedUp: 41,
    updatedOrders: 22,
    videosUploaded: 15,
    totalHours: 2.71,
    productivityTotalActivities: 110,
    productivityPerHour: 41,
    averageActivitiesPerSite: 1.51,
    remarks: 'Dual Role Work: GDK KH, IVI Holdings (GDK), Pepes Trinity, BK',
  },
  {
    id: 3,
    day: 'Thu',
    date: '2025-11-06',
    timeStart: '11:02 AM',
    timeEnd: '2:02 PM',
    branches: 27,
    ordersInput: 20,
    disputedOrders: 25,
    emailsFollowedUp: 32,
    updatedOrders: 12,
    videosUploaded: 22,
    totalHours: 2.75,
    productivityTotalActivities: 111,
    productivityPerHour: 40,
    averageActivitiesPerSite: 1.49,
    remarks: 'Dual Role Work: GDK KH, IVI Holdings (GDK), Pepes Trinity, BK',
  },
  {
    id: 4,
    day: 'Mon',
    date: '2025-11-10',
    timeStart: '12:06 PM',
    timeEnd: '3:35 PM',
    branches: 27,
    ordersInput: 22,
    disputedOrders: 34,
    emailsFollowedUp: 48,
    updatedOrders: 15,
    videosUploaded: 26,
    totalHours: 3.59,
    productivityTotalActivities: 145,
    productivityPerHour: 40,
    averageActivitiesPerSite: 1.49,
    remarks: 'Dual Role Work: GDK KH, IVI Holdings (GDK), Pepes Trinity, BK',
  },
  {
    id: 5,
    day: 'Wed',
    date: '2025-11-19',
    timeStart: '10:00 PM',
    timeEnd: '1:33 AM',
    branches: 27,
    ordersInput: 23,
    disputedOrders: 16,
    emailsFollowedUp: 29,
    updatedOrders: 11,
    videosUploaded: 11,
    totalHours: 2.55,
    productivityTotalActivities: 90,
    productivityPerHour: 41,
    averageActivitiesPerSite: 1.84,
    remarks: 'Dual Role Work: GDK KH, IVI Holdings (GDK), Pepes Trinity, BK',
  },
  {
    id: 6,
    day: 'Sun',
    date: '2025-11-30',
    timeStart: '9:14 AM',
    timeEnd: '1:18 PM',
    branches: 27,
    ordersInput: 31,
    disputedOrders: 29,
    emailsFollowedUp: 62,
    updatedOrders: 18,
    videosUploaded: 21,
    totalHours: 4.0,
    productivityTotalActivities: 161,
    productivityPerHour: 40,
    averageActivitiesPerSite: 1.49,
    remarks: 'Dual Role Work: GDK KH, IVI Holdings (GDK), Pepes Trinity, BK',
  },
]

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </div>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [displayName, setDisplayName] = useState('Analyst')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [rows, setRows] = useState(initialData)
  const [entryForm, setEntryForm] = useState({
    day: '',
    date: '',
    timeStart: '',
    timeEnd: '',
    branches: '',
    ordersInput: '',
    disputedOrders: '',
    emailsFollowedUp: '',
    updatedOrders: '',
    videosUploaded: '',
    totalHours: '',
    productivityTotalActivities: '',
    productivityPerHour: '',
    averageActivitiesPerSite: '',
    remarks: '',
  })
  const [entryErrors, setEntryErrors] = useState({})

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

    const avgActivitiesPerHour = totals.hours ? totals.activities / totals.hours : 0
    const avgActivitiesPerSite = rows.length
      ? totals.sites / rows.length
      : 0

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
    const requiredNumeric = [
      'branches',
      'ordersInput',
      'disputedOrders',
      'emailsFollowedUp',
      'updatedOrders',
      'videosUploaded',
      'totalHours',
      'productivityTotalActivities',
      'productivityPerHour',
      'averageActivitiesPerSite',
    ]

    requiredText.forEach((key) => {
      if (!entryForm[key]) errors[key] = 'Required'
    })

    requiredNumeric.forEach((key) => {
      if (entryForm[key] === '') {
        errors[key] = 'Required'
      } else if (Number.isNaN(Number(entryForm[key]))) {
        errors[key] = 'Must be a number'
      } else if (Number(entryForm[key]) < 0) {
        errors[key] = 'Must be positive'
      }
    })

    // Quick time sanity check (string compare works on HH:MM with same format)
    if (entryForm.timeStart && entryForm.timeEnd && entryForm.timeStart >= entryForm.timeEnd) {
      errors.timeEnd = 'End time must be after start time'
    }

    return errors
  }

  const handleAddEntry = (event) => {
    event.preventDefault()
    const errors = validateEntry()
    setEntryErrors(errors)
    if (Object.keys(errors).length > 0) return

    const toNumber = (value) => Number.parseFloat(value)
    const newRow = {
      id: Date.now(),
      ...entryForm,
      branches: toNumber(entryForm.branches),
      ordersInput: toNumber(entryForm.ordersInput),
      disputedOrders: toNumber(entryForm.disputedOrders),
      emailsFollowedUp: toNumber(entryForm.emailsFollowedUp),
      updatedOrders: toNumber(entryForm.updatedOrders),
      videosUploaded: toNumber(entryForm.videosUploaded),
      totalHours: toNumber(entryForm.totalHours),
      productivityTotalActivities: toNumber(entryForm.productivityTotalActivities),
      productivityPerHour: toNumber(entryForm.productivityPerHour),
      averageActivitiesPerSite: toNumber(entryForm.averageActivitiesPerSite),
    }

    setRows((prev) => [newRow, ...prev])
    setEntryForm({
      day: '',
      date: '',
      timeStart: '',
      timeEnd: '',
      branches: '',
      ordersInput: '',
      disputedOrders: '',
      emailsFollowedUp: '',
      updatedOrders: '',
      videosUploaded: '',
      totalHours: '',
      productivityTotalActivities: '',
      productivityPerHour: '',
      averageActivitiesPerSite: '',
      remarks: '',
    })
    setEntryErrors({})
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white/80 p-10 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
                Dagaz Progress Portal
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">Secure login</h1>
              <p className="mt-1 text-sm text-slate-500">
                Access personalized productivity insights and daily breakdowns.
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-sky-100 text-center text-lg font-bold text-sky-700 shadow-inner">
              DP
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-sky-100 focus:border-sky-400 focus:ring"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-sky-100 focus:border-sky-400 focus:ring"
                placeholder="••••••••"
                required
              />
            </div>

            {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}

            <button
              type="submit"
              className="w-full rounded-lg bg-sky-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring focus:ring-sky-200"
            >
              Sign in to view report
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            This demo login keeps data local only. For production, connect to your auth
            provider.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              Progress dashboard
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">Hello, {displayName}</h1>
            <p className="text-sm text-slate-500">
              Logged in securely. Review your daily performance and activity mix.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total hours"
            value={`${summary.totalHours.toFixed(2)} hrs`}
            helper="Sum of recorded shifts"
          />
          <StatCard
            label="Total activities"
            value={summary.totalActivities.toLocaleString()}
            helper="Productivity total"
          />
          <StatCard
            label="Avg activities / hr"
            value={summary.avgActivitiesPerHour.toFixed(1)}
            helper="Efficiency rate"
          />
          <StatCard label="Disputed orders" value={summary.totalDisputed} helper="Needs follow-up" />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Add session</h2>
              <p className="text-sm text-slate-500">Validated input; required fields marked.</p>
            </div>
          </div>

          <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={handleAddEntry}>
            {[
              { key: 'day', label: 'Day (Mon, Tue...)', type: 'text', placeholder: 'Mon' },
              { key: 'date', label: 'Date', type: 'date', placeholder: '' },
              { key: 'timeStart', label: 'Time start', type: 'time', placeholder: '' },
              { key: 'timeEnd', label: 'Time end', type: 'time', placeholder: '' },
              { key: 'branches', label: '# of branches', type: 'number', placeholder: '27' },
              { key: 'ordersInput', label: 'Orders input', type: 'number', placeholder: '12' },
              { key: 'disputedOrders', label: 'Disputed orders', type: 'number', placeholder: '11' },
              { key: 'emailsFollowedUp', label: 'Emails followed up', type: 'number', placeholder: '34' },
              { key: 'updatedOrders', label: 'Updated orders', type: 'number', placeholder: '20' },
              { key: 'videosUploaded', label: 'Videos uploaded', type: 'number', placeholder: '10' },
              { key: 'totalHours', label: 'Total hours (decimal)', type: 'number', step: '0.01', placeholder: '2.17' },
              { key: 'productivityTotalActivities', label: 'Productivity total activities', type: 'number', placeholder: '87' },
              { key: 'productivityPerHour', label: 'Productivity per hour', type: 'number', step: '0.1', placeholder: '40' },
              { key: 'averageActivitiesPerSite', label: 'Average activities per site', type: 'number', step: '0.01', placeholder: '1.49' },
            ].map((field) => (
              <div key={field.key} className="flex flex-col">
                <label className="text-sm font-medium text-slate-700" htmlFor={field.key}>
                  {field.label}
                </label>
                <input
                  id={field.key}
                  type={field.type}
                  step={field.step}
                  value={entryForm[field.key]}
                  onChange={(e) => setEntryForm({ ...entryForm, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none ring-sky-100 focus:border-sky-400 focus:ring"
                />
                {entryErrors[field.key] ? (
                  <span className="text-xs text-rose-600">{entryErrors[field.key]}</span>
                ) : null}
              </div>
            ))}

            <div className="md:col-span-2 lg:col-span-4">
              <label className="text-sm font-medium text-slate-700" htmlFor="remarks">
                Remarks
              </label>
              <textarea
                id="remarks"
                value={entryForm.remarks}
                onChange={(e) => setEntryForm({ ...entryForm, remarks: e.target.value })}
                placeholder="Dual Role Work..."
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none ring-sky-100 focus:border-sky-400 focus:ring"
                rows={3}
              />
              {entryErrors.remarks ? (
                <span className="text-xs text-rose-600">{entryErrors.remarks}</span>
              ) : null}
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="w-full rounded-lg bg-sky-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring focus:ring-sky-200"
              >
                Add entry with validation
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Daily breakdown</h2>
              <p className="text-sm text-slate-500">
                Detailed view of orders, follow-ups, and productivity per session.
              </p>
            </div>
            <div className="flex gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-700">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Dual role coverage
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Branches</th>
                  <th className="px-6 py-3">Orders input</th>
                  <th className="px-6 py-3">Disputed</th>
                  <th className="px-6 py-3">Emails</th>
                  <th className="px-6 py-3">Updated</th>
                  <th className="px-6 py-3">Videos</th>
                  <th className="px-6 py-3">Hours</th>
                  <th className="px-6 py-3">Prod total</th>
                  <th className="px-6 py-3">Prod / hr</th>
                  <th className="px-6 py-3">Avg / site</th>
                  <th className="px-6 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                      {row.day} · {row.date}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                      {row.timeStart} – {row.timeEnd}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{row.branches}</td>
                    <td className="px-6 py-4 text-slate-700">{row.ordersInput}</td>
                    <td className="px-6 py-4 text-slate-700">{row.disputedOrders}</td>
                    <td className="px-6 py-4 text-slate-700">{row.emailsFollowedUp}</td>
                    <td className="px-6 py-4 text-slate-700">{row.updatedOrders}</td>
                    <td className="px-6 py-4 text-slate-700">{row.videosUploaded}</td>
                    <td className="px-6 py-4 text-slate-700">{row.totalHours.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-700">{row.productivityTotalActivities}</td>
                    <td className="px-6 py-4 text-slate-700">{row.productivityPerHour}</td>
                    <td className="px-6 py-4 text-slate-700">{row.averageActivitiesPerSite.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
