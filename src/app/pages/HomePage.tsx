import { Lightbulb } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { IdeaSearchRoleFilters } from '@/components/home/IdeaSearchRoleFilters'
import { IdeaTable, sortIdeas } from '@/components/home/IdeaTable'
import { RecentAlbumCard, RecentSongCard } from '@/components/home/RecentLibraryCards'
import {
  Button,
  EmptyLibraryCard,
  EmptyState,
  RuleHeader,
  type TableSort,
} from '@/components/kit'
import { createAlbum, useAllAlbums } from '@/hooks/useAlbums'
import { useIdeasInPool } from '@/hooks/useIdeas'
import { createSong, useAllSongs } from '@/hooks/useSongs'
import { useIncompleteTodoCountsBySong } from '@/hooks/useSongTodos'
import { usePlaybackVersionsIndex } from '@/hooks/useSongVersions'
import { ideaMatchesSearch } from '@/lib/idea-label'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole } from '@/types/idea'

const SONG_SLOTS = 3
const POOL_VISIBLE = 8

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
  const [poolSort, setPoolSort] = useState<TableSort | null>({
    column: 'updated',
    direction: 'desc',
  })
  const [poolExpanded, setPoolExpanded] = useState(false)
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

  const displayedIdeas = useMemo(
    () => sortIdeas(filteredIdeas, poolSort),
    [filteredIdeas, poolSort],
  )

  const visibleIdeas = poolExpanded
    ? displayedIdeas
    : displayedIdeas.slice(0, POOL_VISIBLE)
  const hiddenPoolCount = displayedIdeas.length - visibleIdeas.length

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
      <section>
        <div className="flex h-16 items-center">
          <RuleHeader title="Recent" className="w-full" />
        </div>

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

        <IdeaSearchRoleFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
        />

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
          <>
            <IdeaTable
              ideas={visibleIdeas}
              sort={poolSort}
              onSort={setPoolSort}
              onOpen={(idea) => openIdea(idea.id)}
            />
            {hiddenPoolCount > 0 ? (
              <Button
                variant="outline"
                block
                onClick={() => setPoolExpanded(true)}
              >
                + {hiddenPoolCount} More {hiddenPoolCount === 1 ? 'Idea' : 'Ideas'}
              </Button>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
