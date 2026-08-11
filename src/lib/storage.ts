export const STORAGE_WARNING_THRESHOLD = 0.85

export const STORAGE_FULL_MESSAGE =
  'Storage is full. Delete some ideas or media to free up space.'

export function isQuotaExceededError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'QuotaExceededError') ||
    (error instanceof Error && error.name === 'QuotaExceededError')
  )
}

export function toStorageError(error: unknown): Error {
  if (isQuotaExceededError(error)) {
    return new Error(STORAGE_FULL_MESSAGE)
  }

  return error instanceof Error ? error : new Error('Database operation failed.')
}

export interface StorageEstimate {
  usage: number
  quota: number
  ratio: number
}

export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (!navigator.storage?.estimate) {
    return null
  }

  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate()

    return {
      usage,
      quota,
      ratio: quota > 0 ? usage / quota : 0,
    }
  } catch (error) {
    console.warn('getStorageEstimate failed:', error)
    return null
  }
}

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
