import { useCallback, useEffect, useState } from 'react'

import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'

const STAT_TABLES = [
  'ideas',
  'ideaMedia',
  'songs',
  'songSections',
  'songJournalEntries',
  'songReferences',
  'songAssets',
  'songTodos',
  'songVersions',
  'albums',
  'albumSongs',
  'instruments',
] as const

type TableCounts = Record<(typeof STAT_TABLES)[number], number>

function formatBytes(bytes: number | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) {
    return 'Unknown'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

interface DatabaseStatsToolProps {
  /** Bump this after wipe / seed / import to reload counts. */
  refreshToken?: number
}

export function DatabaseStatsTool({ refreshToken = 0 }: DatabaseStatsToolProps) {
  const [counts, setCounts] = useState<TableCounts | null>(null)
  const [usage, setUsage] = useState<number | null>(null)
  const [quota, setQuota] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const nextCounts = {} as TableCounts
      for (const name of STAT_TABLES) {
        nextCounts[name] = await db.table(name).count()
      }
      setCounts(nextCounts)

      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate()
        setUsage(estimate.usage ?? null)
        setQuota(estimate.quota ?? null)
      } else {
        setUsage(null)
        setQuota(null)
      }
    } catch (err) {
      console.warn('DatabaseStatsTool refresh failed:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load database stats.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, refreshToken])

  return (
    <section className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Database Stats</h2>
          <p className="text-sm text-muted-foreground">
            Row counts per table and estimated storage usage.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => void refresh()}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {counts ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_TABLES.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-md border bg-background/60 px-3 py-2 text-sm"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {name}
              </span>
              <span className="font-medium tabular-nums">{counts[name]}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Loading counts...</p>
      )}

      <div className="rounded-md border bg-background/60 px-3 py-2 text-sm">
        <p>
          <span className="text-muted-foreground">Estimated usage: </span>
          {formatBytes(usage ?? undefined)}
        </p>
        <p>
          <span className="text-muted-foreground">Estimated quota: </span>
          {formatBytes(quota ?? undefined)}
        </p>
      </div>
    </section>
  )
}
