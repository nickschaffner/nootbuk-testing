import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Minus,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  QUANTIZE_OPTIONS,
  lineCount,
  lineRange,
  quantizeBeat,
  type BlockWidthBeats,
  type TimelineBlock,
} from '@/lib/timeline-notes'
import { cn } from '@/lib/utils'

interface BeatTimelineProps {
  blocks: TimelineBlock[]
  beatsPerBar: number
  barCount: number
  barsPerLine: number
  maxBarsPerLine: number
  cursorBeat: number
  blockWidth: BlockWidthBeats
  bpm: number
  gridBeat: number
  midiQuantize: boolean
  selectedBlockId: string | null
  isEditing: boolean
  ghost: TimelineBlock | null
  playheadBeat: number
  isRecording?: boolean
  recordOriginBeat?: number
  recordedBlockIds?: ReadonlySet<string> | null
  canUndo: boolean
  canRedo: boolean
  onSelectBlock: (id: string | null) => void
  onGridClick: (beat: number) => void
  onPlayheadMove: (beat: number) => void
  onGridBeatChange: (value: number) => void
  onMidiQuantizeChange: (value: boolean) => void
  onToggleEdit: () => void
  onResize: (id: string, deltaBeats: number) => void
  onMove: (id: string, direction: -1 | 1) => void
  onDelete: (id: string) => void
  onConfirmGhost?: () => void
  onAddBar: () => void
  onClear: () => void
  onBarsPerLineChange: (value: number) => void
  onDeleteLine: (lineIndex: number) => void
  onAddLineBelow: (lineIndex: number) => void
  onDuplicateLine: (lineIndex: number) => void
  onUndo: () => void
  onRedo: () => void
  className?: string
}

function beatFromClick(
  event: { clientX: number; currentTarget: EventTarget & HTMLElement },
  startBeat: number,
  beatsInLine: number,
  gridBeat: number,
): number {
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio =
    rect.width <= 0
      ? 0
      : Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  return Math.max(0, quantizeBeat(startBeat + ratio * beatsInLine, gridBeat))
}

function blockInRange(
  block: TimelineBlock,
  startBeat: number,
  endBeat: number,
): boolean {
  const bEnd = block.startBeat + block.durationBeats
  return block.startBeat < endBeat && bEnd > startBeat
}

export function BeatTimeline({
  blocks,
  beatsPerBar,
  barCount,
  barsPerLine,
  maxBarsPerLine,
  cursorBeat,
  blockWidth,
  bpm,
  gridBeat,
  midiQuantize,
  selectedBlockId,
  isEditing,
  ghost,
  playheadBeat,
  isRecording = false,
  recordOriginBeat = 0,
  recordedBlockIds = null,
  canUndo,
  canRedo,
  onSelectBlock,
  onGridClick,
  onPlayheadMove,
  onGridBeatChange,
  onMidiQuantizeChange,
  onToggleEdit,
  onResize,
  onMove,
  onDelete,
  onConfirmGhost,
  onAddBar,
  onClear,
  onBarsPerLineChange,
  onDeleteLine,
  onAddLineBelow,
  onDuplicateLine,
  onUndo,
  onRedo,
  className,
}: BeatTimelineProps) {
  const selected = blocks.find((block) => block.id === selectedBlockId) ?? null
  const lines = lineCount(barCount, barsPerLine)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Timeline
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Quantize</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={String(gridBeat)}
              onChange={(event) =>
                onGridBeatChange(Number.parseFloat(event.target.value))
              }
              aria-label="Quantization resolution"
            >
              {QUANTIZE_OPTIONS.map((option) => (
                <option key={option.value} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={midiQuantize}
                onChange={(event) =>
                  onMidiQuantizeChange(event.target.checked)
                }
                aria-label="Quantize MIDI recording"
              />
              MIDI rec
            </label>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Bars/line</span>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={barsPerLine <= 1}
              onClick={() => onBarsPerLineChange(barsPerLine - 1)}
              aria-label="Fewer bars per line"
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="w-4 text-center text-xs tabular-nums">
              {barsPerLine}
            </span>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={barsPerLine >= maxBarsPerLine}
              onClick={() => onBarsPerLineChange(barsPerLine + 1)}
              aria-label="More bars per line"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Undo"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Redo"
          >
            <Redo2 className="size-3.5" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onAddBar}>
            Add Bar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: lines }, (_, lineIndex) => {
          const range = lineRange(lineIndex, barsPerLine, beatsPerBar, barCount)
          const beatsInLine = Math.max(beatsPerBar, range.endBeat - range.startBeat)
          const barsInLine = range.endBar - range.startBar

          const gridSteps = Math.max(1, Math.round(beatsInLine / gridBeat))
          const stepsPerBeat = Math.max(1, Math.round(1 / gridBeat))
          const isLastLine = lineIndex === lines - 1
          const cursorAtLineEnd =
            isLastLine && cursorBeat >= range.endBeat - 1e-9
          const cursorInLine = cursorAtLineEnd
            ? true
            : isLastLine
              ? cursorBeat >= range.startBeat && cursorBeat <= range.endBeat
              : cursorBeat >= range.startBeat && cursorBeat < range.endBeat
          const cursorLeftPercent = cursorAtLineEnd
            ? 100
            : ((cursorBeat - range.startBeat) / beatsInLine) * 100
          const slotEnd = cursorBeat + blockWidth
          const slotOverlapsLine =
            slotEnd > range.startBeat && cursorBeat < range.endBeat

          return (
            <div key={`line-${lineIndex}`} className="flex items-stretch gap-2">
              <div
                className="relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded-md border bg-muted/20"
                style={{ height: 96 }}
                onClick={(event) => {
                  onGridClick(
                    beatFromClick(
                      event,
                      range.startBeat,
                      beatsInLine,
                      gridBeat,
                    ),
                  )
                }}
                onDoubleClick={(event) => {
                  event.preventDefault()
                  onPlayheadMove(
                    beatFromClick(
                      event,
                      range.startBeat,
                      beatsInLine,
                      gridBeat,
                    ),
                  )
                }}
              >
                {Array.from({ length: gridSteps + 1 }, (_, step) => {
                  const absBeat = range.startBeat + step * gridBeat
                  const isBar =
                    Math.abs(
                      absBeat / beatsPerBar - Math.round(absBeat / beatsPerBar),
                    ) < 1e-6
                  const isBeat = step % stepsPerBeat === 0
                  return (
                    <div
                      key={`grid-${lineIndex}-${step}`}
                      className={cn(
                        'pointer-events-none absolute top-0 h-full',
                        isBar
                          ? 'w-px bg-foreground/40'
                          : isBeat
                            ? 'w-px bg-border'
                            : 'w-px bg-border/40',
                      )}
                      style={{ left: `${(step / gridSteps) * 100}%` }}
                    />
                  )
                })}

                {Array.from({ length: barsInLine }, (_, barOffset) => (
                  <span
                    key={`bar-label-${lineIndex}-${barOffset}`}
                    className="absolute top-1 text-[10px] text-muted-foreground"
                    style={{
                      left: `calc(${((barOffset * beatsPerBar) / beatsInLine) * 100}% + 4px)`,
                    }}
                  >
                    {range.startBar + barOffset + 1}
                  </span>
                ))}

                {(() => {
                  if (!isRecording || playheadBeat <= recordOriginBeat + 1e-9) {
                    return null
                  }
                  const overlayStart = Math.max(
                    recordOriginBeat,
                    range.startBeat,
                  )
                  const overlayEnd = Math.min(playheadBeat, range.endBeat)
                  if (overlayEnd <= overlayStart + 1e-9) {
                    return null
                  }
                  return (
                    <div
                      className="pointer-events-none absolute top-0 z-[2] h-full bg-red-600/25"
                      style={{
                        left: `${((overlayStart - range.startBeat) / beatsInLine) * 100}%`,
                        width: `${((overlayEnd - overlayStart) / beatsInLine) * 100}%`,
                      }}
                    />
                  )
                })()}

                {blocks
                  .filter((block) =>
                    blockInRange(block, range.startBeat, range.endBeat),
                  )
                  .map((block) => {
                    const isSelected = block.id === selectedBlockId
                    const isRecordedTake = Boolean(
                      recordedBlockIds?.has(block.id),
                    )
                    return (
                      <button
                        key={block.id}
                        type="button"
                        className={cn(
                          'absolute top-8 z-[5] flex h-10 items-center justify-center overflow-hidden rounded-md border bg-background px-1 text-xs font-medium shadow-sm',
                          isSelected && 'border-primary ring-2 ring-primary/40',
                          isRecordedTake &&
                            'border-red-600 bg-red-600 text-white',
                        )}
                        style={{
                          left: `${((block.startBeat - range.startBeat) / beatsInLine) * 100}%`,
                          width: `${(block.durationBeats / beatsInLine) * 100}%`,
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectBlock(block.id)
                        }}
                      >
                        <span className="truncate">{block.label}</span>
                      </button>
                    )
                  })}

                {ghost && blockInRange(ghost, range.startBeat, range.endBeat) ? (
                  <button
                    type="button"
                    className="absolute top-8 z-10 flex h-10 items-center justify-center overflow-hidden rounded-md border border-dashed border-primary/60 bg-primary/10 px-1 text-xs font-medium text-primary"
                    style={{
                      left: `${((ghost.startBeat - range.startBeat) / beatsInLine) * 100}%`,
                      width: `${(ghost.durationBeats / beatsInLine) * 100}%`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      onConfirmGhost?.()
                    }}
                  >
                    <span className="truncate">{ghost.label}</span>
                  </button>
                ) : null}

                {slotOverlapsLine ? (
                  <div
                    className="pointer-events-none absolute top-0 z-[1] h-full bg-primary/15"
                    style={{
                      left: `${(Math.max(0, cursorBeat - range.startBeat) / beatsInLine) * 100}%`,
                      width: `${((Math.min(slotEnd, range.endBeat) - Math.max(cursorBeat, range.startBeat)) / beatsInLine) * 100}%`,
                    }}
                  />
                ) : null}

                {cursorInLine ? (
                  <div
                    className="timeline-cursor pointer-events-none absolute top-0 z-[15] h-full w-0.5 bg-primary"
                    style={{
                      left: `calc(${cursorLeftPercent}% - ${cursorAtLineEnd ? '2px' : '0px'})`,
                      animationDuration: `${60 / bpm}s`,
                    }}
                  />
                ) : null}

                {(() => {
                  const playheadAtLineEnd =
                    isLastLine && playheadBeat >= range.endBeat - 1e-9
                  const playheadInLine = playheadAtLineEnd
                    ? true
                    : playheadBeat >= range.startBeat &&
                      playheadBeat < range.endBeat + (isLastLine ? 1e-9 : 0)
                  if (!playheadInLine) {
                    return null
                  }
                  const leftPercent = playheadAtLineEnd
                    ? 100
                    : ((playheadBeat - range.startBeat) / beatsInLine) * 100
                  return (
                    <div
                      className="pointer-events-none absolute top-0 z-20 h-full"
                      style={{
                        left: `calc(${leftPercent}% - ${playheadAtLineEnd ? '2px' : '0px'})`,
                      }}
                    >
                      <div className="absolute top-0 left-1/2 z-20 h-2 w-2 -translate-x-1/2 rotate-45 bg-destructive" />
                      <div className="h-full w-0.5 bg-destructive" />
                    </div>
                  )
                })()}
              </div>

              <div className="flex shrink-0 flex-col justify-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onDeleteLine(lineIndex)}
                  aria-label="Delete line"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onAddLineBelow(lineIndex)}
                  aria-label="Add line below"
                >
                  <Plus className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onDuplicateLine(lineIndex)}
                  aria-label="Duplicate line"
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {selected ? (
        <div className="flex flex-wrap items-center gap-1 rounded-md border bg-card p-2">
          <span className="mr-2 text-xs text-muted-foreground">
            {selected.label}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => onMove(selected.id, -1)}
            aria-label="Move left"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => onMove(selected.id, 1)}
            aria-label="Move right"
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => onResize(selected.id, -gridBeat)}
            aria-label="Shrink"
          >
            <Minus className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => onResize(selected.id, gridBeat)}
            aria-label="Grow"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isEditing ? 'default' : 'outline'}
            onClick={onToggleEdit}
          >
            Edit
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onDelete(selected.id)}
            aria-label="Delete block"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : null}

      {ghost ? (
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => onConfirmGhost?.()}>
            Confirm note
          </Button>
        </div>
      ) : null}
    </div>
  )
}
