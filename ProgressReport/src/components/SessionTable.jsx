import { useEffect, useRef } from 'react'

const formatTime12h = (value) => {
  if (!value || typeof value !== 'string') return '—'
  const raw = value.trim()
  // If user already typed AM/PM, return cleaned spacing/case.
  const ampmMatch = raw.match(/^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?\s*(am|pm)$/i)
  if (ampmMatch) {
    const [, hh, mm, ss, mer] = ampmMatch
    const time = ss ? `${hh.padStart(2, '0')}:${mm}:${ss}` : `${hh.padStart(2, '0')}:${mm}`
    return `${time} ${mer.toUpperCase()}`
  }

  const m = raw.match(/^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?$/)
  if (!m) return raw
  let [_, h, min, sec = ''] = m
  let hour = Number(h)
  if (Number.isNaN(hour) || hour > 23) return raw
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  const hh = String(hour).padStart(2, '0')
  const mm = min.padStart(2, '0')
  const suffix = sec ? `:${sec}` : ''
  return `${hh}:${mm}${suffix} ${meridiem}`
}

function SessionTable({ rows, sort, editingId, lastSavedId, page, totalPages, onChangePage, onSort, onEditRow, onDeleteRow }) {
  const rowRefs = useRef({})

  useEffect(() => {
    if (!lastSavedId) return
    const target = rowRefs.current[lastSavedId]
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [lastSavedId])
  const sortMark = (column) => {
    if (!sort || sort.column !== column) return ''
    return sort.direction === 'asc' ? '^' : 'v'
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Daily breakdown</h2>
          {/* <p className="text-xs text-slate-500">Compact spreadsheet-style view.</p> */}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs text-slate-800">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="border border-slate-200 px-3 py-2 text-left">
                <button type="button" onClick={() => onSort('date')} className="flex items-center gap-1 font-semibold">
                  Date <span className="text-[10px]">{sortMark('date')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-left">
                <button type="button" onClick={() => onSort('timeStart')} className="flex items-center gap-1 font-semibold">
                  Time <span className="text-[10px]">{sortMark('timeStart')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('branches')} className="flex items-center gap-1 font-semibold">
                  Branches <span className="text-[10px]">{sortMark('branches')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('ordersInput')} className="flex items-center gap-1 font-semibold">
                  Orders <span className="text-[10px]">{sortMark('ordersInput')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('disputedOrders')} className="flex items-center gap-1 font-semibold">
                  Disputed <span className="text-[10px]">{sortMark('disputedOrders')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('emailsFollowedUp')} className="flex items-center gap-1 font-semibold">
                  Emails <span className="text-[10px]">{sortMark('emailsFollowedUp')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('updatedOrders')} className="flex items-center gap-1 font-semibold">
                  Updated <span className="text-[10px]">{sortMark('updatedOrders')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('videosUploaded')} className="flex items-center gap-1 font-semibold">
                  Videos <span className="text-[10px]">{sortMark('videosUploaded')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('totalHours')} className="flex items-center gap-1 font-semibold">
                  Hours <span className="text-[10px]">{sortMark('totalHours')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('productivityTotalActivities')} className="flex items-center gap-1 font-semibold">
                  Prod total <span className="text-[10px]">{sortMark('productivityTotalActivities')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('productivityPerHour')} className="flex items-center gap-1 font-semibold">
                  Prod/hr <span className="text-[10px]">{sortMark('productivityPerHour')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-right">
                <button type="button" onClick={() => onSort('averageActivitiesPerSite')} className="flex items-center gap-1 font-semibold">
                  Avg/site <span className="text-[10px]">{sortMark('averageActivitiesPerSite')}</span>
                </button>
              </th>
              <th className="border border-slate-200 px-3 py-2 text-left">
                <button type="button" onClick={() => onSort('remarks')} className="flex items-center gap-1 font-semibold">
                  Remarks <span className="text-[10px]">{sortMark('remarks')}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="border border-slate-200 px-3 py-4 text-center text-slate-500">
                  No sessions for this month.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const isActive = editingId === row.id
                const isSaved = lastSavedId === row.id
                const base = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                const active = isActive ? 'outline outline-2 outline-[var(--brand-primary)] bg-[var(--brand-primary-soft)]' : ''
                const saved = isSaved ? 'ring-2 ring-[var(--brand-primary)] ring-offset-2' : ''
                return (
                  <tr
                    key={row.id}
                    ref={(el) => {
                      if (el) rowRefs.current[row.id] = el
                    }}
                    onClick={() => onEditRow(row.id)}
                    className={`${base} ${active} ${saved} cursor-pointer transition hover:bg-[var(--brand-primary-soft)]`}
                  >
                  <td className="whitespace-nowrap border border-slate-200 px-3 py-2 font-semibold text-slate-900">
                    {row.day} · {row.date}
                  </td>
                  <td className="whitespace-nowrap border border-slate-200 px-3 py-2 text-slate-700">
                    {formatTime12h(row.timeStart)} – {formatTime12h(row.timeEnd)}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{row.branches}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{row.ordersInput}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{row.disputedOrders}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{row.emailsFollowedUp}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{row.updatedOrders}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{row.videosUploaded}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{Number(row.totalHours || 0).toFixed(2)}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{row.productivityTotalActivities}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{Number(row.productivityPerHour || 0).toFixed(2)}</td>
                  <td className="border border-slate-200 px-3 py-2 text-right">{Number(row.averageActivitiesPerSite || 0).toFixed(2)}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-700">{row.remarks}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-700">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onChangePage(Math.max(1, page - 1))}
            className="rounded border border-slate-200 px-3 py-1 font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onChangePage(Math.min(totalPages, page + 1))}
            className="rounded border border-slate-200 px-3 py-1 font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}

export default SessionTable
