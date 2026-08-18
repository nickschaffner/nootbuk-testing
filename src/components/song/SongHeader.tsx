import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageIcon, Trash2 } from 'lucide-react'

import { KeySelector } from '@/components/shared/KeySelector'
import { TimeSignatureSelector } from '@/components/shared/TimeSignatureSelector'
import { StatusStepIndicator } from '@/components/shared/StatusStepIndicator'
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
import { deleteSong, updateSong } from '@/hooks/useSongs'
import type { Song, SongStatus } from '@/types/song'

const SONG_STATUSES = [
  'sketch',
  'writing',
  'arranging',
  'production',
  'mixing',
  'mastering',
  'released',
] as const satisfies readonly SongStatus[]

interface SongHeaderProps {
  song: Song
}

export function SongHeader({ song }: SongHeaderProps) {
  const navigate = useNavigate()
  const artworkInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(song.title)
  const [tempo, setTempo] = useState(song.tempo?.toString() ?? '')
  const [status, setStatus] = useState(song.status)
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setTitle(song.title)
    setTempo(song.tempo?.toString() ?? '')
    setStatus(song.status)
  }, [song])

  useEffect(() => {
    if (!song.artworkBlob) {
      setArtworkUrl(null)
      return
    }

    const url = URL.createObjectURL(song.artworkBlob)
    setArtworkUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [song.artworkBlob])

  async function persist(fields: Parameters<typeof updateSong>[0]) {
    try {
      await updateSong(fields)
    } catch {
      // updateSong already logs the error
    }
  }

  async function handleArtworkUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      return
    }

    await persist({ id: song.id, artworkBlob: file })
  }

  async function handleDelete(deleteIdeas: boolean) {
    setIsDeleting(true)
    try {
      await deleteSong(song.id, { deleteIdeas })
      navigate('/songs')
    } catch {
      // deleteSong already logs the error
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
              alt={`${song.title} artwork`}
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
              if (title.trim() && title !== song.title) {
                void persist({ id: song.id, title: title.trim() })
              }
            }}
            className="text-lg font-semibold"
          />
        </div>

        <div className="min-w-[220px]">
          <KeySelector
            compact
            value={song.key}
            onChange={(next) => {
              if (next !== song.key) {
                void persist({ id: song.id, key: next })
              }
            }}
          />
        </div>

        <div className="w-24 space-y-1">
          <label className="text-xs text-muted-foreground">Tempo</label>
          <Input
            type="number"
            min={1}
            value={tempo}
            placeholder="120"
            onChange={(event) => setTempo(event.target.value)}
            onBlur={() => {
              void persist({
                id: song.id,
                tempo: tempo ? Number.parseInt(tempo, 10) : null,
              })
            }}
          />
        </div>

        <TimeSignatureSelector
          compact
          id="song-header-time"
          value={song.timeSignature}
          onChange={(next) => {
            if (next !== song.timeSignature) {
              void persist({ id: song.id, timeSignature: next })
            }
          }}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              disabled={isDeleting}
              aria-label="Delete song"
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this song?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the song and its sections, journal, references,
                assets, todos, versions, and album links. Choose what happens to
                ideas that belong to this song.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDelete(false)
                }}
              >
                {isDeleting
                  ? 'Deleting...'
                  : 'Keep Ideas (move to pool)'}
              </AlertDialogAction>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDelete(true)
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Everything'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <StatusStepIndicator
          stages={SONG_STATUSES}
          value={status}
          onChange={(nextStatus) => {
            setStatus(nextStatus)
            void persist({ id: song.id, status: nextStatus })
          }}
        />
      </div>
    </div>
  )
}
