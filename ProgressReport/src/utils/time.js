export const parseTimeToDecimal = (value) => {
  if (!value || typeof value !== 'string') return Number.NaN
  const parts = value.split(':').map(Number)
  if (parts.length < 2 || parts.length > 3) return Number.NaN
  const [h, m, s = 0] = parts
  if ([h, m, s].some((v) => Number.isNaN(v))) return Number.NaN
  return h + m / 60 + s / 3600
}

export const formatDecimalToTime = (value) => {
  if (!Number.isFinite(value) || value <= 0) return ''
  const totalMinutes = Math.round(value * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}:${String(minutes).padStart(2, '0')}`
}
