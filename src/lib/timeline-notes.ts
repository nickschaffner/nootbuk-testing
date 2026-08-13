import {
  formatChordBlockLabel,
  inferChordTypeFromPitches,
  type ChordType,
} from '@/lib/chords'
import { midiToNoteName } from '@/lib/notes'
import type { NoteEvent } from '@/types/idea'

/** Default quantization when none is selected (quarter beat). */
export const GRID_BEAT = 0.25

export const QUANTIZE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: '1 beat' },
  { value: 0.5, label: '1/2 beat' },
  { value: 0.25, label: '1/4 beat' },
  { value: 0.125, label: '1/8 beat' },
  { value: 0.0625, label: '1/16 beat' },
  { value: 0.03125, label: '1/32 beat' },
  { value: 0.015625, label: '1/64 beat' },
]

/** Minimum beat width in pixels before bars-per-line cannot increase. */
export const MIN_BEAT_WIDTH_PX = 30

export type BlockWidthBeats = 0.25 | 0.5 | 1 | 2 | 4

export const BLOCK_WIDTH_OPTIONS: Array<{
  value: BlockWidthBeats
  label: string
}> = [
  { value: 0.25, label: '¼ beat' },
  { value: 0.5, label: '½ beat' },
  { value: 1, label: '1 beat' },
  { value: 2, label: '2 beats' },
  { value: 4, label: '4 beats' },
]

export interface TimelineBlock {
  id: string
  /** Absolute start in beats from timeline origin. */
  startBeat: number
  durationBeats: number
  /** MIDI pitches (one = single note, many = chord). */
  pitches: number[]
  label: string
  chordType: ChordType | null
}

export interface TimelineSnapshot {
  blocks: TimelineBlock[]
  barCount: number
}

const EPS = 1e-9

export function parseBeatsPerBar(timeSignature: string | null | undefined): number {
  if (!timeSignature) {
    return 4
  }
  const match = /^(\d+)\s*\/\s*\d+$/.exec(timeSignature.trim())
  if (!match) {
    return 4
  }
  const beats = Number.parseInt(match[1], 10)
  return Number.isFinite(beats) && beats > 0 ? beats : 4
}

export function secondsPerBeat(bpm: number): number {
  const safe = bpm > 0 ? bpm : 120
  return 60 / safe
}

export function quantizeBeat(beat: number, grid = GRID_BEAT): number {
  return Math.round(beat / grid) * grid
}

function sortBlocks(blocks: TimelineBlock[]): TimelineBlock[] {
  return [...blocks].sort((a, b) => a.startBeat - b.startBeat)
}

export function cloneBlocks(blocks: TimelineBlock[]): TimelineBlock[] {
  return blocks.map((block) => ({ ...block, pitches: [...block.pitches] }))
}

export function cloneSnapshot(snapshot: TimelineSnapshot): TimelineSnapshot {
  return {
    blocks: cloneBlocks(snapshot.blocks),
    barCount: snapshot.barCount,
  }
}

export function timelineEndBeat(blocks: TimelineBlock[]): number {
  if (blocks.length === 0) {
    return 0
  }
  return Math.max(...blocks.map((block) => block.startBeat + block.durationBeats))
}

export function barCountForBlocks(
  blocks: TimelineBlock[],
  beatsPerBar: number,
  minimumBars = 1,
): number {
  const end = timelineEndBeat(blocks)
  const needed = Math.max(
    minimumBars,
    Math.ceil(end / beatsPerBar - EPS) || minimumBars,
  )
  return Math.max(minimumBars, needed)
}

/** Drop trailing empty bars but keep at least `minimumBars`. */
export function trimBarCount(
  blocks: TimelineBlock[],
  beatsPerBar: number,
  currentBars: number,
  minimumBars = 1,
): number {
  const needed = barCountForBlocks(blocks, beatsPerBar, minimumBars)
  return Math.max(minimumBars, Math.min(currentBars, needed))
}

export function createNoteBlock(
  pitch: number,
  startBeat: number,
  durationBeats: number,
): TimelineBlock {
  return {
    id: crypto.randomUUID(),
    startBeat,
    durationBeats,
    pitches: [pitch],
    label: midiToNoteName(pitch),
    chordType: null,
  }
}

export function createChordBlock(
  rootPitch: number,
  chordType: ChordType,
  pitches: number[],
  startBeat: number,
  durationBeats: number,
): TimelineBlock {
  return {
    id: crypto.randomUUID(),
    startBeat,
    durationBeats,
    pitches,
    label: formatChordBlockLabel(rootPitch, chordType),
    chordType,
  }
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd - EPS && bStart < aEnd - EPS
}

function isExcepted(
  id: string,
  except?: string | ReadonlySet<string>,
): boolean {
  if (!except) {
    return false
  }
  if (typeof except === 'string') {
    return id === except
  }
  return except.has(id)
}

/**
 * Clip (trim / split / remove) every block other than `except` that overlaps
 * [regionStart, regionEnd). Nothing is pushed or pulled.
 */
export function clipOverlapping(
  blocks: TimelineBlock[],
  regionStart: number,
  regionEnd: number,
  except?: string | ReadonlySet<string>,
): TimelineBlock[] {
  if (regionEnd <= regionStart + EPS) {
    return blocks
  }

  const result: TimelineBlock[] = []

  for (const block of blocks) {
    if (isExcepted(block.id, except)) {
      result.push(block)
      continue
    }

    const bStart = block.startBeat
    const bEnd = block.startBeat + block.durationBeats

    if (!rangesOverlap(bStart, bEnd, regionStart, regionEnd)) {
      result.push(block)
      continue
    }

    const keepLeft = regionStart - bStart
    const keepRight = bEnd - regionEnd

    if (keepLeft > EPS) {
      result.push({ ...block, durationBeats: keepLeft })
    }

    if (keepRight > EPS) {
      result.push({
        ...block,
        id: crypto.randomUUID(),
        startBeat: regionEnd,
        durationBeats: keepRight,
        pitches: [...block.pitches],
      })
    }
  }

  return result
}

/** Place a block on the grid, clipping anything it overlaps. */
export function placeBlockOnGrid(
  blocks: TimelineBlock[],
  block: TimelineBlock,
  grid: number = GRID_BEAT,
): TimelineBlock[] {
  const start =
    grid > 0
      ? Math.max(0, quantizeBeat(block.startBeat, grid))
      : Math.max(0, block.startBeat)
  const placed = { ...block, startBeat: start }
  const clipped = clipOverlapping(
    blocks,
    placed.startBeat,
    placed.startBeat + placed.durationBeats,
  )
  return sortBlocks([...clipped, placed])
}

export function deleteBlock(
  blocks: TimelineBlock[],
  blockId: string,
): TimelineBlock[] {
  return blocks.filter((block) => block.id !== blockId)
}

export function resizeBlock(
  blocks: TimelineBlock[],
  blockId: string,
  deltaBeats: number,
  grid: number = GRID_BEAT,
): TimelineBlock[] {
  if (deltaBeats === 0) {
    return blocks
  }

  const target = blocks.find((block) => block.id === blockId)
  if (!target) {
    return blocks
  }

  const step = grid > 0 ? grid : GRID_BEAT
  const nextDuration = Math.max(
    step,
    quantizeBeat(target.durationBeats, step) + deltaBeats,
  )
  if (nextDuration < step - EPS) {
    return blocks
  }

  const resized = blocks.map((block) =>
    block.id === blockId ? { ...block, durationBeats: nextDuration } : block,
  )

  if (deltaBeats < 0) {
    return resized
  }

  return clipOverlapping(
    resized,
    target.startBeat,
    target.startBeat + nextDuration,
    blockId,
  )
}

export function moveBlock(
  blocks: TimelineBlock[],
  blockId: string,
  direction: -1 | 1,
  grid: number = GRID_BEAT,
): TimelineBlock[] {
  const target = blocks.find((block) => block.id === blockId)
  if (!target) {
    return blocks
  }

  const step = grid > 0 ? grid : GRID_BEAT
  const nextStart = quantizeBeat(target.startBeat + direction * step, step)
  if (nextStart < -EPS) {
    return blocks
  }

  const moved = blocks.map((block) =>
    block.id === blockId ? { ...block, startBeat: nextStart } : block,
  )

  return clipOverlapping(
    moved,
    nextStart,
    nextStart + target.durationBeats,
    blockId,
  )
}

export function updateBlockSound(
  blocks: TimelineBlock[],
  blockId: string,
  patch: Pick<TimelineBlock, 'pitches' | 'label' | 'chordType'>,
): TimelineBlock[] {
  return blocks.map((block) =>
    block.id === blockId
      ? {
          ...block,
          pitches: [...patch.pitches],
          label: patch.label,
          chordType: patch.chordType,
        }
      : block,
  )
}

export function lineCount(barCount: number, barsPerLine: number): number {
  const perLine = Math.max(1, barsPerLine)
  return Math.max(1, Math.ceil(barCount / perLine))
}

export function lineRange(
  lineIndex: number,
  barsPerLine: number,
  beatsPerBar: number,
  barCount: number,
): { startBar: number; endBar: number; startBeat: number; endBeat: number } {
  const perLine = Math.max(1, barsPerLine)
  const startBar = lineIndex * perLine
  const endBar = Math.min(startBar + perLine, barCount)
  return {
    startBar,
    endBar,
    startBeat: startBar * beatsPerBar,
    endBeat: endBar * beatsPerBar,
  }
}

function shiftBlocksFrom(
  blocks: TimelineBlock[],
  fromBeat: number,
  deltaBeats: number,
): TimelineBlock[] {
  if (Math.abs(deltaBeats) < EPS) {
    return blocks
  }
  return blocks.map((block) =>
    block.startBeat >= fromBeat - EPS
      ? { ...block, startBeat: block.startBeat + deltaBeats }
      : block,
  )
}

/** Remove a visual line of bars and its notes; later bars shift up. */
export function deleteLine(
  blocks: TimelineBlock[],
  barCount: number,
  lineIndex: number,
  barsPerLine: number,
  beatsPerBar: number,
): TimelineSnapshot {
  const { startBeat, endBeat, startBar, endBar } = lineRange(
    lineIndex,
    barsPerLine,
    beatsPerBar,
    barCount,
  )
  const removedBars = endBar - startBar
  if (removedBars <= 0) {
    return { blocks, barCount }
  }

  const kept = blocks.filter((block) => {
    const bEnd = block.startBeat + block.durationBeats
    return bEnd <= startBeat + EPS || block.startBeat >= endBeat - EPS
  })
  const shifted = shiftBlocksFrom(kept, endBeat, startBeat - endBeat)
  return {
    blocks: shifted,
    barCount: Math.max(1, barCount - removedBars),
  }
}

/** Insert an empty line of bars after this line; later notes shift down. */
export function insertLineAfter(
  blocks: TimelineBlock[],
  barCount: number,
  lineIndex: number,
  barsPerLine: number,
  beatsPerBar: number,
): TimelineSnapshot {
  const { endBeat } = lineRange(lineIndex, barsPerLine, beatsPerBar, barCount)
  const insertBeats = Math.max(1, barsPerLine) * beatsPerBar
  return {
    blocks: shiftBlocksFrom(blocks, endBeat, insertBeats),
    barCount: barCount + Math.max(1, barsPerLine),
  }
}

/** Copy this line's notes and insert the copy directly below. */
export function duplicateLine(
  blocks: TimelineBlock[],
  barCount: number,
  lineIndex: number,
  barsPerLine: number,
  beatsPerBar: number,
): TimelineSnapshot {
  const { startBeat, endBeat } = lineRange(
    lineIndex,
    barsPerLine,
    beatsPerBar,
    barCount,
  )
  const lineBeats = endBeat - startBeat
  if (lineBeats <= EPS) {
    return { blocks, barCount }
  }

  const copies = blocks
    .filter((block) => {
      const bEnd = block.startBeat + block.durationBeats
      return block.startBeat >= startBeat - EPS && bEnd <= endBeat + EPS
    })
    .map((block) => ({
      ...block,
      id: crypto.randomUUID(),
      startBeat: block.startBeat + lineBeats,
      pitches: [...block.pitches],
    }))

  const shifted = shiftBlocksFrom(blocks, endBeat, lineBeats)
  return {
    blocks: sortBlocks([...shifted, ...copies]),
    barCount: barCount + (endBeat - startBeat) / beatsPerBar,
  }
}

export function timelineBlocksToNoteEvents(
  blocks: TimelineBlock[],
  bpm: number,
): NoteEvent[] {
  const spb = secondsPerBeat(bpm)
  const events: NoteEvent[] = []

  for (const block of sortBlocks(blocks)) {
    const startTime = block.startBeat * spb
    const duration = block.durationBeats * spb
    for (const pitch of block.pitches) {
      events.push({
        pitch,
        startTime,
        duration,
        velocity: 96,
      })
    }
  }

  return events
}

/**
 * Convert NoteEvents to timeline blocks. Simultaneous notes become chords.
 * Timing is preserved exactly — imported / extracted MIDI is not quantized.
 */
export function noteEventsToTimelineBlocks(
  events: NoteEvent[],
  bpm: number,
): TimelineBlock[] {
  if (events.length === 0) {
    return []
  }

  const spb = secondsPerBeat(bpm)
  const sorted = [...events].sort((a, b) => {
    if (a.startTime !== b.startTime) {
      return a.startTime - b.startTime
    }
    return a.pitch - b.pitch
  })

  const groups: NoteEvent[][] = []
  for (const event of sorted) {
    const last = groups[groups.length - 1]
    if (last && Math.abs(last[0].startTime - event.startTime) < 1e-6) {
      last.push(event)
    } else {
      groups.push([event])
    }
  }

  const blocks: TimelineBlock[] = []

  for (const group of groups) {
    const startBeat = group[0].startTime / spb
    const maxDurSec = Math.max(...group.map((event) => event.duration))
    const durationBeats = Math.max(EPS, maxDurSec / spb)
    const pitches = [...new Set(group.map((event) => event.pitch))].sort(
      (a, b) => a - b,
    )
    const rootPitch = pitches[0]
    const chordType =
      pitches.length > 1 ? inferChordTypeFromPitches(rootPitch, pitches) : null

    blocks.push({
      id: crypto.randomUUID(),
      startBeat,
      durationBeats,
      pitches,
      label:
        chordType != null
          ? formatChordBlockLabel(rootPitch, chordType)
          : midiToNoteName(rootPitch),
      chordType,
    })
  }

  return sortBlocks(blocks)
}
