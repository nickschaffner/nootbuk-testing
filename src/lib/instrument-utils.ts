import type { InstrumentType } from '@/types/instrument'
import { SYNTH_PATCHES, type SynthPatchId } from '@/lib/synth-patches'

export const INSTRUMENT_TYPES: InstrumentType[] = [
  'bass',
  'guitar',
  'keys',
  'synth-hardware',
  'synth-vst',
  'drums',
  'wind',
  'vocal',
  'other',
]

export type PlaybackPatchId = SynthPatchId | 'muted'

export function formatInstrumentType(type: InstrumentType): string {
  switch (type) {
    case 'synth-hardware':
      return 'Synth (hardware)'
    case 'synth-vst':
      return 'Synth (VST)'
    default:
      return type.charAt(0).toUpperCase() + type.slice(1)
  }
}

export function isSynthInstrumentType(type: InstrumentType): boolean {
  return type === 'synth-hardware' || type === 'synth-vst'
}

/** Maps instrument type → synth engine preview patch id. */
export function defaultSynthPatchForType(type: InstrumentType): PlaybackPatchId {
  switch (type) {
    case 'bass':
      return 'bass'
    case 'guitar':
    case 'keys':
    case 'wind':
    case 'vocal':
    case 'other':
      return 'piano'
    case 'synth-hardware':
    case 'synth-vst':
      return 'synth-lead'
    case 'drums':
      return 'muted'
  }
}

export function parsePlaybackPatch(
  value: string | null | undefined,
): PlaybackPatchId | null {
  if (!value) {
    return null
  }
  if (value === 'muted') {
    return 'muted'
  }
  if (SYNTH_PATCHES.some((patch) => patch.id === value)) {
    return value as SynthPatchId
  }
  return null
}
