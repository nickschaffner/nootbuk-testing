export type InstrumentType =
  | 'bass'
  | 'guitar'
  | 'keys'
  | 'synth-hardware'
  | 'synth-vst'
  | 'drums'
  | 'wind'
  | 'vocal'
  | 'other'

export interface Instrument {
  id: string
  name: string
  type: InstrumentType
  defaultPatch: string | null
  createdAt: string
  updatedAt: string
}
