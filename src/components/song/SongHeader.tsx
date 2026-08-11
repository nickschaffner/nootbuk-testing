import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'

import { KeySelector } from '@/components/shared/KeySelector'
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
import { deleteSong, updateSong } from '@/hooks/useSongs'
import type { Song, SongStatus } from '@/types/song'

const SONG_STATUSES: SongStatus[] = [
  'sketch',
  'writing',
  'arranging',
  'production',
  'mixing',
  'mastering',
  'released',
]

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

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteSong(song.id)
      navigate('/songs')
    } catch {
      // deleteSong already logs the error
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
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

      <div className="w-40 space-y-1">
        <label className="text-xs text-muted-foreground">Status</label>
        <Select
          value={status}
          onValueChange={(value) => {
            const nextStatus = value as SongStatus
            setStatus(nextStatus)
            void persist({ id: song.id, status: nextStatus })
          }}
        >
          <SelectTrigger className="w-full capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SONG_STATUSES.map((item) => (
              <SelectItem key={item} value={item} className="capitalize">
                {item}
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
              assets, todos, and versions. Ideas in this song will be moved back
              to the pool. This cannot be undone.
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
  )
}
