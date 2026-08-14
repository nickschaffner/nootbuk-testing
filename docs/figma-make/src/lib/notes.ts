// Display-only note helpers. Mirrors the PRD NoteEvent / IdeaNoteSequence
// shapes without pulling in Tone.js — this is a spec, not the running app.

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export type NoteName = (typeof NOTE_NAMES)[number]

export const CHORD_TYPES = ['Maj', 'Min', '7', 'm7', 'Maj7', 'sus2', 'sus4', 'dim', 'aug'] as const

export const isBlackKey = (name: NoteName) => name.includes('#')

// MIDI note number → { name, octave }.  60 = C4 (middle C).
export function midiToName(pitch: number): { name: NoteName; octave: number } {
  const octave = Math.floor(pitch / 12) - 1
  const name = NOTE_NAMES[pitch % 12]
  return { name, octave }
}

export function nameToMidi(name: NoteName, octave: number): number {
  return (octave + 1) * 12 + NOTE_NAMES.indexOf(name)
}

// The ~10 synth patches from the PRD / tech spec.
export const PATCHES = [
  'Piano',
  'E. Piano',
  'Bass',
  'Synth Bass',
  'Brass',
  'Strings',
  'Synth Lead',
  'Synth Pad',
  'Organ',
  'Mallet',
] as const
