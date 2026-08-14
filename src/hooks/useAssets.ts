import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import { toStorageError } from '@/lib/storage'
import type { SongAsset, SongAssetType } from '@/types/song'

export function useAssetsForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getAssetsForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export async function getAssetsForSong(songId: string): Promise<SongAsset[]> {
  try {
    const assets = await db.songAssets.where('songId').equals(songId).toArray()
    return assets.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  } catch (error) {
    console.warn('getAssetsForSong failed:', error)
    throw error
  }
}

export async function addAssetToSong(
  songId: string,
  file: File,
): Promise<SongAsset> {
  try {
    const type: SongAssetType = file.type.startsWith('image/')
      ? 'artwork'
      : 'file'

    const asset = {
      songId,
      type,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      blob: file,
      createdAt: new Date().toISOString(),
    }

    const id = await db.songAssets.add(asset)
    return { ...asset, id }
  } catch (error) {
    console.warn('addAssetToSong failed:', error)
    throw toStorageError(error)
  }
}

export async function removeAsset(id: string): Promise<void> {
  try {
    await db.songAssets.delete(id)
  } catch (error) {
    console.warn('removeAsset failed:', error)
    throw error
  }
}
