import { useState } from 'react'

import {
  wipeAllAlbums,
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

type SelectiveWipeKind = 'pool' | 'songs' | 'albums' | 'instruments'

const WIPE_ACTIONS: Array<{
  kind: SelectiveWipeKind
  label: string
  description: string
  confirmTitle: string
  confirmBody: string
  run: () => Promise<void>
}> = [
  {
    kind: 'pool',
    label: 'Wipe Pool Ideas',
    description: 'Deletes ideas in the pool (not attached to a song) and their media.',
    confirmTitle: 'Wipe all pool ideas?',
    confirmBody:
      'This permanently deletes every idea with no song, plus their IdeaMedia. Song ideas are left alone.',
    run: wipePoolIdeas,
  },
  {
    kind: 'songs',
    label: 'Wipe All Songs',
    description:
      'Deletes every song, related song data, and ideas that belong to songs.',
    confirmTitle: 'Wipe all songs and their ideas?',
    confirmBody:
      'This permanently deletes all songs, sections, journals, references, assets, todos, versions, album track links, and every idea attached to a song (with media). Pool ideas are left alone.',
    run: wipeAllSongs,
  },
  {
    kind: 'albums',
    label: 'Wipe All Albums',
    description: 'Deletes every album, track listing, and album references.',
    confirmTitle: 'Wipe all albums?',
    confirmBody:
      'This permanently deletes all albums, album–song links, and album references. Songs themselves are left alone.',
    run: wipeAllAlbums,
  },
  {
    kind: 'instruments',
    label: 'Wipe All Instruments',
    description: 'Deletes every instrument record.',
    confirmTitle: 'Wipe all instruments?',
    confirmBody:
      'This permanently deletes every instrument. Ideas that referenced them keep their other data.',
    run: wipeAllInstruments,
  },
]

interface SelectiveWipeToolProps {
  onComplete?: () => void
}

export function SelectiveWipeTool({ onComplete }: SelectiveWipeToolProps) {
  const [busyKind, setBusyKind] = useState<SelectiveWipeKind | null>(null)
  const [openKind, setOpenKind] = useState<SelectiveWipeKind | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleWipe(kind: SelectiveWipeKind, run: () => Promise<void>) {
    setBusyKind(kind)
    setMessage(null)
    try {
      await run()
      setOpenKind(null)
      setMessage(`Done: ${kind} wipe.`)
      onComplete?.()
    } catch (error) {
      console.warn(`selective wipe (${kind}) failed:`, error)
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
        <h2 className="text-base font-semibold">Selective Wipe</h2>
        <p className="text-sm text-muted-foreground">
          Clear one slice of the database without a full wipe.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {WIPE_ACTIONS.map((action) => (
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
                className="h-auto flex-col items-start gap-1 px-3 py-2 text-left"
                disabled={busyKind !== null}
              >
                <span className="font-medium">{action.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {action.description}
                </span>
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
