import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { SongSection } from '@/types/song'

type CreateSectionInput = Omit<SongSection, 'id' | 'createdAt' | 'sortOrder'> & {
  sortOrder?: number
}

type UpdateSectionInput = Partial<Omit<SongSection, 'id' | 'createdAt'>> & {
  id: string
}

async function nextSectionSortOrder(songId: string): Promise<number> {
  const sections = await db.songSections.where('songId').equals(songId).toArray()

  if (sections.length === 0) {
    return 0
  }

  return Math.max(...sections.map((section) => section.sortOrder)) + 1
}

export function useSectionsForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getSectionsForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export async function getSectionsForSong(songId: string): Promise<SongSection[]> {
  try {
    return await db.songSections.where('songId').equals(songId).sortBy('sortOrder')
  } catch (error) {
    console.warn('getSectionsForSong failed:', error)
    throw error
  }
}

export async function createSection(
  input: CreateSectionInput,
): Promise<SongSection> {
  try {
    const section: SongSection = {
      id: crypto.randomUUID(),
      songId: input.songId,
      name: input.name,
      sortOrder:
        input.sortOrder ?? (await nextSectionSortOrder(input.songId)),
      lyrics: input.lyrics ?? null,
      createdAt: new Date().toISOString(),
    }

    await db.songSections.add(section)
    return section
  } catch (error) {
    console.warn('createSection failed:', error)
    throw error
  }
}

export async function updateSection(
  input: UpdateSectionInput,
): Promise<SongSection> {
  try {
    const existing = await db.songSections.get(input.id)
    if (!existing) {
      throw new Error(`Section not found: ${input.id}`)
    }

    const updated: SongSection = {
      ...existing,
      ...input,
    }

    await db.songSections.put(updated)
    return updated
  } catch (error) {
    console.warn('updateSection failed:', error)
    throw error
  }
}

export async function deleteSection(id: string): Promise<void> {
  try {
    await db.transaction('rw', [db.songSections, db.ideas], async () => {
      await db.ideas.where('sectionId').equals(id).modify({
        sectionId: null,
        updatedAt: new Date().toISOString(),
      })
      await db.songSections.delete(id)
    })
  } catch (error) {
    console.warn('deleteSection failed:', error)
    throw error
  }
}

export async function reorderSections(orderedIds: string[]): Promise<void> {
  try {
    await db.transaction('rw', db.songSections, async () => {
      await Promise.all(
        orderedIds.map((id, index) =>
          db.songSections.update(id, { sortOrder: index }),
        ),
      )
    })
  } catch (error) {
    console.warn('reorderSections failed:', error)
    throw error
  }
}
