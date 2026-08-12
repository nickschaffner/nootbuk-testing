import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { Album, AlbumFormat } from '@/types/album'

type CreateAlbumInput = Omit<Album, 'id' | 'createdAt' | 'updatedAt' | 'format'> & {
  format?: AlbumFormat
}

type UpdateAlbumInput = Partial<Omit<Album, 'id' | 'createdAt'>> & {
  id: string
}

export function useAllAlbums() {
  return useLiveQuery(() => getAllAlbums(), [])
}

export function useAlbum(albumId: string | undefined) {
  return useLiveQuery(
    () => (albumId ? db.albums.get(albumId) : undefined),
    [albumId],
  )
}

export async function getAllAlbums(): Promise<Album[]> {
  try {
    const albums = await db.albums.toArray()
    return albums.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  } catch (error) {
    console.warn('getAllAlbums failed:', error)
    throw error
  }
}

export async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  try {
    const now = new Date().toISOString()
    const album: Album = {
      id: crypto.randomUUID(),
      title: input.title,
      status: input.status ?? 'draft',
      format: input.format ?? 'ep',
      artworkBlob: input.artworkBlob ?? null,
      releaseDate: input.releaseDate ?? null,
      credits: input.credits ?? null,
      label: input.label ?? null,
      catalogNumber: input.catalogNumber ?? null,
      globalNotes: input.globalNotes ?? null,
      referenceMaterial: input.referenceMaterial ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    }

    await db.albums.add(album)
    return album
  } catch (error) {
    console.warn('createAlbum failed:', error)
    throw error
  }
}

export async function updateAlbum(input: UpdateAlbumInput): Promise<Album> {
  try {
    const existing = await db.albums.get(input.id)
    if (!existing) {
      throw new Error(`Album not found: ${input.id}`)
    }

    const updated: Album = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    }

    await db.albums.put(updated)
    return updated
  } catch (error) {
    console.warn('updateAlbum failed:', error)
    throw error
  }
}

export async function deleteAlbum(id: string): Promise<void> {
  try {
    await db.transaction(
      'rw',
      [db.albums, db.albumSongs, db.albumReferenceFiles],
      async () => {
        await db.albumSongs.where('albumId').equals(id).delete()
        await db.albumReferenceFiles.where('albumId').equals(id).delete()
        await db.albums.delete(id)
      },
    )
  } catch (error) {
    console.warn('deleteAlbum failed:', error)
    throw error
  }
}
