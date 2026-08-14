import { useLiveQuery } from 'dexie-react-hooks'

import { getAudioMimeType, normalizeAudioBlob } from '@/lib/audio'
import { db } from '@/lib/db'
import { getMidiDuration, midiBlobToNoteEvents, noteEventsToMidiBlob } from '@/lib/midi'
import { sequenceNotesToNoteEvents } from '@/lib/sequence-playback'
import { toStorageError } from '@/lib/storage'
import type { IdeaMedia, IdeaMediaSource, NoteEvent, SequenceNote } from '@/types/idea'

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
    velocity: Math.max(
      1,
      Math.min(127, Math.round(Number(note.velocity) || 96)),
    ),
  }))
}

async function nextMediaSortOrder(ideaId: string): Promise<number> {
  const media = await db.ideaMedia.where('ideaId').equals(ideaId).toArray()

  if (media.length === 0) {
    return 0
  }

  return Math.max(...media.map((item) => item.sortOrder)) + 1
}

function inferMidiSource(item: {
  source?: IdeaMediaSource | null
  filename?: string
}): IdeaMediaSource {
  if (item.source === 'notepicker' || item.source === 'recording' || item.source === 'extraction') {
    return item.source
  }

  const name = (item.filename ?? '').toLowerCase()
  if (name.startsWith('recording-') || name.includes('-recording-')) {
    return 'recording'
  }
  if (name.startsWith('extraction-') || name.includes('-extraction-')) {
    return 'extraction'
  }
  return 'notepicker'
}

/** Audio: zero-or-one per idea. MIDI: zero-or-one per (ideaId, source). */
async function removeExistingExclusiveMedia(
  ideaId: string,
  type: 'audio' | 'midi',
  source?: IdeaMediaSource | null,
): Promise<void> {
  const existing = await db.ideaMedia
    .where('ideaId')
    .equals(ideaId)
    .filter((item) => {
      if (item.type !== type) {
        return false
      }
      if (type === 'audio') {
        return true
      }
      return inferMidiSource(item) === (source ?? 'notepicker')
    })
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
  const withSource: IdeaMedia =
    item.type === 'midi'
      ? { ...item, source: inferMidiSource(item) }
      : { ...item, source: item.source ?? null }

  if (withSource.type === 'midi') {
    if (withSource.noteData && withSource.noteData.length > 0) {
      return withSource
    }

    try {
      const noteData = await midiBlobToNoteEvents(withSource.blob)
      if (noteData.length === 0) {
        return withSource
      }

      void db.ideaMedia.update(withSource.id, { noteData }).catch((error) => {
        console.warn('rehydrateMedia midi noteData update failed:', error)
      })

      return { ...withSource, noteData }
    } catch (error) {
      console.warn('rehydrateMedia midi failed:', error)
      return withSource
    }
  }

  if (withSource.type !== 'audio') {
    return withSource
  }

  try {
    const mimeType = getAudioMimeType(withSource.filename, withSource.mimeType)
    const blob = await normalizeAudioBlob(
      withSource.blob,
      mimeType,
      withSource.filename,
    )

    if (blob === withSource.blob && mimeType === withSource.mimeType) {
      return withSource
    }

    if (withSource.mimeType !== mimeType || withSource.blob.type !== mimeType) {
      void db.ideaMedia.update(withSource.id, { mimeType, blob }).catch((error) => {
        console.warn('rehydrateMedia audio update failed:', error)
      })
    }

    return {
      ...withSource,
      mimeType,
      blob,
    }
  } catch (error) {
    console.warn('rehydrateMedia audio failed:', error)
    return withSource
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
    const source =
      input.type === 'midi'
        ? (input.source ?? inferMidiSource({ filename: input.filename }))
        : null

    if (input.type === 'audio') {
      await removeExistingExclusiveMedia(input.ideaId, 'audio')
    } else if (input.type === 'midi') {
      await removeExistingExclusiveMedia(input.ideaId, 'midi', source)
    }

    const media: IdeaMedia = {
      id: crypto.randomUUID(),
      ideaId: input.ideaId,
      type: input.type,
      source,
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

/** Save a manual note sequence as the idea's Note Picker MIDI source. */
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
    source: 'notepicker',
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
