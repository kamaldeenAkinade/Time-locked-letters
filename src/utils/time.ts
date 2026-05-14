export function getTimeRemaining(unlockDate: string): string {
  const diff = new Date(unlockDate).getTime() - Date.now()
  if (diff <= 0) return ''

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0)    return `${days}d ${hours}h remaining`
  if (hours > 0)   return `${hours}h ${minutes}m remaining`
  if (minutes > 0) return `${minutes}m ${seconds}s remaining`
  return `${seconds}s remaining`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function formatLocalDateTime(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-') + 'T' + [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':')
}

export function getMinDateTime(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 1)
  return formatLocalDateTime(d)
}

export const QUICK_PRESETS = [
  { label: '1 min',    offset: () => { const d = new Date(); d.setMinutes(d.getMinutes() + 1); return d } },
  { label: '1 hour',   offset: () => { const d = new Date(); d.setHours(d.getHours() + 1); return d } },
  { label: 'Tomorrow', offset: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d } },
  { label: '1 week',   offset: () => { const d = new Date(); d.setDate(d.getDate() + 7); return d } },
  { label: '1 month',  offset: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d } },
  { label: '1 year',   offset: () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d } },
]
