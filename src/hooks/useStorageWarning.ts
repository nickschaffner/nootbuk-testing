import { useEffect, useState } from 'react'

import {
  formatStorageSize,
  getStorageEstimate,
  STORAGE_WARNING_THRESHOLD,
} from '@/lib/storage'

export function useStorageWarning(
  threshold = STORAGE_WARNING_THRESHOLD,
): string | null {
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const estimate = await getStorageEstimate()
      if (cancelled || !estimate) {
        return
      }

      if (estimate.ratio >= threshold) {
        const percent = Math.round(estimate.ratio * 100)
        setWarning(
          `Storage is ${percent}% full (${formatStorageSize(estimate.usage)} of ${formatStorageSize(estimate.quota)}). Delete old media to avoid losing saves.`,
        )
      } else {
        setWarning(null)
      }
    }

    void check()
    const intervalId = window.setInterval(() => void check(), 60_000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [threshold])

  return warning
}
