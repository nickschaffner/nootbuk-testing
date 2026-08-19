import { Music2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { RecentSongCard } from '@/components/home/RecentLibraryCards'
import { SongFilters, songMatchesSearch, tempoRangeForBpm, tempoRangeKey } from '@/components/songs/SongFilters'
import { SongsTable } from '@/components/songs/SongsTable'
import {
  Button,
  EmptyState,
  PageHeader,
  TabSwitcher,
  type TableSort,
} from '@/components/kit'
import { useAlbumCountsBySong } from '@/hooks/useAlbumSongs'
import { createSong, useAllSongs } from '@/hooks/useSongs'
import { useIncompleteTodoCountsBySong } from '@/hooks/useSongTodos'
import { usePlaybackVersionsIndex } from '@/hooks/useSongVersions'
import type { SongStatus } from '@/types/song'

type SongsView = 'cards' | 'table'

const VIEW_OPTIONS: { value: SongsView; label: string }[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'table', label: 'Table' },
]

export function SongsPage() {
  const songs = useAllSongs()
  const playbackVersions = usePlaybackVersionsIndex()
  const todoCounts = useIncompleteTodoCountsBySong()
  const albumCounts = useAlbumCountsBySong()
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [view, setView] = useState<SongsView>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SongStatus[]>([])
  const [keyFilter, setKeyFilter] = useState('')
  const [tempoFilter, setTempoFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('')

  const allSongs = useMemo(() => songs ?? [], [songs])

  const rows = useMemo(() => {
    return allSongs.filter((song) => {
      if (!songMatchesSearch(song, searchQuery)) {
        return false
      }
      if (statusFilter.length > 0 && !statusFilter.includes(song.status)) {
        return false
      }
      if (keyFilter && (song.key?.trim() ?? '') !== keyFilter) {
        return false
      }
      if (timeFilter && (song.timeSignature?.trim() ?? '') !== timeFilter) {
        return false
      }
      if (tempoFilter) {
        if (song.tempo == null) {
          return false
        }
        const range = tempoRangeForBpm(song.tempo)
        if (tempoRangeKey(range.min, range.max) !== tempoFilter) {
          return false
        }
      }
      return true
    })
  }, [allSongs, searchQuery, statusFilter, keyFilter, tempoFilter, timeFilter])

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
      <PageHeader
        title="Songs"
        action={
          <Button
            variant="secondary"
            size="sm"
            disabled={isCreating}
            onClick={() => void handleNewSong()}
          >
            {isCreating ? 'Creating...' : '+ New Song'}
          </Button>
        }
      />

      {songs === undefined ? (
        <p className="text-sm text-muted-foreground">Loading songs...</p>
      ) : songs.length === 0 ? (
        <EmptyState
          icon={<Music2 size={28} />}
          title="No songs yet"
          hint="Create one to start organizing ideas."
          action={
            <Button disabled={isCreating} onClick={() => void handleNewSong()}>
              {isCreating ? 'Creating...' : '+ New Song'}
            </Button>
          }
        />
      ) : (
        <>
          <SongFilters
            songs={allSongs}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            keyFilter={keyFilter}
            onKeyFilterChange={setKeyFilter}
            tempoFilter={tempoFilter}
            onTempoFilterChange={setTempoFilter}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
          />
          <TabSwitcher
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
          />
          {rows.length === 0 ? (
            <EmptyState title="No songs match your filters." />
          ) : view === 'table' ? (
            <SongsTable
              songs={rows}
              playbackVersions={playbackVersions}
              todoCounts={todoCounts}
              albumCounts={albumCounts}
              sort={sort}
              onSort={setSort}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 pb-2 pr-2 sm:grid-cols-2">
              {rows.map((song) => (
                <RecentSongCard
                  key={song.id}
                  song={song}
                  todoCount={todoCounts?.[song.id] ?? 0}
                  playbackVersion={playbackVersions?.[song.id]}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
