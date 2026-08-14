import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { Album, AlbumSong } from '@/types/album'
import type { Song } from '@/types/song'

export function useAlbumSongs(albumId: string | undefined) {
  return useLiveQuery(
    () => (albumId ? getSongsForAlbum(albumId) : Promise.resolve([])),
    [albumId],
  )
}

export function useAlbumsForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getAlbumsForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export function useAlbumsWithTitlesForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getAlbumsWithTitlesForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export async function getSongsForAlbum(
  albumId: string,
): Promise<Array<AlbumSong & { song: Song }>> {
  try {
    const albumSongs = await db.albumSongs
      .where('albumId')
      .equals(albumId)
      .toArray()

    albumSongs.sort((a, b) => a.trackNumber - b.trackNumber)

    const results: Array<AlbumSong & { song: Song }> = []
    for (const as of albumSongs) {
      const song = await db.songs.get(as.songId)
      if (song) {
        results.push({ ...as, song })
      }
    }

    return results
  } catch (error) {
    console.warn('getSongsForAlbum failed:', error)
    throw error
  }
}

export async function getAlbumsForSong(
  songId: string,
): Promise<AlbumSong[]> {
  try {
    return await db.albumSongs.where('songId').equals(songId).toArray()
  } catch (error) {
    console.warn('getAlbumsForSong failed:', error)
    throw error
  }
}

export async function getAlbumsWithTitlesForSong(
  songId: string,
): Promise<Array<AlbumSong & { album: Album }>> {
  try {
    const albumSongs = await getAlbumsForSong(songId)
    const results: Array<AlbumSong & { album: Album }> = []

    for (const albumSong of albumSongs) {
      const album = await db.albums.get(albumSong.albumId)
      if (album) {
        results.push({ ...albumSong, album })
      }
    }

    return results
  } catch (error) {
    console.warn('getAlbumsWithTitlesForSong failed:', error)
    throw error
  }
}

export async function addSongToAlbum(
  albumId: string,
  songId: string,
): Promise<AlbumSong> {
  try {
    const existing = await db.albumSongs
      .where('albumId')
      .equals(albumId)
      .toArray()

    const alreadyAdded = existing.find((as) => as.songId === songId)
    if (alreadyAdded) {
      return alreadyAdded
    }

    const trackNumber =
      existing.length === 0
        ? 1
        : Math.max(...existing.map((as) => as.trackNumber)) + 1

    const albumSong = {
      albumId,
      songId,
      trackNumber,
    }

    const id = await db.albumSongs.add(albumSong)
    return { ...albumSong, id }
  } catch (error) {
    console.warn('addSongToAlbum failed:', error)
    throw error
  }
}

export async function removeSongFromAlbum(
  albumId: string,
  songId: string,
): Promise<void> {
  try {
    const items = await db.albumSongs
      .where('albumId')
      .equals(albumId)
      .toArray()
    const match = items.find((as) => as.songId === songId)
    if (match) {
      await db.albumSongs.delete(match.id)
    }
  } catch (error) {
    console.warn('removeSongFromAlbum failed:', error)
    throw error
  }
}

export async function reorderTracks(
  albumId: string,
  orderedSongIds: string[],
): Promise<void> {
  try {
    const items = await db.albumSongs
      .where('albumId')
      .equals(albumId)
      .toArray()

    await db.transaction('rw', db.albumSongs, async () => {
      for (const [index, songId] of orderedSongIds.entries()) {
        const match = items.find((as) => as.songId === songId)
        if (match) {
          await db.albumSongs.update(match.id, { trackNumber: index + 1 })
        }
      }
    })
  } catch (error) {
    console.warn('reorderTracks failed:', error)
    throw error
  }
}
