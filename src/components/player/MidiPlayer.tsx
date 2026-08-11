import { Pause, Play } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSynth } from '@/hooks/useSynth'
import { formatAudioTime } from '@/lib/audio'
import { midiToNoteName } from '@/lib/notes'
import { getMidiDuration } from '@/lib/midi'
import type { NoteEvent } from '@/types/idea'
import type { PlaybackPatchId } from '@/lib/instrument-utils'

interface MidiPlayerProps {
  notes: NoteEvent[]
  patchId?: PlaybackPatchId
  className?: string
}

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
      <p className="text-sm text-muted-foreground">
        No notes recorded yet.
      </p>
    )
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {notes.length} notes · {formatAudioTime(duration)}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => void handlePlay()}>
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
      </div>

      <ScrollArea className="h-40 rounded-md border">
        <div className="space-y-1 p-3">
          {notes.map((note, index) => (
            <div
              key={`${note.pitch}-${note.startTime}-${index}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{midiToNoteName(note.pitch)}</Badge>
                <span className="text-muted-foreground">vel {note.velocity}</span>
              </div>
              <span className="tabular-nums text-muted-foreground">
                {formatAudioTime(note.startTime)} · {note.duration.toFixed(2)}s
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
