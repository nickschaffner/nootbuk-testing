import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createSong, useAllSongs } from '@/hooks/useSongs'
import { formatRelativeTime } from '@/lib/format'
import type { SongStatus } from '@/types/song'

function formatSongStatus(status: SongStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function RecentSongsList() {
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
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Recent Songs</CardTitle>
        <CardAction>
          <Button size="sm" onClick={handleNewSong} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'New Song'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {songs === undefined ? (
          <p className="text-sm text-muted-foreground">Loading songs...</p>
        ) : songs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No songs yet. Create one to start organizing ideas.
          </p>
        ) : (
          <ul className="space-y-2">
            {songs.map((song) => (
              <li key={song.id}>
                <Link
                  to={`/song/${song.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{song.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(song.updatedAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {formatSongStatus(song.status)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
