function SessionTable({ rows }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Daily breakdown</h2>
          <p className="text-sm text-slate-500">Detailed view of orders, follow-ups, and productivity per session.</p>
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
  )
}

export default SessionTable
