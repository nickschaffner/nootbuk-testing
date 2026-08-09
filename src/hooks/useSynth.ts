import { useCallback, useRef, useState } from 'react'
import * as Tone from 'tone'
import {
  ElectricPiano,
  Mallet,
  Soundfont,
  SplendidGrandPiano,
  type Smplr,
} from 'smplr'

import { midiToNoteName } from '@/lib/notes'
import type { NoteEvent } from '@/types/idea'
import type { SynthPatchId } from '@/lib/synth-patches'

type SmplrInstrument = Smplr

type TonePatchSynth = Tone.PolySynth<Tone.Synth | Tone.AMSynth | Tone.MonoSynth>

interface LoadedPatch {
  smplr?: SmplrInstrument
  tone?: TonePatchSynth
}

function createTonePatch(patchId: SynthPatchId): TonePatchSynth {
  if (patchId === 'synth-bass') {
    return new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
    }).toDestination()
  }

  if (patchId === 'synth-pad') {
    return new Tone.PolySynth(Tone.AMSynth, {
      envelope: { attack: 0.25, decay: 0.3, sustain: 0.8, release: 1.4 },
    }).toDestination()
  }

  return new Tone.PolySynth(Tone.Synth).toDestination()
}

async function createSmplrPatch(
  patchId: SynthPatchId,
  context: AudioContext,
): Promise<SmplrInstrument | null> {
  switch (patchId) {
    case 'piano': {
      const instrument = SplendidGrandPiano(context)
      await instrument.load
      return instrument
    }
    case 'electric-piano': {
      const instrument = ElectricPiano(context, { instrument: 'CP80' })
      await instrument.load
      return instrument
    }
    case 'bass': {
      const instrument = Soundfont(context, {
        instrument: 'acoustic_bass',
        kit: 'FluidR3_GM',
      })
      await instrument.load
      return instrument
    }
    case 'brass': {
      const instrument = Soundfont(context, {
        instrument: 'brass_section',
        kit: 'FluidR3_GM',
      })
      await instrument.load
      return instrument
    }
    case 'strings': {
      const instrument = Soundfont(context, {
        instrument: 'string_ensemble_1',
        kit: 'FluidR3_GM',
      })
      await instrument.load
      return instrument
    }
    case 'organ': {
      const instrument = Soundfont(context, {
        instrument: 'drawbar_organ',
        kit: 'FluidR3_GM',
      })
      await instrument.load
      return instrument
    }
    case 'mallet': {
      const instrument = Mallet(context, { instrument: 'marimba' })
      await instrument.load
      return instrument
    }
    default:
      return null
  }
}

function usesToneOnly(patchId: SynthPatchId): boolean {
  return patchId === 'synth-bass' || patchId === 'synth-lead' || patchId === 'synth-pad'
}

export function useSynth() {
  const [currentPatch, setCurrentPatch] = useState<SynthPatchId>('piano')
  const [isLoadingPatch, setIsLoadingPatch] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startedRef = useRef(false)
  const patchCacheRef = useRef<Partial<Record<SynthPatchId, LoadedPatch>>>({})
  const playbackTimeoutsRef = useRef<number[]>([])

  const ensureStarted = useCallback(async () => {
    if (startedRef.current) {
      return
    }

    await Tone.start()
    startedRef.current = true
  }, [])

  const loadPatch = useCallback(
    async (patchId: SynthPatchId) => {
      if (patchCacheRef.current[patchId]) {
        return patchCacheRef.current[patchId]
      }

      setIsLoadingPatch(true)
      setError(null)

      try {
        await ensureStarted()
        const loaded: LoadedPatch = {}

        if (usesToneOnly(patchId)) {
          loaded.tone = createTonePatch(patchId)
        } else {
          const context = Tone.getContext().rawContext as AudioContext
          const smplrInstrument = await createSmplrPatch(patchId, context)
          if (smplrInstrument) {
            loaded.smplr = smplrInstrument
          } else {
            loaded.tone = createTonePatch('synth-lead')
          }
        }

        patchCacheRef.current[patchId] = loaded
        return loaded
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : 'Failed to load synth patch.'
        console.warn('loadPatch failed:', caught)
        setError(message)

        const fallback: LoadedPatch = { tone: createTonePatch('synth-lead') }
        patchCacheRef.current[patchId] = fallback
        return fallback
      } finally {
        setIsLoadingPatch(false)
      }
    },
    [ensureStarted],
  )

  const playNote = useCallback(
    async (pitch: number, velocity = 100, duration?: number) => {
      try {
        await ensureStarted()
        const patch = await loadPatch(currentPatch)
        const noteName = midiToNoteName(pitch)
        const normalizedVelocity = Math.max(1, Math.min(127, velocity))

        if (patch?.smplr) {
          if (duration) {
            patch.smplr.start({
              note: pitch,
              velocity: normalizedVelocity,
              duration,
            })
          } else {
            patch.smplr.start({ note: pitch, velocity: normalizedVelocity })
          }
          return
        }

        if (patch?.tone) {
          const toneVelocity = normalizedVelocity / 127
          if (duration) {
            patch.tone.triggerAttackRelease(
              noteName,
              duration,
              Tone.now(),
              toneVelocity,
            )
          } else {
            patch.tone.triggerAttack(noteName, Tone.now(), toneVelocity)
          }
        }
      } catch (caught) {
        console.warn('playNote failed:', caught)
        setError('Synth playback failed.')
      }
    },
    [currentPatch, ensureStarted, loadPatch],
  )

  const stopNote = useCallback(
    async (pitch: number) => {
      try {
        const patch = patchCacheRef.current[currentPatch]
        if (patch?.smplr) {
          patch.smplr.stop(pitch)
          return
        }

        if (patch?.tone) {
          patch.tone.triggerRelease(midiToNoteName(pitch), Tone.now())
        }
      } catch (caught) {
        console.warn('stopNote failed:', caught)
      }
    },
    [currentPatch],
  )

  const stopAll = useCallback(async () => {
    playbackTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    playbackTimeoutsRef.current = []

    for (const patch of Object.values(patchCacheRef.current)) {
      try {
        patch?.smplr?.stop()
        patch?.tone?.releaseAll()
      } catch (caught) {
        console.warn('stopAll failed for patch:', caught)
      }
    }
  }, [])

  const playNoteSequence = useCallback(
    async (notes: NoteEvent[], patchId?: SynthPatchId) => {
      try {
        await ensureStarted()
        await stopAll()

        const targetPatch = patchId ?? currentPatch
        if (targetPatch !== currentPatch) {
          setCurrentPatch(targetPatch)
        }

        const patch = await loadPatch(targetPatch)
        const startTime = Tone.now() + 0.05

        for (const note of notes) {
          const velocity = note.velocity / 127

          if (patch?.smplr) {
            patch.smplr.start({
              note: note.pitch,
              velocity: note.velocity,
              time: startTime + note.startTime,
              duration: note.duration,
            })
          } else if (patch?.tone) {
            patch.tone.triggerAttackRelease(
              midiToNoteName(note.pitch),
              note.duration,
              startTime + note.startTime,
              velocity,
            )
          }
        }
      } catch (caught) {
        console.warn('playNoteSequence failed:', caught)
        setError('MIDI playback failed.')
      }
    },
    [currentPatch, ensureStarted, loadPatch, stopAll],
  )

  const setPatch = useCallback(
    async (patchId: SynthPatchId) => {
      setCurrentPatch(patchId)
      await loadPatch(patchId)
    },
    [loadPatch],
  )

  return {
    currentPatch,
    setPatch,
    isLoadingPatch,
    error,
    ensureStarted,
    playNote,
    stopNote,
    stopAll,
    playNoteSequence,
  }
}
