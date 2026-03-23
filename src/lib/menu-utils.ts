export function getNextMondayUTC(from: Date = new Date()): string {
  const day = from.getUTCDay()
  const daysUntil = day === 0 ? 1 : 8 - day
  const next = new Date(from)
  next.setUTCDate(from.getUTCDate() + daysUntil)
  return next.toISOString().split('T')[0]
}
