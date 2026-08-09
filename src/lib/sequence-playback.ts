import type { NoteEvent, NoteDuration, SequenceNote } from '@/types/idea'

import { getChordIntervals, parseChordSuffix } from './chords'
import { midiToNoteName } from './notes'

const DURATION_BEATS: Record<NoteDuration, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
}

export function durationToSeconds(
  duration: NoteDuration,
  bpm = 120,
): number {
  return (DURATION_BEATS[duration] * 60) / bpm
}

export function expandSequenceNoteToPitches(note: SequenceNote): number[] {
  if (!note.isChord || !note.chordName) {
    return [note.pitch]
  }

  const chordType = parseChordSuffix(note.chordName)
  if (!chordType) {
    return [note.pitch]
  }

  return getChordIntervals(chordType)
    .map((interval) => note.pitch + interval)
    .filter((pitch) => pitch >= 0 && pitch <= 127)
}

export function sequenceNotesToNoteEvents(
  notes: SequenceNote[],
  bpm = 120,
): NoteEvent[] {
  const events: NoteEvent[] = []
  let currentTime = 0

  for (const note of notes) {
    const duration = durationToSeconds(note.duration, bpm)
    const pitches = expandSequenceNoteToPitches(note)

    for (const pitch of pitches) {
      events.push({
        pitch,
        startTime: currentTime,
        duration,
        velocity: 96,
      })
    }

    currentTime += duration
  }

  return events
}

export function getSequenceNoteLabel(note: SequenceNote): string {
  if (note.isChord && note.chordName) {
    return `${note.chordName}${note.octave}`
  }

  return note.name || midiToNoteName(note.pitch)
}
