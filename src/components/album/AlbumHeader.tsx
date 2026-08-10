import { useEffect, useRef, useState } from 'react'
import { ImageIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateAlbum } from '@/hooks/useAlbums'
import type { Album, AlbumStatus } from '@/types/album'

const ALBUM_STATUSES: AlbumStatus[] = ['draft', 'in-progress', 'released']

interface AlbumHeaderProps {
  album: Album
}

export function AlbumHeader({ album }: AlbumHeaderProps) {
  const artworkInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(album.title)
  const [subtitle, setSubtitle] = useState(album.subtitle ?? '')
  const [status, setStatus] = useState(album.status)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)

  useEffect(() => {
    setTitle(album.title)
    setSubtitle(album.subtitle ?? '')
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

        <div className="min-w-[200px] flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Subtitle</label>
          <Input
            value={subtitle}
            placeholder="Optional subtitle"
            onChange={(event) => setSubtitle(event.target.value)}
            onBlur={() => {
              const next = subtitle.trim() || null
              if (next !== album.subtitle) {
                void persist({ id: album.id, subtitle: next })
              }
            }}
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
      </div>
    </div>
  )
}
