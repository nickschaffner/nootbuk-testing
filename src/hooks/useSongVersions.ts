import { useLiveQuery } from 'dexie-react-hooks'

import { getAudioDuration } from '@/lib/audio'
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

async function resolveVersionDuration(
  version: SongVersion,
): Promise<number | null> {
  if (version.duration != null && Number.isFinite(version.duration)) {
    return version.duration
  }

  try {
    const duration = await getAudioDuration(version.blob)
    void db.songVersions.update(version.id, { duration }).catch((error) => {
      console.warn('resolveVersionDuration update failed:', error)
    })
    return duration
  } catch (error) {
    console.warn('resolveVersionDuration failed:', error)
    return null
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

    let duration: number | null = null
    try {
      duration = await getAudioDuration(file)
    } catch (error) {
      console.warn('addVersion duration decode failed:', error)
    }

    const version: SongVersion = {
      id: crypto.randomUUID(),
      songId,
      label,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      blob: file,
      duration,
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

export async function getPlaybackVersionForSong(
  songId: string,
): Promise<SongVersion | null> {
  const versions = await getVersionsForSong(songId)
  if (versions.length === 0) {
    return null
  }

  return versions.find((version) => version.isMain) ?? versions[0]
}

/** Sum main (or most recent) version durations for the given song IDs. */
export async function getAlbumTotalDurationSeconds(
  songIds: string[],
): Promise<number> {
  let total = 0

  for (const songId of songIds) {
    const version = await getPlaybackVersionForSong(songId)
    if (!version) {
      continue
    }

    const duration = await resolveVersionDuration(version)
    if (duration != null && Number.isFinite(duration)) {
      total += duration
    }
  }

  return total
}

export function useAlbumTotalDurationSeconds(songIds: string[]) {
  const songIdsKey = songIds.join(',')
  return useLiveQuery(
    () =>
      songIds.length === 0
        ? Promise.resolve(0)
        : getAlbumTotalDurationSeconds(songIds),
    [songIdsKey],
  )
}

export function usePlaybackVersionsIndex() {
  return useLiveQuery(async () => {
    try {
      const allVersions = await db.songVersions.toArray()
      const bySong = new Map<string, SongVersion[]>()

      for (const version of allVersions) {
        const versions = bySong.get(version.songId) ?? []
        versions.push(version)
        bySong.set(version.songId, versions)
      }

      const index: Record<string, SongVersion> = {}
      for (const [songId, versions] of bySong) {
        versions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        index[songId] = versions.find((version) => version.isMain) ?? versions[0]
      }

      return index
    } catch (error) {
      console.warn('usePlaybackVersionsIndex failed:', error)
      throw error
    }
  }, [])
}

export async function updateVersion(
  input: Partial<Pick<SongVersion, 'label'>> & { id: string },
): Promise<SongVersion> {
  try {
    const existing = await db.songVersions.get(input.id)
    if (!existing) {
      throw new Error(`Version not found: ${input.id}`)
    }

    const updated: SongVersion = { ...existing, ...input }
    await db.songVersions.put(updated)
    return updated
  } catch (error) {
    console.warn('updateVersion failed:', error)
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
