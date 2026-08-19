// ─────────────────────────────────────────────────────────────────────────
// Nootbuk option sets — mirrored verbatim from the working app so the kit's
// selectors offer the exact same choices. Display data only; no behavior.
// ─────────────────────────────────────────────────────────────────────────

export interface Option<T extends string = string> {
  value: T
  label: string
}

// Idea classification --------------------------------------------------------
export const IDEA_ROLES: Option[] = [
  { value: 'melody', label: 'Melody' },
  { value: 'bassline', label: 'Bassline' },
  { value: 'chords', label: 'Chords' },
  { value: 'drums', label: 'Drums' },
  { value: 'riff', label: 'Riff' },
  { value: 'synth', label: 'Synth' },
  { value: 'vocal', label: 'Vocal' },
  { value: 'texture', label: 'Texture' },
  { value: 'sample', label: 'Sample' },
  { value: 'other', label: 'Other' },
]

export const SECTION_INTENTS: Option[] = [
  { value: 'verse', label: 'Verse' },
  { value: 'chorus', label: 'Chorus' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'pre-chorus', label: 'Pre-Chorus' },
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Outro' },
  { value: 'breakdown', label: 'Breakdown' },
  { value: 'solo', label: 'Solo' },
  { value: 'unassigned', label: 'Unassigned' },
]

// Song / album lifecycle -----------------------------------------------------
export const SONG_STATUSES: Option[] = [
  { value: 'sketch', label: 'Sketch' },
  { value: 'writing', label: 'Writing' },
  { value: 'arranging', label: 'Arranging' },
  { value: 'production', label: 'Production' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'mastering', label: 'Mastering' },
  { value: 'released', label: 'Released' },
]

export const ALBUM_STATUSES: Option[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'released', label: 'Released' },
]

export const ALBUM_FORMATS: Option[] = [
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'lp', label: 'LP' },
]

// Musical parameters ---------------------------------------------------------
export const CHORD_TYPES: Option[] = [
  { value: 'major', label: 'MAJ' },
  { value: 'minor', label: 'MIN' },
  { value: '7', label: '7' },
  { value: 'min7', label: 'M7' },
  { value: 'maj7', label: 'MAJ7' },
  { value: 'sus2', label: 'SUS2' },
  { value: 'sus4', label: 'SUS4' },
  { value: 'dim', label: 'DIM' },
  { value: 'aug', label: 'AUG' },
]

export const SYNTH_PATCHES: Option[] = [
  { value: 'piano', label: 'Piano' },
  { value: 'electric-piano', label: 'E. Piano' },
  { value: 'bass', label: 'Bass' },
  { value: 'synth-bass', label: 'Synth Bass' },
  { value: 'brass', label: 'Brass' },
  { value: 'strings', label: 'Strings' },
  { value: 'synth-lead', label: 'Synth Lead' },
  { value: 'synth-pad', label: 'Synth Pad' },
  { value: 'mallet', label: 'Mallet' },
]

export const INSTRUMENT_TYPES: Option[] = [
  { value: 'bass', label: 'Bass' },
  { value: 'guitar', label: 'Guitar' },
  { value: 'keys', label: 'Keys' },
  { value: 'synth-hardware', label: 'Synth (hardware)' },
  { value: 'synth-vst', label: 'Synth (VST)' },
  { value: 'drums', label: 'Drums' },
  { value: 'wind', label: 'Wind' },
  { value: 'vocal', label: 'Vocal' },
  { value: 'other', label: 'Other' },
]

export const QUANTIZE_OPTIONS: Option[] = [
  { value: '1', label: '1 beat' },
  { value: '0.5', label: '1/2 beat' },
  { value: '0.25', label: '1/4 beat' },
  { value: '0.125', label: '1/8 beat' },
  { value: '0.0625', label: '1/16 beat' },
  { value: '0.03125', label: '1/32 beat' },
  { value: '0.015625', label: '1/64 beat' },
]

export const BLOCK_WIDTHS: Option[] = [
  { value: '0.25', label: '¼ beat' },
  { value: '0.5', label: '½ beat' },
  { value: '1', label: '1 beat' },
  { value: '2', label: '2 beats' },
  { value: '4', label: '4 beats' },
]

export const TIME_SIGNATURES: Option[] = [
  { value: '4/4', label: '4/4' },
  { value: '3/4', label: '3/4' },
  { value: '2/4', label: '2/4' },
  { value: '6/8', label: '6/8' },
  { value: '5/4', label: '5/4' },
  { value: '7/8', label: '7/8' },
  { value: '9/8', label: '9/8' },
  { value: '12/8', label: '12/8' },
]

export const KEY_ROOTS: Option[] = [
  { value: 'C', label: 'C' },
  { value: 'C#/Db', label: 'C#/Db' },
  { value: 'D', label: 'D' },
  { value: 'D#/Eb', label: 'D#/Eb' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#/Gb', label: 'F#/Gb' },
  { value: 'G', label: 'G' },
  { value: 'G#/Ab', label: 'G#/Ab' },
  { value: 'A', label: 'A' },
  { value: 'A#/Bb', label: 'A#/Bb' },
  { value: 'B', label: 'B' },
]

export const KEY_MODES: Option[] = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
]

// Keyboard note names (one octave) ------------------------------------------
export const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export const BLACK_NOTES = ['C#', 'D#', 'F#', 'G#', 'A#'] as const
