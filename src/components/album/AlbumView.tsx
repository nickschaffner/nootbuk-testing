import { AlbumHeader } from '@/components/album/AlbumHeader'
import { AlbumSidebar } from '@/components/album/AlbumSidebar'
import { AlbumTrackList } from '@/components/album/AlbumTrackList'
import { useAlbum } from '@/hooks/useAlbums'
import { useAlbumSongs } from '@/hooks/useAlbumSongs'

interface AlbumViewProps {
  albumId: string
}

export function AlbumView({ albumId }: AlbumViewProps) {
  const album = useAlbum(albumId)
  const tracks = useAlbumSongs(albumId)

  if (album === undefined || tracks === undefined) {
    return <p className="text-sm text-muted-foreground">Loading album...</p>
  }

  if (!album) {
    return <p className="text-sm text-muted-foreground">Album not found.</p>
  }

  return (
    <div className="space-y-6">
      <AlbumHeader album={album} />

      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <AlbumTrackList albumId={albumId} tracks={tracks} />
        </div>

        <AlbumSidebar album={album} />
      </div>
    </div>
  )
}
