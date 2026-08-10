import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Disc3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSongsForAlbum } from '@/hooks/useSongs'
import { formatRelativeTime } from '@/lib/format'
import type { Album, AlbumStatus } from '@/types/album'

function formatAlbumStatus(status: AlbumStatus): string {
  return status.replace('-', ' ')
}

interface AlbumCardProps {
  album: Album
}

export function AlbumCard({ album }: AlbumCardProps) {
  const songs = useSongsForAlbum(album.id)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!album.artworkBlob) {
      setArtworkUrl(null)
      return
    }

    const url = URL.createObjectURL(album.artworkBlob)
    setArtworkUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [album.artworkBlob])

  return (
    <Link to={`/album/${album.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardHeader className="pb-2">
          <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-muted/40">
            {artworkUrl ? (
              <img
                src={artworkUrl}
                alt={`${album.title} artwork`}
                className="size-full object-cover"
              />
            ) : (
              <Disc3 className="size-12 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="line-clamp-2 text-base">{album.title}</CardTitle>
              {album.subtitle ? (
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {album.subtitle}
                </p>
              ) : null}
            </div>
            <Badge variant="outline" className="shrink-0 capitalize">
              {formatAlbumStatus(album.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {songs?.length ?? 0} tracks · {formatRelativeTime(album.updatedAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
