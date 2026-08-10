import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { SectionContainer } from '@/components/song/SectionContainer'
import { sectionContainerId, sortableSectionId } from '@/lib/dnd-ids'
import { cn } from '@/lib/utils'
import type { Idea } from '@/types/idea'
import type { SongSection } from '@/types/song'

interface SortableSectionProps {
  section: SongSection
  ideas: Idea[]
  onTitleChange: (sectionId: string, name: string) => void
  onLyricsChange: (sectionId: string, lyrics: string) => void
  onAddIdea: (sectionId: string, label: string) => void
  onIdeaClick: (ideaId: string) => void
}

export function SortableSection({
  section,
  ideas,
  onTitleChange,
  onLyricsChange,
  onAddIdea,
  onIdeaClick,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableSectionId(section.id),
    data: { type: 'section', sectionId: section.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'z-10 opacity-60')}
    >
      <SectionContainer
        containerId={sectionContainerId(section.id)}
        title={section.name}
        lyrics={section.lyrics}
        ideas={ideas}
        editableTitle
        onTitleChange={(name) => onTitleChange(section.id, name)}
        onLyricsChange={(lyrics) => onLyricsChange(section.id, lyrics)}
        dragHandleProps={{ ...attributes, ...listeners }}
        onAddIdea={() => onAddIdea(section.id, section.name)}
        onIdeaClick={onIdeaClick}
      />
    </div>
  )
}
