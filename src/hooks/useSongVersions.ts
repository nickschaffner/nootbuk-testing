import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { SongVersion } from '@/types/song'

export function useVersionsForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getVersionsForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export async function getVersionsForSong(
  songId: string,
): Promise<SongVersion[]> {
  try {
    const versions = await db.songVersions
      .where('songId')
      .equals(songId)
      .toArray()
    return versions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  } catch (error) {
    console.warn('getVersionsForSong failed:', error)
    throw error
  }
}

export async function addVersion(
  songId: string,
  file: File,
  label: string | null = null,
  isMain = false,
): Promise<SongVersion> {
  try {
    if (isMain) {
      await db.songVersions
        .where('songId')
        .equals(songId)
        .modify({ isMain: false })
    }

    const version: SongVersion = {
      id: crypto.randomUUID(),
      songId,
      label,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      blob: file,
      isMain,
      createdAt: new Date().toISOString(),
    }

    await db.songVersions.add(version)
    return version
  } catch (error) {
    console.warn('addVersion failed:', error)
    throw error
  }
}

export async function removeVersion(id: string): Promise<void> {
  try {
    await db.songVersions.delete(id)
  } catch (error) {
    console.warn('removeVersion failed:', error)
    throw error
  }
}

export async function setMainVersion(
  id: string,
  songId: string,
): Promise<SongVersion> {
  try {
    const existing = await db.songVersions.get(id)
    if (!existing) {
      throw new Error(`Version not found: ${id}`)
    }

    await db.transaction('rw', db.songVersions, async () => {
      await db.songVersions
        .where('songId')
        .equals(songId)
        .modify({ isMain: false })
      await db.songVersions.update(id, { isMain: true })
    })

    return { ...existing, isMain: true }
  } catch (error) {
    console.warn('setMainVersion failed:', error)
    throw error
  }
}
