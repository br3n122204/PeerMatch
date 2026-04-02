export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const sec = Math.floor((Date.now() - then) / 1000)
  if (sec < 45) return 'just now'
  if (sec < 3600) {
    const m = Math.floor(sec / 60)
    return `${m} minute${m === 1 ? '' : 's'} ago`
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600)
    return `${h} hour${h === 1 ? '' : 's'} ago`
  }
  if (sec < 86400 * 7) {
    const d = Math.floor(sec / 86400)
    return `${d} day${d === 1 ? '' : 's'} ago`
  }
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatJoinedDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
