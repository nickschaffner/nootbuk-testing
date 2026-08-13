import { useState } from 'react'

import {
  wipeAllAlbums,
  wipeAllData,
  wipeAllInstruments,
  wipeAllSongs,
  wipePoolIdeas,
} from '@/components/calibration/wipeAllData'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type WipeKind = 'all' | 'pool' | 'songs' | 'albums' | 'instruments'

const SELECTIVE_ACTIONS: Array<{
  kind: Exclude<WipeKind, 'all'>
  label: string
  confirmTitle: string
  confirmBody: string
  run: () => Promise<void>
}> = [
  {
    kind: 'pool',
    label: 'Wipe Idea Pool',
    confirmTitle: 'Wipe the idea pool?',
    confirmBody:
      'Deletes every pool idea (not attached to a song) and their media. Song ideas stay.',
    run: wipePoolIdeas,
  },
  {
    kind: 'songs',
    label: 'Wipe Songs',
    confirmTitle: 'Wipe all songs?',
    confirmBody:
      'Deletes every song, related song data, and ideas that belong to songs (with media). Pool ideas stay.',
    run: wipeAllSongs,
  },
  {
    kind: 'albums',
    label: 'Wipe Albums',
    confirmTitle: 'Wipe all albums?',
    confirmBody:
      'Deletes every album, track listing, and album references. Songs stay.',
    run: wipeAllAlbums,
  },
  {
    kind: 'instruments',
    label: 'Wipe Instruments',
    confirmTitle: 'Wipe all instruments?',
    confirmBody: 'Deletes every instrument record.',
    run: wipeAllInstruments,
  },
]

interface WipeDataToolProps {
  onComplete?: () => void
}

export function WipeDataTool({ onComplete }: WipeDataToolProps) {
  const [busyKind, setBusyKind] = useState<WipeKind | null>(null)
  const [openKind, setOpenKind] = useState<WipeKind | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleWipe(kind: WipeKind, run: () => Promise<void>) {
    setBusyKind(kind)
    setMessage(null)
    try {
      await run()
      setOpenKind(null)
      setMessage(
        kind === 'all' ? 'All Dexie tables cleared.' : `Done: ${kind} wipe.`,
      )
      onComplete?.()
    } catch (error) {
      console.warn(`wipe (${kind}) failed:`, error)
      setMessage(
        error instanceof Error ? error.message : `Failed to wipe ${kind}.`,
      )
    } finally {
      setBusyKind(null)
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div>
        <h2 className="text-base font-semibold">Wipe Data</h2>
        <p className="text-sm text-muted-foreground">
          Clear the whole database or one slice of it.
        </p>
      </div>

      <AlertDialog
        open={openKind === 'all'}
        onOpenChange={(open) => setOpenKind(open ? 'all' : null)}
      >
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={busyKind !== null}>
            {busyKind === 'all' ? 'Wiping...' : 'Wipe All Data'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wipe the entire database?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes all ideas, songs, albums, instruments,
              media, and related data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyKind !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busyKind !== null}
              onClick={(event) => {
                event.preventDefault()
                void handleWipe('all', wipeAllData)
              }}
            >
              {busyKind === 'all' ? 'Wiping...' : 'Wipe Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-wrap gap-2">
        {SELECTIVE_ACTIONS.map((action) => (
          <AlertDialog
            key={action.kind}
            open={openKind === action.kind}
            onOpenChange={(open) =>
              setOpenKind(open ? action.kind : null)
            }
          >
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busyKind !== null}
              >
                {busyKind === action.kind ? 'Wiping...' : action.label}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{action.confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {action.confirmBody}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busyKind !== null}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={busyKind !== null}
                  onClick={(event) => {
                    event.preventDefault()
                    void handleWipe(action.kind, action.run)
                  }}
                >
                  {busyKind === action.kind ? 'Wiping...' : action.label}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </section>
  )
}
