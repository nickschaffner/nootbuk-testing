import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { addMediaToIdea } from '@/hooks/useMedia'
import {
  getAudioDuration,
  getAudioMimeType,
  isAcceptedAudioFile,
} from '@/lib/audio'
import { cn } from '@/lib/utils'

interface AudioImportProps {
  ideaId: string
  onImported?: () => void
  className?: string
}

export function AudioImport({
  ideaId,
  onImported,
  className,
}: AudioImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function importFile(file: File) {
    if (!isAcceptedAudioFile(file)) {
      setError('Only .wav, .mp3, and .aiff files are supported.')
      return
    }

    setError(null)
    setIsImporting(true)

    try {
      const duration = await getAudioDuration(file)
      await addMediaToIdea({
        ideaId,
        type: 'audio',
        filename: file.name,
        mimeType: getAudioMimeType(file.name, file.type),
        blob: file,
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

  return (
    <div className={cn('space-y-3 rounded-lg border p-4', className)}>
      <h3 className="text-sm font-medium">Import Audio</h3>

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

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
