export type IdeaRole =
  | 'melody'
  | 'bassline'
  | 'chords'
  | 'drums'
  | 'riff'
  | 'synth'
  | 'vocal'
  | 'texture'
  | 'sample'
  | 'other'

export type SectionIntent =
  | 'verse'
  | 'chorus'
  | 'bridge'
  | 'pre-chorus'
  | 'intro'
  | 'outro'
  | 'breakdown'
  | 'solo'
  | 'unassigned'

export type IdeaMediaType = 'audio' | 'midi' | 'image' | 'file'

/** Capture slot on an idea — zero-or-one of each. Null for image/file. */
export type IdeaMediaSource =
  | 'audio-recording'
  | 'audio-import'
  | 'midi-recording'
  | 'step-input'
  | 'midi-extraction'
  | 'midi-import'

export type NoteDuration =
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'

export interface NoteEvent {
  pitch: number
  startTime: number
  duration: number
  velocity: number
}

export interface SequenceNote {
  pitch: number
  octave: number
  name: string
  duration: NoteDuration
  isChord: boolean
  chordName: string | null
}

export interface Idea {
  id: string
  songId: string | null
  sectionId: string | null
  sortOrder: number
  role: IdeaRole
  sectionIntent: SectionIntent | null
  key: string | null
  tempo: number | null
  timeSignature: string | null
  instrumentId: string | null
  instrumentName: string | null
  patchName: string | null
  patchSettings: Record<string, string> | null
  lyrics: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface IdeaMedia {
  id: string
  ideaId: string
  type: IdeaMediaType
  /** Set for audio and midi slots; null for image/file. */
  source: IdeaMediaSource | null
  filename: string
  mimeType: string
  blob: Blob
  duration: number | null
  noteData: NoteEvent[] | null
  sortOrder: number
  createdAt: string
}
