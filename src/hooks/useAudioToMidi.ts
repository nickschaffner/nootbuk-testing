import { useCallback, useState } from 'react'

import {
  convertAudioBlobToNoteEvents,
  loadBasicPitchModel,
} from '@/lib/audio-to-midi'
import type { NoteEvent } from '@/types/idea'

export function useAudioToMidi() {
  const [isLoading, setIsLoading] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<NoteEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setProgress(0)
    setResult(null)
    setError(null)
    setIsLoading(false)
    setIsConverting(false)
  }, [])

  const convert = useCallback(async (audioBlob: Blob): Promise<NoteEvent[]> => {
    setError(null)
    setResult(null)
    setProgress(0)
    setIsLoading(true)

    try {
      await loadBasicPitchModel()
      setIsLoading(false)
      setIsConverting(true)

      const notes = await convertAudioBlobToNoteEvents(audioBlob, setProgress)
      setResult(notes)
      return notes
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Audio-to-MIDI conversion failed.'
      console.warn('useAudioToMidi convert failed:', caughtError)
      setError(message)
      throw caughtError
    } finally {
      setIsLoading(false)
      setIsConverting(false)
    }
  }, [])

  return {
    convert,
    reset,
    isLoading,
    isConverting,
    progress,
    result,
    error,
  }
}
