import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'

import { AudioPlayButton } from '@/components/player/AudioPlayButton'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createSong, deleteSong, useAllSongs } from '@/hooks/useSongs'
import { useIncompleteTodoCountsBySong } from '@/hooks/useSongTodos'
import { usePlaybackVersionsIndex } from '@/hooks/useSongVersions'
import { formatRelativeTime } from '@/lib/format'
import type { Song, SongStatus, SongVersion } from '@/types/song'

function formatSongStatus(status: SongStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function SongRow({
  song,
  playbackVersion,
  incompleteCount,
}: {
  song: Song
  playbackVersion?: SongVersion
  incompleteCount: number
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteSong(song.id)
    } catch {
      // deleteSong already logs the error
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <li className="flex items-center gap-2 px-2 py-1 pr-2 sm:px-4">
      {playbackVersion ? (
        <AudioPlayButton blob={playbackVersion.blob} />
      ) : (
        <div className="size-8 shrink-0" />
      )}

      <Link
        to={`/song/${song.id}`}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 py-2 transition-colors hover:bg-muted/40"
      >
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {song.title}
        </p>
        {incompleteCount > 0 ? (
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {incompleteCount} todo{incompleteCount === 1 ? '' : 's'}
          </Badge>
        ) : null}
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

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isDeleting}
            aria-label={`Delete ${song.title}`}
          >
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{song.title}”?</AlertDialogTitle>
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
    </li>
  )
}

export function SongsPage() {
  const songs = useAllSongs()
  const playbackVersions = usePlaybackVersionsIndex()
  const todoCounts = useIncompleteTodoCountsBySong()
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
            <SongRow
              key={song.id}
              song={song}
              playbackVersion={playbackVersions?.[song.id]}
              incompleteCount={todoCounts?.[song.id] ?? 0}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
