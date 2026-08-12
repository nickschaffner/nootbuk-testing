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
import { StatusStepIndicator } from '@/components/shared/StatusStepIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteAlbum, updateAlbum } from '@/hooks/useAlbums'
import { cn } from '@/lib/utils'
import type { Album, AlbumFormat, AlbumStatus } from '@/types/album'

const ALBUM_STATUSES = [
  'draft',
  'in-progress',
  'released',
] as const satisfies readonly AlbumStatus[]

const ALBUM_FORMATS = [
  { value: 'single', label: 'Single' },
  { value: 'lp', label: 'LP' },
  { value: 'ep', label: 'EP' },
] as const satisfies ReadonlyArray<{ value: AlbumFormat; label: string }>

interface AlbumHeaderProps {
  album: Album
}

export function AlbumHeader({ album }: AlbumHeaderProps) {
  const navigate = useNavigate()
  const artworkInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(album.title)
  const [status, setStatus] = useState(album.status)
  const [format, setFormat] = useState<AlbumFormat>(album.format ?? 'ep')
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setTitle(album.title)
    setStatus(album.status)
    setFormat(album.format ?? 'ep')
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
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap gap-4">
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

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Format</label>
        <div
          className="inline-flex rounded-md border p-0.5"
          role="group"
          aria-label="Album format"
        >
          {ALBUM_FORMATS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={cn(
                'rounded-sm px-3 py-1.5 text-sm transition-colors',
                format === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={format === value}
              onClick={() => {
                setFormat(value)
                if (value !== album.format) {
                  void persist({ id: album.id, format: value })
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <StatusStepIndicator
          stages={ALBUM_STATUSES}
          value={status}
          onChange={(nextStatus) => {
            setStatus(nextStatus)
            void persist({ id: album.id, status: nextStatus })
          }}
        />
      </div>
    </div>
  )
}
