import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { addSongToAlbum } from '@/hooks/useAlbumSongs'
import { createSong, useAllSongs } from '@/hooks/useSongs'

interface AddSongToAlbumSheetProps {
  albumId: string
  existingSongIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSongToAlbumSheet({
  albumId,
  existingSongIds,
  open,
  onOpenChange,
}: AddSongToAlbumSheetProps) {
  const allSongs = useAllSongs()
  const [isCreating, setIsCreating] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const availableSongs = useMemo(
    () => (allSongs ?? []).filter((song) => !existingSongIds.includes(song.id)),
    [allSongs, existingSongIds],
  )

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return availableSongs
    }

    return availableSongs.filter((song) =>
      song.title.toLowerCase().includes(query),
    )
  }, [availableSongs, search])

  async function handleCreateNew() {
    setIsCreating(true)
    try {
      const song = await createSong({
        title: 'Untitled Song',
        key: null,
        tempo: null,
        timeSignature: null,
        status: 'sketch',
        genre: null,
        lyrics: null,
        songwriter: null,
        publisher: null,
        ipiNumber: null,
        masterEngineer: null,
        copyright: null,
        sampleCredits: null,
      })
      await addSongToAlbum(albumId, song.id)
      onOpenChange(false)
    } catch {
      // createSong already logs the error
    } finally {
      setIsCreating(false)
    }
  }

  async function handleAddExisting(songId: string) {
    setAddingId(songId)
    try {
      await addSongToAlbum(albumId, songId)
      onOpenChange(false)
    } catch {
      // addSongToAlbum already logs the error
    } finally {
      setAddingId(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Song to Album</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-1 py-4">
          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={isCreating}
              onClick={() => void handleCreateNew()}
            >
              {isCreating ? 'Creating...' : 'Create New Song'}
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Add Existing Song</p>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search songs..."
            />
            {allSongs === undefined ? (
              <p className="text-sm text-muted-foreground">Loading songs...</p>
            ) : availableSongs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No songs available to add.
              </p>
            ) : filteredSongs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No songs match your search.
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredSongs.map((song) => (
                  <li
                    key={song.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{song.title}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={addingId === song.id}
                      onClick={() => void handleAddExisting(song.id)}
                    >
                      {addingId === song.id ? 'Adding...' : 'Add'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
