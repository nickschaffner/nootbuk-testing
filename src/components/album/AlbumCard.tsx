import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Disc3, Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteAlbum } from '@/hooks/useAlbums'
import { useAlbumSongs } from '@/hooks/useAlbumSongs'
import { formatRelativeTime } from '@/lib/format'
import type { Album, AlbumStatus } from '@/types/album'

function formatAlbumStatus(status: AlbumStatus): string {
  return status.replace('-', ' ')
}

interface AlbumCardProps {
  album: Album
}

export function AlbumCard({ album }: AlbumCardProps) {
  const tracks = useAlbumSongs(album.id)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!album.artworkBlob) {
      setArtworkUrl(null)
      return
    }

    const url = URL.createObjectURL(album.artworkBlob)
    setArtworkUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [album.artworkBlob])

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteAlbum(album.id)
    } catch {
      // deleteAlbum already logs the error
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="relative h-full transition-colors hover:bg-muted/40">
      <Link to={`/album/${album.id}`} className="block">
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
            </div>
            <Badge variant="outline" className="shrink-0 capitalize">
              {formatAlbumStatus(album.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {tracks?.length ?? 0} tracks · {formatRelativeTime(album.updatedAt)}
          </p>
        </CardContent>
      </Link>

      <div className="absolute right-2 top-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="bg-background/90 text-muted-foreground shadow-sm hover:text-destructive"
              disabled={isDeleting}
              aria-label={`Delete ${album.title}`}
              onClick={(event) => event.stopPropagation()}
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(event) => event.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{album.title}”?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the album and its track listing links. Songs on
                this album will not be deleted. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  void handleDelete()
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  )
}
