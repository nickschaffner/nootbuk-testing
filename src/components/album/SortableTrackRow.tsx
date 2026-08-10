import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { albumTrackSortableId } from '@/lib/dnd-ids'
import { cn } from '@/lib/utils'
import type { Song, SongStatus } from '@/types/song'

function formatSongStatus(status: SongStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

interface SortableTrackRowProps {
  song: Song
  trackNumber: number
}

export function SortableTrackRow({ song, trackNumber }: SortableTrackRowProps) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: albumTrackSortableId(song.id),
    data: { type: 'album-track', songId: song.id },
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
        'flex items-center gap-2 rounded-md border bg-card px-2 py-2 shadow-sm',
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

      <span className="w-6 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
        {trackNumber}
      </span>

      <button
        type="button"
        className="grid min-w-0 flex-1 grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-left"
        onClick={() => navigate(`/song/${song.id}`)}
      >
        <span className="truncate text-sm font-medium">{song.title}</span>
        <Badge variant="outline" className="shrink-0 capitalize">
          {formatSongStatus(song.status)}
        </Badge>
        <span className="w-12 shrink-0 text-sm text-muted-foreground">
          {song.key ?? '—'}
        </span>
        <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {song.tempo ?? '—'}
        </span>
      </button>
    </div>
  )
}
