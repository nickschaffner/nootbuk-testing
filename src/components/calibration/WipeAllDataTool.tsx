import { useState } from 'react'

import { wipeAllData } from '@/components/calibration/wipeAllData'
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

interface WipeAllDataToolProps {
  onComplete?: () => void
}

export function WipeAllDataTool({ onComplete }: WipeAllDataToolProps) {
  const [open, setOpen] = useState(false)
  const [isWiping, setIsWiping] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleWipe() {
    setIsWiping(true)
    setMessage(null)
    try {
      await wipeAllData()
      setOpen(false)
      setMessage('All Dexie tables cleared.')
      onComplete?.()
    } catch (error) {
      console.warn('wipeAllData failed:', error)
      setMessage(
        error instanceof Error ? error.message : 'Failed to wipe database.',
      )
    } finally {
      setIsWiping(false)
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div>
        <h2 className="text-base font-semibold">Wipe All Data</h2>
        <p className="text-sm text-muted-foreground">
          Deletes every record in every Dexie table. Full clean slate.
        </p>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isWiping}>
            {isWiping ? 'Wiping...' : 'Wipe All Data'}
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
            <AlertDialogCancel disabled={isWiping}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isWiping}
              onClick={(event) => {
                event.preventDefault()
                void handleWipe()
              }}
            >
              {isWiping ? 'Wiping...' : 'Wipe Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </section>
  )
}
