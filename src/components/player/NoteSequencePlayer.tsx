import { Pause, Play } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useSynth } from '@/hooks/useSynth'
import { durationToSeconds, sequenceNotesToNoteEvents } from '@/lib/sequence-playback'
import { SYNTH_PATCHES, type SynthPatchId } from '@/lib/synth-patches'
import type { IdeaNoteSequence } from '@/types/idea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NoteSequencePlayerProps {
  sequence: IdeaNoteSequence
  patchId?: SynthPatchId
  compact?: boolean
  bpm?: number
}

export function NoteSequencePlayer({
  sequence,
  patchId = 'piano',
  compact = false,
  bpm = 120,
}: NoteSequencePlayerProps) {
  const { playNoteSequence, stopAll } = useSynth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedPatch, setSelectedPatch] = useState(patchId)

  const duration = useMemo(() => {
    return sequence.notes.reduce(
      (total, note) => total + durationToSeconds(note.duration, bpm),
      0,
    )
  }, [bpm, sequence.notes])

  async function handlePlay() {
    if (isPlaying) {
      await stopAll()
      setIsPlaying(false)
      return
    }

    const events = sequenceNotesToNoteEvents(sequence.notes, bpm)
    setIsPlaying(true)
    await playNoteSequence(events, selectedPatch)
    window.setTimeout(() => setIsPlaying(false), duration * 1000 + 100)
  }

  if (compact) {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-7"
        onClick={(event) => {
          event.stopPropagation()
          void handlePlay()
        }}
      >
        {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        <span className="sr-only">Play note sequence</span>
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => void handlePlay()}>
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        {isPlaying ? 'Stop' : 'Play'}
      </Button>

      <Select
        value={selectedPatch}
        onValueChange={(value) => setSelectedPatch(value as SynthPatchId)}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SYNTH_PATCHES.map((patch) => (
            <SelectItem key={patch.id} value={patch.id}>
              {patch.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground">
        {sequence.notes.length} notes
      </span>
    </div>
  )
}
