import { Pause, Play } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useSynth } from '@/hooks/useSynth'
import { formatAudioTime } from '@/lib/audio'
import { getMidiDuration } from '@/lib/midi'
import type { NoteEvent } from '@/types/idea'
import type { PlaybackPatchId } from '@/lib/instrument-utils'
import { cn } from '@/lib/utils'

interface MidiPlayerProps {
  notes: NoteEvent[]
  patchId?: PlaybackPatchId
  className?: string
}

/** Compact play controls only — no note list (folded piano roll is the display). */
export function MidiPlayer({ notes, patchId, className }: MidiPlayerProps) {
  const { playNoteSequence, stopAll } = useSynth()
  const [isPlaying, setIsPlaying] = useState(false)

  const duration = useMemo(() => getMidiDuration(notes), [notes])

  async function handlePlay() {
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

  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No notes recorded yet.</p>
    )
  }

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <p className="text-xs text-muted-foreground">
        {notes.length} notes · {formatAudioTime(duration)}
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void handlePlay()}
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        {isPlaying ? 'Stop' : 'Play'}
      </Button>
    </div>
  )
}
