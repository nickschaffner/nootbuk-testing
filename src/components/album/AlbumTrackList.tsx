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
import { reorderSongsInAlbum } from '@/hooks/useSongs'
import { albumTrackSortableId } from '@/lib/dnd-ids'
import type { Song } from '@/types/song'

interface AlbumTrackListProps {
  albumId: string
  songs: Song[]
}

export function AlbumTrackList({ albumId, songs }: AlbumTrackListProps) {
  const [addOpen, setAddOpen] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const sortableIds = useMemo(
    () => songs.map((song) => albumTrackSortableId(song.id)),
    [songs],
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    const songIds = songs.map((song) => song.id)
    const oldIndex = sortableIds.indexOf(activeId)
    const newIndex = sortableIds.indexOf(overId)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    try {
      await reorderSongsInAlbum(arrayMove(songIds, oldIndex, newIndex))
    } catch {
      // reorderSongsInAlbum already logs the error
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

        {songs.length === 0 ? (
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
                {songs.map((song, index) => (
                  <SortableTrackRow
                    key={song.id}
                    song={song}
                    trackNumber={index + 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AddSongToAlbumSheet
        albumId={albumId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </>
  )
}
