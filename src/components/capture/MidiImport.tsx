import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { addMediaToIdea } from '@/hooks/useMedia'
import { getMidiDuration, isMidiFile, midiBlobToNoteEvents } from '@/lib/midi'
import { cn } from '@/lib/utils'

interface MidiImportProps {
  ideaId: string
  onImported?: () => void
  className?: string
}

export function MidiImport({
  ideaId,
  onImported,
  className,
}: MidiImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function importFile(file: File) {
    if (!isMidiFile(file)) {
      setError('Only .mid files are supported.')
      return
    }

    setError(null)
    setIsImporting(true)

    try {
      const noteData = await midiBlobToNoteEvents(file)
      await addMediaToIdea({
        ideaId,
        type: 'midi',
        filename: file.name,
        mimeType: 'audio/midi',
        blob: file,
        duration: getMidiDuration(noteData),
        noteData,
      })
      onImported?.()
    } catch {
      setError('Failed to import MIDI file.')
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
      <h3 className="text-sm font-medium">Import MIDI</h3>

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
          Drag and drop a .mid file here
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
          accept=".mid,audio/midi,audio/x-midi"
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
