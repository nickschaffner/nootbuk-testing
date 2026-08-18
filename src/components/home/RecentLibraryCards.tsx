import { Album as AlbumIcon, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  AlbumCard,
  Button,
  SONG_STATUSES,
  ALBUM_STATUSES,
  SongCard,
  Window,
} from '@/components/kit'
import {
  addSongToAlbum,
  useAlbumSongs,
  useAlbumsWithTitlesForSong,
} from '@/hooks/useAlbumSongs'
import { useAssetsForSong } from '@/hooks/useAssets'
import { deleteAlbum, useAllAlbums } from '@/hooks/useAlbums'
import { deleteSong } from '@/hooks/useSongs'
import { useAlbumTotalDurationSeconds } from '@/hooks/useSongVersions'
import { formatAlbumLength } from '@/lib/album-display'
import { formatRelativeTime } from '@/lib/format'
import type { Album } from '@/types/album'
import type { Song, SongVersion } from '@/types/song'

function statusLabel(
  options: { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }

    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])

  return url
}

function Overlay({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
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
    </div>
  )
}

function useSongArtworkUrl(song: Song): string | null {
  const assets = useAssetsForSong(song.id)
  const fromAssets =
    (assets ?? []).find((asset) => asset.type === 'artwork')?.blob ?? null
  return useObjectUrl(song.artworkBlob ?? fromAssets)
}

interface RecentSongCardProps {
  song: Song
  todoCount: number
  playbackVersion?: SongVersion
}

export function RecentSongCard({
  song,
  todoCount,
  playbackVersion,
}: RecentSongCardProps) {
  const navigate = useNavigate()
  const artworkUrl = useSongArtworkUrl(song)
  const allAlbums = useAllAlbums()
  const memberships = useAlbumsWithTitlesForSong(song.id)
  const [pickingAlbum, setPickingAlbum] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const memberAlbumIds = new Set(
    (memberships ?? []).map((membership) => membership.albumId),
  )
  const availableAlbums = (allAlbums ?? []).filter(
    (album) => !memberAlbumIds.has(album.id),
  )

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

  const duration =
    playbackVersion?.duration != null
      ? formatAlbumLength(playbackVersion.duration)
      : undefined

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

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

    void audio.play().then(() => setPlaying(true)).catch(() => {
      setPlaying(false)
    })
  }

  return (
    <>
      <SongCard
        title={song.title}
        status={statusLabel(SONG_STATUSES, song.status)}
        lastWorked={formatRelativeTime(song.updatedAt)}
        todoCount={todoCount}
        artwork={artworkUrl}
        length={duration}
        playing={playing}
        onPlay={playbackVersion ? handlePlay : undefined}
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

interface RecentAlbumCardProps {
  album: Album
}

export function RecentAlbumCard({ album }: RecentAlbumCardProps) {
  const navigate = useNavigate()
  const artworkUrl = useObjectUrl(album.artworkBlob)
  const tracks = useAlbumSongs(album.id)
  const songIds = (tracks ?? []).map((track) => track.songId)
  const totalDuration = useAlbumTotalDurationSeconds(songIds)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteAlbum(album.id)
      setConfirmDelete(false)
    } catch {
      // deleteAlbum already logs
    } finally {
      setIsDeleting(false)
    }
  }

  const duration =
    totalDuration === undefined
      ? undefined
      : totalDuration > 0
        ? formatAlbumLength(totalDuration)
        : undefined

  return (
    <>
      <AlbumCard
        title={album.title}
        status={statusLabel(ALBUM_STATUSES, album.status)}
        trackCount={tracks?.length ?? 0}
        timestamp={formatRelativeTime(album.updatedAt)}
        duration={duration}
        artworkUrl={artworkUrl}
        menuItems={[
          {
            label: 'Delete',
            icon: <Trash2 size={15} />,
            destructive: true,
            onSelect: () => setConfirmDelete(true),
          },
        ]}
        onOpen={() => navigate(`/album/${album.id}`)}
      />

      {confirmDelete ? (
        <Overlay
          title={`Delete “${album.title}”?`}
          onClose={() => setConfirmDelete(false)}
        >
          <p className="mb-3 text-xs text-muted-foreground">
            This removes the album and its track listing links. Songs on this
            album will not be deleted. This cannot be undone.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
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
