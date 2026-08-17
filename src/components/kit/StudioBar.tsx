import { Pause, Play, Redo2, Repeat, RotateCcw, Undo2 } from 'lucide-react'
import { cn } from './cn'
import { IconButton } from './IconButton'
import { Pick } from './Pick'
import { MonoLabel } from './Field'
import { QUANTIZE_OPTIONS, SYNTH_PATCHES, TIME_SIGNATURES } from './options'

// ─────────────────────────────────────────────────────────────────────────
// StudioBar — the shared capture transport + parameter ledger. A transport
// strip (play/restart/loop · undo/redo) over a four-column ledger
// (Time · Tempo · Grid · Patch). All state is lifted: pass values + handlers.
// ─────────────────────────────────────────────────────────────────────────

export interface StudioBarProps {
  playing?: boolean
  loop?: boolean
  tempo?: number
  timeSig?: string
  grid?: string
  patch?: string
  onPlayToggle?: () => void
  onRestart?: () => void
  onLoopToggle?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onTempoChange?: (v: number) => void
  onTimeSigChange?: (v: string) => void
  onGridChange?: (v: string) => void
  onPatchChange?: (v: string) => void
  className?: string
}

function LedgerCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l border-hairline px-3 py-2 first:border-l-0">
      <MonoLabel>{label}</MonoLabel>
      {children}
    </div>
  )
}

export function StudioBar({
  playing = false,
  loop = false,
  tempo = 120,
  timeSig = '4/4',
  grid = '0.25',
  patch = 'piano',
  onPlayToggle,
  onRestart,
  onLoopToggle,
  onUndo,
  onRedo,
  onTempoChange,
  onTimeSigChange,
  onGridChange,
  onPatchChange,
  className,
}: StudioBarProps) {
  return (
    <div className={cn('overflow-hidden rounded-xs border border-hairline bg-card', className)}>
      {/* transport strip */}
      <div className="flex items-center justify-between gap-2 border-b border-hairline bg-panel px-3 py-2">
        <div className="flex items-center gap-1.5">
          <IconButton
            aria-label={playing ? 'Pause' : 'Play'}
            variant={playing ? 'solid' : 'outline'}
            size="sm"
            onClick={onPlayToggle}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </IconButton>
          <IconButton aria-label="Restart" variant="ghost" size="sm" onClick={onRestart}>
            <RotateCcw size={15} />
          </IconButton>
          <IconButton
            aria-label="Loop"
            variant={loop ? 'solid' : 'ghost'}
            size="sm"
            onClick={onLoopToggle}
          >
            <Repeat size={15} />
          </IconButton>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton aria-label="Undo" variant="ghost" size="sm" onClick={onUndo}>
            <Undo2 size={15} />
          </IconButton>
          <IconButton aria-label="Redo" variant="ghost" size="sm" onClick={onRedo}>
            <Redo2 size={15} />
          </IconButton>
        </div>
      </div>
      {/* parameter ledger */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <LedgerCell label="Time">
          <Pick
            options={TIME_SIGNATURES}
            value={timeSig}
            onChange={(e) => onTimeSigChange?.(e.target.value)}
            aria-label="Time signature"
          />
        </LedgerCell>
        <LedgerCell label="Tempo">
          <input
            type="number"
            min={1}
            value={tempo}
            onChange={(e) => onTempoChange?.(Number(e.target.value))}
            className="focusable h-8 w-full rounded-xs border border-hairline bg-card px-2.5 text-xs font-medium tabular-nums text-foreground hover:border-foreground/60"
            aria-label="Tempo (BPM)"
          />
        </LedgerCell>
        <LedgerCell label="Grid">
          <Pick
            options={QUANTIZE_OPTIONS}
            value={grid}
            onChange={(e) => onGridChange?.(e.target.value)}
            aria-label="Grid"
          />
        </LedgerCell>
        <LedgerCell label="Patch">
          <Pick
            options={SYNTH_PATCHES}
            value={patch}
            onChange={(e) => onPatchChange?.(e.target.value)}
            aria-label="Patch"
          />
        </LedgerCell>
      </div>
    </div>
  )
}
