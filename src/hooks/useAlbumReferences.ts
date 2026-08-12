import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { AlbumReference } from '@/types/album'

type CreateAlbumReferenceInput = Omit<
  AlbumReference,
  'id' | 'createdAt' | 'sortOrder'
> & {
  sortOrder?: number
}

type UpdateAlbumReferenceInput = Partial<
  Omit<AlbumReference, 'id' | 'createdAt'>
> & {
  id: string
}

async function nextAlbumReferenceSortOrder(albumId: string): Promise<number> {
  const references = await db.albumReferences
    .where('albumId')
    .equals(albumId)
    .toArray()

  if (references.length === 0) {
    return 0
  }

  return Math.max(...references.map((item) => item.sortOrder)) + 1
}

export function useReferencesForAlbum(albumId: string | undefined) {
  return useLiveQuery(
    () => (albumId ? getReferencesForAlbum(albumId) : Promise.resolve([])),
    [albumId],
  )
}

export async function getReferencesForAlbum(
  albumId: string,
): Promise<AlbumReference[]> {
  try {
    return await db.albumReferences
      .where('albumId')
      .equals(albumId)
      .sortBy('sortOrder')
  } catch (error) {
    console.warn('getReferencesForAlbum failed:', error)
    throw error
  }
}

export async function createAlbumReference(
  input: CreateAlbumReferenceInput,
): Promise<AlbumReference> {
  try {
    const reference: AlbumReference = {
      id: crypto.randomUUID(),
      albumId: input.albumId,
      text: input.text ?? null,
      url: input.url ?? null,
      audioBlob: input.audioBlob ?? null,
      attachmentBlob: input.attachmentBlob ?? null,
      attachmentFilename: input.attachmentFilename ?? null,
      attachmentMimeType: input.attachmentMimeType ?? null,
      sortOrder:
        input.sortOrder ?? (await nextAlbumReferenceSortOrder(input.albumId)),
      createdAt: new Date().toISOString(),
    }

    await db.albumReferences.add(reference)
    return reference
  } catch (error) {
    console.warn('createAlbumReference failed:', error)
    throw error
  }
}

export async function updateAlbumReference(
  input: UpdateAlbumReferenceInput,
): Promise<AlbumReference> {
  try {
    const existing = await db.albumReferences.get(input.id)
    if (!existing) {
      throw new Error(`Album reference not found: ${input.id}`)
    }

    const updated: AlbumReference = {
      ...existing,
      ...input,
    }

    await db.albumReferences.put(updated)
    return updated
  } catch (error) {
    console.warn('updateAlbumReference failed:', error)
    throw error
  }
}

export async function deleteAlbumReference(id: string): Promise<void> {
  try {
    await db.albumReferences.delete(id)
  } catch (error) {
    console.warn('deleteAlbumReference failed:', error)
    throw error
  }
}

export async function addAlbumTextReference(
  albumId: string,
  text: string,
): Promise<AlbumReference> {
  return createAlbumReference({
    albumId,
    text,
    url: null,
    audioBlob: null,
    attachmentBlob: null,
    attachmentFilename: null,
    attachmentMimeType: null,
  })
}

export async function addAlbumLinkReference(
  albumId: string,
  url: string,
): Promise<AlbumReference> {
  return createAlbumReference({
    albumId,
    text: null,
    url,
    audioBlob: null,
    attachmentBlob: null,
    attachmentFilename: null,
    attachmentMimeType: null,
  })
}

export async function addAlbumAudioReference(
  albumId: string,
  file: File,
): Promise<AlbumReference> {
  return createAlbumReference({
    albumId,
    text: file.name,
    url: null,
    audioBlob: file,
    attachmentBlob: null,
    attachmentFilename: null,
    attachmentMimeType: null,
  })
}
