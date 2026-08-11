import { useLiveQuery } from 'dexie-react-hooks'

import { getAudioMimeType, normalizeAudioBlob } from '@/lib/audio'
import { db } from '@/lib/db'
import { toStorageError } from '@/lib/storage'
import type { IdeaMedia } from '@/types/idea'

type AddMediaInput = Omit<IdeaMedia, 'id' | 'createdAt' | 'sortOrder'> & {
  sortOrder?: number
}

async function nextMediaSortOrder(ideaId: string): Promise<number> {
  const media = await db.ideaMedia.where('ideaId').equals(ideaId).toArray()

  if (media.length === 0) {
    return 0
  }

  return Math.max(...media.map((item) => item.sortOrder)) + 1
}

export function useMediaForIdea(ideaId: string | undefined) {
  return useLiveQuery(
    () => (ideaId ? getMediaForIdea(ideaId) : Promise.resolve([])),
    [ideaId],
  )
}

export async function getMediaForIdea(ideaId: string): Promise<IdeaMedia[]> {
  try {
    const media = await db.ideaMedia.where('ideaId').equals(ideaId).sortBy('sortOrder')
    return Promise.all(media.map((item) => rehydrateMediaBlob(item)))
  } catch (error) {
    console.warn('getMediaForIdea failed:', error)
    throw error
  }
}

async function rehydrateMediaBlob(item: IdeaMedia): Promise<IdeaMedia> {
  if (item.type !== 'audio') {
    return item
  }

  try {
    const mimeType = getAudioMimeType(item.filename, item.mimeType)
    const blob = await normalizeAudioBlob(item.blob, mimeType, item.filename)

    if (blob === item.blob && mimeType === item.mimeType) {
      return item
    }

    if (item.mimeType !== mimeType || item.blob.type !== mimeType) {
      void db.ideaMedia.update(item.id, { mimeType, blob }).catch((error) => {
        console.warn('rehydrateMediaBlob update failed:', error)
      })
    }

    return {
      ...item,
      mimeType,
      blob,
    }
  } catch (error) {
    console.warn('rehydrateMediaBlob failed:', error)
    return item
  }
}

export async function addMediaToIdea(input: AddMediaInput): Promise<IdeaMedia> {
  try {
    const mimeType =
      input.type === 'audio'
        ? getAudioMimeType(input.filename, input.mimeType)
        : input.mimeType
    const blob =
      input.type === 'audio'
        ? await normalizeAudioBlob(input.blob, mimeType, input.filename)
        : input.blob

    const media: IdeaMedia = {
      id: crypto.randomUUID(),
      ideaId: input.ideaId,
      type: input.type,
      filename: input.filename,
      mimeType,
      blob,
      duration: input.duration ?? null,
      noteData: input.noteData ?? null,
      sortOrder: input.sortOrder ?? (await nextMediaSortOrder(input.ideaId)),
      createdAt: new Date().toISOString(),
    }

    await db.ideaMedia.add(media)
    return media
  } catch (error) {
    console.warn('addMediaToIdea failed:', error)
    throw toStorageError(error)
  }
}

export async function removeMedia(id: string): Promise<void> {
  try {
    await db.ideaMedia.delete(id)
  } catch (error) {
    console.warn('removeMedia failed:', error)
    throw error
  }
}
