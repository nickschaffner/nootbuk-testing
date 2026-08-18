import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// Chip / Pill — a selectable tag. Used for roles, section intents, chord
// types. `selected` fills vermillion. As a static badge, pass `as="span"`.
//   tone: default (neutral) · accent (vermillion outline when idle)
// ─────────────────────────────────────────────────────────────────────────

export type ChipTone = 'default' | 'accent'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  tone?: ChipTone
  children: ReactNode
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, tone = 'default', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn(
        'focusable inline-flex items-center gap-1.5 rounded-xs border px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-colors',
        selected
          ? 'noise border-primary bg-primary text-primary-foreground'
          : tone === 'accent'
            ? 'border-primary/50 bg-transparent text-primary hover:bg-primary/10'
            : 'border-hairline bg-card text-muted-foreground hover:border-foreground hover:text-foreground',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})

// A non-interactive status badge — same silhouette, no button semantics.
export interface BadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'outline'
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider',
        tone === 'accent' && 'noise bg-primary text-primary-foreground',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
        tone === 'outline' && 'border border-hairline text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

// Duration / playhead time — the outline badge used for mm:ss everywhere
// (todo cues, version length, song/album runtime).
export interface LengthProps {
  children: ReactNode
  className?: string
}

export function Length({ children, className }: LengthProps) {
  return (
    <Badge tone="outline" className={cn('tabular-nums', className)}>
      {children}
    </Badge>
  )
}
