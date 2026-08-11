import { FolderOutput, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useExport } from '@/hooks/useExport'
import {
  applyExportOptions,
  canSaveToFolder,
  type ExportOptions,
} from '@/lib/export'

interface ExportDialogProps {
  songId: string
  songTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeAudio: true,
  includeMidi: true,
  includeImages: true,
  includeLyrics: true,
  includeJournal: true,
}

export function ExportDialog({
  songId,
  songTitle,
  open,
  onOpenChange,
}: ExportDialogProps) {
  const {
    exportData,
    isLoading,
    isExporting,
    error,
    loadExportData,
    saveToFolder,
    downloadZip,
  } = useExport(songId)
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS)

  useEffect(() => {
    if (open) {
      setOptions(DEFAULT_OPTIONS)
      void loadExportData()
    }
  }, [open, loadExportData])

  const filteredExport = useMemo(() => {
    if (!exportData) {
      return null
    }

    return applyExportOptions(exportData, options)
  }, [exportData, options])

  const summary = useMemo(() => {
    if (!filteredExport) {
      return { audio: 0, midi: 0, images: 0 }
    }

    return {
      audio: filteredExport.files.filter((file) => file.category === 'audio')
        .length,
      midi: filteredExport.files.filter((file) => file.category === 'midi')
        .length,
      images: filteredExport.files.filter((file) => file.category === 'images')
        .length,
    }
  }, [filteredExport])

  const canExport = (filteredExport?.files.length ?? 0) > 0
  const showFolderSave = canSaveToFolder()

  function toggleOption(key: keyof ExportOptions) {
    setOptions((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Export Song</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-1 py-4">
          <div>
            <p className="text-sm font-medium">{songTitle}</p>
            <p className="text-xs text-muted-foreground">
              Export ideas and production notes to a folder or zip file.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Preparing export...
            </div>
          ) : exportData ? (
            <>
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">Summary</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>{summary.audio} audio files</li>
                  <li>{summary.midi} MIDI files</li>
                  <li>{summary.images} images</li>
                  {exportData.inventory.hasLyrics ? (
                    <li>Lyrics (.txt)</li>
                  ) : null}
                  {exportData.inventory.hasJournal ? (
                    <li>Production journal (.md)</li>
                  ) : null}
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Include</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.includeAudio}
                      disabled={exportData.inventory.audio === 0}
                      onChange={() => toggleOption('includeAudio')}
                    />
                    Audio ({exportData.inventory.audio})
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.includeMidi}
                      disabled={exportData.inventory.midi === 0}
                      onChange={() => toggleOption('includeMidi')}
                    />
                    MIDI ({exportData.inventory.midi})
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.includeImages}
                      disabled={exportData.inventory.images === 0}
                      onChange={() => toggleOption('includeImages')}
                    />
                    Images ({exportData.inventory.images})
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.includeLyrics}
                      disabled={!exportData.inventory.hasLyrics}
                      onChange={() => toggleOption('includeLyrics')}
                    />
                    Lyrics
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.includeJournal}
                      disabled={!exportData.inventory.hasJournal}
                      onChange={() => toggleOption('includeJournal')}
                    />
                    Production journal
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Folder preview</Label>
                <pre className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                  {(filteredExport?.preview ?? []).join('\n')}
                </pre>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No export data available.
            </p>
          )}

          {!showFolderSave ? (
            <p className="text-xs text-muted-foreground">
              Save to Folder requires Chrome or Edge. Download as ZIP works in all
              browsers.
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {showFolderSave ? (
            <Button
              variant="secondary"
              disabled={!canExport || isExporting}
              onClick={() => void saveToFolder(options)}
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FolderOutput className="size-4" />
              )}
              Save to Folder
            </Button>
          ) : null}
          <Button
            disabled={!canExport || isExporting}
            onClick={() => void downloadZip(options)}
          >
            {isExporting ? 'Exporting...' : 'Download as ZIP'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
