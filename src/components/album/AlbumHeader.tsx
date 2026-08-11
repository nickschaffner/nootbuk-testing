import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageIcon, Trash2 } from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { deleteAlbum, updateAlbum } from '@/hooks/useAlbums'
import type { Album, AlbumStatus } from '@/types/album'

const ALBUM_STATUSES: AlbumStatus[] = ['draft', 'in-progress', 'released']

interface AlbumHeaderProps {
  album: Album
}

export function AlbumHeader({ album }: AlbumHeaderProps) {
  const navigate = useNavigate()
  const artworkInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(album.title)
  const [status, setStatus] = useState(album.status)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setTitle(album.title)
    setStatus(album.status)
  }, [album])

  useEffect(() => {
    if (!album.artworkBlob) {
      setArtworkUrl(null)
      return
    }

    const url = URL.createObjectURL(album.artworkBlob)
    setArtworkUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [album.artworkBlob])

  async function persist(fields: Parameters<typeof updateAlbum>[0]) {
    try {
      await updateAlbum(fields)
    } catch {
      // updateAlbum already logs the error
    }
  }

  async function handleArtworkUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      return
    }

    await persist({ id: album.id, artworkBlob: file })
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteAlbum(album.id)
      navigate('/albums')
    } catch {
      // deleteAlbum already logs the error
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border bg-card p-4">
      <button
        type="button"
        className="relative flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 hover:bg-muted/60"
        onClick={() => artworkInputRef.current?.click()}
      >
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={`${album.title} artwork`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-xs">Upload artwork</span>
          </div>
        )}
      </button>
      <input
        ref={artworkInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleArtworkUpload(event.target.files)
          event.target.value = ''
        }}
      />

      <div className="flex min-w-[240px] flex-1 flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Title</label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => {
              if (title.trim() && title !== album.title) {
                void persist({ id: album.id, title: title.trim() })
              }
            }}
            className="text-lg font-semibold"
          />
        </div>

        <div className="w-40 space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select
            value={status}
            onValueChange={(value) => {
              const nextStatus = value as AlbumStatus
              setStatus(nextStatus)
              void persist({ id: album.id, status: nextStatus })
            }}
          >
            <SelectTrigger className="w-full capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALBUM_STATUSES.map((item) => (
                <SelectItem key={item} value={item} className="capitalize">
                  {item.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              disabled={isDeleting}
              aria-label="Delete album"
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this album?</AlertDialogTitle>
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
                  void handleDelete()
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
