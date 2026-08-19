import { AudioLines, Mic, Music2, Pause, Wand2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useIdeaPlaybackPatch } from '@/hooks/useIdeaPlaybackPatch'
import { useMediaForIdea } from '@/hooks/useMedia'
import { useSynth } from '@/hooks/useSynth'
import { inferIdeaMediaSource } from '@/lib/idea-media-source'
import type { Idea, NoteEvent } from '@/types/idea'
import type { PlaybackPatchId } from '@/lib/instrument-utils'

interface IdeaMediaQuickPlayProps {
  ideaId: string
  idea?: Idea
}

export function IdeaMediaQuickPlay({ ideaId, idea }: IdeaMediaQuickPlayProps) {
  const media = useMediaForIdea(ideaId)
  const playbackPatch = useIdeaPlaybackPatch(idea)
  const audioItem = media?.find((item) => item.type === 'audio')
  const midiItems =
    media?.filter(
      (item) =>
        item.type === 'midi' && item.noteData && item.noteData.length > 0,
    ) ?? []

  const stepInput = midiItems.find(
    (item) => inferIdeaMediaSource(item) === 'step-input',
  )
  const recording = midiItems.find(
    (item) => inferIdeaMediaSource(item) === 'midi-recording',
  )
  const extraction = midiItems.find(
    (item) => inferIdeaMediaSource(item) === 'midi-extraction',
  )

  if (!audioItem && !stepInput && !recording && !extraction) {
    return null
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {stepInput?.noteData ? (
        <CompactMidiPlay
          notes={stepInput.noteData}
          patchId={playbackPatch}
          icon="notepicker"
          label="Play Note Picker"
        />
      ) : null}
      {recording?.noteData ? (
        <CompactMidiPlay
          notes={recording.noteData}
          patchId={playbackPatch}
          icon="recording"
          label="Play MIDI Record"
        />
      ) : null}
      {extraction?.noteData ? (
        <CompactMidiPlay
          notes={extraction.noteData}
          patchId={playbackPatch}
          icon="extraction"
          label="Play Extracted MIDI"
        />
      ) : null}
      {audioItem ? <CompactAudioPlay blob={audioItem.blob} /> : null}
    </div>
  )
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
    source.loop = true
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
      {isPlaying ? <Pause className="size-3.5" /> : <Mic className="size-3.5" />}
      <span className="sr-only">{isPlaying ? 'Stop audio' : 'Play audio'}</span>
    </Button>
  )
}

function CompactMidiPlay({
  notes,
  patchId,
  icon,
  label,
}: {
  notes: NoteEvent[]
  patchId: PlaybackPatchId
  icon: 'notepicker' | 'recording' | 'extraction'
  label: string
}) {
  const { playNoteSequence, stopAll } = useSynth()
  const [isPlaying, setIsPlaying] = useState(false)

  async function togglePlayback(event: React.MouseEvent) {
    event.stopPropagation()

    if (isPlaying) {
      await stopAll()
      setIsPlaying(false)
      return
    }

    setIsPlaying(true)
    void playNoteSequence(notes, patchId).finally(() => {
      setIsPlaying(false)
    })
  }

  const Icon =
    icon === 'recording' ? AudioLines : icon === 'extraction' ? Wand2 : Music2

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="size-7 shrink-0"
      onClick={(event) => void togglePlayback(event)}
    >
      {isPlaying ? <Pause className="size-3.5" /> : <Icon className="size-3.5" />}
      <span className="sr-only">{isPlaying ? `Stop ${label}` : label}</span>
    </Button>
  )
}
