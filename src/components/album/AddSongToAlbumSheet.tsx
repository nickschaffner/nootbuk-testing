import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  assignSongToAlbum,
  createSong,
  useAllSongs,
} from '@/hooks/useSongs'

interface AddSongToAlbumSheetProps {
  albumId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSongToAlbumSheet({
  albumId,
  open,
  onOpenChange,
}: AddSongToAlbumSheetProps) {
  const allSongs = useAllSongs()
  const [isCreating, setIsCreating] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  const availableSongs = useMemo(
    () => (allSongs ?? []).filter((song) => song.albumId !== albumId),
    [allSongs, albumId],
  )

  async function handleCreateNew() {
    setIsCreating(true)
    try {
      await createSong({
        title: 'Untitled Song',
        albumId,
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
      await assignSongToAlbum(songId, albumId)
      onOpenChange(false)
    } catch {
      // assignSongToAlbum already logs the error
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
            {allSongs === undefined ? (
              <p className="text-sm text-muted-foreground">Loading songs...</p>
            ) : availableSongs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All songs are already on this album.
              </p>
            ) : (
              <ul className="space-y-2">
                {availableSongs.map((song) => (
                  <li
                    key={song.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{song.title}</p>
                      {song.albumId ? (
                        <p className="text-xs text-muted-foreground">
                          On another album
                        </p>
                      ) : null}
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
