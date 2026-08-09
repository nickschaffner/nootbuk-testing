export const SYNTH_PATCHES = [
  { id: 'piano', label: 'Piano' },
  { id: 'electric-piano', label: 'E. Piano' },
  { id: 'bass', label: 'Bass' },
  { id: 'synth-bass', label: 'Synth Bass' },
  { id: 'brass', label: 'Brass' },
  { id: 'strings', label: 'Strings' },
  { id: 'synth-lead', label: 'Synth Lead' },
  { id: 'synth-pad', label: 'Synth Pad' },
  { id: 'organ', label: 'Organ' },
  { id: 'mallet', label: 'Mallet' },
] as const

export type SynthPatchId = (typeof SYNTH_PATCHES)[number]['id']

export function getSynthPatchLabel(patchId: SynthPatchId): string {
  return SYNTH_PATCHES.find((patch) => patch.id === patchId)?.label ?? patchId
}
