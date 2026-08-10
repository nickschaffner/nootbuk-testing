import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { SongReference, SongReferenceType } from '@/types/song'

type CreateReferenceInput = Omit<
  SongReference,
  'id' | 'createdAt' | 'sortOrder'
> & {
  sortOrder?: number
}

type UpdateReferenceInput = Partial<Omit<SongReference, 'id' | 'createdAt'>> & {
  id: string
}

async function nextReferenceSortOrder(songId: string): Promise<number> {
  const references = await db.songReferences.where('songId').equals(songId).toArray()

  if (references.length === 0) {
    return 0
  }

  return Math.max(...references.map((item) => item.sortOrder)) + 1
}

export function useReferencesForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getReferencesForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export async function getReferencesForSong(
  songId: string,
): Promise<SongReference[]> {
  try {
    return await db.songReferences.where('songId').equals(songId).sortBy('sortOrder')
  } catch (error) {
    console.warn('getReferencesForSong failed:', error)
    throw error
  }
}

export async function createReference(
  input: CreateReferenceInput,
): Promise<SongReference> {
  try {
    const reference: SongReference = {
      id: crypto.randomUUID(),
      songId: input.songId,
      type: input.type,
      content: input.content,
      audioBlob: input.audioBlob ?? null,
      sortOrder:
        input.sortOrder ?? (await nextReferenceSortOrder(input.songId)),
      createdAt: new Date().toISOString(),
    }

    await db.songReferences.add(reference)
    return reference
  } catch (error) {
    console.warn('createReference failed:', error)
    throw error
  }
}

export async function updateReference(
  input: UpdateReferenceInput,
): Promise<SongReference> {
  try {
    const existing = await db.songReferences.get(input.id)
    if (!existing) {
      throw new Error(`Reference not found: ${input.id}`)
    }

    const updated: SongReference = {
      ...existing,
      ...input,
    }

    await db.songReferences.put(updated)
    return updated
  } catch (error) {
    console.warn('updateReference failed:', error)
    throw error
  }
}

export async function deleteReference(id: string): Promise<void> {
  try {
    await db.songReferences.delete(id)
  } catch (error) {
    console.warn('deleteReference failed:', error)
    throw error
  }
}

export async function addTextReference(
  songId: string,
  content: string,
): Promise<SongReference> {
  return createReference({ songId, type: 'text', content, audioBlob: null })
}

export async function addLinkReference(
  songId: string,
  url: string,
): Promise<SongReference> {
  return createReference({ songId, type: 'link', content: url, audioBlob: null })
}

export async function addAudioReference(
  songId: string,
  file: File,
): Promise<SongReference> {
  return createReference({
    songId,
    type: 'audio' as SongReferenceType,
    content: file.name,
    audioBlob: file,
  })
}
