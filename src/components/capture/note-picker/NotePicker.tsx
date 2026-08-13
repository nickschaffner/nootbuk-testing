import { Circle, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as Tone from 'tone'

import { BeatTimeline } from '@/components/capture/note-picker/BeatTimeline'
import { PianoKeyboard } from '@/components/capture/note-picker/PianoKeyboard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useMidi } from '@/hooks/useMidi'
import { useSynth } from '@/hooks/useSynth'
import { shouldIgnoreGlobalShortcut } from '@/lib/browser-capabilities'
import {
  CHORD_PRESETS,
  formatChordBlockLabel,
  getChordPitches,
  type ChordType,
} from '@/lib/chords'
import { midiToNoteName, noteNameToMidi } from '@/lib/notes'
import {
  barCountForBlocks,
  BLOCK_WIDTH_OPTIONS,
  clipOverlapping,
  cloneBlocks,
  cloneSnapshot,
  createChordBlock,
  createNoteBlock,
  deleteBlock,
  deleteLine,
  duplicateLine,
  GRID_BEAT,
  insertLineAfter,
  MIN_BEAT_WIDTH_PX,
  moveBlock,
  noteEventsToTimelineBlocks,
  parseBeatsPerBar,
  placeBlockOnGrid,
  quantizeBeat,
  resizeBlock,
  timelineBlocksToNoteEvents,
  trimBarCount,
  updateBlockSound,
  type BlockWidthBeats,
  type TimelineBlock,
  type TimelineSnapshot,
} from '@/lib/timeline-notes'
import { cn } from '@/lib/utils'
import type { NoteEvent } from '@/types/idea'

type InputMode = 'preview' | 'commit'
type RecordMode = 'record' | 'overdub'

interface LiveMidiNote {
  id: string
  startBeat: number
  pitch: number
}

interface NotePickerProps {
  draft?: boolean
  embedded?: boolean
  className?: string
  initialNoteEvents?: NoteEvent[]
  tempo?: number | null
  timeSignature?: string | null
  onTimeSignatureChange?: (value: string) => void
  patchId?: string
  onDraftChange?: (data: { noteEvents: NoteEvent[]; bpm: number }) => void
}

const TIME_SIGNATURE_OPTIONS = ['4/4', '3/4', '2/4', '6/8', '5/4', '7/8'] as const
const MAX_HISTORY = 50

function useIsMd() {
  const [isMd, setIsMd] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    function handleChange() {
      setIsMd(media.matches)
    }
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return isMd
}

export function NotePicker({
  draft = false,
  embedded = false,
  className,
  initialNoteEvents,
  tempo,
  timeSignature,
  onTimeSignatureChange,
  patchId,
  onDraftChange,
}: NotePickerProps) {
  const synth = useSynth()
  const isMd = useIsMd()
  const bpm = tempo && tempo > 0 ? tempo : 120
  const activeTimeSignature = timeSignature?.trim() || '4/4'
  const beatsPerBar = parseBeatsPerBar(activeTimeSignature)

  const [octave, setOctave] = useState(3)
  const [blockWidth, setBlockWidth] = useState<BlockWidthBeats>(1)
  const [chordMode, setChordMode] = useState(false)
  const [chordType, setChordType] = useState<ChordType>('major')
  const [inputMode, setInputMode] = useState<InputMode>('preview')
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
  const [barsPerLine, setBarsPerLine] = useState(1)
  const [cursorBeat, setCursorBeat] = useState(0)
  const [ghost, setGhost] = useState<TimelineBlock | null>(null)
  const [gridBeat, setGridBeat] = useState(GRID_BEAT)
  const [midiQuantize, setMidiQuantize] = useState(false)
  const [recordMode, setRecordMode] = useState<RecordMode>('record')
  const [isRecording, setIsRecording] = useState(false)
  const [countInEnabled, setCountInEnabled] = useState(false)
  const [isCountingIn, setIsCountingIn] = useState(false)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hoverHighlights, setHoverHighlights] = useState<Set<string>>(
    () => new Set(),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadBeat, setPlayheadBeat] = useState(0)
  const [pausedBeat, setPausedBeat] = useState<number | null>(null)
  const [past, setPast] = useState<TimelineSnapshot[]>([])
  const [future, setFuture] = useState<TimelineSnapshot[]>([])
  const [containerWidth, setContainerWidth] = useState(0)

  const onDraftChangeRef = useRef(onDraftChange)
  const playTimersRef = useRef<number[]>([])
  const playRafRef = useRef<number | null>(null)
  const hydratedRef = useRef(false)
  const timelineWrapRef = useRef<HTMLDivElement>(null)
  const pickerRootRef = useRef<HTMLDivElement>(null)
  const snapshotRef = useRef<TimelineSnapshot>({ blocks, barCount })
  snapshotRef.current = { blocks, barCount }
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const beatsPerBarRef = useRef(beatsPerBar)
  beatsPerBarRef.current = beatsPerBar
  const playingRef = useRef(false)
  const playbackFromBeatRef = useRef(0)
  const playbackOriginMsRef = useRef(0)
  const cycleLoopEndRef = useRef(0)
  const playheadBeatRef = useRef(0)
  const cursorBeatRef = useRef(0)
  cursorBeatRef.current = cursorBeat
  const savedCursorForDoubleClickRef = useRef(0)
  const awaitingDoubleClickRef = useRef(false)
  const gridClickInDoubleClickRef = useRef(false)
  const doubleClickTimerRef = useRef<number | null>(null)
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
  const countInCancelledRef = useRef(false)
  const countingInRef = useRef(false)
  const countInTimersRef = useRef<number[]>([])
  const clickSynthRef = useRef<Tone.MembraneSynth | null>(null)
  const recordOriginBeatRef = useRef(0)
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

  const midi = useMidi({
    onNoteOn: (pitch, velocity) => {
      midiHandlersRef.current.onNoteOn(pitch, velocity)
    },
    onNoteOff: (pitch) => {
      midiHandlersRef.current.onNoteOff(pitch)
    },
  })

  const displayedOctaves = useMemo(() => {
    if (!isMd) {
      return [octave]
    }
    if (octave >= 7) {
      return [6, 7]
    }
    return [octave, octave + 1]
  }, [isMd, octave])

  const maxBarsPerLine = Math.max(
    1,
    Math.floor(
      Math.max(0, containerWidth - 48) / (beatsPerBar * MIN_BEAT_WIDTH_PX),
    ),
  )

  const selectedBlock =
    blocks.find((block) => block.id === selectedBlockId) ?? null

  const pianoHighlights = useMemo(() => {
    const keys = new Set(hoverHighlights)
    if (isEditing && selectedBlock) {
      for (const pitch of selectedBlock.pitches) {
        keys.add(midiToNoteName(pitch))
      }
    }
    return keys
  }, [hoverHighlights, isEditing, selectedBlock])

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
    setFuture([])
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

  useEffect(() => {
    if (barsPerLine > maxBarsPerLine) {
      setBarsPerLine(maxBarsPerLine)
    }
  }, [barsPerLine, maxBarsPerLine])

  useEffect(() => {
    const element = timelineWrapRef.current
    if (!element) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      setContainerWidth(width)
    })
    observer.observe(element)
    setContainerWidth(element.clientWidth)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isEditing && !selectedBlockId) {
      setIsEditing(false)
    }
  }, [isEditing, selectedBlockId])

  useEffect(() => {
    return () => {
      for (const timer of playTimersRef.current) {
        window.clearTimeout(timer)
      }
      playTimersRef.current = []
      for (const timer of countInTimersRef.current) {
        window.clearTimeout(timer)
      }
      countInTimersRef.current = []
      if (playRafRef.current != null) {
        window.cancelAnimationFrame(playRafRef.current)
        playRafRef.current = null
      }
      clickSynthRef.current?.dispose()
      clickSynthRef.current = null
      void synth.stopAll()
    }
  }, [synth])

  function clearPlayTimers() {
    for (const timer of playTimersRef.current) {
      window.clearTimeout(timer)
    }
    playTimersRef.current = []
  }

  function stopPlayhead() {
    if (playRafRef.current != null) {
      window.cancelAnimationFrame(playRafRef.current)
      playRafRef.current = null
    }
  }

  function stopPlayback() {
    playEpochRef.current += 1
    playingRef.current = false
    clearPlayTimers()
    stopPlayhead()
    void synth.stopAll()
    setIsPlaying(false)
    setPlayheadBeat(0)
    setPausedBeat(null)
    playheadBeatRef.current = 0
  }

  function pausePlayback() {
    if (!playingRef.current) {
      return
    }
    playEpochRef.current += 1
    playingRef.current = false
    clearPlayTimers()
    stopPlayhead()
    void synth.stopAll()
    setIsPlaying(false)
    setPausedBeat(playheadBeatRef.current)
  }

  function lastBarEndBeats() {
    return Math.max(1, snapshotRef.current.barCount) * beatsPerBarRef.current
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

  function playMetronomeClick() {
    ensureClickSynth().triggerAttackRelease('C5', '32n', Tone.now(), 0.9)
  }

  function clearCountInTimers() {
    for (const timer of countInTimersRef.current) {
      window.clearTimeout(timer)
    }
    countInTimersRef.current = []
  }

  function cancelCountIn() {
    countInCancelledRef.current = true
    countingInRef.current = false
    clearCountInTimers()
    setIsCountingIn(false)
  }

  function extendBarsForPlayhead(playhead: number) {
    const bpb = beatsPerBarRef.current
    const needed = Math.max(1, Math.floor(playhead / bpb) + 1)
    setBarCount((bars) => (needed > bars ? needed : bars))
  }

  function triggerOverdubPlayback(playhead: number) {
    const except = recordedThisTakeIdsRef.current
    const fromBeat = playbackFromBeatRef.current
    const prev = lastOverdubPlayheadRef.current
    lastOverdubPlayheadRef.current = playhead
    const known = overdubKnownIdsRef.current
    const spb = 60 / bpmRef.current

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
        void synth.playNote(pitch, 96, remainingBeats * spb)
      }
    }
  }

  function wrapRecordingToStart(overshoot: number) {
    const loopEnd = lastBarEndBeats()
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
      for (const [pitch] of held) {
        const block = createNoteBlock(pitch, 0, Math.max(0.01, overshoot))
        liveMidiNotesRef.current.set(pitch, {
          id: block.id,
          startBeat: 0,
          pitch,
        })
        newIds.add(block.id)
        next = sortInsert(next, block)
      }
      recordedThisTakeIdsRef.current = newIds
      overdubKnownIdsRef.current = new Set(next.map((block) => block.id))
      return next
    })

    recordOriginBeatRef.current = 0
    triggeredPlaybackIdsRef.current.clear()
    lastOverdubPlayheadRef.current = -1e-6
    const spb = 60 / bpmRef.current
    playbackFromBeatRef.current = 0
    playbackOriginMsRef.current = performance.now() - overshoot * spb * 1000
    playheadBeatRef.current = overshoot
    setPlayheadBeat(overshoot)
  }

  function beginPlaybackCycle(fromBeat: number) {
    if (!playingRef.current) {
      return
    }

    clearPlayTimers()

    const spb = 60 / bpmRef.current
    const loopEnd = lastBarEndBeats()
    const startBeat = recordingRef.current
      ? Math.max(0, fromBeat)
      : Math.min(
          Math.max(0, fromBeat),
          Math.max(0, loopEnd - 1e-6),
        )
    cycleLoopEndRef.current = loopEnd
    playbackFromBeatRef.current = startBeat
    playbackOriginMsRef.current = performance.now()

    if (!recordingRef.current) {
      const events = timelineBlocksToNoteEvents(
        snapshotRef.current.blocks,
        bpmRef.current,
      )
      for (const event of events) {
        const eventBeat = event.startTime / spb
        if (eventBeat < startBeat - 1e-9 || eventBeat >= loopEnd - 1e-9) {
          continue
        }
        const delay = (eventBeat - startBeat) * spb * 1000
        const timer = window.setTimeout(() => {
          void synth.playNote(event.pitch, event.velocity, event.duration)
        }, delay)
        playTimersRef.current.push(timer)
      }

      const remainingMs = Math.max(0, (loopEnd - startBeat) * spb * 1000)
      const endTimer = window.setTimeout(() => {
        if (loopEnabledRef.current) {
          beginPlaybackCycle(0)
          return
        }
        playheadBeatRef.current = cycleLoopEndRef.current
        setPlayheadBeat(cycleLoopEndRef.current)
        pausePlayback()
      }, remainingMs)
      playTimersRef.current.push(endTimer)
    }
  }

  function tickPlayhead(now: number) {
    if (!playingRef.current) {
      return
    }
    const spb = 60 / bpmRef.current
    const elapsedBeats = (now - playbackOriginMsRef.current) / 1000 / spb
    let beat = playbackFromBeatRef.current + elapsedBeats

    if (recordingRef.current) {
      if (loopEnabledRef.current) {
        const loopEnd = lastBarEndBeats()
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

  async function startPlayback(fromBeat: number) {
    const epoch = playEpochRef.current + 1
    playEpochRef.current = epoch
    clearPlayTimers()
    stopPlayhead()
    void synth.stopAll()

    if (patchId && patchId !== 'muted') {
      await synth.setPatch(patchId as Parameters<typeof synth.setPatch>[0])
    }

    if (playEpochRef.current !== epoch) {
      return
    }

    playingRef.current = true
    setPausedBeat(null)
    setIsPlaying(true)
    setPlayheadBeat(fromBeat)
    playheadBeatRef.current = fromBeat
    beginPlaybackCycle(fromBeat)
    playRafRef.current = window.requestAnimationFrame(tickPlayhead)
  }

  function pushHistory() {
    setPast((current) => {
      const next = [...current, cloneSnapshot(snapshotRef.current)]
      return next.slice(-MAX_HISTORY)
    })
    setFuture([])
  }

  function applySnapshot(snapshot: TimelineSnapshot) {
    setBlocks(cloneBlocks(snapshot.blocks))
    setBarCount(snapshot.barCount)
    setGhost(null)
    setSelectedBlockId((id) =>
      snapshot.blocks.some((block) => block.id === id) ? id : null,
    )
    setIsEditing(false)
  }

  function undo() {
    if (recordingRef.current || countingInRef.current || past.length === 0) {
      return
    }
    const previous = past[past.length - 1]
    setFuture((current) =>
      [cloneSnapshot(snapshotRef.current), ...current].slice(0, MAX_HISTORY),
    )
    setPast(past.slice(0, -1))
    applySnapshot(previous)
  }

  function redo() {
    if (recordingRef.current || countingInRef.current || future.length === 0) {
      return
    }
    const [next, ...rest] = future
    setPast((current) =>
      [...current, cloneSnapshot(snapshotRef.current)].slice(-MAX_HISTORY),
    )
    setFuture(rest)
    applySnapshot(next)
  }

  const undoRef = useRef(undo)
  const redoRef = useRef(redo)
  undoRef.current = undo
  redoRef.current = redo

  function exitEditMode() {
    setIsEditing(false)
  }

  function syncEditorToBlock(block: TimelineBlock) {
    const rootPitch = block.pitches[0]
    const rootOctave = Math.floor(rootPitch / 12) - 1
    if (rootOctave >= 0 && rootOctave <= 7) {
      setOctave(rootOctave)
    }
    if (block.chordType) {
      setChordMode(true)
      setChordType(block.chordType)
    } else {
      setChordMode(false)
    }
  }

  function toggleEditMode() {
    if (isEditing) {
      setIsEditing(false)
      return
    }
    if (!selectedBlock) {
      return
    }
    syncEditorToBlock(selectedBlock)
    setIsEditing(true)
  }

  const exitEditModeRef = useRef(exitEditMode)
  exitEditModeRef.current = exitEditMode

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (shouldIgnoreGlobalShortcut(event)) {
          return
        }
        if (ghost || isEditing || selectedBlockId) {
          event.preventDefault()
          setGhost(null)
          setIsEditing(false)
          setSelectedBlockId(null)
        }
        return
      }

      if (shouldIgnoreGlobalShortcut(event)) {
        return
      }

      const isMod = event.metaKey || event.ctrlKey
      if (!isMod) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'z' && event.shiftKey) {
        event.preventDefault()
        redoRef.current()
        return
      }
      if (key === 'z') {
        event.preventDefault()
        undoRef.current()
        return
      }
      if (key === 'y') {
        event.preventDefault()
        redoRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ghost, isEditing, selectedBlockId])

  useEffect(() => {
    if (!isEditing) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const root = pickerRootRef.current
      if (!root) {
        return
      }
      const target = event.target
      if (target instanceof Node && root.contains(target)) {
        return
      }
      exitEditModeRef.current()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isEditing])

  function growBarsIfNeeded(nextBlocks: TimelineBlock[], currentBars: number) {
    return Math.max(currentBars, barCountForBlocks(nextBlocks, beatsPerBar, 1))
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
    void synth.playNote(pitch, velocity)
    if (!recordingRef.current) {
      return
    }
    if (liveMidiNotesRef.current.has(pitch)) {
      return
    }

    const startBeat = currentRecordBeat()
    const block = createNoteBlock(pitch, startBeat, 0.01)
    liveMidiNotesRef.current.set(pitch, {
      id: block.id,
      startBeat,
      pitch,
    })
    recordedThisTakeIdsRef.current.add(block.id)
    setBlocks((current) => sortInsert(current, block))
  }

  function handleMidiNoteOff(pitch: number) {
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

  function beginActualRecording() {
    if (midi.midiDevices.length === 0 || recordingRef.current) {
      return
    }

    countingInRef.current = false
    setIsCountingIn(false)
    pushHistory()
    liveMidiNotesRef.current.clear()
    recordedThisTakeIdsRef.current = new Set()
    triggeredPlaybackIdsRef.current.clear()
    overdubKnownIdsRef.current = new Set(
      snapshotRef.current.blocks.map((block) => block.id),
    )
    const from = playheadBeatRef.current
    recordOriginBeatRef.current = from
    lastOverdubPlayheadRef.current = from - 1e-6
    recordingRef.current = true
    setIsRecording(true)
    midi.startRecording()
    void startPlayback(from)
  }

  function startCountInThenRecord() {
    countInCancelledRef.current = false
    countingInRef.current = true
    setIsCountingIn(true)
    clearCountInTimers()
    ensureClickSynth()

    const beats = beatsPerBarRef.current
    const intervalMs = (60 / bpmRef.current) * 1000

    for (let i = 0; i < beats; i++) {
      const timer = window.setTimeout(() => {
        if (countInCancelledRef.current) {
          return
        }
        playMetronomeClick()
      }, i * intervalMs)
      countInTimersRef.current.push(timer)
    }

    const doneTimer = window.setTimeout(() => {
      if (countInCancelledRef.current) {
        return
      }
      countingInRef.current = false
      clearCountInTimers()
      setIsCountingIn(false)
      beginActualRecording()
    }, beats * intervalMs)
    countInTimersRef.current.push(doneTimer)
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
    if (patchId && patchId !== 'muted') {
      await synth.setPatch(patchId as Parameters<typeof synth.setPatch>[0])
    }

    if (recordingRef.current || countingInRef.current) {
      return
    }

    if (countInEnabledRef.current) {
      startCountInThenRecord()
      return
    }

    beginActualRecording()
  }

  function sortInsert(current: TimelineBlock[], block: TimelineBlock) {
    return [...current, block].sort((a, b) => a.startBeat - b.startBeat)
  }

  function moveCursorTo(beat: number) {
    setCursorBeat(Math.max(0, quantizeBeat(beat, gridBeat)))
  }

  function placeBlock(block: TimelineBlock) {
    const start = Math.max(0, quantizeBeat(block.startBeat, gridBeat))
    const placed = { ...block, startBeat: start }
    pushHistory()
    setBlocks((current) => {
      const next = placeBlockOnGrid(current, placed, gridBeat)
      const nextCursor = quantizeBeat(
        placed.startBeat + placed.durationBeats,
        gridBeat,
      )
      setCursorBeat(nextCursor)
      setBarCount((bars) => growBarsIfNeeded(next, bars))
      return next
    })
    setGhost(null)
  }

  function showGhost(block: TimelineBlock) {
    setGhost(block)
    setBarCount((bars) => growBarsIfNeeded([block], bars))
  }

  function handleGridClick(beat: number) {
    if (!awaitingDoubleClickRef.current) {
      savedCursorForDoubleClickRef.current = cursorBeatRef.current
      awaitingDoubleClickRef.current = true
      gridClickInDoubleClickRef.current = true
      if (doubleClickTimerRef.current != null) {
        window.clearTimeout(doubleClickTimerRef.current)
      }
      doubleClickTimerRef.current = window.setTimeout(() => {
        awaitingDoubleClickRef.current = false
        gridClickInDoubleClickRef.current = false
        doubleClickTimerRef.current = null
      }, 350)
    }
    setGhost(null)
    setIsEditing(false)
    setSelectedBlockId(null)
    moveCursorTo(beat)
  }

  function handlePlayheadMove(beat: number) {
    if (gridClickInDoubleClickRef.current) {
      setCursorBeat(savedCursorForDoubleClickRef.current)
    }
    awaitingDoubleClickRef.current = false
    gridClickInDoubleClickRef.current = false
    if (doubleClickTimerRef.current != null) {
      window.clearTimeout(doubleClickTimerRef.current)
      doubleClickTimerRef.current = null
    }

    const snapped = Math.max(0, quantizeBeat(beat, gridBeat))
    setPausedBeat(null)
    if (playingRef.current) {
      void startPlayback(snapped)
      return
    }
    setPlayheadBeat(snapped)
    playheadBeatRef.current = snapped
  }

  function handleSelectBlock(id: string | null) {
    if (id !== selectedBlockId) {
      setIsEditing(false)
    }
    setSelectedBlockId(id)
  }

  function applySoundToSelected(rootPitch: number, asChord: boolean) {
    if (!selectedBlockId || !isEditing) {
      return
    }

    if (asChord) {
      const pitches = getChordPitches(rootPitch, chordType)
      void synth.playChord(pitches, 100, 0.35)
      pushHistory()
      setBlocks((current) =>
        updateBlockSound(current, selectedBlockId, {
          pitches,
          label: formatChordBlockLabel(rootPitch, chordType),
          chordType,
        }),
      )
      return
    }

    void synth.playNote(rootPitch, 100, 0.25)
    pushHistory()
    setBlocks((current) =>
      updateBlockSound(current, selectedBlockId, {
        pitches: [rootPitch],
        label: midiToNoteName(rootPitch),
        chordType: null,
      }),
    )
  }

  function handlePianoNote(noteName: string, keyOctave: number) {
    const pitch = noteNameToMidi(`${noteName}${keyOctave}`)

    if (isEditing && selectedBlockId) {
      applySoundToSelected(pitch, chordMode)
      return
    }

    const startBeat = Math.max(0, quantizeBeat(cursorBeat, gridBeat))

    if (chordMode) {
      const pitches = getChordPitches(pitch, chordType)
      void synth.playChord(pitches, 100, 0.35)
      const block = createChordBlock(
        pitch,
        chordType,
        pitches,
        startBeat,
        blockWidth,
      )
      if (inputMode === 'commit') {
        placeBlock(block)
      } else {
        showGhost(block)
      }
      return
    }

    void synth.playNote(pitch, 100, 0.25)
    const block = createNoteBlock(pitch, startBeat, blockWidth)
    if (inputMode === 'commit') {
      placeBlock(block)
    } else {
      showGhost(block)
    }
  }

  function handleChordHover(noteName: string, keyOctave: number) {
    if (!chordMode) {
      setHoverHighlights(new Set())
      return
    }
    const rootPitch = noteNameToMidi(`${noteName}${keyOctave}`)
    const pitches = getChordPitches(rootPitch, chordType)
    setHoverHighlights(new Set(pitches.map((pitch) => midiToNoteName(pitch))))
  }

  function handleChordTypeChange(nextType: ChordType) {
    setChordType(nextType)
    if (!isEditing || !selectedBlockId || !selectedBlock) {
      return
    }
    const rootPitch = selectedBlock.pitches[0]
    const pitches = getChordPitches(rootPitch, nextType)
    void synth.playChord(pitches, 100, 0.35)
    pushHistory()
    setBlocks((current) =>
      updateBlockSound(current, selectedBlockId, {
        pitches,
        label: formatChordBlockLabel(rootPitch, nextType),
        chordType: nextType,
      }),
    )
  }

  function confirmGhost() {
    if (!ghost) {
      return
    }
    placeBlock(ghost)
  }

  async function handlePlayPause() {
    if (playingRef.current) {
      pausePlayback()
      return
    }

    if (pausedBeat != null) {
      await startPlayback(pausedBeat)
      return
    }

    await startPlayback(playheadBeat)
  }

  async function handleRestart() {
    await startPlayback(0)
  }

  return (
    <div
      ref={pickerRootRef}
      className={cn(
        'space-y-4',
        !embedded && 'rounded-lg border p-4',
        className,
      )}
    >
      <PianoKeyboard
        octaves={displayedOctaves}
        highlightedKeys={pianoHighlights}
        isEditing={isEditing}
        editingLabel={isEditing ? selectedBlock?.label : null}
        onNoteEnter={handleChordHover}
        onNoteLeave={() => setHoverHighlights(new Set())}
        onNoteClick={handlePianoNote}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">TIME</Label>
        {TIME_SIGNATURE_OPTIONS.map((value) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={activeTimeSignature === value ? 'default' : 'outline'}
            onClick={() => onTimeSignatureChange?.(value)}
          >
            {value}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">OCT</Label>
        {Array.from({ length: 8 }, (_, octaveValue) => (
          <Button
            key={octaveValue}
            type="button"
            size="sm"
            variant={octave === octaveValue ? 'default' : 'outline'}
            className="size-8 p-0"
            onClick={() => setOctave(octaveValue)}
          >
            {octaveValue}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">WIDTH</Label>
        {BLOCK_WIDTH_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={blockWidth === option.value ? 'default' : 'outline'}
            onClick={() => setBlockWidth(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={chordMode ? 'default' : 'outline'}
          onClick={() => setChordMode((value) => !value)}
        >
          CHORD
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setInputMode((mode) => (mode === 'preview' ? 'commit' : 'preview'))
          }
        >
          {inputMode === 'preview' ? 'Preview mode' : 'Commit mode'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handlePlayPause()}
          disabled={isRecording || isCountingIn}
        >
          {isPlaying && !isRecording && !isCountingIn ? (
            <>
              <Pause className="size-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="size-3.5" /> Play
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleRestart()}
          disabled={isRecording || isCountingIn}
        >
          <RotateCcw className="size-3.5" /> Restart
        </Button>
        <Button
          type="button"
          size="sm"
          variant={loopEnabled ? 'default' : 'outline'}
          disabled={isRecording || isCountingIn}
          onClick={() => setLoopEnabled((value) => !value)}
        >
          Loop
        </Button>
        <Button
          type="button"
          size="sm"
          variant={recordMode === 'record' ? 'default' : 'outline'}
          disabled={isRecording || isCountingIn}
          onClick={() => setRecordMode('record')}
        >
          Record
        </Button>
        <Button
          type="button"
          size="sm"
          variant={recordMode === 'overdub' ? 'default' : 'outline'}
          disabled={isRecording || isCountingIn}
          onClick={() => setRecordMode('overdub')}
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
          className={
            isRecording || isCountingIn
              ? undefined
              : 'bg-red-600 text-white hover:bg-red-700'
          }
          variant={isRecording || isCountingIn ? 'destructive' : 'default'}
          disabled={
            !isRecording && !isCountingIn && midi.midiDevices.length === 0
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

      {chordMode ? (
        <div className="flex flex-wrap gap-1.5">
          {CHORD_PRESETS.map((preset) => (
            <Button
              key={preset.type}
              type="button"
              size="sm"
              variant={chordType === preset.type ? 'default' : 'outline'}
              onClick={() => handleChordTypeChange(preset.type)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      ) : null}

      <div ref={timelineWrapRef}>
        <BeatTimeline
          blocks={blocks}
          beatsPerBar={beatsPerBar}
          barCount={barCount}
          barsPerLine={barsPerLine}
          maxBarsPerLine={maxBarsPerLine}
          cursorBeat={cursorBeat}
          blockWidth={blockWidth}
          bpm={bpm}
          gridBeat={gridBeat}
          midiQuantize={midiQuantize}
          selectedBlockId={selectedBlockId}
          isEditing={isEditing}
          ghost={ghost}
          playheadBeat={playheadBeat}
          isRecording={isRecording}
          recordOriginBeat={recordOriginBeatRef.current}
          recordedBlockIds={
            isRecording ? recordedThisTakeIdsRef.current : null
          }
          canUndo={!isRecording && !isCountingIn && past.length > 0}
          canRedo={!isRecording && !isCountingIn && future.length > 0}
          onSelectBlock={handleSelectBlock}
          onGridClick={handleGridClick}
          onPlayheadMove={handlePlayheadMove}
          onGridBeatChange={setGridBeat}
          onMidiQuantizeChange={setMidiQuantize}
          onToggleEdit={toggleEditMode}
          onResize={(id, delta) => {
            pushHistory()
            setBlocks((current) => {
              const next = resizeBlock(current, id, delta, gridBeat)
              setBarCount((bars) => growBarsIfNeeded(next, bars))
              return next
            })
          }}
          onMove={(id, direction) => {
            pushHistory()
            setBlocks((current) => {
              const next = moveBlock(current, id, direction, gridBeat)
              setBarCount((bars) => growBarsIfNeeded(next, bars))
              return next
            })
          }}
          onDelete={(id) => {
            pushHistory()
            setBlocks((current) => {
              const next = deleteBlock(current, id)
              setBarCount((bars) => trimBarCount(next, beatsPerBar, bars, 1))
              return next
            })
            setSelectedBlockId(null)
            setIsEditing(false)
          }}
          onConfirmGhost={confirmGhost}
          onAddBar={() => {
            pushHistory()
            setBarCount((count) => count + 1)
          }}
          onClear={() => {
            cancelCountIn()
            if (recordingRef.current) {
              stopTimelineRecording()
            }
            pushHistory()
            stopPlayback()
            setBlocks([])
            setGhost(null)
            setSelectedBlockId(null)
            setIsEditing(false)
            setBarCount(1)
            setCursorBeat(0)
          }}
          onBarsPerLineChange={setBarsPerLine}
          onDeleteLine={(lineIndex) => {
            pushHistory()
            const next = deleteLine(
              blocks,
              barCount,
              lineIndex,
              barsPerLine,
              beatsPerBar,
            )
            setBlocks(next.blocks)
            setBarCount(next.barCount)
            setSelectedBlockId(null)
            setIsEditing(false)
          }}
          onAddLineBelow={(lineIndex) => {
            pushHistory()
            const next = insertLineAfter(
              blocks,
              barCount,
              lineIndex,
              barsPerLine,
              beatsPerBar,
            )
            setBlocks(next.blocks)
            setBarCount(next.barCount)
          }}
          onDuplicateLine={(lineIndex) => {
            pushHistory()
            const next = duplicateLine(
              blocks,
              barCount,
              lineIndex,
              barsPerLine,
              beatsPerBar,
            )
            setBlocks(next.blocks)
            setBarCount(next.barCount)
          }}
          onUndo={undo}
          onRedo={redo}
        />
      </div>
    </div>
  )
}
