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

export type IdeaStatus = 'raw' | 'developed' | 'used' | 'archived'

export type IdeaMediaType = 'audio' | 'midi' | 'image' | 'file'

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
  instrumentName: string | null
  patchName: string | null
  patchSettings: Record<string, string> | null
  lyrics: string | null
  notes: string | null
  status: IdeaStatus
  createdAt: string
  updatedAt: string
}

export interface IdeaMedia {
  id: string
  ideaId: string
  type: IdeaMediaType
  filename: string
  mimeType: string
  blob: Blob
  duration: number | null
  noteData: NoteEvent[] | null
  sortOrder: number
  createdAt: string
}

export interface IdeaNoteSequence {
  id: string
  ideaId: string
  notes: SequenceNote[]
  label: string | null
  createdAt: string
}
