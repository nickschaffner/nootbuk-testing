export function parseMmSs(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = /^(\d+):(\d{1,2})$/.exec(trimmed)
  if (!match) {
    return null
  }

  const minutes = Number.parseInt(match[1], 10)
  const seconds = Number.parseInt(match[2], 10)
  if (Number.isNaN(minutes) || Number.isNaN(seconds) || seconds >= 60) {
    return null
  }

  return minutes * 60 + seconds
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) {
    return 'just now'
  }

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  }

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) {
    return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  }

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) {
    return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString()
}
