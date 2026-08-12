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
import {
  getSynthPatchLabel,
  type SynthPatchId,
} from '@/lib/synth-patches'
import type { NoteEvent } from '@/types/idea'

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
  synthSource: 'tonejs' | 'smplr'
  error: string | null
}

const SOUNDFONT_KIT = 'MusyngKite' as const
const PRELOAD_PATCHES: SynthPatchId[] = ['piano', 'bass']

function createTonePatch(patchId: SynthPatchId): TonePatchSynth {
  if (patchId === 'synth-bass' || patchId === 'bass') {
    return new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3 },
    }).toDestination()
  }

  if (patchId === 'synth-pad' || patchId === 'strings') {
    return new Tone.PolySynth(Tone.AMSynth, {
      envelope: { attack: 0.25, decay: 0.3, sustain: 0.8, release: 1.4 },
    }).toDestination()
  }

  if (patchId === 'organ') {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.4 },
    }).toDestination()
  }

  if (patchId === 'brass') {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.3 },
    }).toDestination()
  }

  if (patchId === 'mallet') {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.1, release: 0.3 },
    }).toDestination()
  }

  if (patchId === 'electric-piano') {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.5 },
    }).toDestination()
  }

  // piano, synth-lead, and anything else — bright polysynth fallback
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
        kit: SOUNDFONT_KIT,
      })
      await instrument.load
      return instrument
    }
    case 'brass': {
      const instrument = Soundfont(context, {
        instrument: 'brass_section',
        kit: SOUNDFONT_KIT,
      })
      await instrument.load
      return instrument
    }
    case 'strings': {
      const instrument = Soundfont(context, {
        instrument: 'string_ensemble_1',
        kit: SOUNDFONT_KIT,
      })
      await instrument.load
      return instrument
    }
    case 'organ': {
      const instrument = Soundfont(context, {
        instrument: 'drawbar_organ',
        kit: SOUNDFONT_KIT,
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
  return (
    patchId === 'synth-bass' ||
    patchId === 'synth-lead' ||
    patchId === 'synth-pad'
  )
}

/** Shared engine so setPatch in one component affects playback everywhere. */
const listeners = new Set<() => void>()
let snapshot: SynthSnapshot = {
  currentPatch: 'piano',
  isMuted: false,
  isLoadingPatch: false,
  synthSource: 'tonejs',
  error: null,
}
let started = false
let preloadStarted = false
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

function refreshLoadingFlag() {
  emit({ isLoadingPatch: Object.keys(patchLoads).length > 0 })
}

function resolveSynthSource(patchId: SynthPatchId): 'tonejs' | 'smplr' {
  return patchCache[patchId]?.smplr ? 'smplr' : 'tonejs'
}

function syncSynthSource(patchId: SynthPatchId) {
  const synthSource = resolveSynthSource(patchId)
  if (snapshot.synthSource !== synthSource) {
    emit({ synthSource })
  }
  return synthSource
}

function ensureToneFallback(patchId: SynthPatchId): LoadedPatch {
  const existing = patchCache[patchId]
  if (existing?.tone || existing?.smplr) {
    return existing
  }

  const loaded: LoadedPatch = { tone: createTonePatch(patchId) }
  patchCache[patchId] = loaded
  return loaded
}

function startSmplrLoad(patchId: SynthPatchId): void {
  if (usesToneOnly(patchId)) {
    return
  }

  if (patchCache[patchId]?.smplr) {
    return
  }

  if (patchLoads[patchId]) {
    return
  }

  const loadPromise = (async () => {
    emit({ isLoadingPatch: true, error: null })

    try {
      await ensureStarted()
      const context = Tone.getContext().rawContext as AudioContext
      const smplrInstrument = await createSmplrPatch(patchId, context)
      const existing = patchCache[patchId] ?? ensureToneFallback(patchId)

      if (smplrInstrument) {
        patchCache[patchId] = { ...existing, smplr: smplrInstrument }
        if (snapshot.currentPatch === patchId && !snapshot.isMuted) {
          syncSynthSource(patchId)
        }
      }

      return patchCache[patchId]
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Failed to load synth patch.'
      console.warn('startSmplrLoad failed:', caught)
      emit({ error: message })
      return patchCache[patchId] ?? ensureToneFallback(patchId)
    } finally {
      delete patchLoads[patchId]
      refreshLoadingFlag()
    }
  })()

  patchLoads[patchId] = loadPromise
}

function warmCommonPatches() {
  if (preloadStarted) {
    return
  }
  preloadStarted = true

  for (const patchId of PRELOAD_PATCHES) {
    ensureToneFallback(patchId)
    startSmplrLoad(patchId)
  }
}

async function ensureStarted() {
  if (started) {
    return
  }
  await Tone.start()
  started = true
  warmCommonPatches()
}

/** Kick off Piano + Bass preload after first audio unlock. */
export function preloadCommonPatches() {
  void ensureStarted().catch((caught) => {
    console.warn('preloadCommonPatches failed:', caught)
  })
}

async function loadPatch(patchId: SynthPatchId) {
  await ensureStarted()

  if (usesToneOnly(patchId)) {
    if (!patchCache[patchId]?.tone) {
      patchCache[patchId] = { tone: createTonePatch(patchId) }
    }
    return patchCache[patchId]
  }

  const ready = ensureToneFallback(patchId)
  startSmplrLoad(patchId)
  return ready
}

async function playNote(pitch: number, velocity = 100, duration?: number) {
  try {
    if (snapshot.isMuted) {
      return
    }

    await ensureStarted()
    const requestedPatch = snapshot.currentPatch
    let patch = await loadPatch(requestedPatch)

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

  try {
    const transport = Tone.getTransport()
    transport.stop()
    transport.cancel(0)
  } catch (caught) {
    console.warn('Tone.Transport stop/cancel failed:', caught)
  }

  for (const [patchId, patch] of Object.entries(patchCache) as Array<
    [SynthPatchId, LoadedPatch | undefined]
  >) {
    try {
      patch?.smplr?.stop()

      if (patch?.tone) {
        // releaseAll alone lets envelopes ring; dispose kills scheduled
        // triggerAttackRelease events that would still fire after stop.
        patch.tone.releaseAll(Tone.now())
        patch.tone.dispose()
        patch.tone = createTonePatch(patchId)
      }
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

      const inFlight = patchLoads[targetPatch]
      if (inFlight && !patchCache[targetPatch]?.smplr) {
        await Promise.race([inFlight, sleep(50)])
      }

      const patch = await loadPatch(targetPatch)
      if (token !== sequenceLoopToken) {
        return
      }

      // Schedule with cancellable timeouts so stopAll can cut notes immediately
      // instead of letting Web-Audio-scheduled attacks ring out.
      for (const note of notes) {
        const timeoutId = window.setTimeout(() => {
          if (token !== sequenceLoopToken || snapshot.isMuted) {
            return
          }

          const livePatch = patchCache[targetPatch] ?? patch
          const velocity = note.velocity / 127

          if (livePatch?.smplr) {
            livePatch.smplr.start({
              note: note.pitch,
              velocity: note.velocity,
              duration: note.duration,
            })
          } else if (livePatch?.tone) {
            livePatch.tone.triggerAttackRelease(
              midiToNoteName(note.pitch),
              note.duration,
              Tone.now(),
              velocity,
            )
          }
        }, Math.max(0, note.startTime * 1000))

        playbackTimeouts.push(timeoutId)
      }

      const durationMs =
        notes.reduce(
          (max, note) => Math.max(max, note.startTime + note.duration),
          0,
        ) *
          1000 +
        100

      await sleep(durationMs)

      if (token !== sequenceLoopToken) {
        return
      }

      if (!loop) {
        break
      }

      // Clear spent timeouts before the next loop iteration
      playbackTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
      playbackTimeouts.length = 0
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

  await ensureStarted()
  if (epoch !== patchEpoch) {
    return
  }

  // Instant Tone fallback; soundfont swaps in when ready
  if (usesToneOnly(patchId)) {
    if (!patchCache[patchId]?.tone) {
      patchCache[patchId] = { tone: createTonePatch(patchId) }
    }
  } else {
    ensureToneFallback(patchId)
    startSmplrLoad(patchId)
  }

  const synthSource = syncSynthSource(patchId)
  console.log(
    `Patch switched to ${getSynthPatchLabel(patchId)} via ${synthSource}`,
  )
}

export function useSynth() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return useMemo(
    () => ({
      currentPatch: state.currentPatch,
      isMuted: state.isMuted,
      isLoadingPatch: state.isLoadingPatch,
      synthSource: state.synthSource,
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
      state.synthSource,
      state.error,
    ],
  )
}
