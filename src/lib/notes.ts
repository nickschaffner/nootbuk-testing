const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

const NOTE_NAME_PATTERN = /^([A-G])(#|b)?(-?\d+)$/

export function midiToNoteName(midi: number): string {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
    throw new RangeError(`MIDI note must be an integer between 0 and 127, got ${midi}`)
  }

  const noteIndex = midi % 12
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

export function noteNameToMidi(noteName: string): number {
  const match = NOTE_NAME_PATTERN.exec(noteName.trim())
  if (!match) {
    throw new Error(`Invalid note name: "${noteName}". Expected format like "C#4" or "Bb3".`)
  }

  const [, letter, accidental, octaveStr] = match
  let noteIndex = 'CDEFGAB'.indexOf(letter)

  if (noteIndex === -1) {
    throw new Error(`Invalid note letter: "${letter}"`)
  }

  if (accidental === '#') {
    noteIndex += 1
  } else if (accidental === 'b') {
    noteIndex -= 1
  }

  if (noteIndex < 0) {
    noteIndex += 12
  } else if (noteIndex > 11) {
    noteIndex -= 12
  }

  const octave = Number.parseInt(octaveStr, 10)
  const midi = (octave + 1) * 12 + noteIndex

  if (midi < 0 || midi > 127) {
    throw new RangeError(`Note "${noteName}" maps to out-of-range MIDI value ${midi}`)
  }

  return midi
}

export function getNoteNames(): readonly string[] {
  return NOTE_NAMES
}
