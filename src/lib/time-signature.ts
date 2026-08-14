export const TIME_SIGNATURE_OPTIONS = [
  '4/4',
  '3/4',
  '2/4',
  '6/8',
  '5/4',
  '7/8',
  '9/8',
  '12/8',
] as const

export type TimeSignatureOption = (typeof TIME_SIGNATURE_OPTIONS)[number]

export const DEFAULT_TIME_SIGNATURE: TimeSignatureOption = '4/4'

export function isTimeSignatureOption(
  value: string,
): value is TimeSignatureOption {
  return (TIME_SIGNATURE_OPTIONS as readonly string[]).includes(value)
}

/** Display/playback value. Blank or unknown → 4/4. */
export function resolveTimeSignature(
  value: string | null | undefined,
): TimeSignatureOption {
  const trimmed = value?.trim() ?? ''
  if (trimmed && isTimeSignatureOption(trimmed)) {
    return trimmed
  }
  return DEFAULT_TIME_SIGNATURE
}

/** Stored seed from a song: keep a known option, otherwise blank. */
export function timeSignatureFromSong(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim() ?? ''
  if (trimmed && isTimeSignatureOption(trimmed)) {
    return trimmed
  }
  return ''
}
