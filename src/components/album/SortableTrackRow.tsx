import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AudioPlayButton } from '@/components/player/AudioPlayButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { removeSongFromAlbum } from '@/hooks/useAlbumSongs'
import { albumTrackSortableId } from '@/lib/dnd-ids'
import { cn } from '@/lib/utils'
import type { Song, SongStatus, SongVersion } from '@/types/song'

function formatSongStatus(status: SongStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

interface SortableTrackRowProps {
  albumId: string
  song: Song
  trackNumber: number
  playbackVersion?: SongVersion
}

export function SortableTrackRow({
  albumId,
  song,
  trackNumber,
  playbackVersion,
}: SortableTrackRowProps) {
  const navigate = useNavigate()
  const [isRemoving, setIsRemoving] = useState(false)
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

  async function handleRemove(event: React.MouseEvent) {
    event.stopPropagation()
    setIsRemoving(true)
    try {
      await removeSongFromAlbum(albumId, song.id)
    } catch {
      // removeSongFromAlbum already logs the error
    } finally {
      setIsRemoving(false)
    }
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

      {playbackVersion ? (
        <AudioPlayButton blob={playbackVersion.blob} />
      ) : (
        <div className="size-8 shrink-0" />
      )}

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

      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        disabled={isRemoving}
        onClick={(event) => void handleRemove(event)}
        aria-label={`Remove ${song.title} from album`}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
