import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { Idea } from '@/types/idea'

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

export function useIdeasInPool() {
  return useLiveQuery(() => getIdeasInPool(), [])
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
    const idea: Idea = {
      id: crypto.randomUUID(),
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
      instrumentName: input.instrumentName ?? null,
      patchName: input.patchName ?? null,
      patchSettings: input.patchSettings ?? null,
      lyrics: input.lyrics ?? null,
      notes: input.notes ?? null,
      status: input.status ?? 'raw',
      createdAt: now,
      updatedAt: now,
    }

    await db.ideas.add(idea)
    return idea
  } catch (error) {
    console.warn('createIdea failed:', error)
    throw error
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
    await db.transaction(
      'rw',
      db.ideas,
      db.ideaMedia,
      db.ideaNoteSequences,
      async () => {
        await db.ideaMedia.where('ideaId').equals(id).delete()
        await db.ideaNoteSequences.where('ideaId').equals(id).delete()
        await db.ideas.delete(id)
      },
    )
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
