import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AudioPlayButton } from '@/components/player/AudioPlayButton'
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
import { useIncompleteTodoCountsBySong } from '@/hooks/useSongTodos'
import { usePlaybackVersionsIndex } from '@/hooks/useSongVersions'
import { formatRelativeTime } from '@/lib/format'
import type { SongStatus } from '@/types/song'

function formatSongStatus(status: SongStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function RecentSongsList() {
  const songs = useAllSongs()
  const todoCounts = useIncompleteTodoCountsBySong()
  const playbackVersions = usePlaybackVersionsIndex()
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)

  async function handleNewSong() {
    setIsCreating(true)
    try {
      const song = await createSong({
        title: 'Untitled Song',
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
            {songs.map((song) => {
              const incompleteCount = todoCounts?.[song.id] ?? 0
              const playbackVersion = playbackVersions?.[song.id]

              return (
              <li key={song.id} className="flex items-center gap-1">
                {playbackVersion ? (
                  <AudioPlayButton blob={playbackVersion.blob} />
                ) : (
                  <div className="size-8 shrink-0" />
                )}
                <Link
                  to={`/song/${song.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{song.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(song.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {incompleteCount > 0 ? (
                      <Badge variant="secondary" className="tabular-nums">
                        {incompleteCount} todo{incompleteCount === 1 ? '' : 's'}
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="capitalize">
                      {formatSongStatus(song.status)}
                    </Badge>
                  </div>
                </Link>
              </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
