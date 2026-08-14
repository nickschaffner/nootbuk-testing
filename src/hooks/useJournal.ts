import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { SongJournalEntry } from '@/types/song'

type CreateEntryInput = Omit<
  SongJournalEntry,
  'id' | 'createdAt' | 'updatedAt' | 'sortOrder'
> & {
  sortOrder?: number
}

type UpdateEntryInput = Partial<Omit<SongJournalEntry, 'id' | 'createdAt'>> & {
  id: string
}

async function nextJournalSortOrder(songId: string): Promise<number> {
  const entries = await db.songJournalEntries
    .where('songId')
    .equals(songId)
    .toArray()

  if (entries.length === 0) {
    return 0
  }

  return Math.max(...entries.map((entry) => entry.sortOrder)) + 1
}

export function useEntriesForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getEntriesForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export async function getEntriesForSong(
  songId: string,
): Promise<SongJournalEntry[]> {
  try {
    return await db.songJournalEntries
      .where('songId')
      .equals(songId)
      .sortBy('sortOrder')
  } catch (error) {
    console.warn('getEntriesForSong failed:', error)
    throw error
  }
}

export async function createEntry(
  input: CreateEntryInput,
): Promise<SongJournalEntry> {
  try {
    const now = new Date().toISOString()
    const entry = {
      songId: input.songId,
      topic: input.topic ?? null,
      content: input.content,
      sortOrder:
        input.sortOrder ?? (await nextJournalSortOrder(input.songId)),
      createdAt: now,
      updatedAt: now,
    }

    const id = await db.songJournalEntries.add(entry)
    return { ...entry, id }
  } catch (error) {
    console.warn('createEntry failed:', error)
    throw error
  }
}

export async function updateEntry(
  input: UpdateEntryInput,
): Promise<SongJournalEntry> {
  try {
    const existing = await db.songJournalEntries.get(input.id)
    if (!existing) {
      throw new Error(`Journal entry not found: ${input.id}`)
    }

    const updated: SongJournalEntry = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    }

    await db.songJournalEntries.put(updated)
    return updated
  } catch (error) {
    console.warn('updateEntry failed:', error)
    throw error
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    await db.songJournalEntries.delete(id)
  } catch (error) {
    console.warn('deleteEntry failed:', error)
    throw error
  }
}
