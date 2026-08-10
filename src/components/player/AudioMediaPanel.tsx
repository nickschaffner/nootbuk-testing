import { Loader2, Wand2 } from 'lucide-react'
import { useState } from 'react'

import { AudioPlayer } from '@/components/player/AudioPlayer'
import { MidiPlayer } from '@/components/player/MidiPlayer'
import { Button } from '@/components/ui/button'
import { useAudioToMidi } from '@/hooks/useAudioToMidi'
import { addMediaToIdea } from '@/hooks/useMedia'
import { getMidiDuration, noteEventsToMidiBlob } from '@/lib/midi'
import type { IdeaMedia } from '@/types/idea'

interface AudioMediaPanelProps {
  ideaId: string
  media: IdeaMedia
}

export function AudioMediaPanel({ ideaId, media }: AudioMediaPanelProps) {
  const {
    convert,
    reset,
    isLoading,
    isConverting,
    progress,
    result,
    error,
  } = useAudioToMidi()
  const [isSaving, setIsSaving] = useState(false)

  if (media.type !== 'audio') {
    return null
  }

  const isBusy = isLoading || isConverting || isSaving
  const showPreview = result !== null && !error

  async function handleExtract() {
    try {
      await convert(media.blob)
    } catch {
      // convert already logs and sets error state
    }
  }

  async function handleConfirm() {
    if (!result || result.length === 0) {
      return
    }

    setIsSaving(true)
    try {
      const blob = noteEventsToMidiBlob(result)
      const baseName = media.filename.replace(/\.[^.]+$/, '')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

      await addMediaToIdea({
        ideaId,
        type: 'midi',
        filename: `${baseName}-extracted-${timestamp}.mid`,
        mimeType: 'audio/midi',
        blob,
        duration: getMidiDuration(result),
        noteData: result,
      })

      reset()
    } catch {
      // addMediaToIdea already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <AudioPlayer
        blob={media.blob}
        mimeType={media.mimeType}
        filename={media.filename}
      />

      {!showPreview ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => void handleExtract()}
          >
            {isLoading || isConverting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
            {isLoading
              ? 'Loading model...'
              : isConverting
                ? `Extracting MIDI... ${Math.round(progress * 100)}%`
                : 'Extract MIDI'}
          </Button>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Extracted MIDI may be imperfect and is not quantized.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <div>
            <p className="text-sm font-medium">Extracted MIDI</p>
            <p className="text-xs text-muted-foreground">
              Preview the transcription before saving it to this idea.
            </p>
          </div>

          <MidiPlayer notes={result} patchId="piano" />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isSaving || result.length === 0}
              onClick={() => void handleConfirm()}
            >
              {isSaving ? 'Saving...' : 'Save MIDI'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={reset}
            >
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
