import { Loader2, Wand2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { MidiPlayer } from '@/components/player/MidiPlayer'
import { Button } from '@/components/ui/button'
import { useAudioToMidi } from '@/hooks/useAudioToMidi'
import { useSynth } from '@/hooks/useSynth'
import type { NoteEvent } from '@/types/idea'

interface ExtractMidiFromAudioProps {
  audioBlob: Blob
  onConfirm: (notes: NoteEvent[]) => void | Promise<void>
  confirmLabel?: string
  confirmHint?: string
  previewHint?: string
}

export function ExtractMidiFromAudio({
  audioBlob,
  onConfirm,
  confirmLabel = 'Save MIDI',
  confirmHint,
  previewHint = 'Preview the transcription before saving it to this idea.',
}: ExtractMidiFromAudioProps) {
  const {
    convert,
    reset,
    isLoading,
    isConverting,
    progress,
    result,
    error,
  } = useAudioToMidi()
  const { currentPatch, isMuted } = useSynth()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    reset()
    setSaveError(null)
  }, [audioBlob, reset])

  const isBusy = isLoading || isConverting || isSaving
  const showPreview = result !== null && !error
  const previewPatch = isMuted ? 'muted' : currentPatch

  async function handleExtract() {
    try {
      await convert(audioBlob)
    } catch {
      // convert already logs and sets error state
    }
  }

  async function handleConfirm() {
    if (!result || result.length === 0) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      await onConfirm(result)
      reset()
    } catch (caught) {
      setSaveError(
        caught instanceof Error
          ? caught.message
          : 'Failed to save extracted MIDI.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
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
          ) : saveError ? (
            <p className="text-xs text-destructive">{saveError}</p>
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
            <p className="text-xs text-muted-foreground">{previewHint}</p>
            {confirmHint ? (
              <p className="mt-1 text-xs text-muted-foreground">{confirmHint}</p>
            ) : null}
          </div>

          <MidiPlayer notes={result} patchId={previewPatch} />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isSaving || result.length === 0}
              onClick={() => void handleConfirm()}
            >
              {isSaving ? 'Saving...' : confirmLabel}
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
