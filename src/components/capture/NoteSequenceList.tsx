import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { getSequenceNoteLabel } from '@/lib/sequence-playback'
import { cn } from '@/lib/utils'
import type { SequenceNote } from '@/types/idea'

interface SortableNoteBadgeProps {
  id: string
  note: SequenceNote
  onRemove: () => void
}

function SortableNoteBadge({ id, note, onRemove }: SortableNoteBadgeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 rounded-full border bg-card px-2 py-1',
        isDragging && 'z-10 opacity-60',
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" />
      </button>
      <Badge variant="secondary">{getSequenceNoteLabel(note)}</Badge>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground"
        onClick={onRemove}
      >
        <X className="size-3" />
      </button>
    </div>
  )
}

interface NoteSequenceListProps {
  notes: SequenceNote[]
  onChange: (notes: SequenceNote[]) => void
}

export function NoteSequenceList({ notes, onChange }: NoteSequenceListProps) {
  const itemIds = notes.map((_, index) => `note-${index}`)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = itemIds.indexOf(String(active.id))
    const newIndex = itemIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    onChange(arrayMove(notes, oldIndex, newIndex))
  }

  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No notes in the sequence yet.
      </p>
    )
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
        <div className="flex flex-wrap gap-2">
          {notes.map((note, index) => (
            <SortableNoteBadge
              key={itemIds[index]}
              id={itemIds[index]}
              note={note}
              onRemove={() =>
                onChange(notes.filter((_, noteIndex) => noteIndex !== index))
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
