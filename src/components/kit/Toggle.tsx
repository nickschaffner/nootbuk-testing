import { type ReactNode } from 'react'
import { cn } from './cn'

// ─────────────────────────────────────────────────────────────────────────
// Toggle — a two-state switch styled as a hardware slider. Used for
// metronome, count-in, quantize, snap, loop. Controlled via `checked`.
// Optional label sits to the left (mono micro-label).
// ─────────────────────────────────────────────────────────────────────────

export interface ToggleProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
  className?: string
  id?: string
}

export function Toggle({ checked, onChange, label, disabled, className, id }: ToggleProps) {
  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'focusable relative inline-flex h-5 w-9 shrink-0 items-center rounded-xs border transition-colors disabled:opacity-40',
        checked ? 'border-primary bg-primary' : 'border-hairline bg-card',
      )}
    >
      <span
        className={cn(
          'block h-3.5 w-3.5 rounded-[1px] transition-transform',
          checked ? 'translate-x-4 bg-primary-foreground' : 'translate-x-0.5 bg-foreground',
        )}
      />
    </button>
  )

  if (!label) return <span className={className}>{control}</span>

  return (
    <label className={cn('inline-flex items-center gap-2', disabled && 'opacity-40', className)}>
      <span className="label-mono text-muted-foreground">{label}</span>
      {control}
    </label>
  )
}
