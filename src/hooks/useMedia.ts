import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
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
    return await db.ideaMedia.where('ideaId').equals(ideaId).sortBy('sortOrder')
  } catch (error) {
    console.warn('getMediaForIdea failed:', error)
    throw error
  }
}

export async function addMediaToIdea(input: AddMediaInput): Promise<IdeaMedia> {
  try {
    const media: IdeaMedia = {
      id: crypto.randomUUID(),
      ideaId: input.ideaId,
      type: input.type,
      filename: input.filename,
      mimeType: input.mimeType,
      blob: input.blob,
      duration: input.duration ?? null,
      noteData: input.noteData ?? null,
      sortOrder: input.sortOrder ?? (await nextMediaSortOrder(input.ideaId)),
      createdAt: new Date().toISOString(),
    }

    await db.ideaMedia.add(media)
    return media
  } catch (error) {
    console.warn('addMediaToIdea failed:', error)
    throw error
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
