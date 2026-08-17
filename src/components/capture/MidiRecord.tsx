import { Circle, Square } from 'lucide-react'

import type {
  StudioTransportHandlers,
  StudioTransportState,
} from '@/components/capture/StudioBar'
import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

import { FoldedPianoRoll } from '@/components/capture/note-picker/FoldedPianoRoll'
import { Button } from '@/components/ui/button'
import { useMidi } from '@/hooks/useMidi'
import { useSynth } from '@/hooks/useSynth'
import { parsePlaybackPatch } from '@/lib/instrument-utils'
import {
  barCountForBlocks,
  clipOverlapping,
  cloneBlocks,
  createNoteBlock,
  GRID_BEAT,
  noteEventsToTimelineBlocks,
  parseBeatsPerBar,
  quantizeBeat,
  timelineBlocksToNoteEvents,
  timelineEndBeat,
  trimBarCount,
  type TimelineBlock,
} from '@/lib/timeline-notes'
import { cn } from '@/lib/utils'
import type { NoteEvent } from '@/types/idea'

type RecordMode = 'record' | 'overdub'

interface LiveMidiNote {
  id: string
  startBeat: number
  pitch: number
  velocity: number
}

interface MidiRecordHistoryEntry {
  blocks: TimelineBlock[]
  barCount: number
  playheadBeat: number
}

interface MidiRecordProps {
  draft?: boolean
  embedded?: boolean
  className?: string
  initialNoteEvents?: NoteEvent[]
  tempo?: number | null
  timeSignature?: string | null
  patchName?: string | null
  gridBeat?: number
  onGridBeatChange?: (value: number) => void
  onTransportStateChange?: (state: StudioTransportState) => void
  onRegisterTransportHandlers?: (handlers: StudioTransportHandlers) => void
  onDraftChange?: (data: { noteEvents: NoteEvent[]; bpm: number }) => void
}

const MAX_HISTORY = 50
/** Default loop length when Loop is enabled (or Record-mode default). */
const DEFAULT_LOOP_BARS = 4

function initialLoopRegion(
  blocks: TimelineBlock[],
  beatsPerBar: number,
): { start: number; end: number } {
  const bpb = Math.max(1, beatsPerBar)
  const fourBars = bpb * DEFAULT_LOOP_BARS
  if (blocks.length === 0) {
    return { start: 0, end: fourBars }
  }
  const contentEnd = timelineEndBeat(blocks)
  const lastBar = Math.max(1, Math.ceil(contentEnd / bpb - 1e-9) || 1)
  return { start: 0, end: lastBar * bpb }
}

export function MidiRecord({
  draft = false,
  embedded = false,
  className,
  initialNoteEvents,
  tempo,
  timeSignature,
  patchName = null,
  gridBeat: gridBeatProp,
  onGridBeatChange,
  onTransportStateChange,
  onRegisterTransportHandlers,
  onDraftChange,
}: MidiRecordProps) {
  const synth = useSynth()
  const synthRef = useRef(synth)
  synthRef.current = synth
  const bpm = tempo && tempo > 0 ? tempo : 120
  const activeTimeSignature = timeSignature?.trim() || '4/4'
  const beatsPerBar = parseBeatsPerBar(activeTimeSignature)
  const resolvedPatch = parsePlaybackPatch(patchName) ?? 'piano'
  const activePatchId =
    synth.isMuted || resolvedPatch === 'muted' ? 'muted' : resolvedPatch

  const [blocks, setBlocks] = useState<TimelineBlock[]>(() =>
    noteEventsToTimelineBlocks(initialNoteEvents ?? [], bpm),
  )
  const [barCount, setBarCount] = useState(() =>
    barCountForBlocks(
      noteEventsToTimelineBlocks(initialNoteEvents ?? [], bpm),
      beatsPerBar,
      1,
    ),
  )
  const [internalGridBeat, setInternalGridBeat] = useState(GRID_BEAT)
  const gridBeat = gridBeatProp ?? internalGridBeat
  const setGridBeat = onGridBeatChange ?? setInternalGridBeat
  const [midiQuantize, setMidiQuantize] = useState(false)
  const [snapControls, setSnapControls] = useState(true)
  const [recordMode, setRecordMode] = useState<RecordMode>('record')
  const [isRecording, setIsRecording] = useState(false)
  const [countInEnabled, setCountInEnabled] = useState(false)
  const [isCountingIn, setIsCountingIn] = useState(false)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [loopStartBeat, setLoopStartBeat] = useState(0)
  const [loopEndBeat, setLoopEndBeat] = useState(
    () => Math.max(1, beatsPerBar) * DEFAULT_LOOP_BARS,
  )
  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadBeat, setPlayheadBeat] = useState(0)
  const [pausedBeat, setPausedBeat] = useState<number | null>(null)
  const [past, setPast] = useState<MidiRecordHistoryEntry[]>([])
  const [playheadPulseOpacity, setPlayheadPulseOpacity] = useState(1)

  const onDraftChangeRef = useRef(onDraftChange)
  const playRafRef = useRef<number | null>(null)
  const hydratedRef = useRef(false)
  const snapshotRef = useRef({ blocks, barCount })
  snapshotRef.current = { blocks, barCount }
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const beatsPerBarRef = useRef(beatsPerBar)
  beatsPerBarRef.current = beatsPerBar
  const playingRef = useRef(false)
  const cycleLoopEndRef = useRef(0)
  const playheadBeatRef = useRef(0)
  const playEpochRef = useRef(0)
  const gridBeatRef = useRef(gridBeat)
  gridBeatRef.current = gridBeat
  const midiQuantizeRef = useRef(midiQuantize)
  midiQuantizeRef.current = midiQuantize
  const recordModeRef = useRef(recordMode)
  recordModeRef.current = recordMode
  const recordingRef = useRef(false)
  const countInEnabledRef = useRef(countInEnabled)
  countInEnabledRef.current = countInEnabled
  const loopEnabledRef = useRef(loopEnabled)
  loopEnabledRef.current = loopEnabled
  const loopStartRef = useRef(loopStartBeat)
  loopStartRef.current = loopStartBeat
  const loopEndRef = useRef(loopEndBeat)
  loopEndRef.current = loopEndBeat
  const loopRegionInitializedRef = useRef(false)
  const metronomeEnabledRef = useRef(metronomeEnabled)
  metronomeEnabledRef.current = metronomeEnabled
  const countInCancelledRef = useRef(false)
  const countingInRef = useRef(false)
  const transportEventIdsRef = useRef<number[]>([])
  const countInEventIdsRef = useRef<number[]>([])
  const clickSynthRef = useRef<Tone.MembraneSynth | null>(null)
  const countInSynthRef = useRef<Tone.MembraneSynth | null>(null)
  const recordOriginBeatRef = useRef(0)
  const timelineOriginBeatRef = useRef(0)
  const countInBeatsRef = useRef(0)
  const liveMidiNotesRef = useRef<Map<number, LiveMidiNote>>(new Map())
  const recordedThisTakeIdsRef = useRef<Set<string>>(new Set())
  const triggeredPlaybackIdsRef = useRef<Set<string>>(new Set())
  const overdubKnownIdsRef = useRef<Set<string>>(new Set())
  const lastOverdubPlayheadRef = useRef(0)
  const midiHandlersRef = useRef<{
    onNoteOn: (pitch: number, velocity: number) => void
    onNoteOff: (pitch: number) => void
  }>({
    onNoteOn: () => {},
    onNoteOff: () => {},
  })
  const ensureIdleTransportRef = useRef<() => void>(() => {})
  const restartPlaybackLoopRef = useRef<() => void>(() => {})
  const engageRecordingRef = useRef<() => void>(() => {})

  const midi = useMidi({
    onNoteOn: (pitch, velocity) => {
      midiHandlersRef.current.onNoteOn(pitch, velocity)
    },
    onNoteOff: (pitch) => {
      midiHandlersRef.current.onNoteOff(pitch)
    },
  })

  useEffect(() => {
    onDraftChangeRef.current = onDraftChange
  }, [onDraftChange])

  useEffect(() => {
    if (hydratedRef.current) {
      return
    }
    if (!initialNoteEvents || initialNoteEvents.length === 0) {
      return
    }
    const next = noteEventsToTimelineBlocks(initialNoteEvents, bpm)
    setBlocks(next)
    setBarCount(barCountForBlocks(next, beatsPerBar, 1))
    setPast([])
    hydratedRef.current = true
  }, [initialNoteEvents, bpm, beatsPerBar])

  useEffect(() => {
    if (!draft) {
      return
    }
    onDraftChangeRef.current?.({
      noteEvents: timelineBlocksToNoteEvents(blocks, bpm),
      bpm,
    })
  }, [blocks, bpm, draft])

  useEffect(() => {
    setBarCount((current) =>
      Math.max(current, barCountForBlocks(blocks, beatsPerBar, 1)),
    )
  }, [beatsPerBar, blocks])

  // Unmount-only: must NOT depend on `synth`. useSynth() identity changes when
  // patch load / source flags flip (~1 bar into a take), and a dep on synth would
  // re-run cleanup → stopAll() → kill sustaining controller notes mid-hold.
  useEffect(() => {
    return () => {
      for (const id of transportEventIdsRef.current) {
        try {
          Tone.getTransport().clear(id)
        } catch {
          // transport may already be disposed
        }
      }
      transportEventIdsRef.current = []
      if (playRafRef.current != null) {
        window.cancelAnimationFrame(playRafRef.current)
        playRafRef.current = null
      }
      try {
        Tone.getTransport().stop()
        Tone.getTransport().cancel(0)
      } catch {
        // ignore
      }
      clickSynthRef.current?.dispose()
      clickSynthRef.current = null
      countInSynthRef.current?.dispose()
      countInSynthRef.current = null
      void synthRef.current.stopAll()
    }
  }, [])

  useEffect(() => {
    metronomeEnabledRef.current = metronomeEnabled
    void (async () => {
      await synthRef.current.ensureStarted()
      Tone.getTransport().bpm.value = bpmRef.current
      Tone.getTransport().timeSignature = beatsPerBarRef.current
      if (
        recordingRef.current ||
        playingRef.current ||
        countingInRef.current
      ) {
        return
      }
      ensureIdleTransportRef.current()
    })()
  }, [metronomeEnabled, bpm, beatsPerBar])

  function stopPlayhead() {
    if (playRafRef.current != null) {
      window.cancelAnimationFrame(playRafRef.current)
      playRafRef.current = null
    }
  }

  function clearTransportEvents() {
    const transport = Tone.getTransport()
    for (const id of transportEventIdsRef.current) {
      transport.clear(id)
    }
    transportEventIdsRef.current = []
    countInEventIdsRef.current = []
  }

  function clearCountInEvents() {
    const transport = Tone.getTransport()
    for (const id of countInEventIdsRef.current) {
      transport.clear(id)
    }
    countInEventIdsRef.current = []
  }

  function trackTransportEvent(id: number) {
    transportEventIdsRef.current.push(id)
    return id
  }

  function trackCountInEvent(id: number) {
    countInEventIdsRef.current.push(id)
    transportEventIdsRef.current.push(id)
    return id
  }

  function syncTransportTempo() {
    const transport = Tone.getTransport()
    transport.bpm.value = bpmRef.current
    transport.timeSignature = beatsPerBarRef.current
  }

  function ensureClickSynth() {
    if (!clickSynthRef.current) {
      clickSynthRef.current = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      }).toDestination()
    }
    return clickSynthRef.current
  }

  function ensureCountInSynth() {
    if (!countInSynthRef.current) {
      countInSynthRef.current = new Tone.MembraneSynth({
        pitchDecay: 0.012,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.12 },
      }).toDestination()
    }
    return countInSynthRef.current
  }

  function secondsPerBeat() {
    return 60 / bpmRef.current
  }

  function transportBeatsElapsed() {
    return Tone.getTransport().seconds / secondsPerBeat()
  }

  function schedulePlayheadPulse() {
    const id = Tone.getTransport().scheduleRepeat((time) => {
      Tone.Draw.schedule(() => {
        setPlayheadPulseOpacity(1)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setPlayheadPulseOpacity(0.4)
          })
        })
      }, time)
    }, '4n')
    trackTransportEvent(id)
  }

  function scheduleMetronomeClicks() {
    ensureClickSynth()
    const id = Tone.getTransport().scheduleRepeat((time) => {
      if (!metronomeEnabledRef.current) {
        return
      }
      if (countingInRef.current) {
        return
      }
      clickSynthRef.current?.triggerAttackRelease('C5', '32n', time, 0.9)
    }, '4n')
    trackTransportEvent(id)
  }

  function ensureIdleTransportClock() {
    if (
      recordingRef.current ||
      playingRef.current ||
      countingInRef.current
    ) {
      return
    }

    clearTransportEvents()
    syncTransportTempo()
    try {
      Tone.getTransport().stop()
      Tone.getTransport().position = 0
    } catch {
      // ignore
    }
    scheduleMetronomeClicks()
    schedulePlayheadPulse()
    setPlayheadPulseOpacity(0.4)
    Tone.getTransport().start()
  }

  ensureIdleTransportRef.current = ensureIdleTransportClock

  function resetTransportClock() {
    clearTransportEvents()
    stopPlayhead()
    try {
      Tone.getTransport().stop()
      Tone.getTransport().position = 0
      Tone.getTransport().cancel(0)
    } catch {
      // ignore
    }
    void synth.stopAll()
    try {
      Tone.getTransport().position = 0
    } catch {
      // ignore
    }
    syncTransportTempo()
    setPlayheadPulseOpacity(1)
  }

  function cancelCountIn() {
    countInCancelledRef.current = true
    countingInRef.current = false
    setIsCountingIn(false)
    playingRef.current = false
    setIsPlaying(false)
    resetTransportClock()
    ensureIdleTransportClock()
  }

  function stopPlayback() {
    playEpochRef.current += 1
    playingRef.current = false
    recordingRef.current = false
    countingInRef.current = false
    setIsCountingIn(false)
    resetTransportClock()
    setIsPlaying(false)
    setPlayheadBeat(0)
    setPausedBeat(null)
    playheadBeatRef.current = 0
    ensureIdleTransportClock()
  }

  function pausePlayback() {
    if (!playingRef.current && !recordingRef.current) {
      return
    }
    playEpochRef.current += 1
    playingRef.current = false
    const paused = playheadBeatRef.current
    resetTransportClock()
    setIsPlaying(false)
    setPausedBeat(paused)
    ensureIdleTransportClock()
  }

  function lastBarEndBeats() {
    return Math.max(1, snapshotRef.current.barCount) * beatsPerBarRef.current
  }

  function activeLoopStart() {
    if (!loopEnabledRef.current) {
      return 0
    }
    return Math.max(0, loopStartRef.current)
  }

  function activeLoopEnd() {
    if (!loopEnabledRef.current) {
      return lastBarEndBeats()
    }
    const start = activeLoopStart()
    const minEnd = start + Math.max(gridBeatRef.current, 0.01)
    return Math.max(minEnd, loopEndRef.current)
  }

  function ensureBarsCoverBeat(beat: number) {
    const bpb = beatsPerBarRef.current
    const needed = Math.max(1, Math.ceil(beat / bpb - 1e-9) || 1)
    setBarCount((bars) => (needed > bars ? needed : bars))
  }

  function applyLoopRegion(start: number, end: number) {
    const minLen = beatsPerBarRef.current
    let nextStart = Math.max(0, start)
    let nextEnd = Math.max(nextStart + minLen, end)
    setLoopStartBeat(nextStart)
    setLoopEndBeat(nextEnd)
    ensureBarsCoverBeat(nextEnd)
  }

  function applyInitialLoopRegion() {
    const region = initialLoopRegion(
      snapshotRef.current.blocks,
      beatsPerBarRef.current,
    )
    setLoopStartBeat(region.start)
    setLoopEndBeat(region.end)
    ensureBarsCoverBeat(region.end)
  }

  function extendBarsForPlayhead(playhead: number) {
    ensureBarsCoverBeat(playhead + 1e-6)
  }

  function triggerOverdubPlayback(playhead: number) {
    const except = recordedThisTakeIdsRef.current
    const fromBeat = timelineOriginBeatRef.current
    const prev = lastOverdubPlayheadRef.current
    lastOverdubPlayheadRef.current = playhead
    const known = overdubKnownIdsRef.current
    const spb = secondsPerBeat()

    for (const block of snapshotRef.current.blocks) {
      const isNew = !known.has(block.id)
      known.add(block.id)

      if (except.has(block.id) || isNew) {
        continue
      }
      if (triggeredPlaybackIdsRef.current.has(block.id)) {
        continue
      }

      const noteEnd = block.startBeat + block.durationBeats
      const punchedInto =
        prev <= fromBeat + 1e-6 &&
        block.startBeat < fromBeat - 1e-9 &&
        playhead < noteEnd - 1e-9
      const crossedStart =
        prev < block.startBeat - 1e-9 && playhead >= block.startBeat - 1e-9

      if (!punchedInto && !crossedStart) {
        continue
      }
      if (playhead >= noteEnd - 1e-9) {
        continue
      }

      triggeredPlaybackIdsRef.current.add(block.id)
      const remainingBeats = noteEnd - Math.max(playhead, block.startBeat)
      if (remainingBeats <= 1e-9) {
        continue
      }
      for (const pitch of block.pitches) {
        void synth.playNote(pitch, block.velocity ?? 96, remainingBeats * spb)
      }
    }
  }

  function wrapRecordingToStart(overshoot: number) {
    const loopStart = activeLoopStart()
    const loopEnd = activeLoopEnd()
    const held = [...liveMidiNotesRef.current.entries()]
    const except = recordingExceptIds()

    setBlocks((current) => {
      let next = current

      if (recordModeRef.current === 'record') {
        next = clipOverlapping(
          next,
          recordOriginBeatRef.current,
          loopEnd,
          except,
        )
      } else {
        for (const [, live] of held) {
          next = clipOverlapping(next, live.startBeat, loopEnd, except)
        }
      }

      for (const [, live] of held) {
        let duration = Math.max(0.01, loopEnd - live.startBeat)
        if (midiQuantizeRef.current) {
          duration = Math.max(
            gridBeatRef.current,
            quantizeBeat(duration, gridBeatRef.current),
          )
        }
        next = next.map((block) =>
          block.id === live.id ? { ...block, durationBeats: duration } : block,
        )
      }

      liveMidiNotesRef.current.clear()
      const newIds = new Set<string>()
      for (const [pitch, live] of held) {
        const startBeat = loopStart + Math.max(0, overshoot)
        const block = createNoteBlock(
          pitch,
          startBeat,
          Math.max(0.01, overshoot || 0.01),
          live.velocity,
        )
        liveMidiNotesRef.current.set(pitch, {
          id: block.id,
          startBeat,
          pitch,
          velocity: live.velocity,
        })
        newIds.add(block.id)
        next = sortInsert(next, block)
      }
      recordedThisTakeIdsRef.current = newIds
      overdubKnownIdsRef.current = new Set(next.map((block) => block.id))
      return next
    })

    recordOriginBeatRef.current = loopStart
    timelineOriginBeatRef.current = loopStart
    countInBeatsRef.current = 0
    triggeredPlaybackIdsRef.current.clear()
    lastOverdubPlayheadRef.current = loopStart - 1e-6
    Tone.getTransport().seconds = overshoot * secondsPerBeat()
    const nextBeat = loopStart + overshoot
    playheadBeatRef.current = nextBeat
    setPlayheadBeat(nextBeat)
  }

  function scheduleNotesForPlayback(fromBeat: number) {
    const spb = secondsPerBeat()
    const loopEnd = activeLoopEnd()
    cycleLoopEndRef.current = loopEnd
    const events = timelineBlocksToNoteEvents(
      snapshotRef.current.blocks,
      bpmRef.current,
    )
    for (const event of events) {
      const eventBeat = event.startTime / spb
      if (eventBeat < fromBeat - 1e-9 || eventBeat >= loopEnd - 1e-9) {
        continue
      }
      const when = (eventBeat - fromBeat) * spb
      const id = Tone.getTransport().schedule((time) => {
        Tone.Draw.schedule(() => {
          if (!playingRef.current || recordingRef.current) {
            return
          }
          void synth.playNote(event.pitch, event.velocity, event.duration)
        }, time)
      }, when)
      trackTransportEvent(id)
    }
  }

  function schedulePlaybackEnd(fromBeat: number) {
    const loopEnd = activeLoopEnd()
    cycleLoopEndRef.current = loopEnd
    const durationBeats = Math.max(0, loopEnd - fromBeat)
    const id = Tone.getTransport().schedule((time) => {
      Tone.Draw.schedule(() => {
        if (!playingRef.current || recordingRef.current) {
          return
        }
        if (loopEnabledRef.current) {
          restartPlaybackLoopRef.current()
          return
        }
        playheadBeatRef.current = loopEnd
        setPlayheadBeat(loopEnd)
        pausePlayback()
      }, time)
    }, durationBeats * secondsPerBeat())
    trackTransportEvent(id)
  }

  function restartPlaybackLoop() {
    clearTransportEvents()
    Tone.getTransport().position = 0
    const start = activeLoopStart()
    timelineOriginBeatRef.current = start
    countInBeatsRef.current = 0
    setPlayheadBeat(start)
    playheadBeatRef.current = start
    scheduleNotesForPlayback(start)
    schedulePlaybackEnd(start)
    scheduleMetronomeClicks()
    schedulePlayheadPulse()
  }

  restartPlaybackLoopRef.current = restartPlaybackLoop

  function tickPlayhead() {
    if (!playingRef.current && !recordingRef.current) {
      playRafRef.current = null
      return
    }

    if (countingInRef.current) {
      const origin = timelineOriginBeatRef.current
      playheadBeatRef.current = origin
      setPlayheadBeat(origin)
      playRafRef.current = window.requestAnimationFrame(tickPlayhead)
      return
    }

    let beat =
      timelineOriginBeatRef.current +
      (transportBeatsElapsed() - countInBeatsRef.current)

    if (recordingRef.current) {
      if (loopEnabledRef.current) {
        const loopEnd = activeLoopEnd()
        if (loopEnd > 1e-9 && beat >= loopEnd - 1e-9) {
          wrapRecordingToStart(Math.max(0, beat - loopEnd))
          beat = playheadBeatRef.current
        }
      } else {
        extendBarsForPlayhead(beat)
      }
      playheadBeatRef.current = beat
      setPlayheadBeat(beat)
      applyRecordingPass(beat)
      if (recordModeRef.current === 'overdub') {
        triggerOverdubPlayback(beat)
      }
    } else {
      beat = Math.min(beat, cycleLoopEndRef.current)
      playheadBeatRef.current = beat
      setPlayheadBeat(beat)
    }
    playRafRef.current = window.requestAnimationFrame(tickPlayhead)
  }

  function startPlayheadWatch() {
    stopPlayhead()
    playRafRef.current = window.requestAnimationFrame(tickPlayhead)
  }

  async function startPlayback(fromBeat: number) {
    const epoch = playEpochRef.current + 1
    playEpochRef.current = epoch

    await synth.ensureStarted()
    if (activePatchId && activePatchId !== 'muted') {
      await synth.setPatch(activePatchId as Parameters<typeof synth.setPatch>[0])
    }

    if (playEpochRef.current !== epoch) {
      return
    }

    resetTransportClock()
    countInBeatsRef.current = 0
    timelineOriginBeatRef.current = fromBeat
    playingRef.current = true
    setPausedBeat(null)
    setIsPlaying(true)
    setPlayheadBeat(fromBeat)
    playheadBeatRef.current = fromBeat

    scheduleNotesForPlayback(fromBeat)
    schedulePlaybackEnd(fromBeat)
    scheduleMetronomeClicks()
    schedulePlayheadPulse()
    Tone.getTransport().start()
    startPlayheadWatch()
  }

  function engageRecording() {
    if (countInCancelledRef.current) {
      return
    }
    // Drop one-shot count-in schedules so loop transport rewinds cannot re-fire them.
    clearCountInEvents()
    countingInRef.current = false
    setIsCountingIn(false)
    recordingRef.current = true
    setIsRecording(true)
    midi.startRecording()
    playingRef.current = true
    setIsPlaying(true)
    startPlayheadWatch()
  }

  engageRecordingRef.current = engageRecording

  function beginActualRecording() {
    if (midi.midiDevices.length === 0 || recordingRef.current) {
      return
    }

    countInBeatsRef.current = 0
    engageRecording()
    scheduleMetronomeClicks()
    schedulePlayheadPulse()
    Tone.getTransport().start()
  }

  function startCountInThenRecord() {
    countInCancelledRef.current = false
    countingInRef.current = true
    setIsCountingIn(true)
    ensureCountInSynth()
    countInEventIdsRef.current = []

    const bpb = beatsPerBarRef.current
    countInBeatsRef.current = bpb
    const spb = secondsPerBeat()

    for (let i = 0; i < bpb; i++) {
      const id = Tone.getTransport().schedule((time) => {
        if (countInCancelledRef.current) {
          return
        }
        countInSynthRef.current?.triggerAttackRelease('G5', '32n', time, 1)
      }, i * spb)
      trackCountInEvent(id)
    }

    const startId = Tone.getTransport().schedule((time) => {
      countingInRef.current = false
      Tone.Draw.schedule(() => {
        engageRecordingRef.current()
      }, time)
    }, bpb * spb)
    trackCountInEvent(startId)

    scheduleMetronomeClicks()
    schedulePlayheadPulse()
    playingRef.current = true
    setIsPlaying(true)
    Tone.getTransport().start()
    startPlayheadWatch()
  }

  async function startTimelineRecording() {
    if (
      midi.midiDevices.length === 0 ||
      recordingRef.current ||
      countingInRef.current
    ) {
      return
    }

    if (playingRef.current) {
      pausePlayback()
    }

    await synth.ensureStarted()
    if (activePatchId && activePatchId !== 'muted') {
      await synth.setPatch(activePatchId as Parameters<typeof synth.setPatch>[0])
    }

    if (recordingRef.current || countingInRef.current) {
      return
    }

    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    resetTransportClock()

    pushHistory()
    liveMidiNotesRef.current.clear()
    recordedThisTakeIdsRef.current = new Set()
    triggeredPlaybackIdsRef.current.clear()
    overdubKnownIdsRef.current = new Set(
      snapshotRef.current.blocks.map((block) => block.id),
    )
    const from = loopEnabledRef.current
      ? activeLoopStart()
      : playheadBeatRef.current
    recordOriginBeatRef.current = from
    timelineOriginBeatRef.current = from
    playheadBeatRef.current = from
    setPlayheadBeat(from)
    lastOverdubPlayheadRef.current = from - 1e-6

    if (countInEnabledRef.current) {
      startCountInThenRecord()
      return
    }

    beginActualRecording()
  }

  function pushHistory() {
    setPast((current) => {
      const next: MidiRecordHistoryEntry[] = [
        ...current,
        {
          blocks: cloneBlocks(snapshotRef.current.blocks),
          barCount: snapshotRef.current.barCount,
          playheadBeat: playheadBeatRef.current,
        },
      ]
      return next.slice(-MAX_HISTORY)
    })
  }

  function applySnapshot(snapshot: MidiRecordHistoryEntry) {
    setBlocks(cloneBlocks(snapshot.blocks))
    setBarCount(snapshot.barCount)
    setPausedBeat(null)
    setPlayheadBeat(snapshot.playheadBeat)
    playheadBeatRef.current = snapshot.playheadBeat
  }

  function undo() {
    if (recordingRef.current || countingInRef.current || past.length === 0) {
      return
    }
    if (playingRef.current) {
      pausePlayback()
    }
    const previous = past[past.length - 1]
    setPast(past.slice(0, -1))
    applySnapshot(previous)
  }

  const handlePlayPauseRef = useRef<() => Promise<void>>(async () => {})
  const handleRestartRef = useRef<() => Promise<void>>(async () => {})
  const undoRef = useRef(undo)
  undoRef.current = undo

  useEffect(() => {
    onTransportStateChange?.({
      isPlaying: isPlaying && !isRecording && !isCountingIn,
      loopEnabled,
      canUndo: past.length > 0,
      canRedo: false,
      transportLocked: isRecording || isCountingIn,
    })
  }, [
    isPlaying,
    isRecording,
    isCountingIn,
    loopEnabled,
    past.length,
    onTransportStateChange,
  ])

  function handleClear() {
    if (recordingRef.current || countingInRef.current) {
      return
    }
    pushHistory()
    stopPlayback()
    setBlocks([])
    setBarCount(1)
    setPlayheadBeat(0)
    playheadBeatRef.current = 0
  }

  /** Shift all notes left so the earliest starts at beat 0. Relative timing unchanged. */
  function handleTrim() {
    if (recordingRef.current || countingInRef.current || blocks.length === 0) {
      return
    }
    const offset = Math.min(...blocks.map((block) => block.startBeat))
    if (offset <= 0) {
      return
    }
    pushHistory()
    if (playingRef.current) {
      pausePlayback()
    }
    const next = blocks.map((block) => ({
      ...block,
      startBeat: block.startBeat - offset,
    }))
    setBlocks(next)
    setBarCount((bars) =>
      trimBarCount(next, beatsPerBarRef.current, bars, 1),
    )
  }

  function recordingExceptIds() {
    return new Set(recordedThisTakeIdsRef.current)
  }

  function currentRecordBeat() {
    const beat = playheadBeatRef.current
    if (midiQuantizeRef.current) {
      return quantizeBeat(beat, gridBeatRef.current)
    }
    return Math.max(0, beat)
  }

  function applyRecordingPass(playhead: number) {
    if (!recordingRef.current) {
      return
    }

    const except = recordingExceptIds()
    const liveNotes = [...liveMidiNotesRef.current.values()]

    setBlocks((current) => {
      let next = current

      if (recordModeRef.current === 'record') {
        next = clipOverlapping(
          next,
          recordOriginBeatRef.current,
          playhead,
          except,
        )
      } else {
        for (const live of liveNotes) {
          next = clipOverlapping(next, live.startBeat, playhead, except)
        }
      }

      next = next.map((block) => {
        const live = liveNotes.find((item) => item.id === block.id)
        if (!live) {
          return block
        }
        return {
          ...block,
          durationBeats: Math.max(0.01, playhead - live.startBeat),
        }
      })

      return next
    })
  }

  function finalizeLiveMidiNote(live: LiveMidiNote, endBeat: number) {
    let duration = Math.max(0.01, endBeat - live.startBeat)
    if (midiQuantizeRef.current) {
      duration = Math.max(
        gridBeatRef.current,
        quantizeBeat(duration, gridBeatRef.current),
      )
    }
    setBlocks((current) => {
      let next = current.map((block) =>
        block.id === live.id ? { ...block, durationBeats: duration } : block,
      )
      if (recordModeRef.current === 'overdub') {
        next = clipOverlapping(
          next,
          live.startBeat,
          live.startBeat + duration,
          recordingExceptIds(),
        )
      }
      return next
    })
  }

  function handleMidiNoteOn(pitch: number, velocity: number) {
    console.log('[sustain-diag]', 'MidiRecord note-on → playNote', {
      pitch,
      velocity,
      isRecording: recordingRef.current,
    })
    void synth.playNote(pitch, velocity)
    if (!recordingRef.current) {
      return
    }
    if (liveMidiNotesRef.current.has(pitch)) {
      return
    }

    const startBeat = currentRecordBeat()
    const block = createNoteBlock(pitch, startBeat, 0.01, velocity)
    liveMidiNotesRef.current.set(pitch, {
      id: block.id,
      startBeat,
      pitch,
      velocity: block.velocity,
    })
    recordedThisTakeIdsRef.current.add(block.id)
    setBlocks((current) => sortInsert(current, block))
  }

  function handleMidiNoteOff(pitch: number) {
    console.log('[sustain-diag]', 'MidiRecord note-off → stopNote', {
      pitch,
      isRecording: recordingRef.current,
      liveStartBeat: liveMidiNotesRef.current.get(pitch)?.startBeat ?? null,
      playheadBeat: playheadBeatRef.current,
    })
    void synth.stopNote(pitch)
    if (!recordingRef.current) {
      return
    }
    const live = liveMidiNotesRef.current.get(pitch)
    if (!live) {
      return
    }
    liveMidiNotesRef.current.delete(pitch)
    finalizeLiveMidiNote(live, currentRecordBeat())
  }

  midiHandlersRef.current = {
    onNoteOn: handleMidiNoteOn,
    onNoteOff: handleMidiNoteOff,
  }

  function stopTimelineRecording() {
    if (!recordingRef.current) {
      return
    }
    recordingRef.current = false
    setIsRecording(false)
    midi.stopRecording()
    const endBeat = currentRecordBeat()
    const liveNotes = [...liveMidiNotesRef.current.values()]
    const except = recordingExceptIds()
    for (const [pitch] of liveMidiNotesRef.current) {
      void synth.stopNote(pitch)
    }
    liveMidiNotesRef.current.clear()
    recordedThisTakeIdsRef.current = new Set()
    triggeredPlaybackIdsRef.current.clear()

    setBlocks((current) => {
      let next = current
      for (const live of liveNotes) {
        let duration = Math.max(0.01, endBeat - live.startBeat)
        if (midiQuantizeRef.current) {
          duration = Math.max(
            gridBeatRef.current,
            quantizeBeat(duration, gridBeatRef.current),
          )
        }
        next = next.map((block) =>
          block.id === live.id ? { ...block, durationBeats: duration } : block,
        )
        if (recordModeRef.current === 'overdub') {
          next = clipOverlapping(
            next,
            live.startBeat,
            live.startBeat + duration,
            except,
          )
        }
      }
      setBarCount((bars) =>
        loopEnabledRef.current
          ? bars
          : trimBarCount(next, beatsPerBarRef.current, bars, 1),
      )
      return next
    })
    pausePlayback()
  }

  function sortInsert(current: TimelineBlock[], block: TimelineBlock) {
    return [...current, block].sort((a, b) => a.startBeat - b.startBeat)
  }

  async function handlePlayPause() {
    if (playingRef.current && !recordingRef.current) {
      pausePlayback()
      return
    }
    if (recordingRef.current || isCountingIn) {
      return
    }

    let from = pausedBeat ?? playheadBeat
    if (loopEnabledRef.current) {
      const start = activeLoopStart()
      const end = activeLoopEnd()
      if (from < start - 1e-9 || from >= end - 1e-9) {
        from = start
      }
    }

    await startPlayback(from)
  }

  async function handleRestart() {
    if (isRecording || isCountingIn) {
      return
    }
    await startPlayback(loopEnabledRef.current ? activeLoopStart() : 0)
  }

  handlePlayPauseRef.current = handlePlayPause
  handleRestartRef.current = handleRestart

  onRegisterTransportHandlers?.({
    playPause: () => {
      void handlePlayPauseRef.current()
    },
    restart: () => {
      void handleRestartRef.current()
    },
    toggleLoop: () => {
      setLoopEnabled((value) => {
        const next = !value
        if (next && !loopRegionInitializedRef.current) {
          applyInitialLoopRegion()
          loopRegionInitializedRef.current = true
        }
        return next
      })
    },
    undo: () => {
      undoRef.current()
    },
    redo: () => {},
  })

  function handlePlayheadMove(beat: number) {
    if (recordingRef.current || countingInRef.current) {
      return
    }
    const snapped = Math.max(0, beat)
    setPausedBeat(null)
    if (playingRef.current) {
      void startPlayback(snapped)
      return
    }
    setPlayheadBeat(snapped)
    playheadBeatRef.current = snapped
  }

  return (
    <div
      className={cn(
        'space-y-4',
        !embedded && 'rounded-lg border p-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isRecording || isCountingIn || blocks.length === 0}
          onClick={handleClear}
        >
          Clear
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={
            isRecording ||
            isCountingIn ||
            blocks.length === 0 ||
            Math.min(...blocks.map((block) => block.startBeat)) <= 0
          }
          onClick={handleTrim}
        >
          Trim
        </Button>
        <Button
          type="button"
          size="sm"
          variant={recordMode === 'record' ? 'default' : 'outline'}
          disabled={isRecording || isCountingIn}
          onClick={() => {
            setRecordMode('record')
          }}
        >
          Record
        </Button>
        <Button
          type="button"
          size="sm"
          variant={recordMode === 'overdub' ? 'default' : 'outline'}
          disabled={isRecording || isCountingIn}
          onClick={() => {
            setRecordMode('overdub')
          }}
        >
          Overdub
        </Button>
        <Button
          type="button"
          size="sm"
          variant={countInEnabled ? 'default' : 'outline'}
          disabled={isRecording || isCountingIn}
          onClick={() => setCountInEnabled((value) => !value)}
        >
          Count-in
        </Button>
        <Button
          type="button"
          size="sm"
          variant={metronomeEnabled ? 'default' : 'outline'}
          onClick={() => setMetronomeEnabled((value) => !value)}
        >
          Metronome
        </Button>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={midiQuantize ? 'default' : 'outline'}
            disabled={isRecording || isCountingIn}
            onClick={() => setMidiQuantize((value) => !value)}
          >
            Quantize Notes
          </Button>
          <Button
            type="button"
            size="sm"
            variant={snapControls ? 'default' : 'outline'}
            disabled={isRecording || isCountingIn}
            onClick={() => setSnapControls((value) => !value)}
          >
            Snap Controls
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          className={
            isRecording || isCountingIn
              ? undefined
              : 'bg-red-600 text-white hover:bg-red-700'
          }
          variant={isRecording || isCountingIn ? 'destructive' : 'default'}
          disabled={
            (!isRecording && !isCountingIn && (midi.midiDevices.length === 0 || !synth.patchReady))
          }
          onClick={() => {
            if (isCountingIn) {
              cancelCountIn()
              return
            }
            if (isRecording) {
              stopTimelineRecording()
              return
            }
            void startTimelineRecording()
          }}
        >
          {isRecording || isCountingIn ? (
            <>
              <Square className="size-3.5 fill-current" /> Stop
            </>
          ) : (
            <>
              <Circle className="size-3.5 fill-current" /> Record
            </>
          )}
        </Button>
        {midi.isSupported ? (
          midi.midiDevices.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              No MIDI device detected
            </span>
          ) : (
            <select
              className="h-8 max-w-48 rounded-md border border-input bg-background px-2 text-xs"
              value={midi.selectedDeviceId ?? ''}
              onChange={(event) => midi.setSelectedDeviceId(event.target.value)}
              aria-label="MIDI device"
            >
              {midi.midiDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          )
        ) : (
          <span className="text-xs text-muted-foreground">
            MIDI not supported in this browser
          </span>
        )}
      </div>
      {midi.error || midi.deviceWarning ? (
        <p className="text-xs text-destructive">
          {midi.error ?? midi.deviceWarning}
        </p>
      ) : null}

      <div>
        <FoldedPianoRoll
          blocks={blocks}
          bpm={bpm}
          beatsPerBar={beatsPerBar}
          barCount={barCount}
          gridBeat={gridBeat}
          playheadBeat={playheadBeat}
          playheadPulseOpacity={playheadPulseOpacity}
          isRecording={isRecording}
          isPlaying={isPlaying && !isRecording && !isCountingIn}
          recordedBlockIds={
            isRecording ? recordedThisTakeIdsRef.current : null
          }
          loopEnabled={loopEnabled}
          loopStartBeat={loopStartBeat}
          loopEndBeat={loopEndBeat}
          loopSnap={snapControls}
          minLoopBeats={beatsPerBar}
          onLoopRegionChange={applyLoopRegion}
          playheadSnap={snapControls}
          onPlayheadMove={handlePlayheadMove}
          recordOriginBeat={recordOriginBeatRef.current}
        />
      </div>
    </div>
  )
}
