import { useLiveQuery } from 'dexie-react-hooks'

import { getAudioMimeType, normalizeAudioBlob } from '@/lib/audio'
import { db } from '@/lib/db'
import { getMidiDuration, midiBlobToNoteEvents, noteEventsToMidiBlob } from '@/lib/midi'
import { sequenceNotesToNoteEvents } from '@/lib/sequence-playback'
import { toStorageError } from '@/lib/storage'
import type { IdeaMedia, NoteEvent, SequenceNote } from '@/types/idea'

type AddMediaInput = Omit<IdeaMedia, 'id' | 'createdAt' | 'sortOrder'> & {
  sortOrder?: number
}

function sanitizeNoteData(
  noteData: NoteEvent[] | null | undefined,
): NoteEvent[] | null {
  if (!noteData || noteData.length === 0) {
    return null
  }

  return noteData.map((note) => ({
    pitch: Number(note.pitch),
    startTime: Number(note.startTime),
    duration: Number(note.duration),
    velocity: Number(note.velocity),
  }))
}

async function nextMediaSortOrder(ideaId: string): Promise<number> {
  const media = await db.ideaMedia.where('ideaId').equals(ideaId).toArray()

  if (media.length === 0) {
    return 0
  }

  return Math.max(...media.map((item) => item.sortOrder)) + 1
}

/** Audio and MIDI are zero-or-one per idea; replace any existing of that type. */
async function removeExistingExclusiveMedia(
  ideaId: string,
  type: 'audio' | 'midi',
): Promise<void> {
  const existing = await db.ideaMedia
    .where('ideaId')
    .equals(ideaId)
    .filter((item) => item.type === type)
    .toArray()

  if (existing.length === 0) {
    return
  }

  await db.ideaMedia.bulkDelete(existing.map((item) => item.id))
}

export function useMediaForIdea(ideaId: string | undefined) {
  return useLiveQuery(
    () => (ideaId ? getMediaForIdea(ideaId) : Promise.resolve([])),
    [ideaId],
  )
}

export async function getMediaForIdea(ideaId: string): Promise<IdeaMedia[]> {
  try {
    const media = await db.ideaMedia.where('ideaId').equals(ideaId).toArray()
    media.sort((a, b) => a.sortOrder - b.sortOrder)
    return Promise.all(media.map((item) => rehydrateMedia(item)))
  } catch (error) {
    console.warn('getMediaForIdea failed:', error)
    throw error
  }
}

async function rehydrateMedia(item: IdeaMedia): Promise<IdeaMedia> {
  if (item.type === 'midi') {
    if (item.noteData && item.noteData.length > 0) {
      return item
    }

    try {
      const noteData = await midiBlobToNoteEvents(item.blob)
      if (noteData.length === 0) {
        return item
      }

      void db.ideaMedia.update(item.id, { noteData }).catch((error) => {
        console.warn('rehydrateMedia midi noteData update failed:', error)
      })

      return { ...item, noteData }
    } catch (error) {
      console.warn('rehydrateMedia midi failed:', error)
      return item
    }
  }

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
        console.warn('rehydrateMedia audio update failed:', error)
      })
    }

    return {
      ...item,
      mimeType,
      blob,
    }
  } catch (error) {
    console.warn('rehydrateMedia audio failed:', error)
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
    const noteData =
      input.type === 'midi' ? sanitizeNoteData(input.noteData) : input.noteData ?? null

    if (input.type === 'audio' || input.type === 'midi') {
      await removeExistingExclusiveMedia(input.ideaId, input.type)
    }

    const media: IdeaMedia = {
      id: crypto.randomUUID(),
      ideaId: input.ideaId,
      type: input.type,
      filename: input.filename,
      mimeType,
      blob,
      duration: input.duration ?? null,
      noteData,
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

/** Save a manual note sequence as the idea's single MIDI source. */
export async function addMidiFromSequenceNotes(input: {
  ideaId: string
  notes: SequenceNote[]
  label?: string | null
  bpm?: number
}): Promise<IdeaMedia> {
  const bpm = input.bpm ?? 120
  const noteData: NoteEvent[] = sequenceNotesToNoteEvents(input.notes, bpm)
  const blob = noteEventsToMidiBlob(noteData, bpm)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const safeLabel = input.label?.trim().replace(/[^\w\-]+/g, '-')
  const filename = safeLabel
    ? `${safeLabel}.mid`
    : `notes-${timestamp}.mid`

  return addMediaToIdea({
    ideaId: input.ideaId,
    type: 'midi',
    filename,
    mimeType: 'audio/midi',
    blob,
    duration: getMidiDuration(noteData),
    noteData,
  })
}

export async function removeMedia(id: string): Promise<void> {
  try {
    await db.ideaMedia.delete(id)
  } catch (error) {
    console.warn('removeMedia failed:', error)
    throw error
  }
}
