import { Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AudioPlayer } from '@/components/player/AudioPlayer'
import { Button } from '@/components/ui/button'
import { addMediaToIdea } from '@/hooks/useMedia'
import {
  getAudioDuration,
  getAudioMimeType,
  isAcceptedAudioFile,
  normalizeAudioBlob,
} from '@/lib/audio'
import { cn } from '@/lib/utils'

export type AudioImportDraft = {
  blob: Blob
  filename: string
}

interface AudioImportProps {
  ideaId?: string
  draft?: boolean
  embedded?: boolean
  onDraftChange?: (data: AudioImportDraft | null) => void
  onImported?: () => void
  className?: string
}

export function AudioImport({
  ideaId,
  draft = false,
  embedded = false,
  onDraftChange,
  onImported,
  className,
}: AudioImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onDraftChangeRef = useRef(onDraftChange)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState<AudioImportDraft | null>(null)

  useEffect(() => {
    onDraftChangeRef.current = onDraftChange
  }, [onDraftChange])

  useEffect(() => {
    if (draft) {
      onDraftChangeRef.current?.(imported)
    }
  }, [draft, imported])

  async function importFile(file: File) {
    if (!isAcceptedAudioFile(file)) {
      setError('Only .wav, .mp3, and .aiff files are supported.')
      return
    }

    setError(null)
    setIsImporting(true)

    try {
      const nextImport = { blob: file, filename: file.name }

      if (draft) {
        setImported(nextImport)
        return
      }

      if (!ideaId) {
        return
      }

      const duration = await getAudioDuration(file)
      const mimeType = getAudioMimeType(file.name, file.type)
      const blob = await normalizeAudioBlob(file, mimeType, file.name)

      await addMediaToIdea({
        ideaId,
        type: 'audio',
        filename: file.name,
        mimeType,
        blob,
        duration,
        noteData: null,
      })
      onImported?.()
    } catch {
      setError('Failed to import audio file.')
    } finally {
      setIsImporting(false)
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) {
      void importFile(file)
    }
  }

  function handleClear() {
    setImported(null)
    setError(null)
  }

  return (
    <div
      className={cn(
        embedded ? 'space-y-3' : 'space-y-3 rounded-lg border p-4',
        className,
      )}
    >
      {!embedded ? (
        <h3 className="text-sm font-medium">Import Audio</h3>
      ) : null}

      {draft && imported ? (
        <div className="space-y-3">
          <AudioPlayer
            blob={imported.blob}
            mimeType={getAudioMimeType(imported.filename, imported.blob.type)}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {imported.filename}
            </p>
            <Button type="button" size="sm" variant="ghost" onClick={handleClear}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center transition-colors',
            isDragging && 'border-primary bg-primary/5',
          )}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            handleFiles(event.dataTransfer.files)
          }}
        >
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag and drop a .wav, .mp3, or .aiff file here
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isImporting}
            onClick={() => inputRef.current?.click()}
          >
            {isImporting ? 'Importing...' : 'Choose File'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".wav,.mp3,.aiff,.aif,audio/wav,audio/mpeg,audio/aiff"
            className="hidden"
            onChange={(event) => {
              handleFiles(event.target.files)
              event.target.value = ''
            }}
          />
        </div>
      )}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
