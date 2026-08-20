import { Loader2, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { FoldedPianoRoll } from '@/components/capture/note-picker/FoldedPianoRoll'
import { Button } from '@/components/kit/Button'
import { MonoLabel } from '@/components/kit/Field'
import { useAudioToMidi } from '@/hooks/useAudioToMidi'
import { useSynth } from '@/hooks/useSynth'
import { getMidiDuration } from '@/lib/midi'
import type { PlaybackPatchId } from '@/lib/instrument-utils'
import {
  barCountForBlocks,
  noteEventsToTimelineBlocks,
} from '@/lib/timeline-notes'
import type { NoteEvent } from '@/types/idea'

interface ExtractMidiSlots {
  trigger: ReactNode
  preview: ReactNode | null
  error: ReactNode | null
}

interface ExtractMidiFromAudioProps {
  audioBlob: Blob
  onConfirm: (notes: NoteEvent[]) => void | Promise<void>
  confirmLabel?: string
  children?: (slots: ExtractMidiSlots) => ReactNode
}

function ExtractMidiTrigger({
  busy,
  label,
  onClick,
}: {
  busy: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="focusable inline-flex items-center rounded-xs border border-hairline px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="mr-1 inline animate-spin" size={12} aria-hidden />
      ) : null}
      {label}
    </button>
  )
}

function ExtractMidiPreview({
  notes,
  bpm,
  beatsPerBar,
  barCount,
  patchId,
  confirmLabel,
  isSaving,
  onConfirm,
  onDiscard,
}: {
  notes: NoteEvent[]
  bpm: number
  beatsPerBar: number
  barCount: number
  patchId: PlaybackPatchId
  confirmLabel: string
  isSaving: boolean
  onConfirm: () => void
  onDiscard: () => void
}) {
  const { playNoteSequence, stopAll } = useSynth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadBeat, setPlayheadBeat] = useState(0)
  const playOriginMsRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const durationBeats = Math.max(getMidiDuration(notes) * (bpm / 60), 0.001)

  function stopPlayheadWatch() {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    playOriginMsRef.current = null
  }

  function tickPlayhead() {
    const origin = playOriginMsRef.current
    if (origin === null) {
      rafRef.current = null
      return
    }
    const elapsedSec = (performance.now() - origin) / 1000
    setPlayheadBeat((elapsedSec * (bpm / 60)) % durationBeats)
    rafRef.current = window.requestAnimationFrame(tickPlayhead)
  }

  function startPlayheadWatch() {
    stopPlayheadWatch()
    playOriginMsRef.current = performance.now()
    setPlayheadBeat(0)
    rafRef.current = window.requestAnimationFrame(tickPlayhead)
  }

  useEffect(() => {
    return () => {
      stopPlayheadWatch()
      void stopAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, [])

  async function handlePlayToggle() {
    if (isPlaying) {
      await stopAll()
      stopPlayheadWatch()
      setIsPlaying(false)
      setPlayheadBeat(0)
      return
    }

    setIsPlaying(true)
    startPlayheadWatch()
    void playNoteSequence(notes, patchId).finally(() => {
      stopPlayheadWatch()
      setIsPlaying(false)
      setPlayheadBeat(0)
    })
  }

  async function handleDiscard() {
    if (isPlaying) {
      await stopAll()
      stopPlayheadWatch()
      setIsPlaying(false)
      setPlayheadBeat(0)
    }
    onDiscard()
  }

  return (
    <div className="space-y-3 border-t border-hairline px-3 py-3">
      <MonoLabel className="text-primary">Extracted MIDI</MonoLabel>
      <FoldedPianoRoll
        noteEvents={notes}
        bpm={bpm}
        beatsPerBar={beatsPerBar}
        barCount={barCount}
        gridBeat={0.25}
        playheadBeat={playheadBeat}
        title="Extracted MIDI"
        emptyMessage="No notes extracted"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
          onClick={() => void handlePlayToggle()}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            disabled={isSaving || notes.length === 0}
            onClick={onConfirm}
          >
            {isSaving ? 'Saving…' : confirmLabel}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isSaving}
            onClick={() => void handleDiscard()}
          >
            Discard
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ExtractMidiFromAudio({
  audioBlob,
  onConfirm,
  confirmLabel = 'Use This',
  children,
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
  const beatsPerBar = 4
  const bpm = 120
  const previewBlocks = result
    ? noteEventsToTimelineBlocks(result, bpm)
    : []
  const barCount = Math.max(
    1,
    barCountForBlocks(previewBlocks, beatsPerBar, 1),
  )

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

  const triggerLabel = isLoading
    ? 'Loading…'
    : isConverting
      ? `${Math.round(progress * 100)}%`
      : 'Extract MIDI'

  const trigger = (
    <ExtractMidiTrigger
      busy={isBusy}
      label={triggerLabel}
      onClick={() => void handleExtract()}
    />
  )

  const errorNode =
    error || saveError ? (
      <p className="px-3 pb-2 text-xs text-destructive">{error ?? saveError}</p>
    ) : null

  const preview = showPreview ? (
    <ExtractMidiPreview
      notes={result}
      bpm={bpm}
      beatsPerBar={beatsPerBar}
      barCount={barCount}
      patchId={previewPatch}
      confirmLabel={confirmLabel}
      isSaving={isSaving}
      onConfirm={() => void handleConfirm()}
      onDiscard={reset}
    />
  ) : null

  if (children) {
    return (
      <>
        {children({
          trigger: showPreview ? null : trigger,
          preview,
          error: errorNode,
        })}
      </>
    )
  }

  return (
    <div className="space-y-3">
      {!showPreview ? trigger : null}
      {errorNode}
      {preview}
    </div>
  )
}
