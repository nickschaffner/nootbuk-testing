import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ChevronDown, GripVertical, Plus } from 'lucide-react'
import { useEffect, useState, type HTMLAttributes } from 'react'

import { SortableIdeaCard } from '@/components/song/SortableIdeaCard'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ideaSortableId } from '@/lib/dnd-ids'
import { cn } from '@/lib/utils'
import type { Idea } from '@/types/idea'

interface SectionContainerProps {
  containerId: string
  title: string
  ideas: Idea[]
  lyrics?: string | null
  editableTitle?: boolean
  onTitleChange?: (name: string) => void
  onLyricsChange?: (lyrics: string) => void
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
  onAddIdea: () => void
  onIdeaClick: (ideaId: string) => void
  isUnassigned?: boolean
}

export function SectionContainer({
  containerId,
  title,
  ideas,
  lyrics = null,
  editableTitle = false,
  onTitleChange,
  onLyricsChange,
  dragHandleProps,
  onAddIdea,
  onIdeaClick,
  isUnassigned = false,
}: SectionContainerProps) {
  const [open, setOpen] = useState(true)
  const [localTitle, setLocalTitle] = useState(title)
  const [localLyrics, setLocalLyrics] = useState(lyrics ?? '')

  useEffect(() => {
    setLocalTitle(title)
  }, [title])

  useEffect(() => {
    setLocalLyrics(lyrics ?? '')
  }, [lyrics])

  const { setNodeRef, isOver } = useDroppable({
    id: containerId,
    data: { type: 'container', containerId },
  })

  const ideaIds = ideas.map((idea) => ideaSortableId(idea.id))

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'rounded-lg border bg-card transition-colors',
          isOver && 'border-primary/50 bg-primary/5 ring-2 ring-primary/20',
        )}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {dragHandleProps ? (
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              {...dragHandleProps}
            >
              <GripVertical className="size-4" />
            </button>
          ) : null}

          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  'size-4 transition-transform',
                  !open && '-rotate-90',
                )}
              />
            </button>
          </CollapsibleTrigger>

          {editableTitle && onTitleChange ? (
            <Input
              value={localTitle}
              onChange={(event) => setLocalTitle(event.target.value)}
              onBlur={() => {
                const trimmed = localTitle.trim()
                if (trimmed && trimmed !== title) {
                  onTitleChange(trimmed)
                }
              }}
              className="h-8 flex-1 border-none bg-transparent px-1 font-medium shadow-none focus-visible:ring-0"
            />
          ) : (
            <span className="flex-1 font-medium">{title}</span>
          )}

          <span className="text-xs text-muted-foreground">{ideas.length}</span>

          <Button size="sm" variant="ghost" onClick={onAddIdea}>
            <Plus className="size-4" />
            <span className="sr-only">Add idea</span>
          </Button>
        </div>

        <CollapsibleContent>
          {!isUnassigned && onLyricsChange ? (
            <div className="space-y-2 border-b px-3 py-3">
              <Label htmlFor={`section-lyrics-${containerId}`} className="text-xs">
                Section lyrics
              </Label>
              <Textarea
                id={`section-lyrics-${containerId}`}
                value={localLyrics}
                onChange={(event) => setLocalLyrics(event.target.value)}
                onBlur={() => {
                  if (localLyrics !== (lyrics ?? '')) {
                    onLyricsChange(localLyrics)
                  }
                }}
                placeholder="Lyrics for this section..."
                rows={3}
                className="resize-y text-sm"
              />
            </div>
          ) : null}

          <div
            ref={setNodeRef}
            className={cn(
              'min-h-16 space-y-2 p-3',
              isUnassigned && ideas.length === 0 && 'text-sm text-muted-foreground',
            )}
          >
            {ideas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isUnassigned
                  ? 'Ideas in this song but not in a section yet.'
                  : 'Drop ideas here or add one.'}
              </p>
            ) : null}

            <SortableContext items={ideaIds} strategy={verticalListSortingStrategy}>
              {ideas.map((idea) => (
                <SortableIdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => onIdeaClick(idea.id)}
                />
              ))}
            </SortableContext>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
