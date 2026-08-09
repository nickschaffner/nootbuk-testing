import { getNoteNames } from '@/lib/notes'

export type ChordType = 'major' | 'minor' | '7' | 'maj7' | 'min7' | 'sus4'

export const CHORD_PRESETS: Array<{ type: ChordType; suffix: string }> = [
  { type: 'major', suffix: '' },
  { type: 'minor', suffix: 'm' },
  { type: '7', suffix: '7' },
  { type: 'maj7', suffix: 'maj7' },
  { type: 'min7', suffix: 'm7' },
  { type: 'sus4', suffix: 'sus4' },
]

const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus4: [0, 5, 7],
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
  const root = rootNames.find((name) => chordName.startsWith(name))
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
