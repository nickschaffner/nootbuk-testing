import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { IdeaMediaQuickPlay } from '@/components/song/IdeaMediaQuickPlay'
import { NoteSequencePlayer } from '@/components/player/NoteSequencePlayer'
import { Badge } from '@/components/ui/badge'
import { useNoteSequencesForIdea } from '@/hooks/useNoteSequences'
import { ideaSortableId } from '@/lib/dnd-ids'
import { formatRoleLabel, getIdeaDisplayLabel } from '@/lib/idea-label'
import { cn } from '@/lib/utils'
import type { Idea } from '@/types/idea'

interface SortableIdeaCardProps {
  idea: Idea
  onClick: () => void
}

export function SortableIdeaCard({ idea, onClick }: SortableIdeaCardProps) {
  const sequences = useNoteSequencesForIdea(idea.id)
  const firstSequence = sequences?.[0]

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ideaSortableId(idea.id),
    data: { type: 'idea', ideaId: idea.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-card p-2 shadow-sm',
        isDragging && 'z-10 opacity-60',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <IdeaMediaQuickPlay ideaId={idea.id} />

      {firstSequence ? (
        <NoteSequencePlayer sequence={firstSequence} compact />
      ) : null}

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={onClick}
      >
        <Badge variant="secondary" className="shrink-0">
          {formatRoleLabel(idea.role)}
        </Badge>
        <span className="truncate text-sm">{getIdeaDisplayLabel(idea)}</span>
        {sequences && sequences.length > 1 ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            +{sequences.length - 1} seq
          </span>
        ) : null}
      </button>
    </div>
  )
}
