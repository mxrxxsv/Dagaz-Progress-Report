const parseTimeToDecimal = (value) => {
  if (!value || typeof value !== 'string') return Number.NaN
  const parts = value.split(':').map(Number)
  if (parts.length < 2 || parts.length > 3) return Number.NaN
  const [h, m, s = 0] = parts
  if ([h, m, s].some((v) => Number.isNaN(v))) return Number.NaN
  return h + m / 60 + s / 3600
}

function AddSessionForm({ entryForm, entryErrors, onChangeField, onSubmit, onOpenDayModal }) {
  const inputFields = [
    { key: 'day', label: 'Day', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'timeStart', label: 'Time start', type: 'time' },
    { key: 'timeEnd', label: 'Time end', type: 'time' },
    { key: 'branches', label: '# of branches', type: 'number' },
    { key: 'ordersInput', label: 'Orders input', type: 'number' },
    { key: 'disputedOrders', label: 'Disputed orders', type: 'number' },
    { key: 'emailsFollowedUp', label: 'Emails followed up', type: 'number' },
    { key: 'updatedOrders', label: 'Updated orders', type: 'number' },
    { key: 'videosUploaded', label: 'Videos uploaded', type: 'number' },
    { key: 'totalHours', label: 'Total hours (HH:MM or HH:MM:SS)', type: 'text', placeholder: 'e.g. 7:45' },
  ]

  const computedChips = [
    {
      key: 'computedHours',
      label: 'Hours decimalised',
      value: (() => {
        const hours = parseTimeToDecimal(entryForm.totalHours)
        if (Number.isNaN(hours) || hours <= 0) return '—'
        return hours.toFixed(2)
      })(),
    },
    {
      key: 'computedTotalActivities',
      label: 'Productivity total activities',
      value: (() => {
        const sum =
          Number(entryForm.ordersInput || 0) +
          Number(entryForm.disputedOrders || 0) +
          Number(entryForm.emailsFollowedUp || 0) +
          Number(entryForm.updatedOrders || 0) +
          Number(entryForm.videosUploaded || 0)
        return sum || '—'
      })(),
    },
    {
      key: 'computedPerHour',
      label: 'Productivity per hour',
      value: (() => {
        const hours = parseTimeToDecimal(entryForm.totalHours)
        const sum =
          Number(entryForm.ordersInput || 0) +
          Number(entryForm.disputedOrders || 0) +
          Number(entryForm.emailsFollowedUp || 0) +
          Number(entryForm.updatedOrders || 0) +
          Number(entryForm.videosUploaded || 0)
        return hours && !Number.isNaN(hours) ? (sum / hours).toFixed(2) : '—'
      })(),
    },
    {
      key: 'computedPerSite',
      label: 'Average activities per site',
      value: (() => {
        const hours = parseTimeToDecimal(entryForm.totalHours)
        const branches = Number(entryForm.branches || 0)
        const sum =
          Number(entryForm.ordersInput || 0) +
          Number(entryForm.disputedOrders || 0) +
          Number(entryForm.emailsFollowedUp || 0) +
          Number(entryForm.updatedOrders || 0) +
          Number(entryForm.videosUploaded || 0)
        return hours && !Number.isNaN(hours) && branches ? (sum / (branches * hours)).toFixed(2) : '—'
      })(),
    },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Add session</h2>
        </div>
      </div>

      <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
        {inputFields.map((field) => (
          <div key={field.key} className="flex flex-col">
            <label className="text-sm font-medium text-slate-700" htmlFor={field.key}>
              {field.label}
            </label>

            {field.key === 'day' ? (
              <input
                id={field.key}
                type="text"
                value={entryForm.day}
                readOnly
                onClick={onOpenDayModal}
                onFocus={onOpenDayModal}
                className="mt-2 w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none ring-[var(--brand-primary-soft)] focus:border-[var(--brand-primary)] focus:ring"
              />
            ) : (
              <input
                id={field.key}
                type={field.type}
                step={field.step}
                placeholder={field.placeholder}
                value={entryForm[field.key]}
                onChange={(e) => onChangeField(field.key, e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none ring-[var(--brand-primary-soft)] focus:border-[var(--brand-primary)] focus:ring"
              />
            )}

            {entryErrors[field.key] ? <span className="text-xs text-rose-600">{entryErrors[field.key]}</span> : null}
          </div>
        ))}

        <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {computedChips.map((chip) => (
            <div key={chip.key} className="rounded-lg border border-slate-200 bg-[var(--brand-primary-soft)] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{chip.label}</p>
              <p className="text-lg font-semibold text-slate-900">{chip.value}</p>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 lg:col-span-4">
          <label className="text-sm font-medium text-slate-700" htmlFor="remarks">
            Remarks
          </label>
          <textarea
            id="remarks"
            value={entryForm.remarks}
            onChange={(e) => onChangeField('remarks', e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 outline-none ring-[var(--brand-primary-soft)] focus:border-[var(--brand-primary)] focus:ring"
            rows={3}
          />
          {entryErrors.remarks ? <span className="text-xs text-rose-600">{entryErrors.remarks}</span> : null}
        </div>

        <div className="md:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--brand-primary)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-strong)] focus:outline-none focus:ring focus:ring-[var(--brand-focus)]"
          >
            Add entry with validation
          </button>
        </div>
      </form>
    </section>
  )
}

export default AddSessionForm
