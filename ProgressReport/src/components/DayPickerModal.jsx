function DayPickerModal({ open, daysOfWeek, onSelectDay, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Choose day</h3>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]"
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DayPickerModal
