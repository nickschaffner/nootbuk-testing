import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'

import { KeySelector } from '@/components/shared/KeySelector'
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
  const [title, setTitle] = useState(song.title)
  const [tempo, setTempo] = useState(song.tempo?.toString() ?? '')
  const [timeSignature, setTimeSignature] = useState(song.timeSignature ?? '')
  const [status, setStatus] = useState(song.status)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setTitle(song.title)
    setTempo(song.tempo?.toString() ?? '')
    setTimeSignature(song.timeSignature ?? '')
    setStatus(song.status)
  }, [song])

  async function persist(fields: Parameters<typeof updateSong>[0]) {
    try {
      await updateSong(fields)
    } catch {
      // updateSong already logs the error
    }
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
      <div className="flex flex-wrap items-end gap-3">
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

        <div className="w-24 space-y-1">
          <label className="text-xs text-muted-foreground">Time</label>
          <Input
            value={timeSignature}
            placeholder="4/4"
            onChange={(event) => setTimeSignature(event.target.value)}
            onBlur={() => {
              void persist({
                id: song.id,
                timeSignature: timeSignature.trim() || null,
              })
            }}
          />
        </div>

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
