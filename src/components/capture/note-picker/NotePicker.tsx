import { useEffect, useMemo, useRef, useState } from 'react'
import * as Tone from 'tone'

import type {
  StudioTransportHandlers,
  StudioTransportState,
} from '@/components/capture/StudioBar'
import { BeatTimeline } from '@/components/capture/note-picker/BeatTimeline'
import { PianoKeyboard } from '@/components/capture/note-picker/PianoKeyboard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useSynth } from '@/hooks/useSynth'
import { isEditableFocusTarget, shouldIgnoreGlobalShortcut } from '@/lib/browser-capabilities'
import {
  CHORD_PRESETS,
  formatChordBlockLabel,
  getChordPitches,
  type ChordType,
} from '@/lib/chords'
import { parsePlaybackPatch } from '@/lib/instrument-utils'
import { midiToNoteName, noteNameToMidi } from '@/lib/notes'
import {
  barCountForBlocks,
  BLOCK_WIDTH_OPTIONS,
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

/** Standard DAW computer-keyboard → piano map (relative to current octave). */
const COMPUTER_PIANO_KEYS: Record<
  string,
  { note: string; octaveOffset: number }
> = {
  KeyA: { note: 'C', octaveOffset: 0 },
  KeyW: { note: 'C#', octaveOffset: 0 },
  KeyS: { note: 'D', octaveOffset: 0 },
  KeyE: { note: 'D#', octaveOffset: 0 },
  KeyD: { note: 'E', octaveOffset: 0 },
  KeyF: { note: 'F', octaveOffset: 0 },
  KeyT: { note: 'F#', octaveOffset: 0 },
  KeyG: { note: 'G', octaveOffset: 0 },
  KeyY: { note: 'G#', octaveOffset: 0 },
  KeyH: { note: 'A', octaveOffset: 0 },
  KeyU: { note: 'A#', octaveOffset: 0 },
  KeyJ: { note: 'B', octaveOffset: 0 },
  KeyK: { note: 'C', octaveOffset: 1 },
  KeyO: { note: 'C#', octaveOffset: 1 },
  KeyL: { note: 'D', octaveOffset: 1 },
  KeyP: { note: 'D#', octaveOffset: 1 },
  Semicolon: { note: 'E', octaveOffset: 1 },
}

const COMPUTER_PIANO_VELOCITY = 100
const OCTAVE_MIN = 0
const OCTAVE_MAX = 7

function canCaptureComputerPiano(panel: HTMLElement | null): boolean {
  if (!panel) {
    return false
  }
  const active = document.activeElement
  if (isEditableFocusTarget(active)) {
    return false
  }
  if (
    !active ||
    active === document.body ||
    active === document.documentElement
  ) {
    return true
  }
  return panel.contains(active)
}

type InputMode = 'preview' | 'commit'

interface NotePickerProps {
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
  onCopyToMidiRecord?: (data: { noteEvents: NoteEvent[]; bpm: number }) => void
}

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
  patchName = null,
  gridBeat: gridBeatProp,
  onTransportStateChange,
  onRegisterTransportHandlers,
  onDraftChange,
  onCopyToMidiRecord,
}: NotePickerProps) {
  const synth = useSynth()
  const isMd = useIsMd()
  const bpm = tempo && tempo > 0 ? tempo : 120
  const activeTimeSignature = timeSignature?.trim() || '4/4'
  const beatsPerBar = parseBeatsPerBar(activeTimeSignature)
  const resolvedPatch = parsePlaybackPatch(patchName) ?? 'piano'
  const activePatchId =
    synth.isMuted || resolvedPatch === 'muted' ? 'muted' : resolvedPatch

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
  const [internalGridBeat] = useState(GRID_BEAT)
  const gridBeat = gridBeatProp ?? internalGridBeat
  const [loopEnabled, setLoopEnabled] = useState(true)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hoverPrimaryKeys, setHoverPrimaryKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [hoverSecondaryKeys, setHoverSecondaryKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [heldPrimaryKeys, setHeldPrimaryKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [heldSecondaryKeys, setHeldSecondaryKeys] = useState<Set<string>>(
    () => new Set(),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadBeat, setPlayheadBeat] = useState(0)
  const [pausedBeat, setPausedBeat] = useState<number | null>(null)
  const [past, setPast] = useState<TimelineSnapshot[]>([])
  const [future, setFuture] = useState<TimelineSnapshot[]>([])
  const [containerWidth, setContainerWidth] = useState(0)
  const [playheadPulseOpacity, setPlayheadPulseOpacity] = useState(1)

  const onDraftChangeRef = useRef(onDraftChange)
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
  const cycleLoopEndRef = useRef(0)
  const playheadBeatRef = useRef(0)
  const cursorBeatRef = useRef(0)
  cursorBeatRef.current = cursorBeat
  const savedCursorForDoubleClickRef = useRef(0)
  const awaitingDoubleClickRef = useRef(false)
  const gridClickInDoubleClickRef = useRef(false)
  const doubleClickTimerRef = useRef<number | null>(null)
  const playEpochRef = useRef(0)
  const loopEnabledRef = useRef(loopEnabled)
  loopEnabledRef.current = loopEnabled
  const transportEventIdsRef = useRef<number[]>([])
  const timelineOriginBeatRef = useRef(0)
  const ensureIdleTransportRef = useRef<() => void>(() => {})
  const restartPlaybackLoopRef = useRef<() => void>(() => {})
  const heldComputerKeysRef = useRef<
    Map<
      string,
      { pitches: number[]; rootKeyId: string; companionKeyIds: string[] }
    >
  >(new Map())
  const octaveRef = useRef(octave)
  octaveRef.current = octave
  const placeFromPianoRef = useRef<
    (noteName: string, keyOctave: number, playClick: boolean) => number[]
  >(() => [])

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

  const pianoPrimaryKeys = useMemo(() => {
    const keys = new Set(hoverPrimaryKeys)
    for (const keyId of heldPrimaryKeys) {
      keys.add(keyId)
    }
    if (isEditing && selectedBlock && selectedBlock.pitches.length > 0) {
      keys.add(midiToNoteName(selectedBlock.pitches[0]))
    }
    return keys
  }, [hoverPrimaryKeys, heldPrimaryKeys, isEditing, selectedBlock])

  const pianoSecondaryKeys = useMemo(() => {
    const keys = new Set(hoverSecondaryKeys)
    for (const keyId of heldSecondaryKeys) {
      keys.add(keyId)
    }
    if (isEditing && selectedBlock) {
      for (const pitch of selectedBlock.pitches.slice(1)) {
        keys.add(midiToNoteName(pitch))
      }
    }
    for (const keyId of pianoPrimaryKeys) {
      keys.delete(keyId)
    }
    return keys
  }, [
    hoverSecondaryKeys,
    heldSecondaryKeys,
    isEditing,
    selectedBlock,
    pianoPrimaryKeys,
  ])

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
      void synth.stopAll()
    }
  }, [synth])

  useEffect(() => {
    void (async () => {
      await synth.ensureStarted()
      Tone.getTransport().bpm.value = bpmRef.current
      Tone.getTransport().timeSignature = beatsPerBarRef.current
      if (playingRef.current) {
        return
      }
      ensureIdleTransportRef.current()
    })()
  }, [bpm, beatsPerBar, synth])

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
  }

  function trackTransportEvent(id: number) {
    transportEventIdsRef.current.push(id)
    return id
  }

  function syncTransportTempo() {
    const transport = Tone.getTransport()
    transport.bpm.value = bpmRef.current
    transport.timeSignature = beatsPerBarRef.current
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

  function ensureIdleTransportClock() {
    if (playingRef.current) {
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

  function stopPlayback() {
    playEpochRef.current += 1
    playingRef.current = false
    resetTransportClock()
    setIsPlaying(false)
    setPlayheadBeat(0)
    setPausedBeat(null)
    playheadBeatRef.current = 0
    ensureIdleTransportClock()
  }

  function pausePlayback() {
    if (!playingRef.current) {
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

  function scheduleNotesForPlayback(fromBeat: number) {
    const spb = secondsPerBeat()
    const loopEnd = lastBarEndBeats()
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
          if (!playingRef.current) {
            return
          }
          void synth.playNote(event.pitch, event.velocity, event.duration)
        }, time)
      }, when)
      trackTransportEvent(id)
    }
  }

  function schedulePlaybackEnd(fromBeat: number) {
    const loopEnd = lastBarEndBeats()
    cycleLoopEndRef.current = loopEnd
    const durationBeats = Math.max(0, loopEnd - fromBeat)
    const id = Tone.getTransport().schedule((time) => {
      Tone.Draw.schedule(() => {
        if (!playingRef.current) {
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
    timelineOriginBeatRef.current = 0
    setPlayheadBeat(0)
    playheadBeatRef.current = 0
    scheduleNotesForPlayback(0)
    schedulePlaybackEnd(0)
    schedulePlayheadPulse()
  }

  restartPlaybackLoopRef.current = restartPlaybackLoop

  function tickPlayhead() {
    if (!playingRef.current) {
      playRafRef.current = null
      return
    }

    let beat = timelineOriginBeatRef.current + transportBeatsElapsed()
    beat = Math.min(beat, cycleLoopEndRef.current)
    playheadBeatRef.current = beat
    setPlayheadBeat(beat)
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
    timelineOriginBeatRef.current = fromBeat
    playingRef.current = true
    setPausedBeat(null)
    setIsPlaying(true)
    setPlayheadBeat(fromBeat)
    playheadBeatRef.current = fromBeat

    scheduleNotesForPlayback(fromBeat)
    schedulePlaybackEnd(fromBeat)
    schedulePlayheadPulse()
    Tone.getTransport().start()
    startPlayheadWatch()
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
    if (past.length === 0) {
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
    if (future.length === 0) {
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

  const handlePlayPauseRef = useRef<() => Promise<void>>(async () => {})
  const handleRestartRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    onTransportStateChange?.({
      isPlaying,
      loopEnabled,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      transportLocked: false,
    })
  }, [isPlaying, loopEnabled, past.length, future.length, onTransportStateChange])

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

  function applySoundToSelected(
    rootPitch: number,
    asChord: boolean,
    play = true,
  ) {
    if (!selectedBlockId || !isEditing) {
      return
    }

    if (asChord) {
      const pitches = getChordPitches(rootPitch, chordType)
      if (play) {
        void synth.playChord(pitches, 100, 0.35)
      }
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

    if (play) {
      void synth.playNote(rootPitch, 100, 0.25)
    }
    pushHistory()
    setBlocks((current) =>
      updateBlockSound(current, selectedBlockId, {
        pitches: [rootPitch],
        label: midiToNoteName(rootPitch),
        chordType: null,
      }),
    )
  }

  /** Place / ghost / edit from piano. Returns sounding pitches. */
  function placeFromPiano(
    noteName: string,
    keyOctave: number,
    playClick: boolean,
  ): number[] {
    const pitch = noteNameToMidi(`${noteName}${keyOctave}`)

    if (isEditing && selectedBlockId) {
      applySoundToSelected(pitch, chordMode, playClick)
      return chordMode ? getChordPitches(pitch, chordType) : [pitch]
    }

    const startBeat = Math.max(0, quantizeBeat(cursorBeat, gridBeat))

    if (chordMode) {
      const pitches = getChordPitches(pitch, chordType)
      if (playClick) {
        void synth.playChord(pitches, 100, 0.35)
      }
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
      return pitches
    }

    if (playClick) {
      void synth.playNote(pitch, 100, 0.25)
    }
    const block = createNoteBlock(pitch, startBeat, blockWidth)
    if (inputMode === 'commit') {
      placeBlock(block)
    } else {
      showGhost(block)
    }
    return [pitch]
  }

  placeFromPianoRef.current = placeFromPiano

  function handlePianoNote(noteName: string, keyOctave: number) {
    placeFromPiano(noteName, keyOctave, true)
  }

  function releaseComputerKey(code: string) {
    const held = heldComputerKeysRef.current.get(code)
    if (!held) {
      return
    }
    heldComputerKeysRef.current.delete(code)
    for (const pitch of held.pitches) {
      void synth.stopNote(pitch)
    }
    setHeldPrimaryKeys((current) => {
      const next = new Set(current)
      next.delete(held.rootKeyId)
      return next
    })
    setHeldSecondaryKeys((current) => {
      const next = new Set(current)
      for (const keyId of held.companionKeyIds) {
        next.delete(keyId)
      }
      return next
    })
  }

  function releaseAllComputerKeys() {
    for (const code of [...heldComputerKeysRef.current.keys()]) {
      releaseComputerKey(code)
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!canCaptureComputerPiano(pickerRootRef.current)) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.code === 'KeyZ') {
        event.preventDefault()
        if (event.repeat) {
          return
        }
        setOctave((current) => Math.max(OCTAVE_MIN, current - 1))
        return
      }

      if (event.code === 'KeyX') {
        event.preventDefault()
        if (event.repeat) {
          return
        }
        setOctave((current) => Math.min(OCTAVE_MAX, current + 1))
        return
      }

      const mapping = COMPUTER_PIANO_KEYS[event.code]
      if (!mapping) {
        return
      }

      event.preventDefault()
      if (event.repeat || heldComputerKeysRef.current.has(event.code)) {
        return
      }
      if (!synth.patchReady) {
        return
      }

      const keyOctave = octaveRef.current + mapping.octaveOffset
      let pitches: number[]
      try {
        pitches = placeFromPianoRef.current(mapping.note, keyOctave, false)
      } catch (caught) {
        console.warn('Computer piano note out of range:', caught)
        return
      }

      const keyIds = pitches.map((pitch) => midiToNoteName(pitch))
      const rootKeyId = keyIds[0] ?? `${mapping.note}${keyOctave}`
      const companionKeyIds = keyIds.slice(1)
      heldComputerKeysRef.current.set(event.code, {
        pitches,
        rootKeyId,
        companionKeyIds,
      })
      setHeldPrimaryKeys((current) => {
        const next = new Set(current)
        next.add(rootKeyId)
        return next
      })
      setHeldSecondaryKeys((current) => {
        const next = new Set(current)
        for (const keyId of companionKeyIds) {
          next.add(keyId)
        }
        return next
      })

      for (const pitch of pitches) {
        void synth.playNote(pitch, COMPUTER_PIANO_VELOCITY)
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (
        event.code === 'KeyZ' ||
        event.code === 'KeyX' ||
        !COMPUTER_PIANO_KEYS[event.code]
      ) {
        return
      }
      releaseComputerKey(event.code)
    }

    function onWindowBlur() {
      releaseAllComputerKeys()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onWindowBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onWindowBlur)
      releaseAllComputerKeys()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- synth methods + panel lifetime
  }, [synth])

  function handleChordHover(noteName: string, keyOctave: number) {
    const rootKeyId = `${noteName}${keyOctave}`
    if (!chordMode) {
      setHoverPrimaryKeys(new Set([rootKeyId]))
      setHoverSecondaryKeys(new Set())
      return
    }
    const rootPitch = noteNameToMidi(rootKeyId)
    const pitches = getChordPitches(rootPitch, chordType)
    const keyIds = pitches.map((pitch) => midiToNoteName(pitch))
    setHoverPrimaryKeys(new Set([keyIds[0] ?? rootKeyId]))
    setHoverSecondaryKeys(new Set(keyIds.slice(1)))
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
      setLoopEnabled((value) => !value)
    },
    undo: () => {
      undoRef.current()
    },
    redo: () => {
      redoRef.current()
    },
  })

  return (
    <div
      ref={pickerRootRef}
      tabIndex={0}
      className={cn(
        'space-y-4 outline-none',
        !embedded && 'rounded-lg border p-4',
        className,
      )}
    >
      <PianoKeyboard
        octaves={displayedOctaves}
        primaryKeys={pianoPrimaryKeys}
        secondaryKeys={pianoSecondaryKeys}
        isEditing={isEditing}
        editingLabel={isEditing ? selectedBlock?.label : null}
        disabled={!synth.patchReady}
        onNoteEnter={handleChordHover}
        onNoteLeave={() => {
          setHoverPrimaryKeys(new Set())
          setHoverSecondaryKeys(new Set())
        }}
        onNoteClick={handlePianoNote}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">OCT</Label>
        {Array.from({ length: OCTAVE_MAX - OCTAVE_MIN + 1 }, (_, octaveValue) => (
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
        {onCopyToMidiRecord ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onCopyToMidiRecord({
                noteEvents: timelineBlocksToNoteEvents(blocks, bpm),
                bpm,
              })
            }
          >
            Copy to MIDI Record
          </Button>
        ) : null}
      </div>

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
          gridBeat={gridBeat}
          selectedBlockId={selectedBlockId}
          isEditing={isEditing}
          ghost={ghost}
          playheadBeat={playheadBeat}
          playheadPulseOpacity={playheadPulseOpacity}
          onSelectBlock={handleSelectBlock}
          onGridClick={handleGridClick}
          onPlayheadMove={handlePlayheadMove}
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
        />
      </div>
    </div>
  )
}
