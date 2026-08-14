import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { Instrument } from '@/types/instrument'

type CreateInstrumentInput = Omit<Instrument, 'id' | 'createdAt' | 'updatedAt'>

type UpdateInstrumentInput = Partial<Omit<Instrument, 'id' | 'createdAt'>> & {
  id: string
}

export function useAllInstruments() {
  return useLiveQuery(() => getAllInstruments(), [])
}

export function useInstrument(instrumentId: string | undefined) {
  return useLiveQuery(
    () => (instrumentId ? db.instruments.get(instrumentId) : undefined),
    [instrumentId],
  )
}

export function useIdeaCountForInstrument(instrumentId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!instrumentId) {
        return 0
      }
      return db.ideas.where('instrumentId').equals(instrumentId).count()
    },
    [instrumentId],
  )
}

export async function getAllInstruments(): Promise<Instrument[]> {
  try {
    return await db.instruments.orderBy('createdAt').reverse().toArray()
  } catch (error) {
    console.warn('getAllInstruments failed:', error)
    throw error
  }
}

export async function getIdeaCountsByInstrument(): Promise<Map<string, number>> {
  try {
    const ideas = await db.ideas
      .filter((idea) => idea.instrumentId !== null)
      .toArray()
    const counts = new Map<string, number>()
    for (const idea of ideas) {
      if (!idea.instrumentId) continue
      counts.set(idea.instrumentId, (counts.get(idea.instrumentId) ?? 0) + 1)
    }
    return counts
  } catch (error) {
    console.warn('getIdeaCountsByInstrument failed:', error)
    throw error
  }
}

export function useIdeaCountsByInstrument() {
  return useLiveQuery(() => getIdeaCountsByInstrument(), [])
}

export async function createInstrument(
  input: CreateInstrumentInput,
): Promise<Instrument> {
  try {
    const now = new Date().toISOString()
    const instrument = {
      name: input.name,
      type: input.type,
      defaultPatch: input.defaultPatch ?? null,
      createdAt: now,
      updatedAt: now,
    }

    const id = await db.instruments.add(instrument)
    return { ...instrument, id }
  } catch (error) {
    console.warn('createInstrument failed:', error)
    throw error
  }
}

export async function updateInstrument(
  input: UpdateInstrumentInput,
): Promise<Instrument> {
  try {
    const existing = await db.instruments.get(input.id)
    if (!existing) {
      throw new Error(`Instrument not found: ${input.id}`)
    }

    const updated: Instrument = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    }

    await db.instruments.put(updated)
    return updated
  } catch (error) {
    console.warn('updateInstrument failed:', error)
    throw error
  }
}

export async function deleteInstrument(id: string): Promise<void> {
  try {
    await db.transaction('rw', [db.instruments, db.ideas], async () => {
      await db.ideas.where('instrumentId').equals(id).modify({
        instrumentId: null,
        updatedAt: new Date().toISOString(),
      })
      await db.instruments.delete(id)
    })
  } catch (error) {
    console.warn('deleteInstrument failed:', error)
    throw error
  }
}
