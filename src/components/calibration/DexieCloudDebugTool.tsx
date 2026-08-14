import { useCallback, useEffect, useState } from 'react'
import { useObservable } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'

type SyncAction = 'push' | 'pull' | 'full'

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message
  }
  if (typeof error === 'string') {
    return error
  }
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

function formatValue(value: unknown): string {
  if (value === undefined) {
    return '(undefined)'
  }
  if (value === null) {
    return '(null)'
  }
  if (typeof value === 'string') {
    return value === '' ? '(empty)' : value
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function DexieCloudDebugTool() {
  const currentUser = useObservable(db.cloud.currentUser)
  const syncState = useObservable(db.cloud.syncState)
  const webSocketStatus = useObservable(db.cloud.webSocketStatus)

  const [tableCounts, setTableCounts] = useState<Record<string, number> | null>(
    null,
  )
  const [countsError, setCountsError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<SyncAction | null>(null)
  const [actionResults, setActionResults] = useState<
    Partial<Record<SyncAction, { ok: boolean; message: string }>>
  >({})

  const cloudUrl = import.meta.env.VITE_DEXIE_CLOUD_URL as string | undefined
  const options = db.cloud.options

  const refreshCounts = useCallback(async () => {
    setCountsError(null)
    try {
      const next: Record<string, number> = {}
      for (const table of db.tables) {
        next[table.name] = await table.count()
      }
      setTableCounts(next)
    } catch (error) {
      setCountsError(formatError(error))
    }
  }, [])

  useEffect(() => {
    void refreshCounts()
  }, [refreshCounts])

  useEffect(() => {
    if (!syncState) {
      return
    }
    console.log('[dexie-cloud syncState]', {
      ...syncState,
    })
  }, [syncState])

  async function runSync(action: SyncAction, run: () => Promise<void>) {
    setBusyAction(action)
    setActionResults((current) => ({ ...current, [action]: undefined }))
    try {
      await run()
      setActionResults((current) => ({
        ...current,
        [action]: { ok: true, message: 'success' },
      }))
      await refreshCounts()
    } catch (error) {
      setActionResults((current) => ({
        ...current,
        [action]: { ok: false, message: formatError(error) },
      }))
    } finally {
      setBusyAction(null)
    }
  }

  const syncError = syncState?.error

  return (
    <section className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div>
        <h2 className="text-base font-semibold">Dexie Cloud Debug</h2>
        <p className="text-sm text-muted-foreground">
          Live user, sync, and connection state for diagnosing multi-device
          replication.
        </p>
      </div>

      <div className="space-y-1 rounded-md border bg-background/60 px-3 py-2 text-sm">
        <p className="font-medium">Environment</p>
        <p>
          <span className="text-muted-foreground">VITE_DEXIE_CLOUD_URL set: </span>
          {cloudUrl ? 'yes' : <span className="font-semibold text-red-500">no</span>}
        </p>
        <p className="break-all">
          <span className="text-muted-foreground">VITE_DEXIE_CLOUD_URL value: </span>
          {cloudUrl ? (
            cloudUrl
          ) : (
            <span className="font-semibold text-red-500">(unset)</span>
          )}
        </p>
        <p>
          <span className="text-muted-foreground">db.cloud.options: </span>
          {options ? 'present' : (
            <span className="font-semibold text-red-500">null (not connected)</span>
          )}
        </p>
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
          {formatValue(
            options
              ? {
                  databaseUrl: options.databaseUrl,
                  requireAuth: options.requireAuth,
                  tryUseServiceWorker: options.tryUseServiceWorker,
                  usingServiceWorker: db.cloud.usingServiceWorker ?? false,
                }
              : null,
          )}
        </pre>
      </div>

      <div className="space-y-1 rounded-md border bg-background/60 px-3 py-2 text-sm">
        <p className="font-medium">Current user</p>
        <p>
          <span className="text-muted-foreground">email: </span>
          {formatValue(currentUser?.email)}
        </p>
        <p className="break-all">
          <span className="text-muted-foreground">userId: </span>
          {formatValue(currentUser?.userId)}
        </p>
        <p>
          <span className="text-muted-foreground">isLoggedIn: </span>
          {formatValue(currentUser?.isLoggedIn)}
        </p>
      </div>

      <div className="space-y-1 rounded-md border bg-background/60 px-3 py-2 text-sm">
        <p className="font-medium">Sync state</p>
        <p>
          <span className="text-muted-foreground">phase: </span>
          {formatValue(syncState?.phase)}
        </p>
        <p>
          <span className="text-muted-foreground">status: </span>
          {formatValue(syncState?.status)}
        </p>
        <p>
          <span className="text-muted-foreground">progress: </span>
          {formatValue(syncState?.progress)}
        </p>
        <p>
          <span className="text-muted-foreground">license: </span>
          {formatValue(syncState?.license)}
        </p>
        <p>
          <span className="text-muted-foreground">error: </span>
          {syncError ? (
            <span className="font-semibold text-red-500 whitespace-pre-wrap">
              {formatError(syncError)}
            </span>
          ) : (
            formatValue(syncError)
          )}
        </p>
        {(syncState?.phase === 'error' || syncState?.status === 'error') && (
          <p className="font-semibold text-red-500">
            Sync is in error state (phase={String(syncState?.phase)}, status=
            {String(syncState?.status)})
          </p>
        )}
      </div>

      <div className="space-y-1 rounded-md border bg-background/60 px-3 py-2 text-sm">
        <p className="font-medium">WebSocket</p>
        <p>
          <span className="text-muted-foreground">status: </span>
          {webSocketStatus === 'error' ? (
            <span className="font-semibold text-red-500">
              {formatValue(webSocketStatus)}
            </span>
          ) : (
            formatValue(webSocketStatus)
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busyAction !== null}
          onClick={() =>
            void runSync('push', () => db.cloud.sync({ purpose: 'push', wait: true }))
          }
        >
          {busyAction === 'push' ? 'Pushing...' : 'Force Push'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busyAction !== null}
          onClick={() =>
            void runSync('pull', () => db.cloud.sync({ purpose: 'pull', wait: true }))
          }
        >
          {busyAction === 'pull' ? 'Pulling...' : 'Force Pull'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busyAction !== null}
          onClick={() => void runSync('full', () => db.cloud.sync())}
        >
          {busyAction === 'full' ? 'Syncing...' : 'Full Sync'}
        </Button>
      </div>

      {(['push', 'pull', 'full'] as const).map((action) => {
        const result = actionResults[action]
        if (!result) {
          return null
        }
        const label =
          action === 'push'
            ? 'Force Push'
            : action === 'pull'
              ? 'Force Pull'
              : 'Full Sync'
        return (
          <p
            key={action}
            className={
              result.ok
                ? 'text-sm'
                : 'whitespace-pre-wrap text-sm font-semibold text-red-500'
            }
          >
            {label}: {result.message}
          </p>
        )
      })}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Local table counts</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void refreshCounts()}
          >
            Refresh counts
          </Button>
        </div>
        {countsError ? (
          <p className="whitespace-pre-wrap text-sm font-semibold text-red-500">
            {countsError}
          </p>
        ) : null}
        {tableCounts ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(tableCounts).map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md border bg-background/60 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {name}
                </span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading counts...</p>
        )}
      </div>
    </section>
  )
}
