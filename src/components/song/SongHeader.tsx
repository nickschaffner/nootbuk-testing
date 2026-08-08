import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateSong } from '@/hooks/useSongs'
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
  const [title, setTitle] = useState(song.title)
  const [keyValue, setKeyValue] = useState(song.key ?? '')
  const [tempo, setTempo] = useState(song.tempo?.toString() ?? '')
  const [timeSignature, setTimeSignature] = useState(song.timeSignature ?? '')
  const [status, setStatus] = useState(song.status)

  useEffect(() => {
    setTitle(song.title)
    setKeyValue(song.key ?? '')
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

      <div className="w-24 space-y-1">
        <label className="text-xs text-muted-foreground">Key</label>
        <Input
          value={keyValue}
          placeholder="Cm"
          onChange={(event) => setKeyValue(event.target.value)}
          onBlur={() => {
            void persist({
              id: song.id,
              key: keyValue.trim() || null,
            })
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
    </div>
  )
}
