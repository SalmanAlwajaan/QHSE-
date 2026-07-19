export function fmtDate(s) {
  if (!s) return '—'
  const dt = new Date(s)
  if (isNaN(dt)) return s
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(s) {
  if (!s) return null
  const today = new Date(new Date().toISOString().slice(0, 10))
  const dt = new Date(s)
  if (isNaN(dt)) return null
  return Math.round((dt - today) / 86400000)
}

// Returns compliance status for an expiry date.
// critical = expired or <=30d, warning = <=90d, ok = valid, none = no date
export function expiryStatus(date, criticalDays = 30, warningDays = 90) {
  const days = daysUntil(date)
  if (days === null) return { key: 'none', tone: 'gray', label: 'No expiry', days }
  if (days < 0) return { key: 'expired', tone: 'red', label: `Expired ${Math.abs(days)}d ago`, days }
  if (days <= criticalDays) return { key: 'critical', tone: 'red', label: `${days}d left`, days }
  if (days <= warningDays) return { key: 'warning', tone: 'amber', label: `${days}d left`, days }
  return { key: 'ok', tone: 'green', label: 'Valid', days }
}

export function statusTone(status) {
  const s = String(status || '').toLowerCase()
  if (['active', 'pass', 'completed', 'closed', 'done', 'valid', 'approved'].includes(s)) return 'green'
  if (['conditional', 'in progress', 'scheduled', 'planned', 'open', 'pending', 'draft'].includes(s)) return 'amber'
  if (['fail', 'expired', 'overdue', 'rejected', 'inactive', 'major'].includes(s)) return 'red'
  if (['minor'].includes(s)) return 'amber'
  return 'gray'
}

export function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export const ROLE_LABEL = { admin: 'Administrator', hr: 'HR', pm: 'Project Manager', hse: 'HSE / Safety', ceo: 'Executive', employee: 'Employee' }
