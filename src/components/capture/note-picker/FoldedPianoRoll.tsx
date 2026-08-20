import { useEffect, useMemo, useRef, useState } from 'react'

import { midiToNoteName } from '@/lib/notes'
import {
  GRID_BEAT,
  MIN_BEAT_WIDTH_PX,
  noteEventsToTimelineBlocks,
  type TimelineBlock,
} from '@/lib/timeline-notes'
import { cn } from '@/lib/utils'
import type { NoteEvent } from '@/types/idea'

interface PitchNote {
  id: string
  blockId: string
  pitch: number
  startBeat: number
  durationBeats: number
}

interface FoldedPianoRollProps {
  blocks?: TimelineBlock[]
  noteEvents?: NoteEvent[]
  bpm: number
  beatsPerBar: number
  barCount: number
  /** Visual grid resolution (same as Note Picker quantize). */
  gridBeat?: number
  playheadBeat: number
  playheadPulseOpacity?: number
  isRecording?: boolean
  isPlaying?: boolean
  recordOriginBeat?: number
  recordedBlockIds?: ReadonlySet<string> | null
  loopEnabled?: boolean
  loopStartBeat?: number
  loopEndBeat?: number
  /** When true, handle drags snap to gridBeat. */
  loopSnap?: boolean
  minLoopBeats?: number
  onLoopRegionChange?: (startBeat: number, endBeat: number) => void
  /** Double-click seeks playhead. Snap when playheadSnap is true. */
  playheadSnap?: boolean
  onPlayheadMove?: (beat: number) => void
  title?: string
  emptyMessage?: string
  className?: string
}

/** Match Note Picker BeatTimeline lane height. */
const ROLL_HEIGHT = 96
const BAR_HEADER_HEIGHT = 12
const LABEL_WIDTH = 28
const LABEL_MIN_ROW_HEIGHT = 10
const LOOP_STRIP_HEIGHT = 16
/** Space under the roll so the horizontal scrollbar does not cover pitch rows. */
const SCROLLBAR_GUTTER = 14
/** Keep playhead roughly here in the viewport while following. */
const PLAYHEAD_VIEWPORT_RATIO = 0.35
const EDGE_SCROLL_ZONE_PX = 48
const EDGE_SCROLL_MAX_PX = 18

function blockInRange(
  note: PitchNote,
  startBeat: number,
  endBeat: number,
): boolean {
  const noteEnd = note.startBeat + note.durationBeats
  return note.startBeat < endBeat && noteEnd > startBeat
}

function expandBlocksToPitchNotes(blocks: TimelineBlock[]): PitchNote[] {
  const result: PitchNote[] = []
  for (const block of blocks) {
    for (const pitch of block.pitches) {
      result.push({
        id: `${block.id}-${pitch}`,
        blockId: block.id,
        pitch,
        startBeat: block.startBeat,
        durationBeats: block.durationBeats,
      })
    }
  }
  return result
}

function labelFontSize(rowHeight: number): number {
  return Math.max(7, Math.min(11, Math.floor(rowHeight * 0.55)))
}

function noteBlockMetrics(rowHeight: number): {
  topPad: number
  height: number
} {
  if (rowHeight <= 3) {
    return { topPad: 0, height: Math.max(1, rowHeight) }
  }
  if (rowHeight <= 8) {
    return { topPad: 1, height: Math.max(1, rowHeight - 2) }
  }
  const topPad = Math.max(1, Math.round(rowHeight * 0.15))
  return { topPad, height: Math.max(2, rowHeight - topPad * 2) }
}

function snapBeat(beat: number, snap: boolean, grid: number): number {
  if (!snap || grid <= 0) {
    return Math.max(0, beat)
  }
  return Math.max(0, Math.round(beat / grid) * grid)
}

/** Absolute beat 0 → "1.1"; beat 4 in 4/4 → "2.1". */
function formatBarBeat(absBeat: number, beatsPerBar: number): string {
  const bpb = Math.max(1, beatsPerBar)
  const bar = Math.floor(absBeat / bpb) + 1
  const beatInBar = absBeat - (bar - 1) * bpb + 1
  const beatText =
    Math.abs(beatInBar - Math.round(beatInBar)) < 1e-6
      ? String(Math.round(beatInBar))
      : String(Math.round(beatInBar * 1000) / 1000)
  return `${bar}.${beatText}`
}

function parseBarBeat(text: string, beatsPerBar: number): number | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }
  const match = /^(\d+)\.(.+)$/.exec(trimmed)
  if (!match) {
    return null
  }
  const bar = Number.parseInt(match[1], 10)
  const beat = Number.parseFloat(match[2])
  if (!Number.isFinite(bar) || !Number.isFinite(beat) || bar < 1 || beat < 1) {
    return null
  }
  const bpb = Math.max(1, beatsPerBar)
  return (bar - 1) * bpb + (beat - 1)
}

function formatLengthBars(durationBeats: number, beatsPerBar: number): string {
  const bpb = Math.max(1, beatsPerBar)
  const bars = durationBeats / bpb
  if (Math.abs(bars - Math.round(bars)) < 1e-6) {
    return String(Math.round(bars))
  }
  return String(Math.round(bars * 1000) / 1000)
}

function parseLengthBars(text: string, beatsPerBar: number): number | null {
  const bars = Number.parseFloat(text.trim())
  if (!Number.isFinite(bars) || bars <= 0) {
    return null
  }
  return bars * Math.max(1, beatsPerBar)
}

export function FoldedPianoRoll({
  blocks: blocksProp,
  noteEvents,
  bpm,
  beatsPerBar,
  barCount,
  gridBeat = GRID_BEAT,
  playheadBeat,
  playheadPulseOpacity = 1,
  isPlaying = false,
  isRecording = false,
  recordOriginBeat = 0,
  recordedBlockIds = null,
  loopEnabled = false,
  loopStartBeat = 0,
  loopEndBeat = 4,
  loopSnap = false,
  minLoopBeats = 1,
  onLoopRegionChange,
  playheadSnap = false,
  onPlayheadMove,
  title = 'Recording',
  emptyMessage = 'No notes yet — press Record to capture MIDI',
  className,
}: FoldedPianoRollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    which: 'start' | 'end'
    pointerId: number
    lastClientX: number
  } | null>(null)
  const autoScrollRafRef = useRef<number | null>(null)
  const loopStartRef = useRef(loopStartBeat)
  const loopEndRef = useRef(loopEndBeat)
  loopStartRef.current = loopStartBeat
  loopEndRef.current = loopEndBeat
  const onLoopRegionChangeRef = useRef(onLoopRegionChange)
  onLoopRegionChangeRef.current = onLoopRegionChange

  const [startText, setStartText] = useState(() =>
    formatBarBeat(loopStartBeat, beatsPerBar),
  )
  const [lengthText, setLengthText] = useState(() =>
    formatLengthBars(loopEndBeat - loopStartBeat, beatsPerBar),
  )
  const startFocusedRef = useRef(false)
  const lengthFocusedRef = useRef(false)

  const blocks = useMemo(() => {
    if (blocksProp) {
      return blocksProp
    }
    if (noteEvents && noteEvents.length > 0) {
      return noteEventsToTimelineBlocks(noteEvents, bpm)
    }
    return []
  }, [blocksProp, noteEvents, bpm])

  const pitchNotes = useMemo(() => expandBlocksToPitchNotes(blocks), [blocks])
  const pitches = useMemo(
    () =>
      [...new Set(pitchNotes.map((note) => note.pitch))].sort((a, b) => b - a),
    [pitchNotes],
  )

  const pitchCount = Math.max(1, pitches.length)
  const rowsAreaHeight = ROLL_HEIGHT - BAR_HEADER_HEIGHT
  const rowHeight = rowsAreaHeight / pitchCount
  const showLabels = rowHeight >= LABEL_MIN_ROW_HEIGHT
  const fontSize = labelFontSize(rowHeight)
  const noteMetrics = noteBlockMetrics(rowHeight)
  const labelColumnWidth = showLabels ? LABEL_WIDTH : 0

  const safeGrid = gridBeat > 0 ? gridBeat : GRID_BEAT
  const totalBeats = Math.max(
    beatsPerBar,
    barCount * beatsPerBar,
    loopEnabled ? loopEndBeat : 0,
  )
  const beatWidthPx = MIN_BEAT_WIDTH_PX
  const stripWidthPx = totalBeats * beatWidthPx
  const gridSteps = Math.max(1, Math.round(totalBeats / safeGrid))
  const stepsPerBeat = Math.max(1, Math.round(1 / safeGrid))
  const followPlayhead = isRecording || isPlaying
  const contentHeight =
    ROLL_HEIGHT + (loopEnabled ? LOOP_STRIP_HEIGHT : 0)
  const scrollAreaHeight = contentHeight + SCROLLBAR_GUTTER
  const minLen = Math.max(minLoopBeats, loopSnap ? safeGrid : minLoopBeats)

  useEffect(() => {
    if (!startFocusedRef.current) {
      setStartText(formatBarBeat(loopStartBeat, beatsPerBar))
    }
    if (!lengthFocusedRef.current) {
      setLengthText(
        formatLengthBars(loopEndBeat - loopStartBeat, beatsPerBar),
      )
    }
  }, [loopStartBeat, loopEndBeat, beatsPerBar])

  useEffect(() => {
    if (!followPlayhead || dragRef.current) {
      return
    }
    const el = scrollRef.current
    if (!el) {
      return
    }
    const playheadX = playheadBeat * beatWidthPx
    const target = playheadX - el.clientWidth * PLAYHEAD_VIEWPORT_RATIO
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    el.scrollLeft = Math.max(0, Math.min(maxScroll, target))
  }, [followPlayhead, playheadBeat, beatWidthPx, stripWidthPx])

  useEffect(() => {
    return () => {
      if (autoScrollRafRef.current != null) {
        window.cancelAnimationFrame(autoScrollRafRef.current)
      }
    }
  }, [])

  function beatFromClientX(clientX: number, snap: boolean): number {
    const el = scrollRef.current
    if (!el) {
      return 0
    }
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left + el.scrollLeft
    return snapBeat(x / beatWidthPx, snap, safeGrid)
  }

  function clampLoopRegion(
    start: number,
    end: number,
    which: 'start' | 'end',
  ): { start: number; end: number } {
    let nextStart = start
    let nextEnd = end
    if (which === 'start') {
      nextStart = Math.min(nextStart, nextEnd - minLen)
      nextStart = Math.max(0, nextStart)
    } else {
      nextEnd = Math.max(nextEnd, nextStart + minLen)
    }
    return { start: nextStart, end: nextEnd }
  }

  function applyDragFromClientX(clientX: number) {
    const onChange = onLoopRegionChangeRef.current
    const drag = dragRef.current
    if (!drag || !onChange) {
      return
    }
    const beat = beatFromClientX(clientX, loopSnap)
    if (drag.which === 'start') {
      const next = clampLoopRegion(beat, loopEndRef.current, 'start')
      onChange(next.start, next.end)
    } else {
      const next = clampLoopRegion(loopStartRef.current, beat, 'end')
      onChange(next.start, next.end)
    }
  }

  function edgeScrollFromClientX(clientX: number): number {
    const el = scrollRef.current
    if (!el) {
      return 0
    }
    const rect = el.getBoundingClientRect()
    let delta = 0
    if (clientX < rect.left + EDGE_SCROLL_ZONE_PX) {
      const t = 1 - (clientX - rect.left) / EDGE_SCROLL_ZONE_PX
      delta = -EDGE_SCROLL_MAX_PX * Math.max(0, Math.min(1, t))
    } else if (clientX > rect.right - EDGE_SCROLL_ZONE_PX) {
      const t = 1 - (rect.right - clientX) / EDGE_SCROLL_ZONE_PX
      delta = EDGE_SCROLL_MAX_PX * Math.max(0, Math.min(1, t))
    }
    if (delta === 0) {
      return 0
    }
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    const next = Math.max(0, Math.min(maxScroll, el.scrollLeft + delta))
    const applied = next - el.scrollLeft
    el.scrollLeft = next
    return applied
  }

  function stopAutoScroll() {
    if (autoScrollRafRef.current != null) {
      window.cancelAnimationFrame(autoScrollRafRef.current)
      autoScrollRafRef.current = null
    }
  }

  function tickAutoScroll() {
    const drag = dragRef.current
    if (!drag) {
      autoScrollRafRef.current = null
      return
    }
    edgeScrollFromClientX(drag.lastClientX)
    applyDragFromClientX(drag.lastClientX)
    autoScrollRafRef.current = window.requestAnimationFrame(tickAutoScroll)
  }

  function startAutoScroll() {
    if (autoScrollRafRef.current != null) {
      return
    }
    autoScrollRafRef.current = window.requestAnimationFrame(tickAutoScroll)
  }

  function onHandlePointerDown(
    which: 'start' | 'end',
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (!onLoopRegionChange || isRecording) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      which,
      pointerId: event.pointerId,
      lastClientX: event.clientX,
    }
    startAutoScroll()
  }

  function onHandlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }
    drag.lastClientX = event.clientX
    edgeScrollFromClientX(event.clientX)
    applyDragFromClientX(event.clientX)
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }
    dragRef.current = null
    stopAutoScroll()
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Already released.
    }
  }

  function handleRollDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!onPlayheadMove || isRecording) {
      return
    }
    event.preventDefault()
    const beat = Math.min(
      totalBeats,
      beatFromClientX(event.clientX, playheadSnap),
    )
    onPlayheadMove(beat)
  }

  function commitStartText(raw: string) {
    if (!onLoopRegionChange) {
      return
    }
    const parsed = parseBarBeat(raw, beatsPerBar)
    if (parsed == null) {
      setStartText(formatBarBeat(loopStartBeat, beatsPerBar))
      return
    }
    const snapped = snapBeat(parsed, loopSnap, safeGrid)
    const next = clampLoopRegion(snapped, loopEndBeat, 'start')
    onLoopRegionChange(next.start, next.end)
    setStartText(formatBarBeat(next.start, beatsPerBar))
  }

  function commitLengthText(raw: string) {
    if (!onLoopRegionChange) {
      return
    }
    const duration = parseLengthBars(raw, beatsPerBar)
    if (duration == null) {
      setLengthText(
        formatLengthBars(loopEndBeat - loopStartBeat, beatsPerBar),
      )
      return
    }
    let end = loopStartBeat + duration
    if (loopSnap) {
      end = snapBeat(end, true, safeGrid)
    }
    const next = clampLoopRegion(loopStartBeat, end, 'end')
    onLoopRegionChange(next.start, next.end)
    setLengthText(formatLengthBars(next.end - next.start, beatsPerBar))
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        {loopEnabled ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              Start
              <input
                type="text"
                inputMode="decimal"
                value={startText}
                disabled={isRecording}
                aria-label="Loop start bar.beat"
                className="h-6 w-14 rounded border border-input bg-background px-1.5 font-mono text-[11px] text-foreground"
                onFocus={() => {
                  startFocusedRef.current = true
                }}
                onChange={(event) => setStartText(event.target.value)}
                onBlur={() => {
                  startFocusedRef.current = false
                  commitStartText(startText)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
              />
            </label>
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              Length
              <input
                type="text"
                inputMode="decimal"
                value={lengthText}
                disabled={isRecording}
                aria-label="Loop length in bars"
                className="h-6 w-12 rounded border border-input bg-background px-1.5 font-mono text-[11px] text-foreground"
                onFocus={() => {
                  lengthFocusedRef.current = true
                }}
                onChange={(event) => setLengthText(event.target.value)}
                onBlur={() => {
                  lengthFocusedRef.current = false
                  commitLengthText(lengthText)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
              />
            </label>
          </div>
        ) : null}
      </div>

      {pitches.length === 0 && !loopEnabled ? (
        <div
          className="flex items-center justify-center rounded-md border bg-muted/20 text-[11px] text-muted-foreground"
          style={{ height: ROLL_HEIGHT }}
        >
          {emptyMessage}
        </div>
      ) : (
        <div className="flex items-stretch overflow-hidden rounded-md border">
          {showLabels ? (
            <div
              className="relative shrink-0 border-r bg-muted/30"
              style={{ width: labelColumnWidth, height: scrollAreaHeight }}
            >
              {loopEnabled ? (
                <div
                  className="absolute inset-x-0 top-0 border-b border-border/40 bg-muted/40"
                  style={{ height: LOOP_STRIP_HEIGHT }}
                />
              ) : null}
              <div
                className="absolute inset-x-0 border-b border-border/50"
                style={{
                  top: loopEnabled ? LOOP_STRIP_HEIGHT : 0,
                  height: BAR_HEADER_HEIGHT,
                }}
              />
              {pitches.map((pitch, rowIndex) => (
                <div
                  key={`label-${pitch}`}
                  className="absolute right-0 left-0 flex items-center justify-end border-b border-border/30 pr-1 font-mono leading-none text-muted-foreground"
                  style={{
                    top:
                      (loopEnabled ? LOOP_STRIP_HEIGHT : 0) +
                      BAR_HEADER_HEIGHT +
                      rowIndex * rowHeight,
                    height: rowHeight,
                    fontSize,
                  }}
                >
                  {midiToNoteName(pitch)}
                </div>
              ))}
            </div>
          ) : null}

          <div
            ref={scrollRef}
            className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
            style={{ height: scrollAreaHeight }}
          >
            <div
              className="relative bg-muted/20"
              style={{
                width: stripWidthPx,
                height: contentHeight,
                paddingBottom: SCROLLBAR_GUTTER,
                boxSizing: 'content-box',
              }}
            >
              {loopEnabled ? (
                <div
                  className="absolute inset-x-0 top-0 z-30 border-b border-border/50 bg-muted/30"
                  style={{ height: LOOP_STRIP_HEIGHT }}
                >
                  <div
                    className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary/50"
                    style={{
                      left: loopStartBeat * beatWidthPx,
                      width: Math.max(
                        0,
                        (loopEndBeat - loopStartBeat) * beatWidthPx,
                      ),
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Loop start"
                    disabled={isRecording}
                    className="absolute top-0 z-40 flex h-full w-3 -translate-x-1/2 cursor-ew-resize items-center justify-center disabled:cursor-default"
                    style={{ left: loopStartBeat * beatWidthPx }}
                    onPointerDown={(event) =>
                      onHandlePointerDown('start', event)
                    }
                    onPointerMove={onHandlePointerMove}
                    onPointerUp={onHandlePointerUp}
                    onPointerCancel={onHandlePointerUp}
                  >
                    <span className="block h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-primary" />
                  </button>
                  <button
                    type="button"
                    aria-label="Loop end"
                    disabled={isRecording}
                    className="absolute top-0 z-40 flex h-full w-3 -translate-x-1/2 cursor-ew-resize items-center justify-center disabled:cursor-default"
                    style={{ left: loopEndBeat * beatWidthPx }}
                    onPointerDown={(event) => onHandlePointerDown('end', event)}
                    onPointerMove={onHandlePointerMove}
                    onPointerUp={onHandlePointerUp}
                    onPointerCancel={onHandlePointerUp}
                  >
                    <span className="block h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-primary" />
                  </button>
                </div>
              ) : null}

              <div
                className="absolute inset-x-0 cursor-pointer"
                style={{
                  top: loopEnabled ? LOOP_STRIP_HEIGHT : 0,
                  height: ROLL_HEIGHT,
                }}
                onDoubleClick={handleRollDoubleClick}
              >
                {Array.from({ length: gridSteps + 1 }, (_, step) => {
                  const absBeat = step * safeGrid
                  const isBar =
                    Math.abs(
                      absBeat / beatsPerBar -
                        Math.round(absBeat / beatsPerBar),
                    ) < 1e-6
                  const isBeat = step % stepsPerBeat === 0
                  return (
                    <div
                      key={`grid-${step}`}
                      className={cn(
                        'pointer-events-none absolute top-0 h-full',
                        isBar
                          ? 'w-px bg-foreground/35'
                          : isBeat
                            ? 'w-px bg-border'
                            : 'w-px bg-border/35',
                      )}
                      style={{ left: absBeat * beatWidthPx }}
                    />
                  )
                })}

                {Array.from({ length: Math.ceil(totalBeats / beatsPerBar) }, (_, barIndex) => (
                  <span
                    key={`bar-label-${barIndex}`}
                    className="absolute z-[1] text-[9px] leading-none text-muted-foreground"
                    style={{
                      top: 1,
                      left: barIndex * beatsPerBar * beatWidthPx + 3,
                    }}
                  >
                    {barIndex + 1}
                  </span>
                ))}

                {pitches.map((pitch, rowIndex) => (
                  <div
                    key={`row-line-${pitch}`}
                    className="pointer-events-none absolute inset-x-0 border-b border-border/25"
                    style={{
                      top: BAR_HEADER_HEIGHT + rowIndex * rowHeight,
                      height: rowHeight,
                    }}
                  />
                ))}

                {(() => {
                  if (
                    !isRecording ||
                    playheadBeat <= recordOriginBeat + 1e-9
                  ) {
                    return null
                  }
                  const overlayStart = Math.max(0, recordOriginBeat)
                  const overlayEnd = Math.min(playheadBeat, totalBeats)
                  if (overlayEnd <= overlayStart + 1e-9) {
                    return null
                  }
                  return (
                    <div
                      className="pointer-events-none absolute top-0 z-[2] h-full bg-recorder-red/25"
                      style={{
                        left: overlayStart * beatWidthPx,
                        width: (overlayEnd - overlayStart) * beatWidthPx,
                      }}
                    />
                  )
                })()}

                {pitchNotes
                  .filter((note) => blockInRange(note, 0, totalBeats))
                  .map((note) => {
                    const rowIndex = pitches.indexOf(note.pitch)
                    const isRecordedTake = Boolean(
                      recordedBlockIds?.has(note.blockId),
                    )
                    return (
                      <div
                        key={note.id}
                        className={cn(
                          'pointer-events-none absolute z-[5] rounded-[1px]',
                          isRecordedTake ? 'bg-recorder-red' : 'bg-primary/80',
                        )}
                        style={{
                          top:
                            BAR_HEADER_HEIGHT +
                            rowIndex * rowHeight +
                            noteMetrics.topPad,
                          height: noteMetrics.height,
                          left: note.startBeat * beatWidthPx,
                          width: Math.max(2, note.durationBeats * beatWidthPx),
                        }}
                      />
                    )
                  })}

                {(() => {
                  if (playheadBeat < -1e-9 || playheadBeat > totalBeats + 1e-6) {
                    return null
                  }
                  const left = Math.min(totalBeats, Math.max(0, playheadBeat))
                  return (
                    <div
                      className="pointer-events-none absolute top-0 z-20 h-full"
                      style={{
                        left: left * beatWidthPx,
                        opacity: playheadPulseOpacity,
                        filter: `brightness(${0.75 + playheadPulseOpacity * 0.85})`,
                        transition:
                          'opacity 140ms ease-out, filter 140ms ease-out',
                      }}
                    >
                      <div
                        className="absolute top-0 left-1/2 z-20 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-destructive shadow-[0_0_6px_1px] shadow-destructive/80"
                        style={{
                          transform: `translateX(-50%) rotate(45deg) scale(${0.85 + playheadPulseOpacity * 0.35})`,
                          transition: 'transform 140ms ease-out',
                        }}
                      />
                      <div
                        className="h-full w-0.5 bg-destructive shadow-[0_0_6px_1px] shadow-destructive/70"
                        style={{
                          transform: `scaleX(${0.75 + playheadPulseOpacity * 0.5})`,
                          transformOrigin: 'center',
                          transition: 'transform 140ms ease-out',
                        }}
                      />
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
