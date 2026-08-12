import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { IdeaCard } from '@/components/pool/IdeaCard'
import { AudioPlayButton } from '@/components/player/AudioPlayButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAlbum, useAllAlbums } from '@/hooks/useAlbums'
import { useAlbumSongs } from '@/hooks/useAlbumSongs'
import { useIdeasInPool } from '@/hooks/useIdeas'
import {
  mediaFlagsFor,
  useIdeaMediaFlagsMap,
} from '@/hooks/useIdeaMediaIndex'
import { createSong, useAllSongs } from '@/hooks/useSongs'
import { useIncompleteTodoCountsBySong } from '@/hooks/useSongTodos'
import {
  useAlbumTotalDurationSeconds,
  usePlaybackVersionsIndex,
} from '@/hooks/useSongVersions'
import { formatAlbumFormat, formatAlbumLength } from '@/lib/album-display'
import { formatRelativeTime } from '@/lib/format'
import { formatRoleLabel, ideaMatchesSearch, IDEA_ROLES } from '@/lib/idea-label'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole } from '@/types/idea'
import type { SongStatus } from '@/types/song'

function formatSongStatus(status: SongStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function HomePage() {
  const { open: openCapture, openIdea } = useQuickCapture()
  const navigate = useNavigate()

  const songs = useAllSongs()
  const albums = useAllAlbums()
  const ideas = useIdeasInPool()
  const mediaMap = useIdeaMediaFlagsMap()
  const todoCounts = useIncompleteTodoCountsBySong()
  const playbackVersions = usePlaybackVersionsIndex()

  const [roleFilter, setRoleFilter] = useState<IdeaRole | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [creatingSong, setCreatingSong] = useState(false)
  const [creatingAlbum, setCreatingAlbum] = useState(false)

  const recentSongs = useMemo(() => (songs ?? []).slice(0, 3), [songs])
  const recentAlbum = albums?.[0] ?? null
  const recentAlbumTracks = useAlbumSongs(recentAlbum?.id)
  const recentAlbumSongIds = useMemo(
    () => (recentAlbumTracks ?? []).map((track) => track.songId),
    [recentAlbumTracks],
  )
  const recentAlbumDuration = useAlbumTotalDurationSeconds(recentAlbumSongIds)

  const filteredIdeas = useMemo(() => {
    if (!ideas) {
      return []
    }

    return ideas.filter((idea) => {
      if (roleFilter !== 'all' && idea.role !== roleFilter) {
        return false
      }
      return ideaMatchesSearch(idea, searchQuery)
    })
  }, [ideas, roleFilter, searchQuery])

  async function handleCreateSong() {
    setCreatingSong(true)
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
      // createSong already logs
    } finally {
      setCreatingSong(false)
    }
  }

  async function handleCreateAlbum() {
    setCreatingAlbum(true)
    try {
      const album = await createAlbum({
        title: 'Untitled Album',
        status: 'draft',
        artworkBlob: null,
        releaseDate: null,
        credits: null,
        label: null,
        globalNotes: null,
        referenceMaterial: null,
        notes: null,
      })
      navigate(`/album/${album.id}`)
    } catch {
      // createAlbum already logs
    } finally {
      setCreatingAlbum(false)
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
          <p className="text-sm text-muted-foreground">
            Recent work and your idea pool.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent</h2>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Songs</h3>
                {songs && songs.length > 0 ? (
                  <Link
                    to="/songs"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View all
                  </Link>
                ) : null}
              </div>

              {songs === undefined ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : songs.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No songs yet.
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    disabled={creatingSong}
                    onClick={() => void handleCreateSong()}
                  >
                    {creatingSong ? 'Creating...' : 'Create a song'}
                  </Button>
                </div>
              ) : (
                <ul className="space-y-1">
                  {recentSongs.map((song) => {
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
                        className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {song.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(song.updatedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {incompleteCount > 0 ? (
                            <Badge variant="secondary" className="tabular-nums">
                              {incompleteCount} todo
                              {incompleteCount === 1 ? '' : 's'}
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
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Album</h3>
                {albums && albums.length > 0 ? (
                  <Link
                    to="/albums"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View all
                  </Link>
                ) : null}
              </div>

              {albums === undefined ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !recentAlbum ? (
                <div className="rounded-md border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No albums yet.
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    disabled={creatingAlbum}
                    onClick={() => void handleCreateAlbum()}
                  >
                    {creatingAlbum ? 'Creating...' : 'Create an album'}
                  </Button>
                </div>
              ) : (
                <Link
                  to={`/album/${recentAlbum.id}`}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {recentAlbum.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAlbumFormat(recentAlbum.format)} ·{' '}
                      {recentAlbumDuration === undefined
                        ? '…'
                        : formatAlbumLength(recentAlbumDuration)}{' '}
                      · {formatRelativeTime(recentAlbum.updatedAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {recentAlbum.status.replace('-', ' ')}
                  </Badge>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Idea Pool</h2>
            <p className="text-sm text-muted-foreground">
              Unattached ideas waiting to land in a song.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="sm:flex-1"
            />
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as IdeaRole | 'all')}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {IDEA_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ideas === undefined ? (
            <p className="text-sm text-muted-foreground">Loading ideas...</p>
          ) : ideas.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm font-medium">
                No ideas yet. Capture your first idea.
              </p>
              <Button className="mt-4" onClick={() => openCapture()}>
                Open Quick Capture
              </Button>
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm font-medium">No ideas match your filters.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  songTitle={null}
                  mediaFlags={mediaFlagsFor(mediaMap, idea.id)}
                  onClick={() => openIdea(idea.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
