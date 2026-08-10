import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { AlbumReferenceFile } from '@/types/album'

export function useAlbumReferenceFiles(albumId: string | undefined) {
  return useLiveQuery(
    () => (albumId ? getAlbumReferenceFiles(albumId) : Promise.resolve([])),
    [albumId],
  )
}

export async function getAlbumReferenceFiles(
  albumId: string,
): Promise<AlbumReferenceFile[]> {
  try {
    const files = await db.albumReferenceFiles
      .where('albumId')
      .equals(albumId)
      .toArray()
    return files.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  } catch (error) {
    console.warn('getAlbumReferenceFiles failed:', error)
    throw error
  }
}

export async function addAlbumReferenceFile(
  albumId: string,
  file: File,
): Promise<AlbumReferenceFile> {
  try {
    const referenceFile: AlbumReferenceFile = {
      id: crypto.randomUUID(),
      albumId,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      blob: file,
      createdAt: new Date().toISOString(),
    }

    await db.albumReferenceFiles.add(referenceFile)
    return referenceFile
  } catch (error) {
    console.warn('addAlbumReferenceFile failed:', error)
    throw error
  }
}

export async function removeAlbumReferenceFile(id: string): Promise<void> {
  try {
    await db.albumReferenceFiles.delete(id)
  } catch (error) {
    console.warn('removeAlbumReferenceFile failed:', error)
    throw error
  }
}
