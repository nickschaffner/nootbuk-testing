import { cn } from './cn'
import { MonoLabel } from './Field'

// ─────────────────────────────────────────────────────────────────────────
// BeatLane — one horizontal bar of the mini piano-roll. A ledger grid of
// `beats` columns holds note blocks positioned by beat offset + width.
// Read-only / presentational: pass `blocks` with { start, width, label }.
// ─────────────────────────────────────────────────────────────────────────

export interface BeatBlock {
  start: number // beat offset from bar start (0-based)
  width: number // duration in beats
  label?: string
  active?: boolean
}

export interface BeatLaneProps {
  beats?: number
  blocks?: BeatBlock[]
  label?: string
  className?: string
}

export function BeatLane({ beats = 4, blocks = [], label, className }: BeatLaneProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label ? <MonoLabel>{label}</MonoLabel> : null}
      <div
        className="relative h-14 w-full overflow-hidden rounded-xs border border-hairline bg-background"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, var(--grid-line) 0, var(--grid-line) 1px, transparent 1px, transparent calc(100%/' +
            beats +
            '))',
        }}
      >
        {blocks.map((b, i) => (
          <div
            key={i}
            className={cn(
              'absolute top-1.5 bottom-1.5 flex items-center justify-center rounded-[1px] border px-1 text-[0.5625rem] font-bold uppercase tracking-wide',
              b.active
                ? 'noise border-primary bg-primary text-primary-foreground'
                : 'border-primary/40 bg-primary/20 text-foreground',
            )}
            style={{
              left: `calc(${(b.start / beats) * 100}% + 2px)`,
              width: `calc(${(b.width / beats) * 100}% - 4px)`,
            }}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  )
}
