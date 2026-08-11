import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createSong, useAllSongs } from '@/hooks/useSongs'
import { formatRelativeTime } from '@/lib/format'
import type { SongStatus } from '@/types/song'

function formatSongStatus(status: SongStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function SongsPage() {
  const songs = useAllSongs()
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)

  async function handleNewSong() {
    setIsCreating(true)
    try {
      const song = await createSong({
        title: 'Untitled Song',
        albumId: null,
        key: null,
        tempo: null,
        timeSignature: null,
        status: 'sketch',
        genre: null,
        lyrics: null,
        songwriter: null,
        publisher: null,
        ipiNumber: null,
        masterEngineer: null,
        copyright: null,
        sampleCredits: null,
      })
      navigate(`/song/${song.id}`)
    } catch {
      // createSong already logs the error
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Songs</h1>
          <p className="text-muted-foreground">
            All your songs, sorted by last modified.
          </p>
        </div>
        <Button onClick={() => void handleNewSong()} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'New Song'}
        </Button>
      </div>

      {songs === undefined ? (
        <p className="text-sm text-muted-foreground">Loading songs...</p>
      ) : songs.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No songs yet. Create one to start organizing ideas.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {songs.map((song) => (
            <li key={song.id}>
              <Link
                to={`/song/${song.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                  {song.title}
                </p>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {formatSongStatus(song.status)}
                </Badge>
                <span className="w-16 shrink-0 text-sm text-muted-foreground">
                  {song.key ?? '—'}
                </span>
                <span className="w-16 shrink-0 text-sm text-muted-foreground">
                  {song.tempo ? `${song.tempo} BPM` : '—'}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(song.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
