import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/lib/db'
import type { IdeaNoteSequence, SequenceNote } from '@/types/idea'

type CreateNoteSequenceInput = {
  ideaId: string
  notes: SequenceNote[]
  label?: string | null
}

type UpdateNoteSequenceInput = {
  id: string
  notes?: SequenceNote[]
  label?: string | null
}

export function useNoteSequencesForIdea(ideaId: string | undefined) {
  return useLiveQuery(
    () => (ideaId ? getNoteSequencesForIdea(ideaId) : Promise.resolve([])),
    [ideaId],
  )
}

export async function getNoteSequencesForIdea(
  ideaId: string,
): Promise<IdeaNoteSequence[]> {
  try {
    return await db.ideaNoteSequences.where('ideaId').equals(ideaId).toArray()
  } catch (error) {
    console.warn('getNoteSequencesForIdea failed:', error)
    throw error
  }
}

export async function createNoteSequence(
  input: CreateNoteSequenceInput,
): Promise<IdeaNoteSequence> {
  try {
    const sequence: IdeaNoteSequence = {
      id: crypto.randomUUID(),
      ideaId: input.ideaId,
      notes: input.notes,
      label: input.label ?? null,
      createdAt: new Date().toISOString(),
    }

    await db.ideaNoteSequences.add(sequence)
    return sequence
  } catch (error) {
    console.warn('createNoteSequence failed:', error)
    throw error
  }
}

export async function updateNoteSequence(
  input: UpdateNoteSequenceInput,
): Promise<IdeaNoteSequence> {
  try {
    const existing = await db.ideaNoteSequences.get(input.id)
    if (!existing) {
      throw new Error(`Note sequence not found: ${input.id}`)
    }

    const updated: IdeaNoteSequence = {
      ...existing,
      notes: input.notes ?? existing.notes,
      label: input.label === undefined ? existing.label : input.label,
    }

    await db.ideaNoteSequences.put(updated)
    return updated
  } catch (error) {
    console.warn('updateNoteSequence failed:', error)
    throw error
  }
}

export async function deleteNoteSequence(id: string): Promise<void> {
  try {
    await db.ideaNoteSequences.delete(id)
  } catch (error) {
    console.warn('deleteNoteSequence failed:', error)
    throw error
  }
}
