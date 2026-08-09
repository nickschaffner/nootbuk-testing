import { Trash2 } from 'lucide-react'

import { NotePicker } from '@/components/capture/NotePicker'
import { NoteSequencePlayer } from '@/components/player/NoteSequencePlayer'
import { Button } from '@/components/ui/button'
import {
  deleteNoteSequence,
  useNoteSequencesForIdea,
} from '@/hooks/useNoteSequences'
import { getSequenceNoteLabel } from '@/lib/sequence-playback'

interface IdeaNoteSequencesSectionProps {
  ideaId: string
}

export function IdeaNoteSequencesSection({ ideaId }: IdeaNoteSequencesSectionProps) {
  const sequences = useNoteSequencesForIdea(ideaId)

  async function handleDelete(sequenceId: string) {
    try {
      await deleteNoteSequence(sequenceId)
    } catch {
      // deleteNoteSequence already logs the error
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Note Sequences</h3>
        <p className="text-xs text-muted-foreground">
          Build melodies and chords manually, then save them to this idea.
        </p>
      </div>

      {(sequences ?? []).map((sequence) => (
        <div key={sequence.id} className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {sequence.label || 'Untitled sequence'}
              </p>
              <p className="text-xs text-muted-foreground">
                {sequence.notes.length} notes
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => void handleDelete(sequence.id)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Delete sequence</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {sequence.notes.map((note, index) => (
              <span
                key={`${sequence.id}-${index}`}
                className="rounded-full border bg-muted px-2 py-0.5 text-xs"
              >
                {getSequenceNoteLabel(note)}
              </span>
            ))}
          </div>

          <NoteSequencePlayer sequence={sequence} />
        </div>
      ))}

      <NotePicker ideaId={ideaId} />
    </div>
  )
}
