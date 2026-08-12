import type { IdeaMedia, NoteEvent, SequenceNote } from '@/types/idea'

export type QuickCaptureBlockType =
  | 'audio'
  | 'audio-import'
  | 'midi'
  | 'notes'
  | 'image'
  | 'file'

export type QuickCaptureBlock =
  | {
      id: string
      type: 'audio'
      source: 'record' | 'import'
      blob: Blob | null
      filename: string | null
      mediaId?: string
      dirty?: boolean
    }
  | {
      id: string
      type: 'midi'
      noteEvents: NoteEvent[]
      bpm: number
      mediaId?: string
      dirty?: boolean
    }
  | {
      id: string
      type: 'notes'
      notes: SequenceNote[]
      label: string | null
      mediaId?: string
      dirty?: boolean
    }
  | {
      id: string
      type: 'image'
      file: File | null
      previewUrl: string | null
      mediaId?: string
      dirty?: boolean
    }
  | {
      id: string
      type: 'file'
      file: File | null
      mediaId?: string
      dirty?: boolean
    }

export function createEmptyBlock(
  type: Exclude<QuickCaptureBlockType, 'audio-import'>,
): QuickCaptureBlock {
  const id = crypto.randomUUID()

  switch (type) {
    case 'audio':
      return {
        id,
        type: 'audio',
        source: 'record',
        blob: null,
        filename: null,
        dirty: true,
      }
    case 'midi':
      return { id, type: 'midi', noteEvents: [], bpm: 120, dirty: true }
    case 'notes':
      return { id, type: 'notes', notes: [], label: null, dirty: true }
    case 'image':
      return { id, type: 'image', file: null, previewUrl: null, dirty: true }
    case 'file':
      return { id, type: 'file', file: null, dirty: true }
  }
}

export function createAudioImportBlock(
  blob: Blob,
  filename: string,
): QuickCaptureBlock {
  return {
    id: crypto.randomUUID(),
    type: 'audio',
    source: 'import',
    blob,
    filename,
    dirty: true,
  }
}

export function blockHasContent(block: QuickCaptureBlock): boolean {
  switch (block.type) {
    case 'audio':
      return block.blob !== null
    case 'midi':
      return block.noteEvents.length > 0
    case 'notes':
      return block.notes.length > 0
    case 'image':
    case 'file':
      return block.file !== null
  }
}

export const BLOCK_LABELS: Record<
  'audio' | 'midi' | 'notes' | 'image' | 'file',
  string
> = {
  audio: 'Record Audio',
  midi: 'MIDI',
  notes: 'Note Picker',
  image: 'Photo / Image',
  file: 'File',
}

export function getBlockLabel(block: QuickCaptureBlock): string {
  if (block.type === 'audio' && block.source === 'import') {
    return 'Import Audio'
  }
  return BLOCK_LABELS[block.type]
}

function blobToFile(blob: Blob, filename: string, mimeType: string): File {
  return new File([blob], filename, { type: mimeType || blob.type })
}

/** Map persisted idea media into editor content blocks. */
export function mediaItemsToBlocks(media: IdeaMedia[]): QuickCaptureBlock[] {
  const blocks: QuickCaptureBlock[] = []

  for (const item of media) {
    if (item.type === 'audio') {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'audio',
        source: 'import',
        blob: item.blob,
        filename: item.filename,
        mediaId: item.id,
        dirty: false,
      })
      continue
    }

    if (item.type === 'midi') {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'midi',
        noteEvents: item.noteData ?? [],
        bpm: 120,
        mediaId: item.id,
        dirty: false,
      })
      continue
    }

    if (item.type === 'image') {
      const file = blobToFile(item.blob, item.filename, item.mimeType)
      blocks.push({
        id: crypto.randomUUID(),
        type: 'image',
        file,
        previewUrl: URL.createObjectURL(item.blob),
        mediaId: item.id,
        dirty: false,
      })
      continue
    }

    if (item.type === 'file') {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'file',
        file: blobToFile(item.blob, item.filename, item.mimeType),
        mediaId: item.id,
        dirty: false,
      })
    }
  }

  return blocks
}
