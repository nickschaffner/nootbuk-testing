import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { Song, SongSection } from '@/types/song'

export interface SongWithSections {
  song: Song
  sections: SongSection[]
}

type CreateSongInput = Omit<
  Song,
  'id' | 'createdAt' | 'updatedAt' | 'sortOrder'
> & {
  sortOrder?: number
}

type UpdateSongInput = Partial<Omit<Song, 'id' | 'createdAt'>> & {
  id: string
}

async function nextSongSortOrder(albumId: string | null): Promise<number> {
  const songs = await db.songs.filter((song) => song.albumId === albumId).toArray()

  if (songs.length === 0) {
    return 0
  }

  return Math.max(...songs.map((song) => song.sortOrder)) + 1
}

export function useAllSongs() {
  return useLiveQuery(() => getAllSongs(), [])
}

export function useSongWithSections(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getSongWithSections(songId) : Promise.resolve(undefined)),
    [songId],
  )
}

export async function getAllSongs(): Promise<Song[]> {
  try {
    const songs = await db.songs.toArray()
    return songs.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  } catch (error) {
    console.warn('getAllSongs failed:', error)
    throw error
  }
}

export async function getSongWithSections(
  songId: string,
): Promise<SongWithSections | undefined> {
  try {
    const song = await db.songs.get(songId)
    if (!song) {
      return undefined
    }

    const sections = await db.songSections
      .where('songId')
      .equals(songId)
      .sortBy('sortOrder')

    return { song, sections }
  } catch (error) {
    console.warn('getSongWithSections failed:', error)
    throw error
  }
}

export async function createSong(input: CreateSongInput): Promise<Song> {
  try {
    const now = new Date().toISOString()
    const song: Song = {
      id: crypto.randomUUID(),
      albumId: input.albumId ?? null,
      title: input.title,
      key: input.key ?? null,
      tempo: input.tempo ?? null,
      timeSignature: input.timeSignature ?? null,
      status: input.status ?? 'sketch',
      genre: input.genre ?? null,
      lyrics: input.lyrics ?? null,
      songwriter: input.songwriter ?? null,
      publisher: input.publisher ?? null,
      ipiNumber: input.ipiNumber ?? null,
      masterEngineer: input.masterEngineer ?? null,
      copyright: input.copyright ?? null,
      sampleCredits: input.sampleCredits ?? null,
      sortOrder:
        input.sortOrder ?? (await nextSongSortOrder(input.albumId ?? null)),
      createdAt: now,
      updatedAt: now,
    }

    await db.songs.add(song)
    return song
  } catch (error) {
    console.warn('createSong failed:', error)
    throw error
  }
}

export async function updateSong(input: UpdateSongInput): Promise<Song> {
  try {
    const existing = await db.songs.get(input.id)
    if (!existing) {
      throw new Error(`Song not found: ${input.id}`)
    }

    const updated: Song = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    }

    await db.songs.put(updated)
    return updated
  } catch (error) {
    console.warn('updateSong failed:', error)
    throw error
  }
}

export async function deleteSong(id: string): Promise<void> {
  try {
    await db.transaction(
      'rw',
      [
        db.songs,
        db.songSections,
        db.songJournalEntries,
        db.songReferences,
        db.songAssets,
        db.ideas,
        db.ideaMedia,
        db.ideaNoteSequences,
      ],
      async () => {
        const ideaIds = await db.ideas.where('songId').equals(id).primaryKeys()

        await Promise.all(
          ideaIds.map(async (ideaId) => {
            await db.ideaMedia.where('ideaId').equals(ideaId).delete()
            await db.ideaNoteSequences.where('ideaId').equals(ideaId).delete()
          }),
        )

        await db.ideas.where('songId').equals(id).delete()
        await db.songSections.where('songId').equals(id).delete()
        await db.songJournalEntries.where('songId').equals(id).delete()
        await db.songReferences.where('songId').equals(id).delete()
        await db.songAssets.where('songId').equals(id).delete()
        await db.songs.delete(id)
      },
    )
  } catch (error) {
    console.warn('deleteSong failed:', error)
    throw error
  }
}
