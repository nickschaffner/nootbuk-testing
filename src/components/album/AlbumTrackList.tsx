import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AddSongToAlbumSheet } from '@/components/album/AddSongToAlbumSheet'
import { SortableTrackRow } from '@/components/album/SortableTrackRow'
import { Button } from '@/components/ui/button'
import { reorderTracks, type getSongsForAlbum } from '@/hooks/useAlbumSongs'
import { usePlaybackVersionsIndex } from '@/hooks/useSongVersions'
import { albumTrackSortableId } from '@/lib/dnd-ids'

type AlbumTrackEntry = Awaited<ReturnType<typeof getSongsForAlbum>>[number]

interface AlbumTrackListProps {
  albumId: string
  tracks: AlbumTrackEntry[]
}

export function AlbumTrackList({ albumId, tracks }: AlbumTrackListProps) {
  const [addOpen, setAddOpen] = useState(false)
  const playbackVersions = usePlaybackVersionsIndex()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const sortableIds = useMemo(
    () => tracks.map((t) => albumTrackSortableId(t.songId)),
    [tracks],
  )

  const existingSongIds = useMemo(
    () => tracks.map((t) => t.songId),
    [tracks],
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    const oldIndex = sortableIds.indexOf(activeId)
    const newIndex = sortableIds.indexOf(overId)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const songIds = tracks.map((t) => t.songId)
    try {
      await reorderTracks(albumId, arrayMove(songIds, oldIndex, newIndex))
    } catch {
      // reorderTracks already logs the error
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Track Listing</h2>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add Song
          </Button>
        </div>

        {tracks.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No songs on this album yet. Add a song to build the track listing.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => void handleDragEnd(event)}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <SortableTrackRow
                    key={track.songId}
                    albumId={albumId}
                    song={track.song}
                    trackNumber={index + 1}
                    playbackVersion={playbackVersions?.[track.songId]}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AddSongToAlbumSheet
        albumId={albumId}
        existingSongIds={existingSongIds}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </>
  )
}
