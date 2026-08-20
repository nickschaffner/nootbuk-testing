import { type ReactNode } from 'react'
import { cn } from './cn'
import type { Option } from './options'

// ─────────────────────────────────────────────────────────────────────────
// SegmentedControl — mutually-exclusive choice in a single hairline frame.
// Controlled: pass `value`, `options`, and `onChange`. The active segment
// fills vermillion. Used for capture modes, record mode, key mode, etc.
// ─────────────────────────────────────────────────────────────────────────

export interface SegmentedControlProps<T extends string = string> {
  options: Option<T>[]
  value: T
  onChange?: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
  /** Fill the parent width, dividing evenly. */
  block?: boolean
  /** Drop the outer frame so a parent can own the border. Default look unchanged. */
  embedded?: boolean
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  block = false,
  embedded = false,
}: SegmentedControlProps<T>) {
  const pad = size === 'sm' ? 'h-7 px-2.5 text-[0.6875rem]' : 'h-8 px-3 text-xs'
  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex bg-card',
        embedded ? 'p-0' : 'rounded-xs border border-hairline p-0.5',
        block && 'flex w-full',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              'focusable font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
              embedded ? 'rounded-none' : 'rounded-xs',
              pad,
              block && 'flex-1',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label as ReactNode}
          </button>
        )
      })}
    </div>
  )
}
