import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import { getIdeaDisplayLabel } from '@/lib/idea-label'
import { toStorageError } from '@/lib/storage'
import { createSong } from '@/hooks/useSongs'
import type { Idea } from '@/types/idea'
import type { Song } from '@/types/song'

type CreateIdeaInput = Omit<
  Idea,
  'id' | 'createdAt' | 'updatedAt' | 'sortOrder'
> & {
  sortOrder?: number
}

type UpdateIdeaInput = Partial<Omit<Idea, 'id' | 'createdAt'>> & {
  id: string
}

async function nextIdeaSortOrder(
  songId: string | null,
  sectionId: string | null,
): Promise<number> {
  const ideas = await db.ideas
    .filter((idea) => idea.songId === songId && idea.sectionId === sectionId)
    .toArray()

  if (ideas.length === 0) {
    return 0
  }

  return Math.max(...ideas.map((idea) => idea.sortOrder)) + 1
}

export function useAllIdeas() {
  return useLiveQuery(() => getAllIdeas(), [])
}

export function useIdeasInPool() {
  return useLiveQuery(() => getIdeasInPool(), [])
}

export async function getAllIdeas(): Promise<Idea[]> {
  try {
    const ideas = await db.ideas.toArray()
    return ideas.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  } catch (error) {
    console.warn('getAllIdeas failed:', error)
    throw error
  }
}

export function useIdeasForSong(songId: string | undefined) {
  return useLiveQuery(
    () => (songId ? getIdeasForSong(songId) : Promise.resolve([])),
    [songId],
  )
}

export function useIdeasForSection(sectionId: string | undefined) {
  return useLiveQuery(
    () => (sectionId ? getIdeasForSection(sectionId) : Promise.resolve([])),
    [sectionId],
  )
}

export async function getIdeasInPool(): Promise<Idea[]> {
  try {
    return await db.ideas
      .filter((idea) => idea.songId === null)
      .sortBy('sortOrder')
  } catch (error) {
    console.warn('getIdeasInPool failed:', error)
    throw error
  }
}

export async function getIdeasForSong(songId: string): Promise<Idea[]> {
  try {
    return await db.ideas.where('songId').equals(songId).sortBy('sortOrder')
  } catch (error) {
    console.warn('getIdeasForSong failed:', error)
    throw error
  }
}

export async function getIdeasForSection(sectionId: string): Promise<Idea[]> {
  try {
    return await db.ideas
      .where('sectionId')
      .equals(sectionId)
      .sortBy('sortOrder')
  } catch (error) {
    console.warn('getIdeasForSection failed:', error)
    throw error
  }
}

export async function createIdea(input: CreateIdeaInput): Promise<Idea> {
  try {
    const now = new Date().toISOString()
    const idea = {
      songId: input.songId ?? null,
      sectionId: input.sectionId ?? null,
      sortOrder:
        input.sortOrder ??
        (await nextIdeaSortOrder(input.songId ?? null, input.sectionId ?? null)),
      role: input.role,
      sectionIntent: input.sectionIntent ?? null,
      key: input.key ?? null,
      tempo: input.tempo ?? null,
      timeSignature: input.timeSignature ?? null,
      instrumentId: input.instrumentId ?? null,
      instrumentName: input.instrumentName ?? null,
      patchName: input.patchName ?? null,
      patchSettings: input.patchSettings ?? null,
      lyrics: input.lyrics ?? null,
      notes: input.notes ?? null,
      status: input.status ?? 'raw',
      createdAt: now,
      updatedAt: now,
    }

    const id = await db.ideas.add(idea)
    return { ...idea, id }
  } catch (error) {
    console.warn('createIdea failed:', error)
    throw toStorageError(error)
  }
}

export async function updateIdea(input: UpdateIdeaInput): Promise<Idea> {
  try {
    const existing = await db.ideas.get(input.id)
    if (!existing) {
      throw new Error(`Idea not found: ${input.id}`)
    }

    const updated: Idea = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    }

    await db.ideas.put(updated)
    return updated
  } catch (error) {
    console.warn('updateIdea failed:', error)
    throw error
  }
}

export async function deleteIdea(id: string): Promise<void> {
  try {
    await db.transaction('rw', db.ideas, db.ideaMedia, async () => {
      await db.ideaMedia.where('ideaId').equals(id).delete()
      await db.ideas.delete(id)
    })
  } catch (error) {
    console.warn('deleteIdea failed:', error)
    throw error
  }
}

export async function moveIdeaToSection(
  ideaId: string,
  songId: string | null,
  sectionId: string | null,
): Promise<Idea> {
  try {
    const existing = await db.ideas.get(ideaId)
    if (!existing) {
      throw new Error(`Idea not found: ${ideaId}`)
    }

    const sortOrder = await nextIdeaSortOrder(songId, sectionId)

    return await updateIdea({
      id: ideaId,
      songId,
      sectionId,
      sortOrder,
    })
  } catch (error) {
    console.warn('moveIdeaToSection failed:', error)
    throw error
  }
}

export async function moveIdeaToPool(ideaId: string): Promise<Idea> {
  return moveIdeaToSection(ideaId, null, null)
}

export async function reorderIdeas(orderedIds: string[]): Promise<void> {
  try {
    await db.transaction('rw', db.ideas, async () => {
      await Promise.all(
        orderedIds.map((id, index) =>
          db.ideas.update(id, { sortOrder: index, updatedAt: new Date().toISOString() }),
        ),
      )
    })
  } catch (error) {
    console.warn('reorderIdeas failed:', error)
    throw error
  }
}

async function duplicateIdeaMedia(sourceIdeaId: string, targetIdeaId: string) {
  const mediaItems = await db.ideaMedia.where('ideaId').equals(sourceIdeaId).toArray()
  for (const item of mediaItems) {
    const { id: _id, ...rest } = item
    await db.ideaMedia.add({
      ...rest,
      ideaId: targetIdeaId,
      createdAt: new Date().toISOString(),
    })
  }
}

export async function copyIdea(ideaId: string): Promise<Idea> {
  try {
    const existing = await db.ideas.get(ideaId)
    if (!existing) {
      throw new Error(`Idea not found: ${ideaId}`)
    }

    const now = new Date().toISOString()
    const sortOrder = await nextIdeaSortOrder(existing.songId, existing.sectionId)
    const { id: _id, ...rest } = existing
    const newIdea = {
      ...rest,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    }

    let created: Idea
    await db.transaction('rw', [db.ideas, db.ideaMedia], async () => {
      const id = await db.ideas.add(newIdea)
      created = { ...newIdea, id }
      await duplicateIdeaMedia(ideaId, id)
    })

    return created!
  } catch (error) {
    console.warn('copyIdea failed:', error)
    throw error
  }
}

export async function copyIdeaToSong(
  ideaId: string,
  songId: string,
  sectionId: string | null = null,
): Promise<Idea> {
  try {
    const existing = await db.ideas.get(ideaId)
    if (!existing) {
      throw new Error(`Idea not found: ${ideaId}`)
    }

    const now = new Date().toISOString()
    const sortOrder = await nextIdeaSortOrder(songId, sectionId)
    const { id: _id, ...rest } = existing
    const newIdea = {
      ...rest,
      songId,
      sectionId,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    }

    let created: Idea
    await db.transaction('rw', [db.ideas, db.ideaMedia], async () => {
      const id = await db.ideas.add(newIdea)
      created = { ...newIdea, id }
      await duplicateIdeaMedia(ideaId, id)
    })

    return created!
  } catch (error) {
    console.warn('copyIdeaToSong failed:', error)
    throw error
  }
}

export async function copyIdeaToPool(ideaId: string): Promise<Idea> {
  try {
    const existing = await db.ideas.get(ideaId)
    if (!existing) {
      throw new Error(`Idea not found: ${ideaId}`)
    }

    const now = new Date().toISOString()
    const sortOrder = await nextIdeaSortOrder(null, null)
    const { id: _id, ...rest } = existing
    const newIdea = {
      ...rest,
      songId: null,
      sectionId: null,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    }

    let created: Idea
    await db.transaction('rw', [db.ideas, db.ideaMedia], async () => {
      const id = await db.ideas.add(newIdea)
      created = { ...newIdea, id }
      await duplicateIdeaMedia(ideaId, id)
    })

    return created!
  } catch (error) {
    console.warn('copyIdeaToPool failed:', error)
    throw error
  }
}

function songDefaultsFromIdea(idea: Idea) {
  return {
    title: getIdeaDisplayLabel(idea),
    key: idea.key,
    tempo: idea.tempo,
    timeSignature: idea.timeSignature,
    status: 'sketch' as const,
    genre: null,
    lyrics: idea.lyrics,
    songwriter: null,
    publisher: null,
    ipiNumber: null,
    masterEngineer: null,
    copyright: null,
    sampleCredits: null,
  }
}

export async function turnIdeaIntoSong(
  ideaId: string,
): Promise<{ song: Song; idea: Idea }> {
  try {
    const existing = await db.ideas.get(ideaId)
    if (!existing) {
      throw new Error(`Idea not found: ${ideaId}`)
    }

    const song = await createSong(songDefaultsFromIdea(existing))
    const idea = await moveIdeaToSection(ideaId, song.id, null)
    return { song, idea }
  } catch (error) {
    console.warn('turnIdeaIntoSong failed:', error)
    throw error
  }
}

export async function copyIdeaIntoNewSong(
  ideaId: string,
): Promise<{ song: Song; idea: Idea }> {
  try {
    const existing = await db.ideas.get(ideaId)
    if (!existing) {
      throw new Error(`Idea not found: ${ideaId}`)
    }

    const song = await createSong(songDefaultsFromIdea(existing))
    const idea = await copyIdeaToSong(ideaId, song.id, null)
    return { song, idea }
  } catch (error) {
    console.warn('copyIdeaIntoNewSong failed:', error)
    throw error
  }
}
