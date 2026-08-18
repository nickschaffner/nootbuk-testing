import { Lightbulb } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PoolIdeaRow } from '@/components/home/PoolIdeaRow'
import { RecentAlbumCard, RecentSongCard } from '@/components/home/RecentLibraryCards'
import {
  Button,
  Chip,
  EmptyLibraryCard,
  EmptyState,
  IDEA_ROLES,
  RuleHeader,
  SearchBar,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  type TableSort,
} from '@/components/kit'
import { createAlbum, useAllAlbums } from '@/hooks/useAlbums'
import { useIdeasInPool } from '@/hooks/useIdeas'
import { createSong, useAllSongs } from '@/hooks/useSongs'
import { useIncompleteTodoCountsBySong } from '@/hooks/useSongTodos'
import { usePlaybackVersionsIndex } from '@/hooks/useSongVersions'
import { getIdeaDisplayLabel, ideaMatchesSearch } from '@/lib/idea-label'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole } from '@/types/idea'

const SONG_SLOTS = 3

export function HomePage() {
  const { open: openCapture, openIdea } = useQuickCapture()
  const navigate = useNavigate()

  const songs = useAllSongs()
  const albums = useAllAlbums()
  const ideas = useIdeasInPool()
  const todoCounts = useIncompleteTodoCountsBySong()
  const playbackVersions = usePlaybackVersionsIndex()

  const [roleFilter, setRoleFilter] = useState<IdeaRole[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [poolSort, setPoolSort] = useState<TableSort | null>(null)
  const [creatingSong, setCreatingSong] = useState(false)
  const [creatingAlbum, setCreatingAlbum] = useState(false)

  const recentSongs = useMemo(() => (songs ?? []).slice(0, SONG_SLOTS), [songs])
  const recentAlbum = albums?.[0] ?? null
  const emptySongCount = Math.max(0, SONG_SLOTS - recentSongs.length)

  const filteredIdeas = useMemo(() => {
    if (!ideas) {
      return []
    }

    return ideas.filter((idea) => {
      if (roleFilter.length > 0 && !roleFilter.includes(idea.role)) {
        return false
      }
      return ideaMatchesSearch(idea, searchQuery)
    })
  }, [ideas, roleFilter, searchQuery])

  const displayedIdeas = useMemo(() => {
    if (!poolSort) {
      return filteredIdeas
    }

    const direction = poolSort.direction === 'asc' ? 1 : -1

    return [...filteredIdeas].sort((a, b) => {
      if (poolSort.column === 'role') {
        return a.role.localeCompare(b.role) * direction
      }
      if (poolSort.column === 'title') {
        return (
          getIdeaDisplayLabel(a).localeCompare(getIdeaDisplayLabel(b), undefined, {
            sensitivity: 'base',
          }) * direction
        )
      }
      if (poolSort.column === 'key') {
        const left = a.key?.trim() ?? ''
        const right = b.key?.trim() ?? ''
        if (!left && !right) return 0
        if (!left) return 1
        if (!right) return -1
        return left.localeCompare(right, undefined, { sensitivity: 'base' }) * direction
      }
      if (poolSort.column === 'tempo') {
        if (a.tempo == null && b.tempo == null) return 0
        if (a.tempo == null) return 1
        if (b.tempo == null) return -1
        return (a.tempo - b.tempo) * direction
      }
      if (poolSort.column === 'updated') {
        return (
          (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction
        )
      }
      return 0
    })
  }, [filteredIdeas, poolSort])

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
    <div className="space-y-8">
      <section className="space-y-6">
        <RuleHeader title="Recent" />

        {songs === undefined || albums === undefined ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 pb-2 pr-2 sm:grid-cols-2">
            {recentSongs.map((song) => (
              <RecentSongCard
                key={song.id}
                song={song}
                todoCount={todoCounts?.[song.id] ?? 0}
                playbackVersion={playbackVersions?.[song.id]}
              />
            ))}
            {Array.from({ length: emptySongCount }, (_, index) => (
              <EmptyLibraryCard
                key={`empty-song-${index}`}
                label={index === 0 ? '+ New Song' : undefined}
                disabled={creatingSong}
                onCreate={index === 0 ? () => void handleCreateSong() : undefined}
              />
            ))}
            {recentAlbum ? (
              <RecentAlbumCard album={recentAlbum} />
            ) : (
              <EmptyLibraryCard
                label="+ New Album"
                disabled={creatingAlbum}
                onCreate={() => void handleCreateAlbum()}
              />
            )}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <RuleHeader
          title="Idea Pool"
          subtitle={
            ideas === undefined
              ? undefined
              : `${ideas.length} Idea${ideas.length === 1 ? '' : 's'}`
          }
        />

        <div className="grid grid-cols-2 items-start gap-8">
          <SearchBar
            placeholder="Search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <div className="flex flex-wrap items-start gap-1.5">
            <Chip
              selected={roleFilter.length === 0}
              onClick={() => setRoleFilter([])}
            >
              All
            </Chip>
            {IDEA_ROLES.map((role) => {
              const value = role.value as IdeaRole
              const selected = roleFilter.includes(value)
              return (
                <Chip
                  key={role.value}
                  selected={selected}
                  onClick={() => {
                    setRoleFilter((current) => {
                      if (current.includes(value)) {
                        return current.filter((item) => item !== value)
                      }
                      return [...current, value]
                    })
                  }}
                >
                  {role.label}
                </Chip>
              )
            })}
          </div>
        </div>

        {ideas === undefined ? (
          <p className="text-sm text-muted-foreground">Loading ideas...</p>
        ) : ideas.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={28} />}
            title="No ideas yet"
            hint="Capture your first idea."
            action={
              <Button onClick={() => openCapture()}>Open Quick Capture</Button>
            }
          />
        ) : filteredIdeas.length === 0 ? (
          <EmptyState title="No ideas match your filters." />
        ) : (
          <Table sort={poolSort} onSort={setPoolSort}>
            <TableHeader>
              <TableRow>
                <TableHead column="role">Role</TableHead>
                <TableHead column="title">Title</TableHead>
                <TableHead column="key">Key</TableHead>
                <TableHead column="tempo">BPM</TableHead>
                <TableHead column="updated">Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedIdeas.map((idea) => (
                <PoolIdeaRow
                  key={idea.id}
                  idea={idea}
                  onOpen={() => openIdea(idea.id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
