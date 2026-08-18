import { Lightbulb } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { IdeaCard } from '@/components/pool/IdeaCard'
import { RecentAlbumCard, RecentSongCard } from '@/components/home/RecentLibraryCards'
import {
  Button,
  EmptyLibraryCard,
  EmptyState,
  IDEA_ROLES,
  Input,
  Pick,
  RuleHeader,
} from '@/components/kit'
import { createAlbum, useAllAlbums } from '@/hooks/useAlbums'
import { useIdeasInPool } from '@/hooks/useIdeas'
import {
  mediaFlagsFor,
  useIdeaMediaFlagsMap,
} from '@/hooks/useIdeaMediaIndex'
import { createSong, useAllSongs } from '@/hooks/useSongs'
import { useIncompleteTodoCountsBySong } from '@/hooks/useSongTodos'
import { usePlaybackVersionsIndex } from '@/hooks/useSongVersions'
import { ideaMatchesSearch } from '@/lib/idea-label'
import { useQuickCapture } from '@/stores/quickCapture'
import type { IdeaRole } from '@/types/idea'

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All roles' },
  ...IDEA_ROLES,
]

const SONG_SLOTS = 3

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

  const recentSongs = useMemo(() => (songs ?? []).slice(0, SONG_SLOTS), [songs])
  const recentAlbum = albums?.[0] ?? null
  const emptySongCount = Math.max(0, SONG_SLOTS - recentSongs.length)

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
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">Home</h1>
        <p className="text-sm text-muted-foreground">
          Recent work and your idea pool.
        </p>
      </div>

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

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-extrabold uppercase tracking-wide">Idea Pool</h2>
          <p className="text-sm text-muted-foreground">
            Unattached ideas waiting to land in a song.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:flex-1">
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Pick
              options={ROLE_FILTER_OPTIONS}
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as IdeaRole | 'all')
              }
            />
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
  )
}
