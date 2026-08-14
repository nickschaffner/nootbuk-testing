import { Mic, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AudioPlayer } from '@/components/player/AudioPlayer'
import { WaveformCanvas } from '@/components/player/WaveformCanvas'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { addMediaToIdea } from '@/hooks/useMedia'
import { getAudioDuration } from '@/lib/audio'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  ideaId?: string
  draft?: boolean
  onDraftChange?: (blob: Blob | null) => void
  onSaved?: () => void
  embedded?: boolean
  className?: string
}

export function AudioRecorder({
  ideaId,
  draft = false,
  onDraftChange,
  onSaved,
  embedded = false,
  className,
}: AudioRecorderProps) {
  const {
    startRecording,
    stopRecording,
    resetRecording,
    isRecording,
    audioBlob,
    error,
    analyser,
  } = useAudioRecorder()

  const [isSaving, setIsSaving] = useState(false)
  const onDraftChangeRef = useRef(onDraftChange)

  useEffect(() => {
    onDraftChangeRef.current = onDraftChange
  }, [onDraftChange])

  useEffect(() => {
    if (draft) {
      onDraftChangeRef.current?.(audioBlob)
    }
  }, [audioBlob, draft])

  async function handleSave() {
    if (!audioBlob || !ideaId) {
      return
    }

    setIsSaving(true)
    try {
      const duration = await getAudioDuration(audioBlob)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

      await addMediaToIdea({
        ideaId,
        type: 'audio',
        source: null,
        filename: `recording-${timestamp}.wav`,
        mimeType: 'audio/wav',
        blob: audioBlob,
        duration,
        noteData: null,
      })

      resetRecording()
      onSaved?.()
    } catch {
      // addMediaToIdea already logs the error
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={cn(
        embedded ? 'space-y-4' : 'space-y-4 rounded-lg border p-4',
        className,
      )}
    >
      {!embedded ? (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Record Audio</h3>
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      ) : error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}

      {isRecording ? (
        <WaveformCanvas analyser={analyser} isLive />
      ) : audioBlob ? (
        <AudioPlayer blob={audioBlob} />
      ) : (
        <div className="flex h-20 items-center justify-center rounded-md bg-muted/40 text-sm text-muted-foreground">
          Tap record to capture audio from your microphone.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!isRecording && !audioBlob ? (
          <Button
            type="button"
            size="lg"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={() => void startRecording()}
          >
            <Mic className="size-5" />
            Record
          </Button>
        ) : null}

        {isRecording ? (
          <Button
            type="button"
            size="lg"
            variant="destructive"
            onClick={stopRecording}
          >
            <Square className="size-4 fill-current" />
            Stop
          </Button>
        ) : null}

        {audioBlob && !isRecording && !draft ? (
          <>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Audio'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetRecording}
              disabled={isSaving}
            >
              Discard
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
