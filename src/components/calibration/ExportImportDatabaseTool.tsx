import { exportDB, importDB } from 'dexie-export-import'
import { useRef, useState } from 'react'

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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'

function backupFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `nootbuk-backup-${date}.json`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

interface ExportImportDatabaseToolProps {
  onComplete?: () => void
}

export function ExportImportDatabaseTool({
  onComplete,
}: ExportImportDatabaseToolProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleExport() {
    setIsBusy(true)
    setMessage(null)
    try {
      const blob = await exportDB(db)
      downloadBlob(blob, backupFilename())
      setMessage(`Exported ${backupFilename()}.`)
    } catch (error) {
      console.warn('exportDB failed:', error)
      setMessage(
        error instanceof Error ? error.message : 'Failed to export database.',
      )
    } finally {
      setIsBusy(false)
    }
  }

  function handleFilePicked(files: FileList | null) {
    const file = files?.[0]
    if (!file) {
      return
    }
    setPendingFile(file)
    setConfirmOpen(true)
  }

  async function handleImportConfirm() {
    if (!pendingFile) {
      return
    }

    setIsBusy(true)
    setMessage(null)
    try {
      await wipeAllData()
      await importDB(pendingFile)
      setConfirmOpen(false)
      setPendingFile(null)
      setMessage('Import complete. Reloading…')
      onComplete?.()
      window.location.reload()
    } catch (error) {
      console.warn('importDB failed:', error)
      setMessage(
        error instanceof Error ? error.message : 'Failed to import database.',
      )
      setIsBusy(false)
      setConfirmOpen(false)
      setPendingFile(null)
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
      <div>
        <h2 className="text-base font-semibold">Export / Import Database</h2>
        <p className="text-sm text-muted-foreground">
          Back up the full Dexie database as JSON, or restore from a backup
          (overwrites all current data).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => void handleExport()}
        >
          {isBusy ? 'Working...' : 'Export Database'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
        >
          Import Database
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            handleFilePicked(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite all current data?</AlertDialogTitle>
            <AlertDialogDescription>
              Importing clears the database and restores from{' '}
              <span className="font-medium">
                {pendingFile?.name ?? 'this file'}
              </span>
              . Everything currently stored will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isBusy}
              onClick={() => setPendingFile(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isBusy || !pendingFile}
              onClick={(event) => {
                event.preventDefault()
                void handleImportConfirm()
              }}
            >
              {isBusy ? 'Importing...' : 'Clear & Import'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
