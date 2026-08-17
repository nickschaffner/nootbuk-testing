import { useMemo, useSyncExternalStore } from 'react'
import * as Tone from 'tone'
import {
  ElectricPiano,
  Mallet,
  Mellotron,
  Smolken,
  SplendidGrandPiano,
  getMellotronNames,
  getSmolkenNames,
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
  /** True when the current patch can play (smplr ready, tone-only, or Tone emergency after smplr failure). */
  patchReady: boolean
  /** Human-readable name while the current patch is loading; null when ready. */
  loadingPatchName: string | null
  isLoadingPatch: boolean
  synthSource: 'tonejs' | 'smplr'
  error: string | null
}

const SUSTAIN_DIAG = '[sustain-diag]'

type SmplrCreateRecord = {
  patchId: SynthPatchId
  player: 'ElectricPiano' | 'SplendidGrandPiano' | 'Mallet' | 'Smolken' | 'Mellotron'
  instrumentName: string
  createParams: Record<string, unknown>
}

const smplrCreateRecords: Partial<Record<SynthPatchId, SmplrCreateRecord>> = {}

function inspectSmplrInstrument(instrument: SmplrInstrument | undefined) {
  if (!instrument) {
    return null
  }
  const raw = instrument as unknown as {
    hasLoops?: boolean
    config?: Record<string, unknown>
    options?: Record<string, unknown>
  }
  function jsonSafe(value: unknown) {
    try {
      return JSON.parse(
        JSON.stringify(value, (_key, nested) =>
          typeof nested === 'function' ? '[function]' : nested,
        ),
      )
    } catch {
      return String(value)
    }
  }
  return {
    constructor: instrument.constructor?.name ?? typeof instrument,
    hasLoops: Boolean(raw.hasLoops),
    config: jsonSafe(raw.config),
    options: jsonSafe(raw.options),
  }
}

function logSmplrCreate(record: SmplrCreateRecord, instrument: SmplrInstrument) {
  smplrCreateRecords[record.patchId] = record
  console.log(SUSTAIN_DIAG, 'smplr.create', {
    patchId: record.patchId,
    player: record.player,
    instrumentName: record.instrumentName,
    createParams: record.createParams,
    loaded: inspectSmplrInstrument(instrument),
  })
}

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

function pickSmolkenBassName(): string {
  const names = getSmolkenNames()
  if (names.includes('Arco')) {
    return 'Arco'
  }
  return names[0] ?? 'Arco'
}

function pickMellotronStringsName(): string {
  const names = getMellotronNames()
  const preferred = [
    'MKII VIOLINS',
    'MIXED STRGS',
    'TRON 16VLNS',
    '300 STRINGS CELLO',
  ]
  return preferred.find((name) => names.includes(name)) ?? names[0] ?? 'MKII VIOLINS'
}

function pickMellotronBrassName(): string | null {
  const names = getMellotronNames()
  return names.find((name) => /brass/i.test(name)) ?? null
}

async function createSmplrPatch(
  patchId: SynthPatchId,
  context: AudioContext,
): Promise<SmplrInstrument | null> {
  switch (patchId) {
    case 'piano': {
      const createParams = {}
      const instrument = SplendidGrandPiano(context)
      await instrument.load
      logSmplrCreate(
        {
          patchId,
          player: 'SplendidGrandPiano',
          instrumentName: 'SplendidGrandPiano',
          createParams,
        },
        instrument,
      )
      return instrument
    }
    case 'electric-piano': {
      const createParams = { instrument: 'CP80' }
      const instrument = ElectricPiano(context, createParams)
      await instrument.load
      logSmplrCreate(
        {
          patchId,
          player: 'ElectricPiano',
          instrumentName: 'CP80',
          createParams,
        },
        instrument,
      )
      return instrument
    }
    case 'bass': {
      const instrumentName = pickSmolkenBassName()
      const createParams = { instrument: instrumentName }
      const instrument = Smolken(context, createParams)
      await instrument.load
      logSmplrCreate(
        {
          patchId,
          player: 'Smolken',
          instrumentName,
          createParams,
        },
        instrument,
      )
      return instrument
    }
    case 'brass': {
      const instrumentName = pickMellotronBrassName()
      if (!instrumentName) {
        return null
      }
      const createParams = { instrument: instrumentName }
      const instrument = Mellotron(context, createParams)
      await instrument.load
      logSmplrCreate(
        {
          patchId,
          player: 'Mellotron',
          instrumentName,
          createParams,
        },
        instrument,
      )
      return instrument
    }
    case 'strings': {
      const instrumentName = pickMellotronStringsName()
      const createParams = { instrument: instrumentName }
      const instrument = Mellotron(context, createParams)
      await instrument.load
      logSmplrCreate(
        {
          patchId,
          player: 'Mellotron',
          instrumentName,
          createParams,
        },
        instrument,
      )
      return instrument
    }
    case 'mallet': {
      const createParams = { instrument: 'marimba' }
      const instrument = Mallet(context, createParams)
      await instrument.load
      logSmplrCreate(
        {
          patchId,
          player: 'Mallet',
          instrumentName: 'marimba',
          createParams,
        },
        instrument,
      )
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
  patchReady: false,
  loadingPatchName: null,
  isLoadingPatch: false,
  synthSource: 'tonejs',
  error: null,
}
let started = false
let preloadStarted = false
const patchCache: Partial<Record<SynthPatchId, LoadedPatch>> = {}
const patchLoads: Partial<Record<SynthPatchId, Promise<LoadedPatch | undefined>>> =
  {}
/** Patches where smplr failed — Tone.js is the emergency engine only. */
const patchLoadFailed = new Set<SynthPatchId>()
const playbackTimeouts: number[] = []
let patchEpoch = 0
let sequenceLoopToken = 0

/** Temporary sustain diagnostics — remove after root cause is confirmed. */
const diagHeldNotes = new Map<
  number,
  { startedAtMs: number; source: 'smplr' | 'tonejs'; patch: SynthPatchId }
>()
let diagMonitorId: number | null = null
let diagContextHooked = false
let diagTransportHooked = false

function diagStack(): string {
  try {
    return new Error().stack?.split('\n').slice(2, 8).join(' | ') ?? '(no stack)'
  } catch {
    return '(no stack)'
  }
}

function diagTransportSnapshot() {
  try {
    const transport = Tone.getTransport()
    return {
      state: transport.state,
      seconds: Number(transport.seconds.toFixed(3)),
      bpm: transport.bpm.value,
      position: String(transport.position),
    }
  } catch (caught) {
    return { error: String(caught) }
  }
}

function diagContextSnapshot() {
  try {
    const ctx = Tone.getContext().rawContext as AudioContext
    return { state: ctx.state, sampleRate: ctx.sampleRate, currentTime: Number(ctx.currentTime.toFixed(3)) }
  } catch (caught) {
    return { error: String(caught) }
  }
}

function ensureDiagHooks() {
  if (typeof window === 'undefined') {
    return
  }

  if (!diagContextHooked) {
    try {
      const ctx = Tone.getContext().rawContext as AudioContext
      ctx.addEventListener('statechange', () => {
        console.log(SUSTAIN_DIAG, 'audioContext statechange', diagContextSnapshot())
      })
      diagContextHooked = true
    } catch {
      // context may not exist yet
    }
  }

  if (!diagTransportHooked) {
    try {
      const transport = Tone.getTransport()
      transport.on('start', () => {
        console.log(SUSTAIN_DIAG, 'transport start', diagTransportSnapshot())
      })
      transport.on('stop', () => {
        console.log(SUSTAIN_DIAG, 'transport stop', diagTransportSnapshot())
      })
      transport.on('pause', () => {
        console.log(SUSTAIN_DIAG, 'transport pause', diagTransportSnapshot())
      })
      diagTransportHooked = true
    } catch {
      // transport may not exist yet
    }
  }
}

function startDiagMonitor() {
  if (diagMonitorId != null) {
    return
  }
  diagMonitorId = window.setInterval(() => {
    if (diagHeldNotes.size === 0) {
      if (diagMonitorId != null) {
        window.clearInterval(diagMonitorId)
        diagMonitorId = null
      }
      return
    }
    const now = performance.now()
    const held = [...diagHeldNotes.entries()].map(([pitch, info]) => ({
      pitch,
      source: info.source,
      patch: info.patch,
      heldMs: Math.round(now - info.startedAtMs),
      heldBeatsAt120: Number(((now - info.startedAtMs) / 500).toFixed(2)),
    }))
    console.log(SUSTAIN_DIAG, 'held-note heartbeat', {
      held,
      transport: diagTransportSnapshot(),
      audioContext: diagContextSnapshot(),
      synthSnapshot: {
        currentPatch: snapshot.currentPatch,
        synthSource: snapshot.synthSource,
        isLoadingPatch: snapshot.isLoadingPatch,
        isMuted: snapshot.isMuted,
      },
    })
  }, 1000)
}

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

function resolveSynthSource(patchId: SynthPatchId): 'tonejs' | 'smplr' {
  return patchCache[patchId]?.smplr ? 'smplr' : 'tonejs'
}

function isPatchPlayable(patchId: SynthPatchId): boolean {
  if (usesToneOnly(patchId)) {
    return Boolean(patchCache[patchId]?.tone)
  }
  if (patchCache[patchId]?.smplr) {
    return true
  }
  return patchLoadFailed.has(patchId) && Boolean(patchCache[patchId]?.tone)
}

function emitCurrentPatchStatus(options?: { error?: string | null }) {
  const patchId = snapshot.currentPatch
  if (snapshot.isMuted) {
    emit({
      patchReady: true,
      loadingPatchName: null,
      isLoadingPatch: Object.keys(patchLoads).length > 0,
      synthSource: 'tonejs',
      ...(options?.error !== undefined ? { error: options.error } : {}),
    })
    return
  }

  const ready = isPatchPlayable(patchId) && !patchLoads[patchId]

  emit({
    patchReady: ready,
    loadingPatchName: ready ? null : getSynthPatchLabel(patchId),
    isLoadingPatch: !ready,
    synthSource: resolveSynthSource(patchId),
    ...(options?.error !== undefined ? { error: options.error } : {}),
  })
}

function createEmergencyTone(patchId: SynthPatchId): LoadedPatch {
  const existing = patchCache[patchId]
  if (existing?.tone) {
    return existing
  }
  const loaded: LoadedPatch = { ...existing, tone: createTonePatch(patchId) }
  patchCache[patchId] = loaded
  return loaded
}

function startSmplrLoad(patchId: SynthPatchId): Promise<LoadedPatch | undefined> {
  if (usesToneOnly(patchId)) {
    if (!patchCache[patchId]?.tone) {
      patchCache[patchId] = { tone: createTonePatch(patchId) }
    }
    return Promise.resolve(patchCache[patchId])
  }

  if (patchCache[patchId]?.smplr) {
    return Promise.resolve(patchCache[patchId])
  }

  if (patchLoadFailed.has(patchId) && patchCache[patchId]?.tone) {
    return Promise.resolve(patchCache[patchId])
  }

  const existingLoad = patchLoads[patchId]
  if (existingLoad) {
    return existingLoad
  }

  const loadPromise = (async () => {
    emitCurrentPatchStatus({ error: null })

    try {
      const context = Tone.getContext().rawContext as AudioContext
      const smplrInstrument = await createSmplrPatch(patchId, context)

      if (smplrInstrument) {
        patchCache[patchId] = { smplr: smplrInstrument }
        return patchCache[patchId]
      }

      patchLoadFailed.add(patchId)
      console.warn(
        `smplr unavailable for ${getSynthPatchLabel(patchId)}; using Tone.js emergency fallback.`,
      )
      return createEmergencyTone(patchId)
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Failed to load synth patch.'
      console.warn('startSmplrLoad failed:', caught)
      patchLoadFailed.add(patchId)
      emit({ error: message })
      return createEmergencyTone(patchId)
    } finally {
      delete patchLoads[patchId]
      emitCurrentPatchStatus()
    }
  })()

  patchLoads[patchId] = loadPromise
  emitCurrentPatchStatus()
  return loadPromise
}

/**
 * Start Piano smplr load immediately on app boot (before user gesture).
 * Sample fetch works on a suspended AudioContext; Tone.start() still needed later for audible output.
 */
export function preloadPianoPatch() {
  if (preloadStarted) {
    return
  }
  preloadStarted = true

  emit({
    currentPatch: 'piano',
    isMuted: false,
    patchReady: false,
    loadingPatchName: getSynthPatchLabel('piano'),
    isLoadingPatch: true,
    error: null,
  })

  void startSmplrLoad('piano').catch((caught) => {
    console.warn('preloadPianoPatch failed:', caught)
  })
}

/** @deprecated Prefer preloadPianoPatch + ensureStarted on gesture. */
export function preloadCommonPatches() {
  preloadPianoPatch()
  void ensureStarted().catch((caught) => {
    console.warn('preloadCommonPatches failed:', caught)
  })
}

async function ensureStarted() {
  if (started) {
    ensureDiagHooks()
    return
  }
  await Tone.start()
  started = true
  ensureDiagHooks()
  if (!preloadStarted) {
    preloadPianoPatch()
  }
}

async function loadPatch(patchId: SynthPatchId) {
  await ensureStarted()

  if (usesToneOnly(patchId)) {
    if (!patchCache[patchId]?.tone) {
      patchCache[patchId] = { tone: createTonePatch(patchId) }
    }
    return patchCache[patchId]
  }

  return startSmplrLoad(patchId)
}

async function playNote(pitch: number, velocity = 100, duration?: number) {
  try {
    if (snapshot.isMuted) {
      console.log(SUSTAIN_DIAG, 'playNote skipped (muted)', { pitch, velocity, duration })
      return
    }

    await ensureStarted()
    const requestedPatch = snapshot.currentPatch
    let patch = await loadPatch(requestedPatch)

    if (snapshot.isMuted) {
      console.log(SUSTAIN_DIAG, 'playNote skipped after load (muted)', { pitch })
      return
    }
    if (snapshot.currentPatch !== requestedPatch) {
      patch = await loadPatch(snapshot.currentPatch)
    }

    const noteName = midiToNoteName(pitch)
    const normalizedVelocity = Math.max(1, Math.min(127, velocity))
    const source: 'smplr' | 'tonejs' = patch?.smplr ? 'smplr' : 'tonejs'

    console.log(SUSTAIN_DIAG, 'playNote', {
      pitch,
      noteName,
      velocity: normalizedVelocity,
      duration: duration ?? null,
      sustainUntilNoteOff: duration == null,
      source,
      patch: snapshot.currentPatch,
      transport: diagTransportSnapshot(),
      audioContext: diagContextSnapshot(),
    })

    if (patch?.smplr) {
      const createRecord = smplrCreateRecords[snapshot.currentPatch]
      const live = inspectSmplrInstrument(patch.smplr)
      if (duration) {
        const smplrParams = {
          note: pitch,
          velocity: normalizedVelocity,
          duration,
        }
        console.log(SUSTAIN_DIAG, 'smplr.start params', {
          patchId: snapshot.currentPatch,
          player: createRecord?.player ?? null,
          instrumentName: createRecord?.instrumentName ?? null,
          createParams: createRecord?.createParams ?? null,
          startParams: smplrParams,
          startParamKeys: Object.keys(smplrParams),
          loopPassed: 'loop' in smplrParams,
          loaded: live,
        })
        patch.smplr.start(smplrParams)
      } else {
        const smplrParams = {
          note: pitch,
          velocity: normalizedVelocity,
        }
        console.log(SUSTAIN_DIAG, 'smplr.start params', {
          patchId: snapshot.currentPatch,
          player: createRecord?.player ?? null,
          instrumentName: createRecord?.instrumentName ?? null,
          createParams: createRecord?.createParams ?? null,
          startParams: smplrParams,
          startParamKeys: Object.keys(smplrParams),
          duration: '(omitted)',
          loopPassed: 'loop' in smplrParams,
          loaded: live,
        })
        patch.smplr.start(smplrParams)
        diagHeldNotes.set(pitch, {
          startedAtMs: performance.now(),
          source: 'smplr',
          patch: snapshot.currentPatch,
        })
        startDiagMonitor()
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
        diagHeldNotes.set(pitch, {
          startedAtMs: performance.now(),
          source: 'tonejs',
          patch: snapshot.currentPatch,
        })
        startDiagMonitor()
      }
    }
  } catch (caught) {
    console.warn('playNote failed:', caught)
    console.log(SUSTAIN_DIAG, 'playNote threw', { pitch, error: String(caught) })
    emit({ error: 'Synth playback failed.' })
  }
}

async function stopNote(pitch: number) {
  const held = diagHeldNotes.get(pitch)
  console.log(SUSTAIN_DIAG, 'stopNote', {
    pitch,
    wasHeld: Boolean(held),
    heldMs: held ? Math.round(performance.now() - held.startedAtMs) : null,
    heldSource: held?.source ?? null,
    stack: diagStack(),
    transport: diagTransportSnapshot(),
    audioContext: diagContextSnapshot(),
  })
  diagHeldNotes.delete(pitch)

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
    console.log(SUSTAIN_DIAG, 'stopNote threw', { pitch, error: String(caught) })
  }
}

async function stopAll() {
  const held = [...diagHeldNotes.entries()].map(([pitch, info]) => ({
    pitch,
    source: info.source,
    patch: info.patch,
    heldMs: Math.round(performance.now() - info.startedAtMs),
  }))
  console.log(SUSTAIN_DIAG, 'stopAll', {
    heldNotesAtCall: held,
    stack: diagStack(),
    transport: diagTransportSnapshot(),
    audioContext: diagContextSnapshot(),
  })
  diagHeldNotes.clear()

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
        console.log(SUSTAIN_DIAG, 'releaseAll+dispose tone patch', { patchId })
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
  console.log(SUSTAIN_DIAG, 'setPatch', {
    patchId,
    stack: diagStack(),
    heldNotes: [...diagHeldNotes.keys()],
  })

  if (patchId === 'muted') {
    await stopAll()
    if (epoch !== patchEpoch) {
      return
    }
    emit({ isMuted: true, patchReady: true, loadingPatchName: null, isLoadingPatch: false })
    return
  }

  const alreadyReady = isPatchPlayable(patchId) || usesToneOnly(patchId)

  emit({
    isMuted: false,
    currentPatch: patchId,
    patchReady: alreadyReady && isPatchPlayable(patchId),
    loadingPatchName:
      alreadyReady && isPatchPlayable(patchId)
        ? null
        : getSynthPatchLabel(patchId),
    isLoadingPatch: !(alreadyReady && isPatchPlayable(patchId)),
  })
  await stopAll()
  if (epoch !== patchEpoch) {
    return
  }

  await ensureStarted()
  if (epoch !== patchEpoch) {
    return
  }

  if (usesToneOnly(patchId)) {
    if (!patchCache[patchId]?.tone) {
      patchCache[patchId] = { tone: createTonePatch(patchId) }
    }
  } else if (!isPatchPlayable(patchId)) {
    await startSmplrLoad(patchId)
  }

  if (epoch !== patchEpoch) {
    return
  }

  emitCurrentPatchStatus()
  const synthSource = resolveSynthSource(patchId)
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
      patchReady: state.patchReady,
      loadingPatchName: state.loadingPatchName,
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
      state.patchReady,
      state.loadingPatchName,
      state.isLoadingPatch,
      state.synthSource,
      state.error,
    ],
  )
}

/** Temporary diagnostic API for sustain dropout investigation. */
declare global {
  interface Window {
    __nootbukSustainDiag?: {
      setPatch: typeof setPatch
      playNote: typeof playNote
      stopNote: typeof stopNote
      stopAll: typeof stopAll
      ensureStarted: typeof ensureStarted
      getHeld: () => Array<{
        pitch: number
        source: 'smplr' | 'tonejs'
        patch: SynthPatchId
        heldMs: number
      }>
    }
  }
}

if (typeof window !== 'undefined') {
  window.__nootbukSustainDiag = {
    setPatch,
    playNote,
    stopNote,
    stopAll,
    ensureStarted,
    getHeld: () =>
      [...diagHeldNotes.entries()].map(([pitch, info]) => ({
        pitch,
        source: info.source,
        patch: info.patch,
        heldMs: Math.round(performance.now() - info.startedAtMs),
      })),
  }
}
