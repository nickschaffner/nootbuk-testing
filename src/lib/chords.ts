import { getNoteNames, midiToNoteName } from '@/lib/notes'
import type { NoteEvent } from '@/types/idea'

export type ChordType =
  | 'major'
  | 'minor'
  | '7'
  | 'maj7'
  | 'min7'
  | 'sus2'
  | 'sus4'
  | 'dim'
  | 'aug'

export const CHORD_PRESETS: Array<{
  type: ChordType
  suffix: string
  label: string
}> = [
  { type: 'major', suffix: '', label: 'MAJ' },
  { type: 'minor', suffix: 'm', label: 'MIN' },
  { type: '7', suffix: '7', label: '7' },
  { type: 'min7', suffix: 'm7', label: 'M7' },
  { type: 'maj7', suffix: 'maj7', label: 'MAJ7' },
  { type: 'sus2', suffix: 'sus2', label: 'SUS2' },
  { type: 'sus4', suffix: 'sus4', label: 'SUS4' },
  { type: 'dim', suffix: 'dim', label: 'DIM' },
  { type: 'aug', suffix: 'aug', label: 'AUG' },
]

const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
}

export function getChordIntervals(type: ChordType): number[] {
  return CHORD_INTERVALS[type]
}

export function buildChordName(rootNoteName: string, type: ChordType): string {
  const preset = CHORD_PRESETS.find((item) => item.type === type)
  return `${rootNoteName}${preset?.suffix ?? ''}`
}

export function parseChordSuffix(chordName: string): ChordType | null {
  const rootNames = getNoteNames()
  // Longer names first so "C#" wins over "C"
  const root = [...rootNames]
    .sort((a, b) => b.length - a.length)
    .find((name) => chordName.startsWith(name))
  if (!root) {
    return null
  }

  const suffix = chordName.slice(root.length)
  const match = CHORD_PRESETS.find((preset) => preset.suffix === suffix)
  return match?.type ?? null
}

export function getChordLabel(rootNoteName: string, type: ChordType): string {
  return buildChordName(rootNoteName, type)
}

export function getChordPitches(
  rootPitch: number,
  type: ChordType,
): number[] {
  return getChordIntervals(type)
    .map((interval) => rootPitch + interval)
    .filter((pitch) => pitch >= 0 && pitch <= 127)
}

/** Label like Am3 from root midi + chord type. */
export function formatChordBlockLabel(
  rootPitch: number,
  type: ChordType,
): string {
  const name = midiToNoteName(rootPitch)
  const match = /^([A-G]#?)(-?\d+)$/.exec(name)
  if (!match) {
    return buildChordName(name, type)
  }
  const [, letter, octave] = match
  return `${buildChordName(letter, type)}${octave}`
}

/** Infer a chord type from simultaneous pitches sharing a start time. */
export function inferChordTypeFromPitches(
  rootPitch: number,
  pitches: number[],
): ChordType | null {
  const relative = [...new Set(pitches.map((p) => p - rootPitch))]
    .filter((v) => v >= 0)
    .sort((a, b) => a - b)

  for (const preset of CHORD_PRESETS) {
    const intervals = getChordIntervals(preset.type)
    if (
      intervals.length === relative.length &&
      intervals.every((interval, index) => interval === relative[index])
    ) {
      return preset.type
    }
  }

  return null
}

export function eventsLookLikeChord(events: NoteEvent[]): boolean {
  if (events.length < 2) {
    return false
  }
  const start = events[0].startTime
  return events.every(
    (event) => Math.abs(event.startTime - start) < 0.001,
  )
}
