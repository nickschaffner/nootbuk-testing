import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { SongReference } from '@/types/song'

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
    const reference = {
      songId: input.songId,
      text: input.text ?? null,
      url: input.url ?? null,
      audioBlob: input.audioBlob ?? null,
      attachmentBlob: input.attachmentBlob ?? null,
      attachmentFilename: input.attachmentFilename ?? null,
      attachmentMimeType: input.attachmentMimeType ?? null,
      sortOrder:
        input.sortOrder ?? (await nextReferenceSortOrder(input.songId)),
      createdAt: new Date().toISOString(),
    }

    const id = await db.songReferences.add(reference)
    return { ...reference, id }
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
  text: string,
): Promise<SongReference> {
  return createReference({
    songId,
    text,
    url: null,
    audioBlob: null,
    attachmentBlob: null,
    attachmentFilename: null,
    attachmentMimeType: null,
  })
}

export async function addLinkReference(
  songId: string,
  url: string,
): Promise<SongReference> {
  return createReference({
    songId,
    text: null,
    url,
    audioBlob: null,
    attachmentBlob: null,
    attachmentFilename: null,
    attachmentMimeType: null,
  })
}

export async function addAudioReference(
  songId: string,
  file: File,
): Promise<SongReference> {
  return createReference({
    songId,
    text: file.name,
    url: null,
    audioBlob: file,
    attachmentBlob: null,
    attachmentFilename: null,
    attachmentMimeType: null,
  })
}
