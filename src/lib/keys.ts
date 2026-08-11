/** Musical key roots shown in the KeySelector. */
export const KEY_ROOT_OPTIONS = [
  { id: 'C', label: 'C', root: 'C' },
  { id: 'Cs', label: 'C#/Db', root: 'Db' },
  { id: 'D', label: 'D', root: 'D' },
  { id: 'Ds', label: 'D#/Eb', root: 'Eb' },
  { id: 'E', label: 'E', root: 'E' },
  { id: 'F', label: 'F', root: 'F' },
  { id: 'Fs', label: 'F#/Gb', root: 'F#' },
  { id: 'G', label: 'G', root: 'G' },
  { id: 'Gs', label: 'G#/Ab', root: 'Ab' },
  { id: 'A', label: 'A', root: 'A' },
  { id: 'As', label: 'A#/Bb', root: 'Bb' },
  { id: 'B', label: 'B', root: 'B' },
] as const

export type KeyMode = 'major' | 'minor'

export type ParsedKey = {
  rootId: (typeof KEY_ROOT_OPTIONS)[number]['id']
  mode: KeyMode
}

const ROOT_ALIASES: Record<string, (typeof KEY_ROOT_OPTIONS)[number]['id']> = {
  C: 'C',
  'C#': 'Cs',
  DB: 'Cs',
  D: 'D',
  'D#': 'Ds',
  EB: 'Ds',
  E: 'E',
  F: 'F',
  'F#': 'Fs',
  GB: 'Fs',
  G: 'G',
  'G#': 'Gs',
  AB: 'Gs',
  A: 'A',
  'A#': 'As',
  BB: 'As',
  B: 'B',
}

/** Format a key for storage/display, e.g. "Cm", "F#", "Bb". */
export function formatKeyValue(root: string, mode: KeyMode): string {
  if (mode === 'minor') {
    return `${root}m`
  }
  return root
}

/** Human-readable key label. Flat majors show as "Bb major". */
export function formatKeyDisplay(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const parsed = parseKeyValue(value)
  if (!parsed) {
    return value
  }

  const option = KEY_ROOT_OPTIONS.find((item) => item.id === parsed.rootId)
  if (!option) {
    return value
  }

  if (parsed.mode === 'minor') {
    return `${option.root}m`
  }

  if (option.root.includes('b')) {
    return `${option.root} major`
  }

  return option.root
}

export function parseKeyValue(value: string | null | undefined): ParsedKey | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  let mode: KeyMode = 'major'
  let rootPart = trimmed

  if (/\s*(minor|min)$/i.test(rootPart)) {
    mode = 'minor'
    rootPart = rootPart.replace(/\s*(minor|min)$/i, '').trim()
  } else if (/\s*(major|maj)$/i.test(rootPart)) {
    mode = 'major'
    rootPart = rootPart.replace(/\s*(major|maj)$/i, '').trim()
  } else if (/^[A-Ga-g](#|b)?m$/i.test(rootPart)) {
    mode = 'minor'
    rootPart = rootPart.slice(0, -1)
  }

  let lookup = rootPart.replace(/♭/g, 'b').replace(/♯/g, '#')
  if (/^[A-Ga-g]#$/i.test(lookup)) {
    lookup = `${lookup.charAt(0).toUpperCase()}#`
  } else if (/^[A-Ga-g]b$/i.test(lookup)) {
    lookup = `${lookup.charAt(0).toUpperCase()}B`
  } else {
    lookup = lookup.toUpperCase()
  }

  const rootId = ROOT_ALIASES[lookup]
  if (!rootId) {
    return null
  }

  return { rootId, mode }
}

export function buildKeyValue(
  rootId: string | null,
  mode: KeyMode,
): string | null {
  if (!rootId) {
    return null
  }

  const option = KEY_ROOT_OPTIONS.find((item) => item.id === rootId)
  if (!option) {
    return null
  }

  return formatKeyValue(option.root, mode)
}
