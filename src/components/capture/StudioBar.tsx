import { Pause, Play, Redo2, RotateCcw, Undo2 } from 'lucide-react'

import { SynthPatchSelector } from '@/components/shared/SynthPatchSelector'
import { TimeSignatureSelector } from '@/components/shared/TimeSignatureSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSynth } from '@/hooks/useSynth'
import { QUANTIZE_OPTIONS } from '@/lib/timeline-notes'
import { cn } from '@/lib/utils'

export interface StudioTransportState {
  isPlaying: boolean
  loopEnabled: boolean
  canUndo: boolean
  canRedo: boolean
  /** True while MIDI count-in / recording — locks Play / Restart / Loop / Undo / Redo. */
  transportLocked?: boolean
}

export interface StudioTransportHandlers {
  playPause: () => void
  restart: () => void
  toggleLoop: () => void
  undo: () => void
  redo: () => void
}

export const IDLE_STUDIO_TRANSPORT: StudioTransportState = {
  isPlaying: false,
  loopEnabled: true,
  canUndo: false,
  canRedo: false,
  transportLocked: false,
}

export const NOOP_STUDIO_HANDLERS: StudioTransportHandlers = {
  playPause: () => {},
  restart: () => {},
  toggleLoop: () => {},
  undo: () => {},
  redo: () => {},
}

interface StudioBarProps {
  tempo: string
  timeSignature: string
  gridBeat: number
  patchName: string | null
  transport: StudioTransportState
  onTempoChange: (value: string) => void
  onTimeSignatureChange: (value: string) => void
  onGridBeatChange: (value: number) => void
  onPatchChange: (value: string | null) => void
  onPlayPause: () => void
  onRestart: () => void
  onToggleLoop: () => void
  onUndo: () => void
  onRedo: () => void
  className?: string
}

export function StudioBar({
  tempo,
  timeSignature,
  gridBeat,
  patchName,
  transport,
  onTempoChange,
  onTimeSignatureChange,
  onGridBeatChange,
  onPatchChange,
  onPlayPause,
  onRestart,
  onToggleLoop,
  onUndo,
  onRedo,
  className,
}: StudioBarProps) {
  const { patchReady } = useSynth()
  const locked = Boolean(transport.transportLocked)
  const playDisabled = locked || !patchReady

  return (
    <div className={cn('space-y-3 rounded-lg border p-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={playDisabled}
          onClick={onPlayPause}
        >
          {transport.isPlaying && !locked ? (
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
          disabled={locked}
          onClick={onRestart}
        >
          <RotateCcw className="size-3.5" /> Restart
        </Button>
        <Button
          type="button"
          size="sm"
          variant={transport.loopEnabled ? 'default' : 'outline'}
          disabled={locked}
          onClick={onToggleLoop}
        >
          Loop
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={locked || !transport.canUndo}
          onClick={onUndo}
          aria-label="Undo"
        >
          <Undo2 className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={locked || !transport.canRedo}
          onClick={onRedo}
          aria-label="Redo"
        >
          <Redo2 className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-xs text-muted-foreground">TIME</Label>
        <TimeSignatureSelector
          compact
          hideLabel
          id="studio-bar-time"
          value={timeSignature}
          onChange={onTimeSignatureChange}
        />
        <Label
          htmlFor="studio-bar-tempo"
          className="ml-2 text-xs text-muted-foreground"
        >
          TEMPO
        </Label>
        <Input
          id="studio-bar-tempo"
          type="number"
          min={1}
          placeholder="120"
          className="h-8 w-20"
          value={tempo}
          onChange={(event) => onTempoChange(event.target.value)}
        />
        <Label
          htmlFor="studio-bar-grid"
          className="ml-2 text-xs text-muted-foreground"
        >
          Grid
        </Label>
        <select
          id="studio-bar-grid"
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          value={String(gridBeat)}
          disabled={locked}
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
      </div>

      <div className="max-w-xs">
        <SynthPatchSelector
          id="studio-bar-patch"
          value={patchName}
          onChange={onPatchChange}
        />
      </div>
    </div>
  )
}
