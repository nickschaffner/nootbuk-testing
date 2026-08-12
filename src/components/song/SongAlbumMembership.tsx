import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
  addSongToAlbum,
  useAlbumsWithTitlesForSong,
} from '@/hooks/useAlbumSongs'
import { useAllAlbums } from '@/hooks/useAlbums'

interface SongAlbumMembershipProps {
  songId: string
}

export function SongAlbumMembership({ songId }: SongAlbumMembershipProps) {
  const memberships = useAlbumsWithTitlesForSong(songId)
  const allAlbums = useAllAlbums()

  const memberAlbumIds = new Set(
    (memberships ?? []).map((membership) => membership.albumId),
  )

  const availableAlbums = (allAlbums ?? []).filter(
    (album) => !memberAlbumIds.has(album.id),
  )

  async function handleAddToAlbum(albumId: string) {
    try {
      await addSongToAlbum(albumId, songId)
    } catch {
      // addSongToAlbum already logs the error
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Albums</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={availableAlbums.length === 0}
            >
              Add to Album
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableAlbums.map((album) => (
              <DropdownMenuItem
                key={album.id}
                onClick={() => void handleAddToAlbum(album.id)}
              >
                {album.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {memberships === undefined ? (
        <p className="text-sm text-muted-foreground">Loading albums...</p>
      ) : memberships.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This song is not on any albums yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {memberships.map((membership) => (
            <li key={membership.id}>
              <Link
                to={`/album/${membership.albumId}`}
                className="block rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
              >
                {membership.album.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
