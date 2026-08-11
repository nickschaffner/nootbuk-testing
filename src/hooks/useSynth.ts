import { useMemo, useSyncExternalStore } from 'react'
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

type SynthSnapshot = {
  currentPatch: SynthPatchId
  isMuted: boolean
  isLoadingPatch: boolean
  error: string | null
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

/** Shared engine so setPatch in one component affects playback everywhere. */
const listeners = new Set<() => void>()
let snapshot: SynthSnapshot = {
  currentPatch: 'piano',
  isMuted: false,
  isLoadingPatch: false,
  error: null,
}
let started = false
const patchCache: Partial<Record<SynthPatchId, LoadedPatch>> = {}
const patchLoads: Partial<Record<SynthPatchId, Promise<LoadedPatch | undefined>>> =
  {}
const playbackTimeouts: number[] = []
let patchEpoch = 0
let sequenceLoopToken = 0

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function emit(partial: Partial<SynthSnapshot>) {
  snapshot = { ...snapshot, ...partial }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return snapshot
}

async function ensureStarted() {
  if (started) {
    return
  }
  await Tone.start()
  started = true
}

async function loadPatch(patchId: SynthPatchId) {
  if (patchCache[patchId]) {
    return patchCache[patchId]
  }

  const inFlight = patchLoads[patchId]
  if (inFlight) {
    return inFlight
  }

  const loadPromise = (async () => {
    emit({ isLoadingPatch: true, error: null })

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

      patchCache[patchId] = loaded
      return loaded
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Failed to load synth patch.'
      console.warn('loadPatch failed:', caught)
      emit({ error: message })

      const fallback: LoadedPatch = { tone: createTonePatch('synth-lead') }
      patchCache[patchId] = fallback
      return fallback
    } finally {
      delete patchLoads[patchId]
      emit({ isLoadingPatch: false })
    }
  })()

  patchLoads[patchId] = loadPromise
  return loadPromise
}

async function playNote(pitch: number, velocity = 100, duration?: number) {
  try {
    if (snapshot.isMuted) {
      return
    }

    await ensureStarted()
    const requestedPatch = snapshot.currentPatch
    let patch = await loadPatch(requestedPatch)

    // Patch may have changed while the soundfont was loading.
    if (snapshot.isMuted) {
      return
    }
    if (snapshot.currentPatch !== requestedPatch) {
      patch = await loadPatch(snapshot.currentPatch)
    }

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
    emit({ error: 'Synth playback failed.' })
  }
}

async function stopNote(pitch: number) {
  try {
    const patch = patchCache[snapshot.currentPatch]
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
}

async function stopAll() {
  sequenceLoopToken += 1
  playbackTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
  playbackTimeouts.length = 0

  for (const patch of Object.values(patchCache)) {
    try {
      patch?.smplr?.stop()
      patch?.tone?.releaseAll()
    } catch (caught) {
      console.warn('stopAll failed for patch:', caught)
    }
  }
}

async function playNoteSequence(
  notes: NoteEvent[],
  patchId?: SynthPatchId | 'muted',
  options?: { loop?: boolean },
) {
  const loop = options?.loop ?? true

  try {
    await ensureStarted()
    await stopAll()
    const token = sequenceLoopToken

    const targetPatch =
      patchId ?? (snapshot.isMuted ? 'muted' : snapshot.currentPatch)

    if (targetPatch === 'muted') {
      emit({ isMuted: true })
      return
    }

    emit({ isMuted: false, currentPatch: targetPatch })

    do {
      if (token !== sequenceLoopToken) {
        return
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

      const durationMs =
        notes.reduce(
          (max, note) => Math.max(max, note.startTime + note.duration),
          0,
        ) *
          1000 +
        100

      await sleep(durationMs)

      if (!loop) {
        break
      }
    } while (token === sequenceLoopToken)
  } catch (caught) {
    console.warn('playNoteSequence failed:', caught)
    emit({ error: 'MIDI playback failed.' })
  }
}

async function playChord(
  pitches: number[],
  velocity = 100,
  duration = 0.35,
) {
  await Promise.all(pitches.map((pitch) => playNote(pitch, velocity, duration)))
}

async function setPatch(patchId: SynthPatchId | 'muted') {
  const epoch = ++patchEpoch

  if (patchId === 'muted') {
    await stopAll()
    if (epoch !== patchEpoch) {
      return
    }
    emit({ isMuted: true })
    return
  }

  emit({ isMuted: false, currentPatch: patchId })
  await stopAll()
  if (epoch !== patchEpoch) {
    return
  }
  await loadPatch(patchId)
}

export function useSynth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return useMemo(
    () => ({
      currentPatch: state.currentPatch,
      isMuted: state.isMuted,
      isLoadingPatch: state.isLoadingPatch,
      error: state.error,
      setPatch,
      ensureStarted,
      playNote,
      stopNote,
      stopAll,
      playNoteSequence,
      playChord,
    }),
    [
      state.currentPatch,
      state.isMuted,
      state.isLoadingPatch,
      state.error,
    ],
  )
}
