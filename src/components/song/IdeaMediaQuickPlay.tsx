import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useMediaForIdea } from '@/hooks/useMedia'
import { useSynth } from '@/hooks/useSynth'
import { getMidiDuration } from '@/lib/midi'

interface IdeaMediaQuickPlayProps {
  ideaId: string
}

export function IdeaMediaQuickPlay({ ideaId }: IdeaMediaQuickPlayProps) {
  const media = useMediaForIdea(ideaId)
  const audioItem = media?.find((item) => item.type === 'audio')
  const midiItem = media?.find(
    (item) => item.type === 'midi' && item.noteData && item.noteData.length > 0,
  )

  if (audioItem) {
    return <CompactAudioPlay blob={audioItem.blob} />
  }

  if (midiItem?.noteData) {
    return <CompactMidiPlay notes={midiItem.noteData} />
  }

  return null
}

function CompactAudioPlay({ blob }: { blob: Blob }) {
  const contextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const context = new AudioContext()
    contextRef.current = context

    void (async () => {
      try {
        const audioBuffer = await context.decodeAudioData(await blob.arrayBuffer())
        if (!cancelled) {
          bufferRef.current = audioBuffer
          setIsReady(true)
        }
      } catch {
        if (!cancelled) {
          setIsReady(false)
        }
      }
    })()

    return () => {
      cancelled = true
      try {
        sourceRef.current?.stop()
      } catch {
        // Source may already be stopped.
      }
      sourceRef.current?.disconnect()
      void context.close()
    }
  }, [blob])

  async function togglePlayback(event: React.MouseEvent) {
    event.stopPropagation()

    const context = contextRef.current
    const buffer = bufferRef.current
    if (!context || !buffer) {
      return
    }

    if (isPlaying) {
      try {
        sourceRef.current?.stop()
      } catch {
        // Source may already be stopped.
      }
      sourceRef.current?.disconnect()
      sourceRef.current = null
      setIsPlaying(false)
      return
    }

    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)
    source.onended = () => {
      setIsPlaying(false)
      sourceRef.current = null
    }

    await context.resume()
    source.start(0)
    sourceRef.current = source
    setIsPlaying(true)
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="size-7 shrink-0"
      disabled={!isReady}
      onClick={(event) => void togglePlayback(event)}
    >
      {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      <span className="sr-only">Play audio</span>
    </Button>
  )
}

function CompactMidiPlay({ notes }: { notes: NonNullable<import('@/types/idea').NoteEvent[]> }) {
  const { playNoteSequence, stopAll } = useSynth()
  const [isPlaying, setIsPlaying] = useState(false)
  const duration = getMidiDuration(notes)

  async function togglePlayback(event: React.MouseEvent) {
    event.stopPropagation()

    if (isPlaying) {
      await stopAll()
      setIsPlaying(false)
      return
    }

    setIsPlaying(true)
    await playNoteSequence(notes, 'piano')
    window.setTimeout(() => setIsPlaying(false), duration * 1000 + 100)
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="size-7 shrink-0"
      onClick={(event) => void togglePlayback(event)}
    >
      {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      <span className="sr-only">Play MIDI</span>
    </Button>
  )
}
