import type { NoteEvent, SequenceNote } from '@/types/idea'

export type QuickCaptureBlockType =
  | 'audio'
  | 'audio-import'
  | 'midi'
  | 'notes'
  | 'text'
  | 'image'
  | 'file'

export type QuickCaptureBlock =
  | {
      id: string
      type: 'audio'
      blob: Blob | null
      filename: string | null
    }
  | {
      id: string
      type: 'audio-import'
      blob: Blob | null
      filename: string | null
    }
  | {
      id: string
      type: 'midi'
      noteEvents: NoteEvent[]
      bpm: number
    }
  | {
      id: string
      type: 'notes'
      notes: SequenceNote[]
      label: string | null
    }
  | {
      id: string
      type: 'text'
      content: string
    }
  | {
      id: string
      type: 'image'
      file: File | null
      previewUrl: string | null
    }
  | {
      id: string
      type: 'file'
      file: File | null
    }

export function createEmptyBlock(type: QuickCaptureBlockType): QuickCaptureBlock {
  const id = crypto.randomUUID()

  switch (type) {
    case 'audio':
      return { id, type: 'audio', blob: null, filename: null }
    case 'audio-import':
      return { id, type: 'audio-import', blob: null, filename: null }
    case 'midi':
      return { id, type: 'midi', noteEvents: [], bpm: 120 }
    case 'notes':
      return { id, type: 'notes', notes: [], label: null }
    case 'text':
      return { id, type: 'text', content: '' }
    case 'image':
      return { id, type: 'image', file: null, previewUrl: null }
    case 'file':
      return { id, type: 'file', file: null }
  }
}

export function blockHasContent(block: QuickCaptureBlock): boolean {
  switch (block.type) {
    case 'audio':
    case 'audio-import':
      return block.blob !== null
    case 'midi':
      return block.noteEvents.length > 0
    case 'notes':
      return block.notes.length > 0
    case 'text':
      return block.content.trim().length > 0
    case 'image':
    case 'file':
      return block.file !== null
  }
}

export const BLOCK_LABELS: Record<QuickCaptureBlockType, string> = {
  audio: 'Record Audio',
  'audio-import': 'Import Audio',
  midi: 'MIDI',
  notes: 'Note Picker',
  text: 'Text / Lyrics',
  image: 'Photo / Image',
  file: 'File',
}
