import { Album as AlbumIcon, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import {
  Button,
  PlayButton,
  SONG_STATUSES,
  SongRow,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Window,
  type TableSort,
} from '@/components/kit'
import {
  addSongToAlbum,
  useAlbumsWithTitlesForSong,
} from '@/hooks/useAlbumSongs'
import { useAllAlbums } from '@/hooks/useAlbums'
import { deleteSong } from '@/hooks/useSongs'
import { formatAlbumLength } from '@/lib/album-display'
import { formatRelativeTime } from '@/lib/format'
import type { Song, SongVersion } from '@/types/song'

function Overlay({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <Window title={title} raised>
          {children}
        </Window>
      </div>
    </div>,
    document.body,
  )
}

function statusLabel(value: string): string {
  return SONG_STATUSES.find((option) => option.value === value)?.label ?? value
}

function sortSongs(
  songs: Song[],
  sort: TableSort | null,
  albumCounts?: Record<string, number>,
): Song[] {
  if (!sort) {
    return songs
  }

  const direction = sort.direction === 'asc' ? 1 : -1

  return [...songs].sort((a, b) => {
    if (sort.column === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) * direction
    }
    if (sort.column === 'status') {
      return a.status.localeCompare(b.status) * direction
    }
    if (sort.column === 'key') {
      const left = a.key?.trim() ?? ''
      const right = b.key?.trim() ?? ''
      if (!left && !right) return 0
      if (!left) return 1
      if (!right) return -1
      return left.localeCompare(right, undefined, { sensitivity: 'base' }) * direction
    }
    if (sort.column === 'tempo') {
      if (a.tempo == null && b.tempo == null) return 0
      if (a.tempo == null) return 1
      if (b.tempo == null) return -1
      return (a.tempo - b.tempo) * direction
    }
    if (sort.column === 'time') {
      const left = a.timeSignature?.trim() ?? ''
      const right = b.timeSignature?.trim() ?? ''
      if (!left && !right) return 0
      if (!left) return 1
      if (!right) return -1
      return left.localeCompare(right, undefined, { sensitivity: 'base' }) * direction
    }
    if (sort.column === 'albums') {
      const left = albumCounts?.[a.id] ?? 0
      const right = albumCounts?.[b.id] ?? 0
      if (left === 0 && right === 0) return 0
      if (left === 0) return 1
      if (right === 0) return -1
      return (left - right) * direction
    }
    if (sort.column === 'updated') {
      return (
        (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction
      )
    }
    return 0
  })
}

function SongTableRow({
  song,
  playbackVersion,
  incompleteCount,
  albumCount,
}: {
  song: Song
  playbackVersion?: SongVersion
  incompleteCount: number
  albumCount: number
}) {
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [pickingAlbum, setPickingAlbum] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const allAlbums = useAllAlbums()
  const memberships = useAlbumsWithTitlesForSong(song.id)

  const memberAlbumIds = new Set(
    (memberships ?? []).map((membership) => membership.albumId),
  )
  const availableAlbums = (allAlbums ?? []).filter(
    (album) => !memberAlbumIds.has(album.id),
  )

  useEffect(() => {
    setPlaying(false)
    audioRef.current?.pause()
    audioRef.current = null

    if (!playbackVersion) {
      return
    }

    const url = URL.createObjectURL(playbackVersion.blob)
    const audio = new Audio(url)
    audio.loop = true
    audioRef.current = audio

    return () => {
      audio.pause()
      URL.revokeObjectURL(url)
      audioRef.current = null
    }
  }, [playbackVersion])

  function handlePlay() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }

    void audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        setPlaying(false)
      })
  }

  async function handleAddToAlbum(albumId: string) {
    try {
      await addSongToAlbum(albumId, song.id)
      setPickingAlbum(false)
    } catch {
      // addSongToAlbum already logs
    }
  }

  async function handleDelete(deleteIdeas: boolean) {
    setIsDeleting(true)
    try {
      await deleteSong(song.id, { deleteIdeas })
      setConfirmDelete(false)
    } catch {
      // deleteSong already logs
    } finally {
      setIsDeleting(false)
    }
  }

  const length =
    playbackVersion?.duration != null
      ? formatAlbumLength(playbackVersion.duration)
      : null

  return (
    <>
      <SongRow
        title={song.title}
        status={statusLabel(song.status)}
        todoCount={incompleteCount}
        length={length}
        songKey={song.key}
        tempo={song.tempo}
        time={song.timeSignature}
        albums={albumCount > 0 ? albumCount : null}
        lastWorked={formatRelativeTime(song.updatedAt)}
        plays={
          playbackVersion ? (
            <PlayButton
              aria-label={playing ? 'Pause song' : 'Play song'}
              playing={playing}
              onClick={handlePlay}
            />
          ) : undefined
        }
        menuItems={[
          {
            label: 'Add to album',
            icon: <AlbumIcon size={15} />,
            disabled: availableAlbums.length === 0,
            onSelect: () => setPickingAlbum(true),
          },
          {
            label: 'Delete',
            icon: <Trash2 size={15} />,
            destructive: true,
            onSelect: () => setConfirmDelete(true),
          },
        ]}
        onOpen={() => navigate(`/song/${song.id}`)}
      />
      {pickingAlbum ? (
        <Overlay title="Add to album" onClose={() => setPickingAlbum(false)}>
          <div className="space-y-1">
            {availableAlbums.map((album) => (
              <Button
                key={album.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => void handleAddToAlbum(album.id)}
              >
                {album.title}
              </Button>
            ))}
          </div>
        </Overlay>
      ) : null}
      {confirmDelete ? (
        <Overlay
          title={`Delete “${song.title}”?`}
          onClose={() => setConfirmDelete(false)}
        >
          <p className="mb-3 text-xs text-muted-foreground">
            This removes the song and its sections, journal, references, assets,
            todos, versions, and album links. Choose what happens to ideas that
            belong to this song.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => void handleDelete(false)}
            >
              {isDeleting ? 'Deleting...' : 'Keep Ideas (move to pool)'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={() => void handleDelete(true)}
            >
              {isDeleting ? 'Deleting...' : 'Delete Everything'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        </Overlay>
      ) : null}
    </>
  )
}

export function SongsTable({
  songs,
  playbackVersions,
  todoCounts,
  albumCounts,
  sort,
  onSort,
}: {
  songs: Song[]
  playbackVersions?: Record<string, SongVersion>
  todoCounts?: Record<string, number>
  albumCounts?: Record<string, number>
  sort: TableSort | null
  onSort: (sort: TableSort | null) => void
}) {
  const rows = sortSongs(songs, sort, albumCounts)

  return (
    <Table sort={sort} onSort={onSort}>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead column="title">Title</TableHead>
          <TableHead column="status">Status</TableHead>
          <TableHead column="key">Key</TableHead>
          <TableHead column="tempo">Tempo</TableHead>
          <TableHead column="time">Time</TableHead>
          <TableHead column="albums">Albums</TableHead>
          <TableHead column="updated">Updated</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((song) => (
          <SongTableRow
            key={song.id}
            song={song}
            playbackVersion={playbackVersions?.[song.id]}
            incompleteCount={todoCounts?.[song.id] ?? 0}
            albumCount={albumCounts?.[song.id] ?? 0}
          />
        ))}
      </TableBody>
    </Table>
  )
}
