// Attempts to load the first CSV in this folder; falls back to dummy data when absent.
let csvText = ''

try {
  const csvModules = import.meta.glob('./*.csv', { as: 'raw', eager: true })
  const firstCsv = Object.values(csvModules)[0]
  if (typeof firstCsv === 'string') csvText = firstCsv
} catch (err) {
  // ignore glob errors and rely on fallback
}

const parseLine = (line) => {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

const parseDateToIso = (mmddyyyy) => {
  const parts = mmddyyyy.split('/')
  if (parts.length !== 3) return ''
  const [m, d, y] = parts
  if (!y || !m || !d) return ''
  const mm = m.padStart(2, '0')
  const dd = d.padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

const toNumber = (value) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const parseCsv = (text) => {
  const rows = []
  const lines = text.split(/\r?\n/)

  lines.forEach((line) => {
    if (!line || !line.trim()) return
    const cells = parseLine(line)
    if (cells.length < 17) return

    const day = cells[0]
    const dateRaw = cells[1]
    if (!day || !dateRaw) return
    if (day.toUpperCase() === 'TOTAL' || dateRaw.toUpperCase() === 'TOTAL') return
    if (!/\d{1,2}\/\d{1,2}\/\d{4}/.test(dateRaw)) return

    const isoDate = parseDateToIso(dateRaw)
    if (!isoDate) return

    const hoursDecimal = toNumber(cells[13])
    if (!Number.isFinite(hoursDecimal) || hoursDecimal <= 0) return

    const remarks = cells[17] ? cells[17].replace(/^"+|"+$/g, '').trim() : ''

    rows.push({
      id: rows.length + 1,
      day,
      date: isoDate,
      timeStart: cells[2] || '',
      timeEnd: cells[3] || '',
      branches: toNumber(cells[4]),
      ordersInput: toNumber(cells[5]),
      disputedOrders: toNumber(cells[6]),
      emailsFollowedUp: toNumber(cells[7]),
      updatedOrders: toNumber(cells[8]),
      videosUploaded: toNumber(cells[10]),
      totalHours: Number(hoursDecimal.toFixed(2)),
      productivityTotalActivities: toNumber(cells[14]),
      productivityPerHour: Number(toNumber(cells[15]).toFixed(2)),
      averageActivitiesPerSite: Number(toNumber(cells[16]).toFixed(2)),
      remarks,
    })
  })

  return rows
}

const parsed = csvText ? parseCsv(csvText) : []

const fallback = [
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
    totalHours: 4,
    productivityTotalActivities: 161,
    productivityPerHour: 40,
    averageActivitiesPerSite: 1.49,
    remarks: 'Dual Role Work: GDK KH, IVI Holdings (GDK), Pepes Trinity, BK',
  },
]

export const initialData = parsed.length > 0 ? parsed : fallback
